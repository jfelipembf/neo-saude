-- ═════════════════════════════════════════════════════════════════════════════
-- FIX — patient_care_plans() não devolvia a coluna opening_notes (20260730150000)
--
-- A RPC monta o JSON campo a campo (jsonb_build_object); só ALTER TABLE não
-- basta, precisa listar a coluna nova aqui também, senão o front nunca a vê.
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.patient_care_plans(p_patient uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_clinic uuid; v_out jsonb;
begin
  select p.clinic_id into v_clinic from public.patient p where p.id = p_patient;
  if v_clinic is null or not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_access_feature(v_clinic, variadic array['patients']) then
    raise exception 'Paciente nao encontrado nesta clinica.' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(t order by ord_started desc, ord_created desc), '[]'::jsonb)
    into v_out
  from (
    select cp.started_on as ord_started, cp.created_at as ord_created,
      jsonb_build_object(
      'id', cp.id,
      'title', cp.title,
      'photo_url', cp.photo_url,
      'started_on', cp.started_on,
      'finished_on', cp.finished_on,
      'planned_sessions', cp.planned_sessions,
      'status', cp.status,
      'setup_step', cp.setup_step,
      'opening_notes', cp.opening_notes,
      'discharge_notes', cp.discharge_notes,
      'baseline', cp.baseline,
      'discharge', cp.discharge,
      'professional', pr.name,
      'done_sessions', (
        select count(*) from public.appointment a
         where a.care_plan_id = cp.id and a.status = 'completed'
      ),
      'scheduled_sessions', (
        select count(*) from public.appointment a
         where a.care_plan_id = cp.id and a.status in ('scheduled','confirmed')
      ),
      'remaining_sessions', case
        when cp.planned_sessions is null then null
        else greatest(cp.planned_sessions - (
          select count(*) from public.appointment a
           where a.care_plan_id = cp.id and a.status = 'completed'), 0)
      end,
      -- Diagnosticos DESTE tratamento. Antes trazia os do paciente inteiro; com
      -- o vinculo em vigor, o cartao passa a mostrar o que pertence ao caso.
      'diagnoses', (
        select coalesce(jsonb_agg(e.content order by e.created_at), '[]'::jsonb)
          from public.patient_clinical_entry e
         where e.patient_id = cp.patient_id and e.kind = 'diagnosis'
           and e.care_plan_id = cp.id
      )
    ) as t
    from public.care_plan cp
    left join public.professional pr on pr.id = cp.professional_id
   where cp.patient_id = p_patient
  ) s;

  return v_out;
end;
$function$;
