// ─────────────────────────────────────────────────────────────────────────────
// Tipos do DOMÍNIO (independentes do banco). Quando o schema Supabase existir,
// os services convertem Row (database.types.ts) → estes tipos.
//
// CONVENÇÕES DE IDENTIDADE (valem para todo o domínio):
//
// `id`        Chave técnica (UUID no banco). Usada em toda referência entre
//             entidades e NUNCA exibida ao usuário. Referência sempre por id —
//             nome muda, id não; guardar nome quebra o vínculo no rename.
//
// `code`      Referência HUMANA, sequencial por clínica ("PAC-000042"). É o que
//             a equipe fala em voz alta, o que vai no documento impresso e o que
//             o paciente informa no atendimento. Só nas entidades que aparecem
//             em documento ou são citadas verbalmente.
//
// `clinicId`  Tenant. Está em TODA entidade que pertence a uma clínica, mesmo
//             quando daria para chegar nela por join — a policy de RLS fica
//             direta e barata (`clinica_id = auth.jwt() ->> 'clinica_id'`).
//             Sem isso, uma clínica enxerga o prontuário da outra.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ramo da clínica. A maior parte do app é igual entre eles; o que muda é a
 * ficha clínica do paciente (odontograma, evolução, antropometria…).
 */
export type ClinicSpecialty =
  | 'dentistry'
  | 'physiotherapy'
  | 'nutrition'
  | 'psychology'
  | 'personal_training'

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_service' | 'completed' | 'canceled' | 'no_show'
export type ActiveStatus = 'active' | 'inactive'

export type Gender = 'male' | 'female'

export interface Patient {
  id: string
  clinicId: string
  /** Referência humana sequencial por clínica (PAC-000001). */
  code: string
  name: string           // nome completo (nome + sobrenome), usado nas listas
  cpf?: string           // 000.000.000-00
  phone: string
  insurance: string
  lastVisit: string   // dd/mm/aaaa
  status: ActiveStatus
  photo?: string        // URL do avatar (cai nas iniciais quando não houver)
  // Cadastro completo (opcionais — preenchidos pelo modal de novo paciente).
  sex?: Gender
  birthDate?: string    // dd/mm/aaaa
  email?: string
  whatsapp?: string
  cep?: string
  state?: string        // UF
  city?: string
  neighborhood?: string
  street?: string       // logradouro (rua) — exigido em documento e NFS-e
  number?: string
}

export interface Appointment {
  id: string
  clinicId: string
  time: string           // HH:mm
  patientId: string
  service: string    // tipo de atendimento (consulta, retorno, avaliação…)
  professionalId: string
  status: AppointmentStatus
}

/** Titulação acadêmica do currículo (ordem cronológica inversa na exibição). */
export interface EducationItem {
  course: string          // "Especialização em Endodontia"
  institution: string    // "UFS"
  year: string            // "2019"
}

/** Passagem profissional do currículo. */
export interface ExperienceItem {
  position: string          // "Dentista clínico"
  workplace: string          // "Clínica Sorriso — Aracaju/SE"
  period: string        // "2019 – atual"
}

export interface Professional {
  id: string
  clinicId: string
  /** Referência humana sequencial por clínica (PRO-000001). */
  code: string
  name: string
  specialty: string
  description?: string     // breve explicação da especialidade (lista de profissionais)
  rating?: number          // nota média de atendimento (0–5)
  license: string       // conselho + número (CRM, CRO, CREFITO…)
  color?: string           // cor de identificação (agenda, gráficos) — hex
  photo?: string           // URL do avatar (cai nas iniciais quando não houver)
  status: ActiveStatus
  // Dados pessoais (mesmo cadastro do paciente).
  sex?: Gender
  birthDate?: string    // dd/mm/aaaa
  email?: string
  phone?: string
  whatsapp?: string
  // Endereço.
  cep?: string
  state?: string        // UF
  city?: string
  neighborhood?: string
  number?: string
  // Currículo (padrão dos perfis de saúde: Doctoralia e afins).
  specializations?: string[]      // áreas de atuação (chips)
  education?: EducationItem[]       // formação acadêmica
  experiences?: ExperienceItem[]
  courses?: string[]               // cursos e certificações
  languages?: string[]
}

