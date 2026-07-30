export type VoiceProvider = 'openai' | 'gemini'

export type CibellyListeningMode = 'patient' | 'general'

export type CibellyStatus = 'idle' | 'connecting' | 'listening' | 'error'

export interface CibellyToolContext {
  listeningMode: CibellyListeningMode | null
}

export interface CibellyActivity {
  id: number
  em: number
  tipo: 'dentista' | 'fala' | 'ferramenta' | 'erro'
  texto: string
  itemId?: string
  args?: string
  resultado?: string
}

export interface DocumentRequest {
  tipo: 'receita' | 'atestado' | 'comparecimento' | 'exame'
  medicamentos?: { nome: string; posologia: string; quantidade?: string }[]
  dias?: number
  texto?: string
  horaEntrada?: string
  horaSaida?: string
  exames?: string[]
  dentes?: number[]
  justificativa?: string
  observacoes?: string
  /** Só true na SEGUNDA chamada, depois de o dentista confirmar em voz a
   *  impressão da prévia que apareceu na tela. Ver emitirDocumento. */
  confirmado?: boolean
}

export interface MaterialUsage {
  nome: string
  quantidade: string
}

/** Um serviço dito pelo dentista, para virar item de orçamento — o preço
 *  NUNCA vem da fala, sempre do cadastro (Administrativo → Serviços). */
export interface TreatmentQuoteItemRequest {
  nome: string
  /** Dente(s) em FDI, quando o dentista mencionar. */
  dentes?: number[]
  /**
   * O preço do serviço vale POR DENTE ou é único para o conjunto?
   *
   * Não dá para inferir: o catálogo (`OdontoProcedure`) guarda só nome e preço,
   * e no editor manual isto é uma caixa que o dentista marca item a item (ver
   * BudgetsPanel). Uma restauração em dois dentes são dois procedimentos; uma
   * moldagem para dois dentes é um só. Só quem está com a boca na frente sabe.
   *
   * Ausente com 2+ dentes, `criarOrcamentoPaciente` assume POR DENTE — é o caso
   * mais comum e o que erra para o lado de não subfaturar — e manda a Cibelly
   * DIZER a suposição, para o dentista corrigir antes de confirmar.
   */
  porDente?: boolean
}

/**
 * "Cibelly, monta um orçamento de limpeza e restauração."
 *
 * Mesmo contrato de duas etapas do emitir_documento: sem `confirmado`, só
 * MONTA a prévia (nada salvo); com `confirmado: true`, salva no MESMO lugar
 * que o editor manual (BudgetsPanel/quotesService) e imprime.
 */
export interface TreatmentQuoteRequest {
  servicos: TreatmentQuoteItemRequest[]
  confirmado?: boolean
}

export interface QuoteRequest {
  material?: string
  quantidade?: string
  fornecedor?: string
  emFalta?: boolean
  confirmado?: boolean
}

/** "Poe X no carrinho" — o que a fala do dentista traz. */
export interface CartAddRequest {
  produto?: string
  quantidade?: number
  unidade?: string
  observacao?: string
}

/**
 * "Pede orçamento do carrinho."
 *
 * Duas etapas de propósito: sem `confirmado`, a ferramenta só MOSTRA o que
 * seria mandado e para quem. Mensagem para fornecedor é ação para fora — não
 * sai de uma frase mal ouvida.
 */
export interface CartQuoteRequest {
  confirmado?: boolean
}

export interface PatientMessageRequest {
  mensagem: string
  /**
   * Nome do paciente, quando NÃO é o que está aberto no odontograma.
   *
   * Omitido, o destinatário é o paciente em atendimento — que continua sendo
   * o caminho seguro e o caso comum. Preenchido, o cadastro é consultado por
   * nome e a escolha passa por resolverDestinatario (utils/messageRecipient),
   * que se recusa a escolher entre homônimos. NUNCA um número.
   */
  paciente?: string
  confirmado?: boolean
}

export interface PatientDirectoryRequest {
  busca?: string
  situacao?: 'ativos' | 'inativos' | 'todos'
}

export interface CibellyHandlers {
  aoConsultarPacientes?: (pedido?: PatientDirectoryRequest) => Promise<unknown>
  aoEmitirDocumento?: (pedido: DocumentRequest) => Promise<unknown>
  aoCriarOrcamentoPaciente?: (pedido: TreatmentQuoteRequest) => Promise<unknown>
  aoConsultarMateriais?: (busca?: string, somenteAcabando?: boolean) => Promise<unknown>
  aoRegistrarMaterial?: (materiais: MaterialUsage[]) => Promise<unknown>
  aoSolicitarOrcamento?: (pedido: QuoteRequest) => Promise<unknown>
  aoAdicionarAoCarrinho?: (pedido: CartAddRequest) => Promise<unknown>
  aoConsultarCarrinho?: () => Promise<unknown>
  aoPedirOrcamentoDoCarrinho?: (pedido: CartQuoteRequest) => Promise<unknown>
  aoEnviarMensagemPaciente?: (pedido: PatientMessageRequest) => Promise<unknown>
  aoConsultarAgenda?: (p: {
    paciente?: string
    data?: string
    hora?: string
    duracao?: number
    dias?: number
  }, context?: CibellyToolContext) => Promise<unknown>
  aoCancelarConsulta?: (p: {
    paciente?: string
    data: string
    hora?: string
    confirmado?: boolean
    ditoPeloDentista?: string
  }) => Promise<unknown>
  aoLerOdontograma?: (p: { dentes?: number[] }) => Promise<unknown>
  aoConsultarHistorico?: (p?: { data?: string; dente?: number }) => Promise<unknown>
  /** SÓ LEITURA — ver consultarFinanceiroPaciente em useCibellyGeneralTools.ts. */
  aoConsultarFinanceiro?: (p: {
    paciente?: string
    assunto?: 'em_aberto' | 'ultimo_pagamento' | 'a_faturar'
  }) => Promise<unknown>
  aoCriarLembrete?: (p: { texto: string }) => Promise<unknown>
  aoConcluirLembrete?: (p: { id: string }) => Promise<unknown>
  aoAgendar?: (p: {
    paciente?: string
    data: string
    hora: string
    duracao?: number
    servico?: string
    encaixe?: boolean
    sala?: string
    confirmaFimDeSemana?: boolean
    ditoPeloDentista?: string
    confirmaData?: boolean
  }) => Promise<unknown>
}
