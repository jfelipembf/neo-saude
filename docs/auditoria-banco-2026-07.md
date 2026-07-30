# PARECER FINAL — Auditoria do schema `public` (projeto cchbamuhjvxxayokklux)

---

## 1. VEREDITO

**O banco está bem amarrado. Não há vazamento entre clínicas — nenhum. Dos 6 eixos auditados, o que sobrou de verdade são buracos de trilha de auditoria e um punhado de FKs contraditórias herdadas de migrações sobrepostas; o resto é cosmético.**

Toda alegação de "vazamento entre tenants" levantada durante a auditoria caiu na verificação: a RLS filtra a leitura em todos os caminhos testados, e onde uma FK permite gravar um ponteiro para outra clínica, o `SELECT` do outro lado devolve zero linhas. O eixo multi-tenant está sólido.

---

## 2. O QUE JÁ ESTÁ CERTO

Não é elogio de cortesia — é o que sustentou os ataques da auditoria:

**FK composta com `clinic_id` na chave.** 131 das 268 FKs do schema são `(x_id, clinic_id) -> pai(id, clinic_id)`. Isso torna referência cross-tenant **impossível no motor**, sem trigger, sem RLS, sem custo por linha. É mais forte que qualquer guarda em PL/pgSQL — tanto que as duas funções `private.tg_assert_same_clinic` e `private.tg_check_ref_clinic` estão mortas justamente porque essa abordagem as tornou desnecessárias. Foi a decisão de design mais acertada do schema.

**GRANT por coluna, não por tabela.** Em 87 de 92 tabelas com `clinic_id`, `authenticated` não tem `UPDATE` de tabela — só nas colunas de negócio, e `clinic_id` recebe apenas `a` (INSERT). Isso significa que uma linha **não consegue trocar de tenant**, e é o que neutraliza sozinho o `WITH CHECK` fraco de 66 políticas. Defesa em duas camadas funcionando.

**`private.auth_clinic_ids()` é `SECURITY DEFINER` com `search_path TO ''`,** lendo de `clinic_user` + `clinic`. Nada vem do cliente, nada de `current_setting`. Não há vetor para forjar a clínica.

**Trilha de auditoria genuína.** 69 tabelas com `tr_audit`, 7.327 eventos em 51 tabelas. O mecanismo funciona; os buracos são pontuais e nominais.

**Congelamento de dado histórico.** `tr_freeze` em `anamnesis_answer` copia `question_text`/`answer_label` para dentro da resposta; `tiss_guide` tem os campos `frozen_*`. Editar o catálogo não reescreve o passado — isso é raro e está certo.

**Proteção deliberada de paciente com histórico.** `payment`, `sale`, `prescription`, `quote`, `tiss_guide`, `schedule_slot` são todos `NO ACTION` contra `patient`, e a RPC `paciente_pode_ser_excluido` cobre o superconjunto. Apagar paciente com movimento não é bug — é regra, e está implementada nas duas camadas.

**Índices de exclusão em `appointment`.** `appointment_professional_overlap_ex` e `appointment_room_overlap_ex` com `tsrange`. Double-booking impossível no banco. E `starts_at`/`ends_at` como *hora de parede* é a modelagem correta para agenda de clínica, não um descuido.

---

## 3. O QUE PRECISA DE CONSERTO

### 🔴 ALTO — 1 item

#### A. `care_plan`: o cliente pode apagar um tratamento inteiro sem deixar rastro

`care_plan` tem **um** trigger (`tg_care_plan_updated_at`). Não tem `tr_audit`. E `authenticated` tem `DELETE, SELECT` de tabela mais política `care_plan_delete` liberada. As **seis** FKs filhas (`anamnesis`, `appointment`, `patient_body_composition`, `patient_clinical_entry`, `patient_test_result`, `patient_vital_sign`) são `ON DELETE SET NULL (care_plan_id)` — SET NULL parcial, que zera o vínculo sem invalidar a linha.

**Onde morde:** recepcionista apaga o tratamento errado. O plano some com `title`, `baseline`, `planned_sessions`, `discharge_notes`. Sinais vitais, bioimpedância, testes, evoluções e anamneses continuam no banco mas **desvinculados e silenciosamente** — e duas dessas filhas (`patient_vital_sign`, `patient_body_composition`) também não têm `tr_audit`, então nem o SET NULL delas deixa rastro. Não há `old_data` em lugar nenhum para reconstruir.

```sql
create trigger tr_audit
  after insert or update or delete on public.care_plan
  for each row execute function private.tg_audit();
```

Recomendação adicional (custo zero, 3 planos na base): `care_plan` é registro clínico. Trocar DELETE por baixa lógica — o `status` já tem `finished`.

```sql
-- opcional, mas eu faria
revoke delete on public.care_plan from authenticated;
drop policy care_plan_delete on public.care_plan;
```

---

### 🟠 MÉDIO

#### B. Buracos na trilha de auditoria

**B1. `tr_audit` em `public.clinic` é no-op.** O trigger existe e dispara, mas `private.tg_audit` faz `v_clinic := coalesce(v_new->>'clinic_id', v_old->>'clinic_id')::uuid` e retorna cedo se nulo — e `clinic` não tem `clinic_id`, ela **é** o tenant. Resultado: 7 clínicas, 0 linhas em `audit_log`. Pior que não ter trigger, porque dá falsa garantia.

Dimensione certo antes de correr: `authenticated` só alcança 12 colunas cadastrais por `GRANT` de coluna (`specialty`, `plan_key`, `status` **não** estão liberadas — só service_role). O que hoje passa sem trilha é razão social, CNPJ, e-mail, telefone, endereço, logo, CNES. Justifica auditar; não é incidente.

```sql
-- NAO reescrever private.tg_audit(): 69 triggers dependem dela.
-- NAO auditar DELETE: audit_log_clinic_id_fkey e CASCADE + NOT DEFERRABLE,
-- o insert do AFTER DELETE violaria FK (23503) e abortaria todo delete de clinica.
create or replace function private.tg_audit_clinic()
  returns trigger language plpgsql security definer set search_path to ''
as $function$
declare
  v_old jsonb; v_new jsonb; v_changed text[];
  v_actor uuid := auth.uid(); v_name text;
begin
  if tg_op <> 'INSERT' then v_old := to_jsonb(old); end if;
  v_new := to_jsonb(new);
  if tg_op = 'UPDATE' then
    select array_agg(e.key order by e.key) into v_changed
      from jsonb_each(v_new) as e
     where v_old -> e.key is distinct from e.value;
    if v_changed is null or v_changed <@ array['updated_at']::text[] then
      return new;
    end if;
  end if;
  select p.full_name into v_name from public.profile p where p.id = v_actor;
  insert into public.audit_log (clinic_id, table_name, record_id, action,
                                actor_id, actor_name, old_data, new_data, changed_fields)
  values (new.id, 'clinic', new.id, lower(tg_op)::public.audit_action,
          v_actor, v_name, v_old, v_new, v_changed);
  return new;
end;
$function$;

drop trigger tr_audit on public.clinic;
create trigger tr_audit after insert or update on public.clinic
  for each row execute function private.tg_audit_clinic();
```

