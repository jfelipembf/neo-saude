-- Migration recuperada do banco (drift): foi aplicada direto no Supabase via MCP
-- em 22/07/2026, sem arquivo local correspondente. O SQL abaixo e byte-a-byte o
-- mesmo que ja rodou no banco (supabase_migrations.schema_migrations) e NAO deve
-- ser editado. 

-- Bucket privado dos anexos do paciente. O arquivo vive aqui; os METADADOS na
-- tabela patient_document (storage_path aponta para o objeto). Convenção de
-- caminho: {clinic_id}/{patient_id}/{uuid}-{arquivo} — o 1º segmento é o tenant.
insert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict (id) do nothing;

-- RLS de storage.objects: a clínica só enxerga/escreve/apaga objetos cuja PASTA
-- raiz (1º segmento do caminho) seja uma clínica sua (mesmo portão das tabelas:
-- private.auth_clinic_ids()). Sem policy de UPDATE — documento não se edita, se
-- troca (apaga + reenvia).
create policy "patient_docs_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'patient-documents'
         and (storage.foldername(name))[1]::uuid = any (private.auth_clinic_ids()));

create policy "patient_docs_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'patient-documents'
              and (storage.foldername(name))[1]::uuid = any (private.auth_clinic_ids()));

create policy "patient_docs_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'patient-documents'
         and (storage.foldername(name))[1]::uuid = any (private.auth_clinic_ids()));
