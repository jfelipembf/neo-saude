import { describe, expect, it } from 'vitest'
import type { Receivable, UnbilledSession } from '@/types/domain'
import {
  dividaDoPaciente, restanteDoTitulo, resumoAFaturar,
  resumoDoQueDeve, resumoDoUltimoPagamento,
} from './patientFinanceSpeech'

function titulo(over: Partial<Receivable> = {}): Receivable {
  return {
    id: 'r1', clinicId: 'c1', code: 'CTR-000001', description: 'Consulta',
    competenceDate: '01/07/2026', dueDate: '05/08/2026',
    source: 'Consultas', grossAmount: 300, fee: 0,
    status: 'pending', debtor: 'payer',
    ...over,
  } as Receivable
}

function sessao(over: Partial<UnbilledSession> = {}): UnbilledSession {
  return {
    id: 's1', clinicId: 'c1', patientId: 'p1', patientName: 'Lucas',
    hasInsurance: false, treatmentId: 't1', treatmentName: 'Canal',
    description: 'Restauração', date: '20/07/2026', amount: 200,
    ...over,
  } as UnbilledSession
}

describe('dividaDoPaciente', () => {
  // 🚨 O caso que motivou o módulo: quem pagou no cartão NÃO deve nada. A
  // parcela pendente é dívida da adquirente, e somá-la aqui faria a Cibelly
  // cobrar em voz alta um paciente que já pagou.
  it('parcela de cartão pendente não é dívida do paciente', () => {
    const cartao = titulo({ debtor: 'acquirer', status: 'pending', grossAmount: 945 })
    expect(dividaDoPaciente([cartao])).toHaveLength(0)
  })

  it('pendente e vencido do próprio paciente entram', () => {
    const lista = [
      titulo({ id: 'a', status: 'pending' }),
      titulo({ id: 'b', status: 'overdue' }),
      titulo({ id: 'c', status: 'paid' }),
      titulo({ id: 'd', status: 'canceled' }),
    ]
    expect(dividaDoPaciente(lista).map(r => r.id)).toEqual(['a', 'b'])
  })
})

describe('restanteDoTitulo', () => {
  it('desconta taxa e o que já entrou', () => {
    expect(restanteDoTitulo(titulo({ grossAmount: 300, fee: 20, receivedAmount: 100 }))).toBe(180)
  })

  it('nunca devolve negativo (juros fazem o recebido passar do líquido)', () => {
    expect(restanteDoTitulo(titulo({ grossAmount: 300, fee: 0, receivedAmount: 350 }))).toBe(0)
  })
})

describe('resumoDoQueDeve', () => {
  it('sem nada em aberto, diz isso sem rodeio', () => {
    expect(resumoDoQueDeve([titulo({ status: 'paid' })], 'Lucas'))
      .toBe('Lucas não tem nada em aberto.')
  })

  it('só cartão pendente também é "nada em aberto"', () => {
    const r = resumoDoQueDeve([titulo({ debtor: 'acquirer', status: 'pending' })], 'Lucas')
    expect(r).toBe('Lucas não tem nada em aberto.')
  })

  it('um título em aberto: valor e vencimento', () => {
    const r = resumoDoQueDeve([titulo({ grossAmount: 450, dueDate: '05/08/2026' })], 'Lucas')
    expect(r).toContain('450,00')
    expect(r).toContain('05/08/2026')
  })

  // O vencido sai SEPARADO do total: as duas conversas com o paciente são
  // diferentes, e somar em silêncio esconde a que importa.
  it('vencido aparece destacado, com a data do mais antigo', () => {
    const r = resumoDoQueDeve([
      titulo({ id: 'a', status: 'overdue', grossAmount: 200, dueDate: '12/06/2026' }),
      titulo({ id: 'b', status: 'overdue', grossAmount: 100, dueDate: '12/05/2026' }),
      titulo({ id: 'c', status: 'pending', grossAmount: 150, dueDate: '05/09/2026' }),
    ], 'Lucas')
    expect(r).toContain('450,00')          // total em aberto
    expect(r).toContain('300,00')          // só o vencido
    expect(r).toContain('desde 12/05/2026') // o mais antigo, não o primeiro da lista
  })

  it('conta os títulos quando há mais de um', () => {
    const r = resumoDoQueDeve([titulo({ id: 'a' }), titulo({ id: 'b' })], 'Lucas')
    expect(r).toContain('2 títulos')
  })

  it('data inválida não vira "a próxima a vencer"', () => {
    const r = resumoDoQueDeve([
      titulo({ id: 'a', dueDate: '' }),
      titulo({ id: 'b', dueDate: '05/08/2026' }),
    ], 'Lucas')
    expect(r).toContain('05/08/2026')
  })
})

describe('resumoDoUltimoPagamento', () => {
  it('sem pagamento, diz que não encontrou', () => {
    expect(resumoDoUltimoPagamento([titulo({ status: 'pending' })], 'Lucas'))
      .toBe('Não encontrei pagamento registrado de Lucas.')
  })

  it('pega o mais recente e fala valor, data e forma', () => {
    const r = resumoDoUltimoPagamento([
      titulo({ id: 'a', status: 'paid', receivedAt: '10/06/2026', grossAmount: 100, method: 'pix' }),
      titulo({ id: 'b', status: 'paid', receivedAt: '12/07/2026', grossAmount: 300, method: 'credit' }),
    ], 'Lucas')
    expect(r).toContain('300,00')
    expect(r).toContain('12/07/2026')
    expect(r).toContain('crédito')
  })

  // Do ponto de vista do paciente, cartão É pagamento feito — o repasse é
  // problema da clínica com a adquirente.
  it('pagamento no cartão conta como pagamento', () => {
    const r = resumoDoUltimoPagamento(
      [titulo({ status: 'paid', debtor: 'acquirer', receivedAt: '12/07/2026', method: 'credit' })],
      'Lucas',
    )
    expect(r).toContain('12/07/2026')
  })
})

describe('resumoAFaturar', () => {
  it('sem nada pendente de cobrança', () => {
    expect(resumoAFaturar([], 'Lucas')).toBe('Não há procedimento de Lucas esperando cobrança.')
  })

  // Produção parada da clínica — a frase NUNCA pode dizer que o paciente deve.
  it('não chama de dívida do paciente', () => {
    const r = resumoAFaturar([sessao()], 'Lucas')
    expect(r).toContain('não cobrados')
    expect(r).not.toContain('deve')
  })

  it('soma o total e resume os primeiros', () => {
    const r = resumoAFaturar([
      sessao({ id: 'a', amount: 200 }),
      sessao({ id: 'b', amount: 300 }),
    ], 'Lucas')
    expect(r).toContain('2 procedimentos')
    expect(r).toContain('500,00')
  })

  it('lista no máximo 3 e diz quantos sobraram', () => {
    const r = resumoAFaturar(
      Array.from({ length: 5 }, (_, i) => sessao({ id: `s${i}` })),
      'Lucas',
    )
    expect(r).toContain('e mais 2')
  })
})
