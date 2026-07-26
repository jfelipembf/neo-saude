import { useRef, useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Input } from '@/components/Input/Input'
import { LastSessionNote } from '@/components/LastSessionNote/LastSessionNote'
import { Modal } from '@/components/Modal/Modal'
import { EvolutionTemplatePicker } from '@/components/EvolutionTemplatePicker/EvolutionTemplatePicker'
import { Select } from '@/components/Select/Select'
import { SoapEditor } from '@/components/SoapEditor/SoapEditor'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/Toast'
import { SCHEDULE_TAGS } from '@/constants'
import {
  useCreateScheduleAppointment, useScheduleAppointments, useUpdateScheduleAppointment,
  useUpdateClinicalNote,
} from '@/hooks/useSchedule'
import { useAppointmentAttachments, useDeleteDocument, useUploadDocument } from '@/hooks/useDocuments'
import { usePatients } from '@/hooks/usePatients'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useRooms } from '@/hooks/useRooms'
import { useAvailabilityTemplate, useBlockedSlots, useAbsences } from '@/hooks/useProfessionalAvailability'
import { usePatientEntitlements } from '@/hooks/usePatientEntitlements'
import { usePatientName, useProfessionalName } from '@/hooks/useDisplayNames'
import { usePreviousSessionNote } from '@/hooks/usePatientClinicalNotes'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { useSession } from '@/context/SessionProvider'
import { userMessage } from '@/lib/errors'
import { esc } from '@/utils/printDocument'
import { addMinutes, toIsoDate, isoToBrDate, parseBrDate } from '@/utils/date'
import { digitsOnly, initials } from '@/utils/text'
import {
  isBlankSoap, isSameSoapNote, normalizeSoapNote, soapPlainText, soapToHtml,
} from '@/utils/soap'
import { isImageFile } from '@/utils/files'
import { isEntitlementActive } from '@/utils/entitlements'
import { checkSlot, UNAVAILABLE_LABEL } from '@/utils/availability'
import { PROFESSIONAL_SIGNATURE_LABEL } from '@/constants'
import { IconDocument, IconEmail, IconImage, IconPhone, IconPrint, IconTrash, IconWhatsApp } from '@/components/icons'
import type {
  ScheduledAppointment, AppointmentStatus, ClinicSpecialty, EvolutionTemplate, SoapNote, SoapSection,
} from '@/types/domain'
import styles from './AppointmentModal.module.scss'

/** CSS específico do prontuário — o resto (cabeçalho da clínica, tabela,
 *  assinatura) vem da base de impressão, igual PrescriptionsPanel/BudgetsPanel.
 *  Estrutura de assinatura (nome + conselho) segue o modelo oficial do
 *  CREFITO: linha, nome, "Fisioterapeuta", registro. */
const PRONTUARIO_PRINT_STYLES = `
  .nota { margin-top: 10px; font-size: 14px; line-height: 1.6; }
  .nota p { margin: 0 0 10px; }
  /* Rótulo da seção SOAP (soapToHtml gera um <p><strong>Plano:</strong></p>
     antes do conteúdo): cola no parágrafo que ele nomeia. */
  .nota p strong { display: inline-block; margin-top: 4px; }
  .assinatura { margin-top: 64px; text-align: center; }
  .assinatura .linha { display: inline-block; border-top: 1px solid #12211C; padding-top: 6px;
                       min-width: 280px; font-size: 16px; font-weight: 700; }
  .assinatura .cargo { display: block; margin-top: 2px; color: #667; font-size: 14px; font-weight: 400; }
`

/** Miolo do prontuário impresso — cabeçalho da clínica vem da base. `html` já
 *  é HTML sanitizado (mesmo conteúdo do RichTextEditor), não é texto solto:
 *  não passa por esc(). Campos e ordem (Paciente/Data → Evolução →
 *  assinatura com conselho) seguem o modelo oficial de prontuário
 *  fisioterapêutico do CREFITO (Resolução COFFITO 414/2012). */
