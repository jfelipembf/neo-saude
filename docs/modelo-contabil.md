# Modelo contábil do Neo Saúde — fonte única

Este documento define O QUE cada número financeiro significa e ONDE ele aparece.
Toda tela, RPC ou migration que mexa em dinheiro deve citar uma das três
definições abaixo — nunca inventar uma quarta.

## As três perguntas (e os três números)

### 1 · Faturamento — "quanto vendi?" (competência, BRUTO)

- **Regime**: competência — a venda conta no dia em que **aconteceu**, paga ou não.
- **Valor**: bruto (`gross_amount`), antes da taxa de adquirente.
- **Fonte**: `receivable.competence_date` + `gross_amount`, `status <> 'canceled'`.
  - PDV (`checkout_sale`): competência = data da venda (`sale_date`) — em TODAS
    as parcelas (uma venda 12x de R$ 1.200 fatura R$ 1.200 no mês da venda).
  - Orçamento (`approve_quote`): competência = data da APROVAÇÃO (o aceite é a
    venda; a emissão do orçamento é só proposta).
  - Procedimento (`bill_treatment_session`): competência = `performed_on`
    (o serviço executado é o fato gerador).
- **Aparece em**: card "Faturamento" do Dashboard (`dashboard_stats_period`),
  aba Vendas do Financeiro (`listSales` — lista por data da venda com status;
  cartão pendente de repasse aparece como "Aguardando repasse"), métrica
  `revenue` de Metas.
- `receivable.sale_id` amarra as parcelas do PDV à venda (`sale`) que as
  originou; bandeira/autorização são colunas (`card_brand`,
  `authorization_code`), não mais texto no notes.

### 2 · Recebido — "quanto dinheiro entrou?" (caixa, LÍQUIDO)

- **Regime**: caixa — conta no dia em que o dinheiro **caiu** (`received_at`).
- **Valor**: líquido — o que de fato entrou na conta:
  `coalesce(nullif(received_amount, 0), net_amount)` (baixa parcial acumula;
  juros/multa fazem o recebido passar do líquido).
- **Aparece em**: gráfico Ganhos × Gastos (finance_series), "Saldo atual" do
  Fluxo de caixa, saldos de Contas bancárias, rodapé "Recebido" de Contas a
  Receber. Gastos são o espelho: `paid_amount` por `paid_at`.

### 3 · A receber — "o que ainda está aberto?" (vencimento, RESTANTE)

- **Regime**: por vencimento (`due_date`), só títulos `pending`/`overdue`.
- **Valor**: restante = `gross_amount − fee − received_amount` (piso 0 —
  coluna gerada `open_amount`).
- **Quem deve** (`debtor`, coluna gerada a partir de `acquirer_id`):
  - `payer` — dívida do PACIENTE: pode vencer, entra na Inadimplência, é o
    número do "quanto eu devo?" no balcão.
  - `acquirer` — repasse da ADQUIRENTE: a maquininha garantiu a venda na
    autorização, **o paciente não deve mais nada**. Nunca vira inadimplência
    (CHECK `receivable_acquirer_never_overdue_ck`) e a baixa acontece SOZINHA
    na data prevista de repasse (cron `neo-saude-finance-daily` →
    `private.settle_card_receivables`).
- **Aparece em**: Contas a Receber, Fluxo de caixa projetado, BillingCard do
  Dashboard, Inadimplência (só `payer`), saldo "Em aberto" do perfil do
  paciente (só `payer`).

## Bruto × Líquido — onde cada um aparece

| Contexto | Valor |
|---|---|
| Faturamento / Vendas (o que foi vendido) | **Bruto** |
| Caixa / bancos / gráfico de ganhos (o que entrou) | **Líquido** |
| Tabelas analíticas (Vendas, Contas a Receber, Pagamentos do perfil) | **Os dois, lado a lado**, com a Taxa entre eles |
| Recibo do paciente | **Bruto** (é o que o paciente pagou; a taxa é custo da clínica com a adquirente, não desconto do paciente) |

## Ciclo de vida de um título (receivable)

```
nasce (pending) ──► vence sem pagar (overdue, só payer, carência por clínica)
   │                        │
   │ payer: baixa manual    │ cobrança (Inadimplência)
   │ (settle_receivable,    │
   │  aceita parcial)       ▼
   │ acquirer: baixa        paid  ◄── estorno reabre (reverseReceivable)
   │ AUTOMÁTICA no dia      
   ▼ do repasse (cron)      
  paid (received_at + received_amount preenchidos)
```

- Cartão (crédito/débito) SEMPRE tem adquirente (CHECK
  `receivable_card_requires_acquirer_ck`) → nasce `debtor='acquirer'`.
- Dinheiro/pix no PDV nascem `paid` na hora (balcão: o dinheiro já entrou).
- A perspectiva muda por tela: no PERFIL DO PACIENTE, um título de adquirente
  aparece como "Pago" (ele pagou); em CONTAS A RECEBER, aparece como pendente
  (a clínica ainda não recebeu o repasse). Os dois estão certos — são
  perguntas diferentes.