**B2. Dado clínico medido, com UPDATE liberado, sem auditoria.**

```sql
create trigger tr_audit after insert or update or delete
  on public.patient_vital_sign       for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete
  on public.patient_body_composition for each row execute function private.tg_audit();

-- Odontograma: usar tg_argv para NAO duplicar o mapa dentario.
-- payload chega a 35.6k chars e a Cibelly escreve continuamente durante o atendimento;
-- tg_audit sem filtro gravaria old+new (~70 KB) a cada save.
create trigger tr_audit after insert or update or delete
  on public.patient_odontogram           for each row execute function private.tg_audit('payload');
create trigger tr_audit after insert or update or delete
  on public.treatment_session_odontogram for each row execute function private.tg_audit('payload');
```

`treatment_tooth` e `treatment_session_tooth` ficam de fora: são ligação append-only (INSERT em 3 colunas, zero GRANT de UPDATE) e os pais já têm `tr_audit`.

---

#### C. Cinco tabelas com `GRANT UPDATE` de tabela — `clinic_id`, `id` e `created_at` reescrevíveis

`tiss_guide`, `tiss_guide_procedure`, `patient_medication`, `insurance_service_price`, `class_group_attendance` têm `relacl = authenticated=arwdm/postgres` — `w` no nível de **tabela**, portanto todas as colunas. São as únicas 5 de 92 nessa condição. Nenhuma tem `tg_assert_same_clinic` (que existe no banco e não foi aplicada em lugar nenhum).

O que corrobora que é **regressão, não desenho**: `src/services/classGroupRosterService.ts:264` documenta textualmente que `class_group_attendance` só concede UPDATE em `(status, justification, clinical_note)` — "de propósito". O banco não faz isso.

**Onde morde hoje, com um tenant só:** `created_at` reescrevível em documento de faturamento (`tiss_guide`) e em registro clínico (`patient_medication`) corrói a trilha de auditoria por dentro. **Latente:** no dia em que existir usuário em duas clínicas (`auth_clinic_ids()` já devolve array; hoje `count(distinct clinic_id)>1` = 0), o `USING` exige `can_edit_feature` na origem mas o `WITH CHECK` só exige pertencer ao destino — a linha muda de tenant.

*(Duas alegações a descartar: `id` reescrevível não órfã `tiss_guide_procedure` — a FK é `NO ACTION`, o UPDATE erra. E não dá para duplicar número de guia — existe `tiss_guide_code_uk UNIQUE (clinic_id, code)`.)*

```sql
begin;
set local lock_timeout = '3s';

revoke update on public.tiss_guide, public.tiss_guide_procedure,
                 public.patient_medication, public.insurance_service_price,
                 public.class_group_attendance
  from authenticated;

grant update (kind, status, insurance_id, patient_id, professional_id, appointment_id,
              treatment_session_id, served_on, issued_on, consultation_type,
              accident_indication, notes, frozen_provider_code, frozen_cnes,
              frozen_insurance_ans, frozen_patient_name, frozen_patient_card,
              frozen_patient_cns, frozen_professional_name, frozen_council,
              frozen_council_number, frozen_council_state, frozen_cbo, total)
  on public.tiss_guide to authenticated;

grant update (guide_id, service_id, tuss_table, tuss_code, description,
              quantity, unit_price, amount, sort_order)
  on public.tiss_guide_procedure to authenticated;

grant update (patient_id, appointment_id, name, dosage, started_on, ended_on,
              end_reason, replaced_by, professional_id, continuous, dose_amount,
              dose_unit, times_per_day, duration_days)
  on public.patient_medication to authenticated;

grant update (insurance_id, service_id, price)
  on public.insurance_service_price to authenticated;

-- estreitado para a intencao documentada no servico:
grant update (status, justification, clinical_note)
  on public.class_group_attendance to authenticated;
commit;

-- conferencia (deve voltar 0 linhas):
-- select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
--  where n.nspname='public' and c.relkind='r'
--    and has_column_privilege('authenticated', c.oid, 'clinic_id', 'UPDATE');
```

**Junto com isso**, feche a outra metade — 66 políticas de UPDATE têm `WITH CHECK = (clinic_id = ANY(auth_clinic_ids()))` sozinho, enquanto o `USING` das mesmas exige `can_edit_feature`. Só 4 fazem certo (`care_plan`, `patient_body_composition`, `patient_test_result`, `patient_vital_sign`). Isoladamente é defesa em profundidade; combinado com o item acima é a metade que *autoriza*.

```sql
-- PASSO 1 (so leitura): gera o DDL a partir do proprio USING, que ja tem a feature certa.
select format('ALTER POLICY %I ON public.%I USING %s WITH CHECK %s;',
              policyname, tablename, qual, qual)
  from pg_policies
 where schemaname='public' and cmd='UPDATE'
   and with_check = '(clinic_id = ANY (private.auth_clinic_ids()))'
   and qual like '%can_edit_feature%'
 order by tablename;

-- PASSO 2: revisar a saida e executar em lotes:
--   begin; set local lock_timeout='3s'; <lote>; commit;
```

---

#### D. FKs duplicadas e contraditórias em `patient` (consolidação de 4 achados)

**Atenção: aqui a auditoria produziu três receitas conflitantes. Duas delas quebram o sistema.** Este é o item que mais exige que você leia antes de aplicar.

Os fatos: `patient` é referenciada por 40 FKs para 29 tabelas filhas — 11 tabelas aparecem duas vezes. Em 7 pares o `confdeltype` diverge (`a` NO ACTION vs `c` CASCADE), e quem vence é a ordem de criação, porque os triggers de RI se chamam `RI_ConstraintTrigger_a_<oid>` e disparam em ordem de nome = ordem de OID:

| tabela | NO ACTION (oid) | CASCADE (oid) | quem vence |
|---|---|---|---|
| appointment | 19281 | 28303 | **NO ACTION** (bloqueia) |
| treatment | 19458 | 28308 | **NO ACTION** |
| receivable | 20111 | 28313 | **NO ACTION** |
| patient_test_result | 25607 | 28298 | **NO ACTION** |
| collection_attempt | 27984 | 20304 | **CASCADE** ⚠️ |
| class_group_attendance | 27994 | 25935 | **CASCADE** ⚠️ |
| patient_service_entitlement | 27989 | 25765 | **CASCADE** ⚠️ |

