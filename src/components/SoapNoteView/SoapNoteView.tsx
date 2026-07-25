import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { SOAP_LABELS, filledSoapSections } from '@/utils/soap'
import type { SoapNote } from '@/types/domain'
import styles from './SoapNoteView.module.scss'

interface SoapNoteViewProps {
  note: SoapNote
  /** Compacta rótulo e texto (painel "Última sessão", dentro de outro modal). */
  size?: 'md' | 'sm'
}

/**
 * Prontuário SOAP em LEITURA — as seções preenchidas, cada uma com o rótulo em
 * português e o HTML como foi escrito.
 *
 * Não reaproveita o RichTextEditor travado (era o que a aba Prontuários fazia
 * com a coluna de HTML solto): com quatro seções seriam quatro barras de
 * ferramentas desabilitadas só para exibir texto. Aqui é leitura, então é
 * marcação de leitura — e as seções VAZIAS somem em vez de virar quatro
 * títulos com nada embaixo.
 */
export function SoapNoteView({ note, size = 'md' }: SoapNoteViewProps) {
  const sections = filledSoapSections(note)

  // Mesmo saneador que o editor usou ao gravar (DOMPurify), agora na leitura:
  // o prontuário é texto rico salvo pelo editor, não texto solto.
  const safeHtml = useMemo(
    () => new Map(sections.map(section => [section, DOMPurify.sanitize(note[section] as string)])),
    [note, sections],
  )

  if (sections.length === 0) return null

  return (
    <div className={`${styles.root} ${styles[`root--${size}`]}`}>
      {sections.map(section => (
        <section key={section} className={styles.section}>
          <h4 className={styles.label}>{SOAP_LABELS[section]}</h4>
          {/* dangerouslySetInnerHTML com HTML JÁ SANEADO (DOMPurify, acima). */}
          <div className={styles.body} dangerouslySetInnerHTML={{ __html: safeHtml.get(section) as string }} />
        </section>
      ))}
    </div>
  )
}
