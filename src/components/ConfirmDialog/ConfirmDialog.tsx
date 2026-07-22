import type { ReactNode } from 'react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { IconAlert, IconInfo } from '@/components/icons'
import styles from './ConfirmDialog.module.scss'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message?: string
  /** 'danger' para ações destrutivas (excluir, cancelar definitivo…). */
  variant?: 'default' | 'danger'
  confirmLabel?: string
  cancelLabel?: string
  /**
   * Trava o botão de confirmar. Existe para diálogos cujo `children` pede uma
   * decisão incompleta — ex.: "não cobrar" sem o motivo escrito, que salvaria o
   * procedimento gerando a cobrança que o usuário acabou de recusar.
   */
  confirmDisabled?: boolean
  /** Conteúdo extra abaixo da mensagem (ex.: um Toggle de opção). */
  children?: ReactNode
}

/** Diálogo de confirmação reutilizável (desenho do ConfirmDialog do projeto neo). */
export function ConfirmDialog({
  open, onClose, onConfirm,
  title, message,
  variant = 'default',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmDisabled = false,
  children,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger'

  function handleConfirm() {
    onConfirm()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={isDanger ? 'danger' : 'primary'} onClick={handleConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <div className={`${styles.icon} ${isDanger ? styles['icon--danger'] : styles['icon--default']}`}>
          {isDanger ? <IconAlert /> : <IconInfo />}
        </div>
        <h3 className={styles.title}>{title}</h3>
        {message && <p className={styles.message}>{message}</p>}
        {children && <div className={styles.extra}>{children}</div>}
      </div>
    </Modal>
  )
}