// ── Convênios aceitos pela clínica (aba do Administrativo) ───────────────────
export interface Insurance {
  id: string
  clinicId: string
  name: string
  ans?: string             // registro na ANS
  phone?: string
  email?: string
  payoutDays?: number  // em quantos dias o convênio repassa
  notes?: string
  status: ActiveStatus
}

// ── Orçamentos do paciente (aba do perfil) ───────────────────────────────────
export type QuoteStatus = 'pending' | 'approved'

/** Um tratamento dentro do orçamento (linha adicionada no editor). */
export interface QuoteItem {
  treatment: string
  professionalId?: string
  insurance?: string
  teeth?: string[]        // FDI (permanentes e decíduos)
  faces?: string[]         // M · O/I · D · V/L · P
  unitPrice: number    // R$ por tratamento (ou por dente, se multiplicado)
  multiplyPerTooth?: boolean
  amount: number            // valor final da linha
}

export interface Quote {
  id: string
  clinicId: string
  /** Referência humana sequencial por clínica (ORC-000001). */
  code: string
  patientId: string
  name: string             // "Plano de tratamento de ..."
  date: string             // dd/mm/aaaa
  status: QuoteStatus
  items: QuoteItem[]
  discount?: number        // R$ abatidos do subtotal
  installments?: number        // 1 = à vista (simulação; o plano real se define no aceite)
  notes?: string
}

/**
 * Uma linha do plano de pagamento definido no ACEITE do orçamento — o paciente
 * pode combinar mais de uma forma (entrada no cartão + resto no Pix). Cada
 * linha gera `installments` parcelas MENSAIS em Contas a Receber a partir de
 * `firstDueDate`; a soma das linhas precisa fechar com o total do orçamento.
 * O plano não é persistido no orçamento: ele se materializa nas parcelas.
 */
export interface PaymentPlanEntry {
  method: PaymentMethod
  amount: number           // R$ total desta forma (dividido entre as parcelas)
  installments: number     // 1 = à vista
  firstDueDate: string     // aaaa-mm-dd — vencimento da 1ª parcela
  /**
   * Obrigatório no cartão (crédito/débito), proibido fora dele. É o adquirente
   * que define `receivable.debtor`: sem ele o título nasce como dívida DO
   * PACIENTE e vai parar na Inadimplência por uma venda que a maquininha já
   * garantiu. O CHECK receivable_card_requires_acquirer_ck recusa a combinação.
   */
  acquirerId?: string
}

// ── Anamnese (aba do perfil do paciente) ─────────────────────────────────────
// Questionário de saúde no modelo sugerido pelos Conselhos Regionais de
// Odontologia: respostas fechadas + campos de detalhe quando a resposta pede.
export type YesNo = 'yes' | 'no'
export type YesNoUnknown = 'yes' | 'no' | 'unknown'
export type BloodPressure = 'normal' | 'high' | 'low' | 'controlled'
export type BleedingLevel = 'normal' | 'excessive'
export type HealingLevel = 'normal' | 'complicated'
export type GumBleeding = 'no' | 'yes' | 'during_brushing' | 'sometimes'
export type FlossUse = 'daily' | 'sometimes' | 'no'

export interface Anamnesis {
  clinicId: string
  patientId: string
  /** Última atualização — a ficha é revisada a cada retorno. */
  updatedAt: string   // dd/mm/aaaa

  // Saúde geral
  medications: YesNo
  medicationsDetails?: string      // posologia e dose
  allergy: YesNoUnknown
  allergyDetails?: string
  bloodPressure: BloodPressure
  heartCondition: YesNo
  heartConditionDetails?: string
  shortnessOfBreath: YesNo
  diabetes: YesNoUnknown
  bleeding: BleedingLevel
  healing: HealingLevel
  surgery: YesNo
  pregnant: YesNoUnknown
  pregnancyWeeks?: string
  healthIssues?: string         // texto livre

  // Saúde bucal
  chiefComplaint?: string
  anesthesiaReaction: YesNo
  anesthesiaReactionDetails?: string
  lastTreatment?: string
  toothGumPain: YesNo
  gumBleeding: GumBleeding
  badTasteDryMouth: YesNo
  brushingsPerDay?: string
  flossing: FlossUse
  jawPainClicking: YesNo
  grindsTeeth: YesNo
  faceSores: YesNo
  smokes: YesNo
  smokingAmount?: string
}

