import { describe, it, expect } from 'vitest'
import { dataPorExtenso, distanciaDeHoje, blocoDeHoje, fimDeSemana, datasAmbiguas } from './spokenDate'

// O caso que originou tudo: a Cibelly disse "quinta dia 30 — do mês que vem"
// num domingo, 26/07/2026. O 30 estava certo; "mês que vem" não.
const HOJE = '2026-07-26'      // domingo
const QUINTA = '2026-07-30'    // quinta-feira, MESMO mês

describe('dataPorExtenso', () => {
  it('escreve o dia da semana correto — é o que ela vai LER', () => {
    expect(dataPorExtenso(HOJE)).toBe('domingo, 26 de julho de 2026')
    expect(dataPorExtenso(QUINTA)).toBe('quinta-feira, 30 de julho de 2026')
  })

  it('acerta a virada de mês e de ano', () => {
    expect(dataPorExtenso('2026-08-01')).toBe('sábado, 1 de agosto de 2026')
    expect(dataPorExtenso('2026-12-31')).toBe('quinta-feira, 31 de dezembro de 2026')
    expect(dataPorExtenso('2027-01-01')).toBe('sexta-feira, 1 de janeiro de 2027')
  })

  it('acerta 29 de fevereiro em ano bissexto', () => {
    expect(dataPorExtenso('2028-02-29')).toBe('terça-feira, 29 de fevereiro de 2028')
  })

  it('não desloca o dia por causa de fuso', () => {
    // O bug clássico: `new Date('2026-07-30')` é meia-noite UTC, e em qualquer
    // fuso negativo vira dia 29 no horário local.
    expect(dataPorExtenso('2026-07-30')).toContain('30 de julho')
    expect(dataPorExtenso('2026-01-01')).toContain('1 de janeiro')
  })

  it('devolve vazio em entrada inválida, em vez de inventar', () => {
    expect(dataPorExtenso('')).toBe('')
    expect(dataPorExtenso('30/07/2026')).toBe('')
    expect(dataPorExtenso('nao-e-data')).toBe('')
  })
})

describe('distanciaDeHoje — evita o "mês que vem" inventado', () => {
  it('nomeia os casos próximos', () => {
    expect(distanciaDeHoje(HOJE, HOJE)).toBe('hoje')
    expect(distanciaDeHoje('2026-07-27', HOJE)).toBe('amanhã')
    expect(distanciaDeHoje('2026-07-25', HOJE)).toBe('ontem')
  })

  it('conta os dias no caso da falha real', () => {
    // 26 → 30 é "daqui a 4 dias", nunca "mês que vem".
    expect(distanciaDeHoje(QUINTA, HOJE)).toBe('daqui a 4 dias')
  })

  it('conta atravessando o mês', () => {
    expect(distanciaDeHoje('2026-08-02', HOJE)).toBe('daqui a 7 dias')
  })

  it('marca o passado como passado', () => {
    expect(distanciaDeHoje('2026-07-20', HOJE)).toBe('há 6 dias')
  })

  it('entrada inválida não vira frase', () => {
    expect(distanciaDeHoje('lixo', HOJE)).toBe('')
    expect(distanciaDeHoje(HOJE, 'lixo')).toBe('')
  })
})

describe('fimDeSemana — avisar antes de marcar', () => {
  it('nomeia sábado e domingo', () => {
    expect(fimDeSemana('2026-08-08')).toBe('sábado')
    expect(fimDeSemana('2026-08-09')).toBe('domingo')
    expect(fimDeSemana(HOJE)).toBe('domingo')       // 26/07/2026 é domingo
  })

  it('dia útil devolve null — nada a avisar', () => {
    expect(fimDeSemana(QUINTA)).toBeNull()          // quinta
    expect(fimDeSemana('2026-08-03')).toBeNull()    // segunda
    expect(fimDeSemana('2026-08-07')).toBeNull()    // sexta
  })

  it('pega o caso que motivou a regra: "daqui a duas semanas" de um domingo', () => {
    // 26/07 + 14 dias = 09/08, domingo de novo — cálculo relativo cai em fim de
    // semana com frequência, e quase nunca é o que o dentista quis.
    expect(fimDeSemana('2026-08-09')).toBe('domingo')
  })

  it('entrada inválida não vira aviso', () => {
    expect(fimDeSemana('')).toBeNull()
    expect(fimDeSemana('09/08/2026')).toBeNull()
  })
})

describe('datasAmbiguas — "quinta que vem" não se resolve no chute', () => {
  it('devolve as DUAS quintas possíveis a partir de um domingo', () => {
    // O caso medido: a mesma frase deu 30/07 numa rodada e 06/08 na outra.
    expect(datasAmbiguas('quinta que vem', HOJE)).toEqual({
      proxima: '2026-07-30', seguinte: '2026-08-06', diaDaSemana: 'quinta',
    })
  })

  it('funciona com "próxima" e com acento', () => {
    expect(datasAmbiguas('próxima terça', HOJE)?.proxima).toBe('2026-07-28')
    expect(datasAmbiguas('proxima terca', HOJE)?.proxima).toBe('2026-07-28')
  })

  it('a próxima ocorrência é sempre DEPOIS de hoje, nunca hoje', () => {
    // 26/07 é domingo — "domingo que vem" é o dia 2, não hoje.
    expect(datasAmbiguas('domingo que vem', HOJE)?.proxima).toBe('2026-08-02')
  })

  it('data explícita NÃO é ambígua — não custa pergunta', () => {
    expect(datasAmbiguas('dia 6 de agosto', HOJE)).toBeNull()
    expect(datasAmbiguas('amanhã', HOJE)).toBeNull()
    expect(datasAmbiguas('daqui a duas semanas', HOJE)).toBeNull()
    expect(datasAmbiguas('quinta, dia 6', HOJE)).toBeNull()
    expect(datasAmbiguas('essa quinta', HOJE)).toBeNull()
  })

  it('"que vem" sem dia da semana não é desta família', () => {
    // "semana que vem" sozinha não nomeia um dia para desambiguar.
    expect(datasAmbiguas('semana que vem', HOJE)).toBeNull()
  })

  it('entrada vazia ou hoje inválido não vira pergunta', () => {
    expect(datasAmbiguas(undefined, HOJE)).toBeNull()
    expect(datasAmbiguas('quinta que vem', 'lixo')).toBeNull()
  })
})

describe('blocoDeHoje — a âncora que faltava no prompt', () => {
  it('afirma a data com dia da semana E em ISO', () => {
    const b = blocoDeHoje(HOJE)
    expect(b).toContain('domingo, 26 de julho de 2026')
    expect(b).toContain('2026-07-26')
  })

  it('proíbe explicitamente o erro que aconteceu', () => {
    expect(blocoDeHoje(HOJE)).toContain('mês que vem')
  })

  it('sem data válida não injeta bloco nenhum', () => {
    // Melhor prompt sem âncora do que prompt com âncora errada.
    expect(blocoDeHoje('')).toBe('')
    expect(blocoDeHoje('26/07/2026')).toBe('')
  })
})
