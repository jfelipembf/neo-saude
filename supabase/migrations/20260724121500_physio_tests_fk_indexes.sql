-- Índices de cobertura de FK apontados pelo advisor de performance depois de
-- 20260724120000_physio_tests — mesmo ajuste feito em professional_absence
-- (professional_absence_clinic_idx): toda FK composta (x_id, clinic_id) só tem
-- o lado esquerdo coberto pelo índice "de uso" (ex.: patient_test_patient_idx
-- começa por patient_id); falta o índice liso em clinic_id/test_id/etc. para o
-- lado "clinic_id sozinho" e para as demais FKs da linha.

create index physio_test_level_clinic_idx on public.physio_test_level (clinic_id);

create index patient_test_clinic_idx on public.patient_test (clinic_id);
create index patient_test_test_idx    on public.patient_test (test_id);

create index patient_test_result_clinic_idx       on public.patient_test_result (clinic_id);
create index patient_test_result_test_idx         on public.patient_test_result (test_id);
create index patient_test_result_professional_idx on public.patient_test_result (professional_id);
create index patient_test_result_level_idx         on public.patient_test_result (level_id);
