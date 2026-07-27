/**
 * PIPELINE DE ÁUDIO DO GEMINI LIVE.
 *
 * Existe porque o Gemini Live é WebSocket puro, e não WebRTC. O provedor da
 * OpenAI entregava de graça o que este arquivo faz na mão: encodar o microfone,
 * manter jitter buffer, tocar o áudio que volta e sobreviver a perda de pacote.
 *
 * O contrato do Gemini:
 *  · ENTRADA  — PCM 16-bit little-endian, MONO, 16 kHz, em base64, mandado em
 *    pedaços de 20–40 ms.
 *  · SAÍDA    — PCM 16-bit little-endian, MONO, 24 kHz, em base64.
 * As duas taxas são DIFERENTES de propósito (a dele é melhor), então são dois
 * AudioContext separados — reamostrar na mão seria pior que deixar o navegador
 * fazer, que é o que acontece ao pedir a taxa no construtor.
 *
 * ⚠️ ECO. Este é o ponto fraco conhecido do caminho WebSocket: o cancelamento
 * de eco do navegador atua sobre a saída de áudio ligada a uma conexão WebRTC.
 * Áudio tocado pelo Web Audio API (que é o caso aqui) NÃO é cancelado com a
 * mesma confiabilidade. Num consultório com caixa de som, a voz dela pode
 * voltar pelo microfone. Por isso `activityHandling: 'NO_INTERRUPTION'` no
 * servidor — mesmo que ela se ouça, não se interrompe. Se ainda assim
 * atrapalhar, o caminho é fone de ouvido.
 */

/** Worklets como texto: viram Blob URL em tempo de execução, então não
 *  dependem de arquivo em /public nem de configuração do bundler. */
const CAPTURA_WORKLET = `
class CapturaPCM extends AudioWorkletProcessor {
  constructor() {
    super()
    // 512 amostras a 16 kHz = 32 ms, dentro da faixa de 20–40 ms que o Gemini
    // recomenda: pedaço menor vira overhead de WebSocket, maior vira latência.
    this.tamanho = 512
    this.buffer = new Float32Array(this.tamanho)
    this.i = 0
  }
  process(inputs) {
    const canal = inputs[0] && inputs[0][0]
    if (!canal) return true
    for (let n = 0; n < canal.length; n++) {
      this.buffer[this.i++] = canal[n]
      if (this.i >= this.tamanho) {
        this.port.postMessage(this.buffer.slice())
        this.i = 0
      }
    }
    return true
  }
}
registerProcessor('captura-pcm', CapturaPCM)
`

const REPRODUCAO_WORKLET = `
class ReproducaoPCM extends AudioWorkletProcessor {
  constructor() {
    super()
    this.fila = []
    this.offset = 0
    this.port.onmessage = e => {
      // 'corta' esvazia a fila na hora — é o que faz o silêncio ser imediato
      // quando a resposta é interrompida, em vez de continuar tocando o que já
      // tinha chegado.
      if (e.data === 'corta') { this.fila = []; this.offset = 0 }
      else this.fila.push(e.data)
    }
  }
  process(_inputs, outputs) {
    const canal = outputs[0] && outputs[0][0]
    if (!canal) return true
    let escrito = 0
    while (escrito < canal.length && this.fila.length > 0) {
      const atual = this.fila[0]
      const restaSaida = canal.length - escrito
      const restaBuffer = atual.length - this.offset
      const copiar = Math.min(restaSaida, restaBuffer)
      for (let n = 0; n < copiar; n++) canal[escrito++] = atual[this.offset++]
      if (this.offset >= atual.length) { this.fila.shift(); this.offset = 0 }
    }
    // Silêncio no resto do bloco: sem isto o alto-falante repete o buffer
    // anterior e sai um zumbido entre as falas.
    while (escrito < canal.length) canal[escrito++] = 0
    return true
  }
}
registerProcessor('reproducao-pcm', ReproducaoPCM)
`

function urlDoWorklet(fonte: string): string {
  return URL.createObjectURL(new Blob([fonte], { type: 'application/javascript' }))
}

/** Float32 (-1..1) → PCM 16-bit LE → base64, que é o que o Gemini aceita. */
function paraBase64PCM16(amostras: Float32Array): string {
  const pcm = new Int16Array(amostras.length)
  for (let i = 0; i < amostras.length; i++) {
    // Clamp antes de escalar: acima de 1.0 o Int16 dá overflow e estala.
    const s = Math.max(-1, Math.min(1, amostras[i]))
    pcm[i] = s * 0x7fff
  }
  const bytes = new Uint8Array(pcm.buffer)
  let binario = ''
  // Em pedaços: `String.fromCharCode(...bytes)` estoura a pilha em buffer grande.
  const passo = 0x8000
  for (let i = 0; i < bytes.length; i += passo) {
    binario += String.fromCharCode(...bytes.subarray(i, i + passo))
  }
  return btoa(binario)
}

/** base64 → PCM 16-bit LE → Float32, para o worklet de reprodução. */
function deBase64PCM16(base64: string): Float32Array {
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  const pcm = new Int16Array(bytes.buffer)
  const saida = new Float32Array(pcm.length)
  for (let i = 0; i < pcm.length; i++) saida[i] = pcm[i] / 32768
  return saida
}