// ── Assinatura do SaaS (Configurações) ───────────────────────────────────────
// O que a CLÍNICA paga para usar o Neo Saúde — não confundir com o Financeiro,
// que é o caixa da clínica.
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled'
export type BillingCycle = 'monthly' | 'yearly'

export interface Subscription {
  plan: string                  // "Profissional"
  amount: number                  // R$ por ciclo
  cycle: BillingCycle
  status: SubscriptionStatus
  since: string                  // dd/mm/aaaa
  nextBilling: string        // dd/mm/aaaa
  /** Forma cadastrada para a cobrança recorrente. */
  paymentMethod?: string        // "Cartão Visa •••• 4242"
  /** Limites do plano contratado (o que o preço cobre). */
  includedProfessionals?: number
  professionalsInUse?: number
}

/** Uma fatura da assinatura (histórico de pagamentos ao SaaS). */
export interface SubscriptionInvoice {
  id: string
  clinicId: string
  /** Referência humana sequencial por clínica (FAT-000001). */
  code: string
  referenceMonth: string            // "Julho de 2026"
  dueDate: string             // dd/mm/aaaa
  paidAt?: string             // dd/mm/aaaa — vazio enquanto em aberto
  amount: number
  status: PaymentStatus          // reaproveita pago | pendente | vencido | cancelado
  paymentMethod?: string
}

// ── WhatsApp: conexão e automações (Configurações) ───────────────────────────
export type WhatsAppStatus = 'connected' | 'disconnected' | 'connecting'

export interface WhatsAppConnection {
  status: WhatsAppStatus
  phoneNumber?: string        // (79) 99999-0000 — preenchido quando conectado
  connectedAt?: string   // dd/mm/aaaa HH:mm
  /** Conteúdo do QR de pareamento (mock: string qualquer que vira o desenho). */
  qrCode?: string
}

/** Momento que dispara a mensagem automática. */
export type AutomationTrigger =
  | 'after_booking'
  | 'appointment_day'
  | 'no_show'
  | 'birthday'
  | 'billing'

export interface WhatsAppAutomation {
  trigger: AutomationTrigger
  status: ActiveStatus
  message: string
  /** Horário de disparo dos gatilhos por data (dia da consulta, aniversário…). */
  sendTime?: string       // HH:mm
}

// ── Prescrições e documentos do paciente (aba do perfil) ─────────────────────
export type PrescriptionType = 'prescription' | 'clinical_record' | 'certificate' | 'document'

export interface PrescribedMedication {
  name: string           // "Amoxicilina 500 mg"
  dosage: string      // "1 cápsula a cada 8h por 7 dias"
  quantity?: string    // "1 caixa"
}

export interface Prescription {
  id: string
  clinicId: string
  /** Referência humana sequencial por clínica (REC-000001). */
  code: string
  patientId: string
  type: PrescriptionType
  title: string         // "Receituário", "Atestado — 2 dias", livre no documento
  date: string           // dd/mm/aaaa
  professionalId?: string
  medications?: PrescribedMedication[]  // só receituário
  text?: string         // prontuário / atestado / documento
  notes?: string
}

// ── Cargos e acesso às páginas (aba do Administrativo) ───────────────────────
export type AppPage =
  | 'dashboard' | 'schedule' | 'patients' | 'professionals'
  | 'finance' | 'admin' | 'settings'

export interface Role {
  id: string
  clinicId: string
  name: string
  /** Páginas que o cargo pode acessar (switches da aba Cargos). */
  pages: AppPage[]
}

// ── Colaboradores (membros da clínica com login) — aba do Administrativo ──────
export type MembershipStatus = 'invited' | 'active' | 'suspended'

export interface Collaborator {
  /** Id do vínculo clinic_user (chave das ações de cargo/status). */
  clinicUserId: string
  userId: string
  name: string           // full_name; cai no e-mail quando vazio
  email: string
  photo?: string         // avatar_url (cai nas iniciais quando não houver)
  phone?: string
  roleId: string         // access_profile_id — o cargo
  roleName: string
  status: MembershipStatus
  // Cadastro completo (dados da clínica sobre o funcionário — vivem em clinic_user).
  sex?: Gender
  birthDate?: string    // dd/mm/aaaa
  whatsapp?: string
  cep?: string
  state?: string        // UF
  city?: string
  neighborhood?: string
  number?: string
}

