import { useState } from 'react'
import { RichTextEditor } from '@/components/RichTextEditor/RichTextEditor'
import { IconChevronDown } from '@/components/icons'
import { NOTE_LABELS, SOAP_HINTS, SOAP_NOTE_FIELDS, SOAP_SECTIONS, soapPlainText } from '@/utils/soap'
import { isBlankHtml } from '@/utils/text'
import type { SoapNote, SoapNoteField } from '@/types/domain'
import styles from './SoapEditor.module.scss'

interface SoapEditorProps {
  value: SoapNote
  onChange: (note: SoapNote) => void
  disabled?: boolean
  /** Seções cujo conteúdo veio COPIADO (de um modelo ou da sessão anterior) e
   *  ainda não foi tocado — ganham marca visual. Quem calcula é a tela, que
   *  compara o texto atual com o que foi copiado; editar a seção faz a marca
   *  sumir sozinha, sem estado a sincronizar. */
  copiedSections?: readonly SoapNoteField[]
  /** Abre a evolução com o campo livre "Hoje" (o que foi realizado nesta
   *  sessão) ANTES das quatro seções, e já aberto. Ligado no atendimento de
   *  fisioterapia, onde é o registro que sempre existe; desligado na agenda e
   *  no cadastro de modelos, que padronizam só o SOAP. */
  withToday?: boolean
}

/**
 * Editor do prontuário SOAP: as quatro seções (Subjetivo, Objetivo, Avaliação,
 * Plano), cada uma com o RichTextEditor que já existe — mais o campo livre
 * "Hoje" na frente delas quando `withToday` está ligado.
 *
 * SANFONA, uma seção aberta por vez — e essa é a decisão de desenho principal
 * aqui. Quatro editores abertos empilhariam QUATRO barras de ferramentas
 * (fonte, negrito, alinhamento, cor, emoji) numa tela em que o caso de uso é o
 * profissional EM PÉ, com o celular na mão, entre um paciente e outro: a
 * barra ocuparia mais espaço que o texto e o campo em foco ficaria fora da
 * tela. Recolhida, cada seção mostra o rótulo e uma PRÉVIA em texto puro — dá
 * para ver as quatro de relance e abrir só a que vai escrever.
 */
export function SoapEditor({ value, onChange, disabled, copiedSections = [], withToday }: SoapEditorProps) {
  // Abre no primeiro campo: "Hoje" quando ele existe (é o que o fisioterapeuta
  // escreve entre um paciente e outro), senão o Subjetivo, por onde a consulta
  // começa (o relato do paciente). `null` = todas recolhidas, que é a visão de
  // conferência da evolução inteira.
  const campos = withToday ? SOAP_NOTE_FIELDS : SOAP_SECTIONS
  const [openSection, setOpenSection] = useState<SoapNoteField | null>(campos[0])

  return (
    <div className={styles.root}>
      {campos.map(section => {
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
                  no celular onde o rótulo inteiro competiria com a prévia.
                  ("Hoje" entra na mesma régua, com o H.) */}
              <span className={`${styles.initial} ${filled ? styles['initial--filled'] : ''}`}>
                {NOTE_LABELS[section][0]}
              </span>
              <span className={styles.info}>
                <span className={styles.label}>
                  {NOTE_LABELS[section]}
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