**A direção correta é preservar o NO ACTION.** A intenção está escrita no código: `patientsService.ts` diz que impedir a exclusão "é o certo, porque apagá-lo destruiria a trilha financeira e clínica", e a RPC comenta sobre as três últimas: *"sao dinheiro, e dinheiro nao some"*. As `*_patient_clinic_fk` (OIDs 28xxx, do commit de endurecimento multi-tenant) foram acrescentadas por cima com CASCADE, provavelmente por descuido do gerador.

Nas três de "dinheiro", a proteção pretendida **está anulada no banco hoje** (o CASCADE antigo dispara primeiro) — coberta só pela RPC na aplicação.

```sql
-- 1) Pares assimetricos: derrubar o CASCADE novo. As sobreviventes (*_patient_fk)
--    JA SAO COMPOSTAS (patient_id, clinic_id) -> o tenant continua amarrado.
alter table public.appointment         drop constraint appointment_patient_clinic_fk;
alter table public.treatment           drop constraint treatment_patient_clinic_fk;
alter table public.patient_test_result drop constraint patient_test_result_patient_clinic_fk;
alter table public.receivable          drop constraint receivable_patient_clinic_fk;

-- 2) Pares identicos (ambos CASCADE composto): derrubar um, tanto faz qual.
alter table public.patient_clinical_entry drop constraint patient_clinical_entry_patient_fk;
alter table public.patient_document       drop constraint patient_document_patient_fk;
alter table public.patient_medication     drop constraint patient_medication_patient_fk;
alter table public.patient_reminder       drop constraint patient_reminder_patient_fk;

-- 3) As tres de "dinheiro": derrubar o CASCADE antigo (que hoje vence a corrida e
--    anula a intencao registrada na RPC), depois promover a sobrevivente a composta.
alter table public.collection_attempt          drop constraint collection_attempt_patient_fk;
alter table public.class_group_attendance      drop constraint class_group_attendance_patient_fk;
alter table public.patient_service_entitlement drop constraint entitlement_patient_fk;

alter table public.collection_attempt drop constraint collection_attempt_patient_id_fkey;
alter table public.collection_attempt add constraint collection_attempt_patient_fk
  foreign key (patient_id, clinic_id) references public.patient(id, clinic_id) not valid;
alter table public.collection_attempt validate constraint collection_attempt_patient_fk;
-- (repetir o mesmo par drop/add/validate para class_group_attendance
--  e patient_service_entitlement)
```

**NÃO faça:** derrubar `appointment_patient_fk` / `treatment_patient_fk` / `receivable_patient_fk` / `patient_test_result_patient_fk`. Isso deixa só o CASCADE e transforma "recusa apagar paciente com histórico" em "apaga em cascata consultas, tratamentos e recebíveis, em silêncio".

**E antes de aplicar, confirme você mesmo:**
```sql
select conrelid::regclass, conname, confdeltype, pg_get_constraintdef(oid)
  from pg_constraint where contype='f' and confrelid='public.patient'::regclass
 order by 1, 2;
```

**Nota de brinde sobre `removePatient()`** (`src/services/patientsService.ts:295-322`): ele apaga os documentos do Storage um a um **antes** do DELETE, fora de transação. Isso não é bug ativo — o botão em `PatientProfilePage.tsx:717` está `disabled` pela RPC `paciente_pode_ser_excluido`, que cobre um superconjunto dos impedimentos, e a ordem "Storage primeiro" é escolha documentada (troca "arquivo órfão no bucket" por "cadastro que sobrou"). O resíduo é a corrida: paciente ganha uma consulta entre o check e o clique. Se quiser blindar, o certo é a RPC de exclusão revalidar os impedimentos dentro da transação.

---

#### E. `patient_clinical_entry.diagnosis_id`: auto-referência com `ON DELETE CASCADE`

Das 3 auto-referências do schema, esta é a única incoerente: `patient_medication.replaced_by` (mesmo conceito — registro clínico apontando para outro da mesma tabela) é `SET NULL`. `finance_category.parent_fk` é CASCADE e está certo (árvore de plano de contas, filho não existe sem pai).

**Onde morde:** o usuário apaga a linha de um diagnóstico digitado errado para redigitar. O app chama um DELETE de uma linha; o banco apaga a **subárvore** de evoluções que apontam para ela, recursivamente, sem aviso. `removeClinicalEntry()` existe e é chamado pela UI; o insert grava `diagnosis_id`. Hoje o raio é 1 linha (5 na tabela, 1 com `diagnosis_id` preenchido) — daí a urgência ser baixa e o custo, zero.

```sql
alter table public.patient_clinical_entry
  drop constraint patient_clinical_entry_diagnosis_fk;

alter table public.patient_clinical_entry
  add constraint patient_clinical_entry_diagnosis_fk
  foreign key (diagnosis_id, clinic_id)
  references public.patient_clinical_entry(id, clinic_id)
  on delete set null (diagnosis_id)   -- a lista de colunas e OBRIGATORIA: clinic_id e NOT NULL
  not valid;

alter table public.patient_clinical_entry
  validate constraint patient_clinical_entry_diagnosis_fk;
```

---

#### F. 12 FKs sem pinagem de clínica + 2 tabelas-pai sem `UNIQUE (id, clinic_id)`

São as exceções ao padrão composto. Nenhuma tem corrupção consumada (0 divergências em 65 linhas preenchidas) e **não há vazamento de leitura** — a RLS do pai filtra o join e devolveria zero linhas, não o nome do profissional alheio. É defesa em profundidade contra código privilegiado (service_role, Edge Function, seed).

**Pré-requisito que quase derruba a migração:** `professional`, `material`, `supplier`, `insurance`, `appointment` e `treatment_session` **já têm** o `*_id_clinic_uk`. Só `purchase_quote` e `purchase_list_item` não têm — e são as duas únicas do levantamento nessa condição, o que hoje impede qualquer FK composta apontar para elas.

