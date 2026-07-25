-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — FECHA tg_patient_test_result_sync_score PARA public
--
-- 20260725180000 criou a função de trigger sem o revoke, e ela ficou sendo a
-- ÚNICA private.tg_* do banco com EXECUTE para public (conferido em pg_proc.
-- proacl: todas as outras 27 estão em {postgres=X/postgres}). Como é SECURITY
-- DEFINER, "executável por public" quer dizer que um authenticated poderia
-- chamá-la direto — inofensivo hoje, porque função de trigger exige contexto de
-- trigger para ter NEW, mas é buraco de baseline e não se deixa buraco aberto
-- só porque a exploração de hoje é difícil.
-- ═════════════════════════════════════════════════════════════════════════════

revoke execute on function private.tg_patient_test_result_sync_score() from public;
