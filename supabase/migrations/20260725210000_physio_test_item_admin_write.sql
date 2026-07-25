-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — A PORTA DE ESCRITA DO CATÁLOGO DE ITENS
--
-- 20260725190000 criou physio_test_item/_option com policy só de SELECT, e
-- deixou o motivo escrito: "não há tela que edite item, e policy de escrita sem
-- tela é parede sem porta que só serve para ser esquecida aberta". A tela existe
-- agora (Administrativo → Testes edita os itens e as opções junto com os
-- níveis), então a porta entra — com a fechadura que aquela migration pediu.
--
-- ── O QUE ESTA MIGRATION DECIDE ─────────────────────────────────────────────
-- 1. INSERT/UPDATE seguem physio_test_level: quem edita o catálogo ('admin')
--    edita item e opção do mesmo jeito que edita faixa.
-- 2. DELETE segue physio_test_DELETE, não o do nível: is_seed = false. O nível é
--    interpretação da clínica (o corte do TUG pode ser outro na sua realidade);
--    o ITEM é o instrumento. Apagar o item 13 do Berg não "personaliza" o Berg,
--    faz o total passar a sair de 13 itens — e como o banco SOMA e CLASSIFICA
--    sozinho em scoring_kind = 'sum_items', o escore continuaria sendo gravado,
--    só que menor, caindo numa faixa de risco pior que a real e sem nada na tela
--    dizendo que o instrumento foi mutilado. Teste de seed fica com o item que
--    veio publicado; teste da própria clínica ela apaga à vontade.
-- 3. UPDATE por COLUNA. As duas tabelas nasceram com o grant amplo que o
--    Supabase dá por default privileges (todas as colunas), e com ele um UPDATE
--    em `test_id` mudaria o item de teste — mesma clínica, RLS satisfeita, item
--    do Berg reaparecendo dentro do Roland-Morris. O grant estreito é a parede:
--    só o CONTEÚDO do item é editável, nunca a que teste (ou clínica) ele
--    pertence. Mesma escolha já feita em physio_test (relacl sem 'w').
--
-- ── O QUE ESTA MIGRATION NÃO FAZ ────────────────────────────────────────────
-- Não bloqueia apagar item JÁ RESPONDIDO por algum paciente. A FK da resposta é
-- ON DELETE SET NULL de propósito (20260725190000): o texto congelado sobrevive
-- e o prontuário continua legível, e transformar isso em RESTRICT travaria a
-- manutenção do catálogo para sempre. Quem recusa a remoção acidental é a tela
-- (testsService confere antes de apagar e explica) — o banco continua permitindo
-- a remoção deliberada, que é a única forma de limpar um item errado.
--
-- Depende de: 20260725190000_physio_test_item_engine.sql.
-- ═════════════════════════════════════════════════════════════════════════════

-- Helper porque a checagem aparece em 2 policies e precisa enxergar physio_test
-- sem depender da RLS dele (a policy de item não pode ficar refém de quem
-- consegue SELECT no teste — isso acopla duas paredes e faz a de fora falhar em
-- silêncio, negando a exclusão em vez de negar por falta de permissão).
create or replace function private.physio_test_is_seed(p_test uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select t.is_seed from public.physio_test t where t.id = p_test), false);
$$;

comment on function private.physio_test_is_seed(uuid) is
  'true quando o teste veio semeado com o sistema. Usado pelas policies de '
  'DELETE de physio_test_item/_option: item de instrumento publicado não se '
  'apaga, senão o escore somado passa a sair de menos itens do que o '
  'instrumento tem — e continua sendo gravado, mentindo baixo.';

revoke execute on function private.physio_test_is_seed(uuid) from public;

-- ── physio_test_item ────────────────────────────────────────────────────────
create policy physio_test_item_insert on public.physio_test_item
  for insert to authenticated
  with check (
    clinic_id = any (private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy physio_test_item_update on public.physio_test_item
  for update to authenticated
  using (
    clinic_id = any (private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any (private.auth_clinic_ids()));

create policy physio_test_item_delete on public.physio_test_item
  for delete to authenticated
  using (
    clinic_id = any (private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
    and not private.physio_test_is_seed(test_id)
  );

-- ── physio_test_item_option ─────────────────────────────────────────────────
-- A opção acompanha o item: quem pode editar o item pode repontuar a resposta.
-- Apagar continua preso ao is_seed do TESTE (a opção é parte do instrumento
-- tanto quanto o item — tirar "0 pontos" do item 3 do Berg é a mesma mutilação).
create policy physio_test_item_option_insert on public.physio_test_item_option
  for insert to authenticated
  with check (
    clinic_id = any (private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy physio_test_item_option_update on public.physio_test_item_option
  for update to authenticated
  using (
    clinic_id = any (private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any (private.auth_clinic_ids()));

create policy physio_test_item_option_delete on public.physio_test_item_option
  for delete to authenticated
  using (
    clinic_id = any (private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
    and not private.physio_test_is_seed(
      (select i.test_id from public.physio_test_item i where i.id = item_id)
    )
  );

-- ── Grants ──────────────────────────────────────────────────────────────────
-- INSERT e DELETE são table-wide (não existe insert "de coluna" que faça
-- sentido aqui, e a RLS acima já decide quem entra). UPDATE é estreito: fora
-- desta lista, coluna nenhuma é editável — em especial test_id/item_id/clinic_id,
-- que são a IDENTIDADE da linha, não conteúdo dela.
revoke update on public.physio_test_item        from authenticated;
revoke update on public.physio_test_item_option from authenticated;

grant insert, delete on public.physio_test_item        to authenticated;
grant insert, delete on public.physio_test_item_option to authenticated;

grant update (code, label, help, input_kind, sort_order)
  on public.physio_test_item to authenticated;
grant update (label, points, sort_order)
  on public.physio_test_item_option to authenticated;
