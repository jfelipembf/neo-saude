import {
  applyToothProposal,
  clearAllTeeth,
  clearTeeth,
  normalizeToothProposal,
  restoreOdontogram,
  snapshotOdontogram,
  verifyToothClearState,
  verifyToothProposalState,
} from '@/lib/odontogramShell/toothFields'
import type {
  CibellySpecialistExecutors,
  DelegatedToolCall,
} from './cibellyAgent'
import type {
  CibellyHandlers,
  DocumentRequest,
  MaterialUsage,
  PatientDirectoryRequest,
  PatientMessageRequest,
  QuoteRequest,
} from './sessionTypes'

const MAX_UNDO_SNAPSHOTS = 20

interface ToolExecutorsOptions {
  getHandlers: () => CibellyHandlers
  history: string[]
  onApplied: (summary: string | null) => void
}

function rememberSnapshot(history: string[], snapshot: string) {
  history.push(snapshot)
  if (history.length > MAX_UNDO_SNAPSHOTS) history.shift()
}

export function createSpecialistExecutors({
  getHandlers,
  history,
  onApplied,
}: ToolExecutorsOptions): CibellySpecialistExecutors {
  async function executeOdontogram({
    name,
    args: rawArgs,
  }: DelegatedToolCall): Promise<Record<string, unknown>> {
    const args = name === 'marcar_dente'
      ? normalizeToothProposal(rawArgs) as unknown as Record<string, unknown>
      : rawArgs

    if (name === 'marcar_dente') {
      const proposal = normalizeToothProposal(args)
      const before = snapshotOdontogram()
      const result = applyToothProposal(proposal)
      if (!result.ok) return { ok: false, erro: result.erro }

      rememberSnapshot(history, before)
      const verification = (() => {
        const first = verifyToothProposalState(proposal)
        if (!first.ok && !proposal.nota) {
          const retry = applyToothProposal(proposal)
          if (retry.ok) return verifyToothProposalState(proposal)
        }
        return first
      })()
      if (!verification.ok) {
        return { ok: false, erro: verification.erro, verificado: false }
      }

      onApplied(result.resumo)
      return {
        ok: true,
        aplicado: result.resumo,
        verificado: true,
        ...(result.recusados ? { recusados: result.recusados } : {}),
      }
    }

    if (name === 'restaurar_dente') {
      const before = snapshotOdontogram()
      const { dentes } = args as { dentes?: number[] }
      const result = clearTeeth(dentes ?? [], 'ausente')
      if (!result.ok) return { ok: false, erro: result.erro }

      rememberSnapshot(history, before)
      const verification = (() => {
        const first = verifyToothClearState(dentes, 'ausente')
        if (!first.ok) {
          const retry = clearTeeth(dentes ?? [], 'ausente')
          if (retry.ok) return verifyToothClearState(dentes, 'ausente')
        }
        return first
      })()
      if (!verification.ok) {
        return { ok: false, erro: verification.erro, verificado: false }
      }

      onApplied(result.resumo)
      return {
        ok: true,
        restaurado: result.resumo,
        verificado: true,
      }
    }

    if (name === 'apagar_marcacao') {
      const before = snapshotOdontogram()
      const { dentes, achado } = args as {
        dentes?: number[]
        achado?: string
      }
      const result = dentes?.length
        ? clearTeeth(dentes, achado as Parameters<typeof clearTeeth>[1])
        : clearAllTeeth()
      if (!result.ok) return { ok: false, erro: result.erro }

      rememberSnapshot(history, before)
      const verification = (() => {
        const first = verifyToothClearState(
          dentes,
          achado as Parameters<typeof clearTeeth>[1],
        )
        if (!first.ok) {
          const retry = dentes?.length
            ? clearTeeth(dentes, achado as Parameters<typeof clearTeeth>[1])
            : clearAllTeeth()
          if (retry.ok) {
            return verifyToothClearState(
              dentes,
              achado as Parameters<typeof clearTeeth>[1],
            )
          }
        }
        return first
      })()
      if (!verification.ok) {
        return { ok: false, erro: verification.erro, verificado: false }
      }

      onApplied(result.resumo)
      return {
        ok: true,
        apagado: result.resumo,
        verificado: true,
      }
    }

    if (name === 'ler_odontograma') {
      const read = getHandlers().aoLerOdontograma
      return read
        ? { ok: true, odontograma: await read(args as { dentes?: number[] }) }
        : { ok: false, erro: 'Não consegui ler o odontograma agora.' }
    }

    if (name === 'desfazer_ultima_marcacao') {
      const previous = history.pop()
      if (!previous) {
        return {
          ok: false,
          erro: 'Não há marcação recente para desfazer. Para apagar o que já estava na ficha, use apagar_marcacao.',
        }
      }
      if (restoreOdontogram(previous)) {
        onApplied(null)
        return { ok: true, desfeito: true }
      }
      history.push(previous)
      return {
        ok: false,
        erro: 'A ficha está aberta numa data anterior, só para leitura. Volte para "Atual" para desfazer.',
      }
    }

    return {
      ok: false,
      erro: `Ferramenta fora do Agente de Odontograma: ${name}`,
    }
  }

  async function executeRecords({
    name,
    args,
  }: DelegatedToolCall): Promise<Record<string, unknown>> {
    const handlers = getHandlers()
    if (name === 'consultar_historico') {
      return handlers.aoConsultarHistorico
        ? {
          ok: true,
          historico: await handlers.aoConsultarHistorico(
            args as { data?: string; dente?: number },
          ),
        }
        : { ok: false, erro: 'Não consegui ler o histórico agora.' }
    }
    if (name === 'criar_lembrete') {
      return handlers.aoCriarLembrete
        ? {
          ok: true,
          resultado: await handlers.aoCriarLembrete(
            args as { texto: string },
          ),
        }
        : { ok: false, erro: 'Não consegui salvar o lembrete.' }
    }
    if (name === 'concluir_lembrete') {
      return handlers.aoConcluirLembrete
        ? {
          ok: true,
          resultado: await handlers.aoConcluirLembrete(
            args as { id: string },
          ),
        }
        : { ok: false, erro: 'Não consegui concluir o lembrete.' }
    }
    return {
      ok: false,
      erro: `Ferramenta fora do Agente de Prontuário: ${name}`,
    }
  }

  async function executePatients({
    name,
    args,
  }: DelegatedToolCall): Promise<Record<string, unknown>> {
    if (name !== 'consultar_pacientes') {
      return {
        ok: false,
        erro: `Ferramenta fora do Agente de Pacientes: ${name}`,
      }
    }
    const consult = getHandlers().aoConsultarPacientes
    return consult
      ? {
        ok: true,
        diretorio: await consult(args as PatientDirectoryRequest),
      }
      : { ok: false, erro: 'Não consegui consultar os pacientes agora.' }
  }

  async function executeSchedule({
    name,
    args,
  }: DelegatedToolCall): Promise<Record<string, unknown>> {
    const handlers = getHandlers()
    if (name === 'consultar_agenda') {
      return handlers.aoConsultarAgenda
        ? {
          ok: true,
          agenda: await handlers.aoConsultarAgenda(
            args as {
              paciente?: string
              data?: string
              hora?: string
              duracao?: number
              dias?: number
            },
          ),
        }
        : { ok: false, erro: 'Não consegui ler a agenda agora.' }
    }
    if (name === 'agendar_consulta') {
      return handlers.aoAgendar
        ? {
          ok: true,
          resultado: await handlers.aoAgendar(args as {
            paciente?: string
            data: string
            hora: string
            duracao?: number
            servico?: string
            encaixe?: boolean
            sala?: string
            confirmaFimDeSemana?: boolean
            ditoPeloDentista?: string
            confirmaData?: boolean
          }),
        }
        : { ok: false, erro: 'Não há paciente em atendimento para agendar.' }
    }
    if (name === 'cancelar_consulta') {
      return handlers.aoCancelarConsulta
        ? {
          ok: true,
          resultado: await handlers.aoCancelarConsulta(args as {
            paciente?: string
            data: string
            hora?: string
            confirmado?: boolean
            ditoPeloDentista?: string
          }),
        }
        : { ok: false, erro: 'Não consegui cancelar agora.' }
    }
    return {
      ok: false,
      erro: `Ferramenta fora do Agente de Agenda: ${name}`,
    }
  }

  async function executeInventory({
    name,
    args,
  }: DelegatedToolCall): Promise<Record<string, unknown>> {
    const handlers = getHandlers()
    if (name === 'consultar_materiais') {
      const { busca, somenteAcabando } = args as {
        busca?: string
        somenteAcabando?: boolean
      }
      return handlers.aoConsultarMateriais
        ? {
          ok: true,
          materiais: await handlers.aoConsultarMateriais(
            busca,
            somenteAcabando,
          ),
        }
        : { ok: false, erro: 'Não consegui ler o estoque agora.' }
    }
    if (name === 'registrar_material_usado') {
      const { materiais } = args as { materiais?: MaterialUsage[] }
      if (!handlers.aoRegistrarMaterial || !materiais?.length) {
        return { ok: false, erro: 'Não entendi qual material foi usado.' }
      }
      return {
        ok: true,
        baixa: await handlers.aoRegistrarMaterial(materiais),
      }
    }
    if (name === 'solicitar_orcamento_fornecedor') {
      if (!handlers.aoSolicitarOrcamento) {
        return {
          ok: false,
          erro: 'Não consegui preparar o pedido de orçamento.',
        }
      }
      const request = await handlers.aoSolicitarOrcamento(
        args as unknown as QuoteRequest,
      )
      const failed = request
        && typeof request === 'object'
        && (request as { ok?: boolean }).ok === false
      return failed
        ? {
          ok: false,
          erro: (request as { erro?: string }).erro
            ?? 'Não consegui enviar o pedido de orçamento.',
        }
        : { ok: true, pedido: request }
    }
    return {
      ok: false,
      erro: `Ferramenta fora do Agente de Estoque e Compras: ${name}`,
    }
  }

  async function executeCommunication({
    name,
    args,
  }: DelegatedToolCall): Promise<Record<string, unknown>> {
    if (name !== 'enviar_mensagem_paciente') {
      return {
        ok: false,
        erro: `Ferramenta fora do Agente de Comunicação: ${name}`,
      }
    }
    const send = getHandlers().aoEnviarMensagemPaciente
    if (!send) {
      return {
        ok: false,
        erro: 'Não há paciente em atendimento para receber a mensagem.',
      }
    }
    const result = await send(args as unknown as PatientMessageRequest)
    const failed = result
      && typeof result === 'object'
      && (result as { ok?: boolean }).ok === false
    return failed
      ? {
        ok: false,
        erro: (result as { erro?: string }).erro
          ?? 'Não consegui enviar a mensagem.',
      }
      : { ok: true, envio: result }
  }

  async function executeDocuments({
    name,
    args,
  }: DelegatedToolCall): Promise<Record<string, unknown>> {
    if (name !== 'emitir_documento') {
      return {
        ok: false,
        erro: `Ferramenta fora do Agente de Documentos: ${name}`,
      }
    }
    const issue = getHandlers().aoEmitirDocumento
    if (!issue) {
      return {
        ok: false,
        erro: 'Não há paciente em atendimento para emitir documento.',
      }
    }
    // Igual ao Agente de Agenda com cancelar_consulta: o resultado INTEIRO
    // viaja dentro de "resultado", porque emitir_documento agora é
    // confirmation: 'tool_managed' — o orquestrador só enxerga
    // "precisaConfirmar" se ele sobreviver aninhado até aqui (ver
    // toolResultNeedsConfirmation em orchestrator.ts).
    return { ok: true, resultado: await issue(args as unknown as DocumentRequest) }
  }

  return {
    odontogram: executeOdontogram,
    patients: executePatients,
    records: executeRecords,
    schedule: executeSchedule,
    inventory: executeInventory,
    communication: executeCommunication,
    documents: executeDocuments,
  }
}
