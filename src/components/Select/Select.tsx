import type { SelectHTMLAttributes } from 'react'
import { IconChevronDown } from '@/components/icons'
import styles from './Select.module.scss'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  /**
   * Cabeçalho do bloco a que a opção pertence (vira um <optgroup> nativo).
   * Opcional: sem ele a opção fica solta no topo, como sempre foi.
   *
   * Existe para listas de DOIS NÍVEIS — hoje o plano de contas ("Despesas" →
   * "Aluguel"). Agrupador nativo e não hierarquia desenhada à mão porque no
   * celular o <select> vira a roda do sistema, e ali só o optgroup é
   * respeitado: um travessão de indentação no rótulo viraria texto literal.
   */
  group?: string
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

  // Fatia a lista em blocos consecutivos de mesmo `group`, PRESERVANDO a ordem
  // que veio. Não reordena nem junta blocos separados: quem monta as opções já
  // decidiu a ordem, e agrupar por chave desfaria essa decisão em silêncio.
  const blocks: { group?: string; items: SelectOption[] }[] = []
  for (const opt of options) {
    const last = blocks[blocks.length - 1]
    if (last && last.group === opt.group) last.items.push(opt)
    else blocks.push({ group: opt.group, items: [opt] })
  }

  const renderOption = (opt: SelectOption) => (
    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
      {opt.label}
    </option>
  )

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      {label && <label className={styles.label} htmlFor={selectId}>{label}</label>}

      <div className={`${styles.wrapper} ${error ? styles['wrapper--error'] : ''}`}>
        <select id={selectId} className={`${styles.select} ${styles[`select--${size}`]}`} {...props}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {blocks.map((block, i) =>
            block.group === undefined
              ? block.items.map(renderOption)
              : (
                <optgroup key={`${block.group}-${i}`} label={block.group}>
                  {block.items.map(renderOption)}
                </optgroup>
              ),
          )}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          <IconChevronDown />
        </span>
      </div>

      {error       && <span className={styles.error}>{error}</span>}
      {!error && hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}
