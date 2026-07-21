import type {
  Acquirer, CashSession, BankAccount, Payable, Receivable, CashFlowDay, CashMovement,
} from '@/types/domain'

// ── Caixa do dia ─────────────────────────────────────────────────────────────
export const MOCK_MOVIMENTOS_CAIXA: CashMovement[] = [
  { id: 'mc1', nome: 'Maria Oliveira',   formaPagamento: 'Pix',      descricao: 'Consulta clínica',        lancamento: '21/07/2026 08:12', tipo: 'entrada', valor: 290 },
  { id: 'mc2', nome: 'João Santos',      formaPagamento: 'Crédito',  descricao: 'Retorno',                 lancamento: '21/07/2026 09:05', tipo: 'entrada', valor: 120 },
  { id: 'mc3', nome: 'Papelaria Central', formaPagamento: 'Dinheiro', descricao: 'Material de escritório', lancamento: '21/07/2026 10:30', tipo: 'saida',   valor: 86 },
  { id: 'mc4', nome: 'Juliana Rocha',    formaPagamento: 'Débito',   descricao: 'Limpeza dental',          lancamento: '21/07/2026 11:15', tipo: 'entrada', valor: 220 },
  { id: 'mc5', nome: 'Sangria',          formaPagamento: 'Dinheiro', descricao: 'Sangria para depósito',   lancamento: '21/07/2026 12:00', tipo: 'saida',   valor: 300 },
  { id: 'mc6', nome: 'Carlos Pereira',   formaPagamento: 'Pix',      descricao: 'Sessão psicologia',       lancamento: '21/07/2026 14:20', tipo: 'entrada', valor: 180 },
]

// ── Fluxo de caixa (próximos dias, com contas previstas) ─────────────────────
export const SALDO_BASE_FLUXO = 8420
export const MOCK_FLUXO_DIAS: CashFlowDay[] = [
  { id: '2026-07-21', data: '21/07/2026', lancamentos: 6, entradas: 810,  saidas: 386 },
  { id: '2026-07-22', data: '22/07/2026', lancamentos: 4, entradas: 640,  saidas: 0 },
  { id: '2026-07-23', data: '23/07/2026', lancamentos: 5, entradas: 520,  saidas: 1250 },
  { id: '2026-07-24', data: '24/07/2026', lancamentos: 3, entradas: 430,  saidas: 0 },
  { id: '2026-07-25', data: '25/07/2026', lancamentos: 7, entradas: 980,  saidas: 342 },
  { id: '2026-07-28', data: '28/07/2026', lancamentos: 4, entradas: 610,  saidas: 2100 },
  { id: '2026-07-31', data: '31/07/2026', lancamentos: 2, entradas: 0,    saidas: 4800 },
]

// ── Contas a pagar ───────────────────────────────────────────────────────────
export const MOCK_CONTAS_PAGAR: Payable[] = [
  { id: 'cp1', descricao: 'Aluguel da clínica',        categoria: 'Ocupação',     vencimento: '25/07/2026', fornecedor: 'Imobiliária Sol',      valor: 4800, status: 'pendente' },
  { id: 'cp2', descricao: 'Energia elétrica',          categoria: 'Utilidades',   vencimento: '23/07/2026', fornecedor: 'Energisa',             valor: 890,  status: 'pendente' },
  { id: 'cp3', descricao: 'Material odontológico',     categoria: 'Insumos',      vencimento: '15/07/2026', fornecedor: 'Dental Prime',         valor: 1250, status: 'vencido' },
  { id: 'cp4', descricao: 'Internet e telefonia',      categoria: 'Utilidades',   vencimento: '10/07/2026', pagamento: '10/07/2026', fornecedor: 'Vivo Empresas', valor: 320, status: 'pago' },
  { id: 'cp5', descricao: 'Folha — recepção',          categoria: 'Pessoal',      vencimento: '05/07/2026', pagamento: '05/07/2026', fornecedor: 'Folha interna', valor: 2100, status: 'pago' },
  { id: 'cp6', descricao: 'Manutenção do autoclave',   categoria: 'Manutenção',   vencimento: '28/07/2026', fornecedor: 'TecSaúde',             valor: 450,  status: 'pendente' },
]

