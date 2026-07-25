import { useState } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { useEvolutionTemplates } from '@/hooks/useEvolutionTemplates'
import { IconChevronDown, IconDocument } from '@/components/icons'
import { isBlankSoap } from '@/utils/soap'
import type { EvolutionTemplate, SoapNote } from '@/types/domain'
import styles from './EvolutionTemplatePicker.module.scss'

interface EvolutionTemplatePickerProps {
  /** Nota que está no editor agora — decide se aplicar sobrescreve algo. */
  current: SoapNote
  /** Chamado com a nota do modelo escolhido (cópia, nunca referência: editar o
   *  modelo em 2027 não pode reescrever o que foi registrado em 2026). */
  onApply: (note: SoapNote, template: EvolutionTemplate) => void
  disabled?: boolean
}

/**
 * "Usar modelo": um clique preenche as quatro seções do prontuário com um
 * modelo do catálogo da clínica (Administrativo → Modelos de evolução).
 *
 * Existe porque fisioterapeuta atende de 30 em 30 minutos — digitar os mesmos
 * cabeçalhos de "Avaliação inicial" a cada primeira consulta é o atrito que
 * faz a evolução não ser escrita.
 *
 * Aplicar SUBSTITUI a nota inteira. Com o editor já preenchido isso apagaria
 * texto clínico, então nesse caso passa por ConfirmDialog — o modelo é atalho
 * de quem está começando a escrever, não borracha.
 */
export function EvolutionTemplatePicker({ current, onApply, disabled }: EvolutionTemplatePickerProps) {
  const { data: templates } = useEvolutionTemplates()
  const [open, setOpen] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<EvolutionTemplate | null>(null)
  const menuRef = useOutsideClick<HTMLDivElement>(() => setOpen(false), open)

  // Inativo some do menu sem sair do catálogo — é como a clínica "remove" um
  // modelo de referência, que a policy de delete proíbe apagar.
  const active = (templates ?? []).filter(template => template.status === 'active')

  function handlePick(template: EvolutionTemplate) {
    setOpen(false)
    if (isBlankSoap(current)) {
      onApply({ ...template.note }, template)
      return
    }
    setPendingTemplate(template)
  }

  function confirmOverwrite() {
    if (pendingTemplate) onApply({ ...pendingTemplate.note }, pendingTemplate)
    setPendingTemplate(null)
  }

  return (
    <>
      <div className={styles.root} ref={menuRef}>
        <button
          type="button"
          className={styles.trigger}
          disabled={disabled || active.length === 0}
          title={active.length === 0 ? 'Nenhum modelo ativo — cadastre em Administrativo → Modelos de evolução' : 'Aplicar um modelo de evolução'}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
        >
          <IconDocument />
          Usar modelo
          <span className={`${styles.chevron} ${open ? styles['chevron--open'] : ''}`}><IconChevronDown /></span>
        </button>

        {open && (
          <div className={styles.menu} role="menu">
            {active.map(template => (
              <button
                key={template.id}
                type="button"
                className={styles.option}
                role="menuitem"
                onClick={() => handlePick(template)}
              >
                <span className={styles.optionName}>{template.name}</span>
                {template.description && <span className={styles.optionDesc}>{template.description}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingTemplate !== null}
        onClose={() => setPendingTemplate(null)}
        onConfirm={confirmOverwrite}
        title="Substituir o que já está escrito?"
        message={pendingTemplate
          ? `Aplicar "${pendingTemplate.name}" troca as quatro seções pelo texto do modelo. O que você já escreveu nesta evolução será perdido.`
          : ''}
        variant="danger"
        confirmLabel="Aplicar modelo"
        cancelLabel="Manter o que escrevi"
      />
    </>
  )
}
