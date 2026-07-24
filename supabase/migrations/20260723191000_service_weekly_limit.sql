-- Contrato Comum: limite de sessões por SEMANA (ex.: "Hidroginástica 2x" = 2).
-- Nulável — só faz sentido no Contrato Comum; no Pacote de sessões fica NULL.
alter table public.service add column weekly_limit integer;

alter table public.service
  add constraint service_weekly_limit_ck check (weekly_limit is null or weekly_limit >= 0);

comment on column public.service.weekly_limit is
  'Contrato Comum: limite de sessões por semana (ex.: Hidroginástica 2x = 2). '
  'NULL = sem limite / não se aplica (Pacote de sessões).';

grant update (weekly_limit) on public.service to authenticated;
