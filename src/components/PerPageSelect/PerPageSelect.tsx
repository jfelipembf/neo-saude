import { Select } from '@/components/Select/Select'
import { OPCOES_POR_PAGINA } from '@/constants'
import styles from './PerPageSelect.module.scss'

interface PerPageSelectProps {
  porPagina: number
  /** Recebe o novo tamanho — o chamador cuida de voltar para a página 1. */
  onChange: (n: number) => void
  /** Rótulo acessível (padrão "Registros por página"). */
  ariaLabel?: string
}

/** Seletor de tamanho de página das toolbars de tabela — sempre no canto
 *  esquerdo, no formato "Exibir [N] p/ página". */
export function PerPageSelect({
  porPagina,
  onChange,
  ariaLabel = 'Registros por página',
}: PerPageSelectProps) {
  return (
    <div className={styles.root}>
      <span className={styles.texto}>Exibir</span>
      <Select
        size="sm"
        options={OPCOES_POR_PAGINA}
        value={String(porPagina)}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        className={styles.campo}
      />
      <span className={styles.texto}>p/ página</span>
    </div>
  )
}
