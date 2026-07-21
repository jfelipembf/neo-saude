// ─────────────────────────────────────────────────────────────────────────────
// Tipos do DOMÍNIO (independentes do banco). Quando o schema Supabase existir,
// os services convertem Row (database.types.ts) → estes tipos.
// ─────────────────────────────────────────────────────────────────────────────

export type AppointmentStatus = 'agendada' | 'confirmada' | 'em_atendimento' | 'concluida' | 'cancelada' | 'faltou'
export type ActiveStatus = 'ativo' | 'inativo'

export type Gender = 'masculino' | 'feminino'

export interface Patient {
  id: string
  nome: string           // nome completo (nome + sobrenome), usado nas listas
  cpf?: string           // 000.000.000-00
  telefone: string
  convenio: string
  ultimaVisita: string   // dd/mm/aaaa
  status: ActiveStatus
  // Cadastro completo (opcionais — preenchidos pelo modal de novo paciente).
  sexo?: Gender
  nascimento?: string    // dd/mm/aaaa
  email?: string
  whatsapp?: string
  cep?: string
  estado?: string        // UF
  cidade?: string
  bairro?: string
  numero?: string
}

export interface Appointment {
  id: string
  hora: string           // HH:mm
  paciente: string
  atendimento: string    // tipo de atendimento (consulta, retorno, avaliação…)
  profissional: string
  status: AppointmentStatus
}

/** Titulação acadêmica do currículo (ordem cronológica inversa na exibição). */
export interface EducationItem {
  curso: string          // "Especialização em Endodontia"
  instituicao: string    // "UFS"
  ano: string            // "2019"
}

/** Passagem profissional do currículo. */
export interface ExperienceItem {
  cargo: string          // "Dentista clínico"
  local: string          // "Clínica Sorriso — Aracaju/SE"
  periodo: string        // "2019 – atual"
}

export interface Professional {
  id: string
  nome: string
  especialidade: string
  descricao?: string     // breve explicação da especialidade (lista de profissionais)
  nota?: number          // nota média de atendimento (0–5)
  registro: string       // conselho + número (CRM, CRO, CREFITO…)
  status: ActiveStatus
  // Dados pessoais (mesmo cadastro do paciente).
  sexo?: Gender
  nascimento?: string    // dd/mm/aaaa
  email?: string
  telefone?: string
  whatsapp?: string
  // Endereço.
  cep?: string
  estado?: string        // UF
  cidade?: string
  bairro?: string
  numero?: string
  // Currículo (padrão dos perfis de saúde: Doctoralia e afins).
  especializacoes?: string[]      // áreas de atuação (chips)
  formacao?: EducationItem[]       // formação acadêmica
  experiencias?: ExperienceItem[]
  cursos?: string[]               // cursos e certificações
  idiomas?: string[]
}

// ── Convênios aceitos pela clínica (aba do Administrativo) ───────────────────
export interface Insurance {
  id: string
  nome: string
  ans?: string             // registro na ANS
  telefone?: string
  email?: string
  prazoRepasseDias?: number  // em quantos dias o convênio repassa
  observacao?: string
  status: ActiveStatus
}

// ── Orçamentos do paciente (aba do perfil) ───────────────────────────────────
export type QuoteStatus = 'aguardando' | 'aprovado'

/** Um tratamento dentro do orçamento (linha adicionada no editor). */
export interface QuoteItem {
  tratamento: string
  profissional?: string
  convenio?: string
  dentes?: string[]        // FDI (permanentes e decíduos)
  faces?: string[]         // M · O/I · D · V/L · P
  valorUnitario: number    // R$ por tratamento (ou por dente, se multiplicado)
  multiplicaPorDente?: boolean
  valor: number            // valor final da linha
}

export interface Quote {
  id: string
  pacienteId: string
  nome: string             // "Plano de tratamento de ..."
  data: string             // dd/mm/aaaa
  status: QuoteStatus
  itens: QuoteItem[]
  desconto?: number        // R$ abatidos do subtotal
  parcelas?: number        // 1 = à vista
  observacao?: string
}

// ── Prescrições e documentos do paciente (aba do perfil) ─────────────────────
export type PrescriptionType = 'receituario' | 'prontuario' | 'atestado' | 'documento'

