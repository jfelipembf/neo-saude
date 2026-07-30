# Plataforma — plano de arquitetura

> **O código saiu deste repositório em 29/07/2026.** A Plataforma vira um projeto
> separado, apontando para o **mesmo banco Supabase**. Este documento continua
> aqui porque é a especificação dela — e porque o que ficou no banco só faz
> sentido lido junto com ele.
>
> **O que permanece no banco, pronto e testado:** as RPCs `platform_overview`,
> `platform_clients`, `platform_client`, `platform_plans`,
> `platform_observability` e `platform_audit`; a tabela `platform_job_position`;
> `private.is_platform_admin()`; e a coluna `profile.platform_admin` com a
> trigger `tg_guard_platform_admin` que só deixa o `service_role` escrevê-la.
> Todas são gated por `platform_admin` — com ninguém marcado, ficam inertes.
>
> **O que foi apagado:** só o front (`src/pages/Platform/`, guard, services,
> hooks, rotas) e os 5 componentes criados para ele — `MetricTile`, `DataPanel`,
> `PanelGrid`, `MiniBar`, `StatusDot`.
>
> ⚠️ **Esses arquivos NÃO estão no histórico do git** — nunca chegaram a ser
> commitados (`git log --diff-filter=A` volta vazio para eles). O projeto novo
> começa do zero no front, tendo este documento como especificação e as RPCs do
> banco como base pronta. As telas serão reescritas; o modelo, não.
>
> **O que NÃO era da plataforma e ficou:** `SafeHtml` (correção de XSS, 5 usos
> no app), `app_error` + `log_app_error` + a instrumentação no `ErrorBoundary` e
> no `QueryCache`, e o portão `security_audit()` / `npm run check:rls`.

A **Plataforma** é a área de quem *vende* o Neo Saúde, não de quem o usa. Ela
administra os tenants (clínicas) de fora: contrato, cobrança, suporte, saúde
técnica e a própria equipe da Neo Saúde.

Este documento define o modelo, as telas e a ordem de implementação. Toda
migration ou tela nova da Plataforma deve citar uma seção daqui — nunca inventar
um conceito paralelo.

---

## 1 · O erro que este plano existe para não repetir

O projeto `neo` (academia) resolveu o mesmo problema e **acertou o modelo**:
separou `job_position` (cargo) de `access_profile` (perfil de acesso), e chegou a
aplicar uma migration só para renomear `role` → `access_profile` e matar a
colisão de nomes com `role_group`.

O que apodreceu lá foi o **vocabulário e a divisão de telas**:

| Tela do `neo`           | O que ela realmente mexia     | Problema                          |
|-------------------------|-------------------------------|-----------------------------------|
| `Admin/Roles`           | `access_profile`              | Nome da tela ≠ nome da tabela     |
| `Admin/JobPositions`    | `job_position`                | Mesmo assunto, outra tela         |
| `Admin/AccessControl`   | nada — só embrulha as 2 acima | Terceira tela para o mesmo tema   |
| `Admin/Collaborators`   | a pessoa                      | Quarta tela do mesmo fluxo        |

Quatro telas para responder *"quem pode fazer o quê"*. O modelo estava certo; a
navegação é que obrigava o usuário a remontá-lo de cabeça.

**Aqui o problema já começou.** O comentário da tabela `access_profile` do
neoSaúde, no banco, diz:

> *"Cargo da clínica (Recepcionista, Especialista, Gerente…)"*

Ou seja: hoje `access_profile` é **cargo e perfil ao mesmo tempo**. É a fusão que
este plano desfaz — começando pela Plataforma, onde não há nada em produção para
quebrar.

### As sete regras anti-frankenstein

1. **Um conceito, um nome** — em código, em banco e na tela (§2).
2. **Uma pergunta, uma tela.** Se duas páginas respondem à mesma pergunta, elas
   são uma página com abas.
3. **Permissão mora ao lado da pessoa.** Cargos e perfis ficam dentro de
   *Equipe*, não numa área "Administrativo" separada — foi essa separação que
   gerou as quatro telas do `neo`.
4. **Nenhuma exceção por pessoa.** "Fulano precisa ver mais uma coisa" resolve-se
   criando um cargo, nunca um override individual (§3.3).
5. **Prefixo `platform_` em toda tabela da Plataforma.** Nunca reaproveitar
   tabela de tenant — o dia em que uma consulta esquecer o filtro, o vazamento é
   entre clientes.
