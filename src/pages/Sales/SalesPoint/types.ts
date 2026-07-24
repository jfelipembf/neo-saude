// Tipos de UI do Ponto de Venda (PDV) do módulo de fisioterapia. Camada visual /
// mock — nada persiste no banco nesta fase.

export type CatalogKind = 'service' | 'contract'
export type PayMethod   = 'cash' | 'pix' | 'debit' | 'credit'

export const CATALOG_TABS: { value: CatalogKind; label: string }[] = [
  { value: 'service',  label: 'Serviços' },
  { value: 'contract', label: 'Contratos' },
]

export const PAY_METHOD_OPTIONS: { value: PayMethod; label: string }[] = [
  { value: 'cash',   label: 'Dinheiro' },
  { value: 'pix',    label: 'Pix' },
  { value: 'debit',  label: 'Débito' },
  { value: 'credit', label: 'Crédito' },
]

export const PAY_METHOD_LABEL: Record<PayMethod, string> =
  Object.fromEntries(PAY_METHOD_OPTIONS.map(o => [o.value, o.label])) as Record<PayMethod, string>

export interface CatalogItem {
  id:      string
  kind:    CatalogKind
  name:    string
  price:   number
  detail?: string    // "10 sessões · 90 dias" / "R$ 320/mês"
}

export interface CartItem {
  uid:   string
  refId: string
  kind:  CatalogKind
  name:  string
  price: number
}

export interface Payment {
  uid:          string
  method:       PayMethod
  amount:       number
  installments: number
}
