/**
 * O FINANCEIRO DO PACIENTE, EM FRASE PRONTA — o que a Cibelly fala quando o
 * dentista pergunta "o Lucas tem algo em aberto?".
 *
 * Mesmo molde do clinicalHistorySpeech.ts: o CÓDIGO monta a frase, o modelo só
 * lê. Aqui isso pesa mais do que no histórico, porque o número sai em voz alta
 * na frente do paciente — errar não é uma resposta esquisita, é uma cobrança
 * indevida dita na cara de quem já pagou.
 *
 * 🚨 A REGRA QUE NÃO PODE SER FROUXA: dívida do paciente é só `debtor='payer'`.
 * Parcela de cartão nasce `debtor='acquirer'` — a maquininha garantiu a venda
 * na autorização e a baixa acontece sozinha na data do repasse, então o
 * paciente NÃO DEVE NADA por ela (docs/modelo-contabil.md, seção 3). Sem esse
 * filtro, quem pagou R$ 1.000 em 3x ouviria que está devendo R$ 945. É a mesma
 * trava que a PaymentsTable e a Inadimplência já aplicam.
 */

import type { Receivable, UnbilledSession } from '@/types/domain'
import { PAYMENT_METHOD_LABEL } from '@/constants/payments'
import { formatBRL } from '@/utils/format'
import { parseBrDate } from '@/utils/date'

/**
 * Restante a receber = líquido − o que já entrou (aceita baixa parcial).
 *
 * TODO: PaymentsTable.tsx e ReceivableTab.tsx têm cada uma a sua cópia disto,
 * e elas divergem (uma trava no zero, a outra não). Unificar nas três.
 */
export function restanteDoTitulo(r: Receivable): number {
  return Math.max(r.grossAmount - r.fee - (r.receivedAmount ?? 0), 0)
}

/** O que o PACIENTE ainda deve — nunca o que a adquirente deve à clínica. */
export function dividaDoPaciente(titulos: Receivable[]): Receivable[] {
  return titulos.filter(
    r => r.debtor === 'payer' && (r.status === 'pending' || r.status === 'overdue'),
  )
}

/**
 * dd/mm/aaaa → número ordenável. `parseBrDate` devolve Invalid Date (não null)
 * para lixo, e `NaN` em comparação empurraria o título para uma posição
 * arbitrária: `ausente` fixa o extremo, então data ruim nunca vira "a próxima
 * a vencer".
 */
function quando(br: string | undefined, ausente: number): number {
  if (!br) return ausente
  const t = parseBrDate(br).getTime()
  return Number.isNaN(t) ? ausente : t
}

function ordemPorVencimento(a: Receivable, b: Receivable): number {
  return quando(a.dueDate, Number.POSITIVE_INFINITY) - quando(b.dueDate, Number.POSITIVE_INFINITY)
}

/**
 * "Tem alguma coisa em aberto?" — a resposta inteira numa frase.
 *
 * O vencido vem SEPARADO do total, e não somado em silêncio: "tem R$ 450 em
 * aberto" e "tem R$ 450 em aberto, R$ 200 vencidos desde março" levam o
 * dentista a conversas diferentes com a mesma pessoa.
 */
export function resumoDoQueDeve(titulos: Receivable[], nome: string): string {
  const abertos = dividaDoPaciente(titulos)
  if (abertos.length === 0) return `${nome} não tem nada em aberto.`

  const total = abertos.reduce((s, r) => s + restanteDoTitulo(r), 0)
  const vencidos = abertos.filter(r => r.status === 'overdue').sort(ordemPorVencimento)
  const partes = [`${nome} tem ${formatBRL(total)} em aberto`]

  if (abertos.length > 1) partes.push(`em ${abertos.length} títulos`)

  if (vencidos.length) {
    const totalVencido = vencidos.reduce((s, r) => s + restanteDoTitulo(r), 0)
    partes.push(`sendo ${formatBRL(totalVencido)} vencido desde ${vencidos[0].dueDate}`)
  } else {
    const proximo = [...abertos].sort(ordemPorVencimento)[0]
    partes.push(`com vencimento em ${proximo.dueDate}`)
  }

  return `${partes.join(', ')}.`
}

/**
 * "Quanto ele pagou da última vez?" — o pagamento mais recente que de fato
 * entrou. Cartão entra aqui normalmente: do ponto de vista do paciente ele
 * pagou, e a data que interessa a ele é a da compra.
 */
export function resumoDoUltimoPagamento(titulos: Receivable[], nome: string): string {
  const pagos = titulos
    .filter(r => r.status === 'paid' && r.receivedAt)
    // Sem data válida vai para o fim (0), para não virar "o mais recente".
    .sort((a, b) => quando(b.receivedAt, 0) - quando(a.receivedAt, 0))

  if (pagos.length === 0) return `Não encontrei pagamento registrado de ${nome}.`

  const ultimo = pagos[0]
  const valor = formatBRL(ultimo.grossAmount)
  const forma = ultimo.method ? `, ${PAYMENT_METHOD_LABEL[ultimo.method].toLowerCase()}` : ''
  const oque = ultimo.description ? ` (${ultimo.description})` : ''
  return `O último pagamento de ${nome} foi ${valor} em ${ultimo.receivedAt}${forma}${oque}.`
}

/**
 * "Ficou alguma coisa sem cobrar?" — procedimento executado que ninguém
 * faturou. Não é dívida do paciente: é produção da clínica parada. Por isso a
 * frase nunca diz "ele deve".
 */
export function resumoAFaturar(sessoes: UnbilledSession[], nome: string): string {
  if (sessoes.length === 0) return `Não há procedimento de ${nome} esperando cobrança.`

  const total = sessoes.reduce((s, x) => s + x.amount, 0)
  const quantos = sessoes.length === 1
    ? '1 procedimento'
    : `${sessoes.length} procedimentos`
  const detalhe = sessoes
    .slice(0, 3)
    .map(s => `${s.description} de ${s.date}`)
    .join('; ')
  const resto = sessoes.length > 3 ? `, e mais ${sessoes.length - 3}` : ''

  return `${nome} tem ${quantos} executados e ainda não cobrados, somando ${formatBRL(total)}: ${detalhe}${resto}.`
}
