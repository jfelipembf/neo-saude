import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/utils/errors'
import { toIsoDate } from '@/utils/date'
import { GeminiLive } from '@/lib/cibelly/geminiLive'
import { bipDeSessao } from '@/lib/cibelly/geminiAudio'
import {
  acumularGemini, acumularOpenAI, USO_ZERADO,
  type Provedor, type UsoBruto,
} from '@/lib/cibelly/pricing'
import { recordCibellyUsage } from '@/services/cibellyUsageService'
import { CibellyAgent } from '@/lib/cibelly/cibellyAgent'
import { isClearAffirmativeConfirmation } from '@/lib/cibelly/confirmationIntent'
import { requestsLowStockQuote } from '@/lib/cibelly/workflowIntent'
import {
  describeConnectError,
  extractFunctionErrorMessage,
  resolveVoiceProvider,
  shouldTranscribeUser,
} from '@/lib/cibelly/sessionUtils'
import { createSpecialistExecutors } from '@/lib/cibelly/toolExecutors'
import { createOpenAIRealtimeEventHandler } from '@/lib/cibelly/openAIRealtimeEvents'
import {
  pedalScopeError,
  pedalTurnInstruction,
} from '@/lib/cibelly/pedal'
import type {
  CibellyHandlers,
  CibellyListeningMode,
  CibellyStatus,
} from '@/lib/cibelly/sessionTypes'
import { useCibellyActivity } from './useCibellyActivity'

export type {
  CibellyActivity as AtividadeCibelly,
  DocumentRequest,
  MaterialUsage,
  PatientMessageRequest,
  QuoteRequest,
  CibellyListeningMode as ModoEscutaCibelly,
  VoiceProvider as ProvedorDeVoz,
} from '@/lib/cibelly/sessionTypes'

/**
 * Cibelly — assistente de voz do odontograma. DOIS provedores.
 *
 * Fluxo: busca um token efêmero na Edge Function `cibelly-session` (a chave
 * real da OpenAI nunca sai do servidor), abre uma conexão WebRTC direto com a
 * OpenAI (áudio nunca passa pelo nosso backend) e ouve o data channel pelas
 * ferramentas como `marcar_dente`, `restaurar_dente` e
 * `desfazer_ultima_marcacao` (schema em supabase/functions/cibelly-session).
 *
 * MARCA DIRETO, sem etapa de confirmação. A versão anterior propunha e
 * esperava um "confirma?" falado; na prática isso dobrava o número de turnos e
 * enchia o atendimento de "certo, vou preparar a proposta" / "beleza, vou
 * aplicar agora". A rede de segurança passou a ser o DESFAZER: cada marcação
 * empilha uma foto do estado anterior, então "não, desfaz" volta exatamente ao
 * ponto de antes — inclusive em achado que zera outros campos (marcar ausente
 * limpa cárie e coroa, e reverter campo a campo erraria isso).
 */

interface ConfirmationVoiceTurn {
  id: string
  text: string
  responseDone: boolean
  toolCalled: boolean
  fallbackStarted: boolean
  lowStockQuoteRequested: boolean
  quotePrepared: boolean
}

const FOLLOW_UP_ACK_TIMEOUT_MS = 5_000
const CONFIRMATION_FALLBACK_DELAY_MS = 400

/**
 * @param ativa Liga/desliga a sessão. O microfone fica mudo até um pedal ser
 *   mantido pressionado e volta a ficar mudo assim que ele é solto.
 */
