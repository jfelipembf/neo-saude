import type { TextareaHTMLAttributes } from 'react'
import styles from './Textarea.module.scss'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?:  string
}

export function Textarea({ label, error, hint, id, className, rows = 4, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      {label && <label className={styles.label} htmlFor={textareaId}>{label}</label>}

      <textarea
        id={textareaId}
        rows={rows}
        className={`${styles.textarea} ${error ? styles['textarea--error'] : ''}`}
        {...props}
      />

      {error       && <span className={styles.error}>{error}</span>}
      {!error && hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}
