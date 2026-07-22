import type {
  Acquirer, CashSession, BankAccount, Payable, Receivable, CashFlowDay, CashMovement,
} from '@/types/domain'

// ── Caixa do dia ─────────────────────────────────────────────────────────────
export const MOCK_CASH_MOVEMENTS: CashMovement[] = [
  { id: 'mc1', clinicId: 'c1', name: 'Maria Oliveira',   paymentMethod: 'Pix',      description: 'Consulta clínica',        postedAt: '21/07/2026 08:12', type: 'inflow', amount: 290 },
  { id: 'mc2', clinicId: 'c1', name: 'João Santos',      paymentMethod: 'Crédito',  description: 'Retorno',                 postedAt: '21/07/2026 09:05', type: 'inflow', amount: 120 },
  { id: 'mc3', clinicId: 'c1', name: 'Papelaria Central', paymentMethod: 'Dinheiro', description: 'Material de escritório', postedAt: '21/07/2026 10:30', type: 'outflow',   amount: 86 },
  { id: 'mc4', clinicId: 'c1', name: 'Juliana Rocha',    paymentMethod: 'Débito',   description: 'Limpeza dental',          postedAt: '21/07/2026 11:15', type: 'inflow', amount: 220 },
  { id: 'mc5', clinicId: 'c1', name: 'Sangria',          paymentMethod: 'Dinheiro', description: 'Sangria para depósito',   postedAt: '21/07/2026 12:00', type: 'outflow',   amount: 300 },
  { id: 'mc6', clinicId: 'c1', name: 'Carlos Pereira',   paymentMethod: 'Pix',      description: 'Sessão psicologia',       postedAt: '21/07/2026 14:20', type: 'inflow', amount: 180 },
]

// ── Fluxo de caixa (próximos dias, com contas previstas) ─────────────────────
export const CASH_FLOW_BASE_BALANCE = 8420
export const MOCK_CASH_FLOW_DAYS: CashFlowDay[] = [
  { id: '2026-07-21', date: '21/07/2026', entryCount: 6, inflows: 810,  outflows: 386 },
  { id: '2026-07-22', date: '22/07/2026', entryCount: 4, inflows: 640,  outflows: 0 },
  { id: '2026-07-23', date: '23/07/2026', entryCount: 5, inflows: 520,  outflows: 1250 },
  { id: '2026-07-24', date: '24/07/2026', entryCount: 3, inflows: 430,  outflows: 0 },
  { id: '2026-07-25', date: '25/07/2026', entryCount: 7, inflows: 980,  outflows: 342 },
  { id: '2026-07-28', date: '28/07/2026', entryCount: 4, inflows: 610,  outflows: 2100 },
  { id: '2026-07-31', date: '31/07/2026', entryCount: 2, inflows: 0,    outflows: 4800 },
]

// ── Contas a pagar ───────────────────────────────────────────────────────────
export const MOCK_PAYABLES: Payable[] = [
  { id: 'cp1', clinicId: 'c1', code: 'CTP-000001', description: 'Aluguel da clínica',        category: 'Ocupação',     dueDate: '25/07/2026', supplier: 'Imobiliária Sol',      amount: 4800, status: 'pending' },
  { id: 'cp2', clinicId: 'c1', code: 'CTP-000002', description: 'Energia elétrica',          category: 'Utilidades',   dueDate: '23/07/2026', supplier: 'Energisa',             amount: 890,  status: 'pending' },
  { id: 'cp3', clinicId: 'c1', code: 'CTP-000003', description: 'Material odontológico',     category: 'Insumos',      dueDate: '15/07/2026', supplier: 'Dental Prime',         amount: 1250, status: 'overdue' },
  { id: 'cp4', clinicId: 'c1', code: 'CTP-000004', description: 'Internet e telefonia',      category: 'Utilidades',   dueDate: '10/07/2026', paidAt: '10/07/2026', supplier: 'Vivo Empresas', amount: 320, status: 'paid' },
  { id: 'cp5', clinicId: 'c1', code: 'CTP-000005', description: 'Folha — recepção',          category: 'Pessoal',      dueDate: '05/07/2026', paidAt: '05/07/2026', supplier: 'Folha interna', amount: 2100, status: 'paid' },
  { id: 'cp6', clinicId: 'c1', code: 'CTP-000006', description: 'Manutenção do autoclave',   category: 'Manutenção',   dueDate: '28/07/2026', supplier: 'TecSaúde',             amount: 450,  status: 'pending' },
]

