import { describe, expect, it } from 'vitest'
import {
  surfaceRefusal, toolAvailableOnSurface, toolsForSurface,
} from './toolSurface'
import { CIBELLY_TOOL_CATALOG, type CibellyToolName } from './toolCatalog'

const TODAS = Object.keys(CIBELLY_TOOL_CATALOG) as CibellyToolName[]

// O ESCRITÓRIO — o que não se faz com um paciente na cadeira. Some do schema
// da sessão do odontograma porque ele é recobrado a cada turno (ver o docblock
// de toolSurface.ts), e continua a um pedal de distância na superfície global.
const DO_ESCRITORIO = [
  'consultar_pacientes',
  'solicitar_orcamento_fornecedor',
  'adicionar_ao_carrinho',
  'consultar_carrinho',
  'pedir_orcamento_do_carrinho',
]

describe('superfície do odontograma (a cadeira)', () => {
  it('atende as ferramentas do paciente, sem o fluxo de escritório', () => {
    expect(toolsForSurface('odontogram'))
      .toEqual(TODAS.filter(tool => !DO_ESCRITORIO.includes(tool)))
  })

  it.each(DO_ESCRITORIO)('não carrega %s — é do pedal geral', tool => {
    expect(toolAvailableOnSurface(tool, 'odontogram')).toBe(false)
  })

  // O material gasto é dito NA cadeira ("gastei uma resina") — é o registro que
  // mais se perde quando não é feito na hora. Fica, mesmo sendo do mesmo
  // domínio `inventory` do carrinho, que sai.
  it.each([
    'marcar_dente',
    'ler_odontograma',
    'consultar_materiais',
    'registrar_material_usado',
    'emitir_documento',
    'consultar_financeiro_paciente',
    'agendar_consulta',
  ])('carrega %s', tool => {
    expect(toolAvailableOnSurface(tool, 'odontogram')).toBe(true)
  })

  it('a recusa manda para o pedal geral, em vez de só negar', () => {
    const frase = surfaceRefusal('adicionar_ao_carrinho', 'odontogram')
    expect(frase).toContain('pedal geral')
  })
})

describe('superfície global (pedal F em qualquer tela)', () => {
  it('não oferece nenhuma ferramenta do odontograma', () => {
    for (const tool of toolsForSurface('global')) {
      expect(CIBELLY_TOOL_CATALOG[tool].domain).not.toBe('odontogram')
    }
  })

  it.each([
    'marcar_dente',
    'apagar_marcacao',
    'restaurar_dente',
    'ler_odontograma',
    'desfazer_ultima_marcacao',
  ])('recusa %s', tool => {
    expect(toolAvailableOnSurface(tool, 'global')).toBe(false)
  })

  it.each([
    'consultar_agenda',
    'agendar_consulta',
    'cancelar_consulta',
    'consultar_materiais',
    'solicitar_orcamento_fornecedor',
    'enviar_mensagem_paciente',
    'consultar_pacientes',
    'consultar_historico',
  ])('oferece %s', tool => {
    expect(toolAvailableOnSurface(tool, 'global')).toBe(true)
  })

  // O ponto do arquivo: comando de dente fora do odontograma não pode sumir
  // em silêncio com ela dizendo "marcado".
  it('a recusa diz O QUE FAZER, não só que não deu', () => {
    const recusa = surfaceRefusal('marcar_dente', 'global')
    expect(recusa).toContain('Abra a ficha do paciente no odontograma')
  })

  it('não recusa o que a superfície atende', () => {
    expect(surfaceRefusal('consultar_agenda', 'global')).toBeNull()
  })
})

describe('nome desconhecido', () => {
  it('não passa em superfície nenhuma', () => {
    expect(toolAvailableOnSurface('ferramenta_inventada', 'global')).toBe(false)
    expect(toolAvailableOnSurface('ferramenta_inventada', 'odontogram')).toBe(false)
  })

  it('recusa dizendo qual nome não existe', () => {
    expect(surfaceRefusal('ferramenta_inventada', 'odontogram'))
      .toBe('Ferramenta desconhecida: ferramenta_inventada')
  })
})

// Regra por DOMÍNIO, não por lista de nomes: ferramenta nova herda sozinha.
describe('ferramenta nova herda a regra do domínio', () => {
  it('toda ferramenta do catálogo tem veredito nas duas superfícies', () => {
    for (const tool of TODAS) {
      expect(typeof toolAvailableOnSurface(tool, 'global')).toBe('boolean')
      expect(typeof toolAvailableOnSurface(tool, 'odontogram')).toBe('boolean')
    }
  })

  // NENHUMA ferramenta pode ficar órfã: o que sai de uma superfície tem de
  // existir na outra, senão o recorte não economiza — apaga função.
  it('toda ferramenta do catálogo existe em pelo menos uma superfície', () => {
    for (const tool of TODAS) {
      expect(
        toolAvailableOnSurface(tool, 'global') || toolAvailableOnSurface(tool, 'odontogram'),
      ).toBe(true)
    }
  })
})
