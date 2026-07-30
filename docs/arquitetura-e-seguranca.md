# Arquitetura e segurança — auditoria e desenho de referência

Dois documentos em um:

1. **O que foi medido no projeto atual** — código morto e falhas de segurança, com a
   evidência de cada achado.
2. **O desenho que eu faria do zero** — quais tabelas, como se relacionam, e as
   decisões de segurança que precisam ser tomadas *antes* da primeira migration.

Tudo aqui saiu de consulta ao banco e varredura do repositório em 28/07/2026, não
de impressão. As consultas estão citadas para poder repetir.

---

## Parte 1 · O que foi medido

### 1.1 Método

| O que | Como |
|---|---|
| Tabelas, RLS, policies, grants | `pg_class` + `pg_policies` + `information_schema.role_table_grants` |
| Tabela usada por alguma função | `pg_get_functiondef` de todas as funções, casado com o nome da tabela |
| Tabela usada pelo front | `grep "from('<tabela>')"` em `src/` |
| Componente morto | Import fora da própria pasta = 0 |
| Lints de segurança | Advisors do Supabase |

**Cuidado que mudou o resultado:** `grep "from('x')"` NÃO enxerga *embed* do
PostgREST (`select('*, sub:tabela(...)')`) nem uso em script. Sem checar isso, eu
teria declarado `drug_substance` morta — ela é escrita por
`scripts/import-cmed.mjs`. Toda candidata foi conferida no repositório inteiro
antes de entrar na lista.

### 1.2 Código morto

**Tabelas mortas — sem linhas, sem código, sem função, sem FK de entrada:**

| Tabela | Situação |
|---|---|
| `appointment_history` | 0 linhas. Só aparece em `database.types.ts` (gerado). |
| `appointment_history_material` | 0 linhas. Filha da anterior. |
| `billed_treatment` | 0 linhas. Só no arquivo gerado. A RPC `bill_treatment_session` **não** escreve nela. |

**NÃO são mortas, apesar de parecerem:**

| Tabela | Por quê |
|---|---|
| `cash_session` | `cash_movement` tem FK para ela, e `cash_movement` é usada por função. É **feature pela metade** (abertura/fechamento de caixa), não código morto. Apagar quebra o caixa. |
| `drug_substance` | 27 linhas, escrita por `scripts/import-cmed.mjs`. Sem tela ainda porque o bulário foi reduzido a catálogo + bula. |
| `cid10` | 12.451 linhas de dado de referência. Consultada por busca, não por `from()`. |

**Componentes mortos** — 3 de 76:

- `AiNoteActions`
- `CibellyUsageCard`
- `QuickAccessCard` (o "Início rápido" removido do Dashboard — o componente ficou)

### 1.3 Falhas de segurança, por gravidade

#### ALTA · HTML de terceiro renderizado sem sanear

Três pontos injetam HTML vindo do banco sem passar por DOMPurify na leitura:

