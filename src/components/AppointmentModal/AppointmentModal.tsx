import { useRef, useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { RichTextEditor } from '@/components/RichTextEditor/RichTextEditor'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/Toast'
import { SCHEDULE_TAGS } from '@/constants'
import { useCreateScheduleAppointment, useUpdateScheduleAppointment, useUpdateClinicalNote } from '@/hooks/useSchedule'
import { useAppointmentAttachments, useDeleteDocument, useUploadDocument } from '@/hooks/useDocuments'
import { usePatients } from '@/hooks/usePatients'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useRooms } from '@/hooks/useRooms'
import { useAvailabilityTemplate } from '@/hooks/useProfessionalAvailability'
import { usePatientEntitlements } from '@/hooks/usePatientEntitlements'
import { usePatientName } from '@/hooks/useDisplayNames'
import { useSession } from '@/context/SessionProvider'
import { userMessage } from '@/lib/errors'
import { addMinutes, toIsoDate, localDate, parseBrDate } from '@/utils/date'
import { digitsOnly, initials } from '@/utils/text'
import { isImageFile } from '@/utils/files'
import { IconDocument, IconEmail, IconImage, IconPhone, IconTrash, IconWhatsApp } from '@/components/icons'
import type { ScheduledAppointment, AppointmentStatus } from '@/types/domain'
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
  slot?: ScheduledAppointment | null
  /** Pré-preenchimento do "+" na grade (só vale numa consulta NOVA, sem `slot`). */
  initial?: { professionalId?: string; dateIso?: string; time?: string }
}

/**
 * Modal de agendamento da grade: cria uma consulta ou edita a existente
 * (dentista, paciente com busca, data/horário/duração, etiqueta, confirmação
 * e retorno programado).
 */
