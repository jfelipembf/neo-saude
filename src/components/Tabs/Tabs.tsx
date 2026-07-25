import type { ReactNode } from 'react'
import styles from './Tabs.module.scss'

export interface Tab {
  key: string
  label: string
  /**
   * Contador ao lado do rótulo. Existe para abas que são PENDÊNCIA e não
   * relatório — "A faturar" é dinheiro que ninguém cobrou, e uma aba que só
   * mostra o número quando você entra nela não avisa ninguém. Zero não
   * renderiza: badge com 0 é ruído permanente.
   */
  badge?: number
}

export type TabsSize = 'sm' | 'md' | 'lg'

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
  children?: ReactNode
  /**
   * Altura de cada aba — MESMOS 3 portes de Button/Input/Select, na MESMA
   * escala ($ctrl-h-sm/md/lg). Existe para alinhar a barra a um Input/Button
   * vizinhos na mesma linha (ex.: filtro de tipo + busca + "Nova categoria"
   * do Financeiro): sem isto os três ficavam em alturas diferentes, cada
   * componente escolhendo a própria por conta própria.
   */
  size?: TabsSize
}

/** Barra de abas com sublinhado na ativa (desenho do Tabs do projeto neo). */
export function Tabs({ tabs, active, onChange, children, size = 'md' }: TabsProps) {
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
            className={`${styles.tab} ${styles[`tab--${size}`]} ${active === tab.key ? styles['tab--active'] : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className={styles.badge} aria-label={`${tab.badge} em aberto`}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
      {hasContent && <div className={styles.content}>{children}</div>}
    </div>
  )
}
