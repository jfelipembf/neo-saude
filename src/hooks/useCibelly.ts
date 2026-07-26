import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  applyToothProposal, clearAllTeeth, clearTeeth, restoreOdontogram, snapshotOdontogram,
  type ToothProposal, type ToothProposalResult,
} from '@/lib/odontogramShell/toothFields'
import { errorMessage } from '@/utils/errors'
import { toIsoDate } from '@/utils/date'
import { GeminiLive } from '@/lib/cibelly/geminiLive'
import { bipDeSessao } from '@/lib/cibelly/geminiAudio'
import {
  acumularGemini, acumularOpenAI, USO_ZERADO,
  type Provedor, type UsoBruto, type UsoRealtimeOpenAI,
} from '@/lib/cibelly/pricing'
import { recordCibellyUsage } from '@/services/cibellyUsageService'

/**
 * Cibelly — assistente de voz do odontograma. DOIS provedores.
 *
 * Fluxo: busca um token efêmero na Edge Function `cibelly-session` (a chave
 * real da OpenAI nunca sai do servidor), abre uma conexão WebRTC direto com a
 * OpenAI (áudio nunca passa pelo nosso backend) e ouve o data channel pelas
 * duas ferramentas que a sessão registra: `marcar_dente` e
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

/** Quantas marcações dá pra desfazer. Fotos do estado inteiro (32 dentes) —
 *  o teto existe para a pilha não crescer sem fim num exame longo. */
const MAX_DESFAZER = 20

/** Qual provedor de voz atende. */
export type ProvedorDeVoz = 'openai' | 'gemini'

/**
 * PROVEDOR ATIVO — OpenAI, por medição, não por tabela de preço.
 *
 * O Gemini foi o padrão por um dia, no argumento de que o áudio dele custa 10x
 * menos. A medição derrubou isso: a Realtime da OpenAI CACHEIA o contexto (do
 * segundo turno em diante, só ~15 dos 9.350 tokens pagam preço cheio) e a Live
 * do Gemini NÃO cacheia — relê 21 mil tokens inteiros, sempre.
 * Medido nos dois, no mesmo roteiro: US$ 0,00057/turno no gpt-realtime-2.1-mini
 * contra US$ 0,014 no gemini-3.1-flash-live. Vinte e cinco vezes.
 *
 * Tentei o `contextWindowCompression` do Gemini para recuperar isso: sem efeito
 * (85.044 contra 85.082 tokens no mesmo roteiro — ruído).
 *
 * O Gemini continua inteiro em `?voz=gemini`: o critério que sobra é o OUVIDO,
 * na cadeira, e esse é seu.
 */
const PROVEDOR_PADRAO: ProvedorDeVoz = 'openai'

/** Transcrever a fala do dentista? Pago (~26% da consulta), então é escolha. */
function transcreverFala(): boolean {
  if (typeof window === 'undefined') return true
  return new URLSearchParams(window.location.search).get('transcrever') !== 'nao'
}

function provedorEscolhido(): ProvedorDeVoz {
  if (typeof window === 'undefined') return PROVEDOR_PADRAO
  const v = new URLSearchParams(window.location.search).get('voz')
  return v === 'openai' || v === 'gemini' ? v : PROVEDOR_PADRAO
}

type CibellyStatus = 'idle' | 'connecting' | 'listening' | 'error'

interface RealtimeFunctionCallDoneEvent {
  type: 'response.function_call_arguments.done'
  call_id: string
  name: string
  arguments: string
}

interface RealtimeResponseDoneEvent {
  type: 'response.done'
  response?: {
    output?: Array<{ type?: string; call_id?: string; name?: string; arguments?: string }>
    /** MEDIÇÃO TEMPORÁRIA — ver src/lib/cibelly/pricing.ts. */
    usage?: UsoRealtimeOpenAI
  }
}

interface RealtimeFunctionCall {
  call_id: string
  name: string
  arguments: string
}

/** `response.function_call_arguments.done` dispara por item; `response.done`
 *  é o evento "guarda-chuva" ao final de cada turno, com TODOS os itens da
 *  resposta (inclusive function_call) — a API já mudou de forma uma vez (ver
 *  cibelly-session/index.ts), então escutamos os dois e deduplicamos por
 *  call_id, em vez de apostar só num nome de evento. */
