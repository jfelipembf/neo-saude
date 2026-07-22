-- Bucket público de imagens da clínica (logo, avatar de profissional, fotos de
-- material/sala). Leitura pública (servidas por URL); escrita só para membros
-- da clínica dona da pasta — o path é sempre {clinic_id}/{entidade}/{arquivo}.
insert into storage.buckets (id, name, public)
values ('clinic-assets', 'clinic-assets', true)
on conflict (id) do update set public = excluded.public;

-- Leitura: pública (o bucket é public; imagens carregam por URL sem login).
drop policy if exists "clinic_assets_read" on storage.objects;
create policy "clinic_assets_read"
  on storage.objects for select
  using (bucket_id = 'clinic-assets');

-- Escrita (insert/update/delete): só quem é membro ATIVO da clínica cujo UUID
-- é a PRIMEIRA pasta do caminho. Fora do padrão {clinic_id}/... → negado.
drop policy if exists "clinic_assets_insert" on storage.objects;
create policy "clinic_assets_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'clinic-assets'
    and (storage.foldername(name))[1] in (select unnest(private.auth_clinic_ids())::text)
  );

drop policy if exists "clinic_assets_update" on storage.objects;
create policy "clinic_assets_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'clinic-assets'
    and (storage.foldername(name))[1] in (select unnest(private.auth_clinic_ids())::text)
  )
  with check (
    bucket_id = 'clinic-assets'
    and (storage.foldername(name))[1] in (select unnest(private.auth_clinic_ids())::text)
  );

drop policy if exists "clinic_assets_delete" on storage.objects;
create policy "clinic_assets_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'clinic-assets'
    and (storage.foldername(name))[1] in (select unnest(private.auth_clinic_ids())::text)
  );