export interface PrescribedMedication {
  nome: string           // "Amoxicilina 500 mg"
  posologia: string      // "1 cápsula a cada 8h por 7 dias"
  quantidade?: string    // "1 caixa"
}

export interface Prescription {
  id: string
  pacienteId: string
  tipo: PrescriptionType
  titulo: string         // "Receituário", "Atestado — 2 dias", livre no documento
  data: string           // dd/mm/aaaa
  profissional?: string
  medicamentos?: PrescribedMedication[]  // só receituário
  texto?: string         // prontuário / atestado / documento
  observacao?: string
}

// ── Cargos e acesso às páginas (aba do Administrativo) ───────────────────────
export type AppPage =
  | 'dashboard' | 'agenda' | 'pacientes' | 'profissionais'
  | 'financeiro' | 'administrativo' | 'configuracoes'

export interface Role {
  id: string
  nome: string
  /** Páginas que o cargo pode acessar (switches da aba Cargos). */
  paginas: AppPage[]
}

// ── Comissões dos profissionais (aba do Administrativo) ──────────────────────
export type CommissionType = 'percentual' | 'valor_fixo'
/** Base do percentual: sobre o que o paciente PAGOU (recebido — protege o
 *  fluxo de caixa) ou sobre a produção (realizado, mesmo sem recebimento). */
export type CommissionBase = 'recebido' | 'realizado'
export type CommissionPayout = 'dia_fixo' | 'no_atendimento'

export interface ProfessionalCommission {
  profissionalId: string
  tipo: CommissionType
  valor: number             // percentual (0–100) ou R$ por procedimento
  base: CommissionBase
  repasse: CommissionPayout
  diaRepasse?: number       // 1–28 (quando repasse = dia_fixo)
  status: ActiveStatus
  observacao?: string
}

/** Endereço padrão dos cadastros (consultório, responsável…). */
export interface Address {
  cep: string
  estado: string         // UF
  cidade: string
  bairro: string
  rua: string
  numero: string
}

/** Dados do consultório (Administrativo → Inicial, coluna esquerda). */
export interface ClinicData extends Address {
  logo?: string          // URL da imagem (upload local no modo mock)
  nome: string
  cnpj: string
  email: string
  telefone: string
}

/** Responsável técnico do consultório (Administrativo → Inicial). */
export interface TechnicalManager extends Address {
  foto?: string
  nome: string
  sobrenome: string
  sexo?: Gender
  nascimento?: string    // dd/mm/aaaa
  telefone: string
  email: string
}

/** Sala de atendimento (Administrativo → Salas). */
export interface Room {
  id: string
  nome: string
  foto?: string          // URL da imagem (upload local no modo mock)
}

/** Material/insumo de estoque (Administrativo → Materiais). */
export interface Material {
  id: string
  nome: string           // ex.: Resina Fotopolimerizável A2
  foto?: string          // URL da imagem (upload local no modo mock)
  emEstoque: number
  qtdMinima: number
  validade?: string      // dd/mm/aaaa
  observacao?: string    // ex.: Lote 123
}

/** Perfil do usuário logado (exibido no ResumeProfile do Dashboard). */
export interface UserProfile {
  id: string             // código de exibição (ex.: NS-00016)
  nome: string
  especialidade: string
  registro: string       // conselho + número (CRM, CRO, CREFITO…)
  email: string
  telefone: string
  endereco: string       // logradouro + número/complemento
  cidade: string         // cidade/UF
  cep: string
  membroDesde: string    // dd/mm/aaaa
}

// ── Grade semanal de horários (agenda) ───────────────────────────────────────
export type ScheduleSlotStatus = 'ativa' | 'cancelada'

export interface ScheduleSlot {
  id: string
  paciente: string       // nome exibido no card
  atividade: string      // tipo de atendimento/etiqueta (define a cor; vai no tooltip)
  diaSemana: number      // 0 = Dom … 6 = Sáb (Date.getDay)
  horaInicio: string     // '07:00'
  horaFim: string        // '08:00'
  profissional: string
  sala?: string
  cor?: string           // cor da atividade (hex)
  status: ScheduleSlotStatus
  observacao?: string
  /** Enviar mensagem de confirmação ao paciente. */
  enviarConfirmacao?: boolean
}

