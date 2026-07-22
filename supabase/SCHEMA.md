# Neo Saúde — schema Supabase/PostgreSQL 17

Banco alvo: projeto **neosaude** (`cchbamuhjvxxayokklux`, sa-east-1), hoje vazio.
**Nada foi aplicado.** Este diretório contém só arquivos `.sql`.

Fonte da verdade do domínio: `src/types/domain.ts` (~45 interfaces).
Convenções do projeto: `.claude/skills/estrutura-pastas/SKILL.md`.

---

## 1 · Ordem de aplicação

**Os prefixos numéricos SÃO a ordem de execução.** Rodar em ordem alfabética
funciona — foi essa a principal correção da consolidação.

| # | arquivo | o que cria | depende de |
|---|---|---|---|
| 01 | `01-fundacao.sql` | tenant, acesso, entitlement, código humano, auditoria | `auth.users` |
| 02 | `02-cadastros.sql` | `insurance`, `material` | 01 |
| 03 | `03-pacientes.sql` | paciente, documentos, anamnese (questionário + ficha) | 01, 02 |
| 04 | `04-profissionais.sql` | profissional, currículo, comissão, views `role` e `professional_directory` | 01 |
| 05 | `05-agenda.sql` | sala, grade semanal, consulta, evolução | 01, 02, 03, 04 |
| 06 | `06-clinico.sql` | tratamento, sessão, odontograma, prescrição | 01, 02, 03, 04 |
| 07 | `07-comercial.sql` | lead, orçamento, itens do orçamento | 01, 02, 03, 04 |
| 08 | `08-financeiro.sql` | contas, títulos, pagamentos, caixa, cobrança | 01, 03, 04, 07 |
| 09 | `09-saas.sql` | assinatura, faturas da plataforma, WhatsApp, tarefas | 01, 04, 08 |
| 10 | `10-hardening.sql` | revoga TRUNCATE e o acesso de `anon` em bloco | todas |
| 99 | `99-seed.sql` | catálogo + clínica de demonstração + cargos | todas |

`10-hardening.sql` e `99-seed.sql` são **novos**, criados na consolidação.

### O que mudou em relação às fatias entregues

Nenhuma das oito fatias originais aplicava na ordem numérica. Havia **duas
arestas apontando para trás e um ciclo**:

```
03-pacientes  ──patient.insurance_id──▶  insurance  (nascia na fatia 60, a última)
05-agenda     ──material_id───────────▶  material   (idem)
06-clinico    ──material_id───────────▶  material   (idem)
60-comercial  ──quote.patient_id──────▶  patient    (fatia 10)   ← o ciclo
08-financeiro ──receivable.quote_id───▶  quote      (fatia 60)
```

Três correções, todas mecânicas:

1. **`60-comercial.sql` foi partido em dois.** `insurance` e `material` são
   cadastro do Administrativo — dependem só de `clinic` e são consumidos por
   fatias anteriores. Foram para `02-cadastros.sql`. O que sobrou (lead, quote,
   quote_item) virou `07-comercial.sql` e roda **antes** do financeiro. Nenhuma
   definição foi alterada, só movida.
2. **O ciclo `patient ⇄ insurance` continua quebrado onde já estava:** a coluna
   `patient.insurance_id` nasce sem FK e a constraint entra por `ALTER TABLE` na
   seção 11 de `03-pacientes.sql`. Com `insurance` já criada em 02, aquele ALTER
   agora roda no lugar onde está — não precisa ser movido.
3. **Renumeração** de todos os arquivos, com as referências internas reescritas.

---

## 2 · O mapa das relações

### 2.1 · Fundação — o que sustenta a RLS

```
                            plan ──1:N── plan_feature ──N:1── feature
                             │                                   │
                             │ plan_key                          │ feature_key
                             ▼                                   │
auth.users ─1:1─ profile   clinic  ─1:N─  access_profile ─1:N─ access_profile_permission
                    │        │  ▲              ▲
                    │        │  │              │ (access_profile_id, clinic_id)
                    └─1:N────┴──┴── clinic_user ┘
                                     │
                                     └─▶ private.auth_clinic_ids()  ← toda policy

                    clinic ─1:N─ counter      (sequência do código humano, interna)
                    clinic ─1:N─ audit_log    (append-only, escrito só por trigger)
```

