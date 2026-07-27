import { CapturaDeMicrofone, ReproducaoDeAudio } from './geminiAudio'
import type { UsageMetadataGemini } from './pricing'

/**
 * CLIENTE DA GEMINI LIVE API — o equivalente ao que o WebRTC fazia sozinho no
 * provedor da OpenAI.
 *
 * Protocolo (WebSocket, v1alpha):
 *  → `{setup:{...}}`                                  primeira mensagem, sempre
 *  ← `{setupComplete:{}}`                             pode começar a falar
 *  → `{realtimeInput:{audio:{mimeType,data}}}`        microfone, PCM16 16 kHz b64
 *  ← `{serverContent:{modelTurn:{parts:[{inlineData}]}}}`  fala dela, 24 kHz b64
 *  ← `{serverContent:{interrupted:true}}`             corta o que está tocando
 *  ← `{toolCall:{functionCalls:[{id,name,args}]}}`    chamada de ferramenta
 *  → `{toolResponse:{functionResponses:[{id,name,response}]}}`
 *
 * O `setup` NÃO é montado aqui: vem pronto da Edge Function, que o trancou
 * dentro do token efêmero (`liveConnectConstraints`). Divergir da trava derruba
 * a conexão — e é essa trava que impede o navegador de reescrever o prompt.
 */

const WS_BASE =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained'

export interface ChamadaDeFerramenta {
  id: string
  name: string
  args: Record<string, unknown>
}

export interface GeminiLiveHandlers {
  aoConectar?: () => void
  aoFechar?: (motivo: string) => void
  aoErrar?: (erro: string) => void
  /** Devolve o objeto que vira `response` na resposta da ferramenta. */
  aoChamarFerramenta?: (chamada: ChamadaDeFerramenta) => Promise<unknown>
  /** Transcrição do que ELA falou — para o diário do atendimento. */
  aoFalar?: (texto: string) => void
  /** Transcrição do que o DENTISTA falou (só quando habilitada no setup). */
  aoOuvir?: (texto: string) => void
  /** O modelo encerrou o turno; usado pelo watchdog de comando sem ferramenta. */
  aoTurnoConcluido?: () => void
  /** MEDIÇÃO TEMPORÁRIA de custo — ver src/lib/cibelly/pricing.ts. */
  aoMedirUso?: (meta: UsageMetadataGemini) => void
  /** Há um turno dela em andamento AGORA — o dentista deve esperar antes de
   *  falar de novo (mesmo motivo do `processando` em useCibelly.ts). */
  aoProcessando?: (emAndamento: boolean) => void
}

export class GeminiLive {
  private ws: WebSocket | null = null
  private mic = new CapturaDeMicrofone()
  private alto = new ReproducaoDeAudio()
  private pronta = false
  private encerrado = false

  // Campos declarados e atribuídos à mão, e não como parâmetro-propriedade do
  // construtor: o projeto compila com `erasableSyntaxOnly`, que proíbe sintaxe
  // de TypeScript sem equivalente apagável em JS.
  private token: string
  private setup: Record<string, unknown>
  private handlers: GeminiLiveHandlers

  constructor(token: string, setup: Record<string, unknown>, handlers: GeminiLiveHandlers) {
    this.token = token
    this.setup = setup
    this.handlers = handlers
  }

  async conectar(saudacao?: string): Promise<void> {
    // A reprodução sobe ANTES da conexão: o AudioContext precisa nascer dentro
    // do gesto do usuário (o clique em "Iniciar atendimento"), senão a política
    // de autoplay o deixa suspenso e a primeira fala sai muda.
    await this.alto.iniciar()

    // O token vai na query porque o WebSocket do navegador não deixa mandar
    // cabeçalho. É credencial de uso único e vida curta, cunhada no servidor.
    const ws = new WebSocket(`${WS_BASE}?access_token=${encodeURIComponent(this.token)}`)
    this.ws = ws

    ws.onopen = () => {
      this.enviar({ setup: this.setup })
    }

    ws.onerror = () => {
      if (!this.encerrado) this.handlers.aoErrar?.('Não foi possível conectar a Cibelly.')
    }

    ws.onclose = e => {
      if (this.encerrado) return
      // 1000 é fechamento limpo; o resto merece a razão na tela, porque a causa
      // mais comum aqui é token expirado ou setup divergindo da trava.
      this.handlers.aoFechar?.(e.code === 1000 ? '' : `Conexão encerrada (${e.code}) ${e.reason}`.trim())
    }

    ws.onmessage = async ev => {
      const texto = ev.data instanceof Blob ? await ev.data.text() : String(ev.data)
      let msg: Record<string, unknown>
      try { msg = JSON.parse(texto) } catch { return }
      await this.tratar(msg, saudacao)
    }
  }

