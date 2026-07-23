-- Converte um lead em paciente (como o "Converter Prospect em Membro" do EVO):
-- cria o paciente a partir do lead OU vincula ao existente (mesmo telefone),
-- marca o lead como convertido e guarda o vínculo. Tudo numa transação.

-- Vínculo lead → paciente (evita reconverter e liga os dois).
alter table public.lead
  add column if not exists patient_id uuid references public.patient(id) on delete set null;

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
  v_created boolean := false;
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

  -- Já convertido antes: idempotente, só devolve o paciente vinculado.
  if v_link is not null then
    return jsonb_build_object('patient_id', v_link, 'created', false);
  end if;

  -- O paciente exige telefone com DDD (10–13 díg.). Lead sem isso não converte.
  if v_phone is null or length(v_phone) < 10 or length(v_phone) > 13 then
    raise exception 'O telefone do lead é inválido para cadastrar o paciente (precisa de DDD).'
      using errcode = '23514';
  end if;

  -- Dedup por telefone na MESMA clínica → vincula ao paciente existente.
  select p.id into v_patient
    from public.patient p
   where p.clinic_id = v_clinic and p.phone = v_phone
   order by p.created_at
   limit 1;

  if v_patient is null then
    insert into public.patient (clinic_id, name, phone, email)
    values (v_clinic, v_name, v_phone, nullif(btrim(coalesce(v_email, '')), ''))
    returning id into v_patient;
    v_created := true;
  end if;

  update public.lead
     set patient_id = v_patient, status = 'converted'
   where id = p_lead;

  return jsonb_build_object('patient_id', v_patient, 'created', v_created);
end;
$function$;

comment on function public.convert_lead_to_patient(uuid) is
  'Converte um lead em paciente: cria ou vincula ao paciente de mesmo telefone, '
  'marca o lead como converted e grava lead.patient_id. Idempotente.';

revoke all on function public.convert_lead_to_patient(uuid) from public, anon;
grant execute on function public.convert_lead_to_patient(uuid) to authenticated;