```sql
-- Passo 1: SO onde falta.
alter table public.purchase_quote
  add constraint purchase_quote_id_clinic_uk unique (id, clinic_id);
alter table public.purchase_list_item
  add constraint purchase_list_item_id_clinic_uk unique (id, clinic_id);

-- Passo 2: recompor as FKs PRESERVANDO o confdeltype atual de cada uma.
-- Todas as tabelas com 0-3 linhas exceto cibelly_usage (63) -> so ela precisa de NOT VALID.

alter table public.care_plan drop constraint care_plan_professional_id_fkey;
alter table public.care_plan add constraint care_plan_professional_fk
  foreign key (professional_id, clinic_id) references public.professional(id, clinic_id)
  on delete set null (professional_id);

alter table public.patient_body_composition drop constraint patient_body_composition_professional_id_fkey;
alter table public.patient_body_composition add constraint patient_body_composition_professional_fk
  foreign key (professional_id, clinic_id) references public.professional(id, clinic_id)
  on delete set null (professional_id);

alter table public.patient_vital_sign drop constraint patient_vital_sign_professional_id_fkey;
alter table public.patient_vital_sign add constraint patient_vital_sign_professional_fk
  foreign key (professional_id, clinic_id) references public.professional(id, clinic_id)
  on delete set null (professional_id);

alter table public.patient_vital_sign drop constraint patient_vital_sign_treatment_session_id_fkey;
alter table public.patient_vital_sign add constraint patient_vital_sign_treatment_session_fk
  foreign key (treatment_session_id, clinic_id) references public.treatment_session(id, clinic_id)
  on delete set null (treatment_session_id);

-- cibelly_usage e NO ACTION hoje: manter NO ACTION (e 63 linhas -> NOT VALID).
alter table public.cibelly_usage drop constraint cibelly_usage_professional_id_fkey;
alter table public.cibelly_usage add constraint cibelly_usage_professional_fk
  foreign key (professional_id, clinic_id) references public.professional(id, clinic_id) not valid;
alter table public.cibelly_usage validate constraint cibelly_usage_professional_fk;

-- purchase_quote -> supplier e CASCADE hoje: MANTER CASCADE.
alter table public.purchase_quote drop constraint purchase_quote_supplier_id_fkey;
alter table public.purchase_quote add constraint purchase_quote_supplier_fk
  foreign key (supplier_id, clinic_id) references public.supplier(id, clinic_id) on delete cascade;

alter table public.waiting_list drop constraint waiting_list_appointment_id_fkey;
alter table public.waiting_list add constraint waiting_list_appointment_fk
  foreign key (appointment_id, clinic_id) references public.appointment(id, clinic_id)
  on delete set null (appointment_id);

alter table public.waiting_list drop constraint waiting_list_insurance_id_fkey;
alter table public.waiting_list add constraint waiting_list_insurance_fk
  foreign key (insurance_id, clinic_id) references public.insurance(id, clinic_id)
  on delete set null (insurance_id);

-- (mesmo padrao para purchase_list_item.material_id, purchase_quote_item.quote_id
--  e purchase_quote_item.list_item_id, preservando SET NULL / CASCADE / CASCADE)

-- Caso a parte: FK de coluna unica REDUNDANTE (patient_test_result_item_option_fk
-- ja amarra (option_id, item_id) e o tenant chega por item -> test). So dropar:
alter table public.patient_test_result_item
  drop constraint patient_test_result_item_option_orphan_fk;
```

⚠️ **`ON DELETE SET NULL` em FK composta EXIGE a lista de colunas.** Sem ela o Postgres tenta anular também `clinic_id`, que é `NOT NULL`, e todo DELETE do pai passa a falhar. PG 17.6 suporta; o schema já usa em `cibelly_usage_patient_clinic_fk`.

**Defesa complementar mais barata que as 4 FKs de `professional_id`,** já que o problema real é o cliente escolher o autor: `REVOKE INSERT/UPDATE (professional_id)` e carimbar por trigger a partir de `auth.uid()`, como já se faz com `care_plan_id` em `private.tg_carimba_plano`.

**Observação separada:** `purchase_quote` não tem política de DELETE nem `GRANT DELETE`. O CASCADE via `supplier` é hoje o **único** jeito de uma linha sumir, e não deixa rastro no `tr_audit` da filha. Vale revisar quando o módulo de compras entrar em uso.

---

#### G. Clínica pode ficar sem dono

`profile.id -> auth.users(id)` é CASCADE, e `clinic_user.user_id -> profile(id)` também. Um DELETE em `auth.users` — painel do Supabase, API admin, rotina de limpeza — leva o `is_owner=true` junto. A clínica trava: nenhuma política que dependa de `is_owner` volta a dar verdadeiro, ninguém administra usuários, `removePatient` exige ser dono. Recuperar exige INSERT manual fora do app.

Não é alcançável pela aplicação (só ação administrativa), mas o dano quando ocorre é irreversível pelo app.

**Não mexa nas FKs.** `ON DELETE RESTRICT` em `profile.id` quebra o admin delete do GoTrue e o fluxo de exclusão de conta. `profile.id -> auth.users(id)` em CASCADE é o padrão canônico de tabela-espelho do Supabase (todas as FKs internas do schema `auth` são CASCADE). Guarde a invariante onde ela vive:

```sql
create or replace function public.impede_clinica_sem_dono()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if old.is_owner and exists (select 1 from public.clinic where id = old.clinic_id)
     and not exists (select 1 from public.clinic_user
                      where clinic_id = old.clinic_id and is_owner and id <> old.id) then
    raise exception 'A clinica % ficaria sem dono.', old.clinic_id
      using errcode = 'restrict_violation';
  end if;
  return old;
end $$;

create trigger tr_clinic_user_protege_dono
  before delete on public.clinic_user
  for each row execute function public.impede_clinica_sem_dono();
-- o teste `exists (select 1 from clinic ...)` deixa passar o caso legitimo em que a
-- propria clinica esta sendo apagada (clinic_user_clinic_id_fkey e CASCADE).

-- garantir no maximo um dono (hoje: 7 clinicas, 7 is_owner, 0 duplicado)
create unique index concurrently clinic_user_single_owner_uq
  on public.clinic_user (clinic_id) where is_owner;
```

Falta ainda o caminho de saída: uma RPC de **transferência de propriedade**, para o dono sair sem travar a clínica.

---

#### H. "Serviço" existe como FK em umas tabelas e como texto solto em outras

`appointment.service`, `quote_item.treatment` e `treatment.procedure` são `text NOT NULL`. Nas mesmas famílias, `sale_item.service_id`, `tiss_guide_procedure.service_id`, `insurance_service_price.service_id` e `patient_service_entitlement.service_id` são `uuid` com FK composta para `service(id, clinic_id)`.

**Onde morde:** o item vendido aponta para o catálogo; o item **agendado** e o **orçado** guardam o nome digitado. O relatório de produção por serviço — o cruzamento agenda × venda, que é o número que o dono da clínica realmente quer — só pode casar por string, e "Limpeza"/"limpeza"/"Profilaxia" viram três coisas. Renomear no catálogo não reflete no histórico.

Não é vazamento nem perda de dado — é análise impossível. É o item mais consequente do grupo médio.

