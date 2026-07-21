import type { ReactNode } from 'react'
import styles from './Tabs.module.scss'

export interface Tab {
  key: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
  children?: ReactNode
}

/** Barra de abas com sublinhado na ativa (desenho do Tabs do projeto neo). */
export function Tabs({ tabs, active, onChange, children }: TabsProps) {
  // Sem children → renderiza só a barra (sem margem inferior), para embutir o
  // strip de abas em um cabeçalho e renderizar o conteúdo separadamente.
  const hasContent = children != null && children !== false

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.bar} ${hasContent ? '' : styles['bar--flush']}`} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            className={`${styles.tab} ${active === tab.key ? styles['tab--active'] : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {hasContent && <div className={styles.content}>{children}</div>}
    </div>
  )
}
