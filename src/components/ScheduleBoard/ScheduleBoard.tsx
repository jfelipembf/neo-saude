import { useEffect, useState } from 'react'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { WeekNavigator } from '@/components/WeekNavigator/WeekNavigator'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { ScheduleGrid } from '@/components/ScheduleGrid/ScheduleGrid'
import type { ScheduleView } from '@/components/ScheduleGrid/ScheduleGrid'
import { SCHEDULE_VIEW_OPTIONS } from '@/components/ScheduleGrid/scheduleOptions'
import { useAgendaAppointments } from '@/hooks/useSchedule'
import { useSetAppointmentStatus } from '@/hooks/useAppointments'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useAvailabilityTemplate, useBlockedSlots, useSaveBlockedSlots, useAbsences } from '@/hooks/useProfessionalAvailability'
import { useDebounce } from '@/hooks/useDebounce'
import { usePatientName } from '@/hooks/useDisplayNames'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { useToast } from '@/components/Toast/useToast'
import { matchesSearch } from '@/utils/search'
import { toIsoDate } from '@/utils/date'
import { IconSearch, IconFilter } from '@/components/icons'
import type { AgendaAppointment } from '@/types/domain'
import styles from './ScheduleBoard.module.scss'

/** Domingo da semana de `d` (a grade vai de Dom a Sáb; colunas começam na Seg). */
function weekStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay())
}

// Preferência "Sáb/Dom escondidos" persistida por navegador (mesmo padrão de
// ThemeProvider.tsx) — string simples de dígitos separados por vírgula, sem
// JSON, para não ter parse que quebre com um valor corrompido.
const HIDDEN_WEEKDAYS_KEY = 'neo-saude-agenda-hidden-weekdays'

function loadHiddenWeekdays(): Set<number> {
  const saved = localStorage.getItem(HIDDEN_WEEKDAYS_KEY) ?? ''
  return new Set(saved.split(',').filter(Boolean).map(Number))
}

interface ScheduleBoardProps {
  /** Ação ao clicar num horário (opcional — sem ela os cards ficam só de leitura). */
  onSelect?: (appointment: AgendaAppointment) => void
  /** Clique no "+" de uma célula vazia e disponível — só aparece com um
   *  profissional filtrado (é ele quem entra pré-preenchido no modal). */
  onQuickAdd?: (professionalId: string, dateIso: string, time: string) => void
}