```sql
alter table public.appointment add column service_id uuid;
alter table public.appointment add constraint appointment_service_fk
  foreign key (service_id, clinic_id) references public.service(id, clinic_id)
  on delete set null (service_id);          -- lista OBRIGATORIA
create index concurrently appointment_service_idx on public.appointment (clinic_id, service_id);

-- Backfill: CONFERIR antes, nunca UPDATE cego.
select a.clinic_id, lower(btrim(a.service)) nome,
       count(distinct s.id) candidatos, count(*) linhas
  from public.appointment a
  left join public.service s
    on s.clinic_id = a.clinic_id and lower(btrim(s.name)) = lower(btrim(a.service))
 group by 1,2 having count(distinct s.id) <> 1 order by linhas desc;

-- So depois, em lotes:
update public.appointment a set service_id = s.id
  from public.service s
 where s.clinic_id = a.clinic_id and lower(btrim(s.name)) = lower(btrim(a.service))
   and a.service_id is null
   and a.id in (select id from public.appointment where service_id is null limit 5000);

-- NAO renomear appointment.service: e projetada por public.professional_conflicts
-- (RETURNS TABLE(..., service text, ...)) e validada por appointment_service_not_blank_ck.
comment on column public.appointment.service is
  'Snapshot do nome do servico no momento do agendamento. A referencia ao catalogo e service_id.';
```

`quote_item.treatment` e `treatment.procedure`: mesmo desenho, um por vez, cada um com seu backfill conferido.

---

### 🟡 BAIXO — higiene

Agrupo aqui o que não morde hoje, mas é barato pagar agora.

**I. Índices**

```sql
-- I.1 Duplicata exata em patient (id, clinic_id). O orfao e alvo de 0 FKs;
--     patient_id_clinic_uk e alvo de 37. DROP INDEX falha (pertence a constraint).
alter table public.patient drop constraint patient_id_clinic_key;

-- I.2 11 indices redundantes por prefixo (nenhum e dono de constraint nem alvo de FK;
--     o indice maior que sobra continua cobrindo a RI). Sem CONCURRENTLY: roda na migration.
drop index public.appointment_entitlement_idx;
drop index public.entitlement_sale_item_idx;
drop index public.entitlement_service_idx;
drop index public.sale_item_service_idx;
drop index public.patient_document_appointment_idx;
drop index public.counter_clinic_idx;
drop index public.anamnesis_answer_anamnesis_idx;
drop index public.patient_test_patient_idx;
drop index public.professional_blocked_slot_lookup_idx;
drop index public.medical_note_template_secao_idx;
drop index public.cid10_code_idx;  -- text_pattern_ops so serve a LIKE literal; o front usa ILIKE

-- I.3 31 FKs sem indice de apoio (11 delas CASCADE). Tabelas de 0-33 linhas: custo zero hoje,
--     mas o CASCADE de clinic varre 8 tabelas em Seq Scan na mesma transacao.
--     Os parciais "WHERE col IS NOT NULL" SAO usaveis pela RI (igualdade e strict).
create index care_plan_professional_idx on public.care_plan (professional_id) where professional_id is not null;
create index cibelly_usage_professional_idx on public.cibelly_usage (professional_id) where professional_id is not null;
create index patient_vital_sign_professional_idx on public.patient_vital_sign (professional_id) where professional_id is not null;
create index patient_vital_sign_session_idx on public.patient_vital_sign (treatment_session_id) where treatment_session_id is not null;
create index patient_body_composition_professional_idx on public.patient_body_composition (professional_id) where professional_id is not null;
create index purchase_list_item_material_idx on public.purchase_list_item (material_id) where material_id is not null;
create index waiting_list_appointment_idx on public.waiting_list (appointment_id) where appointment_id is not null;
create index waiting_list_insurance_idx on public.waiting_list (insurance_id) where insurance_id is not null;
create index app_error_user_idx on public.app_error (user_id) where user_id is not null;
create index patient_odontogram_updated_by_idx on public.patient_odontogram (updated_by) where updated_by is not null;
create index whatsapp_inbound_message_updated_by_idx on public.whatsapp_inbound_message (updated_by) where updated_by is not null;
create index patient_reminder_created_by_idx on public.patient_reminder (created_by) where created_by is not null;
create index patient_reminder_updated_by_idx on public.patient_reminder (updated_by) where updated_by is not null;

create index class_group_enrollment_entitlement_idx on public.class_group_enrollment (entitlement_id, clinic_id);
create index material_supplier_supplier_idx on public.material_supplier (supplier_id, clinic_id);
create index purchase_quote_supplier_idx on public.purchase_quote (supplier_id);

create index care_plan_clinic_idx on public.care_plan (clinic_id);
create index class_group_enrollment_clinic_idx on public.class_group_enrollment (clinic_id);
create index patient_vital_sign_clinic_idx on public.patient_vital_sign (clinic_id);
create index patient_custom_question_clinic_idx on public.patient_custom_question (clinic_id);
create index patient_reminder_clinic_idx on public.patient_reminder (clinic_id);
create index supplier_clinic_idx on public.supplier (clinic_id);
create index material_supplier_clinic_idx on public.material_supplier (clinic_id);
create index purchase_quote_item_clinic_idx on public.purchase_quote_item (clinic_id);

-- I.4 Caso sutil: indice parcial com predicado ALHEIO a FK nao cobre a RI.
--     "patient_id = $1" nao implica "done = false". Manter o parcial (serve ao front)
--     e somar o completo.
create index patient_reminder_patient_idx on public.patient_reminder (patient_id, clinic_id);
create index class_group_attendance_patient_idx on public.class_group_attendance (patient_id, clinic_id);
create index class_group_attendance_clinic_idx on public.class_group_attendance (clinic_id);
create index whatsapp_inbound_message_patient_idx on public.whatsapp_inbound_message (patient_id, clinic_id);
create index whatsapp_inbound_message_clinic_idx on public.whatsapp_inbound_message (clinic_id);

-- I.5 material e supplier sao os unicos catalogos por clinica sem UNIQUE de nome.
--     Forma identica aos outros sete (lower(name), sem trim). 0 duplicatas hoje.
create unique index material_name_uk on public.material (clinic_id, lower(name));
create unique index supplier_name_uk on public.supplier (clinic_id, lower(name));

-- I.6 class_group aceita a mesma profissional em duas turmas simultaneas.
--     (duration_minutes || ' min')::interval NAO COMPILA: anytextcat e interval_in sao STABLE.
--     Usar interval_mul (IMMUTABLE). E incluir start_date/end_date, senao a constraint
--     proibe substituir uma turma encerrada por outra no mesmo horario.
create extension if not exists btree_gist;

alter table public.class_group
  add constraint class_group_professional_overlap_ex
  exclude using gist (
    professional_id with =,
    weekday with =,
    daterange(start_date, end_date, '[]') with &&,
    tsrange('2000-01-01'::date + start_time,
            '2000-01-01'::date + start_time + (duration_minutes * interval '1 minute')) with &&
  ) where (professional_id is not null);

alter table public.class_group
  add constraint class_group_room_overlap_ex
  exclude using gist (
    room_id with =, weekday with =,
    daterange(start_date, end_date, '[]') with &&,
    tsrange('2000-01-01'::date + start_time,
            '2000-01-01'::date + start_time + (duration_minutes * interval '1 minute')) with &&
  ) where (room_id is not null);

-- schedule_slot protege sala mas nao profissional (mesma lacuna assimetrica):
alter table public.schedule_slot
  add constraint schedule_slot_professional_overlap_ex
  exclude using gist (
    professional_id with =, weekday with =,
    tsrange('2000-01-01'::date + start_time, '2000-01-01'::date + end_time) with &&
  ) where (status = 'active'::schedule_slot_status and professional_id is not null);
```