// ── Comissões dos profissionais (aba do Administrativo) ──────────────────────
export type CommissionType = 'percentage' | 'fixed'
/** Base do percentual: sobre o que o paciente PAGOU (recebido — protege o
 *  fluxo de caixa) ou sobre a produção (realizado, mesmo sem recebimento). */
export type CommissionBase = 'received' | 'performed'
export type CommissionPayout = 'fixed_day' | 'per_visit'

export interface ProfessionalCommission {
  clinicId: string
  professionalId: string
  type: CommissionType
  amount: number             // percentual (0–100) ou R$ por procedimento
  base: CommissionBase
  payout: CommissionPayout
  payoutDay?: number       // 1–28 (quando repasse = dia_fixo)
  status: ActiveStatus
  notes?: string
}

/** Endereço padrão dos cadastros (consultório, responsável…). */
export interface Address {
  cep: string
  state: string         // UF
  city: string
  neighborhood: string
  street: string
  number: string
}

/** Dados do consultório (Administrativo → Inicial, coluna esquerda). */
export interface ClinicData extends Address {
  /** O TENANT: é este id que aparece como `clinicId` em todas as outras entidades. */
  id: string
  /** Ramo de atuação — define as telas específicas do prontuário. */
  specialty: ClinicSpecialty
  photo?: string          // URL da imagem (upload local no modo mock)
  name: string
  cnpj: string
  email: string
  phone: string
}

// O RESPONSÁVEL TÉCNICO não tem tipo próprio: pela norma do conselho ele é
// inscrito no CRO, logo é um `Professional` marcado no banco com
// `is_technical_manager`. Ver clinicService.getTechnicalManager().

/** Sala de atendimento (Administrativo → Salas). */
export interface Room {
  id: string
  clinicId: string
  name: string
  photo?: string          // URL da imagem (upload local no modo mock)
}

/** Material/insumo de estoque (Administrativo → Materiais). */
export interface Material {
  id: string
  clinicId: string
  name: string           // ex.: Resina Fotopolimerizável A2
  photo?: string          // URL da imagem (upload local no modo mock)
  inStock: number
  minQuantity: number
  expiryDate?: string      // dd/mm/aaaa
  notes?: string    // ex.: Lote 123
}

/** Perfil do usuário logado (exibido no ResumeProfile do Dashboard). */
export interface UserProfile {
  id: string
  clinicId: string
  code: string         // referência humana exibida (ex.: NS-000016)
  /** Profissional correspondente — liga o usuário logado ao próprio perfil. */
  professionalId?: string
  photo?: string          // URL do avatar (cai nas iniciais quando não houver)
  name: string
  specialty: string
  license: string       // conselho + número (CRM, CRO, CREFITO…)
  email: string
  phone: string
  address: string       // logradouro + número/complemento
  city: string         // cidade/UF
  cep: string
  memberSince: string    // dd/mm/aaaa
}

// ── Agenda (consultas datadas) ───────────────────────────────────────────────
// Uma consulta é um evento ÚNICO com data — não recorrência semanal (decisão
// do dono). Vive na tabela `appointment`, a mesma que o Dashboard conta.
export interface AgendaAppointment {
  id: string
  clinicId: string
  patientId: string
  activity: string      // tipo de atendimento/etiqueta (define a cor; vai no tooltip)
  date: string          // aaaa-mm-dd — o dia da consulta
  startTime: string     // '07:00'
  endTime: string        // '08:00'
  professionalId: string
  room?: string
  color?: string           // cor da atividade (hex)
  status: AppointmentStatus
  notes?: string
  /** Enviar mensagem de confirmação ao paciente. */
  sendConfirmation?: boolean
}

// ── Documentos do paciente (aba do perfil) ───────────────────────────────────
export interface PatientDocument {
  id: string
  clinicId: string
  patientId: string
  name: string           // título dado pelo usuário
  description?: string
  fileName: string        // nome do arquivo original
  type: string           // extensão (PDF, JPG…)
  size: string        // "1,2 MB"
  uploadedAt: string      // dd/mm/aaaa
  /** URL de visualização (object URL na sessão; no Supabase, URL do storage). */
  url?: string
}

// ── Histórico de consultas (timeline do perfil do paciente) ──────────────────
export interface UsedMaterial {
  name: string
  quantity: string     // "2 un", "5 ml"…
}

