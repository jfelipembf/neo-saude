import type { SelectHTMLAttributes } from 'react'
import { IconChevronBaixo } from '@/components/icons'
import styles from './Select.module.scss'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

type SelectSize = 'sm' | 'md' | 'lg'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?:       string
  error?:       string
  hint?:        string
  options:      SelectOption[]
  placeholder?: string
  size?:        SelectSize
}

export function Select({ label, error, hint, options, placeholder, size = 'md', id, className, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      {label && <label className={styles.label} htmlFor={selectId}>{label}</label>}

      <div className={`${styles.wrapper} ${error ? styles['wrapper--error'] : ''}`}>
        <select id={selectId} className={`${styles.select} ${styles[`select--${size}`]}`} {...props}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          <IconChevronBaixo />
        </span>
      </div>

      {error       && <span className={styles.error}>{error}</span>}
      {!error && hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}