- [`LastSessionNote.tsx:80`](../src/components/LastSessionNote/LastSessionNote.tsx#L80)
- [`PatientClinicalNotesPanel.tsx:41`](../src/pages/Patients/Profile/ClinicalNotes/PatientClinicalNotesPanel.tsx#L41)
- [`MedicalNoteForm.tsx:203`](../src/pages/Consultation/MedicalNoteForm.tsx#L203)

Os três confiam no saneamento da **escrita** (`RichTextEditor` usa DOMPurify). O
editor não é o único caminho até a coluna: um usuário de clínica tem GRANT de
UPDATE e escreve `treatment_session.evolution` direto pelo PostgREST com o
próprio token. Sanear só na escrita é trava que se contorna dando a volta.

Dois pontos fazem certo (`SoapNoteView`, `EvolutionTimeline`) — o padrão correto
já existe no projeto, só não foi aplicado nesses três.

#### ALTA · Medição de custo escrita pelo próprio cliente

`cibelly_usage` guarda `cost_usd` e tokens, e a policy de INSERT permite que a
clínica grave as próprias linhas. Quem é medido não pode escrever a medição: o
consumo de IA é base de custo (e, um dia, de cobrança). Deve ser gravado por
Edge Function com `service_role`, nunca pelo navegador.

#### MÉDIA · Toda tabela nasce com GRANT amplo

- **95 de 100 tabelas** dão `TRIGGER` e `REFERENCES` a `authenticated`
- **71 tabelas** dão `DELETE` a `authenticated`

É a assinatura de um `ALTER DEFAULT PRIVILEGES` amplo na raiz do projeto: cada
tabela nova nasce aberta e precisa de `revoke` manual. Nesta sessão precisei
revogar à mão em `platform_job_position` e em `app_error`.

Hoje isso **não vaza**, porque a RLS recusa o que a policy não permite — grant
sem policy é porta trancada. Mas inverte o modo de falha: esquecer o `revoke`
numa tabela nova abre, em vez de fechar. É o tipo de erro que vira incidente.

#### MÉDIA · Função `SECURITY DEFINER` exposta ao `anon`

`checkout_sale_for_appointment` é chamável **sem login**.

Ela se defende: a primeira checagem é
`a.clinic_id = any(private.auth_clinic_ids())`, e para `anon` esse conjunto é
vazio, então levanta exceção. **Não é explorável hoje** — mas a proteção é
acidental, não estrutural. O GRANT é gratuito e deve ser revogado.

#### MÉDIA · Achados dos advisors

| Achado | Detalhe |
|---|---|
| `professional_directory` é view `SECURITY DEFINER` | ERROR. Roda com permissão do criador, ignorando a RLS de quem consulta. |
| Proteção contra senha vazada desligada | Supabase Auth pode checar HaveIBeenPwned. Está off. |
| `search_path` mutável | `private.search_key` e `public.unaccent_imm` |

#### BAIXA · Ausências estruturais

Sem limite de requisição por tenant. Sem MFA nem reautenticação para entrar na
área de plataforma. Sem teste que reprove tabela sem RLS.

### 1.4 O que já está certo

Vale registrar, porque é a base sobre a qual o resto se apoia:

- **100 de 100 tabelas com RLS ligada.**
- Contexto de tenant vem do banco (`private.auth_clinic_ids()`), nunca de header
  ou parâmetro do cliente.
- `audit_log` append-only: `authenticated` não tem INSERT/UPDATE/DELETE.
- Grants em nível de coluna onde importa (`patient_document`,
  `platform_job_position.is_system`).
- 29 funções `SECURITY DEFINER`, todas com `SET search_path TO ''` exceto as duas
  citadas acima.
- `service_role` nunca no front (o Vite empacota `VITE_*`).

---

## Parte 2 · O desenho do zero

### 2.1 As quatro decisões que precisam vir antes da primeira migration

Estas não se acrescentam depois sem reescrever:

**1. Tabela nasce fechada.**
```sql
alter default privileges in schema public revoke all on tables from authenticated, anon;
```
Feito uma vez, esquecer um `grant` deixa a tabela inacessível — falha barulhenta
e imediata. É o inverso exato do projeto atual.

**2. Teste que reprova tabela sem RLS.** No CI, consulta `pg_class`/`pg_policies`:
tabela nova sem RLS, ou com grant amplo, quebra o build. É o único controle desta
lista que não depende de ninguém lembrar de nada.

**3. Cargo separado de perfil de acesso, desde o dia 1.** Cargo é o fato sobre o
trabalho; perfil é o conjunto de permissões; o cargo **recebe** o perfil. Fundir
os dois é barato no começo e caro depois — ver `docs/plataforma.md` §1.

**4. Escrita sensível só por RPC.** Dinheiro, permissão e medição de consumo não
recebem GRANT de INSERT/UPDATE para `authenticated`. Passam por função
`SECURITY DEFINER` cujo **primeiro comando** é a checagem.

### 2.2 As tabelas, por domínio

Marcação: **✓** manter como está · **△** existe mas precisa mudar · **✗** não
criar · **+** criar (não existe)

#### Identidade e acesso

| Tabela | Papel | |
|---|---|---|
| `profile` | Espelho de `auth.users` | ✓ |
| `clinic` | **O tenant.** Um nível só — sem rede/filial | ✓ |
| `clinic_user` | Vínculo pessoa↔clínica. É o que a RLS lê | ✓ |
| `job_position` | **Cargo** da clínica | + |
| `access_profile` | **Perfil de acesso** (hoje faz os dois papéis) | △ |
| `access_profile_permission` | `(perfil, feature, ver, editar)` | ✓ |
| `feature` | Catálogo de funcionalidades — a chave que liga os dois portões | ✓ |
| `plan` / `plan_feature` | O que cada plano libera | ✓ |

`clinic_user → job_position → access_profile → access_profile_permission`.
Dois portões: o plano libera (`plan_feature`) **e** o cargo permite.

#### Plataforma (o SaaS)

| Tabela | Papel | |
|---|---|---|
| `subscription` | Contrato do cliente. Escrita só por `service_role` (gateway) | ✓ |
| `subscription_invoice` | Faturas. O devedor não marca a própria como paga | ✓ |
| `platform_member` / `platform_job_position` / `platform_access_profile` (+ `_permission`) / `platform_feature` | Equipe da Neo Saúde, mesmo modelo cargo→perfil | + |
| `platform_access_grant` / `platform_access_log` | Acesso ao dado do cliente com motivo, prazo e registro | + |
| `app_error` | Erros do app, append-only | ✓ |
| `platform_expense` | Custos da plataforma (infra, IA, gateway) | + |

#### Pacientes e clínico

`patient`, `patient_document`, `lead`, `waiting_list`, `patient_custom_question`
·
`anamnesis` (+ `_template`, `_section`, `_question`, `_question_option`,
`_answer`), `patient_clinical_entry`, `patient_medication`, `prescription`
(+ `_medication`), `patient_reminder`
·
`treatment` → `treatment_session` → (`_action`, `_material`, `_tooth`,
`_odontogram`), `treatment_tooth`, `patient_odontogram`
·
`patient_test` → `patient_test_result` → `_item`; `physio_test` (+ `_item`,
`_item_option`, `_level`)
·
Referência: `cid10`, `drug_product`, `drug_substance`, `medical_note_template`,
`evolution_template`

Um ajuste: `patient_odontogram` e `treatment_session_odontogram` guardam a mesma
forma em dois lugares — estado atual e histórico. Do zero, **uma tabela só** com
a sessão nula significando "estado corrente".

#### Agenda

`appointment`, `schedule_slot`, `room`, `professional_availability`,
`professional_absence`, `professional_blocked_slot`, `class_group`
(+ `_enrollment`, `_attendance`)

✗ `appointment_history` e `appointment_history_material` — morreram sem nunca
receber uma linha. O histórico de consulta é o `audit_log`.

#### Financeiro da clínica

`receivable`, `payable`, `payment`, `payment_entry`, `sale`, `sale_item`,
`quote`, `quote_item`, `acquirer` (+ `_installment_rate`), `bank_account`,
`cash_session` △ (completar), `cash_movement`, `cost_center`, `finance_category`,
`collection_attempt`, `clinic_finance_setting`, `service`,
`patient_service_entitlement`, `clinic_goal`, `insurance`
(+ `_service_price`), `tiss_guide` (+ `_procedure`)

✗ `billed_treatment` — 0 linhas, nenhum código.

O modelo contábil (competência × caixa) está em `docs/modelo-contabil.md` e é
fonte única: nenhuma tela inventa uma quarta definição de "faturamento".

#### Suprimentos, comunicação, IA, infra

`material`, `supplier`, `material_supplier` (N:N — material vendido por vários
distribuidores vai para **todos** na cotação), `purchase_list_item`,
`purchase_quote` (+ `_item`)
·
`whatsapp_connection`, `whatsapp_automation`, `whatsapp_inbound_message`
·
`cibelly_usage` △ — mesma forma, mas **escrita só por `service_role`**
·
`audit_log`, `counter`, `task`

### 2.3 As regras que valem para toda tabela

1. **`clinic_id` em toda tabela de domínio**, e a RLS confere contra
   `private.auth_clinic_ids()`. Sem exceção "porque é tabela de apoio" — é a
   exceção que vaza.
2. **RLS ligada + policy por operação.** Policy sem GRANT não funciona; GRANT sem
   policy não autoriza. Precisa dos dois, e o GRANT deve ser o mínimo.
3. **Coluna sensível fora do GRANT de UPDATE.** `is_system`, `platform_admin`,
   `is_owner`, `status` de fatura. Se o usuário não deve mudar, ele não tem a
   coluna — não basta a tela esconder.
4. **Toda escrita confere zero linhas.** No PostgREST, RLS que recusa devolve
   sucesso com zero linhas. Sem `.select()` e checagem, a tela diz "salvo" sobre
   uma gravação que não aconteceu.
5. **Log é append-only.** Log que quem errou pode apagar não é log.
6. **Leitura auditada passa por porta única.** `SELECT` não dispara trigger no
   Postgres: se houver policy, lê-se sem registro. Auditoria de leitura exige que
   o dado saia **só** por RPC que grava o log antes de devolver.
7. **Dado de identificação nunca em log.** Rota e mensagem de erro passam por
   máscara (`uuid → :id`) **no banco**, não no navegador — o cliente pode chamar
   a RPC com o que quiser.
8. **Enum para o que o código conhece, texto com CHECK para o que o negócio muda.**
   Categoria de vitrine e provedor de gateway não valem uma migration.

### 2.4 O que já foi corrigido (28/07/2026)

| Correção | Resultado medido |
|---|---|
| HTML saneado na leitura | Componente `SafeHtml` — **os 5** pontos passam por ele; `dangerouslySetInnerHTML` não existe mais fora dele |
| `EXECUTE` para `PUBLIC` | **7 → 0** funções chamáveis por `anon` |
| `TRIGGER`/`REFERENCES` | **95 → 0** tabelas |
| Tabela/função nova nasce fechada | `ALTER DEFAULT PRIVILEGES` revogado para tabelas, sequências e funções |
| View `SECURITY DEFINER` | `professional_directory` derrubada (ERROR do advisor zerado) |
| `search_path` mutável | Fixado em `private.search_key` e `public.unaccent_imm` |
| Tabelas mortas | `appointment_history`, `appointment_history_material`, `billed_treatment` |
| Componentes mortos | `AiNoteActions`, `CibellyUsageCard`, `QuickAccessCard` |
| Propriedade CSS crua no JSX | **7 → 0** (tudo por CSS var; o estilo voltou para o `.module.scss`) |
| `setState` em efeito | 3 → 0 (ajuste durante a renderização) |

**A armadilha que quase passou:** `revoke execute ... from anon` **não funciona**.
Em Postgres a função nasce com `EXECUTE` para `PUBLIC`, e `anon` herda dali —
revogar de um papel não tira o que ele tem por herança. O advisor continuou
acusando depois da primeira tentativa, e só o `revoke ... from public` resolveu.

Estado atual: **98 tabelas, 100% com RLS, 0 sem policy, 0 função aberta ao
`anon`**. Build, lint e 644 testes limpos.

### 2.5 O que continua em aberto

**1 · Proteção contra senha vazada** — é chave no painel do Supabase
(Authentication → Providers), não dá para ligar por migration ou MCP.

**2 · `DELETE` para `authenticated` em 71 tabelas** — deliberadamente intocado.
Várias precisam (apagar sala, material, cargo); revogar em bloco quebraria
funcionalidade. É trabalho tabela a tabela, com teste, e merece uma passada
própria.

**3 · MFA/step-up na plataforma e limite por tenant.**

**4 · `SUPABASE_SERVICE_ROLE_KEY` como segredo de CI** — sem ela o
`npm run check:rls` sai em sucesso com aviso, e o portão fica desarmado.

### 2.6 O portão de RLS

`npm run check:rls` → RPC `security_audit()` → lista de afrouxamentos.
Vazio = passa; qualquer achado devolve exit 1.

As quatro checagens moram **no banco**, não no script: a mesma verificação serve
ao CI e a quem estiver com o SQL aberto, sem duas implementações que divergem.
O script só decide o código de saída.

Foi testado **contra um afrouxamento real**, não só contra o estado bom: criei
uma tabela sem RLS com `GRANT TRIGGER`, e uma função exposta ao `PUBLIC`. O
portão acusou os 3 achados e voltou a zero depois da limpeza. Um portão que
nunca viu vermelho não é portão.

Sem `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` ele **pula com aviso** em vez de
falhar — portão que quebra o CI de quem não tem credencial é portão que alguém
desliga.
