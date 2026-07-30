// ─────────────────────────────────────────────────────────────────────────────
// Fonte única das query keys do TanStack Query. NUNCA monte key inline no
// useQuery — importe daqui. Garante que invalidações acertem o cache certo.
// Padrão: [entidade] para listas, [entidade, id] para detalhe.
// ─────────────────────────────────────────────────────────────────────────────

export const queryKeys = {
  patients: {
    all:    ['patients'] as const,
    detail: (id: string) => ['patients', id] as const,
  },
  anamnesis: {
    byPatient: (patientId: string) => ['anamnesis', patientId] as const,
  },
  // Ficha corrente do odontograma (tabela patient_odontogram). Bloco próprio, e
  // NÃO ['patients', id, ...], pelo mesmo motivo de customQuestions logo abaixo:
  // pendurada no prefixo de paciente, qualquer invalidação de cadastro
  // derrubaria o odontograma no meio de um exame.
  odontogram: {
    byPatient: (patientId: string) => ['odontogram', patientId] as const,
    /** Régua do histórico: só datas, sem payload. */
    revisions: (patientId: string) => ['odontogram', patientId, 'revisions'] as const,
    /** Snapshot de um dia. Chaveado pela SESSÃO, não pelo paciente: o snapshot é
     *  imutável, então cache por sessão nunca envelhece e reabrir um dia já
     *  visitado é instantâneo. */
    revision: (sessionId: string) => ['odontogramRevision', sessionId] as const,
  },
  /** Resumo clínico lido pela assistente de voz — bloco próprio, mesmo motivo
   *  do odontogram acima: sob o prefixo de paciente, uma invalidação de
   *  cadastro derrubaria o resumo no meio do atendimento. */
  clinicalSummary: {
    byPatient: (patientId: string) => ['clinicalSummary', patientId] as const,
  },
  /** Lembretes deixados para o PRÓXIMO atendimento do paciente. Bloco próprio
   *  pelo mesmo motivo do odontogram e do clinicalSummary: pendurado no prefixo
   *  de paciente, uma invalidação de cadastro os derrubaria no meio da consulta. */
  reminders: {
    byPatient: (patientId: string) => ['reminders', patientId] as const,
  },
  // Perguntas personalizadas do paciente (aba Anamnese → Personalizado) —
  // permanentes, independem da ficha ativa; key própria, fora do prefixo 'anamnesis'.
  customQuestions: {
    byPatient: (patientId: string) => ['customQuestions', patientId] as const,
  },
  // MEDIÇÃO TEMPORÁRIA — ver src/lib/cibelly/pricing.ts. Sai junto quando a
  // comparação OpenAI × Gemini terminar.
  cibellyUsage: {
    recent: ['cibellyUsage', 'recent'] as const,
  },
  whatsapp: {
    connection:    ['whatsapp', 'connection'] as const,
    automations: ['whatsapp', 'automations'] as const,
    inboundMessages: ['whatsapp', 'inboundMessages'] as const,
  },
  subscription: {
    plan:     ['subscription', 'plan'] as const,
    invoices: ['subscription', 'invoices'] as const,
  },
  appointments: {
    all:    ['appointments'] as const,
    detail: (id: string) => ['appointments', id] as const,
    /** Evolução livre da consulta médica (tela de atendimento). */
    medicalRecord: (id: string) => ['appointments', id, 'medical-record'] as const,
    // Prefixada por 'appointments' de propósito: invalidar a agenda (marcar
    // presença/falta) tem de refazer os cartões do topo junto, e o prefixo
    // garante isso sem uma segunda invalidação que alguém esqueceria.
    stats:  ['appointments', 'stats'] as const,
    series:  (period: string, isoMonth: string) => ['appointments', 'series', period, isoMonth] as const,
    /** Consultas do intervalo visível da Agenda (semana da grade, janela da aba do profissional). */
    range:  (fromIso: string, toIso: string) => ['appointments', 'range', fromIso, toIso] as const,
  },
  professionals: {
    all:    ['professionals'] as const,
    detail: (id: string) => ['professionals', id] as const,
    /** O profissional ligado ao LOGIN atual (professional.user_id = auth.uid()).
     *  Sob o prefixo ['professionals'] de propósito: ligar/desligar um vínculo
     *  em Administrativo → Profissionais invalida `professionals.all` (RENOMEAR
     *  ou trocar QUEM está vinculado ao MEU login também tem de refletir aqui),
     *  e a invalidação por prefixo já pega esta key de brinde. */
    current: ['professionals', 'current'] as const,
    /** Produção do profissional (aba Ganhos) — prefixada, cai junto na invalidação. */
    earnings: (id: string) => ['professionals', id, 'earnings'] as const,
    /** Orçado × convertido de TODOS os profissionais num mês (card Comissões
     *  do Dashboard). O mês faz parte da key — julho e agosto são dados
     *  diferentes, não a mesma lista com outro filtro. */
    quoteConversion: (monthIso: string) => ['professionals', 'quoteConversion', monthIso] as const,
    // Versão fisioterapia do mesmo card — ver ProfessionalPhysioCommission.
    physioCommission: (monthIso: string) => ['professionals', 'physioCommission', monthIso] as const,
    // Disponibilidade (aba Agenda do perfil) — prefixada por 'professionals'
    // de propósito, mesmo motivo de earnings: cai junto se algo invalidar o
    // perfil inteiro.
    availabilityTemplate: (id: string) => ['professionals', id, 'availability', 'template'] as const,
    // Bloqueio de hora específica (Agenda geral) — a janela de datas faz
    // parte da key: a semana de julho e a de agosto são bloqueios diferentes.
    blockedSlots: (id: string, fromIso: string, toIso: string) =>
      ['professionals', id, 'blockedSlots', fromIso, toIso] as const,
    // Ausências por período (aba Agenda > Disponibilidade do perfil).
    absences: (id: string) => ['professionals', id, 'absences'] as const,
  },
  user: {
    me: ['user', 'me'] as const,
  },
  /** Ficha estruturada de UMA consulta (seções + peso/altura/IMC). */
  consultationChart: (appointmentId: string) => ['consultationChart', appointmentId] as const,
  /** Modelos de texto por seção da ficha — por clínica, poucos, lista inteira. */
  noteTemplates: ['noteTemplates'] as const,
  /** Catálogo de medicamentos (CMED). Dado de referência global — a chave não
   *  leva clínica nenhuma, porque a resposta é a mesma para todas. */
  drugCatalog: (termo: string) => ['drugCatalog', termo] as const,
  /** Lista de espera da agenda — invalidada inteira a cada mudança: é uma fila
   *  curta, e recortar por status só criaria chance de a tela ficar velha. */
  waitingList: ['waitingList'] as const,
  finance: {
    // PREFIXO DE TODO O MÓDULO. Um movimento de dinheiro nunca mexe em uma
    // lista só: dar baixa num título altera o saldo do banco, o fluxo de caixa
    // projetado, o gráfico e o extrato do paciente. Invalidar peça por peça é
    // como as telas ficam desatualizadas até alguém apertar F5 — as mutations
    // do financeiro invalidam este prefixo inteiro.
    all: ['finance'] as const,
    series: (period: string, isoMonth: string) => ['finance', 'series', period, isoMonth] as const,
    // Parametrizada pelo horizonte: a projeção de 30, 60 e 90 dias é dado
    // diferente e não pode compartilhar cache. Continua sob o prefixo
    // ['finance'], então as mutations do módulo a invalidam junto com o resto.
    cashFlow: (days: number) => ['finance', 'cashFlow', days] as const,
    // A matriz depende da janela, do agrupamento e da conta — os quatro entram
    // na key, senão trocar de mês devolveria a tabela do mês anterior do cache.
    cashFlowMatrix: (from: string, to: string, granularity: string, bankAccountId?: string) =>
      ['finance', 'cashFlowMatrix', from, to, granularity, bankAccountId ?? 'all'] as const,
    payables:    ['finance', 'payables'] as const,
    receivables: ['finance', 'receivables'] as const,
    // Vendas (recebíveis quitados) de um período. Sob 'finance' de propósito: dar
    // baixa/estornar um título muda o que a aba Vendas mostra, então as mutations
    // do módulo (que invalidam ['finance']) já a atualizam sem F5. As datas do
    // período entram na key completa lá no hook (useSales).
    sales:      ['finance', 'sales'] as const,
    banks:      ['finance', 'banks'] as const,
    acquirers: ['finance', 'acquirers'] as const,
    // Plano de contas. Sob 'finance' como o resto do módulo, mas note que o
    // caminho INVERSO não vale: renomear uma categoria não mexe em lançamento
    // nenhum (o rótulo fica congelado no título), então as mutations desta aba
    // invalidam só esta key — ver financeCategoryService.
    categories: ['finance', 'categories'] as const,
    // Centros de custo — mesma lógica das categorias: renomear um centro não
    // altera lançamento nenhum, então esta key se invalida sozinha.
    costCenters: ['finance', 'costCenters'] as const,
    collections: ['finance', 'collections'] as const,
    // Prefixada por 'finance' de propósito: faturar um procedimento parado cria
    // um recebível, então quem invalida a lista de contas a receber (prefixo
    // ['finance']) já refaz o contador da aba "A faturar" junto.
    unbilled: ['finance', 'unbilled'] as const,
    // Extrato do paciente (aba Pagamentos do perfil). Sob 'finance' pelo mesmo
    // motivo: qualquer baixa no módulo tem de refletir aqui sem F5.
    byPatient: (patientId: string) => ['finance', 'receivables', 'patient', patientId] as const,
  },
  tasks: {
    all: ['tasks'] as const,
  },
  leads: {
    all: ['leads'] as const,
    history: (id: string) => ['leads', id, 'history'] as const,
  },
  // 'payments' saiu daqui junto com o service: public.payment está CONGELADA
  // (zero linhas, nenhum escritor, sem GRANT de escrita) e o razão vigente é
  // receivable — que vive sob a key 'finance'.
  treatments: {
    // Prefixo: faturar um procedimento pela aba "A faturar" muda a situação
    // financeira da sessão no prontuário de um paciente que a tela do
    // Financeiro não sabe qual é.
    all: ['treatments'] as const,
    byPatient: (patientId: string) => ['treatments', 'patient', patientId] as const,
    /**
     * Prévia do reflexo financeiro do procedimento em edição. Os parâmetros
     * fazem parte da key porque a resposta MUDA com cada um deles: trocar o
     * valor ou marcar cortesia tem de refazer a pergunta, não servir a frase
     * anterior do cache — a frase é o que o dentista combina com o paciente.
     */
    billingPreview: (
      patientId: string,
      amount: number | undefined,
      performedOn: string,
      billing: { dueDate?: string; notBillableReason?: string; method?: string; acquirerId?: string; installments?: number },
    ) => [
      'treatments', 'billingPreview', patientId, amount ?? null, performedOn,
      billing.dueDate ?? null, billing.notBillableReason?.trim() || null,
      billing.method ?? null, billing.acquirerId ?? null, billing.installments ?? 1,
    ] as const,
  },
  roles: {
    all: ['roles'] as const,
  },
  staff: {
    all: ['staff'] as const,
  },
  audit: {
    // Os filtros entram na key: mudar entidade/ação/período refaz a busca (e a
    // paginação keyset recomeça do topo). Objeto estável via JSON no componente.
    list: (filters: unknown) => ['audit', filters] as const,
  },
  quotes: {
    all: ['quotes'] as const,
    byPatient: (patientId: string) => ['quotes', 'patient', patientId] as const,
  },
  prescriptions: {
    all: ['prescriptions'] as const,
    byPatient: (patientId: string) => ['prescriptions', 'patient', patientId] as const,
  },
  commissions: {
    all: ['commissions'] as const,
  },
  insurances: {
    all: ['insurances'] as const,
  },
  // Catálogo de serviços (Administrativo → Serviços). Base do PDV e dos contratos
  // de fisioterapia.
  // Medicação em uso do paciente, com histórico.
  medications: {
    byPatient: (patientId: string) => ['medications', patientId] as const,
  },
  // Achados que se acumulam no paciente (tela de atendimento).
  clinicalEntries: {
    byPatient: (patientId: string) => ['clinical-entries', patientId] as const,
  },
  // CID-10 — tabela pública do DATASUS, buscada no servidor.
  cid10: {
    search: (termo: string) => ['cid10', termo] as const,
  },
  // Guias TISS (Financeiro → Guias TISS).
  tissGuides: {
    all: ['tiss-guides'] as const,
  },
  services: {
    all: ['services'] as const,
    /** Preços negociados de UM serviço, um por convênio (TISS). */
    insurancePrices: (serviceId: string) => ['services', 'insurance-prices', serviceId] as const,
  },
  // Catálogo de testes/escalas de fisioterapia (Administrativo → Testes).
  tests: {
    all: ['tests'] as const,
  },
  // Turmas coletivas (Administrativo → Turmas).
  classGroups: {
    all: ['classGroups'] as const,
  },
  // Matrícula/frequência de turma — nº de matriculados (badge da Agenda), o
  // roster de UMA ocorrência (turma + data, modal de chamada), as turmas de
  // UM paciente (painel "Turmas matriculadas" do modo Matricular) e o limite
  // semanal do contrato por trás de uma entitlement.
  classGroupRoster: {
    enrollmentCounts: ['classGroupRoster', 'counts'] as const,
    byOccurrence: (classGroupId: string, dateIso: string) => ['classGroupRoster', classGroupId, dateIso] as const,
    byPatient: (patientId: string) => ['classGroupRoster', 'patient', patientId] as const,
    weeklyLimit: (entitlementId: string) => ['classGroupRoster', 'weeklyLimit', entitlementId] as const,
  },
  // Pacotes de sessão comprados por um paciente (checkout_sale) — ver aba
  // "Pacote" do agendamento e o bloco "Pacotes" do perfil.
  entitlements: {
    byPatient: (patientId: string) => ['entitlements', patientId] as const,
  },
  // Testes fixados no sidenav de um paciente + histórico de resultados (aba
  // Testes do perfil). 'results' é parametrizada por teste: o histórico de
  // Berg e o de TUG são conjuntos diferentes, não a mesma lista com outro filtro.
  patientTests: {
    byPatient: (patientId: string) => ['patientTests', patientId] as const,
    results:    (patientId: string, testId: string) => ['patientTests', patientId, 'results', testId] as const,
  },
  documents: {
    all: ['documents'] as const,
    byPatient: (patientId: string) => ['documents', 'patient', patientId] as const,
    byAppointment: (appointmentId: string) => ['documents', 'appointment', appointmentId] as const,
  },
  // Prontuário por SESSÃO (aba Prontuários do perfil, fisioterapia) — datas
  // marcadas no calendário + conteúdo do dia selecionado.
  clinicalNotes: {
    // Prefixo do paciente: invalida `dates`, `byDate` e `previous` de uma vez.
    byPatient: (patientId: string) => ['clinicalNotes', patientId] as const,
    // `carePlanId` entra na key porque a resposta MUDA com ele — sem
    // tratamento (undefined) é a vida inteira do paciente; com um, é só
    // aquele episódio. Duas perguntas diferentes, duas entradas de cache.
    dates:  (patientId: string, carePlanId?: string) =>
      ['clinicalNotes', patientId, 'dates', carePlanId ?? null] as const,
    byDate: (patientId: string, dateIso: string, carePlanId?: string) =>
      ['clinicalNotes', patientId, 'date', dateIso, carePlanId ?? null] as const,
    // Sessão anterior a um ponto no tempo (painel "Última sessão" do modal da
    // Agenda). Data e hora entram na key porque a resposta MUDA com elas: a
    // anterior à sessão de terça não é a anterior à de quinta.
    previous: (patientId: string, beforeDateIso: string, beforeStartTime: string) =>
      ['clinicalNotes', patientId, 'previous', beforeDateIso, beforeStartTime] as const,
  },
  // Modelos de evolução SOAP (Administrativo → Modelos de evolução). Uma key
  // só, sem recorte por status: o catálogo é curto e as duas telas que o usam
  // (o CRUD e o seletor do prontuário) filtram ativo/inativo em memória — dois
  // recortes no cache só criariam a chance de um ficar velho depois do outro.
  evolutionTemplates: {
    all: ['evolutionTemplates'] as const,
  },
  rooms: {
    all: ['rooms'] as const,
  },
  odontoProcedures: {
    all: ['odonto-procedures'] as const,
  },
  clinic: {
    data:    ['clinic', 'data'] as const,
  },
  materials: {
    all: ['materials'] as const,
  },
  // Catálogo de fornecedores (Administrativo → Fornecedores, só odontologia).
  suppliers: {
    all: ['suppliers'] as const,
  },
  // Sinais vitais: o PACIENTE faz parte da chave — o histórico de um não pode
  // ser servido do cache do outro numa troca de paciente.
  // Planos de tratamento do paciente. A contagem de sessões é DERIVADA das
  // consultas, então mexer na agenda invalida esta chave junto (ver useCarePlans).
  carePlans: {
    // Prefixo para invalidar sem saber de QUEM é o plano — é o caso de marcar
    // presença numa consulta: quem marca (Dashboard, Hoje, modal da Agenda) não
    // carrega o paciente por perto, e a sessão realizada pode ter fechado o
    // tratamento sozinha no banco (private.tg_care_plan_autofinish).
    all: ['carePlans'] as const,
    byPatient: (patientId: string) => ['carePlans', patientId] as const,
  },
  vitalSigns: {
    byPatient: (patientId: string) => ['vitalSigns', patientId] as const,
  },
  bodyCompositions: {
    byPatient: (patientId: string) => ['bodyCompositions', patientId] as const,
  },
  goals: {
    // Prefixo para invalidar TODOS os anos de uma vez (troca de clínica, logout).
    all: ['goals'] as const,
    // O ANO faz parte da key porque a matriz de 2026 e a de 2027 são conjuntos
    // de dados distintos: sem ele, trocar o seletor de ano serviria a matriz do
    // ano anterior do cache e o usuário editaria — e salvaria — o ano errado.
    byYear: (year: number) => ['goals', year] as const,
  },
}
