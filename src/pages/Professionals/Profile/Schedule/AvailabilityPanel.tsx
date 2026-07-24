import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useToast } from '@/components/Toast/useToast'
import { DAY_OF_WEEK_SHORT, DAY_OF_WEEK_LONG } from '@/constants'
import {
  useAvailabilityTemplate,
  useSetAvailabilityTemplate,
  useAbsences,
  useAddAbsence,
  useRemoveAbsence,
} from '@/hooks/useProfessionalAvailability'
import { localDate, toShortDateWithYear } from '@/utils/date'
import { IconTrash } from '@/components/icons'
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

      <AbsencesSection professionalId={professionalId} />
    </div>
  )
}

/** Períodos em que o profissional fica indisponível o dia INTEIRO (viagem,
 *  férias, atestado) — separado da grade recorrente acima (ver
 *  professional_absence na migration: dia inteiro, não célula por célula). */
function AbsencesSection({ professionalId }: { professionalId: string }) {
  const toast = useToast()
  const { data: absences } = useAbsences(professionalId)
  const { mutate: add, isPending: adding } = useAddAbsence(professionalId)
  const { mutate: remove } = useRemoveAbsence(professionalId)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  function handleAdd() {
    add(
      { startDate, endDate, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          setStartDate('')
          setEndDate('')
          setReason('')
          toast.success('Ausência registrada!')
        },
        onError: () => toast.error('Não foi possível salvar. Tente novamente.'),
      },
    )
  }

  return (
    <div className={styles.absences}>
      <h3 className={styles.absencesTitle}>Ausências (viagem, férias, atestado)</h3>

      {(absences ?? []).length > 0 && (
        <ul className={styles.absenceList}>
          {absences!.map(a => (
            <li key={a.id} className={styles.absenceItem}>
              <span className={styles.absencePeriod}>
                {toShortDateWithYear(localDate(a.startDate))} – {toShortDateWithYear(localDate(a.endDate))}
              </span>
              {a.reason && <span className={styles.absenceReason}>{a.reason}</span>}
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconTrash />}
                aria-label="Remover ausência"
                onClick={() => remove(a.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className={styles.absenceForm}>
        <Input type="date" label="De" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input type="date" label="Até" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <Input
          label="Motivo (opcional)"
          placeholder="Viagem, férias..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <Button onClick={handleAdd} loading={adding} disabled={!startDate || !endDate}>Adicionar</Button>
      </div>
    </div>
  )
}