function prontuarioBody(
  html: string,
  patientNm: string | undefined,
  dateBr: string,
  professionalNm: string,
  specialty: ClinicSpecialty | undefined,
  license: string | undefined,
) {
  const cargo = specialty ? (PROFESSIONAL_SIGNATURE_LABEL[specialty] ?? 'Profissional responsável') : 'Profissional responsável'
  return `
    ${patientNm ? `<p><strong>Paciente:</strong> ${esc(patientNm)}</p>` : ''}
    <p><strong>Data:</strong> ${esc(dateBr)}</p>
    <div class="nota">${html}</div>
    <div class="assinatura">
      <span class="linha">
        ${esc(professionalNm)}
        <span class="cargo">${esc(cargo)}${license ? ` — ${esc(license)}` : ''}</span>
      </span>
    </div>`
}

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
  const professionalName = useProfessionalName()
  const printDocument = usePrintDocument()
  const [professionalId, setProfessionalId] = useState('')
  // Disponibilidade do profissional escolhido — barra salvar fora do horário
  // dele (ver motivoIndisponivel abaixo). Bloqueio e ausência entram junto:
  // antes só o template era consultado, e por isso dava para agendar em cima
  // das férias de alguém.
  const { data: availability } = useAvailabilityTemplate(professionalId)
  const { data: absences } = useAbsences(professionalId)
  const [patientSearch, setPatientSearch] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [dateIso, setDateIso] = useState(() => toIsoDate(new Date()))
  // Bloqueios e consultas do DIA em foco — as duas peças que faltavam para a
  // checagem ser a mesma da grade da Agenda. Janela de um dia só: aqui não se
  // agenda a semana, e puxar mais seria carregar dado que ninguém lê.
  const { data: blockedSlots } = useBlockedSlots(professionalId, dateIso, dateIso)
  const { data: dayAppointments } = useScheduleAppointments(dateIso, dateIso)
  const [time, setTime] = useState('07:30')
  const [duration, setDuration] = useState('60')
  /** Encaixe declarado: tira a consulta da trava de agenda dupla do banco. */
  const [encaixe, setEncaixe] = useState(false)
  const [room, setRoom] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<AppointmentStatus>('scheduled')
  const [error, setError] = useState('')
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  // Pacote ou contrato ao qual esta consulta se pendura — só entra na consulta
  // NOVA (imutável depois de criada, ver appointment.entitlement_id).
  const [entitlementId, setEntitlementId] = useState('')
  // Prontuário SOAP da SESSÃO (coluna direita, fisioterapia) — salvo à parte
  // do resto do agendamento (ver handleSaveNote).
  const [clinicalNote, setClinicalNote] = useState<SoapNote>({})
  // O que entrou COPIADO no editor (modelo ou sessão anterior). Guardar o
  // conteúdo, e não um booleano, é o que faz a marca "copiado" sumir sozinha
  // quando o profissional edita a seção — sem estado a sincronizar.
  const [copiedFrom, setCopiedFrom] = useState<SoapNote>({})
  // Nome do modelo aplicado, mostrado no topo da coluna. É só um RÓTULO de
  // procedência — não vira vínculo: o texto já foi copiado e editar o modelo
  // depois não pode mexer no que foi registrado. Some quando o profissional
  // esvazia a nota, senão continuaria anunciando um modelo que não está mais lá.
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null)
  // Evolução idêntica à da sessão anterior: pergunta antes de salvar.
  const [confirmingCarbon, setConfirmingCarbon] = useState<null | 'note' | 'all'>(null)
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
        setClinicalNote(slot.clinicalNote ?? {})
        setCopiedFrom({})
        setAppliedTemplate(null)
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
        setClinicalNote({})
        setCopiedFrom({})
        setAppliedTemplate(null)
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

  // Pacotes e contratos do paciente — só busca em fisioterapia. Numa consulta
  // NOVA serve pro seletor (só os ativos); numa já existente, só pra mostrar o
  // nome do vinculado (entitlementId é imutável depois de criada).
  const { data: entitlements } = usePatientEntitlements(
    clinicSpecialty === 'physiotherapy' ? ((slot?.patientId ?? currentPatient?.id) ?? '') : '',
  )
  // Mesmo critério da matrícula em turma, e não `remaining > 0`: no pacote é
  // saldo E validade; no contrato é só a validade (ver utils/entitlements).
  const availableEntitlements = (entitlements ?? []).filter(isEntitlementActive)

  // Fisioterapia fatura por PACOTE ou CONTRATO: consulta nova exige um ativo. A
  // trava real é o trigger tr_debit_entitlement; aqui a tela só evita que o
  // usuário preencha tudo para levar um erro de banco no final.
  const requiresEntitlement = clinicSpecialty === 'physiotherapy' && !slot
  const missingEntitlement = requiresEntitlement && Boolean(currentPatient) && availableEntitlements.length === 0

  // Pré-seleciona o pacote/contrato numa consulta NOVA: com um só, carrega ele; com
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
  function motivoIndisponivel() {
    // Profissional SEM grade configurada não bloqueia: é o estado de quem ainda
    // não usou a aba Disponibilidade do perfil. Fora isso, vale a regra
    // COMPLETA (utils/availability), a mesma que a grade da Agenda aplica —
    // antes daqui só se olhava o template, então era possível agendar em cima
    // de bloqueio, de férias e de consulta já marcada.
    if (!availability || availability.length === 0) return null
    if (encaixe) return null   // encaixe é a decisão consciente de sobrepor

    return checkSlot(
      {
        template: availability,
        blocked: blockedSlots ?? [],
        absences: absences ?? [],
        // Na edição, a própria consulta não conta como conflito com ela mesma.
        appointments: (dayAppointments ?? []).filter(a => a.id !== slot?.id),
      },
      dateIso, time, Number(duration) || 60, toIsoDate(new Date()),
    )
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
      isOverbook: encaixe,
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
    const impedimento = motivoIndisponivel()
    if (impedimento) {
      // Diz QUAL é o problema (férias, bloqueio, horário ocupado…) em vez do
      // genérico "fora da disponibilidade", e aponta a saída quando ela existe.
      setError(
        impedimento === 'ocupado'
          ? `${UNAVAILABLE_LABEL[impedimento]}. Marque "Encaixe" para sobrepor.`
          : `Não dá para agendar: ${UNAVAILABLE_LABEL[impedimento]}.`,
      )
      return
    }
    if (requiresEntitlement && !entitlementId) {
      // Mesma frase que o trigger tg_debit_entitlement devolve — quem trombar na
      // trava do banco (outra aba, corrida) lê exatamente o mesmo texto.
      setError(availableEntitlements.length === 0
        ? 'Este paciente não tem pacote ou contrato ativo. Registre a venda no Ponto de Venda antes de agendar.'
        : 'Selecione o pacote ou contrato que vai custear esta sessão.')
      return
    }

    // Evolução idêntica à da sessão anterior: pergunta ANTES de gravar
    // qualquer coisa (perguntar depois de salvar a consulta deixaria metade
    // do modal salvo enquanto a pergunta está na tela).
    if (slot && noteDirty && isCarbonCopy) { setConfirmingCarbon('all'); return }
    submitAppointment()
  }

  /** Grava a consulta e, se houver evolução nova, o prontuário junto. */
  function submitAppointment() {
    // Salvar mantém a situação atual (a situação muda pelos botões dedicados).
    const payload = buildPayload(status)
    const options = {
      onSuccess: () => {
        // O prontuário tem botão próprio, mas quem aperta "Salvar"
        // espera que o modal INTEIRO seja salvo — fechar aqui com evolução
        // digitada e não salva era o mesmo texto perdido do confirmOnClose.
        if (slot && noteDirty) {
          saveNote(
            { appointmentId: slot.id, note: noteToSave, patientId: slot.patientId },
            {
              onSuccess: () => { toast.success('Agendamento e prontuário salvos!'); onClose() },
              // A consulta já foi salva; só o prontuário falhou. O modal fica
              // aberto com o texto na tela em vez de fechar e descartá-lo.
              onError: (e: unknown) => setError(userMessage(e, 'A consulta foi salva, mas o prontuário não. Tente salvar o prontuário novamente.')),
            },
          )
          return
        }
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

  // Mesma query (e mesma entrada de cache) do painel "Última sessão" logo
  // abaixo: aqui ela serve para comparar a evolução digitada com a anterior na
  // hora de salvar.
  const { data: previousSession } = usePreviousSessionNote(slot?.patientId, slot?.date, slot?.startTime)

  // Seção em branco não é seção: o editor devolve '<p></p>' quando o campo é
  // limpo, então uma sessão SEM prontuário nascia "suja" (salvar aceso e a
  // pergunta ao fechar) só por abrir o modal. normalizeSoapNote põe as duas
  // formas de vazio na mesma forma — `undefined` — antes de qualquer comparação.
  const savedNote = normalizeSoapNote(slot?.clinicalNote)
  const noteToSave = normalizeSoapNote(clinicalNote)
  const noteDirty = JSON.stringify(noteToSave ?? null) !== JSON.stringify(savedNote ?? null)

  // Marca "copiado" só enquanto a seção continuar IGUAL ao que foi colado
  // (modelo ou sessão anterior). Derivado, não estado: editar a seção apaga a
  // marca sozinho, sem nenhum listener para manter em dia.
  // Rótulo do modelo some sozinho quando a nota é esvaziada — DERIVADO, e não
  // um segundo estado a manter em dia (mesma escolha do copiedFrom acima).
  const shownTemplate = appliedTemplate && !isBlankSoap(clinicalNote) ? appliedTemplate : null

  const copiedSections = (Object.keys(copiedFrom) as SoapSection[])
    .filter(section => soapPlainText(clinicalNote[section]) === soapPlainText(copiedFrom[section]))

  /** Evolução que ficou igualzinha à da sessão anterior — carbono, o que um
   *  fiscal lê como atendimento não registrado. Não bloqueia: pergunta. */
  const isCarbonCopy = Boolean(
    previousSession && !isBlankSoap(noteToSave) && isSameSoapNote(noteToSave, previousSession.note),
  )

  function persistNote(after: () => void) {
    if (!slot) return
    saveNote({ appointmentId: slot.id, note: noteToSave, patientId: slot.patientId }, {
      onSuccess: after,
      onError: (e: unknown) => setError(userMessage(e, 'Não foi possível salvar o prontuário. Tente novamente.')),
    })
  }

  function handleSaveNote() {
    if (!slot) return
    if (isCarbonCopy) { setConfirmingCarbon('note'); return }
    persistNote(() => toast.success('Prontuário da sessão salvo!'))
  }

  /** Copia Objetivo e Plano da sessão anterior por cima do que houver neles.
   *  Subjetivo e Avaliação NÃO vêm de propósito (ver REPEATABLE_SOAP_SECTIONS). */
  function handleRepeatPrevious(previous: SoapNote) {
    setClinicalNote(current => ({ ...current, ...previous }))
    setCopiedFrom(previous)
  }

  function handleApplyTemplate(templateNote: SoapNote, template: EvolutionTemplate) {
    setClinicalNote(templateNote)
    setCopiedFrom(templateNote)
    setAppliedTemplate(template.name)
    toast.success('Modelo aplicado — edite as seções antes de salvar.')
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
      // Evolução digitada e ainda não salva: ESC, clique no fundo, "×" e o
      // "Fechar" do rodapé passam a perguntar antes de descartar.
      confirmOnClose={noteDirty}
      confirmOnCloseTitle="Sair sem salvar o prontuário?"
      confirmOnCloseMessage="O que você escreveu no prontuário desta sessão ainda não foi salvo. Fechar agora descarta a evolução."
      footer={requestClose => (
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
          <Button variant="ghost" onClick={requestClose} disabled={creating || saving}>Fechar</Button>
          <Button loading={creating || saving} onClick={handleSave}>
            {slot ? 'Salvar' : 'Agendar'}
          </Button>
        </>
      )}
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

        {/* Pacote ou contrato: obrigatório numa consulta NOVA de fisioterapia —
            não existe mais "sessão avulsa". Sem um direito ativo o paciente não
            ocupa a agenda; a venda entra antes, pelo Ponto de Venda. */}
        {requiresEntitlement && availableEntitlements.length > 0 && (
          <Select
            label="Pacote ou contrato"
            options={availableEntitlements.map(e => ({
              value: e.id,
              // Contrato não tem saldo (remaining é null): o que identifica o
              // direito dele é até quando vale, não quantas sessões sobraram.
              label: e.kind === 'recurring'
                ? `${e.serviceName} — contrato${e.expiresAt ? ` até ${e.expiresAt}` : ''}`
                : `${e.serviceName} — ${e.remaining} ${e.remaining === 1 ? 'sessão' : 'sessões'}`,
            }))}
            value={entitlementId}
            onChange={e => setEntitlementId(e.target.value)}
          />
        )}

        {/* Paciente escolhido e sem direito ativo: diz o motivo e o caminho, em
            vez de deixar salvar e devolver o erro do trigger. */}
        {missingEntitlement && (
          <p className={styles.semPacote}>
            <strong>{currentPatient?.name}</strong> não tem pacote ou contrato ativo.
            Registre a venda no Ponto de Venda (perfil do paciente → carrinho) antes de agendar.
          </p>
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

        {/* Encaixe: a declaração de que a sobreposição é proposital. O banco
            tem trava de agenda dupla do profissional (appointment_professional_
            overlap_ex) e ela IGNORA as linhas marcadas aqui — é o que mantém o
            encaixe possível sem deixar o choque acidental passar. */}
        <Toggle
          label="Encaixe (permite sobrepor outra consulta deste profissional)"
          checked={encaixe}
          onChange={v => { setEncaixe(v); setError('') }}
        />

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
          <div className={styles.prontuarioCabecalho}>
            <span className={styles.prontuarioRotulo}>Prontuário da sessão</span>
            {/* Procedência do texto: qual modelo foi aplicado. Fica no topo
                porque o editor tem 4 seções e o profissional rola — o rótulo
                junto do botão lá embaixo sairia de vista. */}
            {shownTemplate && (
              <span className={styles.modeloAplicado} title={`Modelo aplicado: ${shownTemplate}`}>
                <IconDocument />
                {shownTemplate}
              </span>
            )}
          </div>

          {!slot ? (
            <p className={styles.prontuarioVazio}>
              Salve a consulta para registrar o prontuário desta sessão.
            </p>
          ) : (
            <>
              {/* Evolução da sessão anterior, recolhida — conferir o que foi
                  feito da última vez sem sair do modal (sair perde o que está
                  digitado). Ancorada na data/hora SALVAS da sessão, não nos
                  campos em edição. */}
              <LastSessionNote
                patientId={slot.patientId}
                beforeDateIso={slot.date}
                beforeStartTime={slot.startTime}
                onRepeat={handleRepeatPrevious}
              />

              <SoapEditor value={clinicalNote} onChange={setClinicalNote} copiedSections={copiedSections} />

              {isCarbonCopy && (
                <p className={styles.prontuarioCarbono} role="status">
                  Esta evolução está <strong>idêntica à da sessão anterior</strong>. Ajuste o Subjetivo e a
                  Avaliação — é o que muda de uma sessão para a outra.
                </p>
              )}

              <div className={styles.prontuarioAcoes}>
                <EvolutionTemplatePicker current={clinicalNote} onApply={handleApplyTemplate} />
                {/* Ditado e "Aprimorar com IA" foram RETIRADOS a pedido do dono
                    ("por hora"). O componente <AiNoteActions>, os hooks
                    useAudioDictation/useNoteEnhancement e a edge function
                    transcribe-audio seguem no repositório INTACTOS — voltar é
                    reinserir estas linhas. A ponte soapToHtml/parseSoapHtml
                    continua existindo em utils/soap (com teste), que é o que
                    traduz o HTML corrido da IA para as quatro seções. */}
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<IconPrint />}
                  disabled={isBlankSoap(clinicalNote)}
                  title="Imprimir"
                  aria-label="Imprimir prontuário da sessão"
                  onClick={() => printDocument({
                    title: 'Prontuário da sessão',
                    subtitle: slot ? patientName(slot.patientId) : undefined,
                    body: prontuarioBody(
                      soapToHtml(clinicalNote),
                      slot && patientName(slot.patientId),
                      isoToBrDate(slot?.date) ?? '',
                      professionalName(professionalId),
                      clinicSpecialty,
                      professionals?.find(p => p.id === professionalId)?.license,
                    ),
                    styles: PRONTUARIO_PRINT_STYLES,
                  })}
                />
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

      {/*
        Evolução idêntica à da sessão anterior. NÃO bloqueia — há quadro que de
        fato repete, e travar empurraria o profissional a mudar uma palavra só
        para o sistema deixar salvar. Obriga o "sim": quem assina decide, e
        decide sabendo.
      */}
      <ConfirmDialog
        open={confirmingCarbon !== null}
        onClose={() => setConfirmingCarbon(null)}
        onConfirm={() => {
          const target = confirmingCarbon
          setConfirmingCarbon(null)
          if (target === 'all') submitAppointment()
          else persistNote(() => toast.success('Prontuário da sessão salvo!'))
        }}
        title="Evolução idêntica à da sessão anterior"
        message="O texto desta evolução é igual ao da sessão anterior deste paciente, palavra por palavra. Prontuário repetido é lido como atendimento não registrado numa fiscalização. Confirma que a sessão foi assim mesmo?"
        confirmLabel="Sim, salvar assim"
        cancelLabel="Voltar e editar"
      />

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