**Os dois portões.** Ver uma tela exige as DUAS coisas, ligadas pela mesma
`feature_key`: o **plano** libera (`plan_feature`) **e** o **cargo** permite
(`access_profile_permission`). `private.can_access_feature()` faz o join dos dois
lados; o front não precisa saber a diferença.

### 2.2 · O domínio

```
                                   ┌──────────── clinic (O TENANT) ────────────┐
                                   │  toda tabela abaixo tem clinic_id NOT NULL │
                                   └────────────────────────────────────────────┘

insurance ──┐                                                    material ──┬──▶ appointment_history_material
            │ (NO ACTION)                                                   └──▶ treatment_session_material
            ▼
         patient ──┬──▶ patient_document
                   ├──▶ anamnesis ──1:N──▶ anamnesis_answer ──▶ anamnesis_question_option
                   │        │                     │                      ▲
                   │        └── template_id ──┐   └── question_id ───────┤
                   │                          ▼                          │
                   │        anamnesis_template ─▶ anamnesis_section ─▶ anamnesis_question
                   │
                   ├──▶ schedule_slot ──(materializa)──▶ appointment ──▶ appointment_history
                   │         ▲                              ▲   ▲              │
                   │         └──── room ───────────────────┘   │              └──▶ appointment_history_material
                   │                                            │
                   ├──▶ treatment ──┬──▶ treatment_tooth        │
                   │                └──▶ treatment_session ──┬──▶ treatment_session_action
                   │                          ▲              ├──▶ treatment_session_material
                   │                          │              ├──▶ treatment_session_tooth
                   │                          │              └──▶ treatment_session_odontogram
                   ├──▶ prescription ──▶ prescription_medication
                   │
                   ├──◀── lead (patient_id, na conversão)
                   │
                   ├──▶ quote ──1:N──▶ quote_item ──▶ insurance
                   │       │                      └──▶ professional
                   │       └──(aprovação)──▶ receivable  ← 08-financeiro
                   │
                   ├──▶ receivable ──▶ bank_account, acquirer
                   ├──▶ payment ──1:N──▶ payment_entry ──▶ acquirer, bank_account
                   │       └──1:N──▶ billed_treatment ──▶ professional
                   └──▶ collection_attempt

professional ──┬──▶ professional_education
               ├──▶ professional_experience
               ├──▶ professional_commission (1:1)
               └──◀── clinic_user (user_id, FK composta: o login é da mesma clínica)

payable ──▶ bank_account          cash_session ──1:N──▶ cash_movement
acquirer ──1:N──▶ acquirer_installment_rate

clinic ──1:1──▶ subscription        clinic ──1:N──▶ subscription_invoice
clinic ──1:1──▶ whatsapp_connection clinic ──1:N──▶ whatsapp_automation
clinic ──1:N──▶ task
```

Uma seta do desenho é 1:N e vale destacar: **`patient ──▶ anamnesis`**. O paciente
tem UMA ficha `status='active'` (índice único parcial) e quantas `archived` o
prontuário exigir — a revisão do retorno não sobrescreve a ficha da época, e a
antiga continua legível pelas respostas congeladas em `anamnesis_answer`.

**Views** (todas somente leitura — `revoke all` + `grant select`):

| view | arquivo | modo | o que é |
|---|---|---|---|
| `role` | 04 | `security_invoker` | `domain.ts Role` reconstruído a partir de `access_profile` + permissões |
| `professional_directory` | 04 | **`security_definer` + `security_barrier`** | as 6 colunas não-sensíveis de `professional` (id, clinic_id, name, color, specialty, status) para quem **não** tem a feature `professionals` |
| `cash_flow_day` | 08 | `security_invoker` | fluxo de caixa consolidado por dia |
| `bank_account_balance` | 08 | `security_invoker` | saldo por conta |

Três das quatro são `security_invoker = true` e herdam a RLS de quem consulta.
`professional_directory` é a exceção **deliberada**: ela existe justamente para
entregar nome e cor a quem a RLS de `professional` agora barra, então contorna
a RLS da base e assume as obrigações que eram dela — filtra `clinic_id =
any(private.auth_clinic_ids())` no próprio corpo, projeta uma lista fechada de
colunas sem PII, e usa `security_barrier = true` para que nenhum predicado do
usuário seja avaliado antes do filtro de tenant. O linter do Supabase acusa
`security_definer_view` nela; é achado esperado, com o raciocínio inteiro
escrito na seção 8.2 de `04-profissionais.sql`.

