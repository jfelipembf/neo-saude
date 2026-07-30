-- ═════════════════════════════════════════════════════════════════════════════
-- FIX — GRANTS que faltaram em odonto_procedure (20260730120000)
--
-- A tabela nasceu sem select/insert/delete para `authenticated`: os demais
-- cadastros (service, room...) foram criados pela role `supabase_admin`, que
-- tem ALTER DEFAULT PRIVILEGES concedendo essas permissões automaticamente a
-- `authenticated`/`anon` em toda tabela nova. `odonto_procedure` nasceu pela
-- role `postgres` (aplicada via ferramenta de migration do MCP), que só tem
-- default privileges para si mesma e para `service_role` — `authenticated`
-- fica de fora por padrão, então cada tabela criada por essa role PRECISA de
-- grant explícito (não é opcional, como parecia ser nos outros cadastros).
-- ═════════════════════════════════════════════════════════════════════════════

grant select, insert, delete on public.odonto_procedure to authenticated;
grant update (name, price) on public.odonto_procedure to authenticated;
