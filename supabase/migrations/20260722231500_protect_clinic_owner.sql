-- Protege o DONO/fundador da clínica de ser gerenciado por outros admins
-- (troca de cargo, suspensão, exclusão, redefinição de senha). O dono é o
-- membro ativo mais antigo sem quem o convidou (invited_by null).

-- 1) Marca de dono.
alter table public.clinic_user add column if not exists is_owner boolean not null default false;

with founder as (
  select distinct on (clinic_id) id
  from public.clinic_user
  where status = 'active'
  order by clinic_id, (invited_by is null) desc, joined_at asc
)
update public.clinic_user cu set is_owner = true
from founder f where cu.id = f.id;

-- No máximo um dono por clínica.
create unique index if not exists clinic_user_one_owner
  on public.clinic_user (clinic_id) where is_owner;

-- 2) is_owner NÃO pode ser escrito pelo cliente (a coluna nova herdaria o grant
--    amplo de authenticated). Só access_profile_id/status seguem editáveis;
--    a criação continua pela Edge Function (service_role, ignora estes grants).
revoke insert, update on public.clinic_user from authenticated;
grant insert (clinic_id, user_id, access_profile_id, status, invited_by)
  on public.clinic_user to authenticated;
grant update (access_profile_id, status)
  on public.clinic_user to authenticated;

-- 3) RLS: a linha do dono só é alterada/apagada pelo próprio dono.
drop policy clinic_user_update on public.clinic_user;
create policy clinic_user_update on public.clinic_user for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
    and (not is_owner or user_id = (select auth.uid()))
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

drop policy clinic_user_delete on public.clinic_user;
create policy clinic_user_delete on public.clinic_user for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
    and user_id <> (select auth.uid())
    and not is_owner
  );

-- 4) set_collaborator é SECURITY DEFINER (ignora a RLS acima), então o guard do
--    dono precisa morar DENTRO dele também.
create or replace function public.set_collaborator(
  p_clinic_user uuid,
  p_access_profile uuid default null,
  p_status membership_status default null
) returns void
language plpgsql security definer set search_path to ''
as $function$
declare
  v_clinic uuid;
  v_target uuid;
  v_is_owner boolean;
begin
  select clinic_id, user_id, is_owner into v_clinic, v_target, v_is_owner
    from public.clinic_user where id = p_clinic_user;

  if v_clinic is null or not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'admin') then
    raise exception 'Sem permissão para gerenciar colaboradores.' using errcode = '42501';
  end if;

  -- O dono só é gerenciado por ele mesmo.
  if v_is_owner and v_target <> (select auth.uid()) then
    raise exception 'O proprietário da conta não pode ser gerenciado por outro administrador.'
      using errcode = '42501';
  end if;

  if p_access_profile is not null then
    if not exists (select 1 from public.access_profile
                   where id = p_access_profile and clinic_id = v_clinic) then
      raise exception 'Cargo inválido para esta clínica.' using errcode = '23503';
    end if;
    update public.clinic_user set access_profile_id = p_access_profile where id = p_clinic_user;
  end if;

  if p_status is not null then
    update public.clinic_user set status = p_status where id = p_clinic_user;
  end if;
end;
$function$;
