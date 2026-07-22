import { MOCK_QUOTES } from '@/mocks/quotes'
import { MOCK_RECEIVABLES } from '@/mocks/finance'
import type { Quote, Receivable } from '@/types/domain'
import { CURRENT_CLINIC, nextCode, type ClientPayload } from '@/lib/tenant'
import { toShortDateWithYear, addMonths } from '@/utils/date'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// viram as tabelas `quotes` 1—N `quote_items` (mesmas assinaturas). A geração
// de parcelas na aprovação vira uma RPC/trigger transacional no banco.
export async function listPatientQuotes(patientId: string): Promise<Quote[]> {
  return MOCK_QUOTES.filter(o => o.patientId === patientId)
}

/** Dados do editor "Criar orçamento". */
export type NewQuote = ClientPayload<Quote>

let nextId = 100

export async function addQuote(payload: NewQuote): Promise<void> {
  MOCK_QUOTES.unshift({
    id: `o${nextId++}`,
    clinicId: CURRENT_CLINIC,
    code: nextCode('ORC', MOCK_QUOTES),
    ...payload,
  })
}

/**
 * Aprova um orçamento e GERA as parcelas em Contas a Receber (padrão dos ERPs:
 * a venda é o ato comercial; as parcelas são o que se cobra). 1ª parcela vence
 * na aprovação, as demais a cada mês. Centavos de arredondamento ficam na 1ª.
 *
 * Idempotente: se as parcelas do orçamento já existem, não duplica.
 * Retorna quantas parcelas foram criadas (0 = já geradas antes).
 */
export async function approveQuote(id: string): Promise<number> {
  const quote = MOCK_QUOTES.find(o => o.id === id)
  if (!quote) return 0
  quote.status = 'approved'

  if (MOCK_RECEIVABLES.some(r => r.quoteId === id)) return 0

  const subtotal = quote.items.reduce((sum, i) => sum + i.amount, 0)
  const total = Math.max(0, subtotal - (quote.discount ?? 0))
  if (total <= 0) return 0

  const count = Math.max(1, quote.installments ?? 1)
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / count)
  const remainder = cents - base * count   // sobra vai na 1ª parcela

  const today = new Date()
  for (let k = 0; k < count; k++) {
    const amount = (base + (k === 0 ? remainder : 0)) / 100
    const installment: Receivable = {
      id: `cr-${id}-${k + 1}`,
      clinicId: CURRENT_CLINIC,
      code: nextCode('CTR', MOCK_RECEIVABLES),
      description: `${quote.name} — parcela ${k + 1}/${count}`,
      dueDate: toShortDateWithYear(addMonths(today, k)),
      source: 'Orçamentos',
      grossAmount: amount,
      fee: 0,                      // taxa só existe quando a forma (cartão) é conhecida, na baixa
      status: 'pending',
      patientId: quote.patientId,
      quoteId: id,
      installmentNumber: k + 1,
      installmentCount: count,
    }
    MOCK_RECEIVABLES.push(installment)
  }
  return count
}
