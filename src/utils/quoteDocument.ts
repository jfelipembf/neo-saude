import type { NewQuote } from '@/services/quotesService'
import type { PaymentPlanEntry, Quote } from '@/types/domain'
import { PAYMENT_METHOD_LABEL } from '@/constants/payments'
import { esc } from '@/utils/printDocument'
import { formatBRL } from '@/utils/format'
import { isoToBrDate } from '@/utils/date'

/**
 * Miolo impresso do orçamento/contrato — FONTE ÚNICA, usada tanto pelo editor
 * manual (BudgetsPanel) quanto pela Cibelly (useCibellyGeneralTools,
 * criarOrcamentoPaciente): um orçamento criado por voz tem de imprimir
 * IDÊNTICO a um criado à mão, porque os dois viram o mesmo registro na mesma
 * tabela (`quote`/`quote_item`) e aparecem juntos na mesma lista depois.
 *
 * Extraído de BudgetsPanel.tsx — morava lá porque só existia um consumidor.
 */

/** Subtotal e total (com desconto) de um orçamento. */
export function totalsOf(quote: Pick<Quote, 'items' | 'discount'>) {
  const subtotal = quote.items.reduce((sum, i) => sum + i.amount, 0)
  return { subtotal, total: Math.max(0, subtotal - (quote.discount ?? 0)) }
}

/** Impressão do orçamento (aguardando) ou do CONTRATO (aprovado). */
/** Miolo do orçamento/contrato — cabeçalho da clínica vem da base de impressão.
 *  `clinicName` assina o documento como contratada. */
export function quoteBody(
  quote: NewQuote,
  clinicName: string,
  professionalName: (id?: string) => string,
  patientName?: string,
  plan?: PaymentPlanEntry[],
) {
  const { subtotal, total } = totalsOf(quote)
  const approved = quote.status === 'approved'

  // Com plano (definido no aceite), o contrato imprime as condições REAIS —
  // forma a forma; sem plano, cai na simulação de parcelamento do orçamento.
  const paymentLines = plan?.length
    ? plan.map(e => `${PAYMENT_METHOD_LABEL[e.method]} — ${
        e.installments > 1 ? `${e.installments}x de ${formatBRL(e.amount / e.installments)}` : formatBRL(e.amount)
      }, 1º venc. ${isoToBrDate(e.firstDueDate) ?? e.firstDueDate}`).join('<br>')
    : quote.installments && quote.installments > 1
      ? `Pagamento em ${quote.installments}x de ${formatBRL(total / quote.installments)}`
      : 'Pagamento à vista'
  const rows = quote.items.map(i => `
    <tr>
      <td>${esc(i.treatment)}${i.teeth?.length ? `<br><small>Dente(s): ${esc(i.teeth.join(', '))}${i.faces?.length ? ` · Face(s): ${esc(i.faces.join(', '))}` : ''}</small>` : ''}</td>
      <td>${esc(professionalName(i.professionalId))}</td>
      <td class="num">${formatBRL(i.amount)}</td>
    </tr>`).join('')

  return `
    ${patientName ? `<p><strong>Paciente:</strong> ${esc(patientName)}</p>` : ''}
    <p><strong>Data:</strong> ${esc(quote.date)}</p>
    <table>
      <thead><tr><th>Tratamento</th><th>Profissional</th><th class="num">Valor</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totais">
      Subtotal: ${formatBRL(subtotal)}<br>
      ${quote.discount ? `Desconto: −${formatBRL(quote.discount)}<br>` : ''}
      <strong>Total: ${formatBRL(total)}</strong><br>
      ${paymentLines}
    </div>
    ${quote.notes ? `<p class="clausula"><strong>Observações:</strong> ${esc(quote.notes)}</p>` : ''}
    ${approved ? `<p class="clausula">Pelo presente instrumento, as partes acordam a execução dos tratamentos
      relacionados acima, pelos valores e condições de pagamento descritos, obrigando-se o contratado a
      executá-los com zelo técnico e o contratante a efetuar os pagamentos nas datas combinadas.</p>
    <div class="assinaturas"><span>Contratante${patientName ? ` — ${esc(patientName)}` : ''}</span><span>Contratada — ${esc(clinicName)}</span></div>` : ''}`
}