### 2.3 · Números

| | |
|---|---|
| tabelas | **57** |
| views | 4 |
| enums | 28 |
| domínios | 9 |
| funções | 52 definições (39 em `private`, 13 RPC em `public`) |
| tabelas com RLS | **57 de 57** |
| tabelas sem policy | **0** |
| tabelas do domínio sem `clinic_id` | **0** |

As cinco tabelas sem `clinic_id` não são do domínio e cada uma tem motivo:
`clinic` (é o próprio tenant — a coluna é `id`), `feature` / `plan` /
`plan_feature` (catálogo global da plataforma, leitura para todos, escrita só
`service_role`) e `profile` (espelho de `auth.users`, um usuário pode pertencer
a mais de uma clínica).

---

## 3 · Decisões de modelagem que valem para o conjunto

**Tenant de um nível só.** `clinic` **é** o tenant. Não existe empresa/filial.
Toda tabela do domínio carrega `clinic_id` mesmo quando daria para chegar nela
por join — a policy fica direta e barata, e um join a menos é um vazamento a
menos.

**A forma da policy nunca varia:**
```sql
using (clinic_id = any(private.auth_clinic_ids()))
```
Nunca comparação com escalar. A função é a costura que permite evoluir (usuário
em duas clínicas, impersonation de suporte) sem reescrever 200 policies. Ela
devolve `'{}'` e nunca `NULL` — policy com `NULL` é a porta que ninguém percebe
aberta.

**RLS decide QUAIS LINHAS; GRANT decide QUAIS COLUNAS.** As duas são
necessárias. Sem o GRANT por coluna, um administrador de clínica com UPDATE
legítimo na própria linha faria `update clinic set plan_key='enterprise'` e a
policy diria sim, porque a linha é dele. É esse mecanismo que também protege
`patient.last_visit`, `quote.items_total`, `anamnesis_answer.question_text` e
todo carimbo de servidor.

**Toda FK cruzada é COMPOSTA `(id, clinic_id)`.** A checagem de FK roda por
dentro do servidor e **não passa por RLS**: uma FK simples aceitaria o uuid de
outro tenant e a policy da tabela filha não perceberia. Doze tabelas expõem
`unique (id, clinic_id)` só para servir de alvo. Depois da consolidação **não
sobrou nenhuma FK simples** entre tabelas do domínio.

**`NO ACTION`, não `RESTRICT`.** Os dois recusam o DELETE direto com o mesmo
erro; a diferença é que RESTRICT confere **na hora** e NO ACTION no fim da
instrução. `delete from clinic` cascateia para o pai e para o filho na MESMA
instrução, em ordem indefinida — com RESTRICT, apagar uma clínica falha ou não
conforme o plano de execução do dia. Restam sete RESTRICT, todos contra catálogo
(`feature`, `plan`) ou deliberados (`subscription_invoice.clinic_id`, § 5.6).

**`SET NULL` com lista de colunas** (PostgreSQL 15+) em toda FK composta
opcional: `on delete set null (material_id)`. Sem a lista, o SET NULL zeraria
também `clinic_id`, que é NOT NULL, e o DELETE do pai estouraria.

**Nada de dinheiro nem de prontuário se apaga.** Financeiro não tem policy de
DELETE: conta errada vira `status='canceled'`, baixa errada é estorno. `patient`
não tem policy nem GRANT de DELETE: sai de circulação com `status='inactive'`.
A ficha de anamnese revisada no retorno não sobrescreve a anterior: a antiga vai
para `status='archived'` e fica **imutável** (sem escrita, sem DELETE pelo app).
Exclusão de verdade (LGPD) é ato do servidor com `service_role`.

**Código humano (`PAC-000042`) por `counter` + `private.next_code()`**, com
`INSERT … ON CONFLICT DO UPDATE` — incremento atômico sob lock de linha. Nunca
`max()+1` na aplicação: três atendentes na recepção geram o mesmo número. Os
prefixos são fonte única no cabeçalho de `01-fundacao.sql`.

