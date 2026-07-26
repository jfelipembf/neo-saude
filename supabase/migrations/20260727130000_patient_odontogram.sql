-- ═══════════════════════════════════════════════════════════════════════════
-- FICHA CORRENTE do odontograma — o estado ATUAL da boca do paciente
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Por que uma tabela nova, e não reaproveitar treatment_session_odontogram:
-- são dois conceitos diferentes que hoje estão colados.
--
--   · treatment_session_odontogram = SNAPSHOT HISTÓRICO, imutável: "como a boca
--     estava no dia 19, no fim daquele procedimento". 1–1 com a sessão. É o que
--     um conselho audita.
--   · patient_odontogram (esta)     = FICHA CORRENTE, sobrescrevível: "como a
--     boca está hoje". 1–1 com o paciente.
--
-- O TreatmentsPanel simulava a ficha corrente lendo o snapshot da ÚLTIMA sessão
-- que tivesse odontograma — o que só funciona enquanto todo exame vira
-- procedimento. A tela cheia (exame/avaliação, com ou sem a Cibelly) precisa
-- salvar SEM criar procedimento: o único caminho de escrita existente é a RPC
-- record_treatment_session, que no mesmo commit cria uma sessão na timeline do
-- prontuário E chama private.emit_session_billing — ou seja, salvar odontograma
-- por ali fabricaria procedimento-fantasma e mexeria no Financeiro. Um exame
-- clínico não é um ato faturável.
--
-- O `payload` é o mesmo jsonb do motor ({version, globals, teeth}) que a irmã
-- histórica guarda, de propósito: o front usa getOdontogramState/
-- loadOdontogramState nos dois sem tradução nenhuma.

create table public.patient_odontogram (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinic(id) on delete cascade,
  -- UNIQUE e não PK (contrato da fundação: a PK é sempre `id`); é o unique que
  -- garante o 1–1 com o paciente e é nele que o upsert se apoia.
  patient_id uuid not null,
  version    text generated always as (payload ->> 'version') stored,
  payload    jsonb not null,
  -- Quem encostou por último. Na irmã histórica não faz falta (a linha nasce e
  -- não muda mais); aqui a SOBRESCRITA é o modo normal de operar, então sem
  -- rastro ninguém descobre quem apagou marcação de quem.
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_odontogram_patient_uk unique (patient_id),
  constraint patient_odontogram_payload_ck check (jsonb_typeof(payload) = 'object'),
  constraint patient_odontogram_patient_fk
    foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id) on delete cascade
);

comment on table public.patient_odontogram is
  'Ficha corrente do odontograma: o estado ATUAL da boca, 1–1 com o paciente e '
  'sobrescrevível. Irmã de treatment_session_odontogram, que guarda o snapshot '
  'IMUTÁVEL de cada procedimento — aqui é "como está hoje", lá é "como ficou no '
  'dia 19". Salvar aqui NÃO cria procedimento nem toca no Financeiro, que é '
  'justamente o motivo de existir: exame clínico não é ato faturável.';

comment on column public.patient_odontogram.payload is
  'Snapshot do motor ({version, globals, teeth}) — o MESMO shape da irmã '
  'histórica, para o front carregar nos dois com loadOdontogramState sem traduzir.';

comment on column public.patient_odontogram.updated_by is
  'Último a salvar. Existe aqui e não na irmã histórica porque esta linha é '
  'sobrescrita no dia a dia: sem isso, marcação sumida não tem autor.';

create index patient_odontogram_clinic_idx on public.patient_odontogram (clinic_id);

create trigger tr_touch before update on public.patient_odontogram
  for each row execute function private.tg_touch_updated_at();

-- `updated_by` é carimbado por TRIGGER, não pela RPC. Motivo: a RPC é SECURITY
-- INVOKER (a RLS é a parede), então roda com os privilégios de quem chama — e
-- a coluna está de propósito FORA dos grants, para o cliente não forjar o
-- rastro. Escrever a coluna dentro da RPC dava "permission denied for column
-- updated_by" para todo usuário real; só passava no service_role, que ignora
-- grant de coluna. Trigger não passa por esse controle: mantém o rastro
-- inforjável E deixa a RPC gravar sem virar SECURITY DEFINER (que furaria a RLS).
create trigger tr_stamp_updated_by before insert or update on public.patient_odontogram
  for each row execute function private.tg_stamp_updated_by();

-- Sem tr_ref_clinic: a FK COMPOSTA acima (patient_id, clinic_id) já garante
-- declarativamente que o paciente é da mesma clínica — é o caminho preferido do
-- projeto (ver o comentário de private.tg_check_ref_clinic, que é o plano B
-- para tabelas sem o unique composto; patient tem patient_id_clinic_uk).

