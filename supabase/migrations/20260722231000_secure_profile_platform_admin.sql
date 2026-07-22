-- CRÍTICO: impede auto-elevação a platform_admin.
-- A policy profile_update_self filtra só por linha (id = auth.uid()); a coluna
-- platform_admin ficava escrevível porque 'authenticated' tinha UPDATE em nível
-- de tabela. Removemos o grant amplo e devolvemos só as colunas que o usuário
-- legitimamente edita no próprio perfil. platform_admin/id/created_at/updated_at
-- só mudam via service_role (Edge Function / backend), nunca pelo cliente.

revoke insert, update on public.profile from authenticated;

grant insert (id, full_name, email, avatar_url, phone) on public.profile to authenticated;
grant update (full_name, email, avatar_url, phone)      on public.profile to authenticated;

-- Defesa em profundidade: mesmo que algum grant volte por engano no futuro,
-- este trigger barra qualquer troca de platform_admin fora do service_role.
create or replace function private.tg_guard_platform_admin()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.platform_admin is distinct from old.platform_admin
     and coalesce(current_setting('request.jwt.claim.role', true),
                  current_setting('role', true)) <> 'service_role' then
    raise exception 'platform_admin não pode ser alterado por este papel.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists tr_guard_platform_admin on public.profile;
create trigger tr_guard_platform_admin
  before update on public.profile
  for each row execute function private.tg_guard_platform_admin();
