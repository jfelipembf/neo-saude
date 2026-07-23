import type { AuditAction } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// Rótulos da AUDITORIA: o banco guarda nomes crus (tabela/coluna em inglês); a
// tela mostra pt. Fonte única — nunca aparece `table_name` cru na tela.
// ─────────────────────────────────────────────────────────────────────────────

/** table_name (Supabase) → rótulo pt exibido na trilha. */
export const AUDIT_TABLE_LABELS: Record<string, string> = {
  patient: 'Paciente',
  patient_document: 'Documento do paciente',
  professional: 'Profissional',
  professional_commission: 'Comissão',
  appointment: 'Agendamento',
  appointment_history: 'Histórico de agendamento',
  schedule_slot: 'Horário',
  treatment: 'Tratamento',
  treatment_session: 'Procedimento',
  treatment_session_action: 'Etapa do procedimento',
  treatment_session_material: 'Material do procedimento',
  billed_treatment: 'Tratamento faturado',
  anamnesis: 'Anamnese',
  anamnesis_answer: 'Resposta de anamnese',
  prescription: 'Prescrição',
  prescription_medication: 'Medicação da prescrição',
  quote: 'Orçamento',
  quote_item: 'Item do orçamento',
  receivable: 'Conta a receber',
  payable: 'Conta a pagar',
  payment: 'Pagamento',
  payment_entry: 'Baixa de pagamento',
  collection_attempt: 'Cobrança',
  cash_movement: 'Movimento de caixa',
  cash_session: 'Sessão de caixa',
  bank_account: 'Conta bancária',
  acquirer: 'Adquirente',
  acquirer_installment_rate: 'Taxa de parcelamento',
  insurance: 'Convênio',
  material: 'Material',
  clinic: 'Clínica',
  clinic_user: 'Colaborador',
  clinic_goal: 'Meta',
  access_profile: 'Cargo',
  access_profile_permission: 'Permissão de cargo',
  subscription: 'Assinatura',
  subscription_invoice: 'Fatura da assinatura',
  whatsapp_automation: 'Automação WhatsApp',
  whatsapp_connection: 'Conexão WhatsApp',
}

/** Rótulo pt de uma tabela; cai no nome cru quando não mapeado. */
export function auditTableLabel(table: string): string {
  return AUDIT_TABLE_LABELS[table] ?? table
}

/** Opções do filtro "Entidade" (ordenadas pelo rótulo pt). */
export const AUDIT_TABLE_OPTIONS = Object.entries(AUDIT_TABLE_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))

/** Opções do filtro "Ação". */
export const AUDIT_ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
  { value: 'insert', label: 'Criou' },
  { value: 'update', label: 'Alterou' },
  { value: 'delete', label: 'Excluiu' },
]

// Colunas técnicas que não interessam na trilha (carimbos e chaves).
export const AUDIT_HIDDEN_FIELDS = new Set([
  'updated_at', 'created_at', 'id', 'clinic_id', 'code',
])

/** Nome cru de coluna → rótulo pt no diff (fallback: o próprio nome). */
export const AUDIT_FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  full_name: 'Nome',
  description: 'Descrição',
  amount: 'Valor',
  gross_amount: 'Valor',
  fee: 'Taxa',
  net_amount: 'Valor líquido',
  received_amount: 'Recebido',
  paid_amount: 'Pago',
  status: 'Situação',
  due_date: 'Vencimento',
  received_at: 'Recebido em',
  paid_at: 'Pago em',
  method: 'Forma de pagamento',
  phone: 'Telefone',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  cpf: 'CPF',
  notes: 'Observações',
  color: 'Cor',
  photo_url: 'Foto',
  avatar_url: 'Foto',
  access_profile_id: 'Cargo',
  professional_id: 'Profissional',
  patient_id: 'Paciente',
  start_time: 'Início',
  end_time: 'Fim',
  room: 'Sala',
  discount: 'Desconto',
  installments: 'Parcelas',
  can_view: 'Pode ver',
  can_edit: 'Pode editar',
  is_owner: 'Proprietário',
}

/** Rótulo pt de um campo; cai no nome cru quando não mapeado. */
export function auditFieldLabel(field: string): string {
  return AUDIT_FIELD_LABELS[field] ?? field
}
