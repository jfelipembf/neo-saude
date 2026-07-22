-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — 10 · ENDURECIMENTO GLOBAL DE PRIVILÉGIOS
--
-- Roda DEPOIS de todas as fatias de domínio (01…09) e ANTES do seed.
--
-- POR QUE UM ARQUIVO PRÓPRIO, E POR QUE NO FIM
--
-- Duas garantias deste conjunto não cabem em fatia nenhuma, porque valem para
-- TABELAS QUE AINDA NÃO EXISTEM quando a fatia roda:
--
--   1. TRUNCATE. O bootstrap do Supabase executa
--          alter default privileges in schema public
--            grant all on tables to anon, authenticated;
--      e `all` INCLUI TRUNCATE. TRUNCATE **NÃO PASSA POR RLS** — não existe
--      "truncate só as minhas linhas". Uma única chamada esvazia a tabela de
--      TODAS as clínicas. Hoje o PostgREST não expõe TRUNCATE, e é exatamente
--      por isso que o privilégio passa despercebido: ele não está protegendo
--      nada, está esperando a próxima versão do gateway. Privilégio que só não é
--      usado porque o cliente atual não sabe usá-lo não é uma proteção.
--
--      04-profissionais.sql já revogava TRUNCATE nas quatro tabelas dele. As
--      outras oito fatias não — e revogar tabela a tabela é a forma de esquecer
--      a próxima. Aqui é em bloco, e o ALTER DEFAULT PRIVILEGES do fim garante
--      que a tabela criada AMANHÃ também nasça sem ele.
--
--   2. `anon` NÃO TEM NADA NO SCHEMA public. Não existe uma linha deste sistema
--      que faça sentido para um visitante não autenticado: não há página
--      pública, não há agendamento online, não há vitrine. As fatias 05, 06 e 08
--      já faziam `revoke all ... from anon` nas tabelas delas; as demais
--      dependiam só da RLS (que de fato barra, porque nenhuma policy nomeia
--      `anon`). Manter as duas camadas é barato e transforma um erro de policy
--      futura em nada.
--
-- O QUE ESTE ARQUIVO NÃO FAZ: não mexe em RLS, não cria nem remove policy, não
-- toca em GRANT de coluna. Todo o desenho de permissão continua na fatia dona da
-- tabela — aqui só se REVOGA o que o Supabase concedeu por padrão e ninguém
-- pediu.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · TRUNCATE FORA DO ALCANCE DO CLIENTE
--
-- Em bloco, sobre tudo que existe. `service_role` (o papel do servidor) não é
-- afetado: ele tem BYPASSRLS e privilégios próprios, e é quem faz expurgo de
-- LGPD e manutenção.
-- ─────────────────────────────────────────────────────────────────────────────

revoke truncate on all tables in schema public from anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · `anon` NÃO ENXERGA O SCHEMA public
--
-- Ordem importa: revogar no nível de TABELA depois de as fatias terem concedido
-- privilégio de COLUNA é seguro — `revoke all` derruba os dois. Como `anon`
-- nunca recebeu grant de coluna em fatia nenhuma, aqui não se perde nada.
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all routines in schema public from anon;

-- USAGE no schema fica: o PostgREST resolve o schema antes de resolver a tabela,
-- e tirá-lo troca "permission denied for table X" (diagnóstico claro) por um
-- erro de schema inexistente em toda rota, inclusive nas de auth.


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · O PADRÃO PARA AS PRÓXIMAS TABELAS
--
-- Sem isto, a tabela criada na próxima migration nasce com TRUNCATE concedido a
-- `anon` e `authenticated` de novo, e a seção 1 vira um remendo com data de
-- validade. ALTER DEFAULT PRIVILEGES vale para objetos FUTUROS criados pelo
-- papel indicado — `postgres` é quem roda as migrations no Supabase.
--
-- Se as migrations passarem a rodar com outro papel, repita o bloco para ele:
-- default privileges são POR PAPEL CRIADOR, não globais.
-- ─────────────────────────────────────────────────────────────────────────────

alter default privileges for role postgres in schema public
  revoke truncate on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon;

alter default privileges for role postgres in schema public
  revoke all on routines from anon;


-- ═════════════════════════════════════════════════════════════════════════════
-- CONFERÊNCIA (rode depois de aplicar; as duas devem voltar ZERO linhas)
--
--   -- (a) alguém ainda pode truncar?
--   select table_name, grantee
--     from information_schema.role_table_grants
--    where table_schema = 'public'
--      and privilege_type = 'TRUNCATE'
--      and grantee in ('anon','authenticated');
--
--   -- (b) `anon` ainda tem alguma coisa?
--   select table_name, privilege_type
--     from information_schema.role_table_grants
--    where table_schema = 'public' and grantee = 'anon';
--
-- E esta deve voltar TODAS as tabelas do domínio, com rowsecurity = true:
--
--   select relname, relrowsecurity
--     from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind = 'r'
--    order by relrowsecurity, relname;
-- ═════════════════════════════════════════════════════════════════════════════
