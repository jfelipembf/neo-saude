import { describe, expect, it } from 'vitest'
import {
  attendanceCertificateText, certificateBody, examRequestBody,
  leaveCertificateText, prescriptionBody, signatureBlock,
} from './clinicalDocument'

const BASE = {
  patientName: 'Michelle Dratovsky',
  patientCpf: '123.456.789-01',
  longDate: '26 de julho de 2026',
  city: 'Aracaju',
  signer: { name: 'Felipe Macedo', license: 'CRO/SE 12345', specialty: 'dentistry' as const },
}

// A assinatura sem registro no conselho invalida receita e atestado — o painel
// de prescrições imprimia só o nome, e o dado (professional.license) já existia.
describe('signatureBlock', () => {
  it('imprime nome, cargo do conselho e registro', () => {
    const html = signatureBlock(BASE.signer)
    expect(html).toContain('Felipe Macedo')
    expect(html).toContain('Cirurgião-dentista')
    expect(html).toContain('CRO/SE 12345')
  })

  it('sem registro, sai só o nome — não inventa cargo', () => {
    const html = signatureBlock({ name: 'Fulano' })
    expect(html).toContain('Fulano')
    expect(html).not.toContain('Cirurgião-dentista')
  })
})

describe('receita', () => {
  it('lista os medicamentos com posologia', () => {
    const html = prescriptionBody({
      ...BASE,
      medications: [{ name: 'Amoxicilina 500mg', dosage: '1 cápsula de 8 em 8h por 7 dias', quantity: '21 cápsulas' }],
    })
    expect(html).toContain('Amoxicilina 500mg')
    expect(html).toContain('21 cápsulas')
    expect(html).toContain('1 cápsula de 8 em 8h por 7 dias')
  })

  // O dentista dita a orientação sem citar remédio — antes isso não gerava
  // documento nenhum, porque só a lista estruturada cabia na receita.
  it('aceita só as orientações ditadas, sem medicamento', () => {
    const html = prescriptionBody({ ...BASE, text: 'Bochecho com clorexidina 2x ao dia por 7 dias.' })
    expect(html).toContain('Bochecho com clorexidina')
    expect(html).not.toContain('<ol class="meds">')
    // Sozinho é a receita inteira, então não leva o rótulo "Orientações".
    expect(html).not.toContain('Orientações:')
  })

  it('com medicamento E orientação, o texto vira "Orientações" abaixo da lista', () => {
    const html = prescriptionBody({
      ...BASE,
      medications: [{ name: 'Dipirona 500mg', dosage: 'se dor' }],
      text: 'Não fazer esforço nas primeiras 24 horas.',
    })
    expect(html).toContain('<ol class="meds">')
    expect(html).toContain('Orientações:')
    expect(html).toContain('Não fazer esforço')
  })

  it('sempre leva paciente, data por extenso e assinatura com CRO', () => {
    const html = prescriptionBody({ ...BASE, text: 'x' })
    expect(html).toContain('Michelle Dratovsky')
    expect(html).toContain('123.456.789-01')
    expect(html).toContain('Aracaju, 26 de julho de 2026')
    expect(html).toContain('CRO/SE 12345')
  })
})

describe('atestado', () => {
  it('modelo de afastamento cita paciente e dias', () => {
    const t = leaveCertificateText('Michelle Dratovsky', 2)
    expect(t).toContain('Michelle Dratovsky')
    expect(t).toContain('2 dia(s)')
  })

  // Comparecimento é documento DIFERENTE de afastamento — o modelo que existia
  // era só o de afastamento, e é o comparecimento que o paciente mais pede.
  it('comparecimento cita a data e, quando houver, o horário', () => {
    expect(attendanceCertificateText('Michelle', '26 de julho de 2026'))
      .toContain('compareceu a esta clínica')
    expect(attendanceCertificateText('Michelle', '26 de julho de 2026', '14:00', '15:30'))
      .toContain('das 14:00 às 15:30')
  })

  it('escapa HTML do texto ditado', () => {
    const html = certificateBody({ ...BASE, text: 'risco <script>alert(1)</script>' })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('solicitação de exame', () => {
  it('lista os exames, a região em dentes e a hipótese', () => {
    const html = examRequestBody({
      ...BASE,
      exams: ['Radiografia periapical'],
      teeth: [15, 14],
      justification: 'Suspeita de lesão periapical',
    })
    expect(html).toContain('Radiografia periapical')
    expect(html).toContain('dente 15, dente 14')
    expect(html).toContain('Suspeita de lesão periapical')
  })
})
