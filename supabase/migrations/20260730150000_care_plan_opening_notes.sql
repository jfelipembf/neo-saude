-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — OBSERVAÇÕES DA ABERTURA DO TRATAMENTO (TreatmentWizard, última etapa)
--
-- `care_plan` já guarda `discharge_notes` (texto livre da ALTA); faltava o
-- equivalente para o INÍCIO — o fisioterapeuta que quer registrar uma
-- observação livre ao abrir o caso (contexto trazido pelo paciente, combinado
-- com outro profissional, o que não coube nas etapas estruturadas de
-- diagnóstico/anamnese/testes) não tinha onde.
--
-- Coluna nova numa tabela existente: sem RLS/trigger próprios — herda os da
-- tabela (a policy de update de care_plan já vale por linha; aqui só falta
-- liberar a COLUNA, que é GRANT, não RLS).
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.care_plan add column opening_notes text;

comment on column public.care_plan.opening_notes is
  'Observações de texto livre da ABERTURA do tratamento (domain.ts '
  'CarePlan.observacaoAbertura) — última etapa do roteiro guiado '
  '(TreatmentWizard). Distinto de discharge_notes, que é da ALTA.';

grant update (opening_notes) on public.care_plan to authenticated;
