-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — HIGIENE DE SEGURANÇA (Fatia 0 do roadmap)
--
-- Cinco correções pequenas, independentes entre si, que não dependem de nenhuma
-- decisão de produto. Todas achadas na auditoria das três funcionalidades novas
-- (escalas pontuadas, SOAP, injetáveis) — mas nenhuma delas depende dessas
-- funcionalidades para valer a pena.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 1. is_seed deixa de ser editável pelo cliente ───────────────────────────
-- physio_test tinha UPDATE table-wide para authenticated, e is_seed junto. A
-- policy physio_test_delete só deixa apagar quando `is_seed = false` — ou seja,
-- a proteção do catálogo de referência dependia de uma coluna que o próprio
-- cliente podia virar para false antes de apagar. A trava existia no papel.
-- Agora o UPDATE é coluna a coluna, sem is_seed: só o seed (SECURITY DEFINER)
-- escreve nela.
revoke update on public.physio_test from authenticated;
grant update (name, specialty, image_url, instructions, kind) on public.physio_test to authenticated;

-- ── 2. Excluir teste do catálogo passa a exigir a MESMA feature de criar ────
-- physio_test_insert/_update exigem 'admin', mas _delete exigia 'patients':
-- quem tinha só a permissão de Pacientes conseguia APAGAR teste do catálogo e
-- não conseguia criar. Invertido em relação à intenção óbvia.
drop policy if exists physio_test_delete on public.physio_test;
create policy physio_test_delete on public.physio_test
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
    and is_seed = false
  );

-- ── 3. Resultado de teste do paciente passa a ser auditado ──────────────────
-- O CATÁLOGO (physio_test) era auditado e o RESULTADO CLÍNICO do paciente não.
-- Numa área judicializada é exatamente o contrário do que se quer: alterar a
-- medição de um paciente não deixava rastro. patient_test entra junto (é o que
-- registra quais testes foram atribuídos a quem).
create trigger tr_audit
  after insert or delete or update on public.patient_test_result
  for each row execute function private.tg_audit();

create trigger tr_audit
  after insert or delete or update on public.patient_test
  for each row execute function private.tg_audit();

-- ── 4. Buckets ganham teto de tamanho e allowlist de tipo ───────────────────
-- Os dois eram privados (ok) mas SEM file_size_limit e SEM allowed_mime_types:
-- qualquer arquivo, de qualquer tamanho. Hoje clinic-assets tem 19 objetos,
-- todos png/jpeg, o maior com ~2 MB; patient-documents está vazio — então
-- nenhum upload existente é invalidado por estes limites.
--
-- heic/heif entram de propósito: uploadImage (src/lib/storage.ts) normaliza para
-- png/jpeg, MAS o catch devolve o arquivo ORIGINAL quando a compressão falha —
-- e foto de iPhone chega como heic. Sem eles, o fallback quebraria no celular,
-- que é o aparelho do fisioterapeuta em pé na sala.
update storage.buckets
   set file_size_limit = 10485760,   -- 10 MB
       allowed_mime_types = array['image/png','image/jpeg','image/webp','image/heic','image/heif']
 where id = 'clinic-assets';

update storage.buckets
   set file_size_limit = 20971520,   -- 20 MB (aqui entra PDF de exame)
       allowed_mime_types = array['image/png','image/jpeg','image/webp','image/heic','image/heif','application/pdf']
 where id = 'patient-documents';

-- ── 5. Funções SECURITY DEFINER saem do alcance de PUBLIC ───────────────────
-- Todas tinham `=X/postgres` no ACL, isto é: PUBLIC (logo, anon) podia executar.
-- As três públicas se defendem por dentro (set_collaborator levanta 42501 sem a
-- feature 'admin'), então não havia brecha explorável — mas função SECURITY
-- DEFINER que ESCREVE, exposta como RPC ao anônimo, é superfície que não paga
-- nada por existir. Passa a ser explícito: authenticated executa, PUBLIC não.
revoke execute on function public.set_collaborator(uuid, uuid, membership_status) from public;
revoke execute on function public.list_clinic_staff(uuid) from public;
revoke execute on function public.is_clinic_admin(uuid) from public;

-- Helpers internos de RLS. ⚠️ Revoga só de PUBLIC — `authenticated` TEM grant
-- próprio (`authenticated=X/postgres` no ACL) e PRECISA mantê-lo: as policies
-- chamam estas funções na expressão, e sem EXECUTE o usuário levaria
-- "permission denied for function" em toda query. O schema `private` também não
-- é exposto pelo PostgREST, então isto é defesa em profundidade, não a parede.
revoke execute on function private.auth_clinic_id() from public;
revoke execute on function private.auth_clinic_ids() from public;
revoke execute on function private.is_platform_admin() from public;
revoke execute on function private.can_access_feature(text[]) from public;
revoke execute on function private.can_access_feature(uuid, text[]) from public;
revoke execute on function private.can_edit_feature(text[]) from public;
revoke execute on function private.can_edit_feature(uuid, text[]) from public;
revoke execute on function private.tg_seed_physio_test_catalog() from public;
