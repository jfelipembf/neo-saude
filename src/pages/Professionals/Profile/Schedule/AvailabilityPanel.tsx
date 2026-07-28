import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useToast } from '@/components/Toast/Toast'
import { DAY_OF_WEEK_SHORT, DAY_OF_WEEK_LONG } from '@/constants'
import {
  useAvailabilityTemplate,
  useSetAvailabilityTemplate,
} from '@/hooks/useProfessionalAvailability'
import styles from './AvailabilityPanel.module.scss'

const WEEKDAYS = [1, 2, 3, 4, 5, 6]   // Seg…Sáb — decisão de produto (ver plano)
const HOURS = Array.from({ length: 14 }, (_, i) => 6 + i)   // 06:00…19:00 (bloco até 20:00)

function cellKey(weekday: number, hour: number) {
  return `${weekday}-${hour}`
}

function sameSet(a: Set<string>, b: Set<string>) {
  return a.size === b.size && [...a].every(k => b.has(k))
}

interface AvailabilityPanelProps {
  professionalId: string
}

/** Grade de disponibilidade recorrente (Seg-Sáb, 06h-20h, hora cheia) — vale
 *  igual toda semana. Marcar/desmarcar edita um RASCUNHO local; o botão
 *  "Salvar" só aparece quando o rascunho diverge do que está gravado, e é
 *  ele que persiste a grade inteira de uma vez. */
export function AvailabilityPanel({ professionalId }: AvailabilityPanelProps) {
  const toast = useToast()
  const { data: template, isLoading } = useAvailabilityTemplate(professionalId)
  const { mutate: save, isPending: saving } = useSetAvailabilityTemplate(professionalId)

  const [saved, setSaved] = useState<Set<string> | null>(null)
  const [draft, setDraft] = useState<Set<string>>(new Set())

  // Deriva o estado inicial do servidor em tempo de render (não em efeito):
  // roda só na transição null → carregado, então uma revalidação em segundo
  // plano (ex.: focar a aba de novo) não apaga uma edição ainda não salva —
  // `saved` já deixa de ser null depois da primeira vez.
  if (template && saved === null) {
    const set = new Set(template.map(s => cellKey(s.weekday, s.hour)))
    setSaved(set)
    setDraft(set)
  }

  const dirty = saved !== null && !sameSet(draft, saved)

  function toggleCell(weekday: number, hour: number) {
    const key = cellKey(weekday, hour)
    setDraft(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleSave() {
    const slots = [...draft].map(key => {
      const [weekday, hour] = key.split('-').map(Number)
      return { weekday, hour }
    })
    save(slots, {
      onSuccess: () => {
        setSaved(new Set(draft))
        toast.success('Horários salvos!')
      },
      onError: () => toast.error('Não foi possível salvar. Tente novamente.'),
    })
  }

  if (isLoading || saved === null) return <PageLoader />

  return (
    <div className={styles.panel}>
      {dirty && (
        <div className={styles.saveBar}>
          <Button size="sm" onClick={handleSave} loading={saving}>Salvar</Button>
        </div>
      )}

      <div className={styles.scroll}>
        <div className={styles.grid}>
          {WEEKDAYS.map(wd => (
            <div key={wd} className={styles.dayHead}>{DAY_OF_WEEK_SHORT[wd]}</div>
          ))}

          {HOURS.flatMap(hour => WEEKDAYS.map(wd => {
            const available = draft.has(cellKey(wd, hour))
            return (
              <button
                key={cellKey(wd, hour)}
                type="button"
                className={`${styles.cell} ${available ? styles['cell--on'] : ''}`}
                aria-pressed={available}
                aria-label={`${DAY_OF_WEEK_LONG[wd]} às ${hour}h — ${available ? 'disponível' : 'indisponível'}`}
                disabled={saving}
                onClick={() => toggleCell(wd, hour)}
              >
                {String(hour).padStart(2, '0')}:00
              </button>
            )
          }))}
        </div>
      </div>
    </div>
  )
}