**Congelamento em texto onde o registro é documento.** `audit_log.actor_name`,
`anamnesis_answer.question_text` / `answer_label`,
`appointment_history_material.name`, `treatment_session_material.name`,
`subscription_invoice.plan_key`. Referência é sempre por id — mas o texto é o
ponto: o documento precisa continuar legível depois que o cadastro mudar.

**Anamnese é pergunta/resposta, não 30 colunas.** É a decisão mais pesada do
conjunto e está justificada em detalhe no cabeçalho de `03-pacientes.sql`. Em
resumo: o questionário muda por especialidade e por clínica, e pergunta nova não
pode ser migration. O que se perderia em garantia foi devolvido por FK composta
`(option_id, question_id)` — o banco recusa uma resposta que não pertença àquela
pergunta —, por congelamento em texto e por um índice que responde "quais
pacientes são alérgicos" tão bem quanto uma coluna dedicada — com uma ressalva
que veio junto com o histórico da ficha: essa consulta agora precisa juntar com
`anamnesis` e filtrar `status='active'`, senão a resposta arquivada de três anos
atrás entra como se fosse a declaração de hoje.

**`Role` não virou tabela.** O conceito já existe na fundação, melhor resolvido:
`pages: AppPage[]` só sabe dizer "vê", e "a recepcionista abre o Financeiro mas
não dá baixa" é requisito. A view `public.role` (04) mantém a assinatura de
`rolesService.listRoles()` — **mas só para leitura** (§ 5.5).

**Tipos de verdade.** `date`/`time`/`timestamptz` (o `'dd/mm/aaaa'` do
`domain.ts` é máscara de tela), `numeric(12,2)` para dinheiro, e CPF/CNPJ/CEP/
telefone **só dígitos** via domínio — máscara é apresentação, e sem isso busca,
unicidade e integração (WhatsApp, boleto, NF) ficam impossíveis.

**Enums com os valores do `domain.ts`, sem tradução.** 28 enums, nenhum
duplicado, nenhum com valores divergentes entre arquivos. Os que atravessam
fatia nascem em `01-fundacao.sql`; `payment_status` nasce em 08 e é reaproveitado
por `subscription_invoice` em 09, como o próprio `domain.ts` manda.

---

## 4 · RPCs

| função | arquivo | para quê |
|---|---|---|
| `my_session(clinic)` | 01 | abertura do app: usuário, clínica, cargo, plano e o mapa `feature→{view,edit}` numa ida só |
| `next_code(clinic,key,prefix)` | 01 | pré-visualizar um código antes de salvar |
| `patient_anamnesis(patient)` | 03 | questionário + respostas da ficha **ativa**, em um jsonb (+ `archived_count`) |
| `patient_anamnesis_history(patient)` | 03 | **todas** as fichas do paciente (ativa + arquivadas), com as respostas congeladas de cada uma |
| `save_anamnesis(patient,payload)` | 03 | grava a ficha **ativa** inteira em uma transação (não versiona) |
| `archive_anamnesis(patient)` | 03 | fecha a ficha ativa; a próxima gravação abre uma nova (a anamnese do retorno) |
| `link_professional_user(...)` | 04 | liga login ↔ profissional |
| `professionals_in_use(clinic)` | 04 | vagas ocupadas do plano |
| `professional_conflicts(prof,starts,ends[,ignore])` | 05 | **aviso** de agenda dupla na consulta do dia — devolve os atendimentos sobrepostos para a UI perguntar "confirmar mesmo assim?" |
| `professional_slot_conflicts(prof,weekday,start,end[,ignore])` | 05 | o mesmo aviso para a grade semanal (`schedule_slot`) |
| `patient_treatments(patient)` | 06 | tratamentos + sessões + dentes + materiais |
| `record_treatment_session(...)` | 06 | um procedimento inteiro (sessão + etapas + insumos + odontograma + status) atomicamente |
| `my_subscription(clinic)` | 09 | a aba Assinatura em uma chamada |

---

## 5 · PENDÊNCIAS QUE PRECISAM DA DECISÃO DO DONO

Ordenadas por custo de descobrir tarde.

### 5.1 · Bloqueiam ir para produção com cliente real

**(a) Prontuário usa a `feature_key` `'patients'`.** A evolução clínica
(`06-clinico.sql`) responde à mesma chave da tela onde mora. Se a recepcionista
puder agendar mas **não** puder ler evolução clínica, é preciso uma feature
própria `clinical_record` no catálogo da fundação. A forma da policy não muda —
só a string. Mas a decisão tem de sair **antes** de existir dado real, porque
depois vira migração de permissão em produção.

