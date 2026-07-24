import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Toast.module.scss'

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  success: (message: string) => void
  error:   (message: string) => void
  info:    (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++
    setToasts(list => [...list, { id, kind, message }])
    setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), TOAST_DURATION)
  }, [])

  const value: ToastContextValue = {
    success: msg => push('success', msg),
    error:   msg => push('error', msg),
    info:    msg => push('info', msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && createPortal(
        <div className={styles.stack} role="status" aria-live="polite">
          {toasts.map(t => (
            <div key={t.id} className={`${styles.toast} ${styles[`toast--${t.kind}`]}`}>
              {t.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>')
  return ctx
}
