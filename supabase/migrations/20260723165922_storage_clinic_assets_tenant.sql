-- ═════════════════════════════════════════════════════════════════════════════
-- CRÍTICO — vazamento cross-tenant no Storage `clinic-assets`.
--
-- O bucket era public=true (servido pela CDN sem login) e a policy de leitura
-- era só `bucket_id = 'clinic-assets'` — SEM recorte por clínica —, concedida ao
-- papel `public` (anon + qualquer um). Resultado: foto de PACIENTE, foto de
-- profissional e logo de QUALQUER clínica eram baixáveis por qualquer um que
-- soubesse o path (o clinic_id é UUID exposto no app).
--
-- Correção espelha o bucket vizinho `patient-documents`, que já está correto:
-- bucket PRIVADO + leitura recortada pela 1ª pasta do path (= clinic_id do
-- usuário). O app passa a servir esses assets por URL ASSINADA (ver storage.ts).
-- ═════════════════════════════════════════════════════════════════════════════

-- Fecha a CDN anônima.
update storage.buckets set public = false where id = 'clinic-assets';

-- Leitura só dos arquivos da própria clínica (1ª pasta do path = clinic_id).
drop policy if exists clinic_assets_read on storage.objects;
create policy clinic_assets_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'clinic-assets'
    and ((storage.foldername(name))[1])::uuid = any (private.auth_clinic_ids())
  );