**(b) `billed_treatment` expõe o faturamento de toda a clínica.** A policy de
SELECT aceita a feature `professionals`, e a tabela tem o valor cobrado por
procedimento de todo mundo. Um profissional com acesso ao módulo Profissionais vê
a produção dos colegas. Se a intenção era "cada um vê só a própria", a policy
precisa de um predicado por `professional_id` — o que exige decidir como
`profile` se liga a `professional` na leitura (a ligação já existe:
`professional.user_id`).

**(c) PII da equipe — ~~pendente~~ DECIDIDO E IMPLEMENTADO.** Era: qualquer
membro da clínica lia data de nascimento, endereço, e-mail e telefone pessoal dos
colegas, porque `professional_select` só checava o tenant (a agenda precisava de
nome e cor). O dono escolheu **restringir**, pela terceira saída da lista — view
enxuta pública + tabela completa restrita:

- `professional_select` agora exige `private.can_access_feature(clinic_id,
  'professionals')` **ou** ser o próprio (`user_id = auth.uid()`);
- `professional_education_select` e `professional_experience_select`
  acompanharam, pela mesma regra (currículo só é desenhado dentro do perfil, e
  ano de formatura reconstrói a idade que `birth_date` parou de contar);
- a agenda passou a ler `public.professional_directory` (ver 2.2);
- `professional_commission_select` trocou o `exists` cru sobre `professional`
  por `private.is_own_professional()` (SECURITY DEFINER), para que "ver a
  própria comissão" não passe a depender de quem pode ler o cadastro;
- **o `tr_audit` de `professional` passou a redigir as onze colunas pessoais**
  (`sex, birth_date, email, phone, whatsapp, cep, state, city, neighborhood,
  street, number`). `tg_audit` grava a linha inteira em `audit_log.old_data` /
  `new_data`, e `audit_log_select` pede a feature **`admin`**, não
  `professionals` — sem a redação, `GET /audit_log?table_name=eq.professional`
  devolvia a PII inteira, com histórico, para exatamente o cargo que a policy
  nova diz que não a lê. Custo aceito: como `tg_audit` calcula `changed_fields`
  depois de redigir, um UPDATE que mexe **só** em coluna redigida não gera linha
  de log (status, `user_id`, CRO e nome continuam auditados).

O que **não** foi feito, e continua valendo como opção: separar os dados
pessoais em `professional_personal_data`. Só faria diferença se aparecesse um
terceiro nível de acesso (ex.: RH vê endereço, Administrativo não) — hoje são
dois, e dois níveis cabem em uma policy.

**Falta no front:** toda leitura de nome/cor/especialidade tem de apontar para
`professional_directory`. Uma consulta a `professional` feita por quem não tem a
feature volta vazia **sem erro** — é o modo de falha silencioso desta mudança.

**(d) Sem `whatsapp_message_log` não há idempotência.** O motor de envio roda com
`service_role`, e um restart no meio da varredura das 08:00 manda o lembrete duas
vezes para o mesmo paciente. A forma está descrita no rodapé de `09-saas.sql`,
com `unique (automation_id, patient_id, scheduled_for)`. É a primeira coisa que
vai faltar.

**(e) Downgrade que tira o add-on `whatsapp` não desliga o motor.** As automações
somem da tela (a RLS exige a feature), mas o motor roda com `service_role` e
ignora RLS — continuaria disparando mensagem de uma clínica que não paga mais.
Ou o motor confere `plan_feature` na query, ou o downgrade marca as automações
como `inactive`. Hoje ninguém é dono desse portão.

**(f) `save_anamnesis(patient, '{}')` apaga a ficha inteira.** A varredura final
remove tudo que não veio no payload; com payload vazio, isso é tudo. É o
comportamento certo para "o formulário envia a ficha inteira", mas um bug de
front zera um prontuário sem erro nenhum. Rejeitar payload vazio explicitamente é
uma linha.

### 5.2 · Rotinas e infraestrutura que o schema não cobre

