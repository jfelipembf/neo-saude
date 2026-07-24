import { useEffect, useState } from 'react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { EntitlementPickerModal } from '@/components/EntitlementPickerModal/EntitlementPickerModal'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { RichTextEditor } from '@/components/RichTextEditor/RichTextEditor'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import type { SegmentOption } from '@/components/SegmentedControl/SegmentedControl'
import { useToast } from '@/components/Toast/useToast'
import { IconClock, IconDocument, IconPlus, IconRoom, IconSearch, IconUser, IconX } from '@/components/icons'
import { useClassGroupRoster, useEnrollPatient, useSaveAttendance, useSaveAttendanceNote } from '@/hooks/useClassGroupRoster'
import { usePatients } from '@/hooks/usePatients'
import { useProfessionalName } from '@/hooks/useDisplayNames'
import { useDebounce } from '@/hooks/useDebounce'
import { matchesSearch } from '@/utils/search'
import { initials } from '@/utils/text'
import { isoToBrDate } from '@/utils/date'
import type { ClassAttendanceStatus, ClassGroupOccurrence, ClassGroupRosterEntry, PatientServiceEntitlement } from '@/types/domain'
import styles from './ClassAttendanceModal.module.scss'

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

  const { mutate: enroll, isPending: enrolling } = useEnrollPatient()
  const { mutate: saveAttendance, isPending: saving } = useSaveAttendance(classGroupId, dateIso)
  const { mutate: saveNote, isPending: savingNote } = useSaveAttendanceNote(classGroupId, dateIso)

  const [search, setSearch] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [att, setAtt] = useState<Record<string, ClassAttendanceStatus>>({})
  const [just, setJust] = useState<Record<string, string>>({})
  const [notePatientId, setNotePatientId] = useState<string | null>(null)
  const [noteHtml, setNoteHtml] = useState('')
  // Paciente escolhido na busca — falta só decidir QUAL pacote/plano ativo
  // dele justifica a matrícula (ver EntitlementPickerModal).
  const [enrollCandidate, setEnrollCandidate] = useState<{ id: string; name: string } | null>(null)

  // Reabrir pra uma OUTRA ocorrência (turma ou data diferente) limpa a busca
  // e fecha o painel de prontuário — estado de uma turma não vaza pra outra.
  useEffect(() => {
    setSearch(''); setSuggestionsOpen(false); setNotePatientId(null); setNoteHtml(''); setEnrollCandidate(null)
  }, [occurrence?.id])

  // Semeia o rascunho de presença/justificativa a partir do servidor — roda de
  // novo (e converge) depois de qualquer salvamento, já que a query é invalidada.
  useEffect(() => {
    if (!roster) return
    const nextAtt: Record<string, ClassAttendanceStatus> = {}
    const nextJust: Record<string, string> = {}
    for (const r of roster) {
      nextAtt[r.patientId] = r.status
      if (r.justification) nextJust[r.patientId] = r.justification
    }
    setAtt(nextAtt)
    setJust(nextJust)
  }, [roster])

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
    setNoteHtml(entry.clinicalNoteHtml ?? '')
  }
  function closeNote() {
    setNotePatientId(null)
    setNoteHtml('')
  }

  const notePatient = (roster ?? []).find(r => r.patientId === notePatientId) ?? null
  const noteDirty = noteHtml !== (notePatient?.clinicalNoteHtml ?? '')

  function handleSaveNote() {
    if (!notePatientId) return
    saveNote({ patientId: notePatientId, html: noteHtml }, { onSuccess: () => toast.success('Prontuário salvo!') })
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
                            <SegmentedControl
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
                <RichTextEditor
                  value={noteHtml}
                  onChange={setNoteHtml}
                  placeholder="Descreva a evolução, condutas e observações desta sessão..."
                />
                <div className={styles.sideActions}>
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
    </>
  )
}
