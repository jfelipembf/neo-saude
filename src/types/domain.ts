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
  | 'medicine'
  | 'nutrition'
  | 'psychology'
  | 'personal_training'

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_service' | 'completed' | 'canceled' | 'no_show'
// Uso interno deste módulo: as entidades expõem `status` já tipado.
type ActiveStatus = 'active' | 'inactive'

export type Gender = 'male' | 'female'

export interface Patient {
  id: string
  clinicId: string
  /** Referência humana sequencial por clínica (PAC-000001). */
  code: string
  name: string           // nome completo (nome + sobrenome), usado nas listas
  /** Nome comum: como a pessoa é geralmente chamada, quando difere do nome
   *  completo (ex.: "José Felipe" no cadastro, "Felipe" no dia a dia). */
  commonName?: string
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
  // ── TISS (beneficiário) ──
  /** Número da carteirinha na operadora — é ele que identifica a pessoa na
   *  guia, não o CPF. */
  /** Peso de referência do cadastro, em kg. O histórico por consulta fica em
   *  appointment.weight_kg — são papéis diferentes, não duplicata. */
  weightKg?: number
  /** Altura de referência do cadastro, em cm. */
  heightCm?: number
  /** IMC calculado PELO BANCO (coluna gerada) — nunca chega defasado do peso. */
  bmi?: number
  insuranceCard?: string
  /** Validade da carteirinha. Vencida na data do atendimento é glosa. */
  insuranceCardValidUntil?: string   // dd/mm/aaaa
  /** Nome do plano dentro da operadora (ex.: "Nacional Enfermaria"). */
  insurancePlan?: string
  /** Cartão Nacional de Saúde — opcional na maioria das guias. */
  cns?: string
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
  license: string       // conselho + número (CRM, CRO, CREFITO…) — texto impresso
  // ── TISS (executante) ──
  // Separados de `license` de propósito: sigla, número e UF vão em tags
  // DISTINTAS do XML, e extrair isso de um texto livre como "CRO/SE 12345"
  // seria adivinhação a cada emissão. `license` segue sendo o que se imprime.
  /** Sigla do conselho (CRM, CRO, CREFITO...). */
  council?: string
  /** UF do conselho. */
  councilState?: string
  /** CBO-S: ocupação do executante na Classificação Brasileira de Ocupações. */
  cbo?: string
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
/**
 * Um medicamento do catálogo da CMED/ANVISA.
 *
 * É o PRODUTO comercial (marca + apresentação); `substances` traz os princípios
 * ativos, que numa associação são mais de um. Sem posologia e sem indicação —
 * essas vivem na bula, que se abre por link (ver utils/anvisaBula).
 */
export interface DrugProduct {
  id: string
  /** Marca comercial. Num genérico, é o próprio princípio ativo. */
  name: string
  presentation?: string
  manufacturer?: string
  /** Princípios ativos. Mais de um quando é associação. */
  substances: string[]
  therapeuticClass?: string
  /** Genérico, Similar, Novo, Específico, Biológico, Fitoterápico. */
  productType?: string
  tarja?: string
  hospitalOnly: boolean
  anvisaRegistro?: string
}

/** Estado de uma entrada da lista de espera da agenda. */
export type WaitingListStatus = 'waiting' | 'scheduled' | 'canceled'

/**
 * Uma pessoa na LISTA DE ESPERA: quer ser atendida e não achou horário.
 *
 * O contato é copiado do cadastro na entrada e fica editável aqui — quem está
 * na fila é ligado quando vaga algo, e o telefone que vale é o que a pessoa
 * deu na hora. O NOME, ao contrário, vem sempre do cadastro: congelá-lo faria
 * a fila mostrar o nome antigo depois de uma correção.
 */
export interface WaitingListEntry {
  id: string
  clinicId: string
  patientId: string
  patientName: string
  insuranceId?: string
  insuranceName?: string
  email?: string
  mobilePhone?: string
  homePhone?: string
  notes?: string
  status: WaitingListStatus
  /** A consulta que tirou a pessoa da fila. */
  appointmentId?: string
  /** Entrada na fila (dd/mm/aaaa) — a ordem é esta, não a alfabética. */
  createdAt: string
}

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
  // ── TISS ──
  /** Código do PRESTADOR nesta operadora — é um por convênio, não o CNPJ. */
  providerCode?: string
  /** Versão do padrão TISS que ESTA operadora aceita. Operadoras migram em
   *  datas diferentes, então não dá para ter uma versão global da clínica. */
  tissVersion?: string
}

// ── Serviços / Contratos (Administrativo → Serviços) ─────────────────────────
// Cadastro UNIFICADO do que a clínica vende. Modalidade:
//   · common  = Contrato Comum   — vigência por Duração & Período (ex.: 12 meses)
//   · package = Pacote de sessões — nº de sessões + validade de uso
// price = Valor Base (total), parcelável em até maxInstallments. Base do PDV.
// MEDICINA vende ATO, não contrato:
//   · consultation = Consulta     — cobrada uma vez, sem vigência nem pacote
//   · procedure    = Procedimento — idem, valor próprio por procedimento
// `checkout_sale` só cria direito a sessões para 'package', então estas duas
// nascem como venda avulsa sem entitlement — é o comportamento certo.
export type ServiceModality = 'common' | 'package' | 'consultation' | 'procedure'

