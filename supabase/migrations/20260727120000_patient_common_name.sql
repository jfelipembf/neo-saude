-- Nome comum do paciente — como ele é geralmente chamado, quando difere do
-- nome completo (ex.: "José Felipe" no cadastro, "Felipe" no dia a dia).
alter table public.patient add column if not exists common_name text;

comment on column public.patient.common_name is
  'Como o paciente é geralmente chamado, quando difere do nome completo.';

-- Coluna nova não herda os GRANTs por coluna de 20260722120200_patients.sql
-- (revoke insert/update geral + allowlist explícita) — sem isto o PostgREST
-- devolve 403 em qualquer INSERT/UPDATE que toque common_name, mesmo com a
-- RLS de linha OK.
grant insert (common_name) on public.patient to authenticated;
grant update (common_name) on public.patient to authenticated;
