-- list_leads(): substitui o select direto em public.lead que o app fazia,
-- acrescentando stage_since — o timestamp da última troca de status (via
-- audit_log), ou created_at se o lead nunca mudou de status. É o dado que
-- alimenta o alerta de "lead parado há X dias" no Kanban.
create or replace function public.list_leads()
returns table (
  id          uuid,
  clinic_id   uuid,
  name        text,
  email       text,
  phone       text,
  source      text,
  interest    text,
  notes       text,
  status      public.lead_status,
  created_at  timestamptz,
  patient_id  uuid,
  stage_since timestamptz
)
language sql
stable
security definer
set search_path to ''
as $$
  select l.id, l.clinic_id, l.name, l.email, l.phone, l.source, l.interest,
         l.notes, l.status, l.created_at, l.patient_id,
         coalesce(h.created_at, l.created_at) as stage_since
    from public.lead l
    left join lateral (
      select a.created_at
        from public.audit_log a
       where a.table_name = 'lead' and a.record_id = l.id
         and a.changed_fields @> array['status']
       order by a.created_at desc
       limit 1
    ) h on true
   where l.clinic_id = any(private.auth_clinic_ids())
     and private.can_access_feature(l.clinic_id, 'dashboard')
   order by l.created_at desc;
$$;

revoke all on function public.list_leads() from public, anon;
grant execute on function public.list_leads() to authenticated;