**(g) `pending → overdue` depende de `pg_cron`.** Ninguém fica vencido sozinho.
Enquanto a rotina diária não existir, `status` fica atrasado no banco, o front
continua derivando na tela, e os índices parciais `where status = 'overdue'`
servem menos linhas do que deveriam — a aba Inadimplência mostra menos gente do
que existe. Vale para `payable`, `receivable` e `subscription_invoice`. Habilitar
`pg_cron` é decisão de infraestrutura.

**(h) `clinic` não tem coluna de fuso horário.** `cash_flow_day` fixa
`'America/Sao_Paulo'`, e `whatsapp_automation.send_time` é um `time` sem fuso.
Para clínica em Manaus ou Rio Branco o corte do dia sai 1–2 h errado, e é sempre
o movimento do fim da tarde que troca de dia — o fechamento de caixa nunca bate.
`quote.issue_date` tem o mesmo problema pelo outro lado: `current_date` resolve
em UTC no Supabase, então orçamento salvo depois das 21h em Sergipe nasce com a
data de amanhã. A correção é uma coluna
`clinic.timezone text not null default 'America/Sao_Paulo'` na fundação, e ela
toca 08 e 09.

**(i) Onboarding não existe como RPC.** A primeira `clinic` e o primeiro
`clinic_user` precisam nascer com `service_role` — `auth_clinic_ids()` depende de
um `clinic_user` que ainda não existe. `99-seed.sql` faz isso à mão para a
clínica de demonstração. A RPC de verdade tem de, em uma transação: criar a
clinic, criar os `access_profile` padrão com as permissões, chamar
`private.seed_anamnesis_template()` e criar o `clinic_user` do fundador como
`active`. Sem `seed_anamnesis_template`, a primeira anamnese é recusada.

### 5.3 · Buracos de regra de negócio

**(j) Linhas de orçamento aprovado são editáveis.** `quote` recusa DELETE quando
`status='approved'`, mas `quote_item` não tem trava: quem tem edição em
`patients` insere/edita/apaga linhas de um orçamento já aprovado, a trigger
recalcula `items_total`/`total`, e o valor do documento que gerou as parcelas
muda **depois** da assinatura. Não foi travado de propósito — o editor cria o
orçamento já como `approved` e só então grava as linhas
(`BudgetsPanel.tsx:381/571`), e uma trava de INSERT quebraria o fluxo principal.
A correção é a RPC `approve_quote`: aprovar vira o **último** passo. Junto vem a
reabertura (`approved → pending` passa pela API e deixa o orçamento "pendente"
com parcelas emitidas).

**(k) `payment` e `receivable` não se falam.** O app tem as duas visões separadas
e o `domain.ts` não as liga. Dar baixa no recibo do paciente não abate o título a
receber, e as duas telas divergem. O caminho é
`payment_allocation (payment_id, receivable_id, amount)` — N:N, porque um
pagamento quita três parcelas e uma parcela é paga em dois atos. FK simples em
qualquer direção seria errada.

**(l) Limite de vagas do plano não bloqueia nada.** A trigger `tr_seat_limit`
existe em `04-profissionais.sql` e `my_subscription()` mostra os dois números
lado a lado — mas barrar o cadastro do 11º profissional e cobrar excedente são
produtos diferentes, e a decisão não existe.

**(m) DECIDIDA — overbooking do profissional está liberado; sala continua
travada.** Eram quatro constraints EXCLUDE em `05-agenda.sql`; sobraram as duas
de sala (`appointment_room_overlap_ex`, `schedule_slot_room_overlap_ex`).
Consultório com duas cadeiras faz agenda sobreposta de propósito, e o banco não
distingue o encaixe proposital do choque acidental. No lugar da trava entraram
dois avisos não-bloqueantes — `professional_conflicts()` e
`professional_slot_conflicts()` — que a UI chama antes de salvar.

Três consequências que vêm junto e não podem ser esquecidas:

1. **A corrida entre duas recepcionistas deixou de ser barrável.** A constraint
   era o único ponto que via as duas linhas; as RPCs leem o *committed* e não
   seguram nada até o INSERT. Aviso não é trava. Se um dia a regra virar
   "overbooking até N", isso volta como trigger contando linhas (SERIALIZABLE ou
   advisory lock por profissional+dia), não como EXCLUDE.
2. **A idempotência da materialização agora depende só de
   `appointment_slot_date_uk`** — antes a trava a reforçava por acidente. É o que
   separa "encaixe proposital" de "o cron rodou duas vezes".
