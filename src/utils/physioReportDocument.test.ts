import { describe, expect, it } from 'vitest'
import { physioReportBody } from './physioReportDocument'
import type { DadosDoRelatorio } from './physioReportDocument'

const BASE: DadosDoRelatorio = {
  patientName: 'Michelle Dratovsky',
  patientCpf: '123.456.789-01',
  tratamento: 'Reabilitação de joelho direito',
  inicio: '01/06/2026',
  situacao: 'Em andamento',
  sessoesRealizadas: 8,
  sessoesPrevistas: 12,
  diagnosticos: [],
  testes: [],
  prontuario: [],
  longDate: '30 de julho de 2026',
  city: 'Aracaju',
  signer: { name: 'Ana Ribeiro', license: 'CREFITO-7 12345', specialty: 'physiotherapy' },
  analise: [],
}

describe('cabeçalho do relatório', () => {
  it('identifica paciente, tratamento e período', () => {
    const html = physioReportBody(BASE)
    expect(html).toContain('Michelle Dratovsky')
    expect(html).toContain('123.456.789-01')
    expect(html).toContain('Reabilitação de joelho direito')
    expect(html).toContain('desde 01/06/2026')
    expect(html).toContain('8 de 12')
  })

  it('mostra o período fechado quando o tratamento terminou', () => {
    const html = physioReportBody({ ...BASE, situacao: 'Finalizado', fim: '20/07/2026' })
    expect(html).toContain('01/06/2026 a 20/07/2026')
    expect(html).toContain('Finalizado')
  })
})

/**
 * O PONTO DO DESENHO: os números são montados aqui, do banco. A IA escreve só
 * a análise. Estes testes fixam que uma coisa não invade a outra.
 */
describe('números vêm dos dados, não da análise', () => {
  const comTeste: DadosDoRelatorio = {
    ...BASE,
    testes: [{
      teste: 'Escala de Berg',
      unidade: 'pontos',
      primeiro: { em: '01/06/2026', score: 34, nivel: 'Risco moderado de queda' },
      ultimo: { em: '25/07/2026', score: 49, nivel: 'Baixo risco de queda' },
      aplicacoes: 4,
    }],
  }

  it('imprime a diferença medida entre a primeira e a última aplicação', () => {
    const html = physioReportBody(comTeste)
    expect(html).toContain('34 pontos → 49 pontos')
    expect(html).toContain('(+15 pontos)')
    expect(html).toContain('Baixo risco de queda')
  })

  // Em Berg subir é melhorar; no TUG, subir é piorar. Chamar de "ganho" exigiria
  // saber a direção de cada instrumento, e errar isso escreveria a conclusão
  // oposta num documento assinado.
  it('não adjetiva a diferença — só mostra o sinal', () => {
    const html = physioReportBody({
      ...BASE,
      testes: [{
        teste: 'Timed Up and Go',
        unidade: 's',
        primeiro: { em: '01/06/2026', score: 18.4 },
        ultimo: { em: '25/07/2026', score: 12.1 },
        aplicacoes: 3,
      }],
    })
    expect(html).toContain('18.4 s → 12.1 s')
    expect(html).toContain('(-6.3 s)')
    expect(html).not.toMatch(/melhor|pior|ganho de|piora/i)
  })

  it('com uma aplicação só, mostra o valor sem inventar variação', () => {
    const html = physioReportBody({
      ...BASE,
      testes: [{
        teste: 'Escala de Berg',
        unidade: 'pontos',
        primeiro: { em: '01/06/2026', score: 34 },
        ultimo: { em: '01/06/2026', score: 34 },
        aplicacoes: 1,
      }],
    })
    expect(html).toContain('34 pontos')
    expect(html).not.toContain('→')
  })
})

// O que dá sentido a todo número que vem depois: um ganho de 15° só significa
// alguma coisa quando se sabe de qual quadro se partiu.
describe('diagnóstico e achados', () => {
  const comDx = {
    ...BASE,
    diagnosticos: [{
      diagnostico: 'Gonartrose grau II, joelho direito',
      achados: ['Dor 7/10 à flexão', 'Edema em face medial'],
    }],
  }

  it('abre o relatório, antes dos testes', () => {
    const html = physioReportBody(comDx)
    expect(html).toContain('Diagnóstico e achados clínicos')
    expect(html).toContain('Gonartrose grau II, joelho direito')
    expect(html).toContain('Dor 7/10 à flexão')
    expect(html.indexOf('Diagnóstico e achados')).toBeLessThan(html.indexOf('Michelle') + html.length)
  })

  it('vem ANTES da seção de testes', () => {
    const html = physioReportBody({ ...comDx, testes: [{
      teste: 'Escala de Berg', primeiro: { em: '01/06/2026', score: 34 },
      ultimo: { em: '25/07/2026', score: 49 }, aplicacoes: 2,
    }] })
    expect(html.indexOf('Diagnóstico e achados')).toBeLessThan(html.indexOf('Testes e escalas'))
  })
})

// Sinais vitais saíram do relatório: eram linhas que não contam evolução
// fisioterapêutica e alongavam o papel.
describe('o que NÃO entra mais', () => {
  it('não imprime sinais vitais', () => {
    const html = physioReportBody(BASE)
    expect(html).not.toContain('Sinais vitais')
    expect(html).not.toContain('SpO')
  })
})

describe('seções vazias', () => {
  it('some com a seção que não tem dado', () => {
    const html = physioReportBody(BASE)
    expect(html).not.toContain('Testes e escalas')
    expect(html).not.toContain('Evolução registrada')
  })

  // "Não melhorou" e "não foi medido" levam a condutas opostas.
  it('diz o que NÃO foi medido, em vez de só omitir', () => {
    const html = physioReportBody(BASE)
    expect(html).toContain('Sem registro neste tratamento')
    expect(html).toContain('nenhum teste ou escala aplicado')
    expect(html).toContain('diagnóstico não registrado')
  })

  it('avisa o teste aplicado uma vez só', () => {
    const html = physioReportBody({
      ...BASE,
      testes: [{ teste: 'Escala de Berg', primeiro: { em: '01/06/2026', score: 34 }, aplicacoes: 1 }],
    })
    expect(html).toContain('aplicados uma única vez: Escala de Berg')
  })
})

describe('a análise da IA', () => {
  it('entra em bloco próprio, separada das tabelas', () => {
    const html = physioReportBody({ ...BASE, analise: ['Houve ganho progressivo de equilíbrio.'] })
    expect(html).toContain('Avaliação final e recomendações')
    expect(html).toContain('Houve ganho progressivo de equilíbrio.')
  })

  // O relatório é o registro do que foi medido; a análise é leitura. Sem ela o
  // papel continua valendo.
  it('o relatório sai completo mesmo sem análise nenhuma', () => {
    const html = physioReportBody(BASE)
    expect(html).not.toContain('Avaliação final e recomendações')
    expect(html).toContain('Michelle Dratovsky')
    expect(html).toContain('Ana Ribeiro')
    expect(html).toContain('CREFITO-7 12345')
  })

  // A análise é texto de um modelo: entra no papel escapada, como todo o resto.
  it('escapa HTML vindo da análise', () => {
    const html = physioReportBody({ ...BASE, analise: ['risco <script>alert(1)</script>'] })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
