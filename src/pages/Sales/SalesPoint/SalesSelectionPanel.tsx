import type { ReactNode } from 'react'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Input } from '@/components/Input/Input'
import { FormSection } from '@/components/FormSection/FormSection'
import { formatBRL } from '@/utils/format'
import { CATALOG_TABS } from './types'
import type { CatalogKind, CatalogItem } from './types'
import styles from './SalesPointPage.module.scss'

interface Props {
  catalog:    CatalogItem[]
  tab:        CatalogKind
  onTab:      (k: CatalogKind) => void
  saleDate:   string
  discount:   string
  onSaleDate:  (v: string) => void
  onDiscount:  (v: string) => void
  onAddItem:   (item: CatalogItem) => void
  children:    ReactNode
}

/** Painel esquerdo do PDV — o que está sendo vendido + o pagamento. */
export function SalesSelectionPanel({
  catalog, tab, onTab, saleDate, discount, onSaleDate, onDiscount, onAddItem, children,
}: Props) {
  const items = catalog.filter(i => i.kind === tab)

  return (
    <div className={styles.panel}>
      <SegmentedControl options={CATALOG_TABS} value={tab} onChange={onTab} />

      <FormSection title="Dados da venda">
        <div className={styles.saleGrid}>
          <Input label="Data da venda" type="date" value={saleDate} onChange={e => onSaleDate(e.target.value)} />
          <Input label="Desconto (R$)" type="number" min={0} step="0.01" value={discount} onChange={e => onDiscount(e.target.value)} />
        </div>
      </FormSection>

      <div className={styles.catalog}>
        <span className={styles.blockTitle}>{tab === 'service' ? 'Serviços' : 'Contratos'}</span>
        {items.length === 0 ? (
          <p className={styles.empty}>Nenhum item disponível.</p>
        ) : (
          <div className={styles.catalogGrid}>
            {items.map(item => (
              <button
                key={item.id}
                type="button"
                className={styles.catalogCard}
                onClick={() => onAddItem(item)}
              >
                <span className={styles.catalogName}>{item.name}</span>
                {item.detail && <span className={styles.catalogDetail}>{item.detail}</span>}
                <span className={styles.catalogPrice}>{formatBRL(item.price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {children}
    </div>
  )
}
