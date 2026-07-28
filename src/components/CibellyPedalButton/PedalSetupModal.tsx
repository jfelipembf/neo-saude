import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Modal } from '@/components/Modal/Modal'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { useToast } from '@/components/Toast/Toast'
import { IconCheck } from '@/components/icons'
import {
  PEDAL_PADRAO, ativacaoSugerida, carregarPedal, esquecerPedal, nomeDaTecla,
  normalizarPedal, pedalCodeProibido, salvarPedal,
} from '@/lib/cibelly/pedalConfig'
import type { PedalActivation, PedalConfig } from '@/lib/cibelly/pedalConfig'
import { usePedalProbe, vereditoDaSonda } from '@/hooks/usePedalProbe'
import styles from './PedalSetupModal.module.scss'

interface PedalSetupModalProps {
  open: boolean
  onClose: () => void
  onSaved: (config: PedalConfig) => void
}

/** Qual botão está sendo aprendido. */
type Captura = 'patient' | 'general' | null

const ATIVACAO = [
  { value: 'hold'   as const, label: 'Segurar para falar' },
  { value: 'toggle' as const, label: 'Pisar para ligar e desligar' },
]

/**
 * ENSINA O PEDAL AO APP.
 *
 * Um pedal Bluetooth se apresenta como TECLADO e cada modelo manda um código
 * diferente — PageUp, seta, Enter, uma letra. Não existe forma de descobrir
 * isso a não ser pisando. Então é o que a tela pede: pise o botão, e o código
 * que chegar vira a configuração.
 *
 * A tela também MEDE quanto tempo a tecla ficou pressionada. Muitos pedais
 * mandam um pulso (keydown e keyup juntos) mesmo com o pé no chão — nesses, o
 * modo "segurar para falar" gravaria 40 ms de áudio e encerraria. A medição
 * detecta isso e sugere "pisar para ligar e desligar" sozinha, em vez de
 * deixar o dentista descobrir que o pedal "não funciona".
 */