6. **A tela nunca é a trava.** Quem recusa é a RPC/RLS; a UI só esconde o que já
   seria recusado.
7. **Sem página nova sem uma linha no glossário e uma `feature_key`.**

### O que se aproveita do `neo`

| Aproveitar | Não aproveitar |
|---|---|
| A **separação** cargo × perfil e a lição do rename | `Tenants/BranchProfile` — 20+ arquivos para uma tela de perfil |
| A ideia das abas do perfil do tenant (dados, financeiro, logs) | As 4 telas de acesso |
| O fluxo de chamado (lista → detalhe → thread) | `TicketStatusBadge` / `TicketPriorityBadge` — aqui já existe `Badge` + `STATUS_MAP`; portar duplicaria o componente |
| — | `Pipeline`, `Notifications`, `Webhooks` — fora do escopo pedido |

---

## 2 · Glossário (fonte única de nomes)

Regra do projeto: **código em inglês, produto em português.**

| Conceito | Tabela / tipo | UI (pt) | Nunca dizer |
|---|---|---|---|
| O tenant | `clinic` | **Cliente** | "empresa", "tenant", "filial" |
| Contrato do cliente | `subscription` | **Assinatura** | "plano" (isso é o catálogo) |
| Item do catálogo vendido | `plan` | **Plano** | "pacote" |
| Funcionalidade do produto | `feature` | **Funcionalidade** | "módulo", "permissão" |
| **Cargo** da equipe Neo | `platform_job_position` | **Cargo** | "role", "função" |
| **Perfil de acesso** | `platform_access_profile` | **Perfil de acesso** | "role", "grupo", "permissão" |
| Pessoa da equipe Neo | `platform_member` | **Equipe** | "colaborador", "staff", "admin" |
| Autorização temporária de leitura | `platform_access_grant` | **Acesso concedido** | "impersonação", "God mode" |

> `feature` (cliente) e `platform_feature` (equipe) são catálogos **distintos**.
> Fundi-los deixaria um plano comercial "vender" uma tela interna da Neo Saúde.

---

## 3 · O modelo de acesso da equipe

### 3.1 A corrente

```
platform_member  →  platform_job_position  →  platform_access_profile  →  permissões
   (a pessoa)            (o cargo)              (o perfil de acesso)      (por feature)
```

- **Cargo** é um fato sobre o *trabalho*: "Analista de Suporte", "Executivo
  Comercial", "Financeiro".
- **Perfil de acesso** é um fato sobre o *sistema*: o conjunto de funcionalidades
  que aquele trabalho exige.
- **O cargo recebe o perfil.** Um perfil serve vários cargos; um cargo tem
  exatamente um perfil.

**Por que o cargo no meio, e não pessoa → perfil direto?** Porque a decisão real
que se toma é *"suporte agora precisa ver Cobrança"* — e ela deve ser aplicada
uma vez, no perfil, e não doze vezes, uma por pessoa. Com o vínculo direto, cada
contratação vira uma decisão de segurança tomada às pressas por quem está
cadastrando alguém.

### 3.2 Um portão só (diferente da clínica)

O lado da clínica tem **dois** portões: o plano libera (`plan_feature`) **e** o
cargo permite (`access_profile_permission`). A Plataforma tem **um**: ninguém
vende plano para a Neo Saúde. Não replicar `plan_feature` aqui.

### 3.3 Sem override individual

Não existe "permissão extra para esta pessoa". Precisou de um recorte diferente
→ cria-se um cargo. Override por pessoa é invisível numa listagem de cargos, e
permissão que não aparece na tela onde se audita permissão é como vazamento
começa.

### 3.4 O que acontece com `profile.platform_admin`

A coluna **permanece**, com um papel mais estreito: *"esta conta pertence à
equipe da Neo Saúde"*. É a checagem barata que já está dentro de
`platform_overview()` e estará em toda RPC nova.

Ela deixa de ser escrita à mão e passa a ser **derivada** de `platform_member`
por trigger — hoje há duas fontes da verdade em potencial, e permissão com duas
fontes diverge. O `tg_guard_platform_admin` (que exige `service_role`) ganha uma
exceção para a própria trigger de sincronia, identificada por
`pg_trigger_depth() > 0`.

Granularidade (*qual* tela da plataforma) vem do perfil, nunca do booleano.

### 3.5 Tabelas

