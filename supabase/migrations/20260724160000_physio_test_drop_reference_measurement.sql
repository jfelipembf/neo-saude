-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — REMOVE A "MEDIÇÃO DE REFERÊNCIA" DO CATÁLOGO
--
-- Administrativo → Testes é CADASTRO (nome, tipo, instruções, níveis, foto
-- ilustrativa) — não é onde se REALIZA um teste. A medição de verdade
-- (foto + pontos + ângulo/distância) acontece só na aba Testes do PACIENTE,
-- registrada em patient_test_result.measured_angle/measured_distance.
--
-- goniometry_points/reference_angle/reference_distance em physio_test
-- guardavam uma medição de EXEMPLO no catálogo — hoje sem uso (o form de
-- Admin não tem mais a ferramenta interativa), então saem em vez de ficarem
-- mortos. `image_url` continua — é só a foto ilustrativa do teste, igual
-- sempre foi para kind='scale'.
--
-- Depende de: 20260724130000_physio_test_goniometry.sql,
--             20260724151000_physio_test_distance_columns.sql.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.physio_test
  drop column goniometry_points,
  drop column reference_angle,
  drop column reference_distance;
