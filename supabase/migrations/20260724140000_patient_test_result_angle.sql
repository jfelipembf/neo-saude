-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — ÂNGULO MEDIDO NO RESULTADO DE TESTE (patient_test_result)
--
-- Testes kind='goniometry' medem um ÂNGULO, não só uma faixa/nível. Sem esta
-- coluna, duas aplicações que caem no MESMO nível ("90°-120°") ficam
-- indistinguíveis — perde a granularidade que importa pra acompanhar evolução
-- (91° → 119° é progresso real, mas os dois viram só "Amplitude parcial").
-- level_id/level_name/level_description continuam servindo para os DOIS kinds
-- (a interpretação clínica); measured_angle é só o número cru, só preenchido
-- quando o teste aplicado é kind='goniometry'.
--
-- Depende de: 20260724120000_physio_tests.sql (patient_test_result),
--             20260724130000_physio_test_goniometry.sql (physio_test.kind).
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.patient_test_result
  add column measured_angle numeric(5,1);

comment on column public.patient_test_result.measured_angle is
  'Só kind=goniometry: o ângulo cru medido nesta aplicação (a foto do momento '
  'não é persistida — o goniômetro digital é instrumento de medida, não laudo '
  'fotográfico). NULL para testes kind=scale.';

alter table public.patient_test_result
  add constraint patient_test_result_measured_angle_ck
    check (measured_angle is null or measured_angle between 0 and 360);

-- Registro imutável (mesmo padrão da tabela): só entra no INSERT, sem UPDATE.
grant insert (measured_angle) on public.patient_test_result to authenticated;