| Tabela | Papel |
|---|---|
| `platform_feature` | Catálogo das telas da Plataforma (`key`, `label`, `sort_order`) |
| `platform_access_profile` | Perfil de acesso (`name`, `description`, `is_system`, `status`) |
| `platform_access_profile_permission` | `(access_profile_id, feature_key, can_view, can_edit)` |
| `platform_job_position` | Cargo (`name`, `access_profile_id` **NOT NULL**) |
| `platform_member` | `(user_id, job_position_id, status, joined_at, invited_by)` |

Sem `clinic_id` em nenhuma delas — nada aqui pertence a um tenant.

**Perfis de sistema** (`is_system = true`, não renomeáveis nem apagáveis):
`Proprietário` (tudo), `Suporte`, `Comercial`, `Financeiro`, `Somente leitura`.
O `Proprietário` existe para garantir que nunca se chegue a zero pessoas com
acesso ao próprio Administrativo.

**FK de cargo para perfil é `ON DELETE RESTRICT`**: apagar um perfil com cargos
dentro obrigaria o banco a escolher outro em silêncio.

---

## 4 · Acesso ao dado do cliente (decisão: leitura sob demanda, com registro)

### 4.1 Por que não dá para fazer isso com RLS

`SELECT` **não dispara trigger** no Postgres. Se a leitura for liberada por
policy, a equipe consulta a tabela direto e nada é gravado — o "com registro"
seria só uma promessa na documentação.

**Portanto: a Plataforma não recebe policy nenhuma sobre tabelas de tenant.**
Nenhum `GRANT`, nenhum `or is_platform_staff()`. O dado do cliente sai por uma
porta só:

```
RPC platform_client_*  (SECURITY DEFINER)
  1. é equipe?                    → senão 42501
  2. o perfil permite a feature?  → senão 42501
  3. há grant ativo, no escopo?   → senão 42501
  4. GRAVA platform_access_log    ← antes de devolver
  5. devolve o dado
```

A porta única é o que torna o log inescapável. Se um dia alguém adicionar uma
policy de conveniência, o registro morre junto — está escrito aqui para que essa
mudança precise ser deliberada.

### 4.2 Escopos (o grant não é um cheque em branco)

| Escopo | Alcança | Autoriza |
|---|---|---|
| `cadastro` | clínica, equipe, plano, assinatura | Cargo com a permissão |
| `financeiro` | recebíveis, pagáveis, faturas do cliente | Cargo com a permissão |
| `agenda` | agendamentos (horário e situação, **sem** conteúdo clínico) | Cargo com a permissão |
| `clinico` | paciente e prontuário | **O dono da clínica**, no app dele |

O escopo `clinico` é o único que a Neo Saúde **não pode conceder a si mesma**.
Dado de saúde é dado sensível de terceiro (o paciente), e a clínica é a
controladora — quem autoriza é ela, com aceite registrado, não um motivo digitado
internamente.

### 4.3 Tabelas

| Tabela | Papel |
|---|---|
| `platform_access_grant` | `(clinic_id, member_id, scope, reason NOT NULL, ticket_id, granted_at, expires_at, revoked_at, revoked_by, approved_by_clinic_user)` |
| `platform_access_log` | Append-only: `(member_id, clinic_id, grant_id, rpc, args_resumo, at)` |

- `reason` é **NOT NULL** e mínimo de N caracteres: acesso sem motivo declarado é
  o mesmo que acesso sem registro.
- `expires_at` é **NOT NULL** — todo grant expira. Padrão sugerido: 24h.
- `platform_access_log` segue o mesmo desenho do `audit_log`: `authenticated` não
  tem `INSERT/UPDATE/DELETE`; só a função `SECURITY DEFINER` escreve.
- O cliente **vê** os acessos que a Neo Saúde teve aos dados dele. Trilha que só
  um lado enxerga não sustenta contestação.

---

## 5 · As telas

Oito entradas na barra. Cada item da lista pedida tem um lugar:

| # | Página | Rota | Responde |
|---|---|---|---|
| 1 | **Visão geral** | `/plataforma` | Como vai o negócio? *(feito)* |
| 2 | **Clientes** | `/plataforma/clientes` | Quem são, e como está cada um? |
| 3 | **Cobrança** | `/plataforma/cobranca` | Quem deve, e o que já foi tentado? |
| 4 | **Financeiro** | `/plataforma/financeiro` | Sobra quanto, depois dos custos? |
| 5 | **Suporte** | `/plataforma/suporte` | O que está aberto, e com quem? |
| 6 | **Equipe** | `/plataforma/equipe` | Quem somos, e quem pode o quê? |
| 7 | **Monitoramento** | `/plataforma/monitoramento` | Está de pé? Quem fez o quê? |
| 8 | **Administrativo** | `/plataforma/administrativo` | O que vendemos, e como o produto se comporta? |

