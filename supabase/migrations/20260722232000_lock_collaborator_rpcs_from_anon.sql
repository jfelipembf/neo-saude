-- As RPCs de gestão de colaboradores nunca devem ser chamadas por anônimos.
-- Já barram internamente (auth.uid() nulo → sem permissão), mas removemos o
-- EXECUTE do anon por higiene (fecha o lint anon_security_definer_function_executable).
revoke execute on function public.is_clinic_admin(uuid) from anon;
revoke execute on function public.list_clinic_staff(uuid) from anon;
revoke execute on function public.set_collaborator(uuid, uuid, public.membership_status) from anon;
