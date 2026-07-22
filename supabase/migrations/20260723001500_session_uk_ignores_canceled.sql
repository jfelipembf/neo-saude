-- ─────────────────────────────────────────────────────────────────────────────
-- O ÍNDICE ÚNICO NÃO PODE CONTAR TÍTULO CANCELADO
--
-- ACHADO NA PRÓPRIA PROVA, e é o oposto do buraco que o índice fecha:
-- receivable_session_installment_uk (20260723000500) impedia dois títulos vivos
-- para o mesmo procedimento — certo — mas contava também os CANCELADOS. Com a
-- trigger tr_cancel_frees_session devolvendo o procedimento para "A faturar",
-- o caminho de conserto ficava impossível:
--
--   1. título do procedimento é cancelado (por engano, ou renegociação);
--   2. o procedimento volta para "A faturar", como tem de voltar;
--   3. o Financeiro clica em "Gerar cobrança" e recebe
--      "duplicate key value violates unique constraint" — e aquele
--      procedimento executado NUNCA MAIS pode ser cobrado.
--
-- Trocar cobrança dobrada por receita perdida não é conserto. A unicidade que
-- importa é entre títulos VIVOS: cancelado é justamente o título que deixou de
-- existir para o dinheiro.
-- ─────────────────────────────────────────────────────────────────────────────
drop index if exists public.receivable_session_installment_uk;

create unique index receivable_session_installment_uk
  on public.receivable (treatment_session_id, coalesce(installment_number, 1))
  where treatment_session_id is not null and status <> 'canceled';

comment on index public.receivable_session_installment_uk is
  'Um procedimento não pode ter duas vezes a mesma parcela VIVA. Trava contra '
  'cobrança dobrada (duplo clique, retry de rede, caminho novo) sem impedir '
  'que um procedimento cujo título foi cancelado volte a ser cobrado.';