**J. Triggers e colunas faltando**

```sql
-- drug_substance e a UNICA tabela com updated_at e sem tr_touch (a coluna mente).
create trigger tr_touch before update on public.drug_substance
  for each row execute function private.tg_touch_updated_at();

-- clinic_finance_setting: fecha o modulo Financeiro (o resto todo tem tr_audit).
-- (E parametro de carencia de inadimplencia, nao "comportamento do Financeiro" —
--  o cliente so escreve overdue_grace_days. Uma linha de DDL, sem motivo pra nao fazer.)
create trigger tr_audit after insert or update or delete
  on public.clinic_finance_setting for each row execute function private.tg_audit();

-- Catalogo de anamnese: templates ainda sem resposta sao editaveis/apagaveis sem autor.
-- (O ja respondido esta imune: tr_freeze copia question_text/answer_label pra dentro
--  da resposta, e as FKs NO ACTION abortam o cascade inteiro.)
create trigger tr_audit after insert or update or delete
  on public.anamnesis_template        for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete
  on public.anamnesis_section         for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete
  on public.anamnesis_question        for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete
  on public.anamnesis_question_option for each row execute function private.tg_audit();

-- Duas tabelas mutaveis sem updated_at. BACKFILL obrigatorio: sem ele, ADD COLUMN
-- DEFAULT now() grava "atualizado agora" em toda linha antiga — mentira nova
-- no lugar de informacao faltante.
alter table public.patient_test_result add column updated_at timestamptz;
update public.patient_test_result set updated_at = created_at where updated_at is null;
alter table public.patient_test_result
  alter column updated_at set default now(), alter column updated_at set not null;
create trigger tr_touch before update on public.patient_test_result
  for each row execute function private.tg_touch_updated_at();

alter table public.patient_service_entitlement
  add column created_at timestamptz, add column updated_at timestamptz;
update public.patient_service_entitlement
   set created_at = coalesce(created_at, purchased_at, now()),
       updated_at = coalesce(updated_at, purchased_at, now());
alter table public.patient_service_entitlement
  alter column created_at set default now(), alter column created_at set not null,
  alter column updated_at set default now(), alter column updated_at set not null;
create trigger tr_touch before update on public.patient_service_entitlement
  for each row execute function private.tg_touch_updated_at();

-- Codigo morto: duas guardas de FK cross-clinic escritas e nunca plugadas.
-- NAO plugar — o guard ja existe e e melhor (131 FKs compostas com clinic_id).
drop function if exists private.tg_assert_same_clinic();
drop function if exists private.tg_check_ref_clinic();
```

**K. Nomenclatura** (nenhum destes muda comportamento; faça quando estiver com paciência)

