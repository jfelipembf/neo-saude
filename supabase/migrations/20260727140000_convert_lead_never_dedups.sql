-- A conversão de lead NUNCA mais vincula a paciente existente: sempre cria um
-- cadastro novo.
--
-- O que motivou: a dedup casava SÓ por telefone (clinic_id + phone), pegando o
-- mais antigo, sem olhar nome, CPF ou nascimento. Telefone compartilhado é o
-- caso comum, não a exceção (mãe e filho, casal, telefone comercial) — então o
-- lead era grudado no prontuário de OUTRA pessoa, e o app ainda navegava direto
-- para esse perfil errado logo após converter. Aconteceu de verdade: dois leads
-- distintos foram parar no mesmo paciente, que já tinha tratamentos e consultas
-- registrados.
--
-- Palpite por telefone não é prova de identidade. O preço aceito
-- conscientemente é o inverso: converter alguém que já era paciente cria um
-- cadastro repetido, que alguém junta depois. Cadastro duplicado se conserta;
-- histórico clínico misturado entre duas pessoas, não.
create or replace function public.convert_lead_to_patient(p_lead uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_clinic  uuid;
  v_name    text;
  v_email   text;
  v_phone   text;
  v_link    uuid;
  v_patient uuid;
begin
  select clinic_id, name, email, phone, patient_id
    into v_clinic, v_name, v_email, v_phone, v_link
    from public.lead where id = p_lead;

  if v_clinic is null then
    raise exception 'Lead não encontrado.' using errcode = '42501';
  end if;
  if not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'patients') then
    raise exception 'Sem permissão para converter leads em pacientes.' using errcode = '42501';
  end if;

  -- Já convertido antes: idempotente. Continua valendo — é o que impede o
  -- clique duplo (ou uma retentativa de rede) de criar um segundo cadastro.
  if v_link is not null then
    return jsonb_build_object('patient_id', v_link, 'created', false);
  end if;

  -- O paciente exige telefone com DDD (10–13 díg.). Lead sem isso não converte.
  if v_phone is null or length(v_phone) < 10 or length(v_phone) > 13 then
    raise exception 'O telefone do lead é inválido para cadastrar o paciente (precisa de DDD).'
      using errcode = '23514';
  end if;

  insert into public.patient (clinic_id, name, phone, email)
  values (v_clinic, v_name, v_phone, nullif(btrim(coalesce(v_email, '')), ''))
  returning id into v_patient;

  update public.lead
     set patient_id = v_patient, status = 'converted'
   where id = p_lead;

  -- `created` é sempre true agora; mantido no retorno porque o cliente lê
  -- (src/pages/Leads/Profile/LeadProfilePage.tsx) e para não quebrar contrato.
  return jsonb_build_object('patient_id', v_patient, 'created', true);
end;
$function$;

comment on function public.convert_lead_to_patient(uuid) is
  'Converte um lead em paciente: SEMPRE cria cadastro novo (nunca vincula a '
  'paciente existente — a dedup por telefone grudava o lead no prontuário de '
  'outra pessoa). Idempotente por lead.patient_id.';

revoke all on function public.convert_lead_to_patient(uuid) from public, anon;
grant execute on function public.convert_lead_to_patient(uuid) to authenticated;