export interface AppointmentHistory {
  id: string
  clinicId: string
  patientId: string
  date: string           // dd/mm/aaaa
  time: string           // HH:mm
  service: string    // tipo (Consulta clínica, Retorno…)
  professionalId: string
  procedures: string[]          // o que foi feito na consulta
  materials?: UsedMaterial[]  // exibidos ao expandir
  notes?: string
  duration?: string       // "40 min"
}

// ── Tratamentos / odontograma (aba do perfil do paciente) ────────────────────
/** Situação do tratamento no dente (colore o odontograma). */
export type ToothStatus = 'open' | 'finished' | 'extracted'

/** Um PROCEDIMENTO (sessão) de um tratamento — o que foi feito num dia. */
/**
 * O que aconteceu com o DINHEIRO de um procedimento executado. As três formas
 * de não cobrar são estados distintos de propósito: 'covered' = a dívida já
 * nasceu na aprovação do orçamento; 'unbilled' = ainda vai virar cobrança
 * (convênio, ou sem valor); 'not_billable' = a clínica decidiu não cobrar e
 * escreveu por quê. Confundi-las é o que produz cobrança indevida.
 */
export type SessionBillingStatus = 'unbilled' | 'billed' | 'covered' | 'not_billable'

/** Uma parcela do plano de repasse do cartão (prévia e realidade têm o mesmo formato). */
export interface SessionInstallment {
  number: number
  count: number
  dueDate: string        // dd/mm/aaaa — data prevista de REPASSE, não de cobrança
  grossAmount: number
  fee: number
  netAmount: number
}

/**
 * O que vai acontecer com o dinheiro se o procedimento for salvo agora — a
 * frase que o diálogo de salvamento mostra. Vem inteira do banco (RPC
 * preview_session_billing), pela MESMA escada que decide na hora de gravar:
 * o dentista não tem permissão de Financeiro e, calculada no navegador dele,
 * a resposta sobre "existe contrato em aberto?" viria sempre vazia.
 */
export interface SessionBillingPreview {
  status: SessionBillingStatus
  /** Contrato que cobre o procedimento (só em 'covered'). */
  quoteId?: string
  quoteCode?: string
  /** Vencimento do título que vai nascer (só em 'billed'), dd/mm/aaaa. */
  dueDate?: string
  /**
   * Contrato aprovado JÁ QUITADO que segurou o procedimento em "A faturar".
   * Não cobrar sozinho é proposital: o paciente já pagou aquele plano, e o
   * procedimento pode estar dentro dele — quem decide é gente.
   */
  pendingQuoteCode?: string
  /** Parcelas do cartão, quando a forma escolhida passa por adquirente. */
  installments: SessionInstallment[]
}

/** Escolha de cobrança feita no diálogo de salvamento do procedimento. */
export interface SessionBillingChoice {
  /** Vencimento do título (padrão: a data do procedimento). */
  dueDate?: string        // dd/mm/aaaa
  /** Preenchido = cortesia/garantia: não gera título e o motivo fica registrado. */
  notBillableReason?: string
  method?: PaymentMethod
  acquirerId?: string
  installments?: number
}

export interface TreatmentSession {
  id: string
  description?: string     // nome do procedimento (ex.: "Abertura e instrumentação")
  date: string           // dd/mm/aaaa
  professionalId?: string
  teeth?: string[]      // dentes trabalhados (FDI)
  actions: string[]        // etapas/sinalizações realizadas nesta sessão
  materials?: UsedMaterial[]
  notes?: string
  /** Valor cobrado por este procedimento — o tratamento soma os valores. */
  amount?: number
  /** Snapshot do odontograma no fim do procedimento — reabre a ficha marcada. */
  odontogram?: Record<string, unknown>
}

/**
 * Linha da aba "A faturar": procedimento EXECUTADO, com valor, que não virou
 * título nem contrato. É a rede de segurança do módulo — dinheiro que a clínica
 * produziu e ninguém cobrou.
 */
export interface UnbilledSession {
  id: string
  clinicId: string
  patientId: string
  patientName: string
  /** Paciente de convênio: a trava que impediu a cobrança automática. */
  hasInsurance: boolean
  /**
   * Contrato aprovado e QUITADO com valor de plano ainda não consumido. É o
   * motivo mais delicado da lista: cobrar sem conferir é cobrar de novo o que
   * o paciente já pagou.
   */
  pendingQuoteCode?: string
  treatmentId: string
  treatmentName: string
  description: string
  date: string           // dd/mm/aaaa
  professionalId?: string
  amount: number
}

