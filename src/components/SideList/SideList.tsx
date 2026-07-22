import { useState } from 'react'
import { Input } from '@/components/Input/Input'
import { IconSearch, IconPlus } from '@/components/icons'
import { useDebounce } from '@/hooks/useDebounce'
import { matchesSearch } from '@/utils/search'
import styles from './SideList.module.scss'

export interface SideListItem {
  id: string | number
  label: string
  sublabel?: string
}

type SideListSize = 'sm' | 'md' | 'lg'

interface SideListProps {
  title?: string
  items: SideListItem[]
  selectedId?: string | number | null
  onSelect: (id: string | number) => void
  /** Botão + no cabeçalho (criar novo item). */
  onAdd?: () => void
  searchPlaceholder?: string
  /** Oculta o campo de busca (listas curtas, ex.: contas/adquirentes). */
  hideSearch?: boolean
  emptyText?: string
  size?: SideListSize
}

/** Lista lateral com busca e seleção (desenho do SideList do projeto neo). */
export function SideList({
  title,
  items,
  selectedId,
  onSelect,
  onAdd,
  searchPlaceholder = 'Pesquisar...',
  hideSearch = false,
  emptyText = 'Nenhum item encontrado',
  size = 'md',
}: SideListProps) {
  const [search, setSearch] = useState('')

  const term = useDebounce(search)
  const filtered = term.trim()
    ? items.filter(i => matchesSearch(i.label, term))
    : items

  return (
    <div className={`${styles.wrap} ${styles[`wrap--${size}`]}`}>
      <div className={styles.header}>
        {title && <span className={styles.title}>{title}</span>}
        {onAdd && (
          <button type="button" className={styles.addBtn} onClick={onAdd} title="Novo" aria-label="Adicionar novo">
            <IconPlus />
          </button>
        )}
      </div>

      {!hideSearch && (
        <div className={styles.searchWrap}>
          <Input
            size="sm"
            iconLeft={<IconSearch />}
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={searchPlaceholder}
          />
        </div>
      )}

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>{emptyText}</p>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className={`${styles.item} ${item.id === selectedId ? styles['item--active'] : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(item.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item.id) } }}
            >
              <span className={styles.itemText}>
                <span className={styles.itemLabel}>{item.label}</span>
                {item.sublabel && <span className={styles.itemSub}>{item.sublabel}</span>}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
