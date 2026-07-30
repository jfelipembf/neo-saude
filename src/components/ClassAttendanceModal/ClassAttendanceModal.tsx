import { useState } from 'react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Input } from '@/components/Input/Input'
import { EntitlementPickerModal } from '@/components/EntitlementPickerModal/EntitlementPickerModal'
import { EvolutionTemplatePicker } from '@/components/EvolutionTemplatePicker/EvolutionTemplatePicker'
import { LastSessionNote } from '@/components/LastSessionNote/LastSessionNote'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { SoapEditor } from '@/components/SoapEditor/SoapEditor'
import type { SegmentOption } from '@/components/SegmentedControl/SegmentedControl'
import { useToast } from '@/components/Toast/Toast'
import { IconClock, IconDocument, IconPlus, IconPrint, IconRoom, IconSearch, IconUser, IconX } from '@/components/icons'
import { useClassGroupRoster, useEnrollPatient, useSaveAttendance, useSaveAttendanceNote } from '@/hooks/useClassGroupRoster'
import { usePreviousSessionNote } from '@/hooks/usePatientClinicalNotes'
import { usePatients } from '@/hooks/usePatients'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useProfessionalName } from '@/hooks/useDisplayNames'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { useDebounce } from '@/hooks/useDebounce'
import { matchesSearch } from '@/utils/search'
import { initials } from '@/utils/text'
import { isoToBrDate } from '@/utils/date'
import { esc } from '@/utils/printDocument'
import {
  isBlankSoap, isSameSoapNote, normalizeSoapNote, soapPlainText, soapToHtml,
} from '@/utils/soap'
import { PROFESSIONAL_SIGNATURE_LABEL } from '@/constants'
import type {
  ClassAttendanceStatus, ClassGroupOccurrence, ClassGroupRosterEntry, EvolutionTemplate,
  PatientServiceEntitlement, SoapNote, SoapSection,
} from '@/types/domain'
import styles from './ClassAttendanceModal.module.scss'

/** CSS específico do prontuário — o resto (cabeçalho da clínica, assinatura)
 *  vem da base de impressão, mesmo padrão de AppointmentModal/PrescriptionsPanel.
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

/** Miolo do prontuário impresso — `html` já é HTML sanitizado (mesmo
 *  conteúdo do RichTextEditor), não é texto solto: não passa por esc(). Campos
 *  e ordem seguem o modelo oficial de prontuário fisioterapêutico do CREFITO
 *  (Resolução COFFITO 414/2012) — turma só existe em fisioterapia, então o
 *  cargo é sempre "Fisioterapeuta". */
function prontuarioBody(html: string, patientNm: string, dateBr: string, professionalNm: string, license: string | undefined) {
  const cargo = PROFESSIONAL_SIGNATURE_LABEL.physiotherapy
  return `
    <p><strong>Paciente:</strong> ${esc(patientNm)}</p>
    <p><strong>Data:</strong> ${esc(dateBr)}</p>
    <div class="nota">${html}</div>
    <div class="assinatura">
      <span class="linha">
        ${esc(professionalNm)}
        <span class="cargo">${esc(cargo)}${license ? ` — ${esc(license)}` : ''}</span>
      </span>
    </div>`
}

const PRESENCE_OPTIONS: SegmentOption<ClassAttendanceStatus>[] = [
  { value: 'present', label: 'Presente' },
  { value: 'absent', label: 'Falta' },
]

interface ClassAttendanceModalProps {
  /** null = modal fechado. */
  occurrence: ClassGroupOccurrence | null
  onClose: () => void
}

/**
 * Chamada de uma ocorrência de turma: resumo no topo, busca para matricular
 * paciente, lista com presença/falta (+ justificativa) e o prontuário da
 * sessão de cada aluno num painel lateral (mesmo padrão do prontuário da
 * consulta em AppointmentModal, só que por paciente — a turma tem vários).
 * Só é aberto para clínicas de fisioterapia (ver ScheduleBoard).
 */