/** Um procedimento na apuração de ganhos do profissional (RPC professional_earnings). */
export interface ProfessionalEarning {
  sessionId: string
  date: string           // dd/mm/aaaa
  dateIso: string
  patientId: string
  patientName: string
  description: string
  /** Valor EXECUTADO (base 'performed'). */
  amount: number
  billingStatus: SessionBillingStatus
  /** Quanto já entrou pelos títulos ligados a esta sessão (base 'received'). */
  receivedAmount: number
}

/** Orçado × convertido de UM profissional num mês (card "Comissões" do
 *  Dashboard) — RPC professional_quote_conversion. `converted` é sempre
 *  ≤ `quoted` (é a parte que já virou orçamento aprovado). */
export interface ProfessionalQuoteConversion {
  professionalId: string
  name: string
  photoUrl?: string
  quoted: number
  converted: number
}

/**
 * Tratamento = o GUARDA-CHUVA (1 por dente + procedimento), que pode atravessar
 * vários dias: cada dia é uma TreatmentSession (modelo Open Dental / evolução
 * clínica dos softwares odontológicos brasileiros). O dente no odontograma
 * colore pelo status daqui, estável entre sessões.
 */
export interface Treatment {
  id: string
  clinicId: string
  patientId: string
  /** Dentes envolvidos (mesclados dos procedimentos; vazio até o 1º). */
  tooth?: string
  procedure: string   // nome do tratamento (ex.: "Tratamento de canal")
  status: ToothStatus    // em_aberto ("In Process") | finalizado | extraido
  startedAt: string     // dd/mm/aaaa — criação do tratamento
  completedAt?: string   // dd/mm/aaaa — quando finalizado/extraído
  notes?: string
  sessions: TreatmentSession[]
}

// ── Pagamentos (aba do perfil do paciente) ───────────────────────────────────
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'canceled'
export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'boleto' | 'check' | 'pix' | 'wire'

/** Uma forma de pagamento dentro de um recebimento (pode haver mais de uma). */
export interface PaymentEntry {
  method: PaymentMethod
  amount: number          // R$
  date?: string          // dd/mm/aaaa do recebimento
  cardBrand?: string      // Visa, Mastercard… (cartões)
  authorizationCode?: string   // código de autorização da operadora
  nsu?: string           // NSU da transação
  installments?: number      // crédito parcelado
}

/** Item de tratamento cobrado dentro de um pagamento. */
export interface BilledTreatment {
  name: string
  professionalId: string
  amount: number          // R$
}

export interface Payment {
  id: string
  clinicId: string
  /** Referência humana sequencial por clínica (PAG-000001). */
  code: string
  patientId: string
  date: string           // dd/mm/aaaa
  description: string      // serviço cobrado
  amount: number          // total (R$)
  status: PaymentStatus
  entries: PaymentEntry[]
  /** Detalhamento dos tratamentos (exibido no modal de pagamento). */
  treatments?: BilledTreatment[]
}

// ── Tarefas (card do Dashboard + kanban) ─────────────────────────────────────
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  clinicId: string
  title: string
  priority: TaskPriority
  dueDate?: string         // dd/mm
  status: TaskStatus
}

// ── Leads / funil de contatos (kanban) ───────────────────────────────────────
export type LeadStatus = 'new' | 'negotiating' | 'scheduling' | 'converted' | 'lost'

export interface Lead {
  id: string
  clinicId: string
  name: string
  email?: string
  phone: string
  source: string         // Instagram, Google, Indicação, WhatsApp…
  interest: string      // serviço de interesse
  notes?: string
  createdAt: string       // dd/mm
  status: LeadStatus
  /** Paciente gerado por este lead (quando convertido) — vínculo lead→paciente. */
  patientId?: string
}

/** Uma entrada do histórico de UM lead (RPC list_lead_history) — mudança de
 *  status, observação editada, ou o cadastro em si. */
export interface LeadHistoryEntry {
  id: string
  createdAt: string        // ISO — a tela formata
  actorName?: string
  action: AuditAction
  changedFields: string[]
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
}