3. **`room` virou unidade de ocupação, não parede.** Duas cadeiras que atendem em
   paralelo precisam ser duas linhas em `room`; cadastradas como uma sala só, a
   trava de sala barra justamente o overbooking que a decisão liberou.

`btree_gist` continua obrigatória: as travas de sala misturam `uuid`/`smallint`
com `tsrange` no mesmo índice GiST.

**(n) DELETE de prontuário: duas fatias decidiram diferente.**
`appointment_history` e `appointment_history_material` (05) têm policy de DELETE;
`patient` (03) não tem nem policy nem GRANT. Evolução clínica tem prazo de guarda
legal. Hoje o apagamento fica no `audit_log` com o `old_data` completo — é
rastreável, mas não é irreversível.

**(o) `no_show` bloqueia rematerializar o dia.** `appointment_slot_date_uk`
exclui `canceled` do índice (para permitir desmarcar e reagendar no mesmo dia)
mas não exclui `no_show`. Consequência: uma falta em D impede recriar D. É regra
de operação da recepção, não de banco.

### 5.4 · Divergências declaradas com o `domain.ts`

| ponto | banco | `domain.ts` | quem cede? |
|---|---|---|---|
| `cash_session.operator_name` | NOT NULL | `operator?: string` | turno sem operador não fecha — mas o service vai bater nisso |
| `professional_education.year` | nulável | obrigatório | o formulário permite salvar formação em curso? |
| `patient.street`, `professional.street` | existem | não existem (só em `Address`) | ou os dois entram no `domain.ts`, ou os dois saem do banco |
| `quote_item.unit_price` | `>= 0` | editor exige `> 0` | banco frouxo permite linha de cortesia; se "todo item vale mais que zero" for regra, troco |
| `multiplyPerTooth` sem dentes | CHECK rejeita (23514) | o editor **produz** esse estado (`BudgetsPanel.tsx:472-474`) | a CHECK está certa; o conserto é de UI |
| `lead.patient_id`, `lead.notes` | existem | não existem | sem `patient_id`, lead `converted` é beco sem saída |

### 5.5 · Faltas conhecidas de caminho de escrita

**(p) A aba Cargos não tem como salvar.** `public.role` é **somente leitura**.
Hoje o front teria de escrever direto em `access_profile` +
`access_profile_permission` — duas tabelas, dois switches por página. Falta uma
RPC `save_role(id, name, pages[])`.

**(q) Baixa de estoque não existe.** `treatment_session_material` e
`appointment_history_material` registram o consumo, mas ninguém desconta
`material.in_stock`. Quando entrar, tem de ser RPC `SECURITY DEFINER` — **não**
um alargamento da policy de UPDATE de `material` para a feature `patients`: quem
pode dar baixa em uma luva não pode poder renomear o catálogo inteiro. E não há
`material_movement`: hoje o `audit_log` de `material` é o livro do estoque.

**(r) `cash_session` não aponta para uma conta.** `cash_movement` pende da
sessão, não de uma `bank_account`, então `bank_account_balance` não enxerga a
gaveta: uma conta `type='cash'` mostra saldo formado só por
`payable`/`receivable`. A ligação certa é `cash_session.bank_account_id` — o
turno acontece **em** uma gaveta —, mas ela não existe no `domain.ts`.

### 5.6 · Escolhas assumidas que vale confirmar

- **`is_platform_admin()` lê contrato e faturas de todos os tenants** (policies de
  SELECT de `subscription` e `subscription_invoice`). É coerente com a fundação e
  é o nosso dinheiro, não o do paciente — mas foge da forma canônica. Confirmar se
  o suporte deve mesmo enxergar o valor pago por qualquer clínica, ou se isso
  passa por uma RPC auditada.
- **`subscription_invoice.clinic_id` é `ON DELETE RESTRICT`** de propósito (é o
  documento contábil da plataforma). Na prática nunca dispara, porque clínica não
  se apaga. Mas quando existir expurgo de LGPD de verdade, ele terá de arquivar as
  faturas **antes** — e a FK é justamente o que obriga a fazer na ordem certa.
- **`subscription_invoice` não tem `subscription_id`.** Funciona enquanto valer o
  `unique (clinic_id)` em `subscription`. No dia em que existir um segundo
  contrato por clínica, as faturas antigas ficam sem dono. Confirmar que "uma
  clínica, um contrato" é regra permanente.