export function PedalSetupModal({ open, onClose, onSaved }: PedalSetupModalProps) {
  const toast = useToast()
  const [config, setConfig] = useState<PedalConfig>(carregarPedal)
  const [capturando, setCapturando] = useState<Captura>(null)
  /** Quanto tempo o último pedal capturado ficou pressionado, em ms. */
  const [duracao, setDuracao] = useState<number | null>(null)
  /**
   * O último evento que chegou, cru.
   *
   * É o que transforma "não acontece nada" em diagnóstico: se nada aparecer
   * aqui, o pedal não está mandando evento nenhum para o navegador; se
   * aparecer um `code` vazio ou um clique de mouse, o problema é outro e a
   * linha diz qual.
   */
  const [ultimoEvento, setUltimoEvento] = useState<string | null>(null)
  /** Sondagem ligada: escuta TUDO e mostra o que chega. */
  const [sondando, setSondando] = useState(false)
  const eventos = usePedalProbe(sondando)
  const inicioRef = useRef<number>(0)
  /** Qual botão acabou de ser gravado — o keyup seguinte é dele. */
  const capturadoRef = useRef<Captura>(null)

  /**
   * Recarrega ao ABRIR — o modal pode ter sido fechado sem salvar, e o estado
   * anterior não pode reaparecer como se fosse o gravado.
   *
   * Derivado em render e não num efeito: o efeito rodaria DEPOIS da primeira
   * pintura, e o dentista veria por um quadro a configuração descartada.
   */
  const [abertoEm, setAbertoEm] = useState(false)
  if (open !== abertoEm) {
    setAbertoEm(open)
    if (open) {
      setConfig(carregarPedal())
      setCapturando(null)
      setDuracao(null)
      setUltimoEvento(null)
      setSondando(false)
    }
  }

  /**
   * Espelha `capturando` num ref porque o efeito abaixo vive enquanto o MODAL
   * está aberto, e não enquanto se captura — foi isto que consertou o bug em
   * que o `keyup` não era medido: antes o efeito era desmontado no mesmo
   * instante em que a tecla era gravada, e a medição do pulso nunca chegava.
   *
   * Num efeito próprio, e não no corpo do render: escrever em ref durante o
   * render é o que o eslint (react-hooks/refs) proíbe.
   */
  const capturandoRef = useRef<Captura>(null)
  useEffect(() => { capturandoRef.current = capturando }, [capturando])

  useEffect(() => {
    if (!open) return

    /**
     * GRAVA NO KEYDOWN, não no keyup.
     *
     * Havia um pedal que não fazia nada nesta tela, e a causa era esta: o
     * código só era gravado quando o `keyup` chegava — e há pedal que manda
     * só o `keydown`, ou que segura a tecla enquanto o pé está no chão e o
     * `keyup` demora. Gravando na descida, o retorno é imediato e o `keyup`
     * (se vier) serve só para MEDIR quanto tempo ficou pressionado.
     */
    function onDown(e: KeyboardEvent) {
      e.preventDefault()
      e.stopPropagation()
      if (e.repeat) return

      setUltimoEvento(`keydown · code="${e.code || '(vazio)'}" key="${e.key}"`)
      const alvo = capturandoRef.current
      if (!alvo) return
      const code = e.code || e.key
      if (!code) return
      if (pedalCodeProibido(code)) {
        toast.error(`${nomeDaTecla(code)} é usada pelo sistema. Escolha outro botão.`)
        return
      }

      inicioRef.current = performance.now()
      capturadoRef.current = alvo
      setConfig(atual => normalizarPedal({
        ...atual,
        [alvo === 'patient' ? 'patientCode' : 'generalCode']: code,
      }))
      setCapturando(null)
    }

    function onUp(e: KeyboardEvent) {
      e.preventDefault()
      e.stopPropagation()
      setUltimoEvento(`keyup · code="${e.code || '(vazio)'}" key="${e.key}"`)
      // Só mede se este keyup fecha a captura que acabou de acontecer.
      if (!capturadoRef.current || !inicioRef.current) return
      const ms = Math.round(performance.now() - inicioRef.current)
      capturadoRef.current = null
      inicioRef.current = 0
      setDuracao(ms)
      // A sugestão só sobe quando o pedal PULSA: se ele aguenta segurar, não
      // há razão para tirar o dentista do modo natural.
      if (ativacaoSugerida(ms) === 'toggle') {
        setConfig(atual => ({ ...atual, activation: 'toggle' }))
      }
    }

    /**
     * DIAGNÓSTICO: alguns pedais emulam MOUSE, não teclado.
     *
     * Nesses o navegador nunca entrega evento de tecla, e a tela ficaria
     * parada para sempre sem dizer por quê. Aqui o clique não vira atalho —
     * ele só denuncia o que o aparelho é, que é a informação que destrava.
     */
    function onMouse(e: MouseEvent) {
      setUltimoEvento(`mouse · botão ${e.button} — este pedal emula MOUSE, não teclado`)
    }

    // `capture: true` para pegar o evento ANTES de qualquer outro handler da
    // página — inclusive o do próprio pedal, que estaria escutando J e F.
    window.addEventListener('keydown', onDown, true)
    window.addEventListener('keyup', onUp, true)
    window.addEventListener('mousedown', onMouse, true)
    window.addEventListener('auxclick', onMouse, true)
    return () => {
      window.removeEventListener('keydown', onDown, true)
      window.removeEventListener('keyup', onUp, true)
      window.removeEventListener('mousedown', onMouse, true)
      window.removeEventListener('auxclick', onMouse, true)
    }
  }, [open, toast])

  function salvar() {
    const limpo = normalizarPedal(config)
    salvarPedal(limpo)
    onSaved(limpo)
    toast.success('Pedal configurado.')
    onClose()
  }

  function restaurar() {
    esquecerPedal()
    setConfig(PEDAL_PADRAO)
    setDuracao(null)
    onSaved(PEDAL_PADRAO)
    toast.success('Voltou para o teclado (J e F).')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurar pedal"
      footer={
        <>
          <Button variant="ghost" onClick={restaurar}>Usar o teclado</Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar}>Salvar</Button>
        </>
      }
    >
      <div className={styles.corpo}>
        <p className={styles.explicacao}>
          O pedal se apresenta ao computador como um <strong>teclado</strong>, e
          cada modelo envia uma tecla diferente. Clique em <em>Aprender</em> e
          pise o botão correspondente — mantenha pisado por um segundo.
        </p>

        <BotaoDoPedal
          titulo="Paciente atual"
          descricao="Fala sobre quem está na cadeira: odontograma, histórico, documentos."
          code={config.patientCode}
          aprendendo={capturando === 'patient'}
          onAprender={() => { setCapturando('patient'); setDuracao(null) }}
        />

        <BotaoDoPedal
          titulo="Assuntos gerais"
          descricao="Agenda, estoque, outro paciente, financeiro."
          code={config.generalCode}
          aprendendo={capturando === 'general'}
          onAprender={() => { setCapturando('general'); setDuracao(null) }}
        />

        {/* O que o navegador REALMENTE recebeu. Sem isto, um pedal que não
            manda evento de tecla e um pedal mal configurado se parecem: os
            dois "não fazem nada". */}
        {capturando && (
          <p className={styles.diagnostico}>
            {ultimoEvento
              ? <>Recebido: <code>{ultimoEvento}</code></>
              : 'Aguardando… se nada aparecer aqui ao pisar, o pedal não está enviando eventos de teclado para o navegador.'}
          </p>
        )}

        {/* SONDA — para quando "Aprender" não recebe nada.
            Escuta teclado, mouse, roda e controle de jogo ao mesmo tempo: as
            quatro causas de "não acontece nada" têm a mesma aparência e
            correções diferentes. */}
        <div className={styles.sonda}>
          <div className={styles.sondaTopo}>
            <span className={styles.rotulo}>Não funcionou? Descubra o que o pedal envia</span>
            <Button
              size="sm"
              variant={sondando ? 'secondary' : 'outline'}
              onClick={() => { setSondando(v => !v); setCapturando(null) }}
            >
              {sondando ? 'Parar' : 'Detectar'}
            </Button>
          </div>

          {sondando && (
            <>
              <p className={styles.diagnostico}>{vereditoDaSonda(eventos)}</p>
              {eventos.length > 0 && (
                <ul className={styles.eventos}>
                  {eventos.map(e => (
                    <li key={e.seq}>
                      <span className={styles.eventoTempo}>{e.emSegundos.toFixed(1)}s</span>
                      <code>{e.tipo}</code>
                      <span className={styles.eventoDetalhe}>{e.detalhe}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className={styles.ativacao}>
          <span className={styles.rotulo}>Como o pedal funciona</span>
          <SegmentedControl
            wrap
            options={ATIVACAO}
            value={config.activation}
            onChange={(v: PedalActivation) => setConfig(c => ({ ...c, activation: v }))}
          />
          {/* A medição vira explicação, não um número solto: o dentista precisa
              entender POR QUE o app trocou o modo embaixo dele. */}
          {duracao !== null && (
            <p className={ativacaoSugerida(duracao) === 'toggle' ? styles.aviso : styles.medicao}>
              {ativacaoSugerida(duracao) === 'toggle'
                ? `O pedal enviou um toque de ${duracao} ms mesmo com o pé no chão — ele não sustenta a tecla. Com "segurar para falar" gravaria só esse instante, então mudei para pisar e despisar.`
                : `Pedal segurou por ${duracao} ms: "segurar para falar" funciona.`}
            </p>
          )}
        </div>

        <p className={styles.rodape}>
          O teclado continua valendo: <strong>J</strong> para o paciente e{' '}
          <strong>F</strong> para assuntos gerais, mesmo com o pedal
          configurado. É o caminho de volta se a bateria acabar no meio do
          atendimento.
        </p>
      </div>
    </Modal>
  )
}

function BotaoDoPedal({ titulo, descricao, code, aprendendo, onAprender }: {
  titulo: string
  descricao: string
  code: string
  aprendendo: boolean
  onAprender: () => void
}) {
  return (
    <div className={`${styles.botao} ${aprendendo ? styles.botaoAprendendo : ''}`}>
      <div className={styles.botaoTexto}>
        <strong>{titulo}</strong>
        <span className={styles.botaoDescricao}>{descricao}</span>
      </div>
      <span className={styles.tecla}>
        {aprendendo ? 'pise agora…' : nomeDaTecla(code)}
      </span>
      <Button
        size="sm"
        variant={aprendendo ? 'secondary' : 'outline'}
        iconLeft={aprendendo ? undefined : <IconCheck />}
        onClick={onAprender}
        disabled={aprendendo}
      >
        {aprendendo ? 'Ouvindo' : 'Aprender'}
      </Button>
    </div>
  )
}
