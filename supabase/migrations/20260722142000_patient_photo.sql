-- Foto (avatar) do paciente — opcional; a UI cai nas iniciais quando vazio.
alter table public.patient add column if not exists photo_url text;

comment on column public.patient.photo_url is
  'URL do avatar do paciente (cai nas iniciais quando não houver).';
