import { useState } from 'react'
import { usePreviousSessionNote } from '@/hooks/usePatientClinicalNotes'
import { useProfessionalName } from '@/hooks/useDisplayNames'
import { SoapNoteView } from '@/components/SoapNoteView/SoapNoteView'
import { isoToBrDate } from '@/utils/date'
import { REPEATABLE_SOAP_SECTIONS, SOAP_LABELS, pickSoapSections } from '@/utils/soap'
import { IconChevronDown, IconCopy } from '@/components/icons'
import type { SoapNote } from '@/types/domain'
import styles from './LastSessionNote.module.scss'

interface LastSessionNoteProps {
  patientId: string
  /** Data (aaaa-mm-dd) da sessão ABERTA — o painel mostra a última ANTES dela. */
  beforeDateIso: string
  /** Horário ('HH:MM') da sessão aberta — desempata duas sessões no mesmo dia. */
  beforeStartTime: string
  /** Liga o botão "repetir": recebe SÓ Objetivo e Plano da sessão anterior.
   *  Sem ele, o painel é apenas de consulta. */
  onRepeat?: (note: SoapNote) => void
}

/**
 * Painel "Última sessão" — a evolução da sessão anterior deste paciente,
 * SOMENTE LEITURA, dentro do próprio modal de agendamento.
 *
 * Existe porque consultar o histórico obrigava a sair da tela, e sair da tela
 * apagava o que já tinha sido digitado. Vem recolhido para não competir com o
 * editor: o profissional escreve; abre a anterior só quando precisa conferir.
 *
 * Traz sessão INDIVIDUAL e de TURMA (ver patientClinicalNotesService) e de
 * qualquer profissional/serviço — quem atendeu e quando aparece no cabeçalho.
 */
export function LastSessionNote({ patientId, beforeDateIso, beforeStartTime, onRepeat }: LastSessionNoteProps) {
  const [expanded, setExpanded] = useState(false)
  const { data: note, isLoading } = usePreviousSessionNote(patientId, beforeDateIso, beforeStartTime)
  const professionalName = useProfessionalName()

  const meta = isLoading
    ? 'Carregando…'
    : note
      ? [isoToBrDate(note.date), note.startTime, note.activity].filter(Boolean).join(' · ')
      : 'Nenhuma sessão anterior com prontuário'

  // O que o botão de repetir traria: só as seções que a sessão anterior de
  // fato tem preenchidas (repetir um Plano vazio não é repetir nada).
  const repeatable = note ? pickSoapSections(note.note, REPEATABLE_SOAP_SECTIONS) : {}
  const repeatableLabels = REPEATABLE_SOAP_SECTIONS
    .filter(section => section in repeatable)
    .map(section => SOAP_LABELS[section])

  return (
    <section className={styles.root}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setExpanded(open => !open)}
        disabled={!note}
        aria-expanded={note ? expanded : undefined}
      >
        <span className={styles.info}>
          <span className={styles.label}>Última sessão</span>
          <span className={styles.meta}>{meta}</span>
          {note?.professionalId && (
            <span className={styles.meta}>com {professionalName(note.professionalId)}</span>
          )}
        </span>
        {note && (
          <span className={`${styles.chevron} ${expanded ? styles['chevron--open'] : ''}`}>
            <IconChevronDown />
          </span>
        )}
      </button>

      {note && expanded && (
        <div className={styles.body}>
          <SoapNoteView note={note.note} size="sm" />
        </div>
      )}

      {/*
        "Repetir": traz APENAS Objetivo e Plano (ver REPEATABLE_SOAP_SECTIONS).
        Fica no rodapé do painel, e não no cabeçalho, para o clique ser uma
        decisão de quem ABRIU e leu a evolução anterior — não um atalho cego.
      */}
      {onRepeat && repeatableLabels.length > 0 && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.repeatBtn}
            onClick={() => onRepeat(repeatable)}
            title={`Copia ${repeatableLabels.join(' e ')} da sessão anterior para esta`}
          >
            <IconCopy />
            Repetir {repeatableLabels.join(' e ')}
          </button>
        </div>
      )}
    </section>
  )
}
