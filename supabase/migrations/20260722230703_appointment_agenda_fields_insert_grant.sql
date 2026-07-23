-- ─────────────────────────────────────────────────────────────────────────────
-- O INSERT em appointment é concedido POR COLUNA (padrão deste schema). As três
-- colunas novas do modal da Agenda (migration appointment_agenda_fields) não
-- entraram na lista, e coluna sem grant faz o Postgres negar o INSERT INTEIRO
-- (403 no PostgREST) quando o payload a inclui — foi o que travou o "Agendar".
-- ─────────────────────────────────────────────────────────────────────────────
grant insert (notes, color, send_confirmation) on public.appointment to authenticated;
