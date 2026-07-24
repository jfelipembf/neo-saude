import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { DayPicker } from '@/components/DayPicker/DayPicker'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { SideList } from '@/components/SideList/SideList'
import type { SideListItem } from '@/components/SideList/SideList'
import { useToast } from '@/components/Toast/useToast'
import { IconInfo, IconTrash } from '@/components/icons'
import { useClassGroups, useCreateClassGroups, useDeleteClassGroup, useUpdateClassGroup } from '@/hooks/useClassGroups'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useRooms } from '@/hooks/useRooms'
import { DAY_OF_WEEK_SHORT } from '@/constants/dates'
import { brToIsoDate, toIsoDate } from '@/utils/date'
import type { ClassGroupFields } from '@/services/classGroupsService'
import type { ClassGroup } from '@/types/domain'
import styles from './ClassesTab.module.scss'

// Turma coletiva (Pilates, RPG em grupo…): nome + profissional responsável +
// sala + dia(s) da semana em que acontece, todos compartilhando o MESMO
// horário/duração/capacidade ao nascer (não há horário diferente por dia).
// Cada dia selecionado na criação vira sua PRÓPRIA sessão (ClassGroup) —
// capacidade e matrícula independentes, um paciente pode entrar só numa delas
// (ver domain.ts ClassGroup). Editar uma sessão já existente só troca o dia
// DESSA sessão (DayPicker em modo de seleção única). Mesmo modelo de
// formulário do módulo de turmas do projeto Neo (academia), com "Nome"
// digitado direto em vez de derivado de uma Atividade separada.

