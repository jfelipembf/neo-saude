import { describe, expect, it } from 'vitest'
import { receiptBody, type ReceiptDoc } from './receiptDocument'

function recibo(over: Partial<ReceiptDoc> = {}): ReceiptDoc {
  return {
    patientName: 'Lucas Guimarães',
    patientCpf: '123.456.789-00',
    description: 'Consulta',
    amount: 250,
    paymentMethods: 'Dinheiro',
    paidOn: '27/07/2026',
    longDate: '27 de julho de 2026',
    city: 'Aracaju',
    clinicName: 'Clínica Neo',
    clinicCnpj: '12.345.678/0001-90',
    ...over,
  }
}

describe('receiptBody', () => {
  it('traz valor, extenso, pagador e o que foi pago', () => {
    const html = receiptBody(recibo())
    expect(html).toContain('250,00')
    expect(html).toContain('duzentos e cinquenta reais')
    expect(html).toContain('Lucas Guimarães')
    expect(html).toContain('123.456.789-00')
    expect(html).toContain('Consulta')
  })

  // Quem assina o recibo é quem RECEBEU — a clínica. Não leva conselho
  // profissional: o ato é comercial, não clínico.
  it('quem assina é a clínica, sem conselho profissional', () => {
    const html = receiptBody(recibo())
    expect(html).toContain('Clínica Neo')
    expect(html).toContain('12.345.678/0001-90')
    expect(html).not.toContain('CRM')
    expect(html).not.toContain('CRO')
  })

  it('sem CPF, a frase continua correta', () => {
    const html = receiptBody(recibo({ patientCpf: undefined }))
    expect(html).toContain('Recebemos de')
    expect(html).not.toContain('CPF')
  })

  it('sem forma de pagamento, a linha some', () => {
    expect(receiptBody(recibo({ paymentMethods: undefined }))).not.toContain('Forma de pagamento')
  })

  // A data do recibo é a da VENDA, não a de hoje: recibo se reimprime.
  it('usa a data do pagamento informada', () => {
    expect(receiptBody(recibo({ paidOn: '10/03/2026' }))).toContain('10/03/2026')
  })

  // O papel sai com o nome da clínica: nome de paciente com < ou & não pode
  // virar HTML solto no documento.
  it('escapa o que veio do cadastro', () => {
    const html = receiptBody(recibo({ patientName: 'Ana <b>Maria</b> & Cia' }))
    expect(html).not.toContain('<b>Maria</b>')
    expect(html).toContain('&amp;')
  })
})