### Onde moram cargos e perfis — decidido

**Em *Administrativo*, como abas.** Eu havia proposto pô-los em *Equipe*, ao lado
das pessoas; a decisão foi manter em *Administrativo*, junto do catálogo.
*Administrativo* fica com quatro abas: **Cargos · Planos · Funcionalidades ·
Configurações** (perfis de acesso entram como quinta aba quando existirem), e
*Equipe* trata só das pessoas.

O risco que isso carrega é o do `neo`, e vale escrito: quem cadastra uma pessoa
em *Equipe* precisa escolher o cargo, e o cargo é editado noutra tela. A regra
que segura isso é a **nº 2** — a lista de cargos existe em UM lugar só, e
*Equipe* apenas a consome num campo de seleção. No momento em que aparecer uma
segunda tela onde se cria cargo, o problema voltou.

**Auditoria virou aba de *Monitoramento*.** As duas respondem "o que está
acontecendo por dentro"; separá-las cria duas telas de log com filtros
parecidos — o começo do mesmo problema.

### Detalhe de cada página

**2 · Clientes** — lista (nome, plano, situação, profissionais em uso, MRR,
cliente desde) com busca e filtro por situação/plano. O clique abre o
**Perfil do cliente** (`/plataforma/clientes/:id`), em abas:
*Dados · Assinatura e faturas · Equipe · Uso · Chamados · Registros*.
Tudo agregado e cadastral; qualquer campo além disso exige grant (§4).
Uma página com abas, não vinte arquivos como o `BranchProfile` do `neo`.

**3 · Cobrança** — `subscription_invoice`: emitidas, pagas, vencidas, e a régua
de tentativas. Ações: reenviar fatura, registrar baixa manual, suspender.
*Cobrança é o que o cliente deve — não confundir com Financeiro.*

**4 · Financeiro** — o resultado da **plataforma**: receita reconhecida das
faturas pagas, menos os custos (Supabase, IA, WhatsApp, taxas do gateway),
com margem por cliente. Tabelas novas: `platform_expense`,
`platform_expense_category`. *Financeiro é o que sobra — não confundir com
Cobrança.*

**5 · Suporte** — `support_ticket` + `support_ticket_message`, com fila, filtros
e responsável. É daqui que se **solicita um acesso** (§4): o chamado é o motivo,
e `platform_access_grant.ticket_id` amarra os dois.

**6 · Equipe** — abas *Pessoas · Cargos · Perfis de acesso*. A matriz de
permissões (funcionalidade × ver/editar) vive na aba de perfis, com o mesmo
desenho da matriz que a clínica já usa.

**7 · Monitoramento** *(implementado)* — abas *Saúde · Erros · Auditoria*.

- **Saúde**: integrações de terceiro (`whatsapp_connection`, com `last_error`) e
  **custo de IA por cliente** (`cibelly_usage.cost_usd`). O custo mora aqui, e não
  no Financeiro, porque um cliente que multiplica o consumo numa semana é
  incidente — laço de repetição, integração em loop — mais vezes do que é boa
  notícia comercial.
- **Erros**: série diária, erros mais frequentes, **erros por cliente** e últimas
  ocorrências. A coluna "Clientes" do top é a que muda a conduta: 1 cliente
  aponta dado ruim daquele tenant, vários apontam regressão nossa.
- **Auditoria**: `audit_log` (6.394 linhas) em **metadado** — quem, quando, qual
  cliente, qual tabela, qual ação e os NOMES dos campos alterados.
  `old_data`/`new_data` não saem: "alterou o campo `amount`" responde à pergunta
  da plataforma; "alterou de R$ 300 para R$ 0" seria abrir o financeiro do
  cliente para quem só precisava saber que houve alteração. O valor exige grant.

*Acessos ao cliente* entra como quarta aba junto com a fase 4.

### O que a fase 8 instrumentou

Não existia log de erro de aplicação — das 99 tabelas, a única com cara de log era
`audit_log`, que registra alterações de dados e não falhas. Foram criados:

- `app_error` — **append-only** no mesmo desenho do `audit_log`: `authenticated`
  não tem INSERT/UPDATE/DELETE. Só `log_app_error()` escreve.