-- Odontograma só nasce em clínica de odontologia (mesma regra da irmã).
create trigger tr_specialty before insert on public.patient_odontogram
  for each row execute function private.tg_require_clinic_specialty('dentistry');


-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Mesma feature 'patients' que protege a irmã histórica e que o FeatureGuard da
-- rota /odontograma já exige no front. A parede real é aqui.
alter table public.patient_odontogram enable row level security;

create policy patient_odontogram_select on public.patient_odontogram
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy patient_odontogram_insert on public.patient_odontogram
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy patient_odontogram_update on public.patient_odontogram
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy patient_odontogram_delete on public.patient_odontogram
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

-- O `revoke all` PRIMEIRO é obrigatório, não zelo: o Supabase aplica
-- `alter default privileges in schema public grant all on tables to anon,
-- authenticated, service_role`, então toda tabela nova nasce com INSERT/UPDATE
-- em TODAS as colunas para `authenticated` — e os grants por coluna abaixo
-- seriam apenas aditivos sobre isso. Sem o revoke, o cliente poderia forjar
-- `updated_by` (o rastro de quem apagou marcação) e tentar escrever `clinic_id`.
-- Mesma armadilha já documentada em 20260722120300_professionals.sql:678-685.
revoke all on public.patient_odontogram from anon, authenticated;

-- `version` fica fora por ser coluna GERADA; `updated_by` fica fora porque quem
-- preenche é a RPC (auth.uid()), não o cliente — senão o rastro seria forjável.
grant select on public.patient_odontogram to authenticated;
grant insert (clinic_id, patient_id, payload) on public.patient_odontogram to authenticated;
grant update (payload) on public.patient_odontogram to authenticated;
grant delete on public.patient_odontogram to authenticated;


-- ── RPC de gravação, com trava de concorrência ───────────────────────────────
-- Um upsert cru do cliente perde escrita em silêncio: duas abas (ou a Cibelly
-- marcando por voz enquanto alguém edita à mão) e o último a salvar apaga o
-- trabalho do outro sem ninguém perceber. `p_expected_updated_at` é o carimbo
-- que o cliente leu quando abriu a ficha: se não bater mais, a RPC recusa e o
-- front avisa em vez de sobrescrever.
--
-- SECURITY INVOKER de propósito: as policies acima é que decidem quem escreve.
create or replace function public.save_patient_odontogram(
  p_patient            uuid,
  p_payload            jsonb,
  p_expected_updated_at timestamptz default null
)
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_clinic  uuid;
  v_updated timestamptz;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception 'Odontograma inválido: o payload precisa ser um objeto.'
      using errcode = '22023';
  end if;

  -- A clínica vem do paciente, nunca do cliente: assim não dá para gravar a
  -- boca de um paciente sob o clinic_id de outra clínica. O select passa pela
  -- RLS de patient, então paciente de fora simplesmente não é encontrado.
  select p.clinic_id into v_clinic
    from public.patient p
   where p.id = p_patient;

  if v_clinic is null then
    raise exception 'Paciente não encontrado.' using errcode = 'P0002';
  end if;

  -- `updated_by` NÃO entra aqui: quem carimba é a trigger tr_stamp_updated_by
  -- (ver o comentário dela acima). Esta função é SECURITY INVOKER e não teria
  -- privilégio na coluna.
  insert into public.patient_odontogram as po (clinic_id, patient_id, payload)
       values (v_clinic, p_patient, p_payload)
  on conflict (patient_id) do update
     set payload = excluded.payload
   where p_expected_updated_at is null
      or po.updated_at = p_expected_updated_at
  returning po.updated_at into v_updated;

  -- Zero linhas com carimbo informado = alguém salvou no meio do caminho.
  -- (Sem o carimbo o do-update roda sempre, então este ramo não dispara.)
  if v_updated is null then
    raise exception 'O odontograma deste paciente foi alterado por outra pessoa. Recarregue antes de salvar.'
      using errcode = '40001';
  end if;

  return v_updated;
end;
$$;

comment on function public.save_patient_odontogram(uuid, jsonb, timestamptz) is
  'Grava a ficha corrente do odontograma do paciente (upsert por patient_id). '
  'Deriva o clinic_id do próprio paciente — o cliente não escolhe a clínica. '
  'Com p_expected_updated_at, recusa a escrita se a linha mudou desde a leitura '
  '(evita lost update entre duas abas ou entre a voz e a edição manual).';

revoke execute on function public.save_patient_odontogram(uuid, jsonb, timestamptz) from public;
grant execute on function public.save_patient_odontogram(uuid, jsonb, timestamptz) to authenticated;