// ── Documentos do paciente (aba do perfil) ───────────────────────────────────
export interface PatientDocument {
  id: string
  pacienteId: string
  nome: string           // título dado pelo usuário
  descricao?: string
  arquivo: string        // nome do arquivo original
  tipo: string           // extensão (PDF, JPG…)
  tamanho: string        // "1,2 MB"
  enviadoEm: string      // dd/mm/aaaa
  /** URL de visualização (object URL na sessão; no Supabase, URL do storage). */
  url?: string
}

// ── Histórico de consultas (timeline do perfil do paciente) ──────────────────
export interface UsedMaterial {
  nome: string
  quantidade: string     // "2 un", "5 ml"…
}

export interface AppointmentHistory {
  id: string
  pacienteId: string
  data: string           // dd/mm/aaaa
  hora: string           // HH:mm
  atendimento: string    // tipo (Consulta clínica, Retorno…)
  profissional: string
  procedimentos: string[]          // o que foi feito na consulta
  materiais?: UsedMaterial[]  // exibidos ao expandir
  observacao?: string
  duracao?: string       // "40 min"
}

// ── Tratamentos / odontograma (aba do perfil do paciente) ────────────────────
/** Situação do tratamento no dente (colore o odontograma). */
export type ToothStatus = 'em_aberto' | 'finalizado' | 'extraido'

/** Um PROCEDIMENTO (sessão) de um tratamento — o que foi feito num dia. */
export interface TreatmentSession {
  id: string
  descricao?: string     // nome do procedimento (ex.: "Abertura e instrumentação")
  data: string           // dd/mm/aaaa
  profissional?: string
  dentes?: string[]      // dentes trabalhados (FDI)
  acoes: string[]        // etapas/sinalizações realizadas nesta sessão
  materiais?: UsedMaterial[]
  observacao?: string
  /** Valor cobrado por este procedimento — o tratamento soma os valores. */
  valor?: number
  /** Snapshot do odontograma no fim do procedimento — reabre a ficha marcada. */
  odontograma?: Record<string, unknown>
}

/**
 * Tratamento = o GUARDA-CHUVA (1 por dente + procedimento), que pode atravessar
 * vários dias: cada dia é uma TreatmentSession (modelo Open Dental / evolução
 * clínica dos softwares odontológicos brasileiros). O dente no odontograma
 * colore pelo status daqui, estável entre sessões.
 */
export interface Treatment {
  id: string
  pacienteId: string
  /** Dentes envolvidos (mesclados dos procedimentos; vazio até o 1º). */
  dente?: string
  procedimento: string   // nome do tratamento (ex.: "Tratamento de canal")
  status: ToothStatus    // em_aberto ("In Process") | finalizado | extraido
  iniciadoEm: string     // dd/mm/aaaa — criação do tratamento
  concluidoEm?: string   // dd/mm/aaaa — quando finalizado/extraído
  observacao?: string
  sessoes: TreatmentSession[]
}

// ── Pagamentos (aba do perfil do paciente) ───────────────────────────────────
export type PaymentStatus = 'pago' | 'pendente' | 'vencido' | 'cancelado'
export type PaymentMethod = 'dinheiro' | 'credito' | 'debito' | 'boleto' | 'cheque' | 'pix' | 'ted'

/** Uma forma de pagamento dentro de um recebimento (pode haver mais de uma). */
export interface PaymentEntry {
  tipo: PaymentMethod
  valor: number          // R$
  data?: string          // dd/mm/aaaa do recebimento
  bandeira?: string      // Visa, Mastercard… (cartões)
  autorizacao?: string   // código de autorização da operadora
  nsu?: string           // NSU da transação
  parcelas?: number      // crédito parcelado
}

/** Item de tratamento cobrado dentro de um pagamento. */
export interface BilledTreatment {
  nome: string
  profissional: string
  valor: number          // R$
}

export interface Payment {
  id: string
  pacienteId: string
  data: string           // dd/mm/aaaa
  descricao: string      // serviço cobrado
  valor: number          // total (R$)
  status: PaymentStatus
  formas: PaymentEntry[]
  /** Detalhamento dos tratamentos (exibido no modal de pagamento). */
  tratamentos?: BilledTreatment[]
}

// ── Tarefas (card do Dashboard + kanban) ─────────────────────────────────────
export type TaskStatus = 'a_fazer' | 'em_andamento' | 'concluida'
export type TaskPriority = 'alta' | 'media' | 'baixa'

export interface Task {
  id: string
  titulo: string
  prioridade: TaskPriority
  prazo?: string         // dd/mm
  status: TaskStatus
}

