import { describe, expect, it } from 'vitest'
import {
  surfaceRefusal, toolAvailableOnSurface, toolsForSurface,
} from './toolSurface'
import { CIBELLY_TOOL_CATALOG, type CibellyToolName } from './toolCatalog'

const TODAS = Object.keys(CIBELLY_TOOL_CATALOG) as CibellyToolName[]

describe('superfície do odontograma', () => {
  it('atende TODAS as ferramentas — é onde o desenho está montado', () => {
    expect(toolsForSurface('odontogram')).toEqual(TODAS)
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
      expect(toolAvailableOnSurface(tool, 'odontogram')).toBe(true)
    }
  })
})
