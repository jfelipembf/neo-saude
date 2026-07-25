import { useState } from 'react'
import { Calendar } from '@/components/Calendar/Calendar'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { SoapNoteView } from '@/components/SoapNoteView/SoapNoteView'
import { IconDocument } from '@/components/icons'
import { usePatientNoteDates, usePatientNotesByDate } from '@/hooks/usePatientClinicalNotes'
import { useAppointmentAttachments } from '@/hooks/useDocuments'
import { isImageFile } from '@/utils/files'
import { isoToBrDate } from '@/utils/date'
import type { SessionClinicalNote } from '@/services/patientClinicalNotesService'
import styles from './PatientClinicalNotesPanel.module.scss'

interface PatientClinicalNotesPanelProps {
  patientId: string
}

/** Um prontuário do dia: as seções SOAP preenchidas, em leitura.
 *
 *  Antes isto era o RichTextEditor da Agenda travado (`disabled`), o que fazia
 *  sentido com UM campo de HTML solto. Com quatro seções seriam quatro barras
 *  de ferramentas desabilitadas só para exibir texto — e as seções vazias
 *  virariam quatro títulos com nada embaixo. Leitura é SoapNoteView. */
function NoteCard({ note }: { note: SessionClinicalNote }) {
  const { data: attachments } = useAppointmentAttachments(note.appointmentId)
  return (
    <article className={styles.nota}>
      <header className={styles.notaCabecalho}>
        <span className={styles.notaHorario}>{note.startTime}</span>
        <span className={styles.notaAtividade}>{note.activity}</span>
      </header>

      <SoapNoteView note={note.note} />

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
            {/* A chave é a da LINHA de origem: uma sessão de turma não tem
                appointment_id (ver SessionClinicalNote). */}
            {notes.map(note => <NoteCard key={note.id} note={note} />)}
          </>
        )}
      </div>
    </div>
  )
}
