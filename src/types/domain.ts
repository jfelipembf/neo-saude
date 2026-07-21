// ─────────────────────────────────────────────────────────────────────────────
// Tipos do DOMÍNIO (independentes do banco). Quando o schema Supabase existir,
// os services convertem Row (database.types.ts) → estes tipos.
// ─────────────────────────────────────────────────────────────────────────────

export type StatusConsulta = 'agendada' | 'confirmada' | 'em_atendimento' | 'concluida' | 'cancelada' | 'faltou'
export type StatusPaciente = 'ativo' | 'inativo'

export type SexoPaciente = 'masculino' | 'feminino'

export interface Paciente {
  id: string
  nome: string           // nome completo (nome + sobrenome), usado nas listas
  cpf?: string           // 000.000.000-00
  telefone: string
  convenio: string
  ultimaVisita: string   // dd/mm/aaaa
  status: StatusPaciente
  // Cadastro completo (opcionais — preenchidos pelo modal de novo paciente).
  sexo?: SexoPaciente
  nascimento?: string    // dd/mm/aaaa
  email?: string
  whatsapp?: string
  cep?: string
  estado?: string        // UF
  cidade?: string
  bairro?: string
  numero?: string
}

export interface Consulta {
  id: string
  hora: string           // HH:mm
  paciente: string
  atendimento: string    // tipo de atendimento (consulta, retorno, avaliação…)
  profissional: string
  status: StatusConsulta
}

export interface Profissional {
  id: string
  nome: string
  especialidade: string
  descricao?: string     // breve explicação da especialidade (lista de profissionais)
  nota?: number          // nota média de atendimento (0–5)
  registro: string       // conselho + número (CRM, CRO, CREFITO…)
  status: StatusPaciente
}

/** Endereço padrão dos cadastros (consultório, responsável…). */
export interface Endereco {
  cep: string
  estado: string         // UF
  cidade: string
  bairro: string
  rua: string
  numero: string
}

/** Dados do consultório (Administrativo → Inicial, coluna esquerda). */
export interface DadosConsultorio extends Endereco {
  logo?: string          // URL da imagem (upload local no modo mock)
  nome: string
  cnpj: string
  email: string
  telefone: string
}

/** Responsável técnico do consultório (Administrativo → Inicial). */
export interface ResponsavelTecnico extends Endereco {
  foto?: string
  nome: string
  sobrenome: string
  sexo?: SexoPaciente
  nascimento?: string    // dd/mm/aaaa
  telefone: string
  email: string
}