```sql
-- K.1 Oito triggers com prefixo tg_ (prefixo de FUNCAO) em vez de tr_ (prefixo de OBJETO).
--     Quatro deles chamam a MESMA funcao dos 81 tr_touch. Risco concreto: um
--     "drop trigger if exists tr_touch; create trigger tr_touch" deixa DOIS triggers na tabela.
alter trigger tg_care_plan_updated_at                on public.care_plan               rename to tr_touch;
alter trigger tg_patient_body_composition_updated_at on public.patient_body_composition rename to tr_touch;
alter trigger tg_patient_vital_sign_updated_at       on public.patient_vital_sign      rename to tr_touch;
alter trigger tg_platform_job_position_updated_at    on public.platform_job_position   rename to tr_touch;
alter trigger tg_carimba_plano on public.anamnesis                rename to tr_carimba_plano;
alter trigger tg_carimba_plano on public.patient_body_composition rename to tr_carimba_plano;
alter trigger tg_carimba_plano on public.patient_clinical_entry   rename to tr_carimba_plano;
alter trigger tg_carimba_plano on public.patient_test_result      rename to tr_carimba_plano;
alter trigger tg_carimba_plano on public.patient_vital_sign       rename to tr_carimba_plano;
alter trigger tg_cibelly_calcula_custo      on public.cibelly_usage            rename to tr_calcula_custo;
alter trigger tg_semeia_anamnese_da_clinica on public.clinic                   rename to tr_seed_anamnesis;
alter trigger tg_sincroniza_peso_altura     on public.patient_body_composition rename to tr_sync_peso_altura;

-- K.2 Cinco identificadores em portugues (nao um, como a auditoria disse).
alter index public.care_plan_um_ativo_por_paciente rename to care_plan_active_per_patient_uk;
alter table public.appointment rename constraint appointment_altura_plausivel to appointment_height_range_ck;
alter table public.appointment rename constraint appointment_peso_plausivel   to appointment_weight_range_ck;
alter table public.care_plan   rename constraint care_plan_alta_coerente            to care_plan_discharge_coherent_ck;
alter table public.care_plan   rename constraint care_plan_alta_nao_antecede_inicio to care_plan_discharge_after_start_ck;
alter index public.drug_substance_cas_uidx rename to drug_substance_cas_uk;
alter index public.quote_item_teeth_gin    rename to quote_item_teeth_idx;

-- K.3 129 FKs com sufixo _fkey (default do PG) contra 139 com _fk (convencao do projeto).
--     Verificado: nenhum embed do PostgREST em src/services nomeia constraint,
--     entao o rename em massa nao quebra o front. CHECAR COLISAO ANTES:
select con.conrelid::regclass, con.conname, regexp_replace(con.conname,'_fkey$','_fk')
  from pg_constraint con join pg_class c on c.oid=con.conrelid
  join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and con.contype='f' and con.conname like '%\_fkey'
   and exists (select 1 from pg_constraint x where x.conrelid=con.conrelid
                and x.conname=regexp_replace(con.conname,'_fkey$','_fk'));
-- Se voltar linhas, sao as duplicatas do item D: resolver la primeiro.
-- Depois gerar os ALTER com format() e rodar tudo numa transacao so.

-- K.4 tooth_status ('open, finished, extracted') tem UM consumidor: treatment.status.
--     Nenhuma coluna de dente usa. Opcao minima, zero risco:
alter type public.tooth_status rename to treatment_status;
comment on type public.treatment_status is
  'Ciclo de vida do tratamento. O rotulo legado "extracted" e heranca odontologica; nao criar novos.';

-- K.5 platform_job_position.status duplica o enum active_status (tabela global, poucas linhas).
alter table public.platform_job_position drop constraint platform_job_position_status_check;
alter table public.platform_job_position alter column status drop default;
alter table public.platform_job_position
  alter column status type public.active_status using status::public.active_status;
alter table public.platform_job_position alter column status set default 'active'::public.active_status;

-- K.6 Dominios de validacao nao aplicados. INSPECIONAR ANTES (um valor sujo derruba tudo):
select 'clinic_user.state' col, state val, count(*) from public.clinic_user group by 1,2
union all select 'professional.council_state', council_state, count(*) from public.professional group by 1,2;
-- Limpar tratando o padding de bpchar (btrim('  ') = '' NAO esta na lista de 27 UFs):
update public.clinic_user set cep = nullif(regexp_replace(cep,'[^0-9]','','g'),'') where cep is not null;
update public.clinic_user set state = nullif(upper(btrim(state)),'') where state is not null;
update public.clinic_user set whatsapp = nullif(regexp_replace(whatsapp,'[^0-9]','','g'),'') where whatsapp is not null;
update public.professional set council_state = nullif(upper(btrim(council_state)),'') where council_state is not null;
alter table public.clinic_user  alter column cep      type public.cep_digits   using cep::public.cep_digits;
alter table public.clinic_user  alter column state    type public.uf           using state::public.uf;
alter table public.clinic_user  alter column whatsapp type public.phone_digits using whatsapp::public.phone_digits;
alter table public.professional alter column council_state type public.uf      using council_state::public.uf;

-- K.7 money_brl adotado pela metade (11 colunas em numeric(12,2) cru).
--     Hoje e inocuo: o dominio nao tem CHECK, mesma base e escala. Usar ALTER TYPE,
--     nunca DROP+ADD (reordena a coluna e forca rewrite).
alter table public.service                 alter column price      type public.money_brl;
alter table public.insurance_service_price alter column price      type public.money_brl;
alter table public.tiss_guide              alter column total      type public.money_brl;
alter table public.tiss_guide_procedure    alter column unit_price type public.money_brl,
                                           alter column amount     type public.money_brl;
alter table public.sale_item   alter column amount      type public.money_brl;
alter table public.sale        alter column total       type public.money_brl;
alter table public.quote       alter column total       type public.money_brl;
alter table public.quote_item  alter column amount      type public.money_brl;
alter table public.receivable  alter column open_amount type public.money_brl;
alter table public.receivable  alter column net_amount  type public.money_brl;
comment on domain public.money_brl is
  'Toda coluna de dinheiro em BRL usa este dominio. Outra moeda (cibelly_usage.cost_usd) NAO usa.';

-- K.8 log_app_error escolhe a clinica com LIMIT 1 sem ORDER BY. Inocuo hoje (ninguem
--     e multi-clinica). Espelhar a ordem de auth_clinic_ids(), nao inventar outra:
--   (select cu.clinic_id from public.clinic_user cu
--      join public.clinic c on c.id = cu.clinic_id and c.status = 'active'
--     where cu.user_id = auth.uid() and cu.status::text = 'active'
--     order by cu.created_at asc, cu.clinic_id asc limit 1)
--   Aplicar por CREATE OR REPLACE mantendo assinatura, SECURITY DEFINER e search_path TO ''.

-- K.9 Dois booleanos ambiguos (a tabela tem done E done_at, dismissed E dismissed_at).
--     Conferir dependentes antes — RENAME nao atualiza corpo de PL/pgSQL — e ajustar
--     front + database.types.ts no MESMO deploy.
-- alter table public.patient_reminder         rename column done      to is_done;
-- alter table public.whatsapp_inbound_message rename column dismissed to is_dismissed;
```

---

## 4. ORDEM DE EXECUÇÃO

**Migration 1 — trilha de auditoria (só CREATE TRIGGER, zero risco, pode ir tudo junto)**
Itens A, B1, B2, e o bloco de `tr_audit`/`tr_touch` do item J. Nenhum toca dado, nenhum toca constraint. Faça primeiro: a partir daqui todas as migrações seguintes ficam auditadas.

**Migration 2 — GRANTs e políticas (sozinha, e com `lock_timeout`)**
Item C inteiro: o `REVOKE`/`GRANT` das 5 tabelas **e** os 66 `ALTER POLICY`. As duas metades têm que ir juntas — separadas, cada uma fecha só metade do buraco. Gere o DDL das políticas com o `SELECT format(...)`, revise a saída, rode em lotes. É só catálogo, mas pega `ACCESS EXCLUSIVE` por tabela.

**Migration 3 — FKs de `patient` (SOZINHA, sem nada junto)**
Item D. Rode a consulta de conferência de `confdeltype` **antes**, num terminal, e leia o resultado. Depois aplique. Depois teste manualmente uma exclusão de paciente sem histórico e uma com histórico, em transação revertida. É a única migração desta lista que pode mudar o comportamento de exclusão de dado clínico e financeiro.

**Migration 4 — pinagem de clínica + auto-referência (juntas, todas com 0-63 linhas)**
Itens E e F. Ordem obrigatória dentro dela: os dois `UNIQUE (id, clinic_id)` de `purchase_quote`/`purchase_list_item` **antes** das FKs, senão o `ADD FOREIGN KEY` erra com *"there is no unique constraint matching given keys"*. Revise cada `ON DELETE SET NULL` para confirmar que a lista de colunas está lá.

**Migration 5 — invariante do dono (sozinha, tem `CREATE INDEX CONCURRENTLY`)**
Item G. O `CONCURRENTLY` não roda dentro de bloco de transação, então não passa por `apply_migration` — rode manualmente ou troque por `CREATE UNIQUE INDEX` normal (7 linhas, instantâneo).

**Migration 6 — índices (juntos, sem `CONCURRENTLY`)**
Item I inteiro. Todas as tabelas envolvidas têm de 0 a 33 linhas; `CREATE INDEX` comum é instantâneo e roda dentro da migration. Exceção: as duas `EXCLUDE` de `class_group` e a de `schedule_slot` — teste o `ADD CONSTRAINT` num branch primeiro, porque uma expressão `STABLE` escondida derruba a migração inteira.

**Migration 7 — `service_id` em `appointment` (sozinha, com backfill em duas fases)**
Item H. Coluna + FK + índice numa migration; a consulta de conferência do backfill num terminal, com você lendo o resultado; o `UPDATE` em lotes numa segunda migration. Só depois `quote_item` e `treatment`, um de cada vez.

**Migration 8+ — nomenclatura (quando der vontade)**
Item K. Cada sub-item é independente. K.3 (renames `_fkey` → `_fk`) só **depois** da migration 3, senão a checagem de colisão bate nas duplicatas. K.6 (domínios) exige rodar a consulta de inspeção antes. Tudo que renomeia coluna (K.9) precisa de deploy atômico com o front e `database.types.ts` regenerado.