/** As duas modalidades de ATO (medicina): preço único, sem duração nem sessões. */
export const SINGLE_ACT_MODALITIES: ServiceModality[] = ['consultation', 'procedure']
export type DurationUnit    = 'days' | 'weeks' | 'months'

export interface Service {
  id: string
  clinicId: string
  name: string
  modality: ServiceModality
  price: number              // Valor Base (total do contrato/pacote)
  durationQty: number        // comum: duração da vigência; pacote: validade de uso
  durationUnit: DurationUnit  // Período
  sessions?: number          // pacote: quantidade de sessões
  weeklyLimit?: number       // comum: limite de sessões por semana (ex.: 2x)
  maxInstallments: number
  description?: string
  status: ActiveStatus       // inactive = fora do catálogo de novas vendas
  // ── TISS ──
  /** Código do procedimento na TUSS — é por ele que a operadora sabe o que
   *  foi feito. */
  tussCode?: string
  /** Tabela de origem do código (22 = procedimentos, 18/19/20 = materiais,
   *  medicamentos e taxas, 00 = própria da operadora). O mesmo número em
   *  tabelas diferentes é procedimento diferente. */
  tussTable?: string
}

// ── TISS: a guia (Financeiro → Guias TISS) ──────────────────────────────────
export type TissGuideKind   = 'consultation' | 'sp_sadt'
export type TissGuideStatus = 'draft' | 'issued' | 'canceled'