export function useCibelly(ativa: boolean, patientId: string | null, handlers: CibellyHandlers = {}) {
  const [status, setStatus] = useState<CibellyStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  /** Frase pronta do que foi marcado — já contando só os dentes que entraram. */
  const [lastApplied, setLastApplied] = useState<string | null>(null)
  /** Indica resposta ou ferramenta em andamento nos dois provedores. */
  const [processando, setProcessando] = useState(false)
  const [modoEscuta, setModoEscuta] = useState<CibellyListeningMode | null>(null)
  const [cibellyAgent] = useState(() => new CibellyAgent())
  const orchestrator = cibellyAgent.orchestrator
  const {
    activity: atividade,
    clear: limparAtividade,
    fillUserSpeech: preencherFala,
    publish: publicar,
    register: registrar,
    reserveUserSpeech: reservarFala,
  } = useCibellyActivity()

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const geminiRef = useRef<GeminiLive | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const modoDoTurnoRef = useRef<CibellyListeningMode | null>(null)
  const modoCapturaRef = useRef<CibellyListeningMode | null>(null)
  const pedalBloqueadoRef = useRef(false)
  const pedalUnlockTimerRef = useRef(0)
  const iniciarEscutaRef = useRef<(mode: CibellyListeningMode) => boolean>(
    () => false,
  )
  const encerrarEscutaRef = useRef<() => void>(() => {})
  /** Fotos do estado antes de cada marcação — pilha do "desfaz aí". */
  const historicoRef = useRef<string[]>([])

  /**
   * MEDIÇÃO TEMPORÁRIA de custo — ver src/lib/cibelly/pricing.ts.
   *
   * Acumula turno a turno e grava UMA linha ao encerrar a sessão (no cleanup
   * do efeito de conexão, que roda uma vez por ciclo liga/desliga — os deps
   * do efeito são só `ativa` mais callbacks estáveis). `provedorUsoRef` e
   * `modeloUsoRef` só são preenchidos depois que a conexão de fato abre; sem
   * eles, nada é gravado — sessão que falhou ao conectar não gastou nada.
   */
  const usoRef = useRef<UsoBruto>(USO_ZERADO)
  const provedorUsoRef = useRef<Provedor | null>(null)
  const modeloUsoRef = useRef<string>('')
  const inicioSessaoRef = useRef<Date>(new Date())
  /** A transcrição do dentista (whisper-1) estava ligada nesta sessão? Só
   *  importa pro cálculo do custo — ver cibellyUsageService.ts. */
  const transcricaoLigadaRef = useRef(false)

  // O callback vive numa ref, e não nas deps do efeito: a página recria o
  // objeto de handlers a cada render, e como deps isso reconectaria a sessão
  // WebRTC sem parar — derrubando o microfone no meio do exame.
  const handlersRef = useRef(handlers)
  useEffect(() => { handlersRef.current = handlers })
  // O paciente vai numa ref pelo MESMO motivo dos handlers: como dependência do
  // efeito, trocar de paciente derrubaria o microfone no meio do exame. É lido
  // uma vez, na conexão — que é quando a saudação e o prompt são montados. A
  // tela impede a troca durante o atendimento (o seletor trava e a URL é
  // devolvida), então este valor não envelhece dentro de uma sessão.
  const patientIdRef = useRef(patientId)
  useEffect(() => { patientIdRef.current = patientId })

  const liberarPedal = useCallback(() => {
    pedalBloqueadoRef.current = false
    setProcessando(false)
    if (pedalUnlockTimerRef.current) {
      window.clearTimeout(pedalUnlockTimerRef.current)
      pedalUnlockTimerRef.current = 0
    }
  }, [])

  const iniciarEscuta = useCallback((mode: CibellyListeningMode): boolean => {
    if (mode === 'patient' && !patientIdRef.current) return false
    if (pedalBloqueadoRef.current || modoCapturaRef.current) return false
    const started = iniciarEscutaRef.current(mode)
    if (!started) return false
    modoDoTurnoRef.current = mode
    modoCapturaRef.current = mode
    setModoEscuta(mode)
    return true
  }, [])

  const encerrarEscuta = useCallback(() => {
    if (!modoCapturaRef.current) return
    modoCapturaRef.current = null
    encerrarEscutaRef.current()
    setModoEscuta(null)
    pedalBloqueadoRef.current = true
    setProcessando(true)
    // Um toque sem fala pode não gerar evento final do provedor. A trava não
    // pode inutilizar o pedal nesse caso.
    pedalUnlockTimerRef.current = window.setTimeout(liberarPedal, 5_000)
  }, [liberarPedal])

  const [previouslyActive, setPreviouslyActive] = useState(ativa)
  if (ativa !== previouslyActive) {
    setPreviouslyActive(ativa)
    if (ativa) {
      limparAtividade()
    } else {
      setStatus('idle')
      setError(null)
      setProcessando(false)
      setModoEscuta(null)
    }
  }

  useEffect(() => {
    if (!ativa) return

    let cancelled = false
    let followUpAckTimer = 0
    let confirmationFallbackTimer = 0
    let confirmationVoiceTurn: ConfirmationVoiceTurn | null = null
    let geminiTurnSequence = 0
    // Lido uma vez, na abertura: trocar de provedor no meio de um atendimento
    // não faz sentido, e a URL é a mesma a sessão inteira.
    const provedor = resolveVoiceProvider()
    orchestrator.reset()

    function iniciarEscutaPeloPedal(mode: CibellyListeningMode): boolean {
      if (cancelled || (mode === 'patient' && !patientIdRef.current)) {
        return false
      }
      const instruction = pedalTurnInstruction(mode)

      if (provedor === 'gemini') {
        return geminiRef.current?.iniciarEscuta(instruction) ?? false
      }

      if (orchestrator.snapshot.busy) return false
      const dc = dcRef.current
      const tracks = micStreamRef.current?.getAudioTracks() ?? []
      if (dc?.readyState !== 'open' || tracks.length === 0) return false
      dc.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: instruction }],
        },
      }))
      tracks.forEach(track => {
        track.enabled = true
      })
      return true
    }

    function encerrarEscutaPeloPedal() {
      if (provedor === 'gemini') {
        geminiRef.current?.encerrarEscuta()
        return
      }
      micStreamRef.current?.getAudioTracks().forEach(track => {
        track.enabled = false
      })
    }

    iniciarEscutaRef.current = iniciarEscutaPeloPedal
    encerrarEscutaRef.current = encerrarEscutaPeloPedal

    function sincronizarProcessamento() {
      if (provedor === 'openai') setProcessando(orchestrator.snapshot.busy)
    }

    function clearFollowUpAckTimer() {
      if (!followUpAckTimer) return
      window.clearTimeout(followUpAckTimer)
      followUpAckTimer = 0
    }

    /** Envia no máximo UM `response.create`, somente quando a resposta anterior
     * terminou e TODAS as ferramentas do turno já devolveram o resultado. */
    function continuarQuandoPronto() {
      if (provedor !== 'openai' || cancelled) return
      const claim = orchestrator.claimFollowUp()
      if (claim === 'exhausted') {
        const mensagem = 'A Cibelly não conseguiu concluir a resposta da ferramenta após três tentativas. O atendimento continua ativo.'
        orchestrator.abandonFollowUp()
        setError(mensagem)
        registrar({ tipo: 'erro', texto: mensagem })
        sincronizarProcessamento()
        return
      }
      if (claim === 'blocked') {
        sincronizarProcessamento()
        return
      }

      const dc = dcRef.current
      if (dc?.readyState !== 'open') {
        orchestrator.responseFailed(false)
        window.setTimeout(continuarQuandoPronto, 250)
        sincronizarProcessamento()
        return
      }

      try {
        dc.send(JSON.stringify({ type: 'response.create' }))
      } catch {
        orchestrator.responseFailed(false)
        window.setTimeout(continuarQuandoPronto, 250)
        sincronizarProcessamento()
        return
      }

      clearFollowUpAckTimer()
      followUpAckTimer = window.setTimeout(() => {
        followUpAckTimer = 0
        if (cancelled || !orchestrator.snapshot.responseRequested) return
        orchestrator.responseFailed(false)
        continuarQuandoPronto()
      }, FOLLOW_UP_ACK_TIMEOUT_MS)
      sincronizarProcessamento()
    }

    function clearConfirmationFallbackTimer() {
      if (!confirmationFallbackTimer) return
      window.clearTimeout(confirmationFallbackTimer)
      confirmationFallbackTimer = 0
    }

    function beginConfirmationVoiceTurn(id: string, text = '') {
      clearConfirmationFallbackTimer()
      confirmationVoiceTurn = {
        id,
        text,
        responseDone: false,
        toolCalled: false,
        fallbackStarted: false,
        lowStockQuoteRequested: requestsLowStockQuote(text),
        quotePrepared: false,
      }
      scheduleConfirmationFallback()
    }

    function setConfirmationVoiceText(id: string, text: string) {
      if (!confirmationVoiceTurn || confirmationVoiceTurn.id !== id) {
        beginConfirmationVoiceTurn(id)
      }
      if (!confirmationVoiceTurn) return
      confirmationVoiceTurn.text = text
      confirmationVoiceTurn.lowStockQuoteRequested = requestsLowStockQuote(text)
      scheduleConfirmationFallback()
    }

    function finishConfirmationVoiceTurn() {
      if (!confirmationVoiceTurn) return
      confirmationVoiceTurn.responseDone = true
      scheduleConfirmationFallback()
    }

    function markConfirmationToolCall(name: string) {
      if (confirmationVoiceTurn
          && name === 'solicitar_orcamento_fornecedor') {
        confirmationVoiceTurn.quotePrepared = true
      }
      if (!confirmationVoiceTurn
          || name !== orchestrator.pendingConfirmationToolName) return
      confirmationVoiceTurn.toolCalled = true
      clearConfirmationFallbackTimer()
    }

    function scheduleConfirmationFallback() {
      clearConfirmationFallbackTimer()
      const turn = confirmationVoiceTurn
      if (!turn
          || turn.toolCalled
          || turn.fallbackStarted
          || !isClearAffirmativeConfirmation(turn.text)
          || !orchestrator.pendingConfirmationToolName) return

      confirmationFallbackTimer = window.setTimeout(() => {
        confirmationFallbackTimer = 0
        void executePendingConfirmation(turn)
      }, CONFIRMATION_FALLBACK_DELAY_MS)
    }

    async function executePendingConfirmation(turn: ConfirmationVoiceTurn) {
      if (cancelled
          || confirmationVoiceTurn !== turn
          || turn.toolCalled
          || turn.fallbackStarted) return

      const pending = orchestrator.claimPendingConfirmation()
      if (!pending) return
      turn.fallbackStarted = true

      const [call] = orchestrator.claimToolCalls([{
        call_id: `confirmation-${turn.id}-${pending.name}`,
        name: pending.name,
        arguments: JSON.stringify(pending.args),
      }])
      if (!call) return
      sincronizarProcessamento()

      let resultado: Record<string, unknown>
      try {
        resultado = await executarFerramenta(pending.name, pending.args)
      } catch (error) {
        resultado = {
          ok: false,
          erro: errorMessage(error, 'Não consegui concluir esta ação.'),
        }
      }
      registrar({
        tipo: 'ferramenta',
        texto: pending.name,
        args: JSON.stringify(pending.args),
        resultado: JSON.stringify(resultado),
      })

      const prompt =
        '[CONFIRMAÇÃO EXECUTADA PELO ORQUESTRADOR] A confirmação do dentista '
        + `já executou ${pending.name}. Resultado: ${JSON.stringify(resultado)}. `
        + 'Não chame a ferramenta novamente. Responda somente o resultado final em português.'

      if (provedor === 'gemini') {
        orchestrator.finishTool(pending.name, resultado, false)
        geminiRef.current?.enviarTexto(prompt)
        return
      }

      const dc = dcRef.current
      if (dc?.readyState === 'open') {
        dc.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: prompt }],
          },
        }))
      }
      orchestrator.finishTool(pending.name, resultado)
      sincronizarProcessamento()
      continuarQuandoPronto()
    }

    async function connect() {
      setStatus('connecting')
      setError(null)
      try {
        // Só o ID vai daqui. O nome do paciente é lido no servidor, pela RLS do
        // próprio dentista — mandar a string pronta seria injetar texto do
        // navegador dentro do prompt do modelo (ver cibelly-session/index.ts).
        const { data, error: fnError } = await supabase.functions.invoke('cibelly-session', {
          body: {
            patientId: patientIdRef.current,
            provider: provedor,
            // A data de HOJE sai daqui, do relógio da clínica — o servidor não
            // tem como saber o fuso dela, e "hoje" calculado em UTC vira
            // amanhã depois das 21h. Sem isto o modelo inventava a data de
            // referência (ver utils/spokenDate.ts).
            today: toIsoDate(new Date()),
            // `?transcrever=nao` desliga a transcrição da fala do dentista —
            // é o único item pago do painel de Atividade.
            transcribe: shouldTranscribeUser(),
          },
        })
        if (fnError) throw new Error(await extractFunctionErrorMessage(fnError) ?? fnError.message)
        const { token, setup, model } = data as { token?: string; setup?: Record<string, unknown>; model?: string }
        if (!token) throw new Error('Sessão da Cibelly incompleta.')
        if (cancelled) return

        // MEDIÇÃO TEMPORÁRIA — a Edge Function só devolve `model` no ramo da
        // OpenAI; no Gemini o nome vem dentro de `setup.model`, como
        // "models/gemini-3.1-flash-live-preview" (prefixo que a tabela de
        // preços não espera, daí o replace). Zera o acumulado aqui: é o início
        // desta sessão, não a continuação da anterior.
        provedorUsoRef.current = provedor
        modeloUsoRef.current = model ?? String(setup?.model ?? '').replace(/^models\//, '')
        usoRef.current = USO_ZERADO
        inicioSessaoRef.current = new Date()
        transcricaoLigadaRef.current = shouldTranscribeUser()

        // getUserMedia só existe em contexto seguro (https, ou http só em
        // localhost) — vale para os dois provedores, então a checagem vem antes
        // da bifurcação.
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new DOMException(
            'O microfone só é acessível em conexão segura (https) ou em localhost.',
            'SecurityError',
          )
        }

        // ── GEMINI LIVE ─────────────────────────────────────────────────────
        // WebSocket, não WebRTC: o áudio é encodado, mandado, recebido e tocado
        // por nós (ver src/lib/cibelly/geminiAudio.ts).
        if (provedor === 'gemini') {
          if (!setup) throw new Error('Sessão da Cibelly incompleta (setup ausente).')
          const live = new GeminiLive(token, setup, {
            aoConectar: () => { if (!cancelled) { setStatus('listening'); bipDeSessao() } },
            aoErrar: msg => {
              if (!cancelled) {
                liberarPedal()
                setStatus('error')
                setError(msg)
                registrar({ tipo: 'erro', texto: msg })
              }
            },
            aoFalar: texto => registrar({ tipo: 'fala', texto }),
            aoOuvir: texto => {
              registrar({ tipo: 'dentista', texto })
              beginConfirmationVoiceTurn(
                `gemini-${++geminiTurnSequence}`,
                texto,
              )
            },
            aoTurnoConcluido: () => {
              finishConfirmationVoiceTurn()
              liberarPedal()
            },
            // MEDIÇÃO TEMPORÁRIA — ver src/lib/cibelly/pricing.ts.
            aoMedirUso: meta => { usoRef.current = acumularGemini(usoRef.current, meta) },
            aoProcessando: setProcessando,
            aoFechar: msg => {
              if (cancelled || !msg) return
              liberarPedal()
              setStatus('error')
              setError(msg)
            },
            aoChamarFerramenta: async ({ id, name, args }) => {
              const [call] = orchestrator.claimToolCalls([{
                call_id: id,
                name,
                arguments: JSON.stringify(args),
              }])
              if (!call) return { ok: true, duplicado: true }
              markConfirmationToolCall(name)
              console.info('[Cibelly] ferramenta:', name, args)
              let resultado: Record<string, unknown> = {
                ok: false,
                erro: 'Não consegui concluir esta ação.',
              }
              try {
                resultado = await executarFerramenta(name, args)
              } catch (error) {
                resultado = {
                  ok: false,
                  erro: errorMessage(error, 'Não consegui concluir esta ação.'),
                }
              } finally {
                orchestrator.finishTool(name, resultado, false)
              }
              registrar({ tipo: 'ferramenta', texto: name,
                args: JSON.stringify(args), resultado: JSON.stringify(resultado) })
              return resultado
            },
          })
          geminiRef.current = live
          await live.conectar()
          return
        }
        // ── OPENAI REALTIME (WebRTC) ────────────────────────────────────────

        // Explícito, não no default do navegador: em tela cheia o áudio dela
        // sai pelo alto-falante e volta pelo microfone, e o consultório tem
        // sugador e aspirador ligados. Sem cancelamento de eco, a própria voz
        // da Cibelly dispara o detector de fala do servidor.
        const mic = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        })
        if (cancelled) { mic.getTracks().forEach(t => t.stop()); return }
        mic.getAudioTracks().forEach(track => {
          track.enabled = false
        })
        micStreamRef.current = mic

        const pc = new RTCPeerConnection()
        pcRef.current = pc
        mic.getTracks().forEach(track => pc.addTrack(track, mic))

        const audioEl = document.createElement('audio')
        audioEl.autoplay = true
        document.body.appendChild(audioEl)
        audioElRef.current = audioEl
        pc.ontrack = event => { audioEl.srcObject = event.streams[0] }

        const dc = pc.createDataChannel('oai-events')
        dcRef.current = dc
        dc.onmessage = handleRealtimeEvent
        dc.onopen = () => {
          if (cancelled) return
          setStatus('listening')
          // BIP no lugar da saudação falada. Dois tons dizem "estou ouvindo"
          // melhor que uma frase, e não custam o turno mais caro da sessão —
          // o primeiro, com o cache ainda frio.
          bipDeSessao()
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        // A OpenAI trocou este endpoint (7/2026): era /v1/realtime?model=... —
        // agora é /v1/realtime/calls e não recebe mais o model por query
        // param (o modelo já veio embutido no client_secret pela função
        // cibelly-session).
        const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
          method: 'POST',
          body: offer.sdp,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/sdp' },
        })
        if (!sdpRes.ok) throw new Error('Não foi possível conectar a Cibelly.')
        const answerSdp = await sdpRes.text()
        if (cancelled) return
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
      } catch (err) {
        // O catch genérico escondia qual passo falhou (token, mic, SDP…) —
        // loga o erro real pro DevTools e diferencia a mensagem mostrada pelas
        // causas mais comuns de bloqueio de microfone (permissão negada,
        // sem dispositivo, contexto inseguro).
        console.error('[Cibelly] falha ao conectar:', err)
        if (!cancelled) {
          setStatus('error')
          setError(describeConnectError(err))
        }
      }
    }

    const specialistExecutors = createSpecialistExecutors({
      getHandlers: () => handlersRef.current,
      history: historicoRef.current,
      onApplied: setLastApplied,
    })

    async function executarFerramenta(
      nome: string,
      rawArgs: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
      const scopeError = pedalScopeError(
        modoDoTurnoRef.current,
        orchestrator.getTool(nome)?.domain,
        nome,
        rawArgs,
      )
      if (scopeError) {
        return {
          ok: false,
          erro: scopeError,
        }
      }

      const result = await cibellyAgent.executeTool(
        nome,
        rawArgs,
        specialistExecutors,
      )
      const turn = confirmationVoiceTurn
      if (nome !== 'consultar_materiais'
          || result.ok !== true
          || !turn?.lowStockQuoteRequested
          || turn.quotePrepared) return result

      turn.quotePrepared = true
      const quoteArgs = { emFalta: true }
      let quoteResult: Record<string, unknown>
      try {
        quoteResult = await cibellyAgent.executeTool(
          'solicitar_orcamento_fornecedor',
          quoteArgs,
          specialistExecutors,
        )
      } catch (error) {
        quoteResult = {
          ok: false,
          erro: errorMessage(error, 'Não consegui preparar o orçamento.'),
        }
      }
      registrar({
        tipo: 'ferramenta',
        texto: 'solicitar_orcamento_fornecedor',
        args: JSON.stringify(quoteArgs),
        resultado: JSON.stringify(quoteResult),
      })

      return {
        ...result,
        fluxoAutomatico: {
          etapa: 'orcamento_fornecedor',
          resultado: quoteResult,
          instrucao:
            'O pedido composto já avançou para o orçamento. Não peça ao dentista para solicitar novamente. Se houver uma prévia, leia os destinatários e peça apenas a confirmação de envio.',
        },
      }
    }

    const handleRealtimeEvent = createOpenAIRealtimeEventHandler({
      orchestrator,
      getDataChannel: () => dcRef.current,
      clearFollowUpTimer: clearFollowUpAckTimer,
      continueWhenReady: continuarQuandoPronto,
      syncProcessing: sincronizarProcessamento,
      register: registrar,
      publish: publicar,
      reserveUserSpeech: reservarFala,
      fillUserSpeech: preencherFala,
      beginConfirmationTurn: beginConfirmationVoiceTurn,
      setConfirmationText: setConfirmationVoiceText,
      finishConfirmationTurn: finishConfirmationVoiceTurn,
      markConfirmationToolCall,
      executeTool: executarFerramenta,
      measureUsage: usage => {
        usoRef.current = acumularOpenAI(usoRef.current, usage)
      },
      setError,
      onIdle: liberarPedal,
    })

    connect()

    return () => {
      cancelled = true
      encerrarEscutaPeloPedal()
      iniciarEscutaRef.current = () => false
      encerrarEscutaRef.current = () => {}
      modoCapturaRef.current = null
      liberarPedal()

      // MEDIÇÃO TEMPORÁRIA — grava a sessão que está encerrando. Fogo-e-esqueça
      // (sem await: cleanup de efeito não pode ser async) — a própria função
      // já não lança e já pula sessão sem uso nenhum (conectou e caiu na hora).
      if (provedorUsoRef.current) {
        void recordCibellyUsage({
          patientId: patientIdRef.current,
          provider: provedorUsoRef.current,
          model: modeloUsoRef.current,
          uso: usoRef.current,
          startedAt: inicioSessaoRef.current,
          endedAt: new Date(),
          transcricaoLigada: transcricaoLigadaRef.current,
        })
        provedorUsoRef.current = null
      }

      // Encerra os dois caminhos sem perguntar qual estava ativo: o outro é
      // no-op, e uma bifurcação aqui seria a chance de deixar um microfone
      // aberto quando o provedor mudasse.
      geminiRef.current?.encerrar()
      geminiRef.current = null
      dcRef.current?.close()
      pcRef.current?.close()
      // Soltar as trilhas é o que de fato apaga o indicador de microfone do
      // sistema — fechar só a conexão deixaria o mic "ligado" aos olhos de quem
      // está na cadeira.
      micStreamRef.current?.getTracks().forEach(track => track.stop())
      audioElRef.current?.remove()
      dcRef.current = null
      pcRef.current = null
      micStreamRef.current = null
      audioElRef.current = null
      orchestrator.reset()
      clearFollowUpAckTimer()
      clearConfirmationFallbackTimer()
    }
  }, [ativa, cibellyAgent, orchestrator, registrar, reservarFala, preencherFala, publicar, liberarPedal])

  return {
    status,
    error,
    lastApplied,
    atividade,
    processando,
    modoEscuta,
    iniciarEscuta,
    encerrarEscuta,
  }
}
