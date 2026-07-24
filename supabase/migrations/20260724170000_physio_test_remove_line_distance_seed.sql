-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — GONIÔMETRO DIGITAL: SÓ O MODO ÂNGULO
--
-- Os modos "linha" (referência visual) e "distância" foram descontinuados —
-- o goniômetro digital fica só com kind='goniometry' (ângulo). Remove os 2
-- testes de demonstração desses kinds do catálogo real. Sem
-- patient_test/patient_test_result referenciando estes ids (checado antes
-- de aplicar) — DELETE seguro.
-- ═════════════════════════════════════════════════════════════════════════════

delete from public.physio_test_level
  where test_id in ('8075cd8c-282c-4bc0-bd20-2e450911a54e', '14f32d22-0890-454b-822a-1e4de7d101fa');

delete from public.physio_test
  where id in ('8075cd8c-282c-4bc0-bd20-2e450911a54e', '14f32d22-0890-454b-822a-1e4de7d101fa');
