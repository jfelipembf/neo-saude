import { useMemo, useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { IconSearch } from '@/components/icons'
import { useDebounce } from '@/hooks/useDebounce'
import { matchesSearch } from '@/utils/search'
import { TEST_SPECIALTY_OPTIONS } from '@/constants'
import type { PhysioTest } from '@/types/domain'
import styles from './TestPicker.module.scss'

interface TestPickerProps {
  open: boolean
  onClose: () => void
  catalog: PhysioTest[]
  /** Testes já fixados no sidenav do paciente (state salvo — não o rascunho). */
  selectedIds: string[]
  onConfirm: (testIds: string[]) => void
  saving?: boolean
}

/**
 * Menu de seleção múltipla dos testes do catálogo (checkbox por item). Ao
 * confirmar, o pai regrava o conjunto INTEIRO fixado no sidenav do paciente —
 * desmarcar um teste aqui o remove de lá (o histórico já registrado não some).
 */
export function TestPicker({ open, onClose, catalog, selectedIds, onConfirm, saving = false }: TestPickerProps) {
  const [search, setSearch] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [draft, setDraft] = useState<Set<string>>(new Set(selectedIds))

  // Rascunho local, mas ressincroniza com a seleção salva a cada abertura —
  // ajuste de estado durante o render (sem useEffect), mesmo padrão do resto do app.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) { setDraft(new Set(selectedIds)); setSearch(''); setSpecialtyFilter('') }
  }

  // Opções do filtro: a lista fixa ∪ especializações "outras" já cadastradas
  // no catálogo (mesmo desenho do filtro de Admin → Testes).
  const specialtyOptions = useMemo(() => {
    const extra = catalog.map(t => t.specialty).filter(s => !(TEST_SPECIALTY_OPTIONS as readonly string[]).includes(s))
    const all = [...TEST_SPECIALTY_OPTIONS, ...new Set(extra)]
    return [{ value: '', label: 'Todas as áreas' }, ...all.map(s => ({ value: s, label: s }))]
  }, [catalog])

  const term = useDebounce(search)
  const filtered = catalog
    .filter(t => !specialtyFilter || t.specialty === specialtyFilter)
    .filter(t => !term.trim() || matchesSearch(t.name, term))

  function toggle(id: string) {
    setDraft(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Selecionar testes"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={() => onConfirm(Array.from(draft))} loading={saving}>Concluir</Button>
        </>
      }
    >
      <div className={styles.wrap}>
        <div className={styles.filtros}>
          <Input
            size="sm"
            iconLeft={<IconSearch />}
            placeholder="Pesquisar teste..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Pesquisar teste"
            className={styles.busca}
          />
          <Select
            size="sm"
            options={specialtyOptions}
            value={specialtyFilter}
            onChange={e => setSpecialtyFilter(e.target.value)}
            aria-label="Filtrar por área"
            className={styles.filtroArea}
          />
        </div>

        <ul className={styles.list}>
          {filtered.length === 0 ? (
            <li className={styles.empty}>Nenhum teste encontrado</li>
          ) : (
            filtered.map(t => (
              <li key={t.id}>
                <label className={styles.item}>
                  <input
                    type="checkbox"
                    checked={draft.has(t.id)}
                    onChange={() => toggle(t.id)}
                    className={styles.checkbox}
                  />
                  <span className={styles.itemText}>
                    <span className={styles.itemLabel}>{t.name}</span>
                    <span className={styles.itemSub}>{t.specialty}</span>
                  </span>
                </label>
              </li>
            ))
          )}
        </ul>
      </div>
    </Modal>
  )
}
