-- ACHADO PERTENCE A UM DIAGNÓSTICO — o painel de Diagnóstico deixou de ser
-- duas listas soltas (diagnóstico de um lado, achado do outro) e virou uma
-- lista de diagnósticos, cada um com os achados clínicos dele embaixo.
--
-- `diagnosis_id` aponta para OUTRA linha desta mesma tabela (kind=diagnosis)
-- — self-reference, então precisa da unique(id, clinic_id) primeiro (FK
-- composta exige unique nas colunas referenciadas; id sozinho já é PK, mas o
-- par com clinic_id não existia ainda).
alter table public.patient_clinical_entry
  add constraint patient_clinical_entry_id_clinic_uk unique (id, clinic_id);

alter table public.patient_clinical_entry
  add column diagnosis_id uuid;

comment on column public.patient_clinical_entry.diagnosis_id is
  'Só para kind=problems: a qual diagnóstico (outra linha, kind=diagnosis) este achado pertence. Nulo = achado lançado antes deste vínculo existir (aparece em "Achados sem diagnóstico" no painel).';

-- ON DELETE CASCADE: o achado só existe em função do diagnóstico que o
-- agrupa; apagar o diagnóstico junto é o esperado (o ConfirmDialog avisa
-- disso antes de excluir).
alter table public.patient_clinical_entry
  add constraint patient_clinical_entry_diagnosis_fk
  foreign key (diagnosis_id, clinic_id)
  references public.patient_clinical_entry (id, clinic_id)
  on delete cascade;

-- Só achado aponta pra diagnóstico — um diagnóstico não pode ter diagnosis_id
-- (apontar pra si mesmo ou para outro diagnóstico não faz sentido no modelo).
alter table public.patient_clinical_entry
  add constraint patient_clinical_entry_diagnosis_kind_ck
  check (diagnosis_id is null or kind = 'problems');

-- Leitura quente: "achados DESTE diagnóstico", uma vez por diagnóstico
-- mostrado no painel.
create index patient_clinical_entry_diagnosis_idx
  on public.patient_clinical_entry (diagnosis_id) where diagnosis_id is not null;

-- Grants desta tabela são por coluna (ver as demais); diagnosis_id entra do
-- mesmo jeito, incremental — não precisa repetir as colunas já concedidas.
grant select (diagnosis_id) on public.patient_clinical_entry to authenticated;
grant insert (diagnosis_id) on public.patient_clinical_entry to authenticated;
grant update (diagnosis_id) on public.patient_clinical_entry to authenticated;