// ── Contas a receber ─────────────────────────────────────────────────────────
export const MOCK_CONTAS_RECEBER: Receivable[] = [
  { id: 'cr1', descricao: 'Consulta — Maria Oliveira',    vencimento: '22/07/2026', forma: 'credito', origem: 'Consultas', valorBruto: 290, taxa: 9.57,  status: 'pendente' },
  { id: 'cr2', descricao: 'Repasse Unimed — junho',       vencimento: '25/07/2026', forma: 'ted',     origem: 'Convênio',  valorBruto: 3480, taxa: 0,    status: 'pendente' },
  { id: 'cr3', descricao: 'Pacote fisioterapia — Ana',    vencimento: '15/07/2026', recebimento: '15/07/2026', forma: 'pix', origem: 'Consultas', valorBruto: 600, taxa: 0, status: 'pago' },
  { id: 'cr4', descricao: 'Limpeza dental — Pedro',       vencimento: '08/07/2026', forma: 'boleto',  origem: 'Consultas', valorBruto: 220, taxa: 3.9,   status: 'vencido' },
  { id: 'cr5', descricao: 'Parcela 2/3 — plano ortodontia', vencimento: '30/07/2026', forma: 'credito', origem: 'Planos',  valorBruto: 380, taxa: 12.54, status: 'pendente' },
]

// ── Contas bancárias ─────────────────────────────────────────────────────────
export const MOCK_CONTAS_BANCARIAS: BankAccount[] = [
  { id: 'cb1', nome: 'BB — Conta PJ',    tipo: 'corrente', banco: 'Banco do Brasil', agencia: '1234-5', conta: '45.678-9',   titular: 'Neo Saúde LTDA', saldo: 12480.55, status: 'ativo', padrao: true },
  { id: 'cb2', nome: 'Nubank PJ',        tipo: 'corrente', banco: 'Nubank',          agencia: '0001',   conta: '9876543-2',  titular: 'Neo Saúde LTDA', saldo: 5320.10,  status: 'ativo' },
  { id: 'cb3', nome: 'Reserva Poupança', tipo: 'poupanca', banco: 'Caixa Econômica', agencia: '0402',   conta: '00123456-7', titular: 'Neo Saúde LTDA', saldo: 20150,    status: 'ativo' },
]

// ── Adquirentes ──────────────────────────────────────────────────────────────
export const MOCK_ADQUIRENTES: Acquirer[] = [
  {
    id: 'aq1', nome: 'Stone', bandeiras: ['Visa', 'Mastercard', 'Elo'],
    taxaCredito: 3.19, taxaDebito: 1.45, prazoRecebimento: 1, contaRepasseId: 'cb1', status: 'ativo',
    taxasParcelas: [
      { parcelas: 2, taxa: 3.59 }, { parcelas: 3, taxa: 3.99 },
      { parcelas: 6, taxa: 4.49 }, { parcelas: 12, taxa: 4.99 },
    ],
  },
  {
    id: 'aq2', nome: 'Cielo', bandeiras: ['Visa', 'Mastercard', 'Amex'],
    taxaCredito: 3.49, taxaDebito: 1.69, prazoRecebimento: 30, contaRepasseId: 'cb1', status: 'ativo',
    taxasParcelas: [
      { parcelas: 2, taxa: 3.89 }, { parcelas: 3, taxa: 4.19 }, { parcelas: 6, taxa: 4.69 },
    ],
  },
  { id: 'aq3', nome: 'PagSeguro', bandeiras: ['Visa', 'Mastercard', 'Hipercard'], taxaCredito: 3.79, taxaDebito: 1.99, prazoRecebimento: 14, contaRepasseId: 'cb2', status: 'inativo' },
]

// ── Sessão do caixa (mock mutável: abrir/fechar mudam este objeto) ───────────
export const MOCK_CAIXA_SESSAO: CashSession = {
  aberto: false,
  valorAbertura: 0,
}
