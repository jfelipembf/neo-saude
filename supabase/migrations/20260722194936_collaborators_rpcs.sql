-- Lista os COLABORADORES da clínica (membros com login) para a aba do
-- Administrativo — EXCLUI os especialistas (quem tem registro em professional).
-- SECURITY DEFINER porque cruza clinic_user × profile × access_profile e a RLS
-- de profile não deixaria ler o de outro usuário; o portão é a permissão 'admin'.
create or replace function public.list_clinic_staff(p_clinic uuid)
returns table (
  clinic_user_id    uuid,
  user_id           uuid,
  full_name         text,
  email             text,
  avatar_url        text,
  phone             text,
  access_profile_id uuid,
  role_name         text,
  status            public.membership_status
)
language sql
stable
security definer
set search_path to ''
as $$
  select
    cu.id, cu.user_id, p.full_name, p.email, p.avatar_url, p.phone,
    cu.access_profile_id, ap.name, cu.status
  from public.clinic_user cu
  join public.profile p        on p.id  = cu.user_id
  join public.access_profile ap on ap.id = cu.access_profile_id
  where cu.clinic_id = p_clinic
    and private.can_edit_feature(p_clinic, 'admin')
    and not exists (
      select 1 from public.professional pr
      where pr.user_id = cu.user_id and pr.clinic_id = p_clinic
    )
  order by p.full_name nulls last, p.email;
$$;

grant execute on function public.list_clinic_staff(uuid) to authenticated;

-- Admin altera o CARGO e/ou o STATUS de um colaborador. `null` = não mexe.
create or replace function public.set_collaborator(
  p_clinic_user    uuid,
  p_access_profile uuid default null,
  p_status         public.membership_status default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_clinic uuid;
begin
  select clinic_id into v_clinic from public.clinic_user where id = p_clinic_user;
  if v_clinic is null or not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'admin') then
    raise exception 'Sem permissão para gerenciar colaboradores.' using errcode = '42501';
  end if;

  if p_access_profile is not null then
    if not exists (
      select 1 from public.access_profile
      where id = p_access_profile and clinic_id = v_clinic
    ) then
      raise exception 'Cargo inválido para esta clínica.' using errcode = '23503';
    end if;
    update public.clinic_user set access_profile_id = p_access_profile where id = p_clinic_user;
  end if;

  if p_status is not null then
    update public.clinic_user set status = p_status where id = p_clinic_user;
  end if;
end;
$$;

grant execute on function public.set_collaborator(uuid, uuid, public.membership_status) to authenticated;