// ── Lembretes (card do Dashboard) ────────────────────────────────────────────
export interface Reminder {
  id: string
  texto: string
  data?: string          // dd/mm (opcional)
  concluido: boolean
}

// ── Leads / funil de contatos (kanban) ───────────────────────────────────────
export type LeadStatus = 'novo_contato' | 'em_negociacao' | 'agendamento' | 'converteu' | 'perdeu'

export interface Lead {
  id: string
  nome: string
  telefone: string
  origem: string         // Instagram, Google, Indicação, WhatsApp…
  interesse: string      // serviço de interesse
  criadoEm: string       // dd/mm
  status: LeadStatus
}

// ── Gráfico de consultas (Dashboard) ─────────────────────────────────────────
export type ChartPeriod = 'semana' | 'mes' | 'ano'

/** Um ponto da série do gráfico: rótulo do eixo X + total de consultas. */
export interface SeriesPoint {
  rotulo: string
  valor: number
}

/** Um ponto da série financeira: ganhos e gastos (R$) no rótulo do eixo X. */
export interface FinancePoint {
  rotulo: string
  ganhos: number
  gastos: number
}

export interface DashboardStats {
  consultasHoje: number
  pacientesAtivos: number
  confirmacoesPendentes: number
  receitaMes: string
}

// ── Página Financeiro (caixa, fluxo, contas, bancos e adquirentes) ───────────
export interface CashMovement {
  id: string
  nome: string             // pagador/recebedor
  formaPagamento?: string
  descricao: string
  lancamento: string       // dd/mm/aaaa HH:mm
  tipo: 'entrada' | 'saida'
  valor: number            // R$ (sempre positivo; o tipo dá o sinal)
}

export interface CashFlowDay {
  id: string               // aaaa-mm-dd (ordenável)
  data: string             // dd/mm/aaaa
  lancamentos: number
  entradas: number
  saidas: number
}

export interface Payable {
  id: string
  descricao: string
  categoria: string
  vencimento: string       // dd/mm/aaaa
  pagamento?: string       // dd/mm/aaaa (quando baixada)
  fornecedor: string
  valor: number
  status: PaymentStatus
  // Dados da baixa (modal "Confirmar Pagamento").
  formaPagamento?: PaymentMethod
  contaBancariaId?: string
  valorPago?: number
  observacao?: string
}

export interface Receivable {
  id: string
  descricao: string
  vencimento: string
  recebimento?: string     // dd/mm/aaaa (quando quitada)
  forma?: PaymentMethod
  origem: string           // Consultas, Convênio, Vendas…
  valorBruto: number
  taxa: number             // R$ retido pela adquirente
  status: PaymentStatus
  // Dados da baixa (aceita recebimento PARCIAL: acumula até quitar o líquido).
  contaBancariaId?: string
  valorRecebido?: number
  observacao?: string
}

export type BankAccountType = 'corrente' | 'poupanca' | 'caixa'

export interface BankAccount {
  id: string
  nome: string             // nome de exibição (ex.: "Inter — Conta PJ")
  tipo: BankAccountType
  banco?: string           // vazios quando tipo = caixa (conta interna)
  agencia?: string
  conta?: string
  titular?: string
  saldo: number            // saldo inicial (R$)
  status: ActiveStatus
  padrao?: boolean         // conta principal de recebimento
  observacao?: string
}

/** Taxa de crédito parcelado da adquirente (% por nº de parcelas). */
export interface InstallmentRate {
  parcelas: number
  taxa: number             // % sobre a venda
}

export interface Acquirer {
  id: string
  nome: string             // Stone, Cielo…
  bandeiras: string[]
  taxaCredito: number      // % por venda no crédito à vista
  taxaDebito: number       // % por venda no débito
  taxasParcelas?: InstallmentRate[]   // crédito parcelado (2×, 3×…)
  prazoRecebimento: number // D+N dias
  contaRepasseId?: string  // BankAccount que recebe os repasses
  status: ActiveStatus
  observacao?: string
}

/** Sessão do caixa do dia (aberto/fechado + dados da abertura). */
export interface CashSession {
  aberto: boolean
  operador?: string
  abertoEm?: string        // dd/mm/aaaa HH:mm
  valorAbertura: number    // fundo de troco inicial (R$)
}
