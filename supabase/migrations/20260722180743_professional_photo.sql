-- Foto (avatar) do profissional — opcional; a UI cai nas iniciais quando vazio.
alter table public.professional add column if not exists photo_url text;

comment on column public.professional.photo_url is
  'URL do avatar do profissional (cai nas iniciais quando não houver).';
