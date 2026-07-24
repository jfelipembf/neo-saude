-- A ordem FÍSICA do enum (enum_range) ficou
-- new, qualifying, qualified, negotiating, scheduling, attended, converted, lost
-- — 'negotiating' já vinha antes de 'scheduling' desde a criação do tipo, então
-- 'attended' (ADD VALUE ... AFTER 'scheduling') não caiu onde o comentário
-- anterior dizia. Postgres não permite reordenar valores de enum sem
-- reconstruir o tipo inteiro, e isso é desnecessário aqui: a ordem que
-- importa pra UI é LEAD_STATUS_ORDER (src/constants/leads.ts), não o
-- ordinal do enum — nenhuma query do app usa `order by status` ou
-- enum_range para montar as colunas do Kanban.
comment on type public.lead_status is
  'domain.ts LeadStatus — os valores possíveis de etapa do funil de leads. A '
  'ORDEM DO FUNIL na UI vem de LEAD_STATUS_ORDER (src/constants/leads.ts), '
  'NÃO da ordem física deste enum (que reflete só a ordem histórica dos ADD '
  'VALUE): new → qualifying → qualified → scheduling → attended → '
  'negotiating → converted, com lost como saída terminal em qualquer etapa.';
