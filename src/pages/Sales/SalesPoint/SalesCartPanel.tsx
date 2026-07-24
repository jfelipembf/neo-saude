import { Button } from '@/components/Button/Button'
import { IconX } from '@/components/icons'
import { formatBRL } from '@/utils/format'
import { PAY_METHOD_LABEL } from './types'
import type { CartItem, Payment } from './types'
import styles from './SalesPointPage.module.scss'

interface Props {
  cart:      CartItem[]
  payments:  Payment[]
  subtotal:  number
  discount:  number
  total:     number
  totalPaid: number
  balance:   number
  surplus:   number
  onRemoveItem:    (uid: string) => void
  onRemovePayment: (uid: string) => void
  onFinalize:      () => void
}

/** Painel direito do PDV — resumo da venda. */
export function SalesCartPanel(p: Props) {
  return (
    <div className={`${styles.panel} ${styles.cart}`}>
      <span className={styles.cartTitle}>Resumo da venda</span>

      <div className={styles.cartSection}>
        <span className={styles.blockTitle}>Itens</span>
        {p.cart.length === 0 ? (
          <p className={styles.empty}>Nenhum item adicionado.</p>
        ) : (
          p.cart.map(it => (
            <div key={it.uid} className={styles.lineItem}>
              <span className={styles.lineName}>{it.name}</span>
              <span className={styles.lineValue}>{formatBRL(it.price)}</span>
              <button type="button" className={styles.remove} onClick={() => p.onRemoveItem(it.uid)} aria-label="Remover item">
                <IconX />
              </button>
            </div>
          ))
        )}
      </div>

      <div className={styles.cartSection}>
        <span className={styles.blockTitle}>Pagamentos</span>
        {p.payments.length === 0 ? (
          <p className={styles.empty}>Nenhum pagamento.</p>
        ) : (
          p.payments.map(pay => (
            <div key={pay.uid} className={styles.lineItem}>
              <span className={styles.lineName}>
                {PAY_METHOD_LABEL[pay.method]}
                {pay.installments > 1 ? ` · ${pay.installments}x` : ' · à vista'}
              </span>
              <span className={styles.lineValue}>{formatBRL(pay.amount)}</span>
              <button type="button" className={styles.remove} onClick={() => p.onRemovePayment(pay.uid)} aria-label="Remover pagamento">
                <IconX />
              </button>
            </div>
          ))
        )}
      </div>

      <div className={styles.totals}>
        <div className={styles.totalRow}><span>Subtotal</span><span>{formatBRL(p.subtotal)}</span></div>
        {p.discount > 0 && <div className={styles.totalRow}><span>Desconto</span><span>− {formatBRL(p.discount)}</span></div>}
        <div className={styles.totalRow}><span>Total pago</span><span>{formatBRL(p.totalPaid)}</span></div>
        <div className={`${styles.totalRow} ${styles.totalFinal}`}>
          {p.surplus > 0 ? (
            <><span>Troco</span><span>{formatBRL(p.surplus)}</span></>
          ) : p.balance > 0 ? (
            <><span>Saldo restante</span><span>{formatBRL(p.balance)}</span></>
          ) : (
            <><span>Status</span><span className={styles.chipPago}>Quitado</span></>
          )}
        </div>
      </div>

      <Button onClick={p.onFinalize} disabled={p.cart.length === 0}>
        Finalizar venda
      </Button>
    </div>
  )
}