// ── Gráfico de consultas (Dashboard) ─────────────────────────────────────────
export type ChartPeriod = 'week' | 'month' | 'year'

/** Um ponto da série do gráfico: rótulo do eixo X + total de consultas. */
export interface SeriesPoint {
  label: string
  value: number
}

/** Um ponto da série financeira: ganhos e gastos (R$) no rótulo do eixo X. */
export interface FinancePoint {
  label: string
  income: number
  expenses: number
}

// ── Metas da clínica e as métricas do Dashboard ──────────────────────────────

/**
 * As quatro métricas que o dashboard compara contra meta. Os rótulos são
 * IGUAIS aos do enum `public.goal_metric` e às chaves de `dashboard_stats() ->
 * metrics`: quem grava a meta e quem lê o número indexam pelo mesmo nome.
 * Rótulo em português vive em `constants/goals.ts`.
 */
export type GoalMetric =
  | 'appointments_scheduled'
  | 'appointments_completed'
  | 'revenue'
  | 'expenses'

/**
 * As 12 metas de um ano, de Janeiro (índice 0) a Dezembro (índice 11).
 *
 * `null` numa posição é MÊS SEM META, e é diferente de zero: zero é um alvo
 * que a clínica escolheu ("gastar R$ 0 em janeiro") e null é a ausência de
 * escolha. O cartão do Dashboard mostra "Meta: não definida" só no null.
 *
 * O comprimento é sempre 12 — o CHECK `clinic_goal_monthly_shape_ck` garante
 * isso do lado do banco, e `goalsService` normaliza do lado de cá.
 */
export type MonthlyTargets = (number | null)[]

/**
 * Meta da clínica para UMA métrica em UM ano civil: uma linha por
 * (clínica, métrica, ano). Métrica sem linha no ano = nenhum mês tem meta —
 * a RPC `set_clinic_goals_year` APAGA a linha quando os 12 meses ficam em
 * branco, em vez de guardar um vetor de 12 nulls que não afirma nada.
 */
export interface Goal {
  id: string
  clinicId: string
  metric: GoalMetric
  /** Ano civil (2000..2100, pelo CHECK do banco). */
  year: number
  /** Alvo de cada mês em número CRU: reais em revenue/expenses, quantidade nas outras. */
  monthly: MonthlyTargets
}

/**
 * O trio que a RPC devolve por métrica.
 *
 * `previous` é null quando a comparação NÃO EXISTE, e isso é diferente de
 * zero — zero é um mês anterior real e vazio. Hoje as QUATRO métricas são de
 * fluxo e sempre têm mês anterior, então na prática o null não aparece; o tipo
 * o mantém porque quem some é a métrica, não a possibilidade (era
 * `active_patients`, estoque sem histórico de status, que o produzia).
 * `target` é null quando a clínica não definiu meta — nunca 0 (o banco proíbe
 * meta zerada justamente para que 0 não seja lido como "meta batida").
 */
export interface MetricComparison {
  current: number
  previous: number | null
  target: number | null
}

/**
 * O que o Dashboard mostra no topo: SÓ as métricas que têm meta.
 *
 * A interface tinha também quatro contadores operacionais soltos
 * (appointmentsToday, activePatients, pendingConfirmations, monthlyRevenue).
 * Eles saíram junto com os cartões que os exibiam — decisão do dono, que pediu
 * um Dashboard só de meta — e a RPC `dashboard_stats` foi podada para não
 * calculá-los mais. Por isso restou um campo só: repor qualquer um deles é
 * mexer no banco também, não é acrescentar uma linha aqui.
 */
export interface DashboardStats {
  /** Por métrica: mês corrente, mês anterior e meta. */
  metrics: Record<GoalMetric, MetricComparison>
}

// ── Página Financeiro (fluxo, contas, bancos e adquirentes) ──────────────────
export interface CashFlowDay {
  id: string               // aaaa-mm-dd (ordenável)
  date: string             // dd/mm/aaaa
  entryCount: number
  inflows: number
  outflows: number
}

export interface Payable {
  id: string
  clinicId: string
  /** Referência humana sequencial por clínica (CTP-000001). */
  code: string
  description: string
  category: string
  dueDate: string       // dd/mm/aaaa
  paidAt?: string       // dd/mm/aaaa (quando baixada)
  supplier: string
  amount: number
  status: PaymentStatus
  // Dados da baixa (modal "Confirmar Pagamento").
  paymentMethod?: PaymentMethod
  bankAccountId?: string
  paidAmount?: number
  notes?: string
}

