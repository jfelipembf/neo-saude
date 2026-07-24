-- Funil de leads mais granular: separa "qualificação" de "novo", e
-- "compareceu" de "agendado" — padrão comum em CRMs de clínica (pesquisado:
-- Triagefy, Odonto Results, CloudGymManager). A ordem no enum acompanha a
-- ordem do funil na UI, mas quem manda na ordem visual é
-- LEAD_STATUS_ORDER (src/constants/leads.ts), não o ordinal do enum.
alter type public.lead_status add value 'qualifying' after 'new';
alter type public.lead_status add value 'qualified' after 'qualifying';
alter type public.lead_status add value 'attended' after 'scheduling';

comment on type public.lead_status is
  'domain.ts LeadStatus — as colunas do kanban de leads do Dashboard, na ordem '
  'do funil: new → qualifying → qualified → scheduling → attended → '
  'negotiating → converted (lost é terminal, fora da ordem principal).';
