import type { ReactNode } from 'react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useDialogBehavior } from '@/hooks/useDialogBehavior'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { IconX } from '@/components/icons'
import styles from './Modal.module.scss'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: ReactNode
  /**
   * Recebe `requestClose` quando é função: o botão "Fechar" do rodapé passa
   * pela MESMA guarda de `confirmOnClose` — senão ele seria o furo da proteção
   * (o rodapé é do chamador, não dá para o Modal interceptá-lo por fora).
   */
  footer?: ReactNode | ((requestClose: () => void) => ReactNode)
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Pergunta antes de fechar por ESC, clique no fundo ou no "×". Ligue com o
   * "tem coisa não salva aqui" da tela (ex.: o noteDirty do prontuário): fechar
   * sem querer um modal com texto longo apagava o que o profissional digitou.
   * Sem a prop, o modal fecha como sempre.
   */
  confirmOnClose?: boolean
  confirmOnCloseTitle?: string
  confirmOnCloseMessage?: string
}

export function Modal({
  open, onClose, title, children, footer, size = 'md',
  confirmOnClose = false,
  confirmOnCloseTitle = 'Descartar as alterações?',
  confirmOnCloseMessage = 'Há alterações que ainda não foram salvas. Se fechar agora, elas se perdem.',
}: ModalProps) {
  const [confirmingClose, setConfirmingClose] = useState(false)

  function requestClose() {
    if (confirmOnClose) setConfirmingClose(true)
    else onClose()
  }

  // Trap de foco + ESC + trava do scroll de trás (compartilhado com o Drawer).
  // O ESC entra pela guarda, não direto no onClose.
  const panelRef = useDialogBehavior<HTMLDivElement>(open, requestClose)

  if (!open) {
    // Fechado por fora (o pai zerou o `open`) com a pergunta na tela: zera o
    // pedido para não reaparecer na próxima abertura.
    if (confirmingClose) setConfirmingClose(false)
    return null
  }

  return createPortal(
    <>
      <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) requestClose() }}>
        <div
          ref={panelRef}
          className={`${styles.panel} ${styles[`panel--${size}`]}`}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <header className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            <button type="button" className={styles.close} onClick={requestClose} aria-label="Fechar">
              <IconX />
            </button>
          </header>

          <div className={styles.body}>{children}</div>

          {footer && (
            <footer className={styles.footer}>
              {typeof footer === 'function' ? footer(requestClose) : footer}
            </footer>
          )}
        </div>
      </div>

      {/* Fora do overlay de propósito: um portal continua propagando evento
          pela ÁRVORE DO REACT, então dentro dele o clique no diálogo subiria
          para o onMouseDown do fundo. ConfirmDialog é um Modal sem
          `confirmOnClose`, então não recursiona. */}
      <ConfirmDialog
        open={confirmingClose}
        onClose={() => setConfirmingClose(false)}
        onConfirm={onClose}
        title={confirmOnCloseTitle}
        message={confirmOnCloseMessage}
        variant="danger"
        confirmLabel="Fechar sem salvar"
        cancelLabel="Continuar editando"
      />
    </>,
    document.body,
  )
}
