-- ═══════════════════════════════════════════════════════════════════════════
-- VENDA NO CARTÃO EXIGE ADQUIRENTE — a trava vira estrutura, não disciplina.
--
-- REGRA DO DONO, palavras dele: no crédito a venda JÁ FOI GARANTIDA pela
-- adquirente; quem deve as parcelas é ELA, não o paciente. Logo um recebível de
-- cartão nunca pode virar 'overdue' nem aparecer na Inadimplência.
--
-- Quem faz cumprir essa regra é a coluna GERADA `receivable.debtor`:
--     case when acquirer_id is null then 'payer' else 'acquirer' end
-- Ou seja, quem manda no destino do título é o ADQUIRENTE, não a forma. Um
-- título com method='credit' e acquirer_id NULL nasce, portanto, como dívida DO
-- PACIENTE: vira 'overdue', entra na aba Inadimplência e dispara cobrança por
-- uma venda que a maquininha já garantiu. Junto disso, a taxa nunca é
-- descontada e o título nunca aparece na Conciliação (que filtra por adquirente)
-- — fica pendente para sempre.
--
-- O CHECK que já existia, `receivable_acquirer_is_card_ck`, cobre só o sentido
-- INVERSO (tem adquirente ⇒ a forma é de cartão). O sentido que causa cobrança
-- indevida — forma de cartão SEM adquirente — estava aberto, e havia dois
-- escritores capazes de produzi-lo:
--   · quotesService.approveQuote, que grava `method` sem nunca gravar
--     acquirer_id (e o diálogo de aceite chegava a sugerir 'credit' na 2ª forma);
--   · private.emit_session_billing chamado direto por um authenticated com
--     p_method='credit' e p_acquirer null — a trava do TreatmentsPanel é só de
--     tela, e tela não é trava.
--
-- Aqui a combinação passa a ser IMPOSSÍVEL de gravar, por qualquer caminho,
-- inclusive os que ainda nem foram escritos. Conferido antes de aplicar: das 5
-- linhas de receivable existentes, ZERO violam (4 'pix' e 1 sem forma).
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.receivable
  add constraint receivable_card_requires_acquirer_ck
  check (method is null or method not in ('credit', 'debit') or acquirer_id is not null);

comment on constraint receivable_card_requires_acquirer_ck on public.receivable is
  'Cartão (crédito/débito) exige adquirente: sem ela, debtor seria "payer" e o '
  'paciente seria cobrado — inclusive na Inadimplência — por uma venda que a '
  'maquininha já garantiu.';

-- ── Sobras de ACL: função de dinheiro com EXECUTE para PUBLIC ────────────────
-- private.card_installment_plan nasceu num `create or replace` sem revoke e
-- ficou com o default do Postgres (PUBLIC EXECUTE), enquanto toda irmã em
-- `private` é postgres-only. Não é explorável hoje (é SECURITY INVOKER, então a
-- RLS de `acquirer` vale, e o PostgREST não expõe o schema `private`), mas viola
-- a regra do projeto e é o tipo de default que só é reparado depois do incidente.
-- Os dois chamadores são SECURITY DEFINER de propriedade do postgres, que
-- mantém o EXECUTE por ser dono — nada deixa de funcionar.
revoke all on function private.card_installment_plan(uuid, uuid, numeric, integer, date, public.payment_method) from public;

-- Mesmas sobras em funções de gatilho criadas sem revoke. Gatilho só roda em
-- contexto de trigger, então o risco é baixo; a regra do projeto é revoke public
-- em tudo, e deixar exceção sem motivo apaga o sinal de quando ela importa.
revoke all on function private.tg_receivable_cancel_frees_session() from public;
revoke all on function private.tg_cash_session_no_reopen() from public;
revoke all on function private.tg_guard_platform_admin() from public;
