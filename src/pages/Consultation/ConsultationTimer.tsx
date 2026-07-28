import { useEffect, useState } from 'react'
import styles from './ConsultationPage.module.scss'

interface ConsultationTimerProps {
  /** Instante em que a consulta começou. */
  startedAt: Date
}

function doisDigitos(n: number) {
  return String(n).padStart(2, '0')
}

/**
 * CRONÔMETRO DA CONSULTA — quanto tempo o paciente já está na sala.
 *
 * Conta a partir do instante REAL de início, e não somando +1 a cada tick: um
 * `setInterval` de 1s não é preciso, e a aba em segundo plano tem o timer
 * estrangulado pelo navegador. Somando ticks, o cronômetro atrasaria minutos
 * numa consulta longa com a aba escondida; recalculando da data, ele volta
 * certo assim que a aba reaparece.
 */
export function ConsultationTimer({ startedAt }: ConsultationTimerProps) {
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const segundos = Math.max(0, Math.floor((agora - startedAt.getTime()) / 1000))
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60

  return (
    <div className={styles.cronometro} role="timer" aria-live="off">
      <span className={styles.cronometroRotulo}>Em atendimento</span>
      <strong className={styles.cronometroTempo}>
        {h > 0 ? `${doisDigitos(h)}:` : ''}{doisDigitos(m)}:{doisDigitos(s)}
      </strong>
    </div>
  )
}
