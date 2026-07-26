import { describe, expect, it } from 'vitest'
import { resumoPorDente, resumoUltimosAtendimentos } from './clinicalHistorySpeech'

const hoje = new Date(2026, 6, 26)

function atendimento(data: string, achados: string[], extra?: Partial<{ descricao: string; tratamento: string; dentes: string[] }>) {
  return { data, achados, descricao: extra?.descricao, tratamento: extra?.tratamento, dentes: extra?.dentes ?? [] }
}

describe('resumoUltimosAtendimentos', () => {
  it('sem atendimento nenhum, diz que não encontrou', () => {
    expect(resumoUltimosAtendimentos([], hoje)).toBe('Não encontrei atendimento anterior no histórico.')
  })

  // O caso real: 5 gravações do MESMO dia (Michelle Dratovsky) viram UMA frase.
  it('colapsa múltiplos registros do mesmo dia numa frase só', () => {
    const r = resumoUltimosAtendimentos([
      atendimento('2026-07-26', ['Dente 11: X'], { descricao: 'Exame clínico', dentes: ['11', '12'] }),
      atendimento('2026-07-26', ['Dente 11: X', 'Dente 12: Y'], { descricao: 'Exame clínico', dentes: ['11'] }),
      atendimento('2026-07-26', ['Dente 11: X'], { descricao: 'Exame clínico', dentes: ['11'] }),
    ], hoje)
    expect(r).toBe('dia 26/07: Exame clínico, 2 dentes tocados')
  })

  it('mantém o PRIMEIRO de cada dia (a RPC já ordena pelo mais recente)', () => {
    const r = resumoUltimosAtendimentos([
      atendimento('2026-07-26', [], { descricao: 'Restauração 26', dentes: ['26'] }),
      atendimento('2026-07-26', [], { descricao: 'Exame clínico', dentes: ['11'] }),
    ], hoje)
    expect(r).toBe('dia 26/07: Restauração 26, 1 dente tocado')
  })

  it('do mais recente para o mais antigo, respeitando o limite', () => {
    const r = resumoUltimosAtendimentos([
      atendimento('2026-07-26', [], { descricao: 'A' }),
      atendimento('2026-07-20', [], { descricao: 'B' }),
      atendimento('2026-06-01', [], { descricao: 'C' }),
      atendimento('2026-05-01', [], { descricao: 'D' }),
    ], hoje, 3)
    expect(r).toBe('dia 26/07: A; dia 20/07: B; dia 01/06: C')
  })

  it('sem dentes tocados, não menciona contagem', () => {
    const r = resumoUltimosAtendimentos([atendimento('2026-07-26', [], { descricao: 'Consulta' })], hoje)
    expect(r).toBe('dia 26/07: Consulta')
  })

  it('sem descrição nem tratamento, cai para "atendimento"', () => {
    const r = resumoUltimosAtendimentos([atendimento('2026-07-26', [])], hoje)
    expect(r).toBe('dia 26/07: atendimento')
  })
})

describe('resumoPorDente', () => {
  it('sem atendimento nenhum, diz que não encontrou', () => {
    expect(resumoPorDente([], 26)).toBe('Não encontrei atendimento com o dente 26 no histórico.')
  })

  it('extrai só a linha do dente pedido, sem repetir o prefixo', () => {
    const r = resumoPorDente([
      atendimento('2026-07-26', ['Dente 14: Restauração de resina composta', 'Dente 26: Restauração de amálgama']),
    ], 26)
    expect(r).toBe('dia 26/07: Restauração de amálgama')
  })

  it('um dia sem o dente pedido não aparece na resposta', () => {
    const r = resumoPorDente([
      atendimento('2026-07-26', ['Dente 26: Restauração de amálgama']),
      atendimento('2026-05-01', ['Dente 14: Cárie']),
    ], 26)
    expect(r).toBe('dia 26/07: Restauração de amálgama')
  })

  it('nenhum dia tem o dente, mensagem específica (não a genérica de histórico vazio)', () => {
    const r = resumoPorDente([atendimento('2026-07-26', ['Dente 14: Cárie'])], 26)
    expect(r).toBe('Não achei o dente 26 marcado nesses atendimentos.')
  })

  it('colapsa múltiplos registros do mesmo dia antes de procurar o dente', () => {
    const r = resumoPorDente([
      atendimento('2026-07-26', ['Dente 26: Restauração de amálgama']),
      atendimento('2026-07-26', ['Dente 26: Cárie (versão antiga)']),
    ], 26)
    expect(r).toBe('dia 26/07: Restauração de amálgama')
  })
})
