import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useDialogBehavior } from '@/hooks/useDialogBehavior'
import { IconX } from '@/components/icons'
import styles from './Modal.module.scss'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  // Trap de foco + ESC + trava do scroll de trás (compartilhado com o Drawer).
  const panelRef = useDialogBehavior<HTMLDivElement>(open, onClose)

  if (!open) return null

  return createPortal(
    <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div
        ref={panelRef}
        className={`${styles.panel} ${styles[`panel--${size}`]}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
            <IconX />
          </button>
        </header>

        <div className={styles.body}>{children}</div>

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
