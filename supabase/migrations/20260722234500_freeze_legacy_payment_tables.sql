-- ═════════════════════════════════════════════════════════════════════════════
-- CONGELAR payment / payment_entry / billed_treatment
--
-- Razão único do que a clínica tem a receber = public.receivable. Ter dois
-- razões é ter dois números diferentes para a mesma pergunta, e o produto já
-- vive isso: a aba "Pagamentos" do perfil do paciente lê public.payment, onde
-- NENHUM código insere — a tela está estruturalmente vazia, não vazia por falta
-- de uso.
--
-- As tabelas NÃO são apagadas: elas registram o desenho original (recibo com
-- várias formas de pagamento e rateio por profissional), e esse desenho volta
-- quando existir `payment_allocation`. Congelar é impedir que nasça dado novo
-- num razão paralelo enquanto isso não acontece.
--
-- ── HONESTIDADE SOBRE O QUE ISTO QUEBRA ──────────────────────────────────────
-- Existe SIM um escritor no src/, ao contrário do que se supôs:
--   src/services/paymentsService.ts → receivePayment() insere em payment_entry
--   e faz UPDATE em payment.
-- Ele é INALCANÇÁVEL na prática: exige uma linha de `payment` para receber, e
-- nada em todo o src/ insere em `payment` (zero linhas no banco). Congelar
-- troca "no-op silencioso sobre um registro que nunca existe" por "erro
-- explícito de permissão" — que é o comportamento correto para código morto que
-- ninguém removeu ainda.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 1. O privilégio (a tranca real) ──────────────────────────────────────────
-- REVOKE de tabela leva junto os grants POR COLUNA do mesmo tipo — e é preciso,
-- porque payment/payment_entry/billed_treatment tinham INSERT por coluna.
revoke insert, update, delete on public.payment          from authenticated;
revoke insert, update, delete on public.payment_entry    from authenticated;
revoke insert, update, delete on public.billed_treatment from authenticated;

-- ── 2. As policies (a tranca contra o laço genérico) ─────────────────────────
-- A migration 20260722185521 concedeu UPDATE varrendo `pg_policies` atrás de
-- tabelas COM policy de UPDATE. Se as policies de escrita continuassem aqui,
-- qualquer repetição daquele laço reabriria estas três tabelas sem ninguém
-- perceber. Sem policy de escrita, a RLS nega mesmo que o GRANT volte.
drop policy if exists payment_insert          on public.payment;
drop policy if exists payment_update          on public.payment;
drop policy if exists payment_entry_insert    on public.payment_entry;
drop policy if exists payment_entry_update    on public.payment_entry;
drop policy if exists payment_entry_delete    on public.payment_entry;
drop policy if exists billed_treatment_insert on public.billed_treatment;
drop policy if exists billed_treatment_update on public.billed_treatment;
drop policy if exists billed_treatment_delete on public.billed_treatment;

-- A leitura continua: o histórico (hoje vazio) permanece consultável e as telas
-- que ainda apontam para cá não quebram no SELECT.

-- ── 3. O aviso escrito na própria tabela ─────────────────────────────────────
comment on table public.payment is
  'CONGELADA em 22/07/2026 — somente leitura. O razão vigente de contas a '
  'receber é public.receivable, e nele o título nasce do procedimento executado '
  '(record_treatment_session) ou da aprovação do orçamento (approveQuote). '
  'Mantida porque registra o desenho de recibo multi-forma, que volta quando '
  'existir payment_allocation (payment_id, receivable_id, amount). Não escrever.';

comment on table public.payment_entry is
  'CONGELADA em 22/07/2026 — somente leitura. Formas de pagamento de um recibo '
  'do razão antigo. O equivalente vigente é receivable.method + acquirer_id, '
  'com o repasse de cartão baixando sozinho na data prevista. Não escrever.';

comment on table public.billed_treatment is
  'CONGELADA em 22/07/2026 — somente leitura. Rateio de procedimentos por '
  'profissional dentro de um recibo. O equivalente vigente é '
  'treatment_session (professional_id, amount, billing_status) ligada ao '
  'receivable. A aba Ganhos deve ler dali, e multiplicando pelo percentual de '
  'professional_commission — o que ela nunca fez. Não escrever.';