function extractFunctionCalls(event: unknown): RealtimeFunctionCall[] {
  if (!event || typeof event !== 'object') return []
  const type = (event as { type?: unknown }).type

  if (type === 'response.function_call_arguments.done') {
    const e = event as RealtimeFunctionCallDoneEvent
    return [{ call_id: e.call_id, name: e.name, arguments: e.arguments }]
  }

  if (type === 'response.done') {
    const output = (event as RealtimeResponseDoneEvent).response?.output ?? []
    return output
      .filter((item): item is Required<typeof item> => item.type === 'function_call' && !!item.call_id && !!item.name && item.arguments !== undefined)
      .map(item => ({ call_id: item.call_id, name: item.name, arguments: item.arguments }))
  }

  return []
}

/** Traduz os erros mais comuns de getUserMedia/WebRTC pra uma mensagem que diz o que fazer, não só que falhou. */
function describeConnectError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : null
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Permissão de microfone negada. Libere o microfone para este site nas configurações do navegador (ícone de cadeado na barra de endereço) e recarregue a página.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Nenhum microfone foi encontrado neste dispositivo.'
    case 'NotReadableError':
      return 'Não foi possível acessar o microfone — verifique se outro programa não está usando ele.'
    case 'SecurityError':
      return err instanceof DOMException ? err.message : 'O microfone só é acessível em conexão segura (https) ou em localhost.'
    default:
      // supabase-js só relata "Edge Function returned a non-2xx status code"
      // por padrão — o corpo real (com o motivo, ex. erro da própria OpenAI)
      // vem de extractFunctionErrorMessage e chega aqui como err.message.
      return errorMessage(err, 'Não foi possível iniciar a Cibelly. Tente novamente.')
  }
}

/** O erro padrão do supabase-js (`FunctionsHttpError`) não expõe o corpo da resposta — precisa ler `context` (a Response crua) manualmente. */
async function extractFunctionErrorMessage(fnError: unknown): Promise<string | null> {
  const context = (fnError as { context?: unknown } | null)?.context
  if (!(context instanceof Response)) return null
  try {
    const body = await context.clone().json()
    return typeof body?.error === 'string' ? body.error : null
  } catch {
    return null
  }
}

/**
 * Uma linha do DIÁRIO DO ATENDIMENTO — o que ela falou, o que ela executou e o
 * que a ferramenta devolveu.
 *
 * Substitui o painel de transcrição que saiu daqui por custo. A diferença é que
 * este é DE GRAÇA: a transcrição da fala DELA vem junto do próprio áudio
 * gerado, e as chamadas de ferramenta são nossas — quem custava era a
 * transcrição da fala do DENTISTA (whisper, modelo à parte, por minuto), e essa
 * continua desligada.
 *
 * E para diagnosticar "ela não marcou o 23" isto é melhor que a transcrição:
 * mostra se a ferramenta foi chamada, com quais argumentos e o que voltou —
 * que é onde a falha mora.
 */
export interface AtividadeCibelly {
  id: number
  em: number
  tipo: 'dentista' | 'fala' | 'ferramenta' | 'erro'
  texto: string
  /** Só em 'dentista': liga a reserva à transcrição que chega depois. */
  itemId?: string
  /** Só em 'ferramenta': argumentos que ela mandou e o que a ferramenta devolveu. */
  args?: string
  resultado?: string
}

/** O que a Cibelly pediu para emitir — o schema completo está na Edge Function. */
export interface DocumentRequest {
  tipo: 'receita' | 'atestado' | 'comparecimento' | 'exame'
  medicamentos?: { nome: string; posologia: string; quantidade?: string }[]
  dias?: number
  texto?: string
  horaEntrada?: string
  horaSaida?: string
  exames?: string[]
  dentes?: number[]
  justificativa?: string
  observacoes?: string
}

/** Consumo ditado pelo dentista — a quantidade é texto ("2 seringas"). */
export interface MaterialUsage {
  nome: string
  quantidade: string
}

export interface QuoteRequest {
  material: string
  quantidade?: string
  fornecedor?: string
}

