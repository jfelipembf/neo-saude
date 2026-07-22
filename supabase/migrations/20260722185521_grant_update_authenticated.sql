-- Migration recuperada do banco (drift): foi aplicada direto no projeto remoto
-- em 22/07/2026 sem arquivo local correspondente. Corpo abaixo copiado
-- integralmente de supabase_migrations.schema_migrations (nao alterar).
-- As policies RLS de UPDATE existem, mas faltou o GRANT de tabela para o papel
-- `authenticated` — sem ele o Postgres nega o UPDATE antes mesmo da RLS, e todo
-- "salvar/editar" do app vira no-op silencioso. Concede UPDATE exatamente nas
-- tabelas que TÊM policy de UPDATE (a RLS segue governando quais linhas/colunas).
do $$
declare r record;
begin
  for r in
    select distinct tablename
    from pg_policies
    where schemaname = 'public' and cmd in ('UPDATE', 'ALL')
  loop
    execute format('grant update on public.%I to authenticated', r.tablename);
  end loop;
end $$;