export type ReceivableDebtor = 'payer' | 'acquirer'

export interface Receivable {
  id: string
  clinicId: string
  /** Referência humana sequencial por clínica (CTR-000001). */
  code: string
  description: string
  dueDate: string
  receivedAt?: string     // dd/mm/aaaa (quando quitada)
  method?: PaymentMethod
  source: string           // Consultas, Convênio, Vendas, Orçamentos…
  grossAmount: number
  fee: number             // R$ retido pela adquirente
  status: PaymentStatus
  // Origem comercial (parcelas nascidas de um orçamento aprovado).
  patientId?: string
  quoteId?: string
  installmentNumber?: number   // parcela k…
  installmentCount?: number    // …de N
  /** Adquirente que processa (cartões) — habilita a conciliação de repasse. */
  acquirerId?: string
  /**
   * QUEM DEVE. Coluna GERADA no banco a partir de `acquirerId`, então não pode
   * divergir dele. 'acquirer' = venda na maquininha, já garantida na
   * autorização: NUNCA vira inadimplência e a baixa acontece sozinha na data do
   * repasse. Cobrar o paciente por um título desses é erro grave — a aba
   * Inadimplência filtra por aqui, não pelo status.
   */
  debtor: ReceivableDebtor
  /** Procedimento que originou o título (1 sessão → N parcelas de cartão). */
  treatmentSessionId?: string
  // Dados da baixa (aceita recebimento PARCIAL: acumula até quitar o líquido).
  bankAccountId?: string
  receivedAmount?: number
  notes?: string
}

// ── Cobrança de inadimplentes (aba Inadimplência do Financeiro) ──────────────
export type CollectionChannel = 'whatsapp' | 'phone' | 'email'

/** Uma tentativa de cobrança registrada — a trilha do "já cobramos?". */
export interface CollectionAttempt {
  id: string
  clinicId: string
  patientId: string
  date: string             // dd/mm/aaaa
  channel: CollectionChannel
  /** Total em aberto no momento da cobrança (congela o contexto histórico). */
  amountCharged: number
  notes?: string
}

export type BankAccountType = 'checking' | 'savings' | 'cash'

export interface BankAccount {
  id: string
  clinicId: string
  name: string             // nome de exibição (ex.: "Inter — Conta PJ")
  type: BankAccountType
  bank?: string           // vazios quando tipo = caixa (conta interna)
  branch?: string
  accountNumber?: string
  holder?: string
  balance: number            // saldo inicial (R$)
  status: ActiveStatus
  isDefault?: boolean         // conta principal de recebimento
  notes?: string
}

/** Taxa de crédito parcelado da adquirente (% por nº de parcelas). */
export interface InstallmentRate {
  installments: number
  fee: number             // % sobre a venda
}

export interface Acquirer {
  id: string
  clinicId: string
  name: string             // Stone, Cielo…
  cardBrands: string[]
  creditFee: number      // % por venda no crédito à vista
  debitFee: number       // % por venda no débito
  installmentFees?: InstallmentRate[]   // crédito parcelado (2×, 3×…)
  settlementDays: number // D+N dias
  payoutAccountId?: string  // BankAccount que recebe os repasses
  status: ActiveStatus
  notes?: string
}


// ── Auditoria (trilha de ações — aba Administrativo → Auditoria) ─────────────
export type AuditAction = 'insert' | 'update' | 'delete'

/** Uma entrada da trilha de auditoria (uma escrita registrada por tg_audit). */
export interface AuditEntry {
  id: string
  createdAt: string        // ISO (com timezone) — formatado na tela
  actorId?: string
  actorName?: string       // vazio = ação do sistema
  action: AuditAction
  tableName: string        // nome cru da tabela (mapeado p/ rótulo pt na UI)
  recordId: string
  recordLabel?: string     // rótulo humano do registro, derivado do snapshot
  changedFields: string[]  // colunas alteradas (update)
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
}

/** Filtros da página de Auditoria. */
export interface AuditFilters {
  table?: string
  action?: AuditAction
  actorId?: string
  from?: string            // ISO date (aaaa-mm-dd)
  to?: string
  search?: string
}
