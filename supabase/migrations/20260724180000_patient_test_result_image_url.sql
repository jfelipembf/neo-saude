-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — FOTO DA MEDIÇÃO NO RESULTADO DE TESTE (patient_test_result)
--
-- O card de resultado (aba Testes do paciente) passa a mostrar a foto usada
-- na medição, não só o valor/nível — reverte a decisão anterior de não
-- persistir a foto (measured_angle.comment dizia "a foto do momento não é
-- persistida"). Guarda o PATH do Storage (mesmo padrão de physio_test.image_url),
-- assinado na leitura. NULL para testes kind=scale (sem ferramenta de foto) ou
-- quando o profissional não anexou foto na medição.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.patient_test_result
  add column image_url text;

comment on column public.patient_test_result.image_url is
  'PATH no bucket clinic-assets da foto usada na medição desta aplicação '
  '(assinado na leitura, mesmo padrão de physio_test.image_url). NULL quando '
  'o teste não usa foto (kind=scale) ou nenhuma foto foi anexada.';

-- Registro imutável (mesmo padrão da tabela): só entra no INSERT, sem UPDATE.
grant insert (image_url) on public.patient_test_result to authenticated;
