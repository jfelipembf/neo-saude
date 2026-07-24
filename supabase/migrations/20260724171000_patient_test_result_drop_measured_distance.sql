-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — GONIÔMETRO DIGITAL: SÓ O MODO ÂNGULO (cont.)
--
-- measured_distance nunca chegou a ser usado em produção (nenhuma linha com
-- o campo preenchido) — sai junto com o modo "distância".
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.patient_test_result
  drop column measured_distance;