// ── Contas a receber ─────────────────────────────────────────────────────────
export const MOCK_RECEIVABLES: Receivable[] = [
  { id: 'cr1', clinicId: 'c1', code: 'CTR-000001', description: 'Consulta — Maria Oliveira',    dueDate: '22/07/2026', method: 'credit', source: 'Consultas', grossAmount: 290, fee: 9.57,  status: 'pending', patientId: 'p1', acquirerId: 'aq1' },
  { id: 'cr2', clinicId: 'c1', code: 'CTR-000002', description: 'Repasse Unimed — junho',       dueDate: '25/07/2026', method: 'wire',     source: 'Convênio',  grossAmount: 3480, fee: 0,    status: 'pending' },
  { id: 'cr3', clinicId: 'c1', code: 'CTR-000003', description: 'Pacote fisioterapia — Ana',    dueDate: '15/07/2026', receivedAt: '15/07/2026', method: 'pix', source: 'Consultas', grossAmount: 600, fee: 0, status: 'paid', receivedAmount: 600, bankAccountId: 'cb1', patientId: 'p3' },
  { id: 'cr4', clinicId: 'c1', code: 'CTR-000004', description: 'Limpeza dental — Pedro',       dueDate: '08/07/2026', method: 'boleto',  source: 'Consultas', grossAmount: 220, fee: 3.9,   status: 'overdue', patientId: 'p8' },
  { id: 'cr5', clinicId: 'c1', code: 'CTR-000005', description: 'Parcela 2/3 — plano ortodontia', dueDate: '30/07/2026', method: 'credit', source: 'Planos',  grossAmount: 380, fee: 12.54, status: 'pending', patientId: 'p4', installmentNumber: 2, installmentCount: 3, acquirerId: 'aq1' },
  // Vencidas há mais tempo — casos da aba Inadimplência (Maria acumula duas).
  { id: 'cr6', clinicId: 'c1', code: 'CTR-000006', description: 'Parcela 1/3 — plano ortodontia', dueDate: '30/06/2026', method: 'credit', source: 'Planos',  grossAmount: 380, fee: 12.54, status: 'overdue', patientId: 'p4', installmentNumber: 1, installmentCount: 3, acquirerId: 'aq1' },
  { id: 'cr7', clinicId: 'c1', code: 'CTR-000007', description: 'Avaliação postural — Maria',     dueDate: '10/06/2026', method: 'boleto', source: 'Consultas', grossAmount: 180, fee: 3.9,  status: 'overdue', patientId: 'p1' },
  { id: 'cr8', clinicId: 'c1', code: 'CTR-000008', description: 'Sessão extra — Maria',           dueDate: '01/07/2026', method: 'pix',    source: 'Consultas', grossAmount: 150, fee: 0,    status: 'overdue', patientId: 'p1' },
  // Débito Cielo com repasse em data diferente — segunda linha na Conciliação.
  { id: 'cr9', clinicId: 'c1', code: 'CTR-000009', description: 'Consulta clínica — João',        dueDate: '23/07/2026', method: 'debit',  source: 'Consultas', grossAmount: 260, fee: 3.77, status: 'pending', patientId: 'p2', acquirerId: 'aq2' },
]

// ── Contas bancárias ─────────────────────────────────────────────────────────
export const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'cb1', clinicId: 'c1', name: 'BB — Conta PJ',    type: 'checking', bank: 'Banco do Brasil', branch: '1234-5', accountNumber: '45.678-9',   holder: 'Neo Saúde LTDA', balance: 12480.55, status: 'active', isDefault: true },
  { id: 'cb2', clinicId: 'c1', name: 'Nubank PJ',        type: 'checking', bank: 'Nubank',          branch: '0001',   accountNumber: '9876543-2',  holder: 'Neo Saúde LTDA', balance: 5320.10,  status: 'active' },
  { id: 'cb3', clinicId: 'c1', name: 'Reserva Poupança', type: 'savings', bank: 'Caixa Econômica', branch: '0402',   accountNumber: '00123456-7', holder: 'Neo Saúde LTDA', balance: 20150,    status: 'active' },
]

// ── Adquirentes ──────────────────────────────────────────────────────────────
export const MOCK_ACQUIRERS: Acquirer[] = [
  {
    id: 'aq1',
    clinicId: 'c1', name: 'Stone', cardBrands: ['Visa', 'Mastercard', 'Elo'],
    creditFee: 3.19, debitFee: 1.45, settlementDays: 1, payoutAccountId: 'cb1', status: 'active',
    installmentFees: [
      { installments: 2, fee: 3.59 }, { installments: 3, fee: 3.99 },
      { installments: 6, fee: 4.49 }, { installments: 12, fee: 4.99 },
    ],
  },
  {
    id: 'aq2',
    clinicId: 'c1', name: 'Cielo', cardBrands: ['Visa', 'Mastercard', 'Amex'],
    creditFee: 3.49, debitFee: 1.69, settlementDays: 30, payoutAccountId: 'cb1', status: 'active',
    installmentFees: [
      { installments: 2, fee: 3.89 }, { installments: 3, fee: 4.19 }, { installments: 6, fee: 4.69 },
    ],
  },
  { id: 'aq3', clinicId: 'c1', name: 'PagSeguro', cardBrands: ['Visa', 'Mastercard', 'Hipercard'], creditFee: 3.79, debitFee: 1.99, settlementDays: 14, payoutAccountId: 'cb2', status: 'inactive' },
]

// ── Sessão do caixa (mock mutável: abrir/fechar mudam este objeto) ───────────
export const MOCK_CASH_SESSION: CashSession = {
  isOpen: false,
  openingAmount: 0,
}
