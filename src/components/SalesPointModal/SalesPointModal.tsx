import { useState } from 'react'
import { Modal } from '@/components/Modal/Modal'
import { useToast } from '@/components/Toast/Toast'
import { useServices } from '@/hooks/useServices'
import { useCheckoutSale } from '@/hooks/useSales'
import { userMessage } from '@/lib/errors'
import { SINGLE_ACT_MODALITIES } from '@/types/domain'
import { toIsoDate } from '@/utils/date'
import { SalesSelectionPanel } from './SalesSelectionPanel'
import { SalesCartPanel } from './SalesCartPanel'
import { PaymentForm } from './PaymentForm'
import type { CartItem, CatalogItem, Payment } from './types'
import styles from './SalesPointModal.module.scss'

let seq = 0

interface SalesPointModalProps {
  open: boolean
  onClose: () => void
  patientId: string
}

/**
 * Ponto de Venda: catálogo de Serviços (Administrativo → Serviços) + carrinho
 * + pagamento, fechando a venda para UM paciente (checkout_sale). Pacotes
 * (modality='package') vendidos aqui dão ao paciente o direito às sessões —
 * ver bloco "Pacotes" e o seletor de pacote no agendamento.
 */
export function SalesPointModal({ open, onClose, patientId }: SalesPointModalProps) {
  const toast = useToast()
  const { data: services } = useServices()
  const { mutate: checkout, isPending: saving } = useCheckoutSale()

  const [saleDate, setSaleDate] = useState(() => toIsoDate(new Date()))
  const [discount, setDiscount] = useState('0')
  const [cart, setCart] = useState<CartItem[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState('')

  // Reseta o carrinho a cada abertura — ajuste de estado durante o render
  // (sem useEffect), mesmo padrão do resto do app.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setSaleDate(toIsoDate(new Date()))
      setDiscount('0')
      setCart([])
      setPayments([])
      setError('')
    }
  }

  const catalog: CatalogItem[] = (services ?? [])
    .filter(s => s.status === 'active')
    .map(s => ({
      id: s.id,
      name: s.name,
      price: s.price,
      // Ato único (consulta/procedimento) não tem vigência nem sessões: sem
      // este ramo o carrinho anunciaria "Contrato · 0 meses" para uma consulta.
      detail: SINGLE_ACT_MODALITIES.includes(s.modality)
        ? (s.modality === 'consultation' ? 'Consulta' : 'Procedimento')
        : s.modality === 'package'
          ? `Pacote · ${s.sessions ?? 0} sessões`
          : `Contrato · ${s.durationQty} ${s.durationUnit === 'days' ? 'dias' : s.durationUnit === 'weeks' ? 'semanas' : 'meses'}`,
    }))

  const subtotal = cart.reduce((sum, i) => sum + i.price, 0)
  const discountValue = Math.max(0, Number(discount) || 0)
  const total = Math.max(0, subtotal - discountValue)
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const balance = Math.max(0, Math.round((total - totalPaid) * 100) / 100)
  const surplus = Math.max(0, Math.round((totalPaid - total) * 100) / 100)

  // Parcelamento não pode passar do menor limite entre os itens no carrinho.
  const maxInstallments = cart.length === 0 ? 12 : Math.min(
    ...cart.map(i => services?.find(s => s.id === i.refId)?.maxInstallments ?? 12),
  )

  function addItem(item: CatalogItem) {
    setCart(c => [...c, { uid: `item-${++seq}`, refId: item.id, name: item.name, price: item.price }])
  }
  function removeItem(uid: string) {
    setCart(c => c.filter(i => i.uid !== uid))
  }
  function addPayment(p: Payment) {
    setPayments(ps => [...ps, p])
  }
  function removePayment(uid: string) {
    setPayments(ps => ps.filter(p => p.uid !== uid))
  }

  function handleFinalize() {
    if (cart.length === 0) return
    if (balance > 0 || surplus > 0) {
      setError('O total pago precisa fechar exatamente com o total da venda.')
      return
    }
    setError('')

    // Agrega o carrinho por serviço — cada clique em "adicionar" empilha uma
    // linha de 1 unidade; checkout_sale espera {service_id, quantity}.
    const quantities = new Map<string, number>()
    for (const item of cart) quantities.set(item.refId, (quantities.get(item.refId) ?? 0) + 1)

    checkout(
      {
        patientId,
        saleDateIso: saleDate,
        discount: discountValue,
        items: [...quantities].map(([serviceId, quantity]) => ({ serviceId, quantity })),
        plan: payments.map(p => ({
          method: p.method,
          amount: p.amount,
          installments: p.installments,
          acquirerId: p.acquirerId,
          cardBrand: p.cardBrand,
          authorizationCode: p.authorizationCode,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Venda registrada!')
          onClose()
        },
        onError: e => setError(userMessage(e, 'Não foi possível fechar a venda. Tente novamente.')),
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Ponto de venda" size="lg">
      <div className={styles.pdv}>
        <SalesSelectionPanel
          catalog={catalog}
          saleDate={saleDate}
          discount={discount}
          onSaleDate={setSaleDate}
          onDiscount={setDiscount}
          onAddItem={addItem}
        >
          <PaymentForm balance={balance} maxInstallments={maxInstallments} onAdd={addPayment} />
        </SalesSelectionPanel>

        <div className={styles.cartCol}>
          <SalesCartPanel
            cart={cart}
            payments={payments}
            subtotal={subtotal}
            discount={discountValue}
            total={total}
            totalPaid={totalPaid}
            balance={balance}
            surplus={surplus}
            onRemoveItem={removeItem}
            onRemovePayment={removePayment}
            onFinalize={handleFinalize}
            saving={saving}
          />
          {error && <p className={styles.erro}>{error}</p>}
        </div>
      </div>
    </Modal>
  )
}