export interface TissGuideProcedure {
  id: string
  guideId: string
  serviceId?: string
  tussTable: string
  tussCode: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

/**
 * A guia é DOCUMENTO, não consulta: `frozen` guarda a cópia do cadastro no
 * momento da EMISSÃO. Enquanto é rascunho vem vazio e a tela lê o cadastro ao
 * vivo — ver tissGuidesService.ts.
 */
export interface TissGuide {
  id: string
  clinicId: string
  /** Referência humana sequencial por clínica (GUI-000001). */
  code: string
  kind: TissGuideKind
  status: TissGuideStatus
  insuranceId: string
  patientId: string
  professionalId: string
  appointmentId?: string
  treatmentSessionId?: string
  servedOn: string       // dd/mm/aaaa
  servedOnIso: string    // aaaa-mm-dd — usado na checagem de validade da carteirinha
  issuedOn?: string      // dd/mm/aaaa
  /** 1=primeira, 2=seguimento, 3=pré-natal, 4=por encaminhamento (tabela 50). */
  consultationType?: number
  /** 0=não, 1=trabalho, 2=trânsito, 9=outros (tabela 36). */
  accidentIndication: number
  notes?: string
  total: number
  frozen: {
    providerCode?: string
    cnes?: string
    insuranceAns?: string
    patientName?: string
    patientCard?: string
    patientCns?: string
    professionalName?: string
    council?: string
    councilNumber?: string
    councilState?: string
    cbo?: string
  }
  procedimentos: TissGuideProcedure[]
}

/** Quanto UMA operadora paga por UM serviço. A mesma consulta vale diferente em
 *  cada convênio, e nenhum desses valores é o preço particular. */
export interface InsuranceServicePrice {
  id: string
  clinicId: string
  insuranceId: string
  serviceId: string
  price: number
}

// ── Ponto de Venda (carrinho do perfil do paciente) ──────────────────────────
export interface SaleItem {
  id: string
  serviceId: string
  name: string       // congelado do catálogo no momento da venda
  price: number       // congelado — preço unitário
  quantity: number
  amount: number       // price * quantity
}

export interface Sale {
  id: string
  clinicId: string
  patientId: string
  saleDate: string     // dd/mm/aaaa
  discount: number
  itemsTotal: number
  total: number
  items: SaleItem[]
}

/**
 * O que o direito comprado dá ao paciente — cópia de `service.modality` no
 * momento da venda (enum public.entitlement_kind). Editar o serviço depois NÃO
 * muda direito já vendido, por isso é cópia e não join.
 *   · package   = pacote de N sessões: o teto é a quantidade.
 *   · recurring = Contrato Comum (a mensalidade): o teto é a VALIDADE, contido
 *                 por `service.weeklyLimit` na matrícula em turma. Converter a
 *                 mensalidade em sessões daria um número arbitrário (erra em
 *                 mês de 5 semanas) — por isso é um tipo próprio, não um pacote.
 */
export type EntitlementKind = 'package' | 'recurring'

/**
 * Direito de UM paciente a sessões de um serviço comprado (checkout_sale).
 * `remaining` já vem calculado no service (não é mantido por trigger — ver
 * comment da tabela): total - used - scheduled.
 */
export interface PatientServiceEntitlement {
  id: string
  serviceId: string
  serviceName: string
  kind: EntitlementKind
  /**
   * null no `recurring`: a mensalidade não compra uma quantidade de sessões, e
   * o banco grava total_sessions NULL (CHECK entitlement_kind_shape_ck). Zero
   * seria mentira — diria "pacote sem sessão nenhuma".
   */
  totalSessions: number | null
  /** Contam nos DOIS tipos: quantas sessões o paciente já fez / tem marcadas é
   *  informação útil mesmo no recorrente, onde não são teto. */
  usedSessions: number
  scheduledSessions: number
  /**
   * null no `recurring` pelo mesmo motivo de totalSessions: sem teto não existe
   * "saldo restante". Quem diz se o direito ainda vale é `expiresAt` (ver
   * utils/entitlements.isEntitlementActive).
   */
  remaining: number | null
  purchasedAt: string   // dd/mm/aaaa
  expiresAt?: string     // dd/mm/aaaa — undefined = sem validade de uso
}

// ── Testes de fisioterapia (Administrativo → Testes + aba Testes do paciente) ─
export interface PhysioTestLevel {
  id: string
  name: string
  description: string
  /**
   * Faixa de escore do nível — [minScore, maxScore] FECHADA dos dois lados;
   * `undefined` é lado ABERTO, não zero ("< 10 segundos" só tem maxScore,
   * "≥ 30 segundos" só tem minScore).
   *
   * Nível SEM nenhum dos dois é qualitativo (GMFCS, PEDI, PERFECT, Índice de
   * Ritchie): não existe corte numérico publicado, então ninguém classifica
   * sozinho — quem escolhe o nível é o profissional.
   */
  minScore?: number
  maxScore?: number
}

/** scale = interpretação por pontuação/tempo (a maioria dos testes). goniometry
 *  = o goniômetro digital — foto + 3 pontos arrastáveis (A·vértice·C), ângulo
 *  entre os dois segmentos calculado ao vivo. O CADASTRO (Administrativo →
 *  Testes) só define nome/instruções/níveis; a medição em si (foto + pontos)
 *  acontece na aplicação ao paciente (aba Testes do perfil), não no catálogo. */
export type TestKind = 'scale' | 'goniometry'

/** Ponto percentual (0–100) de uma foto do goniômetro digital — não pixel,
 *  para acompanhar a foto em qualquer tamanho de tela (ver utils/goniometry). */
export interface GoniometryPoint { x: number; y: number }
export type GoniometryPoints = [GoniometryPoint, GoniometryPoint, GoniometryPoint]

/**
 * De onde sai o escore da aplicação (enum `physio_scoring_kind`):
 *   · manual    = a tela informa o valor medido — segundos no TUG, metros no
 *                 TC6, o total que o profissional somou no papel. É o DEFAULT, e
 *                 é o que mantém funcionando todo teste que não tem item.
 *   · sum_items = o BANCO soma as respostas item a item e deriva a faixa
 *                 sozinho, ignorando o escore e a faixa que a tela mandar. Aqui
 *                 a aplicação precisa vir COMPLETA: 13 dos 14 itens do Berg
 *                 somam menos e classificariam o paciente numa faixa de risco
 *                 diferente da real, então o banco recusa.
 */
export type TestScoringKind = 'manual' | 'sum_items'

/**
 * Como o item recebe resposta (enum `physio_item_input_kind`). A distinção é de
 * SEGURANÇA, não de desenho de tela: em 'options' os pontos saem do catálogo e
 * o banco sobrescreve o que o cliente enviar (senão daria para inflar o próprio
 * escore); em 'number' quem decide o valor é o profissional que digita.
 */
export type TestItemInputKind = 'options' | 'number'

/** Uma alternativa de resposta fechada de um item do instrumento. */
export interface PhysioTestItemOption {
  id: string
  label: string          // "Capaz de permanecer em pé com segurança por 2 minutos"
  /** Quanto esta alternativa soma no escore. Fracionário existe: o "1+" da
   *  Ashworth vale 1,5 para caber entre 1 e 2 sem quebrar a ordem numérica —
   *  por isso `points` é numeric no banco e number aqui, nunca inteiro. */
  points: number
}

/**
 * Uma pergunta do instrumento — os 14 itens do Berg, as 24 afirmações do
 * Roland-Morris. Instrumento que classifica UM segmento por aplicação (Ashworth,
 * Oxford) tem UM item só: o "somatório" é o próprio grau, e somar graus de
 * músculos diferentes inventaria um número que o instrumento não define.
 *
 * A ORDEM DO ARRAY é o `sort_order` do banco — mesma convenção de
 * PhysioTestLevel: o service lê ordenado e regrava o índice. Um campo
 * `sortOrder` aqui seria um segundo lugar para a mesma verdade divergir.
 */
export interface PhysioTestItem {
  id: string
  /** Identificador estável do item DENTRO do teste ("berg_01"). É a chave do
   *  payload de respostas (ver TestItemAnswers) justamente para a redação do
   *  label poder ser corrigida sem quebrar tela nem histórico. */
  code: string
  label: string
  /** Instrução de aplicação do item (como cronometrar, que distância usar) —
   *  ausente quando o enunciado já basta sozinho. */
  help?: string
  inputKind: TestItemInputKind
  /** Vazio quando inputKind = 'number': não há alternativa a escolher, o
   *  profissional digita o valor. */
  options: PhysioTestItemOption[]
}

export interface PhysioTest {
  id: string
  clinicId: string
  name: string
  kind: TestKind
  /** Imagem ilustrativa do teste (mesmo cadastro para os dois kinds). */
  imageUrl?: string
  /** PATH bruto (não assinado) da mesma imagem — só usado ao EDITAR o teste:
   *  se a foto não for trocada, é o que deve ser regravado (salvar imageUrl,
   *  que é uma URL assinada, corromperia a coluna após expirar em 1h). */
  imagePath?: string
  /** Neurológica, Ortopédica, Respiratória... (ver constants/testSpecialty). Texto
   *  livre: a lista fixa é só sugestão — o cadastro aceita uma especialização própria. */
  specialty: string
  instructions?: string
  levels: PhysioTestLevel[]
  /** Motor de escore do teste — ver TestScoringKind. */
  scoringKind: TestScoringKind
  /**
   * Perguntas do instrumento, em ordem. VAZIO é o caso comum e não é falha de
   * cadastro: TUG, TC6 e toda a goniometria pontuam pelo valor medido, sem item
   * nenhum. Só teste com item pode ser 'sum_items'.
   */
  items: PhysioTestItem[]
  /** true = teste de referência que veio pronto no sistema — só edita, não
   *  exclui. false = teste personalizado da própria clínica, pode excluir
   *  (se ainda não tiver sido aplicado a nenhum paciente). */
  isSeed: boolean
}

/** Teste do catálogo fixado no sidenav de UM paciente (aba Testes do perfil). */
export interface PatientTest {
  id: string
  testId: string
}

/**
 * UMA resposta de uma aplicação, com o texto do catálogo CONGELADO no momento
 * da gravação (o banco copia por trigger; não é join).
 *
 * O congelamento é o ponto do desenho: o catálogo é editável e vive mais que o
 * prontuário. Lendo por join, corrigir a redação de um item em 2027 reescreveria
 * o que o paciente respondeu em 2026, e repontuar uma opção reescreveria
 * retroativamente a curva de evolução dele.
 *
 * A ORDEM DO ARRAY é a do item no teste (o sort_order também vem congelado).
 */
export interface PatientTestResultItem {
  id: string
  /** "berg_01" — congelado junto, para o relatório continuar agrupando por item
   *  mesmo depois de o item sair do catálogo. */
  itemCode: string
  /** Enunciado como estava NO DIA da aplicação. */
  itemLabel: string
  /** Alternativa escolhida, como estava no dia. Ausente no item numérico, que
   *  não tem opção — o que ele registrou está inteiro em `points`. */
  optionLabel?: string
  /** Quanto ESTA resposta valeu. É a parcela que compõe PatientTestResult.score
   *  e precisa continuar somando o mesmo total depois de o catálogo mudar. */
  points: number
  /**
   * Ponteiros VIVOS para o catálogo — servem só para pré-selecionar a resposta
   * ao corrigir a aplicação. Ficam undefined quando o item (ou a opção) foi
   * apagado do catálogo depois desta aplicação: as FKs são ON DELETE SET NULL,
   * porque apagar item do catálogo não pode apagar nem travar prontuário. A
   * tela nunca deve depender deles para EXIBIR — para isso existe o texto
   * congelado acima.
   */
  itemId?: string
  optionId?: string
}

/**
 * Resposta a UM item no ENVIO da aplicação (RPC save_patient_test_result).
 * União e não um objeto com os dois campos opcionais porque o par é exclusivo,
 * e a exclusividade é a regra de segurança: item 'options' manda só a opção
 * escolhida (mandar `points` junto não adianta — o banco sobrescreve pelo valor
 * do catálogo), item 'number' manda só o valor digitado.
 */
export type TestItemAnswer = { optionId: string } | { points: number }

/**
 * As respostas de uma aplicação inteira, indexadas pelo `code` do item — não
 * pelo id: o code é a referência estável e é por ele que o banco procura.
 * O envio é SEMPRE a aplicação completa: item que não vier no mapa é apagado da
 * aplicação, e em teste 'sum_items' faltar item é erro (não silêncio).
 */
export type TestItemAnswers = Record<string, TestItemAnswer>

/** Uma aplicação registrada de um teste a um paciente, com o nível atingido —
 *  nome/descrição do nível vêm CONGELADOS (não mudam se o catálogo mudar depois). */
export interface PatientTestResult {
  id: string
  testId: string
  professionalId?: string
  levelId?: string
  levelName: string
  levelDescription: string
  /**
   * Valor CRU medido nesta aplicação, na unidade do instrumento: segundos
   * (TUG), pontos (Berg), metros (TC6), graus (goniometria). É o escore de
   * QUALQUER kind — `measured_angle` virou espelho depreciado, mantido no
   * banco por trigger só enquanto a coluna existir, e a tela não lê mais.
   * Ausente nas aplicações antigas (registradas antes do campo de resultado)
   * e nos testes qualitativos, onde só existe o nível.
   */
  score?: number
  /**
   * Respostas item a item desta aplicação, em ordem. VAZIO nos testes de escore
   * direto (TUG, TC6, goniometria), que não têm item, e nas aplicações
   * registradas antes do motor de itens existir. Em teste 'sum_items' é o
   * detalhamento de `score`: a soma de `points` das linhas é o próprio escore.
   */
  items: PatientTestResultItem[]
  /** Foto usada na medição desta aplicação (já assinada) — mostrada no card
   *  de resultado, acima do valor medido. */
  imageUrl?: string
  /** PATH bruto (não assinado) da mesma foto — só usado ao EDITAR o
   *  resultado: se o fisioterapeuta não trocar a foto, é o que deve ser
   *  regravado (salvar imageUrl, que é uma URL assinada, corromperia a coluna). */
  imagePath?: string
  /** Os 3 pontos (A·vértice·C) usados nesta medição — desenha a régua sobre
   *  imageUrl no card de resultado. Só quando imageUrl também existe. */
  measuredPoints?: GoniometryPoints
  performedAt: string   // dd/mm/aaaa
  /** A qual tratamento esta aplicação pertence — carimbado pelo banco na
   *  gravação. Ausente nas aplicações anteriores ao vínculo existir. */
  carePlanId?: string
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
// Questionário de saúde POR RAMO: a seção "Saúde geral" é o NÚCLEO, comum a
// qualquer especialidade. Cada ramo soma a sua própria seção (odontologia:
// "Saúde bucal", no modelo dos Conselhos Regionais de Odontologia; fisioterapia:
// "Avaliação fisioterapêutica"). Por isso os campos de UM ramo só são opcionais
// para os demais — cada ficha só preenche a seção do seu ramo (ver questions.ts
// sectionsForSpecialty). Fonte: private.seed_anamnesis_template (banco).
export type YesNo = 'yes' | 'no'
export type YesNoUnknown = 'yes' | 'no' | 'unknown'
export type BloodPressure = 'normal' | 'high' | 'low' | 'controlled'
export type BleedingLevel = 'normal' | 'excessive'
export type HealingLevel = 'normal' | 'complicated'
export type GumBleeding = 'no' | 'yes' | 'during_brushing' | 'sometimes'
export type FlossUse = 'daily' | 'sometimes' | 'no'
export type AffectedSide = 'right' | 'left' | 'both' | 'not_applicable'

export interface Anamnesis {
  clinicId: string
  patientId: string
  /** Última atualização — a ficha é revisada a cada retorno. */
  updatedAt: string   // dd/mm/aaaa

