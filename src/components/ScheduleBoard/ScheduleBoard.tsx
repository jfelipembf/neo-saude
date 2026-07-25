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
import { ClassAttendanceModal } from '@/components/ClassAttendanceModal/ClassAttendanceModal'
import { SCHEDULE_VIEW_OPTIONS } from '@/constants'
import { useScheduleAppointments } from '@/hooks/useSchedule'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useAvailabilityTemplate, useBlockedSlots, useSaveBlockedSlots, useAbsences } from '@/hooks/useProfessionalAvailability'
import { useClassGroups } from '@/hooks/useClassGroups'
import {
  useClassGroupEnrollmentCounts, useEnrollPatient, useEntitlementWeeklyLimit,
  usePatientClassGroupEnrollments,
} from '@/hooks/useClassGroupRoster'
import { useRooms } from '@/hooks/useRooms'
import { useDebounce } from '@/hooks/useDebounce'
import { usePatientName } from '@/hooks/useDisplayNames'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { useToast } from '@/components/Toast/Toast'
import { useSession } from '@/context/SessionProvider'
import { getCurrentClinicId } from '@/lib/tenant'
import { matchesSearch } from '@/utils/search'
import { toIsoDate } from '@/utils/date'
import { materializeClassGroupOccurrences } from '@/utils/classGroupOccurrences'
import { isMobileViewport } from '@/utils/viewport'
import { IconSearch, IconFilter } from '@/components/icons'
import type { ScheduledAppointment, ClassGroupOccurrence } from '@/types/domain'
import styles from './ScheduleBoard.module.scss'

/** Domingo da semana de `d` (a grade vai de Dom a Sáb; colunas começam na Seg). */
function weekStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay())
}

// Preferência "Sáb/Dom escondidos" persistida por navegador (mesmo padrão de
// ThemeProvider.tsx) — string simples de dígitos separados por vírgula, sem
// JSON, para não ter parse que quebre com um valor corrompido. POR CLÍNICA:
// cada uma tem sua particularidade (uma atende sábado, outra não) — uma
// chave só pro navegador vazava a preferência de uma clínica pra outra em
// quem tem acesso a mais de uma.
function hiddenWeekdaysKey(clinicId: string) {
  return `neo-saude-agenda-hidden-weekdays:${clinicId}`
}

function loadHiddenWeekdays(clinicId: string): Set<number> {
  const saved = localStorage.getItem(hiddenWeekdaysKey(clinicId)) ?? ''
  return new Set(saved.split(',').filter(Boolean).map(Number))
}

interface EnrollTarget {
  patientId: string
  patientName: string
  entitlementId: string
}

interface ScheduleBoardProps {
  /** Ação ao clicar num horário (opcional — sem ela os cards ficam só de leitura). */
  onSelect?: (appointment: ScheduledAppointment) => void
  /** Clique no "+" de uma célula vazia e disponível — só aparece com um
   *  profissional filtrado (é ele quem entra pré-preenchido no modal). */
  onQuickAdd?: (professionalId: string, dateIso: string, time: string) => void
  /** Modo "Matricular" (veio do botão no perfil do paciente, via ?enroll=&
   *  entitlement= — ver SchedulePage): clicar numa turma matricula esse
   *  paciente direto, sem abrir a chamada. */
  enrollTarget?: EnrollTarget
  /** Matrícula concluída OU "Cancelar" no modo enrollTarget. */
  onEnrollDone?: () => void
}

