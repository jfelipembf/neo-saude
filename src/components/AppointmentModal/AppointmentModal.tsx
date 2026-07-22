import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { SCHEDULE_TAGS } from '@/constants'
import { useCreateScheduleSlot, useUpdateScheduleSlot } from '@/hooks/useSchedule'
import { usePatients } from '@/hooks/usePatients'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useRooms } from '@/hooks/useRooms'
import { usePatientName } from '@/hooks/useDisplayNames'
import { toIsoDate } from '@/utils/date'
import { digitsOnly } from '@/utils/text'
import { IconPhone, IconX } from '@/components/icons'
import type { ScheduleSlot } from '@/types/domain'
import styles from './AppointmentModal.module.scss'

const CONFIRMATION_OPTIONS = [
  { value: 'yes', label: 'Sim' },
  { value: 'no', label: 'Não' },
] as const

/** 'aaaa-mm-dd' → Date LOCAL (new Date(iso) escorregaria um dia no fuso BR). */
function localDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Data (nesta semana) do dia da semana da sessão — preenche o input date na edição. */
function dateForWeekday(weekday: number) {
  const today = new Date()
  return toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + weekday))
}

/** '07:30' + 30 → '08:00'. */
function addMinutes(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Duração (min) entre '07:30' e '08:00' — para editar uma sessão existente. */
function durationBetween(start: string, end: string) {
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  return Math.max(15, endH * 60 + endM - (startH * 60 + startM))
}

/** Cor do card: casa a atividade/especialidade com a paleta da agenda. */
function activityColor(activity: string) {
  const target = activity.toLowerCase()
  return SCHEDULE_TAGS.find(e =>
    e.label.toLowerCase().includes(target) || target.includes(e.label.toLowerCase()),
  )?.color ?? SCHEDULE_TAGS[0].color
}

interface AppointmentModalProps {
  open: boolean
  onClose: () => void
  /** Sessão em edição — sem ela, o modal cria um agendamento novo. */
  slot?: ScheduleSlot | null
}

/**
 * Modal de agendamento da grade: cria uma consulta ou edita a existente
 * (dentista, paciente com busca, data/horário/duração, etiqueta, confirmação
 * e retorno programado).
 */
export function AppointmentModal({ open, onClose, slot }: AppointmentModalProps) {
  const toast = useToast()
  const { data: professionals } = useProfessionals()
  const { data: patients } = usePatients()
  const { data: rooms } = useRooms()
  const { mutate: create, isPending: creating } = useCreateScheduleSlot()
  const { mutate: update, isPending: saving } = useUpdateScheduleSlot()

  const patientName = usePatientName()
  const [professionalId, setProfessionalId] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [dateIso, setDateIso] = useState(() => toIsoDate(new Date()))
  const [time, setTime] = useState('07:30')
  const [duration, setDuration] = useState('30')
  const [room, setRoom] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmation, setConfirmation] = useState<'yes' | 'no'>('yes')
  const [error, setError] = useState('')
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const canceled = slot?.status === 'canceled'

  // Abriu o modal (ou trocou a sessão): hidrata da sessão (edição) ou reseta
  // (criação). Padrão do React "resetar estado quando um prop muda" — ajuste
  // DURANTE O RENDER com guarda (não um efeito com setState): evita o flash de
  // estado velho de um efeito e o aviso react-hooks/set-state-in-effect.
  const hydrationKey = open ? (slot?.id ?? 'new') : null
  const [hydratedFor, setHydratedFor] = useState<string | null>(null)
  if (hydrationKey !== hydratedFor) {
    setHydratedFor(hydrationKey)
    if (open) {
      setError('')
      setSuggestionsOpen(false)
      if (slot) {
        setProfessionalId(slot.professionalId)
        setPatientSearch(patientName(slot.patientId))
        setDateIso(dateForWeekday(slot.weekday))
        setTime(slot.startTime)
        setDuration(String(durationBetween(slot.startTime, slot.endTime)))
        setRoom(slot.room ?? '')
        setNotes(slot.notes ?? '')
        setConfirmation(slot.sendConfirmation === false ? 'no' : 'yes')
      } else {
        setProfessionalId('')
        setPatientSearch('')
        setDateIso(toIsoDate(new Date()))
        setTime('07:30')
        setDuration('30')
        setRoom('')
        setNotes('')
        setConfirmation('yes')
      }
    }
  }

  const professionalOptions = (professionals ?? [])
    .filter(p => p.status === 'active')
    .map(p => ({ value: p.id, label: p.name }))

  // Busca do paciente por nome, telefone ou CPF (até 6 sugestões).
  const term = patientSearch.trim().toLowerCase()
  const suggestions = term.length >= 2 && suggestionsOpen
    ? (patients ?? [])
        .filter(p =>
          p.name.toLowerCase().includes(term) ||
          p.phone.includes(term) ||
          (p.cpf ?? '').includes(term),
        )
        .slice(0, 6)
    : []

  const currentPatient = (patients ?? []).find(p => p.name === patientSearch.trim())

  /** Monta o payload da sessão com um status específico. */
  function buildPayload(status: ScheduleSlot['status']) {
    // A atividade (e a cor do card) vem da especialidade do profissional —
    // na edição, mantém a atividade que a sessão já tinha.
    const specialty = (professionals ?? []).find(p => p.id === professionalId)?.specialty
    const activity = slot?.activity ?? specialty ?? 'Consulta'
    return {
      patientId: currentPatient!.id,
      activity,
      weekday: localDate(dateIso).getDay(),
      startTime: time,
      endTime: addMinutes(time, Number(duration) || 30),
      professionalId,
      room: room || undefined,
      color: slot?.color ?? activityColor(activity),
      status,
      notes: notes.trim() || undefined,
      sendConfirmation: confirmation === 'yes',
    }
  }

  function handleSave() {
    if (!professionalId) {
      setError('Selecione o dentista/profissional.')
      return
    }
    if (!currentPatient) {
      setError(patientSearch.trim()
        ? 'Selecione o paciente na lista de sugestões.'
        : 'Informe o paciente.')
      return
    }
    if (!time) {
      setError('Informe o horário.')
      return
    }

    // Salvar mantém o status atual (reativa se estava cancelada e editou).
    const payload = buildPayload(slot?.status ?? 'active')
    const options = {
      onSuccess: () => {
        toast.success(slot ? 'Agendamento atualizado!' : 'Consulta agendada!')
        onClose()
      },
    }
    if (slot) update({ id: slot.id, payload }, options)
    else create(payload, options)
  }

  /** Cancela a consulta — o card continua na grade, em cinza. */
  function cancelAppointment() {
    if (!slot) return
    update(
      { id: slot.id, payload: buildPayload('canceled') },
      {
        onSuccess: () => {
          toast.success('Consulta cancelada.')
          setConfirmingCancel(false)
          onClose()
        },
      },
    )
  }

  /** Reativa uma consulta cancelada. */
  function reactivateAppointment() {
    if (!slot) return
    update(
      { id: slot.id, payload: buildPayload('active') },
      {
        onSuccess: () => {
          toast.success('Consulta reativada!')
          onClose()
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={slot ? 'Editar agendamento' : 'Nova consulta'}
      size="lg"
      footer={
        <>
          {/* Cancelar a consulta (não fechar o modal) — só quando ativa. */}
          {slot && !canceled && (
            <Button
              variant="ghost"
              iconLeft={<IconX />}
              className={styles.cancelarConsulta}
              disabled={saving}
              onClick={() => setConfirmingCancel(true)}
            >
              Cancelar consulta
            </Button>
          )}
          {slot && canceled && (
            <Button
              variant="outline"
              className={styles.cancelarConsulta}
              loading={saving}
              onClick={reactivateAppointment}
            >
              Reativar consulta
            </Button>
          )}
          {slot && currentPatient?.phone && (
            <Button
              variant="ghost"
              iconLeft={<IconPhone />}
              title={`Ligar para ${currentPatient.name}`}
              onClick={() => { window.location.href = `tel:+55${digitsOnly(currentPatient.phone)}` }}
            >
              Ligar
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={creating || saving}>Fechar</Button>
          <Button loading={creating || saving} onClick={handleSave}>
            {slot ? 'Salvar alterações' : 'Agendar'}
          </Button>
        </>
      }
    >
      <div className={styles.corpo}>
        {canceled && (
          <div className={styles.avisoCancelada} role="status">
            Esta consulta está <strong>cancelada</strong>. Os dados ficam disponíveis para consulta;
            use “Reativar consulta” para trazê-la de volta à grade.
          </div>
        )}
        <Select
          label="Dentista"
          options={professionalOptions}
          placeholder="Selecione..."
          value={professionalId}
          onChange={e => { setProfessionalId(e.target.value); setError('') }}
        />

        {/* Paciente com busca (nome, telefone ou CPF). */}
        <div className={styles.pacienteCampo}>
          <Input
            label="Paciente"
            placeholder="Busque por nome, telefone ou CPF"
            hint="Não encontrou? Cadastre o paciente na página Pacientes."
            value={patientSearch}
            onChange={e => { setPatientSearch(e.target.value); setSuggestionsOpen(true); setError('') }}
            onFocus={() => setSuggestionsOpen(true)}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className={styles.sugestoes}>
              {suggestions.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={styles.sugestao}
                    onClick={() => { setPatientSearch(p.name); setSuggestionsOpen(false) }}
                  >
                    <span className={styles.sugestaoNome}>{p.name}</span>
                    <span className={styles.sugestaoMeta}>
                      {[p.phone, p.cpf].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.grid3}>
          <Input
            label="Data da consulta"
            type="date"
            value={dateIso}
            onChange={e => setDateIso(e.target.value)}
          />
          <Input
            label="Horário"
            type="time"
            value={time}
            onChange={e => { setTime(e.target.value); setError('') }}
          />
          <Input
            label="Duração (min)"
            type="number"
            min={5}
            step={5}
            inputMode="numeric"
            placeholder="30"
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />
        </div>

        <Select
          label="Sala"
          options={[
            { value: '', label: 'Sem sala definida' },
            ...(rooms ?? []).map(s => ({ value: s.name, label: s.name })),
          ]}
          value={room}
          onChange={e => setRoom(e.target.value)}
        />

        <Textarea
          label="Observações"
          placeholder="Adicione observações sobre esta consulta"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <div className={styles.confirmacao}>
          <span className={styles.confirmacaoRotulo}>Enviar mensagem de confirmação?</span>
          <SegmentedControl options={CONFIRMATION_OPTIONS} value={confirmation} onChange={setConfirmation} />
        </div>

        {error && <p className={styles.erro}>{error}</p>}
      </div>

      <ConfirmDialog
        open={confirmingCancel}
        onClose={() => setConfirmingCancel(false)}
        onConfirm={cancelAppointment}
        title="Cancelar consulta?"
        message="O agendamento continuará visível na grade, em cinza e marcado como cancelado — sem ocupar o horário. Você pode reativá-lo depois."
        variant="danger"
        confirmLabel="Cancelar consulta"
        cancelLabel="Voltar"
      />
    </Modal>
  )
}