function addMinutes(start: string, minutes: number) {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

interface ClassFormState {
  name: string
  professionalId: string
  roomId: string
  weekdays: number[]
  startTime: string
  duration: number       // minutos
  maxCapacity: number
  startDate: string        // aaaa-mm-dd (input date)
  endDate: string           // aaaa-mm-dd ou ''
}

const EMPTY_FORM = (): ClassFormState => ({
  name: '', professionalId: '', roomId: '', weekdays: [], startTime: '', duration: 60, maxCapacity: 12,
  startDate: toIsoDate(new Date()), endDate: '',
})

function formFromClassGroup(g: ClassGroup): ClassFormState {
  return {
    name: g.name,
    professionalId: g.professionalId ?? '',
    roomId: g.roomId ?? '',
    weekdays: [g.weekday],
    startTime: g.startTime,
    duration: g.durationMinutes,
    maxCapacity: g.maxCapacity,
    startDate: brToIsoDate(g.startDate) ?? toIsoDate(new Date()),
    endDate: brToIsoDate(g.endDate) ?? '',
  }
}

/** Aba "Turmas" (turmas coletivas): catálogo + formulário de criação/edição. */
export function ClassesTab() {
  const toast = useToast()
  const { data: classGroups = [] } = useClassGroups()
  const { data: professionals = [] } = useProfessionals()
  const { data: rooms = [] } = useRooms()
  const { mutate: create, isPending: creating } = useCreateClassGroups()
  const { mutate: update, isPending: updating } = useUpdateClassGroup()
  const { mutate: remove, isPending: deleting } = useDeleteClassGroup()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<ClassFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')
  const [daysError, setDaysError] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const isFormVisible = selectedId !== null || isNew
  const saving = creating || updating

  const professionalOptions = professionals
    .filter(p => p.status === 'active')
    .map(p => ({ value: p.id, label: p.name }))
  const roomOptions = rooms.map(r => ({ value: r.id, label: r.name }))

  const items: SideListItem[] = classGroups.map(g => {
    const endTime = addMinutes(g.startTime, g.durationMinutes)
    return { id: g.id, label: g.name, sublabel: `${DAY_OF_WEEK_SHORT[g.weekday]} · ${g.startTime}–${endTime}` }
  })

  function handleChange<K extends keyof ClassFormState>(key: K, value: ClassFormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSelect(id: string | number) {
    const g = classGroups.find(x => x.id === String(id))
    if (!g) return
    setSelectedId(String(id)); setIsNew(false); setForm(formFromClassGroup(g)); setNameError(''); setDaysError('')
  }
  function handleNew() {
    setSelectedId(null); setIsNew(true); setForm(EMPTY_FORM()); setNameError(''); setDaysError('')
  }
  function handleCancel() {
    setSelectedId(null); setIsNew(false); setForm(EMPTY_FORM()); setNameError(''); setDaysError('')
  }

  function handleSave() {
    if (!form.name.trim()) { setNameError('Informe o nome da turma.'); return }
    if (form.weekdays.length === 0) { setDaysError('Selecione ao menos um dia da semana.'); return }

    const fields: ClassGroupFields = {
      name: form.name.trim(),
      professionalId: form.professionalId || undefined,
      roomId: form.roomId || undefined,
      startTime: form.startTime,
      durationMinutes: Number(form.duration),
      maxCapacity: Number(form.maxCapacity),
      startDateIso: form.startDate,
      endDateIso: form.endDate || undefined,
    }
    if (selectedId) {
      // Editar troca só o dia DESTA sessão (DayPicker em seleção única aqui).
      update({ id: selectedId, payload: { ...fields, weekday: form.weekdays[0] } }, {
        onSuccess: () => { toast.success('Turma atualizada!'); setIsNew(false) },
      })
    } else {
      // Cada dia selecionado nasce como sua própria sessão independente.
      create({ fields, weekdays: form.weekdays }, {
        onSuccess: ids => {
          toast.success(ids.length > 1 ? `${ids.length} sessões criadas!` : 'Turma criada!')
          setSelectedId(ids[0])
          setIsNew(false)
        },
      })
    }
  }

  function handleConfirmDelete() {
    if (!selectedId) return
    remove(selectedId, { onSuccess: () => { toast.success('Turma excluída!'); handleCancel() } })
  }

  const selectedClassGroup = selectedId ? classGroups.find(g => g.id === selectedId) : null

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <SideList
          title="Turmas"
          size="lg"
          items={items}
          selectedId={selectedId}
          onSelect={handleSelect}
          onAdd={handleNew}
          hideSearch
          emptyText="Nenhuma turma cadastrada"
        />
      </div>

      <div className={styles.formArea}>
        {!isFormVisible ? (
          <EmptyState
            title="Nenhuma turma selecionada"
            description="Selecione uma turma na lista ao lado ou crie uma nova clicando em +."
          />
        ) : (
          <div className={styles.card}>
            <div className={styles.cols}>
              <div className={styles.col}>
                <h3 className={styles.sectionTitle}>{isNew ? 'Nova turma' : 'Dados da turma'}</h3>
                <div className={styles.fieldsGrid2}>
                  <Input
                    label="Nome"
                    placeholder="Ex: Pilates Solo, RPG em Grupo..."
                    value={form.name}
                    onChange={e => { handleChange('name', e.target.value); setNameError('') }}
                    error={nameError}
                  />
                  <Select
                    label="Profissional responsável"
                    placeholder="Selecione o profissional..."
                    options={professionalOptions}
                    value={form.professionalId}
                    onChange={e => handleChange('professionalId', e.target.value)}
                  />
                  <Select
                    label="Sala"
                    placeholder="Selecione a sala..."
                    options={roomOptions}
                    value={form.roomId}
                    onChange={e => handleChange('roomId', e.target.value)}
                  />
                  <div className={styles.fieldFull}>
                    <DayPicker
                      label={isNew ? 'Dias da semana (uma sessão por dia)' : 'Dia da semana'}
                      value={form.weekdays}
                      onChange={days => { handleChange('weekdays', days); setDaysError('') }}
                      multiple={isNew}
                    />
                    {daysError && <span className={styles.fieldError}>{daysError}</span>}
                  </div>
                </div>
              </div>

              <div className={styles.colDivider} />

              <div className={styles.col}>
                <h3 className={styles.sectionTitle}>Horário e capacidade</h3>
                <div className={styles.fieldsGrid}>
                  <Input label="Hora início" type="time" value={form.startTime} onChange={e => handleChange('startTime', e.target.value)} />
                  <Input label="Duração (min)" type="number" min={1} value={form.duration} onChange={e => handleChange('duration', Number(e.target.value))} />
                  <Input label="Capacidade máxima" type="number" min={1} value={form.maxCapacity} onChange={e => handleChange('maxCapacity', Number(e.target.value))} />
                  <Input label="Data de início" type="date" value={form.startDate} onChange={e => handleChange('startDate', e.target.value)} />
                  <Input label="Data fim (opcional)" type="date" value={form.endDate} onChange={e => handleChange('endDate', e.target.value)} />
                  <div className={styles.hint}>
                    <span className={styles.hintIcon}><IconInfo /></span>
                    <span>Sem data de fim, a turma continua ativa indefinidamente. Com data de fim, ela deixa de valer a partir dali.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.acoesBar}>
              {!isNew && selectedClassGroup && (
                <Button variant="danger" iconLeft={<IconTrash />} onClick={() => setConfirmDeleteOpen(true)}>
                  Excluir
                </Button>
              )}
              <div className={styles.acoesBarDireita}>
                <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
                <Button onClick={handleSave} loading={saving}>
                  {isNew ? 'Criar turma' : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir turma"
        message={selectedClassGroup ? `Deseja excluir "${selectedClassGroup.name}"? Essa ação não pode ser desfeita.` : ''}
        variant="danger"
        confirmDisabled={deleting}
      />
    </div>
  )
}