export function ClassAttendanceModal({ occurrence, onClose }: ClassAttendanceModalProps) {
  const toast = useToast()
  const classGroupId = occurrence?.classGroupId ?? ''
  const dateIso = occurrence?.date ?? ''

  const { data: roster, isLoading } = useClassGroupRoster(classGroupId, dateIso)
  const { data: patients = [] } = usePatients()
  const professionalName = useProfessionalName()
  const { data: professionals } = useProfessionals()
  const printDocument = usePrintDocument()

  const { mutate: enroll, isPending: enrolling } = useEnrollPatient()
  const { mutate: saveAttendance, isPending: saving } = useSaveAttendance(classGroupId, dateIso)
  const { mutate: saveNote, isPending: savingNote } = useSaveAttendanceNote(classGroupId, dateIso)

  const [search, setSearch] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [att, setAtt] = useState<Record<string, ClassAttendanceStatus>>({})
  const [just, setJust] = useState<Record<string, string>>({})
  const [notePatientId, setNotePatientId] = useState<string | null>(null)
  const [note, setNote] = useState<SoapNote>({})
  // O que entrou COPIADO no editor (modelo ou sessão anterior) — guardar o
  // conteúdo, e não um booleano, faz a marca "copiado" sumir sozinha quando o
  // profissional edita a seção.
  const [copiedFrom, setCopiedFrom] = useState<SoapNote>({})
  // Nome do modelo aplicado — rótulo de procedência no topo do painel. Ver a
  // mesma escolha em AppointmentModal.
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null)
  const [confirmingCarbon, setConfirmingCarbon] = useState(false)
  // Paciente escolhido na busca — falta só decidir QUAL pacote/plano ativo
  // dele justifica a matrícula (ver EntitlementPickerModal).
  const [enrollCandidate, setEnrollCandidate] = useState<{ id: string; name: string } | null>(null)

  // Reabrir pra uma OUTRA ocorrência (turma ou data diferente) limpa a busca
  // e fecha o painel de prontuário — estado de uma turma não vaza pra outra.
  //
  // Ajuste DURANTE a renderização, e não em efeito: em efeito, a tela chega a
  // pintar uma vez com o prontuário da turma anterior antes de limpar.
  const [ocorrenciaAnterior, setOcorrenciaAnterior] = useState(occurrence?.id)
  if (occurrence?.id !== ocorrenciaAnterior) {
    setOcorrenciaAnterior(occurrence?.id)
    setSearch(''); setSuggestionsOpen(false); setNotePatientId(null)
    setNote({}); setCopiedFrom({}); setAppliedTemplate(null); setEnrollCandidate(null)
  }

  // Semeia o rascunho de presença/justificativa a partir do servidor — reconverge
  // depois de qualquer salvamento, já que a query é invalidada e devolve outra
  // referência de `roster`.
  const [rosterAnterior, setRosterAnterior] = useState(roster)
  if (roster && roster !== rosterAnterior) {
    setRosterAnterior(roster)
    const nextAtt: Record<string, ClassAttendanceStatus> = {}
    const nextJust: Record<string, string> = {}
    for (const r of roster) {
      nextAtt[r.patientId] = r.status
      if (r.justification) nextJust[r.patientId] = r.justification
    }
    setAtt(nextAtt)
    setJust(nextJust)
  }

  const term = useDebounce(search)
  const enrolledIds = new Set((roster ?? []).map(r => r.patientId))
  const candidates = term.trim()
    ? patients.filter(p => !enrolledIds.has(p.id) && matchesSearch(p.name, term)).slice(0, 6)
    : []

  function handlePickCandidate(patientId: string, patientName: string) {
    setEnrollCandidate({ id: patientId, name: patientName })
    setSuggestionsOpen(false)
  }

  function handlePickEntitlement(entitlement: PatientServiceEntitlement) {
    if (!enrollCandidate) return
    enroll(
      { classGroupId, dateIso, patientId: enrollCandidate.id, entitlementId: entitlement.id },
      {
        onSuccess: () => { toast.success('Paciente matriculado na turma!'); setSearch(''); setEnrollCandidate(null) },
        onError: err => toast.error(err instanceof Error ? err.message : 'Não foi possível matricular.'),
      },
    )
  }

  function handleSaveAttendance() {
    if (!roster) return
    saveAttendance(
      roster.map(r => ({
        patientId: r.patientId,
        status: att[r.patientId] ?? 'present',
        justification: att[r.patientId] === 'absent' ? just[r.patientId] : undefined,
      })),
      { onSuccess: () => { toast.success('Presença registrada!'); onClose() } },
    )
  }

  function openNote(entry: ClassGroupRosterEntry) {
    setNotePatientId(entry.patientId)
    setNote(entry.clinicalNote ?? {})
    setCopiedFrom({})
    setAppliedTemplate(null)
  }
  function closeNote() {
    setNotePatientId(null)
    setNote({})
    setCopiedFrom({})
    setAppliedTemplate(null)
  }

  const notePatient = (roster ?? []).find(r => r.patientId === notePatientId) ?? null

  // Mesma query (e mesma entrada de cache) do painel "Última sessão" ao lado:
  // aqui serve para comparar a evolução digitada com a anterior ao salvar.
  const { data: previousSession } = usePreviousSessionNote(
    notePatientId ?? undefined, dateIso || undefined, occurrence?.startTime,
  )

  // Seção em branco não é seção: normalizeSoapNote põe '<p></p>', '' e chave
  // ausente na mesma forma antes de qualquer comparação (é também o que o
  // CHECK do banco exige na gravação).
  // Some sozinho quando a nota é esvaziada — derivado, não um 2º estado.
  const shownTemplate = appliedTemplate && !isBlankSoap(note) ? appliedTemplate : null

  const savedNote = normalizeSoapNote(notePatient?.clinicalNote)
  const noteToSave = normalizeSoapNote(note)
  const noteDirty = JSON.stringify(noteToSave ?? null) !== JSON.stringify(savedNote ?? null)

  // Derivado, não estado: editar a seção apaga a marca "copiado" sozinho.
  const copiedSections = (Object.keys(copiedFrom) as SoapSection[])
    .filter(section => soapPlainText(note[section]) === soapPlainText(copiedFrom[section]))

  const isCarbonCopy = Boolean(
    previousSession && !isBlankSoap(noteToSave) && isSameSoapNote(noteToSave, previousSession.note),
  )

  function persistNote() {
    if (!notePatientId) return
    saveNote({ patientId: notePatientId, note: noteToSave }, { onSuccess: () => toast.success('Prontuário salvo!') })
  }

  function handleSaveNote() {
    if (!notePatientId) return
    if (isCarbonCopy) { setConfirmingCarbon(true); return }
    persistNote()
  }

  /** Copia Objetivo e Plano da aula anterior deste aluno (ver
   *  REPEATABLE_SOAP_SECTIONS: S e A são o que muda de sessão para sessão). */
  function handleRepeatPrevious(previous: SoapNote) {
    setNote(current => ({ ...current, ...previous }))
    setCopiedFrom(previous)
  }

  function handleApplyTemplate(templateNote: SoapNote, template: EvolutionTemplate) {
    setNote(templateNote)
    setCopiedFrom(templateNote)
    setAppliedTemplate(template.name)
    toast.success('Modelo aplicado — edite as seções antes de salvar.')
  }

  const total = roster?.length ?? 0
  const present = roster?.filter(r => (att[r.patientId] ?? 'present') === 'present').length ?? 0
  const absent = total - present

  return (
    <>
      <Modal
        open={occurrence !== null}
        onClose={onClose}
        title="Controle de Presença"
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button loading={saving} disabled={!roster || total === 0} onClick={handleSaveAttendance}>
              Salvar Presença
            </Button>
          </>
        }
      >
        {occurrence && (
          <div className={styles.layout}>
            <div className={styles.main}>
              <div className={styles.summary}>
                <span className={styles.title}>{occurrence.name}</span>
                <div className={styles.sumInfo}>
                  <span className={styles.sumItem}>
                    <span className={styles.sumIcon}><IconClock /></span>
                    {isoToBrDate(occurrence.date)} · {occurrence.startTime}–{occurrence.endTime}
                  </span>
                  {occurrence.professionalId && (
                    <span className={styles.sumItem}>
                      <span className={styles.sumIcon}><IconUser /></span>
                      {professionalName(occurrence.professionalId)}
                    </span>
                  )}
                  {occurrence.roomName && (
                    <span className={styles.sumItem}>
                      <span className={styles.sumIcon}><IconRoom /></span>
                      {occurrence.roomName}
                    </span>
                  )}
                </div>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Presentes</span>
                    <span className={`${styles.statValue} ${styles.statGreen}`}>{present}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Ausentes</span>
                    <span className={`${styles.statValue} ${styles.statRed}`}>{absent}</span>
                  </div>
                  <div className={`${styles.stat} ${styles.statTotal}`}>
                    <span className={styles.statLabel}>Matriculados</span>
                    <span className={styles.statValue}>{total} / {occurrence.maxCapacity}</span>
                  </div>
                </div>
              </div>

              <div className={styles.searchWrap}>
                <Input
                  size="sm"
                  iconLeft={<IconSearch />}
                  placeholder="Buscar paciente para matricular na turma..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSuggestionsOpen(true) }}
                  onFocus={() => setSuggestionsOpen(true)}
                  autoComplete="off"
                />
                {suggestionsOpen && candidates.length > 0 && (
                  <ul className={styles.suggestions}>
                    {candidates.map(p => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={styles.suggestion}
                          disabled={enrolling}
                          onClick={() => handlePickCandidate(p.id, p.name)}
                        >
                          <span className={styles.suggestionAvatar}>
                            {p.photo ? <img src={p.photo} alt="" /> : initials(p.name)}
                          </span>
                          <span className={styles.suggestionName}>{p.name}</span>
                          <span className={styles.suggestionAdd}><IconPlus /> Matricular</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {isLoading ? (
                <PageLoader />
              ) : total === 0 ? (
                <p className={styles.vazio}>Nenhum paciente matriculado nesta turma ainda — busque acima para adicionar.</p>
              ) : (
                <ul className={styles.list}>
                  {roster!.map(entry => {
                    const status = att[entry.patientId] ?? 'present'
                    return (
                      <li key={entry.patientId} className={styles.row}>
                        <div className={styles.rowTop}>
                          <div className={styles.rowName}>
                            <span className={styles.rowAvatar}>
                              {entry.patientPhoto ? <img src={entry.patientPhoto} alt="" /> : initials(entry.patientName)}
                            </span>
                            <span className={styles.rowNameCol}>
                              <span className={styles.rowNameText}>{entry.patientName}</span>
                              {entry.entitlementServiceName && (
                                <span className={styles.rowSub}>
                                  {entry.entitlementServiceName}
                                  {entry.entitlementExpiresAt ? ` · até ${entry.entitlementExpiresAt}` : ''}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className={styles.rowControls}>
                            {/* size="md" explícito nos dois — o Button já era,
                                a SegmentedControl caía no md por acaso. */}
                            <SegmentedControl
                              size="md"
                              options={PRESENCE_OPTIONS}
                              value={status}
                              onChange={v => setAtt(a => ({ ...a, [entry.patientId]: v }))}
                            />
                            <Button
                              variant="outline"
                              size="md"
                              iconLeft={<IconDocument />}
                              title="Prontuário da sessão"
                              aria-label={`Prontuário de ${entry.patientName}`}
                              onClick={() => openNote(entry)}
                            >
                              Prontuário
                            </Button>
                          </div>
                        </div>
                        {status === 'absent' && (
                          <Input
                            size="sm"
                            className={styles.rowJust}
                            placeholder="Motivo da falta (opcional)"
                            value={just[entry.patientId] ?? ''}
                            onChange={e => setJust(j => ({ ...j, [entry.patientId]: e.target.value }))}
                          />
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {notePatient && (
              <aside className={styles.side}>
                <div className={styles.sideHeader}>
                  <span className={styles.sideTitle}>Prontuário — {notePatient.patientName}</span>
                  <button type="button" className={styles.sideClose} aria-label="Fechar prontuário" onClick={closeNote}>
                    <IconX />
                  </button>
                </div>

                {/* Procedência do texto. Em linha própria porque o título ao
                    lado já carrega o nome do aluno e o botão de fechar. */}
                {shownTemplate && (
                  <span className={styles.modeloAplicado} title={`Modelo aplicado: ${shownTemplate}`}>
                    <IconDocument />
                    {shownTemplate}
                  </span>
                )}
                {/* Evolução da aula anterior deste aluno, recolhida — mesma
                    fonte dupla (consulta e turma) do painel da Agenda. */}
                <LastSessionNote
                  patientId={notePatient.patientId}
                  beforeDateIso={dateIso}
                  beforeStartTime={occurrence.startTime}
                  onRepeat={handleRepeatPrevious}
                />

                <SoapEditor value={note} onChange={setNote} copiedSections={copiedSections} />

                {isCarbonCopy && (
                  <p className={styles.carbono} role="status">
                    Esta evolução está <strong>idêntica à da sessão anterior</strong>. Ajuste o Subjetivo e a
                    Avaliação — é o que muda de uma sessão para a outra.
                  </p>
                )}

                <div className={styles.sideActions}>
                  <EvolutionTemplatePicker current={note} onApply={handleApplyTemplate} />
                  {/* Ditado e "Aprimorar com IA" retirados a pedido do dono
                      ("por hora") — ver a mesma nota em AppointmentModal. */}
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<IconPrint />}
                    disabled={isBlankSoap(note)}
                    title="Imprimir"
                    aria-label="Imprimir prontuário da sessão"
                    onClick={() => printDocument({
                      title: 'Prontuário da sessão',
                      subtitle: notePatient.patientName,
                      body: prontuarioBody(
                        soapToHtml(note),
                        notePatient.patientName,
                        isoToBrDate(dateIso) ?? '',
                        professionalName(occurrence?.professionalId),
                        professionals?.find(p => p.id === occurrence?.professionalId)?.license,
                      ),
                      styles: PRONTUARIO_PRINT_STYLES,
                    })}
                  />
                  <Button size="sm" loading={savingNote} disabled={!noteDirty} onClick={handleSaveNote}>
                    Salvar prontuário
                  </Button>
                </div>
              </aside>
            )}
          </div>
        )}
      </Modal>

      <EntitlementPickerModal
        open={enrollCandidate !== null}
        patientId={enrollCandidate?.id ?? ''}
        onClose={() => setEnrollCandidate(null)}
        onPick={handlePickEntitlement}
      />

      {/* Evolução idêntica à da sessão anterior: obriga o "sim", não bloqueia
          (mesma regra do AppointmentModal — há quadro que de fato repete). */}
      <ConfirmDialog
        open={confirmingCarbon}
        onClose={() => setConfirmingCarbon(false)}
        onConfirm={() => { setConfirmingCarbon(false); persistNote() }}
        title="Evolução idêntica à da sessão anterior"
        message="O texto desta evolução é igual ao da sessão anterior deste paciente, palavra por palavra. Prontuário repetido é lido como atendimento não registrado numa fiscalização. Confirma que a sessão foi assim mesmo?"
        confirmLabel="Sim, salvar assim"
        cancelLabel="Voltar e editar"
      />
    </>
  )
}
