-- ═════════════════════════════════════════════════════════════════════════════
-- ENDURECIMENTO DE ISOLAMENTO — correções da auditoria multi-tenant.
--
-- Causa-raiz comum: um GRANT UPDATE de TABELA (largo) para `authenticated`
-- cobre TODAS as colunas, e o col-ACL só SOMA, nunca restringe. A RLS filtra a
-- LINHA, não a COLUNA. Resultado: colunas que só o servidor/plataforma deveriam
-- escrever ficaram graváveis pelo cliente (plan_key = bypass de billing, valores
-- do livro-caixa, code/created_at forjáveis). NÃO é vazamento cross-tenant (o
-- WITH CHECK amarra o clinic_id), mas é integridade/fraude dentro da clínica.
--
-- Correção: revogar o UPDATE de tabela e reconceder só as colunas que o app
-- de fato escreve. O app nunca grava id/clinic_id/created_at/updated_at/code —
-- então revogá-las não quebra nada.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 1. clinic: plano/status/ramo são da PLATAFORMA, não do cliente ───────────
-- plan_key destravava features pagas sem pagar; status se autocorrige (clínica
-- suspensa sai de auth_clinic_ids), mas plan_key não; specialty é decisão do
-- dono do SaaS (o form já a mostra read-only e deixa de enviá-la).
revoke update on public.clinic from authenticated;
grant update (name, cnpj, email, phone, logo_url, cep, state, city, neighborhood, street, number)
  on public.clinic to authenticated;

-- ── 2. cash_movement: livro-caixa não se reescreve ───────────────────────────
-- amount/type/posted_at/payment_method eram graváveis, inclusive em caixa já
-- fechado — vetor de fraude. O app nunca escreve cash_movement direto (baixas
-- passam por RPC); sobra só rótulo/observação de lançamento manual.
revoke update on public.cash_movement from authenticated;
grant update (name, description) on public.cash_movement to authenticated;

-- ── 3. Sistêmico: nenhuma tabela deixa gravar COLUNAS DE SERVIDOR ─────────────
-- Para toda tabela de `public` (menos as duas acima, já tratadas) com UPDATE de
-- tabela para authenticated, revoga e reconcede TODAS as colunas MENOS as de
-- servidor (id, clinic_id, created_at, updated_at, code) e as GERADAS (que nem
-- são atualizáveis). Assim o app continua escrevendo tudo que escrevia, e some
-- a capacidade de forjar código sequencial, retro-datar ou mexer no clinic_id.
do $$
declare
  r     record;
  cols  text;
begin
  for r in
    select t.table_name
      from information_schema.role_table_grants t
     where t.table_schema = 'public'
       and t.grantee = 'authenticated'
       and t.privilege_type = 'UPDATE'
       and t.table_name not in ('clinic', 'cash_movement')
     group by t.table_name
  loop
    select string_agg(quote_ident(c.column_name), ', ')
      into cols
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.table_name = r.table_name
       and c.column_name not in ('id', 'clinic_id', 'created_at', 'updated_at', 'code')
       and c.is_generated = 'NEVER';

    execute format('revoke update on public.%I from authenticated', r.table_name);
    if cols is not null then
      execute format('grant update (%s) on public.%I to authenticated', cols, r.table_name);
    end if;
  end loop;
end $$;

-- ── 4. private.anamnesis_is_archived: filtrar tenant + tirar do PUBLIC ────────
-- Função SECURITY DEFINER (ignora RLS) e tenant-blind: um usuário de outra
-- clínica obtinha um oráculo true/false sobre anamnese alheia por força de uuid.
-- Não é explorável via HTTP hoje (schema private não exposto), mas é furo de
-- autorização. Correção: o corpo passa a filtrar clinic_id = any(auth_clinic_ids)
-- — como a policy do DELETE de anamnesis_answer já checa o tenant da mesma linha,
-- o uso legítimo não muda. EXECUTE fica só para authenticated (a policy precisa),
-- some do PUBLIC.
create or replace function private.anamnesis_is_archived(p_anamnesis uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  -- coalesce(..., false): ficha inexistente OU de outra clínica não é
  -- "arquivada". O filtro de clinic_id é a defesa em profundidade: mesmo sendo
  -- definer (bypassa RLS), a função só enxerga anamnese da própria clínica.
  select coalesce(
    (select a.status = 'archived'
       from public.anamnesis a
      where a.id = p_anamnesis
        and a.clinic_id = any(private.auth_clinic_ids())),
    false
  );
$function$;

revoke execute on function private.anamnesis_is_archived(uuid) from public;
grant execute on function private.anamnesis_is_archived(uuid) to authenticated;