**Regenerar `src/types/database.types.ts`** depois das migrations 3, 4, 7 e 8 — os nomes de constraint aparecem em `Relationships`.

---

## 5. O QUE EU NÃO MEXERIA

**`appointment.starts_at` / `ends_at` como `timestamp without time zone`.** São as únicas duas colunas sem timezone do schema, e está certo. São **hora de parede**, geradas de `date + start_time`, e só se comparam entre si — nos dois índices de exclusão e em `professional_conflicts`, que recebe os parâmetros já como `timestamp`. Trocar por `timestamptz` derruba os índices de sobreposição (janela de double-booking), força rewrite da maior tabela do schema, e — o pior — cravaria um fuso num schema **multi-tenant**: clínica em Manaus ou Rio Branco passaria a gravar o instante errado. Só documente com `COMMENT`, e adicione um guard em CI que reprove qualquer função nova comparando essas colunas com `now()`.

**`profile.id -> auth.users(id)` em CASCADE.** É o padrão canônico de tabela-espelho do Supabase; todas as FKs internas do schema `auth` são CASCADE. `RESTRICT` quebraria o admin delete do GoTrue.

**`audit_log.record_id` polimórfico sem FK.** É a decisão certa. E as 44 linhas apontando para `whatsapp_message` (tabela extinta) são o comportamento **esperado** de um log append-only — o passado não deixou de acontecer porque o schema mudou. Um audit_log que só referenciasse tabelas atuais estaria quebrado.

**`patient` com FKs `NO ACTION` de `payment`, `sale`, `prescription`, `quote`, `tiss_guide`, `schedule_slot`.** Não é esquecimento, é regra: paciente com movimento financeiro não se apaga. Se um dia LGPD exigir, o caminho é anonimização/soft delete com guarda fiscal, **não** cascatear.

**`profile.email` como `text`.** Não aplique o domínio `email_address`. `profile` espelha `auth.users` e é escrita no signup — apertar o CHECK significa que um e-mail que o GoTrue aceite mas o regexp recuse **derruba o cadastro**. Trocar sujeira de dado por indisponibilidade de cadastro é péssimo negócio.

**`tiss_guide.frozen_council_state` como `text`.** É snapshot de guia emitida; tem que sobreviver a mudança de regra. Não aplique o domínio `uf`.

**`cibelly_price.provider` / `cibelly_usage.provider` como `text` + CHECK.** Enum é a escolha errada para valor que cresce por integração de terceiro — `ALTER TYPE ADD VALUE` não é reversível e tem restrições transacionais. Manter `text` ali é deliberado.

**`cibelly_usage.cost_usd` / `whisper_cost_usd` em `numeric(10,6)`.** Fora do `money_brl` de propósito: são dólares com 6 casas; escala 2 destruiria a precisão.

**`professional_commission.amount` guardando reais ou percentual.** A tabela tem `professional_commission_percentage_ck CHECK ((type <> 'percentage') OR (amount <= 100))` e `amount_ck CHECK (amount > 0)`. Não dá para gravar 1500%. E `UNIQUE (professional_id)` garante uma regra por profissional — não existe agregação natural. O nome polissêmico é cosmético; renomear quebra 5 RPCs sem ganho.

**`cibelly_whisper_price.id` boolean.** Existe `cibelly_whisper_price_id_check CHECK (id)`. Com PK + CHECK forçando `true`, a tabela é singleton **por construção**, sem trigger e sem convenção. É o idioma clássico em Postgres e está implementado corretamente. Trocar por `uuid` + índice parcial adiciona superfície sem adicionar garantia.

**`appointment` sem `tg_carimba_plano`.** A assimetria com as outras 5 tabelas tem razão: aquelas são registros *produzidos durante* um atendimento; `appointment` é agendada com antecedência e pode preceder o plano. E `carePlansService.ts:213` assina `linkAppointmentToPlan(id, planId: string | null)` — aceita `null`, ou seja, o produto suporta **desvincular**. Carimbar no INSERT inverteria o default e transformaria retornos, avaliações e remarcações em sessões do tratamento. O vínculo de negócio de `appointment` já é outro: `tr_debit_entitlement` consumindo `patient_service_entitlement`.

**`receivable_clinic_due_idx` e `payable_clinic_due_idx` (`clinic_id, due_date`).** Sim, `receivable` tem 20 índices para 7 linhas, e isso um dia vai precisar de poda. Mas **não** comece por esses dois: `(clinic_id, status, due_date)` não os cobre — com `status` no meio, `due_date` deixa de ser range-scannable quando a consulta não filtra status, que é exatamente o extrato por período do Financeiro. Se for cortar dessa família, o candidato é o oposto: substituir `(clinic_id, status, due_date)` por parciais sobre `(clinic_id, due_date)`, formato que `payable_open_idx` já usa. Decida com `idx_scan` sob tráfego real.

**Índices com `idx_scan = 0`.** Com `receivable` em 7 linhas, `appointment` em 31 e `patient` em 29, o planner escolhe Seq Scan de qualquer jeito. `idx_scan = 0` aqui não é evidência de nada. E **não rode `pg_stat_reset()`** para "começar a medir": apesar da sintaxe de `SELECT`, ele zera todas as estatísticas cumulativas do banco — junto vão `n_dead_tup`, `n_mod_since_analyze` e `n_ins_since_vacuum`, que são o que o autovacuum usa para decidir quando rodar. Salve um snapshot e compare o delta.

**`entitlement_*_fk` com prefixo abreviado, e `clinic_user_one_owner` sem `_uk`.** Nomes de constraint não aparecem em RLS nem em embed do PostgREST no seu front. O índice `clinic_user_one_owner` **é** único e parcial — é ele que materializa a regra, o sufixo não muda nada. (Nota: a justificativa que circulou — "estourava os 63 caracteres" — é falsa; o nome mais longo teria 40. Se for padronizar, padronize; mas não com essa desculpa.)

---

### Resumo em números

| severidade | itens | o que são |
|---|---|---|
| alto | 1 | `care_plan` apagável sem trilha |
| médio | 8 | auditoria com buracos, GRANT largo, FKs contraditórias, cascatas, pinagem, dono da clínica, serviço como texto |
| baixo | ~20 | índices, nomenclatura, domínios, triggers faltando |
| **vazamento entre clínicas** | **0** | — |

Nove achados foram derrubados na verificação cética, e em **seis** dos que sobreviveram o SQL originalmente proposto quebraria o sistema (invertia CASCADE, anulava `clinic_id` por SET NULL sem lista de colunas, derrubava índices de sobreposição, quebrava o signup, ou não compilava). As correções acima são as revisadas.