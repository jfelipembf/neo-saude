-- Índices de cobertura de FK/consulta pra 20260724170000_appointment_clinical_note.

create index patient_document_appointment_idx
  on public.patient_document (appointment_id) where appointment_id is not null;
create index patient_document_appointment_clinic_idx
  on public.patient_document (appointment_id, clinic_id) where appointment_id is not null;
