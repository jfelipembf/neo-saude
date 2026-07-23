-- ─────────────────────────────────────────────────────────────────────────────
-- Cadastro completo do colaborador — dados que a CLÍNICA mantém sobre o seu
-- funcionário (sexo, nascimento, WhatsApp, endereço). Moram em clinic_user, e
-- não em profile: profile é do USUÁRIO (login) e atravessa clínicas; o cadastro
-- é do vínculo empregatício com ESTA clínica. Preenchido pelo admin no
-- formulário de novo colaborador (aba Colaboradores).
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.clinic_user
  add column if not exists sex public.gender,
  add column if not exists birth_date date,
  add column if not exists whatsapp text,
  add column if not exists cep text,
  add column if not exists state char(2),
  add column if not exists city text,
  add column if not exists neighborhood text,
  add column if not exists "number" text;

-- list_clinic_staff passa a devolver o cadastro completo.
-- O RETORNO mudou ⇒ drop + create (create or replace não altera assinatura).
drop function public.list_clinic_staff(uuid);
create function public.list_clinic_staff(p_clinic uuid)
returns table (
  clinic_user_id    uuid,
  user_id           uuid,
  full_name         text,
  email             text,
  avatar_url        text,
  phone             text,
  access_profile_id uuid,
  role_name         text,
  status            public.membership_status,
  sex               public.gender,
  birth_date        date,
  whatsapp          text,
  cep               text,
  state             text,
  city              text,
  neighborhood      text,
  "number"          text
)
language sql
stable
security definer
set search_path to ''
as $$
  select
    cu.id, cu.user_id, p.full_name, p.email, p.avatar_url, p.phone,
    cu.access_profile_id, ap.name, cu.status,
    cu.sex, cu.birth_date, cu.whatsapp, cu.cep, cu.state::text, cu.city,
    cu.neighborhood, cu."number"
  from public.clinic_user cu
  join public.profile p         on p.id  = cu.user_id
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
