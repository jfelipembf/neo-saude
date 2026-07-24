-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — GONIOMETRIA NO CATÁLOGO DE TESTES (physio_test.kind)
--
-- Um segundo "kind" de teste além da escala: GONIOMETRIA — o fisioterapeuta
-- fotografa o paciente e mede o ângulo de amplitude articular posicionando 3
-- pontos sobre a foto (A · vértice · C). Reaproveita physio_test.image_url (já
-- existe) para a foto de referência com os pontos — não cria uma segunda
-- coluna de imagem. Os NÍVEIS (physio_test_level) continuam servindo para os
-- dois kinds: em goniometria, viram a interpretação da faixa de graus (ex.:
-- "0°-90° = amplitude limitada").
--
-- Depende de: 20260724120000_physio_tests.sql (physio_test).
-- ═════════════════════════════════════════════════════════════════════════════

create type public.physio_test_kind as enum ('scale', 'goniometry');

alter table public.physio_test
  add column kind              public.physio_test_kind not null default 'scale',
  add column goniometry_points jsonb,
  add column reference_angle   numeric(5,1);

comment on column public.physio_test.kind is
  'scale = interpretação por pontuação/tempo (a maioria). goniometry = medição '
  'de ângulo sobre foto (physio_test.image_url é a foto com os pontos).';
comment on column public.physio_test.goniometry_points is
  'Só kind=goniometry: os 3 pontos [A, vértice, C] em percentual (0-100) da '
  'foto — [{x,y},{x,y},{x,y}]. Percentual, não pixel: acompanha a foto em '
  'qualquer tamanho de tela.';
comment on column public.physio_test.reference_angle is
  'Só kind=goniometry: ângulo (graus) calculado a partir de goniometry_points na '
  'foto de referência do catálogo — não é medição de paciente (isso é '
  'patient_test_result, que ainda registra por NÍVEL, não por ângulo cru).';

alter table public.physio_test
  add constraint physio_test_reference_angle_ck
    check (reference_angle is null or reference_angle between 0 and 360);

-- Colunas novas entram no GRANT de escrita já existente (mesmas policies de
-- RLS da tabela — só faltava liberar as colunas).
grant insert (kind, goniometry_points, reference_angle) on public.physio_test to authenticated;
grant update (kind, goniometry_points, reference_angle) on public.physio_test to authenticated;