/** Sala de atendimento (Administrativo → Salas). */
export interface Sala {
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
export interface UsuarioPerfil {
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
export type StatusGradeSessao = 'ativa' | 'cancelada'

export interface GradeSessao {
  id: string
  paciente: string       // nome exibido no card
  atividade: string      // tipo de atendimento (define a cor; vai no tooltip)
  diaSemana: number      // 0 = Dom … 6 = Sáb (Date.getDay)
  horaInicio: string     // '07:00'
  horaFim: string        // '08:00'
  profissional: string
  sala?: string
  cor?: string           // cor da atividade (hex)
  status: StatusGradeSessao
}

// ── Documentos do paciente (aba do perfil) ───────────────────────────────────
export interface DocumentoPaciente {
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
export interface MaterialUtilizado {
  nome: string
  quantidade: string     // "2 un", "5 ml"…
}

export interface ConsultaHistorico {
  id: string
  pacienteId: string
  data: string           // dd/mm/aaaa
  hora: string           // HH:mm
  atendimento: string    // tipo (Consulta clínica, Retorno…)
  profissional: string
  procedimentos: string[]          // o que foi feito na consulta
  materiais?: MaterialUtilizado[]  // exibidos ao expandir
  observacoes?: string
  duracao?: string       // "40 min"
}

// ── Tratamentos / odontograma (aba do perfil do paciente) ────────────────────
/** Situação do tratamento no dente (colore o odontograma). */
export type StatusDente = 'em_aberto' | 'finalizado' | 'extraido'

export interface Tratamento {
  id: string
  pacienteId: string
  dente: string          // notação FDI ('11'…'48'; decíduos '51'…'85')
  procedimento: string   // o que foi feito no dente
  data: string           // dd/mm/aaaa
  status: StatusDente
  observacao?: string
}

// ── Pagamentos (aba do perfil do paciente) ───────────────────────────────────
export type StatusPagamento = 'pago' | 'pendente' | 'vencido' | 'cancelado'
export type TipoPagamento = 'dinheiro' | 'credito' | 'debito' | 'boleto' | 'cheque' | 'pix' | 'ted'

/** Uma forma de pagamento dentro de um recebimento (pode haver mais de uma). */
export interface FormaPagamento {
  tipo: TipoPagamento
  valor: number          // R$
  data?: string          // dd/mm/aaaa do recebimento
  bandeira?: string      // Visa, Mastercard… (cartões)
  autorizacao?: string   // código de autorização da operadora
  nsu?: string           // NSU da transação
  parcelas?: number      // crédito parcelado
}

/** Item de tratamento cobrado dentro de um pagamento. */
export interface TratamentoCobrado {
  nome: string
  profissional: string
  valor: number          // R$
}

export interface Pagamento {
  id: string
  pacienteId: string
  data: string           // dd/mm/aaaa
  descricao: string      // serviço cobrado
  valor: number          // total (R$)
  status: StatusPagamento
  formas: FormaPagamento[]
  /** Detalhamento dos tratamentos (exibido no modal de pagamento). */
  tratamentos?: TratamentoCobrado[]
}

// ── Tarefas (card do Dashboard + kanban) ─────────────────────────────────────
export type StatusTarefa = 'a_fazer' | 'em_andamento' | 'concluida'
export type PrioridadeTarefa = 'alta' | 'media' | 'baixa'

export interface Tarefa {
  id: string
  titulo: string
  prioridade: PrioridadeTarefa
  prazo?: string         // dd/mm
  status: StatusTarefa
}

// ── Lembretes (card do Dashboard) ────────────────────────────────────────────
export interface Lembrete {
  id: string
  texto: string
  data?: string          // dd/mm (opcional)
  concluido: boolean
}

// ── Leads / funil de contatos (kanban) ───────────────────────────────────────
export type StatusLead = 'novo_contato' | 'em_negociacao' | 'agendamento' | 'converteu' | 'perdeu'

export interface Lead {
  id: string
  nome: string
  telefone: string
  origem: string         // Instagram, Google, Indicação, WhatsApp…
  interesse: string      // serviço de interesse
  criadoEm: string       // dd/mm
  status: StatusLead
}

// ── Gráfico de consultas (Dashboard) ─────────────────────────────────────────
export type PeriodoGrafico = 'semana' | 'mes' | 'ano'

/** Um ponto da série do gráfico: rótulo do eixo X + total de consultas. */
export interface PontoSerie {
  rotulo: string
  valor: number
}

/** Um ponto da série financeira: ganhos e gastos (R$) no rótulo do eixo X. */
export interface PontoFinanceiro {
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
export interface MovimentoCaixa {
  id: string
  nome: string             // pagador/recebedor
  formaPagamento?: string
  descricao: string
  lancamento: string       // dd/mm/aaaa HH:mm
  tipo: 'entrada' | 'saida'
  valor: number            // R$ (sempre positivo; o tipo dá o sinal)
}

export interface FluxoCaixaDia {
  id: string               // aaaa-mm-dd (ordenável)
  data: string             // dd/mm/aaaa
  lancamentos: number
  entradas: number
  saidas: number
}

export interface ContaPagar {
  id: string
  descricao: string
  categoria: string
  vencimento: string       // dd/mm/aaaa
  pagamento?: string       // dd/mm/aaaa (quando baixada)
  fornecedor: string
  valor: number
  status: StatusPagamento
  // Dados da baixa (modal "Confirmar Pagamento").
  formaPagamento?: TipoPagamento
  contaBancariaId?: string
  valorPago?: number
  observacoes?: string
}

export interface ContaReceber {
  id: string
  descricao: string
  vencimento: string
  recebimento?: string     // dd/mm/aaaa (quando quitada)
  forma?: TipoPagamento
  origem: string           // Consultas, Convênio, Vendas…
  valorBruto: number
  taxa: number             // R$ retido pela adquirente
  status: StatusPagamento
  // Dados da baixa (aceita recebimento PARCIAL: acumula até quitar o líquido).
  contaBancariaId?: string
  valorRecebido?: number
  observacoes?: string
}

export type TipoContaBancaria = 'corrente' | 'poupanca' | 'caixa'

export interface ContaBancaria {
  id: string
  nome: string             // nome de exibição (ex.: "Inter — Conta PJ")
  tipo: TipoContaBancaria
  banco?: string           // vazios quando tipo = caixa (conta interna)
  agencia?: string
  conta?: string
  titular?: string
  saldo: number            // saldo inicial (R$)
  ativa: boolean
  padrao?: boolean         // conta principal de recebimento
  observacoes?: string
}

/** Taxa de crédito parcelado da adquirente (% por nº de parcelas). */
export interface TaxaParcela {
  parcelas: number
  taxa: number             // % sobre a venda
}

export interface Adquirente {
  id: string
  nome: string             // Stone, Cielo…
  bandeiras: string[]
  taxaCredito: number      // % por venda no crédito à vista
  taxaDebito: number       // % por venda no débito
  taxasParcelas?: TaxaParcela[]   // crédito parcelado (2×, 3×…)
  prazoRecebimento: number // D+N dias
  contaRepasseId?: string  // ContaBancaria que recebe os repasses
  status: 'ativo' | 'inativo'
  observacoes?: string
}

/** Sessão do caixa do dia (aberto/fechado + dados da abertura). */
export interface CaixaSessao {
  aberto: boolean
  operador?: string
  abertoEm?: string        // dd/mm/aaaa HH:mm
  valorAbertura: number    // fundo de troco inicial (R$)
}