/** Captura do microfone a 16 kHz, entregando pedaços já em base64. */
export class CapturaDeMicrofone {
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private no: AudioWorkletNode | null = null
  private ativa = false

  async iniciar(aoCapturar: (base64: string) => void): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        // Explícito pelo mesmo motivo do provedor da OpenAI — e aqui importa
        // ainda mais, porque não há AEC de WebRTC por baixo (ver o topo).
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    // Push-to-talk: a permissão e o pipeline ficam prontos, mas a trilha só
    // produz áudio enquanto um dos pedais estiver fisicamente pressionado.
    this.setAtiva(false)

    this.ctx = new AudioContext({ sampleRate: 16000 })
    const url = urlDoWorklet(CAPTURA_WORKLET)
    try {
      await this.ctx.audioWorklet.addModule(url)
    } finally {
      URL.revokeObjectURL(url)
    }

    this.no = new AudioWorkletNode(this.ctx, 'captura-pcm')
    this.no.port.onmessage = e => {
      if (this.ativa) aoCapturar(paraBase64PCM16(e.data as Float32Array))
    }
    this.ctx.createMediaStreamSource(this.stream).connect(this.no)
  }

  setAtiva(ativa: boolean): void {
    this.ativa = ativa
    this.stream?.getAudioTracks().forEach(track => {
      track.enabled = ativa
    })
  }

  get capturando(): boolean {
    return this.ativa
  }

  parar(): void {
    this.setAtiva(false)
    if (this.no) { this.no.port.onmessage = null; this.no.disconnect() }
    // Soltar as TRILHAS é o que apaga o indicador de microfone do sistema —
    // fechar só o contexto deixaria o mic "ligado" aos olhos de quem está na
    // cadeira.
    this.stream?.getTracks().forEach(t => t.stop())
    void this.ctx?.close()
    this.no = null
    this.stream = null
    this.ctx = null
    this.ativa = false
  }
}

/** Reprodução do áudio que volta, a 24 kHz. */
export class ReproducaoDeAudio {
  private ctx: AudioContext | null = null
  private no: AudioWorkletNode | null = null
  private pronta: Promise<void> | null = null

  async iniciar(): Promise<void> {
    if (this.pronta) return this.pronta
    this.pronta = (async () => {
      this.ctx = new AudioContext({ sampleRate: 24000 })
      const url = urlDoWorklet(REPRODUCAO_WORKLET)
      try {
        await this.ctx.audioWorklet.addModule(url)
      } finally {
        URL.revokeObjectURL(url)
      }
      this.no = new AudioWorkletNode(this.ctx, 'reproducao-pcm')
      this.no.connect(this.ctx.destination)
    })()
    return this.pronta
  }

  async tocar(base64: string): Promise<void> {
    await this.iniciar()
    // Autoplay: o contexto pode nascer suspenso se a aba perdeu o gesto do
    // usuário. Retomar aqui é barato e evita a fala sumir sem erro nenhum.
    if (this.ctx?.state === 'suspended') await this.ctx.resume()
    this.no?.port.postMessage(deBase64PCM16(base64))
  }

  /** Corta o que está tocando (a resposta foi interrompida). */
  cortar(): void {
    this.no?.port.postMessage('corta')
  }

  parar(): void {
    this.no?.disconnect()
    void this.ctx?.close()
    this.no = null
    this.ctx = null
    this.pronta = null
  }
}

/**
 * BIP DE "ESTOU OUVINDO".
 *
 * Substitui a saudação falada. A abertura em palavras custava um turno inteiro
 * (o mais caro da sessão, porque o cache ainda está frio) para dizer o que dois
 * tons de 90 ms dizem melhor — e ainda ocupava o dentista, que já sabe que
 * clicou no botão.
 *
 * Sintetizado, não é arquivo: nada para carregar, nada para versionar, e toca
 * no mesmo gesto de clique que libera o áudio.
 *
 * @param descendo true para o bip de ENCERRAR (mesmo par de tons, ao contrário)
 *   — som distinto é o que evita "ela ligou ou desligou?".
 */
export function bipDeSessao(descendo = false): void {
  try {
    const ctx = new AudioContext()
    const agora = ctx.currentTime
    const tons = descendo ? [880, 620] : [620, 880]
    tons.forEach((hz, i) => {
      const osc = ctx.createOscillator()
      const vol = ctx.createGain()
      // Onda senoidal e volume baixo: num consultório o bip divide espaço com
      // sugador e com o paciente. Tem de ser notado, não obedecido.
      osc.type = 'sine'
      osc.frequency.value = hz
      const t0 = agora + i * 0.1
      // Rampa nas duas pontas — corte seco em onda pura estala no alto-falante.
      vol.gain.setValueAtTime(0.0001, t0)
      vol.gain.exponentialRampToValueAtTime(0.12, t0 + 0.015)
      vol.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09)
      osc.connect(vol).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + 0.1)
    })
    // Fecha o contexto depois do som: cada AudioContext é um recurso do
    // navegador, e abrir um por atendimento sem fechar acaba estourando o teto.
    window.setTimeout(() => void ctx.close(), 400)
  } catch {
    // Bip é cortesia. Se o navegador bloquear áudio, o atendimento segue.
  }
}
