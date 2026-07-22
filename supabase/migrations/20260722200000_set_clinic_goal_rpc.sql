-- ═════════════════════════════════════════════════════════════════════════════
-- set_clinic_goal() — a gravação da meta que o PostgREST não consegue fazer
--
-- ── O BUG QUE ESTA MIGRATION CONSERTA ────────────────────────────────────────
-- O arquivo anterior (20260722190000) fechou a escrita de public.clinic_goal por
-- COLUNA, e com razão: `metric` pode entrar no INSERT mas não no UPDATE, porque
-- trocar a métrica de uma linha existente transformaria "meta de despesa" em
-- "meta de faturamento" mantendo id e created_at.
--
--     grant insert (clinic_id, metric, target_value) ... ;
--     grant update (target_value)                    ... ;
--
-- O front gravava com `supabase.from('clinic_goal').upsert(..., { onConflict:
-- 'clinic_id,metric' })`. O PostgREST traduz isso para um ON CONFLICT DO UPDATE
-- que atribui TODAS as colunas do payload, não só a que mudou:
--
--     insert into public.clinic_goal (clinic_id, metric, target_value)
--     values (...)
--     on conflict (clinic_id, metric) do update
--        set clinic_id = excluded.clinic_id,      -- <-- sem grant de update
--            metric    = excluded.metric,         -- <-- sem grant de update
--            target_value = excluded.target_value;
--
-- E o Postgres checa privilégio de coluna do SET no PLANO, não na execução: a
-- instrução falha com 42501 "permission denied for table clinic_goal" mesmo na
-- PRIMEIRA gravação, quando não há conflito nenhum e o ramo do UPDATE nem chega
-- a ser executado. Ou seja: a aba Metas não conseguia salvar nada, nunca — o
-- único caminho de escrita do recurso estava 100% quebrado.
--
-- ── POR QUE UMA RPC E NÃO AFROUXAR O GRANT ───────────────────────────────────
-- Dar `update (metric)` ao cliente resolveria o 42501 e destruiria a garantia
-- que o arquivo anterior construiu de propósito. Aqui o SET fica sob NOSSO
-- controle e toca só `target_value`, que é exatamente o privilégio concedido —
-- o grant continua fechado e a gravação passa a caber dentro dele.
--
-- Alternativa descartada: UPDATE no cliente e, se afetar 0 linhas, INSERT. São
-- dois round-trips e uma janela de corrida entre eles — dois salvamentos
-- simultâneos viram 23505 na cara do usuário. O `on conflict` resolve isso
-- atomicamente, que é justamente para o que a constraint unique existe.
--
-- SECURITY INVOKER: quem manda continua sendo a RLS de clinic_goal. A policy de
-- insert e a de update exigem can_edit_feature(clinic_id, 'admin'), e nada aqui
-- contorna isso — a função não empresta privilégio, só escolhe o SET.
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function public.set_clinic_goal(
  p_clinic uuid,
  p_metric public.goal_metric,
  p_target numeric
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.clinic_goal (clinic_id, metric, target_value)
  values (p_clinic, p_metric, p_target)
  on conflict (clinic_id, metric) do update
     -- SÓ target_value. Ver o cabeçalho: é esta lista que o PostgREST não
     -- conseguia restringir e que fazia a gravação bater no grant de coluna.
     set target_value = excluded.target_value;
$$;

comment on function public.set_clinic_goal(uuid, public.goal_metric, numeric) is
  'Grava a meta da clínica para UMA métrica (cria ou atualiza), de forma '
  'atômica via `on conflict (clinic_id, metric)`. Existe porque o upsert do '
  'PostgREST atribui todas as colunas do payload no DO UPDATE e esbarra no '
  'grant de coluna de clinic_goal (update só em target_value) — falhando com '
  '42501 já na primeira gravação. SECURITY INVOKER: a RLS de clinic_goal é quem '
  'exige a feature admin para escrever. target_value > 0 é garantido pelo CHECK '
  'da tabela (23514) — meta zerada se APAGA (delete), não se zera.';

revoke execute on function public.set_clinic_goal(uuid, public.goal_metric, numeric) from public;
grant  execute on function public.set_clinic_goal(uuid, public.goal_metric, numeric) to authenticated;
