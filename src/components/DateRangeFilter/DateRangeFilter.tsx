import { Input } from '@/components/Input/Input'
import styles from './DateRangeFilter.module.scss'

interface DateRangeFilterProps {
  /** 'aaaa-mm-dd' (formato nativo do <input type="date">) — '' = sem limite. */
  from: string
  to: string
  onChange: (from: string, to: string) => void
  fromLabel?: string
  toLabel?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Par De/Até de `<input type="date">`, controlado. Existe separado do
 * PeriodFilter (que usa isto dentro do preset "Personalizado") porque nem
 * toda tela precisa dos atalhos Hoje/Semana/Mês/Ano — às vezes o pedido é só
 * "filtrar por um intervalo de datas", sem mais nada em volta.
 *
 * Devolve os dois campos JUNTOS (`onChange(from, to)`), não um setter por
 * campo: quem usa isto normalmente guarda from/to num único filtro derivado
 * (a lista inteira refiltra quando qualquer um dos dois muda), e um único
 * callback evita que a tela precise de dois `useState` separados só para isto.
 */
export function DateRangeFilter({ from, to, onChange, fromLabel = 'De', toLabel = 'Até', size = 'md' }: DateRangeFilterProps) {
  return (
    <div className={styles.par}>
      <Input
        type="date" size={size}
        aria-label={fromLabel}
        value={from}
        onChange={e => onChange(e.target.value, to)}
      />
      <span className={styles.ate}>{toLabel}</span>
      <Input
        type="date" size={size}
        aria-label={toLabel}
        value={to}
        onChange={e => onChange(from, e.target.value)}
      />
    </div>
  )
}
