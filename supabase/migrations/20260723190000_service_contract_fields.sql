-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — UNIFICAÇÃO SERVIÇOS + CONTRATOS
--
-- "Serviço" e "Contrato" viraram UM cadastro só (Administrativo → Serviços). Cada
-- item tem uma MODALIDADE:
--   · common  = Contrato Comum  — vigência por Duração & Período (ex.: 12 meses)
--   · package = Pacote de sessões — nº de sessões + validade de uso
-- `price` passa a ser o VALOR BASE (total do contrato/pacote), parcelável em até
-- `max_installments`. Estende a `service` de 20260723180000 (sem recriar RLS).
-- ═════════════════════════════════════════════════════════════════════════════

create type public.service_modality as enum ('common', 'package');
create type public.duration_unit    as enum ('days', 'weeks', 'months');

alter table public.service
  add column modality         public.service_modality not null default 'common',
  add column duration_qty     integer not null default 0,
  add column duration_unit    public.duration_unit not null default 'months',
  add column sessions         integer,
  add column max_installments integer not null default 1;

alter table public.service
  add constraint service_duration_qty_ck     check (duration_qty >= 0),
  add constraint service_sessions_ck          check (sessions is null or sessions >= 0),
  add constraint service_max_installments_ck  check (max_installments >= 1);

comment on column public.service.modality is
  'Contrato Comum (vigência por duração) ou Pacote de sessões (nº de sessões + validade de uso).';
comment on column public.service.price is
  'Valor Base — total do contrato/pacote, parcelável em até max_installments.';
comment on column public.service.duration_qty is
  'Comum: duração da vigência. Pacote: validade de uso. Unidade em duration_unit.';
comment on column public.service.sessions is
  'Pacote: quantidade de sessões. NULL no Contrato Comum.';

-- Novas colunas entram na lista de UPDATE permitido (clinic_id continua FORA —
-- mudar o tenant de uma linha é o vazamento).
grant update (modality, duration_qty, duration_unit, sessions, max_installments)
  on public.service to authenticated;
