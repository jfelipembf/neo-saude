-- Índices de cobertura de FK apontados pelo advisor de performance depois de
-- 20260724150000_sales_and_entitlements — mesmo ajuste feito nas migrations
-- anteriores (physio_tests_fk_indexes, professional_absence).

create index sale_created_by_idx on public.sale (created_by);

create index sale_item_service_clinic_idx on public.sale_item (service_id, clinic_id);

create index entitlement_service_clinic_idx  on public.patient_service_entitlement (service_id, clinic_id);
create index entitlement_sale_item_clinic_idx on public.patient_service_entitlement (sale_item_id, clinic_id);

create index appointment_entitlement_clinic_idx on public.appointment (entitlement_id, clinic_id);
