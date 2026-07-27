import { describe, expect, it } from 'vitest'
import {
  descreverPaciente, resolverDestinatario, type PacienteParaMensagem,
} from './messageRecipient'

function paciente(
  code: string, name: string, extra?: Partial<PacienteParaMensagem>,
): PacienteParaMensagem {
  return { id: code, code, name, whatsapp: '79999371622', ...extra }
}

const CADASTRO: PacienteParaMensagem[] = [
  paciente('PAC-000001', 'Michelle Dratovsky'),
  paciente('PAC-000002', 'Ana Paula Souza'),
  paciente('PAC-000003', 'Ana Maria Ferreira'),
  paciente('PAC-000004', 'José Felipe Macedo', { commonName: 'Felipe' }),
  paciente('PAC-000005', 'Carlos Nunes', { whatsapp: undefined }),
]

describe('um paciente só', () => {
  it('acha pelo nome completo', () => {
    const r = resolverDestinatario(CADASTRO, 'Michelle Dratovsky')
    expect(r.ok && r.paciente.code).toBe('PAC-000001')
  })

  it('acha por parte do nome', () => {
    const r = resolverDestinatario(CADASTRO, 'michelle')
    expect(r.ok && r.paciente.code).toBe('PAC-000001')
  })

  it('não depende de acento', () => {
    const r = resolverDestinatario(CADASTRO, 'jose felipe')
    expect(r.ok && r.paciente.code).toBe('PAC-000004')
  })

  it('acha pelo nome comum (como a pessoa é chamada)', () => {
    const r = resolverDestinatario(CADASTRO, 'Felipe')
    expect(r.ok && r.paciente.code).toBe('PAC-000004')
  })
})

// ⚠️ O motivo deste arquivo existir. Mandar recado clínico para a Ana errada
// não se desfaz — é dado de saúde de uma pessoa chegando no celular de outra.
describe('homônimos', () => {
  it('com dois candidatos NÃO escolhe: pergunta', () => {
    const r = resolverDestinatario(CADASTRO, 'Ana')
    expect(r.ok).toBe(false)
    expect(!r.ok && r.erro).toContain('mais de um paciente')
  })

  it('lista os candidatos com o código, que é o que desempata na fala', () => {
    const r = resolverDestinatario(CADASTRO, 'Ana')
    expect(!r.ok && r.erro).toContain('Ana Paula Souza (PAC-000002)')
    expect(!r.ok && r.erro).toContain('Ana Maria Ferreira (PAC-000003)')
  })

  it('nome completo desempata o que "Ana" sozinho não desempatava', () => {
    const r = resolverDestinatario(CADASTRO, 'Ana Paula Souza')
    expect(r.ok && r.paciente.code).toBe('PAC-000002')
  })

  it('não estoura a fala quando há muitos homônimos', () => {
    const muitos = Array.from({ length: 20 }, (_, i) =>
      paciente(`PAC-${i}`, `Maria Silva ${i}`))
    const r = resolverDestinatario(muitos, 'Maria')
    expect(!r.ok && r.erro).toContain('e mais 12')
  })
})

describe('recusas', () => {
  it('nome que não existe', () => {
    const r = resolverDestinatario(CADASTRO, 'Fulano de Tal')
    expect(r).toEqual({ ok: false, erro: 'Não encontrei paciente com o nome "Fulano de Tal".' })
  })

  it('paciente sem WhatsApp recusa dizendo QUEM é', () => {
    const r = resolverDestinatario(CADASTRO, 'Carlos')
    expect(!r.ok && r.erro).toContain('Carlos Nunes (PAC-000005)')
    expect(!r.ok && r.erro).toContain('não tem WhatsApp')
  })

  it('nome vazio pede o nome em vez de mandar para alguém', () => {
    expect(resolverDestinatario(CADASTRO, '   ')).toEqual({
      ok: false, erro: 'Diga o nome do paciente.',
    })
  })

  it('cadastro vazio não resolve nada', () => {
    expect(resolverDestinatario([], 'Michelle').ok).toBe(false)
  })
})

describe('descreverPaciente', () => {
  it('nome completo mais código — é o que ela lê antes de enviar', () => {
    expect(descreverPaciente(CADASTRO[1])).toBe('Ana Paula Souza (PAC-000002)')
  })
})
