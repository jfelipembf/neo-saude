import { describe, expect, it } from 'vitest'
import { CibellyOrchestrator } from './orchestrator'
import { CIBELLY_TOOL_CATALOG, cibellyCapabilitiesPrompt, toolNeedsFollowUp } from './toolCatalog'

const calls = Array.from({ length: 5 }, (_, index) => ({
  call_id: `call-${index}`,
  name: 'solicitar_orcamento_fornecedor',
  arguments: '{}',
}))

describe('CibellyOrchestrator', () => {
  it('conhece as 16 ferramentas disponíveis', () => {
    const orchestrator = new CibellyOrchestrator()
    expect(Object.keys(orchestrator.tools)).toHaveLength(16)
    expect(orchestrator.getTool('solicitar_orcamento_fornecedor')?.domain).toBe('inventory')
    expect(orchestrator.getTool('ferramenta_inventada')).toBeNull()
  })

  it('deduplica call_id entre eventos individuais e response.done', () => {
    const orchestrator = new CibellyOrchestrator()
    expect(orchestrator.claimToolCalls(calls)).toHaveLength(5)
    expect(orchestrator.claimToolCalls(calls)).toHaveLength(0)
    expect(orchestrator.snapshot.toolsInFlight).toBe(5)
  })

  it('espera o lote inteiro e reserva uma única continuação', () => {
    const orchestrator = new CibellyOrchestrator()
    orchestrator.responseStarted()
    const accepted = orchestrator.claimToolCalls(calls)
    orchestrator.responseFinished()

    for (const call of accepted) {
      orchestrator.finishTool(call.name, { ok: true })
      expect(orchestrator.claimFollowUp()).toBe(
        call === accepted.at(-1) ? 'claimed' : 'blocked',
      )
    }

    expect(orchestrator.claimFollowUp()).toBe('blocked')
    expect(orchestrator.snapshot.responseRequested).toBe(true)
  })

  it('preserva a continuação até receber response.created', () => {
    const orchestrator = new CibellyOrchestrator()
    orchestrator.requestFollowUp()
    expect(orchestrator.claimFollowUp()).toBe('claimed')
    expect(orchestrator.snapshot.followUpRequested).toBe(true)

    orchestrator.responseStarted()
    expect(orchestrator.snapshot.followUpRequested).toBe(false)
    expect(orchestrator.snapshot.phase).toBe('responding')
  })

  it('mantém a fila quando a API informa resposta ativa', () => {
    const orchestrator = new CibellyOrchestrator()
    orchestrator.requestFollowUp()
    expect(orchestrator.claimFollowUp()).toBe('claimed')
    orchestrator.responseFailed(true)

    expect(orchestrator.snapshot.responseActive).toBe(true)
    expect(orchestrator.snapshot.followUpRequested).toBe(true)
    expect(orchestrator.claimFollowUp()).toBe('blocked')

    orchestrator.responseFinished()
    expect(orchestrator.claimFollowUp()).toBe('claimed')
  })

  it('limita tentativas de continuação e permite abandonar a fila', () => {
    const orchestrator = new CibellyOrchestrator(2)
    orchestrator.requestFollowUp()

    expect(orchestrator.claimFollowUp()).toBe('claimed')
    orchestrator.responseFailed(false)
    expect(orchestrator.claimFollowUp()).toBe('claimed')
    orchestrator.responseFailed(false)
    expect(orchestrator.claimFollowUp()).toBe('exhausted')

    orchestrator.abandonFollowUp()
    expect(orchestrator.snapshot).toMatchObject({ phase: 'idle', busy: false })
  })

  it('reinicia completamente entre atendimentos', () => {
    const orchestrator = new CibellyOrchestrator()
    orchestrator.responseStarted()
    orchestrator.claimToolCalls(calls)
    orchestrator.requestFollowUp()
    orchestrator.reset()

    expect(orchestrator.snapshot).toMatchObject({
      phase: 'idle',
      busy: false,
      toolsInFlight: 0,
      followUpRequested: false,
    })
    expect(orchestrator.claimToolCalls(calls)).toHaveLength(5)
  })
})

describe('catálogo de ferramentas', () => {
  it('mantém mutações odontológicas silenciosas quando têm sucesso', () => {
    expect(toolNeedsFollowUp('marcar_dente', { ok: true })).toBe(false)
    expect(toolNeedsFollowUp('restaurar_dente', { ok: true })).toBe(false)
    expect(toolNeedsFollowUp('apagar_marcacao', { ok: true })).toBe(false)
    expect(toolNeedsFollowUp('desfazer_ultima_marcacao', { ok: true })).toBe(false)
  })

  it('continua em consulta, confirmação, erro ou recusa parcial', () => {
    expect(toolNeedsFollowUp('consultar_materiais', { ok: true })).toBe(true)
    expect(toolNeedsFollowUp('solicitar_orcamento_fornecedor', { ok: true })).toBe(true)
    expect(toolNeedsFollowUp('restaurar_dente', { ok: false })).toBe(true)
    expect(toolNeedsFollowUp('marcar_dente', { ok: true, recusados: [19] })).toBe(true)
    expect(toolNeedsFollowUp('desconhecida', { ok: true })).toBe(true)
  })

  it('descreve todas as ferramentas no prompt compartilhado', () => {
    const prompt = cibellyCapabilitiesPrompt()
    for (const tool of Object.keys(CIBELLY_TOOL_CATALOG)) expect(prompt).toContain(tool)
  })
})
