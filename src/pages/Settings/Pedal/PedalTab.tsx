import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { FormSection } from '@/components/FormSection/FormSection'
import { PedalSetupModal } from '@/components/CibellyPedalButton/PedalSetupModal'
import { carregarPedal, nomeDaTecla } from '@/lib/cibelly/pedalConfig'
import type { PedalConfig } from '@/lib/cibelly/pedalConfig'
import styles from './PedalTab.module.scss'

/**
 * Aba "Pedal": qual tecla cada botão do pedal manda.
 *
 * MORA AQUI, e não na barra da tela de atendimento, porque é preferência DESTA
 * MÁQUINA — o pedal é do computador do consultório, não da clínica, e fica no
 * localStorage do navegador (ver lib/cibelly/pedalConfig). Configuração de
 * máquina é exatamente o que uma tela de Configurações guarda; na barra do
 * odontograma ela disputava espaço com o atendimento em curso, e é algo que se
 * faz UMA vez por computador.
 */
export function PedalTab() {
  // Estado local espelhando o localStorage: `carregarPedal` como inicializador
  // (leitura única na montagem) e o `onSaved` do modal como fonte da verdade
  // depois — reler o storage a cada render não traria nada novo, porque só
  // este modal escreve nele.
  const [pedal, setPedal] = useState<PedalConfig>(carregarPedal)
  const [aberto, setAberto] = useState(false)

  return (
    <div className={styles.coluna}>
      <FormSection
        title="Pedal Bluetooth"
        description="Um pedal se apresenta ao computador como TECLADO, e cada modelo manda um código diferente — não há como o app adivinhar qual. Aqui você ensina, pisando."
      >
        <dl className={styles.resumo}>
          <div className={styles.linha}>
            <dt>Botão do paciente</dt>
            <dd>{nomeDaTecla(pedal.patientCode)}</dd>
          </div>
          <div className={styles.linha}>
            <dt>Botão geral</dt>
            <dd>{nomeDaTecla(pedal.generalCode)}</dd>
          </div>
          <div className={styles.linha}>
            <dt>Acionamento</dt>
            <dd>
              {pedal.activation === 'hold'
                ? 'Segurar para falar'
                : 'Pisar para começar, pisar de novo para encerrar'}
            </dd>
          </div>
        </dl>

        {/* O caminho de volta quando o pedal descarrega é o BOTÃO NA TELA, e
            não mais um atalho fixo de teclado — ver listeningModeFromPedal. */}
        <p className={styles.nota}>
          Valem <strong>apenas</strong> as teclas acima. Se o pedal ficar sem bateria,
          use o botão redondo do microfone na tela do atendimento — ele não depende
          de teclado.
        </p>

        <p className={styles.nota}>
          A configuração fica salva <strong>neste navegador</strong>. Em outro computador
          — ou numa janela anônima — é preciso ensinar de novo.
        </p>

        <Button variant="outline" onClick={() => setAberto(true)}>
          Configurar pedal
        </Button>
      </FormSection>

      <PedalSetupModal open={aberto} onClose={() => setAberto(false)} onSaved={setPedal} />
    </div>
  )
}
