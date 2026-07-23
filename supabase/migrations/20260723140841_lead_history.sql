-- ─────────────────────────────────────────────────────────────────────────────
-- Histórico do lead: o painel lateral do Kanban precisa mostrar, para UM
-- contato, quando o status mudou e o que foi anotado — com data e autor.
-- `lead` ainda não tinha tr_audit ligada (só quote/quote_item têm, ver
-- commercial.sql); liga aqui, mesmo padrão.
-- ─────────────────────────────────────────────────────────────────────────────
create trigger tr_audit after insert or update or delete on public.lead
  for each row execute function private.tg_audit();

-- A RPC de leitura NÃO pode reusar list_audit_log: aquela é admin-only (RLS de
-- audit_log exige feature 'admin'), e quem vê o Kanban tem só 'dashboard'.
-- SECURITY DEFINER abre a leitura de audit_log, mas o PORTÃO aqui é o mesmo da
-- leitura do próprio lead — não vira brecha para ver auditoria de outra coisa.
create or replace function public.list_lead_history(p_lead uuid)
returns table (
  id             uuid,
  created_at     timestamptz,
  actor_name     text,
  action         public.audit_action,
  changed_fields text[],
  old_data       jsonb,
  new_data       jsonb
)
language sql
stable
security definer
set search_path to ''
as $$
  select a.id, a.created_at, a.actor_name, a.action, a.changed_fields, a.old_data, a.new_data
    from public.audit_log a
    join public.lead l on l.id = p_lead
   where a.table_name = 'lead'
     and a.record_id  = p_lead
     and a.clinic_id  = l.clinic_id
     and l.clinic_id  = any(private.auth_clinic_ids())
     and private.can_access_feature(l.clinic_id, 'dashboard')
   order by a.created_at desc;
$$;

comment on function public.list_lead_history(uuid) is
  'Histórico de mudanças de UM lead (status, observação…) para o painel lateral '
  'do Kanban. Lê audit_log via SECURITY DEFINER porque a RLS de audit_log é '
  'admin-only — aqui o portão de leitura é o mesmo do próprio lead (dashboard), '
  'não vaza para auditoria de outras entidades.';

revoke all on function public.list_lead_history(uuid) from public, anon;
grant execute on function public.list_lead_history(uuid) to authenticated;
