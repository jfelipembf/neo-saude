import { describe, expect, it, vi } from 'vitest'
import { CibellyAgent } from './cibellyAgent'
import { createSpecialistExecutors } from './toolExecutors'
import type { CibellyHandlers } from './sessionTypes'

function setup(initialHandlers: CibellyHandlers) {
  let handlers = initialHandlers
  const executors = createSpecialistExecutors({
    getHandlers: () => handlers,
    history: [],
    onApplied: vi.fn(),
  })
  return {
    agent: new CibellyAgent(),
    executors,
    replaceHandlers: (next: CibellyHandlers) => {
      handlers = next
    },
  }
}

describe('executores especialistas da Cibelly', () => {
  it('usa os handlers mais recentes sem recriar a sessão de voz', async () => {
    const first = vi.fn(async () => ['resina'])
    const second = vi.fn(async () => ['amálgama'])
    const harness = setup({ aoConsultarMateriais: first })

    await harness.agent.executeTool(
      'consultar_materiais',
      {},
      harness.executors,
    )
    harness.replaceHandlers({ aoConsultarMateriais: second })
    const result = await harness.agent.executeTool(
      'consultar_materiais',
      {},
      harness.executors,
    )

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ ok: true, materiais: ['amálgama'] })
  })

  it('preserva a mensagem de erro devolvida pelo envio de orçamento', async () => {
    const harness = setup({
      aoSolicitarOrcamento: vi.fn(async () => ({
        ok: false,
        erro: 'WhatsApp desconectado.',
      })),
    })

    const result = await harness.agent.executeTool(
      'solicitar_orcamento_fornecedor',
      { emFalta: true, confirmado: true },
      harness.executors,
    )

    expect(result).toEqual({
      ok: false,
      erro: 'WhatsApp desconectado.',
    })
  })

  it('delega a consulta do diretório ao Agente de Pacientes', async () => {
    const consult = vi.fn(async () => ({
      total: 1,
      resposta: 'Paciente encontrado: Lucas Silva (PAC-000001).',
    }))
    const harness = setup({ aoConsultarPacientes: consult })

    const result = await harness.agent.executeTool(
      'consultar_pacientes',
      { busca: 'Lucas' },
      harness.executors,
    )

    expect(consult).toHaveBeenCalledWith({ busca: 'Lucas' })
    expect(result).toMatchObject({
      ok: true,
      diretorio: {
        total: 1,
      },
    })
  })
})