- **A anamnese tem HISTÓRICO — decidido, e é o oposto do que o `domain.ts` diz.**
  `anamnesis_patient_uk unique (patient_id)` fixava **uma** ficha por paciente
  para sempre; virou `anamnesis.status ('active'|'archived')` + o índice único
  **parcial** `anamnesis_active_patient_uk (patient_id) where status='active'`.
  A semântica escolhida, e o motivo de cada metade: **salvar continua atualizando
  a ficha aberta** (versionar a cada clique em Salvar encheria o prontuário de
  cópias quase idênticas) e **fechar é ato explícito**, por
  `archive_anamnesis(patient)` — só depois disso o `save_anamnesis` seguinte abre
  uma ficha nova, com o questionário vigente. Ficha arquivada é imutável: escrita
  barrada por trigger (`tr_archived_lock`, que vale até para `service_role`) e
  DELETE barrado por **policy** — em trigger ele quebraria o `on delete cascade`
  do expurgo de LGPD. Falta só o front: sem uma ação "arquivar e abrir nova
  anamnese", o banco aceita histórico e ninguém cria o segundo registro.
- **Trocar `clinic.specialty` depois do onboarding quebra a anamnese.** As duas
  RPCs procuram `t.specialty = c.specialty and t.is_default`; sem questionário do
  novo ramo, `save_anamnesis` recusa toda ficha nova. Ou se bloqueia a troca, ou
  se semeia o questionário do novo ramo na troca. Com o histórico, isto ficou
  **mais** provável de aparecer: toda anamnese de retorno passa pela busca do
  questionário padrão, e não só a primeira ficha da vida do paciente.
- **`save_anamnesis` não filtra `q.status = 'active'`** ao resolver a pergunta por
  código: uma pergunta desativada ainda aceita resposta se o front mandar o código
  (e a resposta fica invisível na tela, porque `patient_anamnesis` filtra status).
  Tolerância a formulário em cache, ou deve recusar?
- ~~**`patient_document.uploaded_at` é sempre igual a `created_at`**~~ —
  **RESOLVIDO (22/07/2026):** a coluna foi removida e o índice
  `patient_document_patient_idx` passou a ordenar por `created_at desc`. Se um
  dia houver importação de base antiga que precise preservar a data original do
  arquivo, ela volta com um caminho de escrita por `service_role`.
- **`treatment_session_material.name` está documentada como congelada**, mas está
  no GRANT de UPDATE (para corrigir typo). Congelamento estrito exige tirá-la de
  lá e obrigar apagar/reinserir.
- **`tooth_fdi` nasce em 06 mas `quote_item.teeth` (07) repete a mesma regra como
  array literal.** As duas versões concordam hoje. Sugestão: promover `tooth_fdi`
  para `01-fundacao.sql` e fazer `quote_item.teeth` usar `tooth_fdi[]`.
- **Não há índice liderado por `reference_month`** em `subscription_invoice`, e
  "quanto faturamos em julho somando todos os tenants" é a pergunta mais óbvia da
  plataforma. Não foi criado por ser especulativo — confirmar se esse relatório
  existe.
- **Sem catálogo de serviços.** `schedule_slot.activity`, `appointment.service` e
  `appointment_history.service` são texto livre, e a cor viaja repetida em cada
  linha da grade. Um `service (clinic_id, name, color, default_duration_minutes)`
  resolveria os três — mas é tabela que o `domain.ts` não tem.
- **Sem horário de funcionamento.** Nada impede agendar às 03:00 de domingo. As
  travas EXCLUDE que restaram evitam **choque de sala**, não horário absurdo.

---

## 6 · Como aplicar (quando for a hora)

```bash
for f in 01-fundacao 02-cadastros 03-pacientes 04-profissionais 05-agenda \
         06-clinico 07-comercial 08-financeiro 09-saas 10-hardening 99-seed; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f.sql" || break
done
```

As migrations 01–09 **não são idempotentes de propósito**: rodar duas vezes
quebra alto, que é o comportamento desejado. `10-hardening.sql` e `99-seed.sql`
são idempotentes.

Rode `10-hardening.sql` de novo depois de qualquer migration futura que crie
tabela, até que o `alter default privileges` da seção 3 dele esteja confirmado
para o papel que executa as migrations.