- `private.mask_ids()` — troca uuid por `:id` e números de 6+ dígitos por `:num`
  **antes de gravar**. Duas razões, e as duas importam: sem a máscara o mesmo erro
  em 40 pacientes viraria 40 linhas distintas no "top erros"; e a rota
  `/pacientes/<uuid>` levaria id de paciente para um log que a plataforma inteira
  lê. A máscara é feita no BANCO, não no front — o navegador pode chamar a RPC
  com o que quiser, então a garantia tem de morar do lado que não se burla.
- `registrarErro()` ligado ao `ErrorBoundary` **e** ao `QueryCache`/`MutationCache`.
  O boundary só pega erro de render; falha de service — a maioria — chega pelo
  segundo caminho.

### O que ainda falta em Monitoramento

- **Latência p95, taxa de 5xx e uptime.** Os logs de API do Supabase só saem pela
  Management API, com chave de serviço, que não pode ir para o front (o Vite
  empacota `VITE_*`). Precisa de uma Edge Function fazendo a ponte.
- **Adoção de funcionalidade e usuários ativos.** Não há telemetria de uso — nem
  page view nem rota acessada.

**8 · Administrativo** — abas *Planos · Funcionalidades · Configurações*. É o
catálogo comercial (`plan`, `plan_feature`, `feature`) mais os parâmetros do
produto. Editar um plano aqui muda o que **novos** clientes recebem; quem já
assinou mantém `subscription.amount` — o preço contratado não é o de tabela.

---

## 6 · Ordem de implementação

**Fase 1 · Fundação** *(em curso nesta sessão)*
`platformService` · `usePlatform` · `PlatformGuard` · rotas · login direto para
quem não tem clínica. Encerra com `contato@gestaoneo.com` entrando e caindo em
`/plataforma`.

**Fase 2 · Cargos e perfis de acesso** — as 5 tabelas do §3.5, os perfis de
sistema, a sincronia de `platform_admin` e a página **Equipe**.
*Vem antes de tudo por um motivo:* sem ela, as seis páginas seguintes nascem com
"todo mundo da equipe vê tudo" embutido, e retroencaixar permissão em tela pronta
é como se acumulam as exceções que ninguém mais entende.

**Fase 3 · Clientes + Perfil do cliente** — RPCs `platform_clients` e
`platform_client_overview`, só com dado agregado e cadastral.

**Fase 4 · Acesso sob demanda** — `platform_access_grant`,
`platform_access_log`, as RPCs com as 5 etapas do §4.1, e a tela do cliente
mostrando os acessos recebidos.

**Fase 5 · Cobrança** · **Fase 6 · Financeiro** · **Fase 7 · Suporte** —
independentes entre si a partir daqui; a ordem segue a urgência comercial.

**Fase 8 · Monitoramento e Auditoria.**

**Fase 9 · Administrativo** (planos, funcionalidades, configurações).

**Fase 10 · Portar cargo × perfil para a clínica** — separar `access_profile`
(que hoje é cargo *e* perfil) em `job_position` + `access_profile`, com a lição
do rename do `neo`: recriar as funções dependentes a partir do próprio fonte,
mantendo assinaturas idênticas para não quebrar policies. Só depois que o
desenho tiver provado na Plataforma, e com as 7 clínicas em uso.

---

## 7 · Estrutura de pastas

```
src/pages/Platform/
├── PlatformLayout.tsx              # casco + tema roxo (feito)
├── shared/platform.module.scss     # .tema sobrescreve --primary (feito)
├── Overview/                       # 1 · Visão geral (feito)
├── Clients/
│   ├── PlatformClientsPage.tsx     # 2 · lista
│   └── Profile/                    # perfil do cliente, uma pasta, abas dentro
├── Billing/                        # 3 · Cobrança
├── Finance/                        # 4 · Financeiro
├── Support/                        # 5 · Suporte
├── Team/                           # 6 · Equipe (Pessoas · Cargos · Perfis)
├── Monitoring/                     # 7 · Monitoramento (Saúde · Auditoria · Acessos)
└── Admin/                          # 8 · Administrativo (Planos · Funcionalidades · Config)
```

Camadas iguais às do app: `página → hook → service → supabase`. Nenhuma página da
Plataforma importa `supabase` direto, e **nenhum service da Plataforma chama
`getCurrentClinicId()`** — não há clínica corrente aqui.

O tema roxo já funciona por sobrescrita de variável CSS (`.tema` redefine
`--primary`), então `Button`, `Table`, `StatsCard` e `Badge` se recolorem sozinhos
— nenhuma variante nova em componente nenhum.