/** Grade de horários autocontida (controles + grid), reaproveitável em qualquer página. */
export function ScheduleBoard({ onSelect, onQuickAdd, enrollTarget, onEnrollDone }: ScheduleBoardProps) {
  // Módulo-level, igual services (ScheduleBoard só monta autenticado, sessão
  // já resolvida) — evita lidar com o `info` ainda-nulo do SessionProvider.
  const clinicId = getCurrentClinicId()
  const { specialty } = useSession()
  // No celular a grade abre no DIA. Sete colunas num aparelho estreito deixam
  // cada consulta com poucos pixels de largura — ilegível, e a rolagem
  // horizontal esconde metade da semana. Lido UMA vez na montagem
  // (inicializador preguiçoso): trocar de visualização depois é escolha de quem
  // está usando, e girar o aparelho não pode desfazer essa escolha.
  const [view, setView] = useState<ScheduleView>(() => (isMobileViewport() ? 'day' : 'week'))
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
  const [hiddenWeekdays, setHiddenWeekdays] = useState<Set<number>>(() => loadHiddenWeekdays(clinicId))
  useEffect(() => {
    localStorage.setItem(hiddenWeekdaysKey(clinicId), [...hiddenWeekdays].join(','))
  }, [clinicId, hiddenWeekdays])

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
  const { data: appointments = [], isLoading } = useScheduleAppointments(fromIso, toIso)
  const toast = useToast()

  // Turmas coletivas materializadas na semana visível — mesma cor do
  // profissional responsável dos cards de consulta (ver ClassGroupCard).
  const { data: classGroups = [] } = useClassGroups()
  const { data: rooms = [] } = useRooms()
  const { data: enrollmentCounts = new Map<string, number>() } = useClassGroupEnrollmentCounts()
  const roomNameById = new Map(rooms.map(r => [r.id, r.name]))
  const classOccurrences = materializeClassGroupOccurrences(classGroups, fromIso, toIso, roomNameById, enrollmentCounts)

  // Chamada da turma (presença/falta + prontuário) — só fisioterapia (ver
  // ClassAttendanceModal). Nas demais especialidades o card de turma não abre nada.
  const [attendanceOccurrence, setAttendanceOccurrence] = useState<ClassGroupOccurrence | null>(null)

  // ── Modo "Matricular" (enrollTarget) ──────────────────────────────────────
  // Multi-seleção: clicar numa turma ALTERNA ela na seleção (sombra/selo no
  // card, ver ClassGroupCard) — só matricula de fato ao clicar "Matricular
  // (N)". Turma que o paciente já cursa nem entra na seleção (aviso).
  const { mutateAsync: enrollAsync, isPending: enrollingFromSchedule } = useEnrollPatient()
  const { data: currentEnrollments = [] } = usePatientClassGroupEnrollments(enrollTarget?.patientId ?? '')
  const { data: weeklyLimit } = useEntitlementWeeklyLimit(enrollTarget?.entitlementId ?? '')
  const [selectedClassGroupIds, setSelectedClassGroupIds] = useState<Set<string>>(new Set())
  const [confirmingEnroll, setConfirmingEnroll] = useState(false)

  // Troca de paciente/entitlement (outro "Matricular" clicado) — zera a
  // seleção em rascunho, ela é só desta rodada.
  useEffect(() => {
    setSelectedClassGroupIds(new Set())
  }, [enrollTarget?.patientId, enrollTarget?.entitlementId])

  const alreadyEnrolledGroupIds = new Set(currentEnrollments.map(e => e.classGroupId))
  // Sessões/semana já ocupadas pelo MESMO contrato (entitlement) desta rodada
  // — outro contrato do paciente não conta pro limite deste. Cada ClassGroup
  // é UM dia (ver domain.ts), então sessão selecionada = dia usado.
  const weeklyUsed = currentEnrollments.filter(e => e.entitlementId === enrollTarget?.entitlementId).length
  const selectedWeekly = selectedClassGroupIds.size

  // Clique num card de turma: no modo "Matricular" alterna a seleção
  // (respeitando o limite semanal do contrato). Fora desse modo, abre a
  // chamada normal (só fisioterapia).
  function handleClassCardClick(occurrence: ClassGroupOccurrence) {
    if (!enrollTarget) { setAttendanceOccurrence(occurrence); return }

    if (alreadyEnrolledGroupIds.has(occurrence.classGroupId)) {
      toast.info('Paciente já matriculado nesta turma.')
      return
    }

    setSelectedClassGroupIds(prev => {
      const next = new Set(prev)
      if (next.has(occurrence.classGroupId)) { next.delete(occurrence.classGroupId); return next }

      if (weeklyLimit != null && weeklyUsed + selectedWeekly + 1 > weeklyLimit) {
        toast.info(`Limite semanal do contrato (${weeklyLimit} dia${weeklyLimit > 1 ? 's' : ''}/semana) seria excedido.`)
        return prev
      }
      next.add(occurrence.classGroupId)
      return next
    })
  }

  function handleCancelEnroll() {
    setSelectedClassGroupIds(new Set())
    onEnrollDone?.()
  }

  async function handleConfirmEnroll() {
    if (!enrollTarget || selectedClassGroupIds.size === 0) return
    setConfirmingEnroll(true)
    const ids = [...selectedClassGroupIds]
    const results = await Promise.allSettled(ids.map(classGroupId => enrollAsync({
      classGroupId,
      dateIso: classOccurrences.find(o => o.classGroupId === classGroupId)?.date ?? toIsoDate(new Date()),
      patientId: enrollTarget.patientId,
      entitlementId: enrollTarget.entitlementId,
    })))
    setConfirmingEnroll(false)
    const okCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.length - okCount
    if (okCount > 0) toast.success(`Matriculado em ${okCount} turma${okCount > 1 ? 's' : ''}!`)
    if (failCount > 0) toast.error(failCount === 1 ? 'Uma turma não pôde ser matriculada.' : 'Algumas turmas não puderam ser matriculadas.')
    if (failCount === 0) { setSelectedClassGroupIds(new Set()); onEnrollDone?.() }
  }

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
      ? 'Salvar'
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

  const patientName = usePatientName()

  // Profissional selecionado: filtra ANTES da busca (grade menor = busca mais barata).
  const byProfessional = professionalId
    ? appointments.filter(s => s.professionalId === professionalId)
    : appointments
  const visibleClassOccurrences = professionalId
    ? classOccurrences.filter(o => o.professionalId === professionalId)
    : classOccurrences

  // Busca por paciente: some com os demais cards e ficam só os agendamentos
  // dele na semana visível (nome normalizado — acento não atrapalha).
  const term = useDebounce(search)
  const visible = term.trim()
    ? byProfessional.filter(s => matchesSearch(patientName(s.patientId), term))
    : byProfessional

  if (isLoading) return <PageLoader />

  return (
    <div className={styles.board}>
      {enrollTarget && (
        <div className={styles.enrollBar}>
          <div className={styles.enrollBarTop}>
            <span className={styles.enrollBarText}>
              Matriculando <strong>{enrollTarget.patientName}</strong> — clique numa ou mais turmas na agenda
              {selectedClassGroupIds.size > 0 ? ` (${selectedClassGroupIds.size} selecionada${selectedClassGroupIds.size > 1 ? 's' : ''})` : ''} e confirme.
              {weeklyLimit != null && ` Limite do contrato: ${weeklyUsed + selectedWeekly}/${weeklyLimit} dias/semana.`}
            </span>
            <div className={styles.enrollBarActions}>
              <Button variant="ghost" disabled={confirmingEnroll} onClick={handleCancelEnroll}>Cancelar</Button>
              <Button
                disabled={selectedClassGroupIds.size === 0}
                loading={confirmingEnroll || enrollingFromSchedule}
                onClick={handleConfirmEnroll}
              >
                Matricular{selectedClassGroupIds.size > 0 ? ` (${selectedClassGroupIds.size})` : ''}
              </Button>
            </div>
          </div>

          {currentEnrollments.length > 0 && (
            <div className={styles.enrollCurrent}>
              <span className={styles.enrollCurrentLabel}>Turmas matriculadas:</span>
              <div className={styles.enrollCurrentList}>
                {currentEnrollments.map(e => (
                  <span key={e.enrollmentId} className={styles.enrollChip}>
                    {e.classGroupName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.controls}>
        {/* Filtro por profissional só existe quando há QUEM filtrar: com um
            profissional só (o consultório de uma pessoa), o seletor ofereceria
            "Todos" e o nome dela — uma escolha sem consequência ocupando a
            barra. Ele já vem pré-selecionado logo acima, então a grade mostra
            a agenda dele de qualquer forma. */}
        {professionals.length > 1 && (
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
        )}
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
                <Button size="md" variant={blockMode && !onlyUnblocking ? 'danger' : 'secondary'} onClick={handleBlockButtonClick}>
                  {blockMode ? blockActionLabel : 'Selecionar'}
                </Button>
                {blockMode && (
                  <Button size="md" variant="ghost" onClick={handleCancelBlockMode}>Cancelar</Button>
                )}
              </>
            )}

            <WeekNavigator date={refDate} view={view} onChange={setRefDate} />
          </div>
          {/* size="md" explícito nos quatro — Input/Select da barra já eram
              explícitos, e sem a mesma prop aqui Button/SegmentedControl
              dependiam do default coincidir por acaso. */}
          <Button size="md" variant="secondary" onClick={() => setRefDate(new Date())}>Hoje</Button>
          <SegmentedControl size="md" options={SCHEDULE_VIEW_OPTIONS} value={view} onChange={setView} />

          {/* Mostrar/esconder Sáb e Dom na grade da semana. */}
          <div className={styles.filtro} ref={filterRef}>
            <Button
              size="md"
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
        classOccurrences={visibleClassOccurrences}
        onSelectClass={enrollTarget || specialty === 'physiotherapy' ? handleClassCardClick : undefined}
        selectedClassGroupIds={enrollTarget ? selectedClassGroupIds : undefined}
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

      <ClassAttendanceModal occurrence={attendanceOccurrence} onClose={() => setAttendanceOccurrence(null)} />
    </div>
  )
}
