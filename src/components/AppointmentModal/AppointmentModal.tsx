import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { SCHEDULE_TAGS } from '@/constants'
import { useCreateAgendaAppointment, useUpdateAgendaAppointment } from '@/hooks/useSchedule'
import { usePatients } from '@/hooks/usePatients'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useRooms } from '@/hooks/useRooms'
import { usePatientName } from '@/hooks/useDisplayNames'
import { toIsoDate } from '@/utils/date'
import { digitsOnly, initials } from '@/utils/text'
import { IconPhone, IconEmail, IconWhatsApp } from '@/components/icons'
import type { AgendaAppointment, AppointmentStatus } from '@/types/domain'
import styles from './AppointmentModal.module.scss'

// Situação da consulta editável direto no modal: agendada, compareceu (veio),
// faltou ou cancelada. Os valores casam com o enum appointment_status e com os
// rótulos do card (ClassCard): completed='Compareceu', no_show='Faltou'.
const SITUACOES: { value: AppointmentStatus; label: string }[] = [
  { value: 'scheduled', label: 'Agendada' },
  { value: 'completed', label: 'Compareceu' },
  { value: 'no_show',   label: 'Faltou' },
  { value: 'canceled',  label: 'Cancelada' },
]
const SITUACAO_TOAST: Record<AppointmentStatus, string> = {
  scheduled:  'Consulta reaberta como agendada.',
  confirmed:  'Consulta confirmada.',
  in_service: 'Consulta em atendimento.',
  completed:  'Presença registrada — o paciente compareceu.',
  no_show:    'Falta registrada.',
  canceled:   'Consulta cancelada.',
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
  /** Consulta em edição — sem ela, o modal cria um agendamento novo. */
  slot?: AgendaAppointment | null
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
  const { mutate: create, isPending: creating } = useCreateAgendaAppointment()
  const { mutate: update, isPending: saving } = useUpdateAgendaAppointment()

  const patientName = usePatientName()
  const [professionalId, setProfessionalId] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [dateIso, setDateIso] = useState(() => toIsoDate(new Date()))
  const [time, setTime] = useState('07:30')
  const [duration, setDuration] = useState('30')
  const [room, setRoom] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<AppointmentStatus>('scheduled')
  const [error, setError] = useState('')
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const canceled = status === 'canceled'

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
        setDateIso(slot.date)
        setTime(slot.startTime)
        setDuration(String(durationBetween(slot.startTime, slot.endTime)))
        setRoom(slot.room ?? '')
        setNotes(slot.notes ?? '')
        setStatus(slot.status)
      } else {
        setProfessionalId('')
        setPatientSearch('')
        setDateIso(toIsoDate(new Date()))
        setTime('07:30')
        setDuration('30')
        setRoom('')
        setNotes('')
        setStatus('scheduled')
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

  /** Monta o payload da consulta com um status específico. */
  function buildPayload(status: AgendaAppointment['status']) {
    // A atividade (e a cor do card) vem da especialidade do profissional —
    // na edição, mantém a atividade que a consulta já tinha.
    const specialty = (professionals ?? []).find(p => p.id === professionalId)?.specialty
    const activity = slot?.activity ?? specialty ?? 'Consulta'
    return {
      // Na mudança de situação (compareceu/faltou/cancelar) o paciente não muda:
      // cai no do slot se a busca não resolveu para um cadastro exato.
      patientId: (currentPatient?.id ?? slot?.patientId)!,
      activity,
      date: dateIso,
      startTime: time,
      endTime: addMinutes(time, Number(duration) || 30),
      professionalId,
      room: room || undefined,
      color: slot?.color ?? activityColor(activity),
      status,
      notes: notes.trim() || undefined,
      // O seletor de confirmação saiu do modal; preserva o que a consulta já
      // tinha (ou liga por padrão numa consulta nova).
      sendConfirmation: slot?.sendConfirmation ?? true,
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

    // Salvar mantém a situação atual (a situação muda pelos botões dedicados).
    const payload = buildPayload(status)
    const options = {
      onSuccess: () => {
        toast.success(slot ? 'Agendamento atualizado!' : 'Consulta agendada!')
        onClose()
      },
    }
    if (slot) update({ id: slot.id, payload }, options)
    else create(payload, options)
  }

  /**
   * Marca a SITUAÇÃO da consulta (compareceu / faltou / cancelar / reabrir) e
   * salva na hora. NÃO fecha o modal: o status fica destacado — é o "mostrar o
   * preenchimento depois de salvar". Salva junto os campos que o usuário editou.
   */
  function setAttendance(target: AppointmentStatus) {
    if (!slot) return
    if (!(currentPatient?.id ?? slot.patientId)) {
      setError('Informe o paciente antes de registrar a situação.')
      return
    }
    update(
      { id: slot.id, payload: buildPayload(target) },
      {
        onSuccess: () => {
          setStatus(target)
          setConfirmingCancel(false)
          toast.success(SITUACAO_TOAST[target])
        },
      },
    )
  }

  /** Clique num chip de situação: cancelar pede confirmação; o resto salva já. */
  function handleSituacao(target: AppointmentStatus) {
    if (target === status) return
    if (target === 'canceled') { setConfirmingCancel(true); return }
    setAttendance(target)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={slot ? 'Editar agendamento' : 'Nova consulta'}
      size="lg"
      footer={
        <>
          {currentPatient?.phone && (
            <Button
              variant="ghost"
              iconLeft={<IconPhone />}
              title={`Ligar para ${currentPatient.name}`}
              onClick={() => { window.location.href = `tel:+55${digitsOnly(currentPatient.phone)}` }}
            >
              Ligar
            </Button>
          )}
          {/* WhatsApp: abre a conversa com o paciente (usa o WhatsApp se houver,
              senão o telefone). Substitui o antigo seletor de confirmação. */}
          {currentPatient && (currentPatient.whatsapp || currentPatient.phone) && (
            <Button
              variant="ghost"
              iconLeft={<IconWhatsApp />}
              className={styles.whatsapp}
              title={`Abrir WhatsApp de ${currentPatient.name}`}
              onClick={() => window.open(
                `https://wa.me/55${digitsOnly(currentPatient.whatsapp ?? currentPatient.phone)}`,
                '_blank', 'noopener')}
            >
              WhatsApp
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
        {/* Cabeçalho do paciente: foto, nome, telefone e e-mail, com divisória. */}
        {currentPatient && (
          <>
            <div className={styles.paciente}>
              <span className={styles.pacienteFoto}>
                {currentPatient.photo
                  ? <img src={currentPatient.photo} alt="" className={styles.pacienteFotoImg} />
                  : initials(currentPatient.name)}
              </span>
              <div className={styles.pacienteInfo}>
                <span className={styles.pacienteNome}>{currentPatient.name}</span>
                <div className={styles.pacienteContatos}>
                  {currentPatient.phone && (
                    <span className={styles.pacienteContato}><IconPhone /> {currentPatient.phone}</span>
                  )}
                  {currentPatient.email && (
                    <span className={styles.pacienteContato}><IconEmail /> {currentPatient.email}</span>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.divisor} />
          </>
        )}

        {/* Situação: registra presença/falta/cancelamento direto no modal e
            mantém o status destacado depois de salvar (o card reflete na grade). */}
        {slot && (
          <div className={styles.situacao}>
            <span className={styles.situacaoRotulo}>Situação da consulta</span>
            <div className={styles.situacaoOpcoes} role="group" aria-label="Situação da consulta">
              {SITUACOES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  className={[
                    styles.situacaoChip,
                    status === s.value ? styles['situacaoChip--ativa'] : '',
                    status === s.value ? styles[`situacaoChip--${s.value}`] : '',
                  ].filter(Boolean).join(' ')}
                  aria-pressed={status === s.value}
                  disabled={saving}
                  onClick={() => handleSituacao(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {canceled && (
          <div className={styles.avisoCancelada} role="status">
            Esta consulta está <strong>cancelada</strong>. Os dados ficam disponíveis para consulta;
            selecione <strong>Agendada</strong> acima para trazê-la de volta à grade.
          </div>
        )}
        <Select
          label="Dentista"
          options={professionalOptions}
          placeholder="Selecione..."
          value={professionalId}
          onChange={e => { setProfessionalId(e.target.value); setError('') }}
        />

        {/* Busca de paciente — só numa consulta NOVA. Já agendada, o paciente
            está no cabeçalho acima e não se troca por este menu. */}
        {!slot && (
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
        )}

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

        {error && <p className={styles.erro}>{error}</p>}
      </div>

      <ConfirmDialog
        open={confirmingCancel}
        onClose={() => setConfirmingCancel(false)}
        onConfirm={() => setAttendance('canceled')}
        title="Cancelar consulta?"
        message="O agendamento continuará visível na grade, em cinza e marcado como cancelado — sem ocupar o horário. Você pode reabri-lo depois em “Agendada”."
        variant="danger"
        confirmLabel="Cancelar consulta"
        cancelLabel="Voltar"
      />
    </Modal>
  )
}
