import { useState } from 'react'
import { RichTextEditor } from '@/components/RichTextEditor/RichTextEditor'
import { IconChevronDown } from '@/components/icons'
import { SOAP_HINTS, SOAP_LABELS, SOAP_SECTIONS, soapPlainText } from '@/utils/soap'
import { isBlankHtml } from '@/utils/text'
import type { SoapNote, SoapSection } from '@/types/domain'
import styles from './SoapEditor.module.scss'

interface SoapEditorProps {
  value: SoapNote
  onChange: (note: SoapNote) => void
  disabled?: boolean
  /** Seções cujo conteúdo veio COPIADO (de um modelo ou da sessão anterior) e
   *  ainda não foi tocado — ganham marca visual. Quem calcula é a tela, que
   *  compara o texto atual com o que foi copiado; editar a seção faz a marca
   *  sumir sozinha, sem estado a sincronizar. */
  copiedSections?: readonly SoapSection[]
}

/**
 * Editor do prontuário SOAP: as quatro seções (Subjetivo, Objetivo, Avaliação,
 * Plano), cada uma com o RichTextEditor que já existe.
 *
 * SANFONA, uma seção aberta por vez — e essa é a decisão de desenho principal
 * aqui. Quatro editores abertos empilhariam QUATRO barras de ferramentas
 * (fonte, negrito, alinhamento, cor, emoji) numa tela em que o caso de uso é o
 * profissional EM PÉ, com o celular na mão, entre um paciente e outro: a
 * barra ocuparia mais espaço que o texto e o campo em foco ficaria fora da
 * tela. Recolhida, cada seção mostra o rótulo e uma PRÉVIA em texto puro — dá
 * para ver as quatro de relance e abrir só a que vai escrever.
 */
export function SoapEditor({ value, onChange, disabled, copiedSections = [] }: SoapEditorProps) {
  // Abre no Subjetivo: é por onde a consulta começa (o relato do paciente).
  // `null` = todas recolhidas, que é a visão de conferência das quatro.
  const [openSection, setOpenSection] = useState<SoapSection | null>('subjective')

  return (
    <div className={styles.root}>
      {SOAP_SECTIONS.map(section => {
        const isOpen = openSection === section
        const preview = soapPlainText(value[section])
        const filled = !isBlankHtml(value[section])
        const copied = copiedSections.includes(section)

        return (
          <section key={section} className={`${styles.section} ${isOpen ? styles['section--open'] : ''}`}>
            <button
              type="button"
              className={styles.header}
              aria-expanded={isOpen}
              onClick={() => setOpenSection(current => (current === section ? null : section))}
            >
              {/* S-O-A-P: a inicial é como o profissional lê a ficha, e cabe
                  no celular onde o rótulo inteiro competiria com a prévia. */}
              <span className={`${styles.initial} ${filled ? styles['initial--filled'] : ''}`}>
                {SOAP_LABELS[section][0]}
              </span>
              <span className={styles.info}>
                <span className={styles.label}>
                  {SOAP_LABELS[section]}
                  {copied && <span className={styles.copiedTag}>copiado</span>}
                </span>
                <span className={`${styles.preview} ${filled ? '' : styles['preview--empty']}`}>
                  {filled ? preview : 'Não preenchido'}
                </span>
              </span>
              <span className={`${styles.chevron} ${isOpen ? styles['chevron--open'] : ''}`}>
                <IconChevronDown />
              </span>
            </button>

            {isOpen && (
              <div className={`${styles.body} ${copied ? styles['body--copied'] : ''}`}>
                <RichTextEditor
                  value={value[section] ?? ''}
                  onChange={html => onChange({ ...value, [section]: html })}
                  placeholder={SOAP_HINTS[section]}
                  disabled={disabled}
                />
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
