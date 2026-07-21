import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './Input.module.scss'

type InputSize = 'sm' | 'md' | 'lg'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?:     string
  error?:     string
  hint?:      string
  iconLeft?:  ReactNode
  iconRight?: ReactNode
  size?:      InputSize
}

export function Input({ label, error, hint, iconLeft, iconRight, size = 'md', id, className, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  const inputClass = [
    styles.input,
    styles[`input--${size}`],
    iconLeft  ? styles['input--icon-left']  : '',
    iconRight ? styles['input--icon-right'] : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      {label && <label className={styles.label} htmlFor={inputId}>{label}</label>}

      <div className={`${styles.wrapper} ${error ? styles['wrapper--error'] : ''}`}>
        {iconLeft  && <span className={styles.iconLeft}>{iconLeft}</span>}
        <input id={inputId} className={inputClass} {...props} />
        {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
      </div>

      {error       && <span className={styles.error}>{error}</span>}
      {!error && hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}
