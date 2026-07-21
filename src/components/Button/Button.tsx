import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.scss'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?:    ButtonSize
  loading?: boolean
  iconLeft?:  ReactNode
  iconRight?: ReactNode
  children?:  ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  children,
  disabled,
  className,
  // Default explícito 'button': sem isto o <button> assume type="submit" e dispara
  // submit acidental quando usado dentro de um <form>. Quem precisa, passa type="submit".
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = [
    styles.btn,
    styles[`btn--${variant}`],
    styles[`btn--${size}`],
    loading ? styles['btn--loading'] : '',
    !children && (iconLeft || iconRight) ? styles['btn--icon-only'] : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {!loading && iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
      {children && <span className={styles.label}>{children}</span>}
      {!loading && iconRight && <span className={styles.iconRight}>{iconRight}</span>}
    </button>
  )
}
