-- Wrapper público de `private.can_edit_feature(clinic, 'admin')` — usado pela
-- Edge Function (que chama com o JWT do próprio usuário) para confirmar que
-- quem cria/gerencia colaborador é admin da clínica.
create or replace function public.is_clinic_admin(p_clinic uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select private.can_edit_feature(p_clinic, 'admin');
$$;

grant execute on function public.is_clinic_admin(uuid) to authenticated;
