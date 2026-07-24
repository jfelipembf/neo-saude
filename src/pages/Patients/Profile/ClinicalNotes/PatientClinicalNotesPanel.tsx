import { useState } from 'react'
import { Calendar } from '@/components/Calendar/Calendar'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { RichTextEditor } from '@/components/RichTextEditor/RichTextEditor'
import { IconDocument } from '@/components/icons'
import { usePatientNoteDates, usePatientNotesByDate } from '@/hooks/usePatientClinicalNotes'
import { useAppointmentAttachments } from '@/hooks/useDocuments'
import { isImageFile } from '@/utils/files'
import { isoToBrDate } from '@/utils/date'
import type { DailyClinicalNote } from '@/services/patientClinicalNotesService'
import styles from './PatientClinicalNotesPanel.module.scss'

interface PatientClinicalNotesPanelProps {
  patientId: string
}

// Read-only: só mostra o que já foi escrito, não recebe onChange.
function noop() {}

/** Um prontuário do dia — mesmo RichTextEditor da Agenda, travado (`disabled`),
 *  pra exibir exatamente como foi escrito (fonte/cor/alinhamento) com a mesma
 *  barra de ferramentas — não uma renderização à parte que pode divergir. */
function NoteCard({ note }: { note: DailyClinicalNote }) {
  const { data: attachments } = useAppointmentAttachments(note.appointmentId)
  return (
    <article className={styles.nota}>
      <header className={styles.notaCabecalho}>
        <span className={styles.notaHorario}>{note.startTime}</span>
        <span className={styles.notaAtividade}>{note.activity}</span>
      </header>

      <RichTextEditor value={note.html} onChange={noop} disabled />

      {attachments && attachments.length > 0 && (
        <div className={styles.notaAnexos}>
          {attachments.map(a => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.notaAnexo}
              title={a.name}
            >
              {isImageFile(a.type) && a.url
                ? <img src={a.url} alt={a.name} />
                : <IconDocument />}
            </a>
          ))}
        </div>
      )}
    </article>
  )
}

/** Aba "Prontuários" do perfil do paciente (fisioterapia): calendário com os
 *  dias que têm anotação de sessão + o conteúdo do dia selecionado ao lado. */
export function PatientClinicalNotesPanel({ patientId }: PatientClinicalNotesPanelProps) {
  const { data: noteDates, isLoading: loadingDates } = usePatientNoteDates(patientId)
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const selectedDate = selected ?? noteDates?.[0]
  const { data: notes, isLoading: loadingNotes } = usePatientNotesByDate(patientId, selectedDate)

  if (loadingDates) return <PageLoader />

  return (
    <div className={styles.painel}>
      <div className={styles.coluna}>
        <Calendar
          size="lg"
          markedDates={noteDates ?? []}
          markColor="var(--success-fg)"
          selected={selectedDate}
          onSelect={setSelected}
        />
      </div>

      <div className={styles.conteudo}>
        {!selectedDate ? (
          <EmptyState
            title="Nenhum prontuário ainda"
            description="Escreva o prontuário de uma sessão na Agenda — o dia aparece marcado aqui."
          />
        ) : loadingNotes ? (
          <PageLoader />
        ) : !notes || notes.length === 0 ? (
          <EmptyState
            title="Sem prontuário neste dia"
            description="Escolha um dia marcado em verde no calendário."
          />
        ) : (
          <>
            <h3 className={styles.dataTitulo}>{isoToBrDate(selectedDate)}</h3>
            {notes.map(note => <NoteCard key={note.appointmentId} note={note} />)}
          </>
        )}
      </div>
    </div>
  )
}