  // Saúde geral (núcleo — toda especialidade pergunta isto)
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

  /** Queixa principal — reaproveitada pela seção específica de cada ramo. */
  chiefComplaint?: string

  // Saúde bucal (só odontologia)
  anesthesiaReaction?: YesNo
  anesthesiaReactionDetails?: string
  lastTreatment?: string
  toothGumPain?: YesNo
  gumBleeding?: GumBleeding
  badTasteDryMouth?: YesNo
  brushingsPerDay?: string
  flossing?: FlossUse
  jawPainClicking?: YesNo
  grindsTeeth?: YesNo
  faceSores?: YesNo
  smokes?: YesNo
  smokingAmount?: string

  // Avaliação fisioterapêutica (só fisioterapia)
  onsetDescription?: string        // como e quando o problema começou
  painScale?: string               // intensidade da dor hoje (0 a 10)
  priorTreatment?: YesNo           // já fez fisio/outro tratamento para isto?
  priorTreatmentDetails?: string
  physicalActivity?: YesNo         // pratica atividade física regularmente?
  physicalActivityDetails?: string
  affectedSide?: AffectedSide      // lado predominantemente afetado
  dailyImpact?: YesNo              // atrapalha as atividades diárias/trabalho?
  dailyImpactDetails?: string
  /** Emagrecimento sem motivo, dor noturna que não passa com repouso, febre,
   *  alteração de força/sensibilidade — sinais de alerta (encaminhar/investigar). */
  redFlags?: YesNo
  redFlagsDetails?: string
}

/** Pergunta ad-hoc que o profissional cria para UM paciente (aba Anamnese →
 *  "Personalizado"). Presa ao paciente, não à ficha: permanente, independe de
 *  template/ramo e não reseta quando uma ficha nova é aberta no retorno. */
export interface PatientCustomQuestion {
  id: string
  clinicId: string
  patientId: string
  questionText: string
  answerText?: string
  createdAt: string   // dd/mm/aaaa
  updatedAt: string   // dd/mm/aaaa
}

// ── Prontuário SOAP (a evolução da sessão) ───────────────────────────────────
// SOAP é o padrão de registro clínico: Subjetivo (o que o paciente relata),
// Objetivo (o que o profissional mede), Avaliação (a interpretação) e Plano (a
// conduta). Era UM campo de HTML solto e virou objeto porque a seção passou a
// ser ENDEREÇO consultável: dá para perguntar ao banco "o que foi planejado nas
// últimas 5 sessões" sem varrer texto (ver appointment.clinical_note).

/**
 * As 4 seções, nesta ordem — é a ordem em que a evolução se escreve e se lê.
 * As chaves são em inglês porque são exatamente as do jsonb no banco; o rótulo
 * em português é da tela, não do tipo.
 */
export type SoapSection = 'subjective' | 'objective' | 'assessment' | 'plan'

/**
 * Uma evolução SOAP. Valor = HTML rico da seção, sanitizado antes de gravar E
 * antes de exibir.
 *
 * Parcial de propósito: seção não preenchida é chave AUSENTE, nunca `''` — o
 * CHECK `private.is_soap_note` recusa seção em branco justamente para que
 * "tem plano" não fique verdadeiro num plano vazio. Pelo mesmo motivo o objeto
 * nunca é `{}`: evolução inexistente é o campo inteiro `undefined` (coluna
 * NULL), e não um objeto sem chaves.
 */
export type SoapNote = Partial<Record<SoapSection, string>>

/**
 * Modelo de evolução (`evolution_template`) — o esqueleto que o profissional
 * escolhe no editor para não começar do zero. O conteúdo do modelo é COPIADO
 * para a nota, nunca referenciado: prontuário é documento assinado, e editar o
 * modelo em 2027 não pode reescrever o que foi registrado em 2026.
 */
export interface EvolutionTemplate {
  id: string
  clinicId: string
  name: string
  /** Uma linha dizendo quando usar — aparece no menu de modelos, ao lado do nome. */
  description?: string
  /** Sempre com ao menos uma seção: o banco recusa modelo vazio (NOT NULL + o
   *  mesmo is_soap_note do prontuário). */
  note: SoapNote
  /** true = modelo de referência que veio pronto no sistema — edita e inativa,
   *  nunca exclui (a policy de delete exige isSeed = false). */
  isSeed: boolean
  /** inactive = some do menu sem sair do catálogo. É como a clínica "remove" um
   *  modelo de referência, já que excluir é proibido. */
  status: ActiveStatus
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
type WhatsAppStatus = 'connected' | 'disconnected' | 'connecting'

export interface WhatsAppConnection {
  status: WhatsAppStatus
  phoneNumber?: string        // (79) 99999-0000 — preenchido quando conectado
  connectedAt?: string   // dd/mm/aaaa HH:mm
  /** Imagem data URL devolvida pela Evolution API. */
  qrCode?: string
  qrExpiresAt?: string
  lastError?: string
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
  /** SOLICITAÇÃO DE EXAME: quando o resultado foi entregue. Ausente = ainda
   *  aguardando. Não usado nos demais tipos. */
  deliveredOn?: string   // dd/mm/aaaa
}

// ── Cargos e acesso às páginas (aba do Administrativo) ───────────────────────
export type AppPage =
  | 'dashboard' | 'today' | 'schedule' | 'patients' | 'professionals'
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
  photo?: string          // path da imagem no bucket privado (assinado na leitura)
  name: string
  cnpj: string
  email: string
  phone: string
  /** CNES — Cadastro Nacional de Estabelecimentos de Saúde. Obrigatório na guia
   *  TISS; sem ele a operadora recusa o lote. */
  cnes?: string
}

// O RESPONSÁVEL TÉCNICO não tem tipo próprio: pela norma do conselho ele é
// inscrito no CRO, logo é um `Professional` marcado no banco com
// `is_technical_manager`. Hoje nenhuma tela lê/escreve essa flag — o serviço que
// fazia isso saiu junto com a UI do RT; a coluna e a RPC continuam no banco.

/** Sala de atendimento (Administrativo → Salas). */
export interface Room {
  id: string
  clinicId: string
  name: string
  photo?: string          // path da imagem no bucket privado (assinado na leitura)
}

/** Serviço/procedimento avulso da odontologia (Administrativo → Serviços, só odontologia). */
export interface OdontoProcedure {
  id: string
  clinicId: string
  name: string
  price: number
}

/** Fornecedor de materiais (Administrativo → Fornecedores, só odontologia). */
export interface Supplier {
  id: string
  clinicId: string
  name: string
  photo?: string          // path da imagem no bucket privado (assinado na leitura)
  cnpj?: string
  phone?: string
  /** Destino do pedido de orçamento quando um material está acabando. */
  email?: string
  /** Separado de `phone`: o fixo do balcão raramente é o WhatsApp de quem vende. */
  whatsapp?: string
  cep?: string
  state?: string          // UF
  city?: string
  neighborhood?: string
  street?: string
  number?: string
}

/** Turma coletiva recorrente (Administrativo → Turmas) — nome/profissional/sala/
 *  horário/capacidade compartilhados por todos os dias da semana selecionados. */
/** Uma sessão semanal recorrente de turma coletiva — turma com aulas em dois
 *  dias vira DUAS ClassGroup (uma por dia), cada uma com sua própria
 *  capacidade/matrícula: um paciente pode entrar só na terça sem contar vaga
 *  nem limite semanal na quinta. */
export interface ClassGroup {
  id: string
  clinicId: string
  name: string
  professionalId?: string
  roomId?: string
  weekday: number     // 0=domingo … 6=sábado (Date.getDay())
  startTime: string       // 'HH:mm'
  durationMinutes: number
  maxCapacity: number
  startDate: string        // dd/mm/aaaa
  endDate?: string          // dd/mm/aaaa — sem fim = turma contínua
}

/** Uma ocorrência (dia concreto) de uma ClassGroup na semana visível da Agenda
 *  — materializada no cliente a partir de weekday/startDate/endDate, nunca
 *  persistida (por isso não tem `id` de banco: `id` aqui é só de renderização). */
export interface ClassGroupOccurrence {
  id: string               // `${classGroupId}-${date}` — único por ocorrência renderizada
  classGroupId: string
  name: string
  date: string               // aaaa-mm-dd
  startTime: string           // 'HH:mm'
  endTime: string
  professionalId?: string
  roomName?: string
  maxCapacity: number
  /** Alunos matriculados NESTA sessão (class_group_enrollment) — cada dia da
   *  semana é uma ClassGroup própria, então a lotação é independente por dia. */
  enrolledCount: number
}

export type ClassAttendanceStatus = 'present' | 'absent'

/** Uma linha do roster no modal de chamada de uma ocorrência de turma —
 *  matrícula (permanente) + a presença/falta/prontuário DESTA data (se já
 *  registrada; sem registro ainda, cai no padrão status='present' sem nota). */
export interface ClassGroupRosterEntry {
  enrollmentId: string
  patientId: string
  patientName: string
  patientPhoto?: string
  status: ClassAttendanceStatus
  /** Só relevante quando status='absent'. */
  justification?: string
  /** Evolução SOAP deste paciente nesta turma+data — painel lateral.
   *  undefined = ninguém escreveu prontuário desta aula ainda (ver
   *  class_group_attendance.clinical_note). */
  clinicalNote?: SoapNote
  /** Pacote/plano que originou a matrícula (só exibição — ver domain.ts
   *  PatientServiceEntitlement / classGroupRosterService.ts). */
  entitlementServiceName?: string
  /** dd/mm/aaaa — undefined = sem validade (não vence). */
  entitlementExpiresAt?: string
}

/** Material/insumo de estoque (Administrativo → Materiais). */
export interface Material {
  id: string
  clinicId: string
  name: string           // ex.: Resina Fotopolimerizável A2
  photo?: string          // path da imagem no bucket privado (assinado na leitura)
  inStock: number
  minQuantity: number
  expiryDate?: string      // dd/mm/aaaa
  notes?: string    // ex.: Lote 123
  /** Fornecedores deste material — um material pode ter mais de um (material_supplier). */
  supplierIds: string[]
}

/** Perfil do usuário logado (menu de perfil no topo, cabeçalho de receituário). */
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
export interface ScheduledAppointment {
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
  /** Encaixe declarado — tira a consulta da trava de agenda dupla do banco
   *  (appointment_professional_overlap_ex). É o que separa o encaixe proposital
   *  do choque acidental. */
  isOverbook?: boolean
  /** Pacote de sessões do qual esta consulta desconta — IMUTÁVEL depois de
   *  criada (ver appointment.entitlement_id). undefined = consulta avulsa. */
  entitlementId?: string
  /** Evolução SOAP da SESSÃO (ver appointment.clinical_note). undefined = sessão
   *  sem prontuário escrito. Não confundir com `notes`, que é a observação
   *  simples da agenda. */
  clinicalNote?: SoapNote
}

// ── Documentos do paciente (aba do perfil) ───────────────────────────────────
/** Divisões da aba Documentos — o que o paciente TRAZ, arquivado por tipo. */
export type PatientDocumentCategory = 'certificate' | 'exam' | 'report' | 'other'

export interface PatientDocument {
  /** Divisão em que o documento aparece. Antigo sem classificação cai em `other`. */
  category: PatientDocumentCategory
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
  /** Anexo de uma SESSÃO específica (aba Prontuários) — undefined = documento geral do paciente. */
  appointmentId?: string
  /** Resultado anexado a uma SOLICITAÇÃO de exame. Ausente = anexo avulso. */
  prescriptionId?: string
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
interface SessionInstallment {
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

/** Uma célula da grade recorrente de disponibilidade (aba Agenda do perfil do
 *  profissional). A LINHA EXISTIR no banco é o "disponível" — não há campo
 *  booleano aqui porque a ausência do slot já significa indisponível. */
export interface ProfessionalAvailabilitySlot {
  weekday: number   // 0=Dom…6=Sáb (Date.getDay()), grade edita só 1-6
  hour: number       // início do bloco de 1h (6 = 06:00–07:00 … 19 = 19:00–20:00)
}

/** Bloqueio de UMA hora específica numa data real (Agenda geral, com o
 *  profissional filtrado) — vence a disponibilidade recorrente só naquele
 *  dia/hora, sem mexer na regra nem nas outras semanas. */
export interface ProfessionalBlockedSlot {
  date: string   // iso (aaaa-mm-dd)
  hour: number    // início do bloco de 1h
  reason?: string   // capturado no ConfirmDialog ao salvar, livre e opcional
}

/** Período em que o profissional fica indisponível em TODOS os horários,
 *  todos os dias do intervalo — viagem, férias, atestado (aba Agenda >
 *  Disponibilidade do perfil). */
export interface ProfessionalAbsence {
  id: string
  professionalId: string
  startDate: string   // iso (aaaa-mm-dd)
  endDate: string      // iso (aaaa-mm-dd), inclusive
  reason?: string
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
 * Produção × comissão de UM profissional num mês, versão FISIOTERAPIA do card
 * "Comissões" do Dashboard — RPC professional_physio_commission. Substitui
 * ProfessionalQuoteConversion nessa especialidade porque fisioterapia não usa
 * orçamento: o paciente compra pacote/contrato direto no Ponto de Venda.
 *
 * `sold` é produção atribuída por SESSÃO REALIZADA (pacote: venda ÷ teto de
 * sessões; contrato recorrente: mensalidade recebida no mês, rateada pelas
 * sessões que cada profissional deu) — não é o valor da venda inteira de uma
 * vez. `commission` = sold × percentual cadastrado (só regra 'percentage'
 * ativa; comissão de valor fixo não é proporcional a venda, fica de fora
 * daqui e é tratada na aba Ganhos do perfil).
 */
export interface ProfessionalPhysioCommission {
  professionalId: string
  name: string
  photoUrl?: string
  sold: number
  commission: number
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
interface PaymentEntry {
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
// Ordem do funil: new → qualifying → qualified → scheduling → attended →
// negotiating → converted (lost é terminal, fora da ordem principal).
export type LeadStatus =
  | 'new' | 'qualifying' | 'qualified' | 'scheduling' | 'attended'
  | 'negotiating' | 'converted' | 'lost'

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
  /** Desde quando o lead está na etapa (status) atual — ISO. Alimenta o
   *  alerta de "parado há X dias" no Kanban. */
  stageSince: string
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
  /** Data da VENDA (dd/mm/aaaa) — regime de competência, igual em todas as
   *  parcelas do mesmo plano. Faturamento soma o bruto por esta data; caixa
   *  continua por receivedAt. Ver docs/modelo-contabil.md. */
  competenceDate: string
  dueDate: string
  receivedAt?: string     // dd/mm/aaaa (quando quitada)
  method?: PaymentMethod
  source: string           // Consultas, Convênio, Vendas, Orçamentos…
  grossAmount: number
  fee: number             // R$ retido pela adquirente
  status: PaymentStatus
  /** Bandeira e código de autorização da maquininha (crédito/débito). */
  cardBrand?: string
  authorizationCode?: string
  /** Venda do PDV que originou o título (N parcelas → 1 venda). */
  saleId?: string
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
type CollectionChannel = 'whatsapp' | 'phone' | 'email'

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

// ── Plano de contas ─────────────────────────────────────────────────────────
/** Lado do plano de contas: entra dinheiro (Receber) ou sai (Pagar). */
export type FinanceCategoryKind = 'revenue' | 'expense'

/**
 * Nó do plano de contas. A árvore tem NO MÁXIMO dois níveis — o banco recusa um
 * terceiro (ver finance_category_parent_fk), então quem consome pode tratar
 * `parentId` como "é subcategoria?" sem se preocupar com recursão.
 */
export interface FinanceCategory {
  id: string
  clinicId: string
  /** undefined = categoria de primeiro nível; preenchido = subcategoria. */
  parentId?: string
  name: string
  /** Subcategoria SEMPRE tem o mesmo tipo do pai — garantido por FK. */
  kind: FinanceCategoryKind
  /** Veio no plano de referência: pode renomear e inativar, não excluir. */
  isSeed: boolean
  status: ActiveStatus
}

/** Categoria de primeiro nível com as subcategorias já aninhadas — é assim que
 *  a tela desenha e como os seletores montam os grupos. */
export interface FinanceCategoryNode extends FinanceCategory {
  children: FinanceCategory[]
}

/**
 * Recorte da clínica (setor, sala, unidade, profissional) para saber de ONDE
 * vem cada despesa e receita.
 *
 * É dimensão INDEPENDENTE do plano de contas, não um nível a mais dele: a
 * categoria diz o que foi o lançamento ("Aluguel"), o centro de custo diz de
 * quem foi ("Unidade Centro"). Um lançamento pode ter os dois, um só ou nenhum.
 *
 * Sem `isSeed`, ao contrário de [FinanceCategory]: nasce vazio porque não
 * existe divisão de referência que sirva para toda clínica.
 */
export interface CostCenter {
  id: string
  clinicId: string
  name: string
  status: ActiveStatus
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
