-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — COLUNAS DO MODO "DISTÂNCIA" (irmãs de reference_angle/measured_angle)
--
-- Mesmo raciocínio da migration de goniometria: reference_distance é a leitura
-- da foto de referência do CATÁLOGO; measured_distance é o valor cru medido em
-- CADA aplicação ao paciente. O modo "line" não tem número — é só referência
-- visual — por isso não ganha coluna própria.
--
-- Depende de: 20260724130000_physio_test_goniometry.sql (physio_test.kind),
--             20260724140000_patient_test_result_angle.sql (measured_angle),
--             20260724150000_physio_test_kind_line_distance.sql (enum values).
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.physio_test
  add column reference_distance numeric(8,1);

comment on column public.physio_test.reference_distance is
  'Só kind=distance: distância calculada a partir de goniometry_points na foto '
  'de referência do catálogo (mesma unidade escolhida pelo usuário — pixel '
  'relativo ou cm, quando calibrado na hora da medição).';

alter table public.physio_test
  add constraint physio_test_reference_distance_ck
    check (reference_distance is null or reference_distance >= 0);

grant insert (reference_distance) on public.physio_test to authenticated;
grant update (reference_distance) on public.physio_test to authenticated;

alter table public.patient_test_result
  add column measured_distance numeric(8,1);

comment on column public.patient_test_result.measured_distance is
  'Só kind=distance: a distância crua medida nesta aplicação. NULL para os '
  'demais kinds.';

alter table public.patient_test_result
  add constraint patient_test_result_measured_distance_ck
    check (measured_distance is null or measured_distance >= 0);

grant insert (measured_distance) on public.patient_test_result to authenticated;
