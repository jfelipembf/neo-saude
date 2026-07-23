import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@/components/icons'
import styles from './Drawer.module.scss'

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Painel lateral (desliza da direita) — mesmo comportamento de acessibilidade
 * do Modal (trap de foco, ESC fecha, trava o scroll de trás), só que a
 * apresentação é de painel encostado na borda e não de caixa centralizada.
 * Uso: formulários rápidos que o usuário preenche olhando o que ficou por
 * trás (ex.: Novo contato sobre o Kanban), diferente do Modal, que interrompe
 * a tela inteira.
 */
export function Drawer({ open, onClose, title, children, footer, size = 'md' }: DrawerProps) {
  const panelRef   = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      // Trap de foco: Tab/Shift+Tab circulam só dentro do painel.
      if (e.key === 'Tab' && panel) {
        const items = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (!items.length) { e.preventDefault(); return }
        const first = items[0]
        const last = items[items.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || !panel.contains(active))) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
          e.preventDefault(); first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    // Trava o scroll da página atrás enquanto o painel está aberto.
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

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