interface CibellyHandlers {
  /**
   * Emite o documento. Fica FORA do hook de propósito: quem tem paciente,
   * profissional e clínica em mãos é a página — o hook não deve conhecer nada
   * disso, só repassar o pedido e devolver o resultado para ela falar.
   */
  aoEmitirDocumento?: (pedido: DocumentRequest) => Promise<ToothProposalResult>
  /** Consulta de estoque/fornecedores. Devolve o que ela vai falar. */
  aoConsultarMateriais?: (busca?: string, somenteAcabando?: boolean) => Promise<unknown>
  /** Registra o consumo e dá baixa. Devolve o estado do material depois da baixa. */
  aoRegistrarMaterial?: (materiais: MaterialUsage[]) => Promise<unknown>
  /** Dispara o pedido de orçamento ao fornecedor. */
  aoSolicitarOrcamento?: (pedido: QuoteRequest) => Promise<unknown>
  /** Horários livres / se um horário específico serve. */
  aoConsultarAgenda?: (p: { data?: string; hora?: string; duracao?: number; dias?: number }) => Promise<unknown>
  /** Cancela uma consulta já marcada do paciente — em duas etapas (ver `confirmado`). */
  aoCancelarConsulta?: (p: { data: string; hora?: string; confirmado?: boolean; ditoPeloDentista?: string }) => Promise<unknown>
  /** O que está marcado no odontograma agora — a leitura que faltava. */
  aoLerOdontograma?: (p: { dentes?: number[] }) => Promise<unknown>
  /**
   * Resumo clínico do paciente. Sem filtro: os últimos atendimentos, documentos
   * e lembretes abertos. Com `data` e/ou `dente`: busca DIRECIONADA no
   * histórico inteiro (não só os mais recentes) — para "o que foi feito no
   * dente 26 na consulta de março?", que uma leitura só dos últimos perderia se
   * o paciente já teve atendimentos mais novos desde então.
   */
  aoConsultarHistorico?: (p?: { data?: string; dente?: number }) => Promise<unknown>
  /** Deixa um lembrete para o PRÓXIMO atendimento deste paciente. */
  aoCriarLembrete?: (p: { texto: string }) => Promise<unknown>
  /** Marca um lembrete como resolvido (id vem da leitura do histórico). */
  aoConcluirLembrete?: (p: { id: string }) => Promise<unknown>
  /** Agenda a consulta. Devolve o motivo quando o horário não serve. */
  aoAgendar?: (p: {
    data: string; hora: string; duracao?: number; servico?: string; encaixe?: boolean; sala?: string; confirmaFimDeSemana?: boolean; ditoPeloDentista?: string; confirmaData?: boolean
  }) => Promise<unknown>
}

/**
 * @param ativa Liga/desliga a escuta. A Cibelly só conecta quando o
 *   atendimento é iniciado de propósito: num consultório, microfone aberto o
 *   tempo todo em que a tela está aberta capta a conversa entre pacientes.
 *   Desligar encerra a sessão WebRTC E solta o microfone (o LED do aparelho
 *   apaga — é o sinal que a pessoa na cadeira enxerga).
 */
