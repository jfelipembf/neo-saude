import { describe, expect, it, vi } from 'vitest'
import {
  CibellyAgent,
  type CibellySpecialistExecutors,
  type SpecialistToolExecutor,
} from './cibellyAgent'

function executorsWith(inventory: SpecialistToolExecutor): CibellySpecialistExecutors {
  const unused = async () => ({ ok: true })
  return {
    odontogram: unused,
    patients: unused,
    records: unused,
    schedule: unused,
    inventory,
    communication: unused,
    documents: unused,
    finance: unused,
  }
}

describe('CibellyAgent confirmation idempotency', () => {
  it('reutiliza a mesma execução confirmada concorrente', async () => {
    let release: ((result: Record<string, unknown>) => void) | undefined
    const inventory = vi.fn(() => new Promise<Record<string, unknown>>(resolve => {
      release = resolve
    }))
    const agent = new CibellyAgent()
    const executors = executorsWith(inventory)
    const args = { emFalta: true, confirmado: true }

    const first = agent.executeTool('solicitar_orcamento_fornecedor', args, executors)
    const second = agent.executeTool(
      'solicitar_orcamento_fornecedor',
      { confirmado: true, emFalta: true },
      executors,
    )
    release?.({ ok: true, enviado: 2 })

    await expect(first).resolves.toEqual({ ok: true, enviado: 2 })
    await expect(second).resolves.toEqual({ ok: true, enviado: 2 })
    expect(inventory).toHaveBeenCalledTimes(1)
  })

  it('não memoriza confirmação que devolveu outra prévia', async () => {
    const inventory = vi.fn(async () => ({
      ok: true,
      pedido: { precisaConfirmar: true },
    }))
    const agent = new CibellyAgent()
    const executors = executorsWith(inventory)
    const args = { emFalta: true, confirmado: true }

    await agent.executeTool('solicitar_orcamento_fornecedor', args, executors)
    await agent.executeTool('solicitar_orcamento_fornecedor', args, executors)

    expect(inventory).toHaveBeenCalledTimes(2)
  })

  it('limpa execuções memorizadas ao reiniciar o atendimento', async () => {
    const inventory = vi.fn(async () => ({ ok: true, enviado: 2 }))
    const agent = new CibellyAgent()
    const executors = executorsWith(inventory)
    const args = { emFalta: true, confirmado: true }

    await agent.executeTool('solicitar_orcamento_fornecedor', args, executors)
    agent.reset()
    await agent.executeTool('solicitar_orcamento_fornecedor', args, executors)

    expect(inventory).toHaveBeenCalledTimes(2)
  })

  it('permite nova tentativa quando a execução lança erro', async () => {
    const inventory = vi.fn()
      .mockRejectedValueOnce(new Error('falha temporária'))
      .mockResolvedValueOnce({ ok: true, enviado: 2 })
    const agent = new CibellyAgent()
    const executors = executorsWith(inventory)
    const args = { emFalta: true, confirmado: true }

    await expect(agent.executeTool(
      'solicitar_orcamento_fornecedor',
      args,
      executors,
    )).rejects.toThrow('falha temporária')
    await expect(agent.executeTool(
      'solicitar_orcamento_fornecedor',
      args,
      executors,
    )).resolves.toEqual({ ok: true, enviado: 2 })

    expect(inventory).toHaveBeenCalledTimes(2)
  })
})
