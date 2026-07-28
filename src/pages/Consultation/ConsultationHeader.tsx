import type { ReactNode } from 'react'
import { Button } from '@/components/Button/Button'
import { useClinic } from '@/hooks/useClinic'
import { useCurrentUser } from '@/hooks/useUser'
import styles from './ConsultationPage.module.scss'

interface ConsultationHeaderProps {
  emAtendimento: boolean
  ocupado?: boolean
  onIniciar: () => void
  onFinalizar: () => void
  /** Rótulo do par de botões — "consulta" no médico, "sessão" na fisioterapia. */
  substantivo?: string
  /** Ações extras antes do botão principal (ex.: sessões restantes do pacote). */
  extra?: ReactNode
}

/**
 * O TOPO DA TELA DE ATENDIMENTO — o mesmo carimbo da página de impressão:
 * logo e clínica à esquerda, quem está atendendo à direita.
 *
 * Componente, e não copiado nas duas telas: médico e fisioterapeuta veem
 * exatamente o mesmo cabeçalho, e duas cópias divergem no primeiro ajuste que
 * alguém fizer em uma só. O que muda entre elas é o SUBSTANTIVO do botão —
 * fisioterapeuta faz sessão, médico faz consulta.
 */
export function ConsultationHeader({
  emAtendimento, ocupado, onIniciar, onFinalizar, substantivo = 'consulta', extra,
}: ConsultationHeaderProps) {
  const { data: clinica } = useClinic()
  const { data: usuario } = useCurrentUser()

  return (
    <header className={styles.topo}>
      <div className={styles.clinica}>
        {clinica?.photo && <img className={styles.logo} src={clinica.photo} alt="" />}
        <div>
          <strong className={styles.clinicaNome}>{clinica?.name}</strong>
          {clinica?.city && <span className={styles.clinicaLinha}>{clinica.city}</span>}
        </div>
      </div>

      <div className={styles.profissional}>
        <strong>{usuario?.name}</strong>
        <span className={styles.clinicaLinha}>
          {[usuario?.specialty, usuario?.license].filter(Boolean).join(' · ')}
        </span>
      </div>

      {extra}

      {/* Canto superior direito: começar/encerrar é a ação mais forte da tela,
          e o mesmo botão vira a outra depois do clique. */}
      {emAtendimento ? (
        <Button variant="secondary" loading={ocupado} onClick={onFinalizar}>
          Finalizar {substantivo}
        </Button>
      ) : (
        <Button loading={ocupado} onClick={onIniciar}>
          Iniciar {substantivo}
        </Button>
      )}
    </header>
  )
}