export function useCibelly(ativa: boolean, patientId: string | null, handlers: CibellyHandlers = {}) {
  const [status, setStatus] = useState<CibellyStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  /** Frase pronta do que foi marcado — já contando só os dentes que entraram. */
  const [lastApplied, setLastApplied] = useState<string | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const geminiRef = useRef<GeminiLive | null>(null)
  /** Há uma resposta da OpenAI em curso? Ver o `response.create` no fim do laço. */
  const respostaEmVooRef = useRef(false)
  /** Fala pedida enquanto outra resposta corria — sai no `response.done`. */
  const falaPendenteRef = useRef(false)

  /** Diário do atendimento. Acumula em ref e publica em lote — uma chamada de
   *  ferramenta por dente renderizaria a tela inteira a cada marcação. */
  const [atividade, setAtividade] = useState<AtividadeCibelly[]>([])
  const atividadeRef = useRef<AtividadeCibelly[]>([])
  const flushRef = useRef(0)
  const seqRef = useRef(0)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
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

  // O callback vive numa ref, e não nas deps do efeito: a página recria o
  // objeto de handlers a cada render, e como deps isso reconectaria a sessão
  // WebRTC sem parar — derrubando o microfone no meio do exame.
  const handlersRef = useRef(handlers)
  useEffect(() => { handlersRef.current = handlers })
  const processedCallIdsRef = useRef<Set<string>>(new Set())

  // O paciente vai numa ref pelo MESMO motivo dos handlers: como dependência do
  // efeito, trocar de paciente derrubaria o microfone no meio do exame. É lido
  // uma vez, na conexão — que é quando a saudação e o prompt são montados. A
  // tela impede a troca durante o atendimento (o seletor trava e a URL é
  // devolvida), então este valor não envelhece dentro de uma sessão.
  const patientIdRef = useRef(patientId)
  useEffect(() => { patientIdRef.current = patientId })

  // Encerrar o atendimento zera o que era da sessão anterior. Ajuste durante a
  // renderização, e não setState dentro do efeito: a limpeza dos recursos
  // (conexão, microfone) fica no cleanup logo abaixo, que é o lugar certo dela.
  const [ativaAnterior, setAtivaAnterior] = useState(ativa)
  if (ativa !== ativaAnterior) {
    setAtivaAnterior(ativa)
    if (ativa) {
      // Limpa na ABERTURA: encerrado o atendimento, o diário fica na tela para
      // ser lido — é justamente quando se quer entender o que aconteceu.
      setAtividade([])
    } else {
      setStatus('idle')
      setError(null)
    }
  }

  // Fora do efeito para os dois provedores usarem. `useCallback` sem
  // dependências, e não um ref lido no render: a regra do projeto proíbe tocar
  // em `ref.current` durante a renderização, e aqui a função só mexe em refs e
  // num setState — ambos estáveis, então a identidade nunca muda e o efeito de
  // conexão não re-executa por causa dela.
  const publicar = useCallback(() => {
    if (flushRef.current) return
    flushRef.current = window.setTimeout(() => {
      flushRef.current = 0
      // Some as reservas ainda sem texto: transcrição que não voltou não vira
      // linha em branco na tela.
      setAtividade(atividadeRef.current.filter(a => a.texto))
    }, 150)
  }, [])

  /**
   * RESERVA o lugar da fala do dentista no instante em que ele fala, e só
   * PREENCHE quando a transcrição volta.
   *
   * Sem isto o painel mentia sobre a ordem: o whisper é uma segunda passada e
   * demora, então a chamada de ferramenta aparecia ANTES do comando que a
   * causou. Num painel de diagnóstico, ordem errada é pior que falta de dado —
   * saiu assim num atendimento real.
   */
  const reservarFala = useCallback((itemId: string) => {
    atividadeRef.current = [...atividadeRef.current,
      { id: ++seqRef.current, em: Date.now(), tipo: 'dentista', texto: '', itemId }]
  }, [])

  const preencherFala = useCallback((itemId: string, texto: string) => {
    const i = atividadeRef.current.findIndex(a => a.itemId === itemId && !a.texto)
    atividadeRef.current = i === -1
      // Sem reserva (evento de commit perdido), entra no fim mesmo.
      ? [...atividadeRef.current, { id: ++seqRef.current, em: Date.now(), tipo: 'dentista', texto }]
      : atividadeRef.current.map((a, n) => (n === i ? { ...a, texto } : a))
  }, [])

  const registrar = useCallback((linha: Omit<AtividadeCibelly, 'id' | 'em'>) => {
    atividadeRef.current = [...atividadeRef.current, { ...linha, id: ++seqRef.current, em: Date.now() }]
    if (flushRef.current) return
    // Publica em lote: uma marcação por dente renderizaria a coluna inteira a
    // cada comando, no meio do exame.
    flushRef.current = window.setTimeout(() => {
      flushRef.current = 0
      setAtividade(atividadeRef.current)
    }, 150)
  }, [])

  useEffect(() => {
    if (!ativa) return

    atividadeRef.current = []
    let cancelled = false
    // Lido uma vez, na abertura: trocar de provedor no meio de um atendimento
    // não faz sentido, e a URL é a mesma a sessão inteira.
    const provedor = provedorEscolhido()

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
            transcribe: transcreverFala(),
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
            aoErrar: msg => { if (!cancelled) { setStatus('error'); setError(msg); registrar({ tipo: 'erro', texto: msg }) } },
            aoFalar: texto => registrar({ tipo: 'fala', texto }),
            aoOuvir: texto => registrar({ tipo: 'dentista', texto }),
            // MEDIÇÃO TEMPORÁRIA — ver src/lib/cibelly/pricing.ts.
            aoMedirUso: meta => { usoRef.current = acumularGemini(usoRef.current, meta) },
            aoFechar: msg => {
              if (cancelled || !msg) return
              setStatus('error')
              setError(msg)
            },
            // Uma diferença de protocolo que importa: a OpenAI manda o mesmo
            // call_id duas vezes e exige dedupe; o Gemini manda uma vez só. O
            // `processedCallIds` continua servindo aos dois sem estorvo.
            aoChamarFerramenta: async ({ id, name, args }) => {
              if (processedCallIdsRef.current.has(id)) return { ok: true, duplicado: true }
              processedCallIdsRef.current.add(id)
              console.info('[Cibelly] ferramenta:', name, args)
              const { resultado } = await executarFerramenta(name, args)
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

    /**
     * DESPACHO DAS FERRAMENTAS — compartilhado pelos dois provedores.
     *
     * Nada aqui sabe se veio da OpenAI ou do Gemini: recebe nome + argumentos e
     * devolve o objeto que volta para o modelo. Foi extraído justamente quando
     * o segundo provedor entrou — manter duas cópias desta cadeia seria garantir
     * que uma das duas ficasse para trás na próxima ferramenta.
     *
     * `valeFalar` só existe para a OpenAI, onde SOMOS NÓS que pedimos a fala
     * (`response.create`). O Gemini responde sozinho depois do toolResponse,
     * então lá o campo é ignorado.
     */
    async function executarFerramenta(
      nome: string,
      args: Record<string, unknown>,
    ): Promise<{ resultado: Record<string, unknown>; valeFalar: boolean }> {
      // O retorno vai DE VOLTA pra Cibelly, então o erro precisa ser um texto
      // que ela consiga falar ("faltou a superfície") — e não um {ok:true}
      // genérico, que a fazia anunciar marcação que o motor descartou.
      let resultado: Record<string, unknown>
      // Só pede resposta falada quando há o que dizer.
      let valeFalar = false

      if (nome === 'marcar_dente') {
        const proposta = args as unknown as ToothProposal
        const antes = snapshotOdontogram()
        const r = applyToothProposal(proposta)
        if (r.ok) {
          // Pilha de desfazer: com a marcação indo direto, sem "confirma?",
          // é isto que salva o dentista de uma frase mal entendida.
          historicoRef.current.push(antes)
          if (historicoRef.current.length > MAX_DESFAZER) historicoRef.current.shift()
          setLastApplied(r.resumo)
          resultado = { ok: true, aplicado: r.resumo, ...(r.recusados ? { recusados: r.recusados } : {}) }
          // Recusa parcial ela precisa falar; sucesso limpo, não.
          valeFalar = Boolean(r.recusados?.length)
        } else {
          resultado = { ok: false, erro: r.erro }
          valeFalar = true      // faltou dado: ela tem que perguntar
        }
      } else if (nome === 'apagar_marcacao') {
        // Apagar também entra na pilha de desfazer: limpar a boca inteira
        // sem volta seria pior que a marcação errada que motivou a limpeza.
        const antes = snapshotOdontogram()
        const { dentes, achado } = args as { dentes?: number[]; achado?: string }
        const r = dentes?.length
          ? clearTeeth(dentes, achado as Parameters<typeof clearTeeth>[1])
          : clearAllTeeth()
        if (r.ok) {
          historicoRef.current.push(antes)
          if (historicoRef.current.length > MAX_DESFAZER) historicoRef.current.shift()
          setLastApplied(r.resumo)
          resultado = { ok: true, apagado: r.resumo }
        } else {
          resultado = { ok: false, erro: r.erro }
          valeFalar = true
        }
      } else if (nome === 'emitir_documento') {
        const emitir = handlersRef.current.aoEmitirDocumento
        if (!emitir) {
          resultado = { ok: false, erro: 'Não há paciente em atendimento para emitir documento.' }
        } else {
          const r = await emitir(args as unknown as DocumentRequest)
          resultado = r.ok ? { ok: true, emitido: r.resumo } : { ok: false, erro: r.erro }
        }
        // Documento é a única ação que ela SEMPRE comenta: a janela de
        // impressão abre e o dentista precisa saber que é para assinar.
        valeFalar = true
      } else if (nome === 'consultar_materiais') {
        const consultar = handlersRef.current.aoConsultarMateriais
        const { busca, somenteAcabando } = args as { busca?: string; somenteAcabando?: boolean }
        resultado = consultar
          ? { ok: true, materiais: await consultar(busca, somenteAcabando) }
          : { ok: false, erro: 'Não consegui ler o estoque agora.' }
        valeFalar = true      // consulta existe para ser respondida em voz
      } else if (nome === 'registrar_material_usado') {
        const registrar = handlersRef.current.aoRegistrarMaterial
        const { materiais } = args as { materiais?: MaterialUsage[] }
        if (!registrar || !materiais?.length) {
          resultado = { ok: false, erro: 'Não entendi qual material foi usado.' }
        } else {
          resultado = { ok: true, baixa: await registrar(materiais) }
        }
        // Ela precisa falar quando o material ficou abaixo do mínimo — é o
        // gatilho do "quer que eu peça orçamento?".
        valeFalar = true
      } else if (nome === 'solicitar_orcamento_fornecedor') {
        const solicitar = handlersRef.current.aoSolicitarOrcamento
        resultado = solicitar
          ? { ok: true, pedido: await solicitar(args as unknown as QuoteRequest) }
          : { ok: false, erro: 'Não consegui preparar o pedido de orçamento.' }
        valeFalar = true
      } else if (nome === 'cancelar_consulta') {
        const cancelar = handlersRef.current.aoCancelarConsulta
        resultado = cancelar
          ? { ok: true, resultado: await cancelar(args as { data: string; hora?: string; confirmado?: boolean; ditoPeloDentista?: string }) }
          : { ok: false, erro: 'Não consegui cancelar agora.' }
        valeFalar = true
      } else if (nome === 'criar_lembrete') {
        const criar = handlersRef.current.aoCriarLembrete
        resultado = criar
          ? { ok: true, resultado: await criar(args as { texto: string }) }
          : { ok: false, erro: 'Não consegui salvar o lembrete.' }
        // Confirma em voz: o dentista pediu para ser lembrado e precisa saber
        // que ficou registrado — silêncio aqui parece que se perdeu.
        valeFalar = true
      } else if (nome === 'concluir_lembrete') {
        const concluir = handlersRef.current.aoConcluirLembrete
        resultado = concluir
          ? { ok: true, resultado: await concluir(args as { id: string }) }
          : { ok: false, erro: 'Não consegui concluir o lembrete.' }
        valeFalar = true
      } else if (nome === 'ler_odontograma') {
        const ler = handlersRef.current.aoLerOdontograma
        resultado = ler
          ? { ok: true, odontograma: await ler(args as { dentes?: number[] }) }
          : { ok: false, erro: 'Não consegui ler o odontograma agora.' }
        valeFalar = true
      } else if (nome === 'consultar_historico') {
        const historico = handlersRef.current.aoConsultarHistorico
        resultado = historico
          ? { ok: true, historico: await historico(args as { data?: string; dente?: number }) }
          : { ok: false, erro: 'Não consegui ler o histórico agora.' }
        valeFalar = true
      } else if (nome === 'consultar_agenda') {
        const consultar = handlersRef.current.aoConsultarAgenda
        resultado = consultar
          ? { ok: true, agenda: await consultar(args as { data?: string; hora?: string; duracao?: number; dias?: number }) }
          : { ok: false, erro: 'Não consegui ler a agenda agora.' }
        valeFalar = true
      } else if (nome === 'agendar_consulta') {
        const agendar = handlersRef.current.aoAgendar
        resultado = agendar
          ? { ok: true, resultado: await agendar(args as { data: string; hora: string; duracao?: number; servico?: string; encaixe?: boolean; sala?: string; confirmaFimDeSemana?: boolean; ditoPeloDentista?: string; confirmaData?: boolean }) }
          : { ok: false, erro: 'Não há paciente em atendimento para agendar.' }
        // Agendamento sempre se anuncia: mexe na agenda de outra pessoa (o
        // paciente) e o dentista precisa saber que entrou.
        valeFalar = true
      } else if (nome === 'desfazer_ultima_marcacao') {
        const anterior = historicoRef.current.pop()
        if (anterior) {
          // Travado (ficha em modo histórico) o restore não acontece — e aí a
          // pilha precisa do item de volta, senão o desfazer some sem ter agido.
          if (restoreOdontogram(anterior)) {
            setLastApplied(null)
            resultado = { ok: true, desfeito: true }
          } else {
            historicoRef.current.push(anterior)
            resultado = { ok: false, erro: 'A ficha está aberta numa data anterior, só para leitura. Volte para "Atual" para desfazer.' }
            valeFalar = true
          }
        } else {
          resultado = { ok: false, erro: 'Não há marcação recente para desfazer. Para apagar o que já estava na ficha, use apagar_marcacao.' }
          valeFalar = true
        }
      } else {
        resultado = { ok: false, erro: `Ferramenta desconhecida: ${nome}` }
        valeFalar = true
      }


      return { resultado, valeFalar }
    }

    async function handleRealtimeEvent(message: MessageEvent<string>) {
      let event: unknown
      try {
        event = JSON.parse(message.data)
      } catch {
        return
      }

      // A API devolve um evento `error` quando recusa alguma coisa (schema de
      // ferramenta inválido, áudio malformado). Sem isto, falha do lado dela
      // era indistinguível de "a IA não chamou a função".
      const tipo = (event as { type?: unknown }).type
      if (tipo === 'error') {
        console.error('[Cibelly] erro da API:', event)
        const e = event as { error?: { message?: string } }
        registrar({ tipo: 'erro', texto: e.error?.message ?? 'Erro da API de voz.' })

        // ⚠️ MUDA PARA SEMPRE, se não fosse isto. Uma resposta "em voo" pode
        // morrer com `error` em vez de terminar com `response.done` (limite,
        // moderação, saída malformada) — e só o `response.done` zerava
        // `respostaEmVooRef`. Sem este reset, a flag ficava travada em `true`
        // pelo resto da SESSÃO INTEIRA: toda fala pendente daí em diante só se
        // empilhava em `falaPendenteRef` esperando um `response.done` que
        // nunca mais viria para aquela resposta morta. Foi visto ao vivo:
        // `ler_odontograma` respondeu certo (ok:true, resposta pronta) três
        // vezes seguidas e nenhuma foi falada, até uma fala solta e sem
        // relação nenhuma ("Olá") abrir um ciclo novo por conta própria e
        // "destravar" por acidente — daí a resposta ter saído sobre o "Olá",
        // não sobre a pergunta represada.
        respostaEmVooRef.current = false
        if (falaPendenteRef.current) {
          falaPendenteRef.current = false
          const dc = dcRef.current
          if (dc?.readyState === 'open') dc.send(JSON.stringify({ type: 'response.create' }))
        }
        return
      }

      // A TRANSCRIÇÃO DELA é de graça: vem junto do áudio que ela já gerou, no
      // mesmo modelo. Quem custava (e saiu) era a do DENTISTA — whisper, modelo
      // separado, cobrado por minuto de fala.
      if (tipo === 'response.output_audio_transcript.done') {
        const e = event as { transcript?: string }
        if (e.transcript?.trim()) registrar({ tipo: 'fala', texto: e.transcript.trim() })
      }

      // A fala do DENTISTA. Casada por SUFIXO, e não por nome exato: a OpenAI
      // já renomeou eventos desta família uma vez (ver o comentário de
      // extractFunctionCalls), e o nome do meio é o que identifica a direção.
      // O commit do buffer marca QUANDO ele falou; a transcrição chega depois.
      if (tipo === 'input_audio_buffer.committed') {
        const e = event as { item_id?: string }
        if (e.item_id) { reservarFala(e.item_id); publicar() }
      }
      if (typeof tipo === 'string'
          && tipo.includes('input_audio_transcription')
          && (tipo.endsWith('.completed') || tipo.endsWith('.done'))) {
        const e = event as { transcript?: string; item_id?: string }
        if (e.transcript?.trim()) {
          if (e.item_id) preencherFala(e.item_id, e.transcript.trim())
          else registrar({ tipo: 'dentista', texto: e.transcript.trim() })
          publicar()
        }
      }

      // CICLO DE VIDA DA RESPOSTA — no DevTools, com carimbo de tempo.
      //
      // Existe por um motivo específico: "ela travou no meio da frase" tem três
      // causas que soam IGUAIS no alto-falante, e só estes eventos as separam.
      // Se os deltas de áudio continuam chegando durante o buraco, o silêncio
      // veio DENTRO do áudio (o modelo gerou a pausa). Se chegou
      // `speech_started` e a resposta terminou como `cancelled`, foi o detector
      // de fala cortando a Cibelly por ruído da sala. Se os deltas simplesmente
      // param, é rede. Sem este log, a próxima rodada de ajuste seria chute.
      if (tipo === 'response.created') respostaEmVooRef.current = true
      if (tipo === 'response.done') {
        respostaEmVooRef.current = false
        // MEDIÇÃO TEMPORÁRIA — ver src/lib/cibelly/pricing.ts.
        usoRef.current = acumularOpenAI(usoRef.current, (event as RealtimeResponseDoneEvent).response?.usage)
        // A FALA ADIADA sai aqui.
        //
        // O pedido de fala nasce em `response.function_call_arguments.done`, que
        // chega ANTES do `response.done` da própria resposta que trouxe a
        // chamada — ou seja, sempre com uma resposta "em voo". A trava que pus
        // contra o erro "active response in progress" estava DESCARTANDO esse
        // pedido, e a Cibelly executava a ferramenta e ficava muda até um ruído
        // abrir um turno novo. Era intermitente porque a chamada às vezes chega
        // primeiro pelo `response.done`, quando o flag já está limpo.
        if (falaPendenteRef.current) {
          falaPendenteRef.current = false
          const dc = dcRef.current
          if (dc?.readyState === 'open') dc.send(JSON.stringify({ type: 'response.create' }))
        }
      }

      if (tipo === 'response.created' || tipo === 'response.done'
          || tipo === 'input_audio_buffer.speech_started') {
        const e = event as { type: string; response?: { status?: string } }
        console.debug(
          `[Cibelly] ${Math.round(performance.now())}ms ${e.type}`,
          e.response?.status ?? '',
        )
      }

      const chamadas = extractFunctionCalls(event)
      if (chamadas.length === 0) return

      let precisaFalar = false

      for (const call of chamadas) {
        // O mesmo call_id chega duas vezes (uma por
        // response.function_call_arguments.done, outra dentro de
        // response.done) — sem dedupe, "confirmar" aplicaria a marcação duas
        // vezes e "propor" reabriria uma proposta já resolvida.
        if (processedCallIdsRef.current.has(call.call_id)) continue
        processedCallIdsRef.current.add(call.call_id)

        let args: Record<string, unknown>
        try {
          args = JSON.parse(call.arguments)
        } catch {
          args = {}
        }
        console.info('[Cibelly] ferramenta:', call.name, args)

        const { resultado, valeFalar } = await executarFerramenta(call.name, args)
        registrar({ tipo: 'ferramenta', texto: call.name,
          args: JSON.stringify(args), resultado: JSON.stringify(resultado) })

        if (valeFalar) precisaFalar = true

        const dc = dcRef.current
        if (dc?.readyState === 'open') {
          dc.send(JSON.stringify({
            type: 'conversation.item.create',
            item: { type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(resultado) },
          }))
        }
      }

      // AQUI estava metade da prolixidade: um `response.create` incondicional
      // após CADA ferramenta OBRIGA a Cibelly a falar, mesmo sem ter o que
      // dizer — e ela preenchia o vazio com "certo, vou preparar a proposta",
      // "beleza, vou aplicar isso agora". Agora só pedimos fala quando há
      // recado real (faltou dado, algum dente recusado, nada a desfazer). Marcou
      // e deu certo? Silêncio — a tela já mostra, e o dentista segue no exame.
      // Continua UM por turno, não um por chamada: dois pedidos faziam ela
      // falar por cima de si mesma.
      // Com uma resposta em curso, a API recusa um `response.create` novo
      // ("Conversation already has an active response in progress") e o comando
      // se perde. Então ADIA em vez de descartar: o pedido sai no
      // `response.done` logo acima. Descartar era o que a deixava muda.
      if (precisaFalar && respostaEmVooRef.current) {
        falaPendenteRef.current = true
        return
      }

      if (precisaFalar) {
        const dc = dcRef.current
        if (dc?.readyState === 'open') dc.send(JSON.stringify({ type: 'response.create' }))
      }
    }

    connect()

    // Capturados aqui, e não lidos no cleanup: a regra dos hooks avisa (com
    // razão) que `ref.current` pode ter mudado quando o cleanup rodar.
    const idsTratados = processedCallIdsRef.current

    return () => {
      cancelled = true

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
      // Zera os ids já tratados: a sessão seguinte numera do zero e um call_id
      // repetido seria descartado como duplicata.
      idsTratados.clear()
    }
  }, [ativa, registrar, reservarFala, preencherFala, publicar])

  return { status, error, lastApplied, atividade }
}
