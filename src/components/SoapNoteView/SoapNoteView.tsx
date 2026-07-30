import { SafeHtml } from '@/components/SafeHtml/SafeHtml'
import { NOTE_LABELS, filledNoteFields } from '@/utils/soap'
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
  // Todos os campos preenchidos, "Hoje" à frente das quatro seções — é a mesma
  // ordem em que a evolução foi escrita.
  const sections = filledNoteFields(note)

  if (sections.length === 0) return null

  return (
    <div className={`${styles.root} ${styles[`root--${size}`]}`}>
      {sections.map(section => (
        <section key={section} className={styles.section}>
          <h4 className={styles.label}>{NOTE_LABELS[section]}</h4>
          <SafeHtml html={note[section] as string} className={styles.body} />
        </section>
      ))}
    </div>
  )
}