export function AppointmentModal({ open, onClose, slot, initial }: AppointmentModalProps) {
  const toast = useToast()
  const { data: professionals } = useProfessionals()
  const { data: patients } = usePatients()
  const { data: rooms } = useRooms()
  const { mutate: create, isPending: creating } = useCreateScheduleAppointment()
  const { mutate: update, isPending: saving } = useUpdateScheduleAppointment()
  const { mutate: saveNote, isPending: savingNote } = useUpdateClinicalNote()

  const patientName = usePatientName()
  const [professionalId, setProfessionalId] = useState('')
  // Disponibilidade do profissional escolhido — barra salvar fora do horário
  // dele (ver isWithinAvailability abaixo).
  const { data: availability } = useAvailabilityTemplate(professionalId)
  const [patientSearch, setPatientSearch] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [dateIso, setDateIso] = useState(() => toIsoDate(new Date()))
  const [time, setTime] = useState('07:30')
  const [duration, setDuration] = useState('60')
  const [room, setRoom] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<AppointmentStatus>('scheduled')
  const [error, setError] = useState('')
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  // Pacote de sessões do qual esta consulta desconta — só entra na consulta
  // NOVA (imutável depois de criada, ver appointment.entitlement_id).
  const [entitlementId, setEntitlementId] = useState('')
  // Prontuário da SESSÃO (coluna direita, fisioterapia) — salvo à parte do
  // resto do agendamento (ver handleSaveNote).
  const [noteHtml, setNoteHtml] = useState('')
  // Renomeado pra não colidir com a `specialty` LOCAL de buildPayload (a do
  // profissional escolhido, não a da clínica).
  const { specialty: clinicSpecialty } = useSession()

  const canceled = status === 'canceled'

  // Abriu o modal (ou trocou a sessão): hidrata da sessão (edição) ou reseta
  // (criação). Padrão do React "resetar estado quando um prop muda" — ajuste
  // DURANTE O RENDER com guarda (não um efeito com setState): evita o flash de
  // estado velho de um efeito e o aviso react-hooks/set-state-in-effect.
  // A chave de uma consulta NOVA inclui o pré-preenchimento: sem isso, abrir o
  // "+" de duas células diferentes seguidas cairia na mesma chave 'new' e a
  // segunda ficaria com os dados (profissional/dia/hora) da primeira.
  const newKey = `new:${initial?.professionalId ?? ''}:${initial?.dateIso ?? ''}:${initial?.time ?? ''}`
  const hydrationKey = open ? (slot?.id ?? newKey) : null
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
        setEntitlementId('')
        setNoteHtml(slot.clinicalNoteHtml ?? '')
      } else {
        setProfessionalId(initial?.professionalId ?? '')
        setPatientSearch('')
        setDateIso(initial?.dateIso ?? toIsoDate(new Date()))
        setTime(initial?.time ?? '07:30')
        setDuration('60')
        setRoom('')
        setNotes('')
        setStatus('scheduled')
        setEntitlementId('')
        setNoteHtml('')
      }
    }
  }

  // Clínica com uma sala só: pré-preenche na consulta NOVA — `rooms` pode
  // ainda não ter carregado no reset acima, então isto roda à parte (mesmo
  // padrão de ajuste em tempo de render), uma vez por sessão do modal.
  const [roomAutoFilledFor, setRoomAutoFilledFor] = useState<string | null>(null)
  if (open && !slot && rooms?.length === 1 && roomAutoFilledFor !== hydrationKey && room === '') {
    setRoom(rooms[0].name)
    setRoomAutoFilledFor(hydrationKey)
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

  // Pacotes do paciente — só busca em fisioterapia. Numa consulta NOVA serve
  // pro seletor (só os com saldo); numa já existente, só pra mostrar o nome
  // do pacote vinculado (entitlementId é imutável depois de criada).
  const { data: entitlements } = usePatientEntitlements(
    clinicSpecialty === 'physiotherapy' ? ((slot?.patientId ?? currentPatient?.id) ?? '') : '',
  )
  const availableEntitlements = (entitlements ?? []).filter(e => e.remaining > 0)

  // Pré-seleciona o pacote numa consulta NOVA: com um só, carrega ele; com
  // mais de um, o mais antigo primeiro (purchasedAt). Refaz se o paciente
  // trocar (busca resolveu pra outro cadastro) — mesmo padrão de
  // roomAutoFilledFor acima, ajuste de estado durante o render.
  const [entitlementAutoFilledFor, setEntitlementAutoFilledFor] = useState<string | null>(null)
  const entitlementAutoFillKey = `${hydrationKey}:${currentPatient?.id ?? ''}`
  if (open && !slot && availableEntitlements.length > 0 && entitlementAutoFilledFor !== entitlementAutoFillKey) {
    const oldest = availableEntitlements.reduce((a, b) =>
      parseBrDate(b.purchasedAt) < parseBrDate(a.purchasedAt) ? b : a)
    setEntitlementId(oldest.id)
    setEntitlementAutoFilledFor(entitlementAutoFillKey)
  }

  /**
   * Data/horário escolhidos caem dentro da disponibilidade do profissional?
   * Profissional SEM grade configurada (nenhuma linha ainda) não bloqueia —
   * é o estado de quem ainda não usou a aba Disponibilidade do perfil dele.
   */
  function isWithinAvailability() {
    if (!availability || availability.length === 0) return true
    const weekday = localDate(dateIso).getDay()
    const hour = Number(time.split(':')[0])
    return availability.some(s => s.weekday === weekday && s.hour === hour)
  }

  /** Monta o payload da consulta com um status específico. */
  function buildPayload(status: ScheduledAppointment['status']) {
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
      endTime: addMinutes(time, Number(duration) || 60),
      professionalId,
      room: room || undefined,
      color: slot?.color ?? activityColor(activity),
      status,
      notes: notes.trim() || undefined,
      // O seletor de confirmação saiu do modal; preserva o que a consulta já
      // tinha (ou liga por padrão numa consulta nova).
      sendConfirmation: slot?.sendConfirmation ?? true,
      // Imutável: numa edição, sempre o que a consulta já tinha — o campo só
      // aparece (e só é lido) numa consulta NOVA.
      entitlementId: slot ? slot.entitlementId : (entitlementId || undefined),
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
    if (!isWithinAvailability()) {
      setError('Fora do horário de disponibilidade deste profissional.')
      return
    }

    // Salvar mantém a situação atual (a situação muda pelos botões dedicados).
    const payload = buildPayload(status)
    const options = {
      onSuccess: () => {
        toast.success(slot ? 'Agendamento atualizado!' : 'Consulta agendada!')
        onClose()
      },
      // A sala é trava real de banco (exclude using gist — ver
      // appointment_room_overlap_ex): duas consultas ativas não cabem na
      // mesma sala no mesmo horário. userMessage traduz o erro da constraint;
      // o modal fica aberto com o aviso em vez de fechar como se tivesse dado certo.
      onError: (e: unknown) => setError(userMessage(e, 'Não foi possível salvar a consulta. Tente novamente.')),
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

  // ── Prontuário da sessão (coluna direita, fisioterapia) ──────────────────
  const attachmentsInputRef = useRef<HTMLInputElement>(null)
  const { data: attachments } = useAppointmentAttachments(slot?.id)
  const { mutate: uploadAttachment, isPending: uploadingAttachment } = useUploadDocument()
  const { mutate: removeAttachment } = useDeleteDocument()
  const noteDirty = noteHtml !== (slot?.clinicalNoteHtml ?? '')

  function handleSaveNote() {
    if (!slot) return
    saveNote(
      { appointmentId: slot.id, html: noteHtml, patientId: slot.patientId },
      { onSuccess: () => toast.success('Prontuário da sessão salvo!') },
    )
  }

  function handleAttachFile(file: File) {
    if (!slot) return
    uploadAttachment(
      { patientId: slot.patientId, appointmentId: slot.id, name: file.name.replace(/\.[^.]+$/, ''), file },
      { onSuccess: () => toast.success('Anexo enviado!') },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      // Fisioterapia chama de "sessão", não "consulta" — mesmo vocabulário do
      // resto do módulo (pacote de SESSÕES, sessões restantes...).
      title={
        clinicSpecialty === 'physiotherapy'
          ? (slot ? 'Editar sessão' : 'Nova sessão')
          : (slot ? 'Editar agendamento' : 'Nova consulta')
      }
      size={clinicSpecialty === 'physiotherapy' ? 'xl' : 'lg'}
      footer={
        <>
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
      <div className={styles.layout}>
      <div className={styles.corpo}>
        {/* Cabeçalho do paciente: foto, nome, telefone e e-mail — cartão
            próprio, já separa visualmente do formulário abaixo. */}
        {currentPatient && (
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
          label={clinicSpecialty === 'physiotherapy' ? 'Fisioterapeuta' : 'Dentista'}
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

        {/* Pacote de sessões: só numa consulta NOVA, fisioterapia, e quando o
            paciente tem pelo menos um pacote com saldo. Some com a lista se o
            paciente escolhido não tiver nenhum — não força "sessão avulsa". O
            saldo (total/restantes) não vai no rótulo do Select — aparece no
            card assim que escolhe, ver abaixo. */}
        {!slot && availableEntitlements.length > 0 && (
          <Select
            label="Pacote"
            options={[
              { value: '', label: 'Sessão avulsa (sem pacote)' },
              ...availableEntitlements.map(e => ({ value: e.id, label: e.serviceName })),
            ]}
            value={entitlementId}
            onChange={e => setEntitlementId(e.target.value)}
          />
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
            placeholder="60"
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

      {/* Prontuário da SESSÃO: rico (fonte/cor/alinhamento) + anexos — só
          fisioterapia (ver clinicSpecialty acima) e só com a sessão já salva
          (o anexo/nota precisam de um appointment_id real). */}
      {clinicSpecialty === 'physiotherapy' && (
        <div className={styles.colDireita}>
          <span className={styles.prontuarioRotulo}>Prontuário da sessão</span>

          {!slot ? (
            <p className={styles.prontuarioVazio}>
              Salve a consulta para registrar o prontuário desta sessão.
            </p>
          ) : (
            <>
              <RichTextEditor
                value={noteHtml}
                onChange={setNoteHtml}
                placeholder="Descreva a evolução, condutas e observações desta sessão..."
              />
              <div className={styles.prontuarioAcoes}>
                <Button size="sm" loading={savingNote} disabled={!noteDirty} onClick={handleSaveNote}>
                  Salvar prontuário
                </Button>
              </div>

              <div className={styles.anexos}>
                <div className={styles.anexosCabecalho}>
                  <span className={styles.prontuarioRotulo}>Anexos</span>
                  <Button
                    variant="ghost" size="sm" iconLeft={<IconImage />}
                    loading={uploadingAttachment}
                    onClick={() => attachmentsInputRef.current?.click()}
                  >
                    Anexar imagem
                  </Button>
                  <input
                    ref={attachmentsInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className={styles.anexoInputArquivo}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleAttachFile(file)
                      e.target.value = ''
                    }}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>

                {attachments && attachments.length > 0 && (
                  <ul className={styles.anexosLista}>
                    {attachments.map(a => (
                      <li key={a.id} className={styles.anexo}>
                        <span className={styles.anexoPreview}>
                          {isImageFile(a.type) && a.url
                            ? <img src={a.url} alt="" />
                            : <IconDocument />}
                        </span>
                        <span className={styles.anexoNome}>{a.name}</span>
                        <Button
                          variant="ghost" size="sm" iconLeft={<IconTrash />}
                          title="Excluir anexo" aria-label={`Excluir ${a.name}`}
                          onClick={() => removeAttachment(a.id)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
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
