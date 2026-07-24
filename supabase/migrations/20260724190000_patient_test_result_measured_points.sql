-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — RÉGUA (PONTOS) NO CARD DE RESULTADO (patient_test_result)
--
-- O card de resultado (aba Testes do paciente) passa a desenhar a régua do
-- goniômetro (as 2 linhas A–vértice–C) sobre a foto, não só o ângulo em
-- número — precisa dos 3 pontos (percentuais 0–100, mesmo formato de
-- physio_test.goniometry_points antes de ser removida) usados NESTA
-- aplicação. NULL para kind=scale ou quando não há foto anexada.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.patient_test_result
  add column measured_points jsonb;

comment on column public.patient_test_result.measured_points is
  'Só kind=goniometry com foto: os 3 pontos (A·vértice·C, percentual 0–100) '
  'usados nesta medição — desenha a régua sobre image_url no card de '
  'resultado. NULL quando não há foto/medição.';

-- Registro imutável (mesmo padrão da tabela): só entra no INSERT, sem UPDATE.
grant insert (measured_points) on public.patient_test_result to authenticated;
