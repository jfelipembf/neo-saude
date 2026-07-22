-- ═════════════════════════════════════════════════════════════════════════════
-- ROTINA DIÁRIA DO FINANCEIRO: BAIXA AUTOMÁTICA DO CARTÃO + VIRADA DE ATRASO
--
-- ── POR QUE pg_cron E NÃO "DERIVAR NA LEITURA" ───────────────────────────────
-- Derivar o status na consulta ("se due_date passou e é cartão, considere pago")
-- resolveria a TELA e nada mais:
--   · bank_account_balance soma `receivable.received_amount` — sem gravar a
--     baixa, o dinheiro do repasse nunca aparece no saldo da conta;
--   · cash_flow_day tira do PREVISTO quem sai de pending/overdue — sem gravar,
--     o repasse fica previsto para sempre;
--   · a Conciliação confere "o que caiu × o que era esperado"; sem uma data e um
--     valor RECEBIDOS gravados não há o lado esquerdo da conta;
--   · a trigger tr_audit registra a baixa. Status calculado não tem histórico:
--     ninguém consegue responder "quando isto foi baixado, e por quê".
-- Baixa é um FATO, e fato se grava. pg_cron está disponível no projeto
-- (verificado com list_extensions: pg_cron 1.6.4) e o job é criado aqui, ativo —
-- não comentado. Foi exatamente "deixar comentado" que fez a virada de overdue
-- nunca existir.
--
-- ── IDEMPOTÊNCIA ─────────────────────────────────────────────────────────────
-- Todo UPDATE tem `status = 'pending'` no WHERE e move o status para fora de
-- 'pending'. Rodar duas vezes no mesmo dia não acha mais nada na segunda. Em
-- READ COMMITTED, duas execuções simultâneas também não se somam: a segunda
-- espera o lock da linha e re-avalia o WHERE depois do commit da primeira.
-- Nenhum movimento de caixa é duplicado porque nenhum é criado — a baixa mora
-- na própria linha do título.
-- ═════════════════════════════════════════════════════════════════════════════

create extension if not exists pg_cron;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · BAIXA AUTOMÁTICA DO CRÉDITO
--
-- No crédito a venda foi GARANTIDA pela adquirente na autorização. Na data
-- prevista de repasse o dinheiro entra sem ninguém clicar em nada. Débito, PIX,
-- boleto e dinheiro NÃO entram aqui: nesses o dinheiro pode simplesmente não
-- entrar, e baixar sozinho seria inventar receita.
--
-- received_at = due_date (a data do repasse), não current_date: se a rotina
-- ficar um dia fora do ar, o dinheiro continua tendo entrado no dia previsto —
-- é isso que faz o fluxo de caixa fechar com o extrato.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function private.settle_card_receivables(p_today date default null)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_today date := coalesce(p_today, (now() at time zone 'America/Sao_Paulo')::date);
  v_count integer;
begin
  update public.receivable r
     set status          = 'paid',
         received_at     = r.due_date,
         received_amount = r.gross_amount - r.fee,   -- o líquido é o que entra
         bank_account_id = coalesce(r.bank_account_id, a.payout_account_id)
    from public.acquirer a
   where a.id        = r.acquirer_id
     and a.clinic_id = r.clinic_id
     and r.method    = 'credit'
     and r.status    = 'pending'
     -- Título com recebimento parcial já teve mão humana: não se mexe.
     and r.received_amount = 0
     and r.due_date <= v_today;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function private.settle_card_receivables(date) is
  'Baixa os recebíveis de CRÉDITO cuja data prevista de repasse chegou. '
  'Idempotente: só toca linhas ainda pending e sem recebimento parcial.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · pending → overdue, COM CARÊNCIA E SEM CARTÃO
--
-- Carência (padrão 3 dias, por clínica em clinic_finance_setting): cobrança
-- automática de quem combinou pagar depois é o pior primeiro contato do produto
-- com o paciente do cliente.
--
-- 🚨 debtor <> 'acquirer' é a exclusão do cartão AQUI, no mesmo lugar onde a
-- virada acontece — e não só na tela. O CHECK receivable_acquirer_never_overdue_ck
-- é a segunda tranca: mesmo um UPDATE manual não consegue marcar atraso num
-- título de maquininha.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function private.flag_overdue_receivables(p_today date default null)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_today date := coalesce(p_today, (now() at time zone 'America/Sao_Paulo')::date);
  v_count integer;
begin
  update public.receivable r
     set status = 'overdue'
   where r.status = 'pending'
     and r.debtor = 'payer'
     and r.due_date < v_today - coalesce(
           (select s.overdue_grace_days
              from public.clinic_finance_setting s
             where s.clinic_id = r.clinic_id), 3);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function private.flag_overdue_receivables(date) is
  'Vira pending → overdue respeitando a carência da clínica e PULANDO títulos '
  'de cartão (quem deve é a adquirente).';

-- Conta a pagar não tem carência: carência existe para não constranger o
-- paciente do cliente, e um boleto de fornecedor vencido está vencido. Manter o
-- status honesto é o que faz o Fluxo de Caixa e a aba Contas a Pagar dizerem a
-- verdade sobre o que a clínica já deveria ter pago.
create or replace function private.flag_overdue_payables(p_today date default null)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_today date := coalesce(p_today, (now() at time zone 'America/Sao_Paulo')::date);
  v_count integer;
begin
  update public.payable p
     set status = 'overdue'
   where p.status = 'pending'
     and p.due_date < v_today;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · O JOB
--
-- ORDEM IMPORTA: baixa o cartão ANTES de virar atraso. Invertido, um título de
-- cartão com repasse vencido passaria pela peneira do atraso antes de ser
-- baixado — e embora o CHECK o impedisse de virar 'overdue', a rotina abortaria
-- inteira por violação de constraint. Aqui ele já saiu de 'pending'.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function private.run_finance_daily(p_today date default null)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_today date := coalesce(p_today, (now() at time zone 'America/Sao_Paulo')::date);
begin
  return jsonb_build_object(
    'day',                v_today,
    'settled_card',       private.settle_card_receivables(v_today),
    'overdue_receivable', private.flag_overdue_receivables(v_today),
    'overdue_payable',    private.flag_overdue_payables(v_today)
  );
end;
$$;

comment on function private.run_finance_daily(date) is
  'Rotina diária do financeiro, agendada em cron.job como neo-saude-finance-daily. '
  'Devolve o que fez, para leitura em cron.job_run_details.';

-- Rotina de infraestrutura: roda em TODAS as clínicas e não tem auth.uid(). Por
-- isso NÃO é exposta a `authenticated` — nenhum tenant dispara uma varredura
-- global. service_role fica de fora também: quem agenda é o cron, e um caminho
-- extra de disparo é um caminho extra de auditar.
revoke all on function private.settle_card_receivables(date)   from public;
revoke all on function private.flag_overdue_receivables(date)  from public;
revoke all on function private.flag_overdue_payables(date)     from public;
revoke all on function private.run_finance_daily(date)         from public;

-- 03:10 UTC = 00:10 em America/Sao_Paulo, o fuso que cash_flow_day já usa. Roda
-- depois da virada do dia local, para que "vencido ontem" já esteja vencido
-- quando a clínica abrir. cron.schedule é upsert pelo nome do job: reaplicar a
-- migration não cria um segundo agendamento.
select cron.schedule(
  'neo-saude-finance-daily',
  '10 3 * * *',
  $cron$select private.run_finance_daily()$cron$
);
