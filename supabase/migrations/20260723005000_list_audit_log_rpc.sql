-- Leitura paginada da trilha de auditoria para a página "Auditoria" (Admin).
-- SECURITY INVOKER: a RLS de audit_log (clinic ∈ minhas E can_access_feature
-- 'admin') já restringe a admins da própria clínica — não-admin recebe vazio.
-- record_label é derivado do PRÓPRIO snapshot (old/new), sem ler as ~39 tabelas
-- de origem: funciona também para registros já excluídos.
create or replace function public.list_audit_log(
  p_clinic     uuid,
  p_table      text default null,
  p_action     public.audit_action default null,
  p_actor      uuid default null,
  p_from       timestamptz default null,
  p_to         timestamptz default null,
  p_search     text default null,
  p_before_at  timestamptz default null,
  p_before_id  uuid default null,
  p_limit      integer default 50
)
returns table (
  id uuid, created_at timestamptz, actor_id uuid, actor_name text,
  action public.audit_action, table_name text, record_id uuid,
  record_label text, changed_fields text[], old_data jsonb, new_data jsonb
)
language sql
stable
set search_path to ''
as $function$
  select a.id, a.created_at, a.actor_id,
         -- Ator resolvido na leitura: nome do perfil → nome do profissional
         -- vinculado (caso do dono-dentista) → e-mail → snapshot gravado.
         -- Nunca "Sistema" quando há actor_id (isso é decidido na tela).
         coalesce(pr.full_name, prof.name, pr.email, a.actor_name) as actor_name,
         a.action, a.table_name, a.record_id,
         coalesce(
           a.new_data->>'name',        a.old_data->>'name',
           a.new_data->>'full_name',   a.old_data->>'full_name',
           a.new_data->>'description', a.old_data->>'description',
           a.new_data->>'title',       a.old_data->>'title',
           a.new_data->>'treatment',   a.old_data->>'treatment',
           a.new_data->>'procedure',   a.old_data->>'procedure',
           a.new_data->>'code',        a.old_data->>'code',
           a.new_data->>'feature_key', a.old_data->>'feature_key',
           a.new_data->>'label',       a.old_data->>'label'
         ) as record_label,
         a.changed_fields, a.old_data, a.new_data
    from public.audit_log a
    left join public.profile pr on pr.id = a.actor_id
    left join public.professional prof
      on prof.user_id = a.actor_id and prof.clinic_id = a.clinic_id
   where a.clinic_id = p_clinic
     and (p_table  is null or a.table_name = p_table)
     and (p_action is null or a.action     = p_action)
     and (p_actor  is null or a.actor_id   = p_actor)
     and (p_from   is null or a.created_at >= p_from)
     and (p_to     is null or a.created_at <= p_to)
     and (p_search is null or (
            coalesce(pr.full_name, prof.name, pr.email, a.actor_name, '') ilike '%'||p_search||'%'
         or a.table_name ilike '%'||p_search||'%'
         or coalesce(a.new_data::text, '') ilike '%'||p_search||'%'
         or coalesce(a.old_data::text, '') ilike '%'||p_search||'%'
     ))
     -- Keyset (created_at, id) DESC: página estável mesmo com inserções novas.
     and (p_before_at is null
          or a.created_at < p_before_at
          or (a.created_at = p_before_at and a.id < p_before_id))
   order by a.created_at desc, a.id desc
   limit least(coalesce(p_limit, 50), 200);
$function$;

comment on function public.list_audit_log(uuid, text, public.audit_action, uuid, timestamptz, timestamptz, text, timestamptz, uuid, integer) is
  'Trilha de auditoria paginada (keyset por created_at,id) com filtros e rótulo '
  'do registro derivado do snapshot. Admin-only via RLS de audit_log.';

revoke all on function public.list_audit_log(uuid, text, public.audit_action, uuid, timestamptz, timestamptz, text, timestamptz, uuid, integer) from public, anon;
grant execute on function public.list_audit_log(uuid, text, public.audit_action, uuid, timestamptz, timestamptz, text, timestamptz, uuid, integer) to authenticated;
