import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { FormSection } from '@/components/FormSection/FormSection'
import { IconPlus } from '@/components/icons'
import { formatBRL } from '@/utils/format'
import type { CatalogItem } from './types'
import styles from './SalesPointModal.module.scss'

interface Props {
  catalog:    CatalogItem[]
  saleDate:   string
  discount:   string
  onSaleDate:  (v: string) => void
  onDiscount:  (v: string) => void
  onAddItem:   (item: CatalogItem) => void
  children:    ReactNode
}

/** Painel esquerdo do PDV — o que está sendo vendido + o pagamento. Com mais
 *  de um serviço no catálogo, escolhe por um menu suspenso (mostra o valor
 *  assim que seleciona); com só um, não tem o que escolher — já mostra ele. */
export function SalesSelectionPanel({
  catalog, saleDate, discount, onSaleDate, onDiscount, onAddItem, children,
}: Props) {
  const [selectedId, setSelectedId] = useState('')
  const selected = catalog.length === 1 ? catalog[0] : catalog.find(c => c.id === selectedId)

  function add() {
    if (!selected) return
    onAddItem(selected)
    setSelectedId('')
  }

  return (
    <div className={styles.panel}>
      <FormSection title="Dados da venda">
        <div className={styles.saleGrid}>
          <Input label="Data da venda" type="date" value={saleDate} onChange={e => onSaleDate(e.target.value)} />
          <Input label="Desconto (R$)" type="number" min={0} step="0.01" value={discount} onChange={e => onDiscount(e.target.value)} />
        </div>
      </FormSection>

      <div className={styles.catalog}>
        <span className={styles.blockTitle}>Serviços</span>
        {catalog.length === 0 ? (
          <p className={styles.empty}>Nenhum item disponível.</p>
        ) : (
          <>
            {catalog.length > 1 && (
              <Select
                label="Serviço"
                options={catalog.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Selecione..."
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              />
            )}
            {selected && (
              <div className={styles.catalogSelected}>
                <div className={styles.catalogSelectedInfo}>
                  <span className={styles.catalogName}>{selected.name}</span>
                  {selected.detail && <span className={styles.catalogDetail}>{selected.detail}</span>}
                  <span className={styles.catalogPrice}>{formatBRL(selected.price)}</span>
                </div>
                <Button size="sm" iconLeft={<IconPlus />} onClick={add}>Adicionar</Button>
              </div>
            )}
          </>
        )}
      </div>

      {children}
    </div>
  )
}