/** Grade de horários autocontida (controles + grid), reaproveitável em qualquer página. */
export function ScheduleBoard({ onSelect, onQuickAdd }: ScheduleBoardProps) {
  const [view, setView] = useState<ScheduleView>('week')
  const [refDate, setRefDate] = useState(() => new Date())
  const [search, setSearch] = useState('')
  // '' = todos os profissionais (sem filtro).
  const [professionalId, setProfessionalId] = useState('')
  const { data: professionals = [] } = useProfessionals()

  // Clínica com um profissional só: seleciona ele de cara (a grade já entra
  // mostrando a disponibilidade dele) — ajuste em tempo de render, roda uma
  // vez só (mesmo padrão de AvailabilityPanel.tsx), não trava se o usuário
  // depois voltar para "Todos os profissionais".
  const [autoSelected, setAutoSelected] = useState(false)
  if (!autoSelected && professionals.length === 1) {
    setProfessionalId(professionals[0].id)
    setAutoSelected(true)
  }

  // Disponibilidade do profissional filtrado — desenha a listra na grade
  // (a query só dispara com professionalId preenchido, ver o hook).
  const { data: availabilitySlots } = useAvailabilityTemplate(professionalId)
  const selectedProfessional = professionals.find(p => p.id === professionalId)

  // Dias (0=Dom, 6=Sáb) escondidos da grade — não filtra os agendamentos,
  // só as colunas exibidas (a marcação continua existindo na data real).
  // Persiste por navegador: reabrir a Agenda mantém a mesma escolha.
  const [hiddenWeekdays, setHiddenWeekdays] = useState<Set<number>>(loadHiddenWeekdays)
  useEffect(() => {
    localStorage.setItem(HIDDEN_WEEKDAYS_KEY, [...hiddenWeekdays].join(','))
  }, [hiddenWeekdays])

  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useOutsideClick<HTMLDivElement>(() => setFilterOpen(false), filterOpen)

  function toggleWeekday(day: number) {
    setHiddenWeekdays(prev => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  // Sáb/Dom escondidos é preferência GERAL do usuário — mas se o profissional
  // filtrado atende naquele dia, a agenda DELE mostra o dia mesmo assim (não
  // faz sentido esconder sábado de quem atende sábado). Não mexe na
  // preferência salva: é só um ajuste na hora de desenhar a grade. Isso já
  // resolve o "bloquear agendamento" também: bloqueio só existe em dia que o
  // profissional atende, e esse dia já fica visível por este mesmo motivo.
  const workedWeekdays = new Set((availabilitySlots ?? []).map(s => s.weekday))
  const effectiveHiddenWeekdays = professionalId
    ? new Set([...hiddenWeekdays].filter(wd => !workedWeekdays.has(wd)))
    : hiddenWeekdays

  // Busca SÓ a semana visível — navegar de semana refaz a consulta (cacheada
  // por intervalo em queryKeys.appointments.range).
  const start = weekStart(refDate)
  const fromIso = toIsoDate(start)
  const toIso = toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))
  const { data: appointments = [], isLoading } = useAgendaAppointments(fromIso, toIso)
  const toast = useToast()

  // ── Bloqueio de hora específica e ausência por período ────────────────────
  // Vencem a disponibilidade recorrente (ver ScheduleGrid.tsx isAvailable).
  const { data: blockedSlotsData } = useBlockedSlots(professionalId, fromIso, toIso)
  const { data: absences } = useAbsences(professionalId)
  const { mutate: saveBlocks, isPending: savingBlocks } = useSaveBlockedSlots(professionalId, fromIso, toIso)

  const blockedSlotSet = new Set((blockedSlotsData ?? []).map(b => `${b.date}-${b.hour}`))
  // Dias da semana visível que caem dentro de algum período de ausência —
  // comparação de string ISO funciona pra ordem cronológica.
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)))
  const absentDates = new Set(weekDates.filter(d => (absences ?? []).some(a => d >= a.startDate && d <= a.endDate)))

  // Modo "bloquear agendamento": botão ao lado da busca. 1º clique
  // ("Selecionar") liga o modo — a grade passa a mostrar checkbox nas
  // células dentro da disponibilidade do profissional; 2º clique (agora
  // "Bloquear agendamento") abre o ConfirmDialog com o motivo.
  const [blockMode, setBlockMode] = useState(false)
  const [blockSelection, setBlockSelection] = useState<Set<string> | null>(null)
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false)
  const [blockReason, setBlockReason] = useState('')

  // Ao ligar o modo, sincroniza a seleção com o que já está salvo (uma vez só
  // — mesmo padrão de AvailabilityPanel.tsx). Ao desligar, limpa pra
  // ressincronizar na próxima vez que ligar.
  if (blockMode && blockSelection === null && blockedSlotsData) {
    setBlockSelection(new Set(blockedSlotsData.map(b => `${b.date}-${b.hour}`)))
  }
  if (!blockMode && blockSelection !== null) {
    setBlockSelection(null)
  }

  function toggleBlockCell(dateIso: string, hour: number) {
    const key = `${dateIso}-${hour}`
    setBlockSelection(prev => {
      const next = new Set(prev ?? [])
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Compara a seleção em rascunho com o que já está salvo pra saber se a
  // ação é bloquear (marcou algo novo), desbloquear (desmarcou algo que já
  // estava bloqueado) ou os dois — o botão e o ConfirmDialog mudam de nome
  // conforme (não faz sentido pedir "Bloquear" quando o usuário só desmarcou).
  const pendingSelection = blockSelection ?? new Set<string>()
  const newBlocks = [...pendingSelection].filter(k => !blockedSlotSet.has(k)).length
  const unblocks = [...blockedSlotSet].filter(k => !pendingSelection.has(k)).length
  const onlyUnblocking = unblocks > 0 && newBlocks === 0
  const blockActionLabel = onlyUnblocking
    ? 'Desbloquear agendamento'
    : newBlocks > 0 && unblocks > 0
      ? 'Salvar alterações'
      : 'Bloquear agendamento'

  /** Clique no botão: 1ª vez liga o modo, 2ª vez abre a confirmação. */
  function handleBlockButtonClick() {
    if (!blockMode) {
      setBlockMode(true)
      return
    }
    setConfirmBlockOpen(true)
  }

  /** Sai do modo sem salvar (botão "Cancelar" ao lado, só aparece em modo). */
  function handleCancelBlockMode() {
    setBlockMode(false)
    setConfirmBlockOpen(false)
    setBlockReason('')
  }

  function handleConfirmSaveBlocks() {
    const blocks = [...(blockSelection ?? [])].map(key => {
      const i = key.lastIndexOf('-')
      return { date: key.slice(0, i), hour: Number(key.slice(i + 1)) }
    })
    saveBlocks(
      // weekDates = os 7 dias da semana visível — precisa ser TODOS, não só
      // as pontas (fromIso/toIso = Dom/Sáb): senão desmarcar um dia do meio
      // (ex.: terça) nunca apaga a linha bloqueada dela no banco.
      { dates: weekDates, blocks, reason: blockReason },
      {
        onSuccess: () => {
          toast.success('Bloqueios salvos!')
          setBlockMode(false)
          setBlockReason('')
        },
        onError: () => toast.error('Não foi possível salvar. Tente novamente.'),
      },
    )
  }

  const { mutate: setStatus } = useSetAppointmentStatus()

  const patientName = usePatientName()

  // Profissional selecionado: filtra ANTES da busca (grade menor = busca mais barata).
  const byProfessional = professionalId
    ? appointments.filter(s => s.professionalId === professionalId)
    : appointments

  // Busca por paciente: some com os demais cards e ficam só os agendamentos
  // dele na semana visível (nome normalizado — acento não atrapalha).
  const term = useDebounce(search)
  const visible = term.trim()
    ? byProfessional.filter(s => matchesSearch(patientName(s.patientId), term))
    : byProfessional

  if (isLoading) return <PageLoader />

  return (
    <div className={styles.board}>
      <div className={styles.controls}>
        <Select
          size="md"
          value={professionalId}
          onChange={e => setProfessionalId(e.target.value)}
          options={[
            { value: '', label: 'Todos os profissionais' },
            ...professionals.map(p => ({ value: p.id, label: p.name })),
          ]}
          aria-label="Filtrar agenda por profissional"
          className={styles.selectProfissional}
        />
        <div className={styles.controlsRight}>
          {/* Busca colada à frente do "20/07 – 26/07" — não quebra de linha. */}
          <div className={styles.buscaSemana}>
            <Input
              size="md"
              iconLeft={<IconSearch />}
              placeholder="Buscar paciente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Buscar paciente na grade"
              className={styles.busca}
            />

            {/* Bloquear horário do profissional filtrado (qualquer dia em que
                ele atende): 1º clique liga a seleção nas células da grade,
                2º clique pede o motivo. */}
            {professionalId && (
              <>
                <Button variant={blockMode && !onlyUnblocking ? 'danger' : 'secondary'} onClick={handleBlockButtonClick}>
                  {blockMode ? blockActionLabel : 'Selecionar'}
                </Button>
                {blockMode && (
                  <Button variant="ghost" onClick={handleCancelBlockMode}>Cancelar</Button>
                )}
              </>
            )}

            <WeekNavigator date={refDate} view={view} onChange={setRefDate} />
          </div>
          <Button variant="secondary" onClick={() => setRefDate(new Date())}>Hoje</Button>
          <SegmentedControl options={SCHEDULE_VIEW_OPTIONS} value={view} onChange={setView} />

          {/* Mostrar/esconder Sáb e Dom na grade da semana. */}
          <div className={styles.filtro} ref={filterRef}>
            <Button
              variant="secondary"
              iconLeft={<IconFilter />}
              onClick={() => setFilterOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={filterOpen}
              aria-label="Filtrar dias da semana exibidos"
            />
            {filterOpen && (
              <div className={styles.filtroMenu} role="menu">
                <label className={styles.filtroItem}>
                  <input
                    type="checkbox"
                    className={styles.filtroCheckbox}
                    checked={!effectiveHiddenWeekdays.has(6)}
                    onChange={() => toggleWeekday(6)}
                  />
                  Sábado
                </label>
                <label className={styles.filtroItem}>
                  <input
                    type="checkbox"
                    className={styles.filtroCheckbox}
                    checked={!effectiveHiddenWeekdays.has(0)}
                    onChange={() => toggleWeekday(0)}
                  />
                  Domingo
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScheduleGrid
        appointments={visible}
        view={view}
        referenceDate={refDate}
        hiddenWeekdays={effectiveHiddenWeekdays}
        availability={professionalId ? {
          slots: availabilitySlots ?? [],
          color: selectedProfessional?.color,
          blockedSlots: blockedSlotSet,
          absentDates,
        } : undefined}
        onQuickAdd={onQuickAdd && professionalId && !blockMode ? (dateIso, time) => onQuickAdd(professionalId, dateIso, time) : undefined}
        blockEditing={blockMode ? { selected: blockSelection ?? new Set(), onToggle: toggleBlockCell } : undefined}
        onSelect={onSelect}
        onSetStatus={(a, status) => setStatus(
          { id: a.id, status },
          {
            onSuccess: () => toast.success({
              completed: 'Presença registrada!',
              no_show: 'Falta registrada.',
              canceled: 'Consulta cancelada.',
              scheduled: 'Marcação desfeita — consulta agendada.',
              confirmed: 'Consulta confirmada.',
              in_service: 'Consulta em atendimento.',
            }[status]),
            onError: () => toast.error('Não foi possível registrar. Tente novamente.'),
          },
        )}
        showArrow={!!onSelect}
      />

      <ConfirmDialog
        open={confirmBlockOpen}
        onClose={() => setConfirmBlockOpen(false)}
        onConfirm={handleConfirmSaveBlocks}
        title={onlyUnblocking ? 'Desbloquear estes horários?' : 'Bloquear estes horários?'}
        message={
          newBlocks > 0 && unblocks > 0
            ? `${newBlocks} horário(s) serão bloqueados e ${unblocks} desbloqueado(s).`
            : onlyUnblocking
              ? `${unblocks} horário(s) voltarão a ficar disponíveis para agendamento.`
              : `${newBlocks} horário(s) selecionado(s) ficarão indisponíveis para agendamento.`
        }
        confirmLabel={onlyUnblocking ? 'Desbloquear' : 'Bloquear'}
        confirmDisabled={savingBlocks}
      >
        <Input
          label="Motivo (opcional)"
          placeholder="Ex.: consulta médica, imprevisto..."
          value={blockReason}
          onChange={e => setBlockReason(e.target.value)}
        />
      </ConfirmDialog>
    </div>
  )
}
