-- ═════════════════════════════════════════════════════════════════════════════
-- Fixa o search_path de private.tg_cash_session_no_reopen
--
-- Origem: linter do Supabase (0011_function_search_path_mutable), rodado logo
-- após a primeira leva de migrations.
--
-- Migration NOVA e não edição da 20260722120700: aquela já rodou no banco, e
-- migration aplicada é imutável — editar o arquivo faria o repositório mentir
-- sobre o que existe no servidor.
--
-- ── Por que só ESTA função, e não a outra que o linter apontou ───────────────
-- O linter também acusa `private.search_key`, e ali o aviso é ACEITO de
-- propósito:
--   · a função é IMMUTABLE e entra na EXPRESSÃO de índices de busca por nome;
--   · função com `SET` não é inlineada pelo planner, então fixar o search_path
--     encareceria toda avaliação desses índices;
--   · o corpo já qualifica tudo por schema (extensions.unaccent), então não há
--     ambiguidade a resolver — o risco que o lint descreve não existe lá.
-- A decisão está registrada em supabase/SCHEMA.md.
--
-- Aqui o custo é zero: o gatilho só compara OLD com NEW e levanta exceção, não
-- lê tabela nenhuma e não é usado em índice.
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function private.tg_cash_session_no_reopen()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.closed_at is not null and new.closed_at is null then
    raise exception 'Caixa fechado não reabre. Lance o ajuste no turno atual.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

comment on function private.tg_cash_session_no_reopen() is
  'BEFORE UPDATE em cash_session: fechamento é irreversível. NÃO é security '
  'definer — só compara OLD com NEW, não lê nada. search_path fixo por '
  'higiene (lint 0011); sem custo, já que não há resolução de nome no corpo.';