  private async tratar(msg: Record<string, unknown>, saudacao?: string) {
    if (msg.setupComplete) {
      this.pronta = true
      await this.mic.iniciar(base64 => {
        this.enviar({ realtimeInput: { audio: { mimeType: 'audio/pcm;rate=16000', data: base64 } } })
      })
      this.handlers.aoConectar?.()

      // A SAUDAÇÃO é disparada por nós, e não esperando o dentista falar "oi".
      // Diferente do provedor da OpenAI, aqui o texto do conteúdo é fixo mas a
      // ENTREGA é livre: o modelo de áudio nativo tem diálogo afetivo, e amarrar
      // a prosódia ("numa respiração só, sem alongar nada") foi justamente o que
      // deixou a abertura robótica da outra vez.
      if (saudacao) {
        this.enviar({
          clientContent: {
            turns: [{
              role: 'user',
              parts: [{
                text: `[sistema] O atendimento começou agora. Cumprimente dizendo: "${saudacao}"`
                  + ' — com naturalidade e sorriso na voz, do jeito que uma colega de trabalho'
                  + ' cumprimenta ao entrar na sala. Não acrescente pergunta nem oferta depois.',
              }],
            }],
            turnComplete: true,
          },
        })
      }
      return
    }

    if (msg.toolCall) {
      // Chamando ferramenta agora, resposta falada vem em seguida — mesmo
      // sinal de "espera" que o response.created da OpenAI dá.
      this.handlers.aoProcessando?.(true)
      const { functionCalls } = msg.toolCall as { functionCalls?: ChamadaDeFerramenta[] }
      const respostas = []
      for (const chamada of functionCalls ?? []) {
        let resposta: unknown
        try {
          resposta = await this.handlers.aoChamarFerramenta?.({
            id: chamada.id, name: chamada.name, args: chamada.args ?? {},
          })
        } catch (e) {
          resposta = { ok: false, erro: e instanceof Error ? e.message : 'Falhou.' }
        }
        // `response` tem de ser objeto — mandar string crua o Gemini recusa.
        respostas.push({ id: chamada.id, name: chamada.name, response: { result: resposta ?? { ok: true } } })
      }
      if (respostas.length) this.enviar({ toolResponse: { functionResponses: respostas } })
      return
    }

    // MEDIÇÃO TEMPORÁRIA: `usageMetadata` chega como mensagem PRÓPRIA no
    // protocolo (irmã de `serverContent`, não campo dela) — ver a ficha oficial
    // do BidiGenerateContentServerMessage.
    if (msg.usageMetadata) this.handlers.aoMedirUso?.(msg.usageMetadata as UsageMetadataGemini)

    const conteudo = msg.serverContent as {
      modelTurn?: { parts?: { inlineData?: { data?: string } }[] }
      interrupted?: boolean
      turnComplete?: boolean
      outputTranscription?: { text?: string }
      inputTranscription?: { text?: string }
    } | undefined
    if (!conteudo) return

    const dito = conteudo.outputTranscription?.text
    if (dito?.trim()) this.handlers.aoFalar?.(dito.trim())
    const ouvido = conteudo.inputTranscription?.text
    if (ouvido?.trim()) this.handlers.aoOuvir?.(ouvido.trim())

    if (conteudo.interrupted) { this.alto.cortar(); this.handlers.aoProcessando?.(false); return }

    for (const parte of conteudo.modelTurn?.parts ?? []) {
      if (parte.inlineData?.data) void this.alto.tocar(parte.inlineData.data)
    }

    // `turnComplete` fecha o turno dela — o sinal de "pode falar de novo".
    if (conteudo.turnComplete) {
      this.handlers.aoProcessando?.(false)
      this.handlers.aoTurnoConcluido?.()
    }
  }

  private enviar(msg: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg))
  }

  /** Está ouvindo de verdade (setup aceito e microfone aberto). */
  get ouvindo(): boolean { return this.pronta }

  /** Injeta uma conferência textual sem reabrir o microfone ou outra conexão. */
  enviarTexto(texto: string): void {
    if (!this.pronta || !texto.trim()) return
    this.enviar({
      clientContent: {
        turns: [{ role: 'user', parts: [{ text: texto.trim() }] }],
        turnComplete: true,
      },
    })
  }

  encerrar(): void {
    this.encerrado = true
    this.pronta = false
    this.mic.parar()
    this.alto.parar()
    this.ws?.close(1000)
    this.ws = null
  }
}
