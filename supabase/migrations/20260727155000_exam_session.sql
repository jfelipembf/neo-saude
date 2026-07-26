-- ═══════════════════════════════════════════════════════════════════════════
-- O ATENDIMENTO DA TELA CHEIA VIRA LINHA NO PRONTUÁRIO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Antes, o exame feito no odontograma em tela cheia salvava SÓ em
-- public.patient_odontogram (a ficha corrente) — e nenhuma aba do perfil lê
-- essa tabela. Resultado: o dentista terminava o atendimento e não via registro
-- nenhum no paciente. A aba "Tratamento" é a única linha do tempo clínica em
-- odontologia, e ela vem da RPC patient_treatments, que só enxerga
-- treatment → treatment_session.
--
-- POR QUE NÃO ERA ASSIM DESDE O COMEÇO: a premissa era que gravar sessão criava
-- cobrança. É FALSO quando `p_amount` é omitido, e isso é garantia do BANCO, não
-- disciplina do front — verificado rodando como usuário autenticado:
--   · private.session_billing_decision devolve 'unbilled' no primeiro degrau
--     com amount null, então emit_session_billing nunca insere em receivable;
--   · a sessão nasce billing_status='unbilled' com receivable_id NULL;
--   · public.unbilled_sessions() filtra amount > 0 — a sessão não polui
--     a aba "A faturar";
--   · professional_earnings também filtra amount > 0 — não entra em Ganhos.
--
-- As duas gravações são COMPLEMENTARES, não alternativas: patient_odontogram é
-- "como a boca está hoje" (sobrescrevível), treatment_session_odontogram é
-- "como ficou no dia 26" (imutável e auditável — tr_audit cobre treatment e
-- treatment_session; patient_odontogram não tem auditoria e é sobrescrita).

