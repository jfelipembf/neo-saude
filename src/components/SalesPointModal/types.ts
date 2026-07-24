// Tipos de UI do Ponto de Venda (PDV) — vende o catálogo de Serviços
// (Administrativo → Serviços) para um paciente (checkout_sale).

export type PayMethod = 'cash' | 'pix' | 'debit' | 'credit'

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
  name:    string
  price:   number
  detail?: string    // "Pacote · 10 sessões · 90 dias" / "Contrato · 12 meses"
}

export interface CartItem {
  uid:   string
  refId: string   // service.id
  name:  string
  price: number
}

export interface Payment {
  uid:          string
  method:       PayMethod
  amount:       number
  installments: number
  /** Obrigatória em crédito/débito (repasse de adquirente) — ver checkout_sale. */
  acquirerId?:  string
  /** Crédito/débito: bandeira do cartão (obrigatória) e código de autorização
   *  da operadora (opcional) — vão pro campo `notes` do recebível gerado. */
  cardBrand?:         string
  authorizationCode?: string
}
