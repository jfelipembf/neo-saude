import type { ToothProposalResult } from '@/lib/odontogramShell/toothFields'

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
}

export interface MaterialUsage {
  nome: string
  quantidade: string
}

export interface QuoteRequest {
  material?: string
  quantidade?: string
  fornecedor?: string
  emFalta?: boolean
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
  aoEmitirDocumento?: (pedido: DocumentRequest) => Promise<ToothProposalResult>
  aoConsultarMateriais?: (busca?: string, somenteAcabando?: boolean) => Promise<unknown>
  aoRegistrarMaterial?: (materiais: MaterialUsage[]) => Promise<unknown>
  aoSolicitarOrcamento?: (pedido: QuoteRequest) => Promise<unknown>
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