-- ── 1 · Gravar o atendimento ─────────────────────────────────────────────────
--
-- Toda sessão precisa de um `treatment` pai (procedure é NOT NULL). Pedir ao
-- dentista para criar um tratamento no meio de um exame é o tipo de fricção que
-- ninguém aceita, então esta função acha-ou-cria um guarda-chuva do DIA e
-- pendura a sessão nele. Depois, com calma, ele reatribui a sessão ao
-- tratamento de verdade (ver move_treatment_session abaixo) e o guarda-chuva
-- vazio se desfaz sozinho.
--
-- ATÔMICA de propósito: fazer isso em duas chamadas do cliente deixaria um
-- `treatment` órfão no prontuário sempre que a segunda falhasse.
--
-- SECURITY INVOKER: a RLS é a parede. Os grants de coluna de `treatment` já
-- permitem o insert (clinic_id, patient_id, procedure, status).
create or replace function public.record_exam_session(
  p_patient      uuid,
  p_performed_on date default current_date,
  p_description  text default 'Exame clínico',
  p_professional uuid default null,
  p_actions      text[] default '{}',
  p_teeth        text[] default '{}',
  p_odontogram   jsonb default null,
  p_notes        text default null,
  p_client_token uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_clinic    uuid;
  v_treatment uuid;
  v_nome      text;
begin
  -- A clínica vem do PACIENTE, nunca do cliente: assim não dá para pendurar
  -- atendimento de um paciente sob o clinic_id de outra clínica. O select passa
  -- pela RLS de patient, então paciente de fora simplesmente não é encontrado.
  select p.clinic_id into v_clinic
    from public.patient p
   where p.id = p_patient;

  if v_clinic is null then
    raise exception 'Paciente não encontrado.' using errcode = 'P0002';
  end if;

  v_nome := 'Atendimento do dia — ' || to_char(p_performed_on, 'DD/MM/YYYY');

  -- Acha o guarda-chuva do dia. Dois atendimentos no mesmo dia para o mesmo
  -- paciente compartilham o mesmo — são o mesmo dia de cadeira.
  select t.id into v_treatment
    from public.treatment t
   where t.patient_id = p_patient
     and t.procedure = v_nome
   order by t.created_at
   limit 1;

  if v_treatment is null then
    insert into public.treatment (clinic_id, patient_id, procedure, status, started_at)
         values (v_clinic, p_patient, v_nome, 'open', p_performed_on)
      returning id into v_treatment;
  end if;

  -- p_amount OMITIDO: é o que mantém o atendimento fora do Financeiro.
  -- Passar valor aqui um dia, mesmo zero, mudaria isso — não passe.
  return public.record_treatment_session(
    p_treatment    => v_treatment,
    p_performed_on => p_performed_on,
    p_status_after => 'open',
    p_description  => p_description,
    p_professional => p_professional,
    p_notes        => p_notes,
    p_teeth        => p_teeth,
    p_actions      => p_actions,
    p_odontogram   => p_odontogram,
    p_client_token => p_client_token
  );
end;
$$;

comment on function public.record_exam_session(uuid, date, text, uuid, text[], text[], jsonb, text, uuid) is
  'Grava o atendimento do odontograma em tela cheia no prontuário: acha-ou-cria '
  'o tratamento "Atendimento do dia — dd/mm/aaaa" do paciente e pendura nele uma '
  'treatment_session SEM VALOR (não gera recebível, não aparece em "A faturar" '
  'nem em Ganhos). Atômica: sem ela, uma falha no meio deixaria tratamento órfão.';

revoke execute on function public.record_exam_session(uuid, date, text, uuid, text[], text[], jsonb, text, uuid) from public, anon;
grant execute on function public.record_exam_session(uuid, date, text, uuid, text[], text[], jsonb, text, uuid) to authenticated;


-- ── 2 · Reatribuir a sessão ao tratamento de verdade ─────────────────────────
--
-- `treatment_id` fica FORA dos grants de UPDATE de treatment_session (o cliente
-- só pode mexer em amount, description, notes, performed_on, professional_id) —
-- mover sessão de tratamento é operação estrutural do prontuário, não edição de
-- campo. Daí uma RPC própria, que valida o que um UPDATE solto não validaria:
-- origem e destino têm de ser do MESMO paciente.
--
-- SECURITY DEFINER porque precisa escrever uma coluna que o chamador não tem
-- permissão de escrever; a checagem de acesso é feita à mão logo no começo,
-- contra as mesmas funções que as policies usam.
create or replace function public.move_treatment_session(
  p_session   uuid,
  p_treatment uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clinic        uuid;
  v_paciente_orig uuid;
  v_paciente_dest uuid;
  v_antigo        uuid;
begin
  select ts.clinic_id, ts.treatment_id, t.patient_id
    into v_clinic, v_antigo, v_paciente_orig
    from public.treatment_session ts
    join public.treatment t on t.id = ts.treatment_id
   where ts.id = p_session;

  if v_clinic is null then
    raise exception 'Procedimento não encontrado.' using errcode = 'P0002';
  end if;

  -- SECURITY DEFINER fura a RLS, então a permissão é conferida aqui, com as
  -- mesmas funções que as policies de treatment_session usam.
  if not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'patients') then
    raise exception 'Sem permissão para mover este procedimento.' using errcode = '42501';
  end if;

  select t.patient_id into v_paciente_dest
    from public.treatment t
   where t.id = p_treatment and t.clinic_id = v_clinic;

  if v_paciente_dest is null then
    raise exception 'Tratamento de destino não encontrado.' using errcode = 'P0002';
  end if;

  -- A trava que importa: mover procedimento entre pacientes seria misturar
  -- prontuário de duas pessoas — o pior erro possível aqui.
  if v_paciente_orig is distinct from v_paciente_dest then
    raise exception 'O procedimento e o tratamento são de pacientes diferentes.'
      using errcode = '23514';
  end if;

  if v_antigo = p_treatment then return; end if;

  update public.treatment_session set treatment_id = p_treatment where id = p_session;

  -- O guarda-chuva "Atendimento do dia" existe só para hospedar a sessão até
  -- ela ter destino. Esvaziou, some — é o que impede o prontuário de encher de
  -- tratamento vazio. Só apaga o guarda-chuva automático: tratamento de
  -- verdade que ficou sem sessão é decisão de quem cuida do paciente, não nossa.
  delete from public.treatment t
   where t.id = v_antigo
     and t.procedure like 'Atendimento do dia — %'
     and not exists (select 1 from public.treatment_session s where s.treatment_id = t.id);
end;
$$;

comment on function public.move_treatment_session(uuid, uuid) is
  'Move um procedimento para outro tratamento DO MESMO PACIENTE. Existe como RPC '
  'porque treatment_id está fora dos grants de UPDATE do cliente. Apaga o '
  'tratamento "Atendimento do dia" de origem se ele ficar vazio.';

revoke execute on function public.move_treatment_session(uuid, uuid) from public, anon;
grant execute on function public.move_treatment_session(uuid, uuid) to authenticated;
