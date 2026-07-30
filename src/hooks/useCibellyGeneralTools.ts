import { useRef, useState } from 'react'
import type { Patient, QuoteItem } from '@/types/domain'
import { useSession } from '@/context/SessionProvider'
import { useCurrentUser } from '@/hooks/useUser'
import { useClinic } from '@/hooks/useClinic'
import { usePatients } from '@/hooks/usePatients'
import { usePatientName, useProfessionalName } from '@/hooks/useDisplayNames'
import { useRooms } from '@/hooks/useRooms'
import { useCreatePrescription } from '@/hooks/usePrescriptions'
import { usePrintDocumentSemGesto } from '@/hooks/usePrintDocument'
import { usePatientReminders, useAddReminder, useCloseReminder } from '@/hooks/usePatientReminders'
import { usePatientClinicalSummary } from '@/hooks/usePatientOdontogram'
import { useOdontoProcedures } from '@/hooks/useOdontoProcedures'
import { useCreateQuote } from '@/hooks/useQuotes'
import { useAvailabilityTemplate, useAbsences, useBlockedSlots } from '@/hooks/useProfessionalAvailability'
import {
  useCreateScheduleAppointment, useScheduleAppointments, useUpdateScheduleAppointment,
} from '@/hooks/useSchedule'
import {
  queryPatientDirectory,
  resolvePatientReference,
} from '@/lib/cibelly/patientDirectory'
import type {
  CibellyToolContext, DocumentRequest, PatientDirectoryRequest, PatientMessageRequest, QuoteRequest,
  TreatmentQuoteRequest,
  CartAddRequest,
  CartQuoteRequest,
} from '@/lib/cibelly/sessionTypes'
import {
  matchesPendingMessage, pendingMessageConfirmation,
  type PendingMessageConfirmation,
} from '@/lib/cibelly/messageConfirmation'
import {
  consultasDoDia, consultasNoHorario, perguntaAmplaDemais, textoDaOcupacao,
  PERGUNTA_DO_RECORTE, type FocoDaAgenda,
} from '@/utils/agendaOccupancy'
import { chooseRoom } from '@/utils/roomChoice'
import { descreverPaciente, resolverDestinatario } from '@/utils/messageRecipient'
import { spokenName } from '@/utils/spokenName'
import { resolverPedidoDeOrcamento } from '@/utils/quoteRequest'
import { resumoPorDente, resumoUltimosAtendimentos } from '@/utils/clinicalHistorySpeech'
import {
  dividaDoPaciente, restanteDoTitulo, resumoAFaturar,
  resumoDoQueDeve, resumoDoUltimoPagamento,
} from '@/utils/patientFinanceSpeech'
import { pediuCancelamento } from '@/utils/cancelIntent'
import { dataPorExtenso, distanciaDeHoje, fimDeSemana, datasAmbiguas } from '@/utils/spokenDate'
import { addMinutes, formatLongDate, toIsoDate, isoToBrDate } from '@/utils/date'
import { formatCpf } from '@/utils/format'
import { matchesSearch } from '@/utils/search'
import { errorMessage } from '@/utils/errors'
import { vezesCobradas } from '@/utils/quotePerTooth'
import {
  CLINICAL_DOCUMENT_STYLES, attendanceCertificateText, certificateBody,
  examRequestBody, leaveCertificateText, prescriptionBody,
} from '@/utils/clinicalDocument'
import { buildDocument } from '@/utils/printDocument'
import { quoteBody } from '@/utils/quoteDocument'
import type { NewQuote } from '@/services/quotesService'
import { listMaterialsWithSuppliers } from '@/services/materialsService'
import {
  addToPurchaseList, getCartBySupplier, listPurchaseList, marcarEnvioDoOrcamento,
  mensagemDoOrcamento, registrarOrcamento,
} from '@/services/purchaseListService'
import { sendWhatsAppMessage } from '@/services/whatsappService'
import { searchPatientHistory } from '@/services/odontogramService'
import { listPatientReceivables, listUnbilledSessions } from '@/services/financeService'
import {
  checkSlot, freeSlotsOfDay, mergeFreeSlots, nextFreeSlots, formatFreeStartRanges,
  UNAVAILABLE_LABEL, type AvailabilityInput,
} from '@/utils/availability'

/**
 * AS FERRAMENTAS DA CIBELLY QUE NÃO DEPENDEM DO ODONTOGRAMA.
 *
 * Agenda, materiais, fornecedores, mensagens, cadastro e prontuário — tudo que
 * se resolve com dados do banco, sem o desenho da boca montado na tela.
 *
 * Nasceu de uma extração: este código vivia dentro da OdontogramFullscreenPage
 * e por isso só existia LÁ. Com o pedal F valendo em qualquer tela, ou o código
 * saía da página, ou seria duplicado — e duas implementações de "cancelar
 * consulta" é exatamente o tipo de coisa que sai de sincronia e cancela a
 * consulta errada num dos dois caminhos.
 *
 * O que ficou de fora, de propósito: marcar/apagar/ler dente. Aquilo depende do
 * motor do odontograma, que é global de módulo e só existe montado na tela
 * cheia (ver lib/cibelly/toolSurface.ts).
 *
 * @param patientId Paciente ABERTO, quando houver. Na superfície global é null,
 *   e as ferramentas que precisam de alguém passam a exigir nome — que é o
 *   comportamento certo: fora do odontograma não há "o paciente da cadeira".
 */
export function useCibellyGeneralTools({
  patientId,
  paciente,
}: {
  patientId: string | null
  paciente?: Patient
}) {
  const { specialty } = useSession()
  const { data: pacientes } = usePatients()
  const nomeDoPaciente = usePatientName()
  const { data: resumoClinico } = usePatientClinicalSummary(patientId)
  const { data: lembretes } = usePatientReminders(patientId)
  const { data: salas } = useRooms()
  const adicionarLembrete = useAddReminder()
  const fecharLembrete = useCloseReminder()
  const { data: usuario } = useCurrentUser()
  const { data: clinica } = useClinic()
  const criarPrescricao = useCreatePrescription()
  const imprimirSemGesto = usePrintDocumentSemGesto()
  const { data: servicos } = useOdontoProcedures()
  const criarOrcamento = useCreateQuote()
  const professionalName = useProfessionalName()

  /**
   * PRÉVIA PENDENTE — o que o modal da tela mostra enquanto espera o "sim".
   *
   * Só existe entre a primeira chamada de emitirDocumento (que NÃO salva nem
   * imprime, só monta o HTML) e a segunda, confirmada. Vazio de novo assim
   * que ela imprime, ou se o dentista pedir outro documento antes de
   * confirmar este — a prévia mais nova sempre substitui a anterior, porque
   * nenhuma das duas chegou a ter efeito no prontuário ainda.
   */
  const [documentoPendente, setDocumentoPendente] = useState<{
    titulo: string
    html: string
  } | null>(null)
  /** Mesma doutrina, para criarOrcamentoPaciente — prévia separada porque
   *  documento e orçamento são coisas diferentes e podem estar pendentes uma
   *  independente da outra (a mais nova de CADA UMA substitui a anterior
   *  dela, não a da outra ferramenta). */
  const [orcamentoPendente, setOrcamentoPendente] = useState<{
    titulo: string
    html: string
  } | null>(null)
  /**
   * Nome COMO SE FALA — não o nome completo do cadastro.
   *
   * Ela leu "Lucas Guimarães da Silva Santos" em voz alta ao listar a agenda,
   * na frente de quem estava na cadeira. Nome inteiro de outro paciente dito
   * alto num consultório é dado de saúde de terceiro vazando por acidente, e
   * ainda alonga uma resposta que devia ser curta. O primeiro nome basta para
   * o dentista saber de quem se trata.
   *
   * Usa o mesmo spokenName do resto da assistente (65 testes), então herda o
   * tratamento de nome com convênio, abreviação e importação invertida.
   */
  const nomeFaladoDoPaciente = (id: string): string => {
    const p = pacientes?.find(item => item.id === id)
    return spokenName(p?.commonName, p?.name) || nomeDoPaciente(id)
  }

  const pendingPatientMessageRef = useRef<PendingMessageConfirmation | null>(null)
  const pendingSupplierMessageRef = useRef<PendingMessageConfirmation | null>(null)

  async function emitirDocumento(pedido: DocumentRequest) {
    if (!patientId || !paciente) {
      return { ok: false as const, erro: 'Nenhum paciente em atendimento.' }
    }
    // Sem CRO o documento não tem validade — melhor recusar e ela avisar em voz
    // alta do que imprimir um papel que o paciente vai descobrir inválido.
    // Exige DÍGITO, não só texto: o cadastro costuma vir com "CRO/SE" digitado e
    // o número faltando, e "Cirurgião-dentista — CRO/SE" no papel é tão inválido
    // quanto assinatura sem registro nenhum.
    if (!usuario?.license || !/\d/.test(usuario.license)) {
      return {
        ok: false as const,
        erro: 'O cadastro do profissional está sem o número do registro no conselho (CRO). Complete em Administrativo → Profissionais antes de emitir documento.',
      }
    }

    const hojeBr = isoToBrDate(toIsoDate(new Date())) ?? ''
    const base = {
      patientName: paciente.name,
      patientCpf: paciente.cpf ? formatCpf(paciente.cpf) : undefined,
      longDate: formatLongDate(hojeBr),
      city: clinica?.city,
      signer: { name: usuario.name, license: usuario.license, specialty },
      notes: pedido.observacoes,
    }

    let titulo: string
    let corpo: string
    let tipoSalvo: 'prescription' | 'certificate' | 'document'
    let textoSalvo: string | undefined
    let resumo: string

    switch (pedido.tipo) {
      case 'receita': {
        const meds = (pedido.medicamentos ?? []).map(m => ({
          name: m.nome, dosage: m.posologia, quantity: m.quantidade,
        }))
        const orientacoes = pedido.texto?.trim()
        // Vale a lista, vale o texto ditado, valem os dois — só não vale vazio.
        if (meds.length === 0 && !orientacoes) {
          return { ok: false as const, erro: 'Qual medicamento, ou o que devo escrever na receita?' }
        }
        titulo = 'Receituário'
        tipoSalvo = 'prescription'
        textoSalvo = orientacoes
        corpo = prescriptionBody({ ...base, medications: meds, text: orientacoes })
        resumo = meds.length
          ? `receita de ${meds.map(m => m.name).join(', ')}`
          : 'receita'
        break
      }
      case 'atestado': {
        // Sem dias E sem texto, PERGUNTA — não emite.
        //
        // Antes havia um `?? 1` aqui, e ele imprimia um atestado de UM DIA que
        // ninguém pediu: papel assinado pelo dentista afirmando um afastamento
        // que não saiu da boca de ninguém. Era o único dos quatro tipos que
        // chutava; receita e exame já recusavam. Documento clínico é o lugar
        // onde default silencioso custa mais caro.
        if (!pedido.texto?.trim() && !pedido.dias) {
          return { ok: false as const, erro: 'Atestado de quantos dias? Ou me dite o texto.' }
        }
        const texto = pedido.texto?.trim()
          || leaveCertificateText(paciente.name, pedido.dias!)
        titulo = pedido.dias ? `Atestado — ${pedido.dias} dia(s)` : 'Atestado'
        tipoSalvo = 'certificate'
        textoSalvo = texto
        corpo = certificateBody({ ...base, text: texto })
        resumo = pedido.dias ? `atestado de ${pedido.dias} dia(s)` : 'atestado'
        break
      }
      case 'comparecimento': {
        const texto = attendanceCertificateText(
          paciente.name, base.longDate, pedido.horaEntrada, pedido.horaSaida,
        )
        titulo = 'Declaração de comparecimento'
        tipoSalvo = 'certificate'
        textoSalvo = texto
        corpo = certificateBody({ ...base, text: texto })
        resumo = 'declaração de comparecimento'
        break
      }
      case 'exame': {
        const exames = pedido.exames ?? []
        if (exames.length === 0) return { ok: false as const, erro: 'Qual exame?' }
        titulo = 'Solicitação de exame'
        tipoSalvo = 'document'
        textoSalvo = [
          exames.join('; '),
          pedido.dentes?.length ? `Dentes: ${pedido.dentes.join(', ')}` : '',
          pedido.justificativa ? `Hipótese: ${pedido.justificativa}` : '',
        ].filter(Boolean).join('\n')
        corpo = examRequestBody({
          ...base, exams: exames, teeth: pedido.dentes, justification: pedido.justificativa,
        })
        resumo = `pedido de ${exames.join(', ')}`
        break
      }
      default:
        return { ok: false as const, erro: `Não sei emitir "${String(pedido.tipo)}".` }
    }

    // PRIMEIRA CHAMADA: só monta a prévia. Nada é salvo nem impresso ainda —
    // mesma doutrina do cancelarConsulta (ver acima): uma frase mal entendida
    // não pode gerar um documento clínico sozinha. O dentista vê o resultado
    // no centro da tela e só o "sim" dele dispara o resto.
    if (!pedido.confirmado) {
      setDocumentoPendente({
        titulo,
        html: buildDocument(clinica, { title: titulo, subtitle: paciente.name, body: corpo, styles: CLINICAL_DOCUMENT_STYLES }),
      })
      return {
        ok: true as const,
        precisaConfirmar: true,
        documento: { tipo: titulo, resumo },
        instrucao:
          'O documento apareceu na tela para o dentista revisar. Diga que está pronto para revisão e pergunte se '
          + 'pode imprimir. Só chame de novo, com os MESMOS dados e confirmado=true, depois de um "sim" claro — '
          + 'antes disso não foi salvo nem impresso, então não diga que já saiu.',
      }
    }

    // CONFIRMADO: agora sim salva e imprime.
    try {
      // Salva ANTES de imprimir: papel na mão sem registro no prontuário é o
      // pior dos dois mundos — some o rastro de um documento que já circulou.
      await criarPrescricao.mutateAsync({
        patientId,
        type: tipoSalvo,
        title: titulo,
        date: hojeBr,
        professionalId: usuario.professionalId,
        medications: pedido.tipo === 'receita'
          ? (pedido.medicamentos ?? []).map(m => ({ name: m.nome, dosage: m.posologia, quantity: m.quantidade }))
          : undefined,
        text: textoSalvo,
        notes: pedido.observacoes,
      })
    } catch (e) {
      setDocumentoPendente(null)
      return { ok: false as const, erro: errorMessage(e, 'Não foi possível salvar o documento.') }
    }

    imprimirSemGesto({ title: titulo, subtitle: paciente.name, body: corpo, styles: CLINICAL_DOCUMENT_STYLES })
    setDocumentoPendente(null)
    return { ok: true as const, resumo }
  }

  /** Fecha a prévia sem imprimir — o "cancelar"/"x" do modal. Nada precisa ser
   *  desfeito no banco: nada foi salvo até a confirmação. */
  function fecharPreviaDocumento() {
    setDocumentoPendente(null)
  }

  /**
   * "Cibelly, monta um orçamento de limpeza e restauração no 26."
   *
   * MESMA fonte do editor manual (BudgetsPanel): salva com `useCreateQuote` /
   * `quotesService.addQuote`, na mesma tabela `quote`/`quote_item`, e imprime
   * com o mesmo `quoteBody` — um orçamento criado por voz aparece idêntico a
   * um criado à mão, na lista de Orçamentos do perfil do paciente e na aba
   * de Orçamentos desta própria tela.
   *
   * O PREÇO NUNCA VEM DA FALA — só o nome do serviço. Ele é resolvido contra
   * o cadastro (Administrativo → Serviços, tabela odonto_procedure) e o valor
   * de tabela é o que entra no orçamento; não há campo para o dentista ditar
   * um valor diferente aqui (isso o editor manual já cobre, se for o caso).
   *
   * TUDO OU NADA: se um serviço citado não bate com nada do cadastro, a
   * ferramenta recusa o pedido inteiro em vez de montar um orçamento faltando
   * um item — mesma doutrina do emitirDocumento ("documento é o lugar onde
   * default silencioso custa mais caro"), e aqui vale em dobro: é dinheiro.
   */
  async function criarOrcamentoPaciente(pedido: TreatmentQuoteRequest) {
    if (!patientId || !paciente) {
      return { ok: false as const, erro: 'Nenhum paciente em atendimento.' }
    }
    const pedidos = pedido.servicos ?? []
    if (pedidos.length === 0) {
      return { ok: false as const, erro: 'Quais serviços entram no orçamento?' }
    }

    const catalogo = servicos ?? []
    const itens: QuoteItem[] = []
    for (const s of pedidos) {
      const termo = s.nome.trim().toLowerCase()
      const achado = catalogo.find(c => c.name.toLowerCase() === termo)
        ?? catalogo.find(c => c.name.toLowerCase().includes(termo))
      if (!achado) {
        return {
          ok: false as const,
          erro: `Não encontrei "${s.nome}" no cadastro de Serviços. Cadastre em Administrativo → Serviços, ou diga o nome exatamente como está lá.`,
        }
      }
      /**
       * DOIS DENTES SÃO DOIS PROCEDIMENTOS — quando são.
       *
       * O preço entrava fixo, então "restauração no 26 e no 27" saía cobrando
       * UMA restauração. Não é arredondamento: é metade do valor do trabalho
       * que o dentista vai fazer, num papel que o paciente leva e aceita.
       *
       * Não há de onde inferir: `OdontoProcedure` guarda só nome e preço, e no
       * editor manual isto é uma caixa marcada item a item. Na ausência de
       * resposta, com 2+ dentes, assume POR DENTE — é o caso mais comum
       * (restauração, extração, canal) e erra para o lado de não subfaturar,
       * que é o lado corrigível: o dentista vê "× 2" na prévia e desfaz. O
       * contrário sai da clínica sem ninguém notar.
       */
      const dentes = s.dentes?.length ?? 0
      const vezes = vezesCobradas(dentes, s.porDente)

      itens.push({
        treatment: achado.name,
        professionalId: usuario?.professionalId,
        insurance: 'Particular',
        teeth: s.dentes?.length ? s.dentes.map(String) : undefined,
        unitPrice: achado.price,
        // A flag é o que faz a prévia e a lista escreverem "R$ X × 2"
        // (ver BudgetsPanel) — sem ela o total apareceria sem explicação.
        multiplyPerTooth: vezes > 1 || undefined,
        amount: achado.price * vezes,
      })
    }

    const hojeBr = isoToBrDate(toIsoDate(new Date())) ?? ''
    const nomeOrcamento = `Plano de tratamento de ${paciente.name}`
    const rascunho: NewQuote = {
      patientId,
      name: nomeOrcamento,
      date: hojeBr,
      status: 'pending',
      items: itens,
    }
    const resumoServicos = itens.map(i => i.treatment).join(', ')

    /**
     * O que ela precisa DIZER sobre a multiplicação — sem valores.
     *
     * A suposição de "por dente" não pode ser silenciosa: ela dobra ou triplica
     * o papel que o paciente vai aceitar. Dita em voz alta, o dentista corrige
     * na hora ("não, é valor único") e a ferramenta é chamada de novo com
     * `porDente: false`. Só o NÚMERO de dentes vai na frase; o preço continua
     * sendo coisa de olhar na tela.
     */
    const multiplicados = itens.filter(i => i.multiplyPerTooth)
    const avisoPorDente = multiplicados.length
      ? ' Diga que '
        + multiplicados
          .map(i => `${i.treatment} está sendo cobrado POR DENTE (${i.teeth?.length} dentes)`)
          .join(' e ')
        + ', e pergunte se é isso mesmo ou se o valor é único para o conjunto — '
        + 'se for único, chame de novo com porDente=false nesse serviço.'
      : ''

    // PRIMEIRA CHAMADA: só monta a prévia, mesma doutrina do emitirDocumento —
    // nada é salvo nem impresso até o "sim".
    //
    // SEM VALOR NO RETORNO, de propósito: o preço completo (por item e total)
    // já está na prévia que aparece na tela, mas não vai no resultado da
    // ferramenta — se não chega aqui, ela não tem como falar o total em voz
    // alta, nem por engano. O dentista confirma OLHANDO a prévia, não ouvindo
    // o valor: o mesmo raciocínio de `nomeFaladoDoPaciente` (não manda o dado
    // sensível para não precisar confiar que o modelo vai omitir sozinho).
    if (!pedido.confirmado) {
      setOrcamentoPendente({
        titulo: 'Orçamento',
        html: buildDocument(clinica, {
          title: 'Orçamento',
          subtitle: nomeOrcamento,
          body: quoteBody(rascunho, clinica?.name ?? 'a clínica', professionalName, paciente.name),
        }),
      })
      return {
        ok: true as const,
        precisaConfirmar: true,
        orcamento: { servicos: resumoServicos },
        instrucao:
          'O orçamento apareceu na tela para o dentista revisar, com os valores. Diga só os serviços incluídos e '
          + avisoPorDente
          + ' Depois pergunte se ele quer FINALIZAR o orçamento — a pergunta é sobre fechar o orçamento, não sobre '
          + 'imprimir: o que a confirmação faz é GRAVAR (a impressão é consequência). NÃO diga nenhum valor em '
          + 'voz alta (nem por item, nem o total): o preço é para o dentista OLHAR na tela, não para ser falado. '
          + 'Só chame de novo, com os MESMOS dados e confirmado=true, depois de um "sim" claro — antes disso nada '
          + 'foi gravado, então não diga que o orçamento existe.',
      }
    }

    // CONFIRMADO: agora sim salva (mesma addQuote do editor manual) e imprime.
    try {
      await criarOrcamento.mutateAsync(rascunho)
    } catch (e) {
      setOrcamentoPendente(null)
      return { ok: false as const, erro: errorMessage(e, 'Não foi possível salvar o orçamento.') }
    }

    imprimirSemGesto({
      title: 'Orçamento',
      subtitle: nomeOrcamento,
      body: quoteBody(rascunho, clinica?.name ?? 'a clínica', professionalName, paciente.name),
    })
    setOrcamentoPendente(null)
    return {
      ok: true as const,
      resumo: `orçamento de ${resumoServicos}`,
      // O que a Cibelly deve DIZER depois de gravar. O orçamento nasce
      // `pending` — igual ao do editor manual (ver BudgetsPanel) —, e quem o
      // tira desse estado é o "Aprovar" da lista, que é o aceite do paciente e
      // o que gera o contrato e os recebíveis. Sem dizer isso, "orçamento
      // criado" soa como negócio fechado, e o dentista para de esperar o aceite.
      instrucao:
        'O orçamento foi gravado e está PENDENTE, aguardando o aceite do paciente — avise isso. Ele aparece na '
        + 'lista de Orçamentos do perfil do paciente, onde o botão "Aprovar" registra o aceite. Continue sem '
        + 'dizer valores em voz alta.',
    }
  }

  /** Fecha a prévia do orçamento sem salvar nem imprimir. */
  function fecharPreviaOrcamento() {
    setOrcamentoPendente(null)
  }

  /** Consumo ditado durante o atendimento — vai junto no encerramento e dá baixa. */
  const materiaisUsadosRef = useRef<{ nome: string; quantidade: string; materialId?: string }[]>([])

  // ── Agenda ────────────────────────────────────────────────────────────────
  // Janela de 60 dias a partir de hoje: cobre "semana que vem", "mês que vem" e
  // o "quando tem vaga?" sem puxar o ano inteiro.
  // Calculada UMA vez, no primeiro render: ler o relógio a cada renderização
  // trocaria a janela no meio do atendimento e refaria as consultas à toa.
  const [{ hojeIso, limiteIso }] = useState(() => {
    const hoje = new Date()
    const limite = new Date(hoje)
    limite.setDate(limite.getDate() + 60)
    return { hojeIso: toIsoDate(hoje), limiteIso: toIsoDate(limite) }
  })
  const profId = usuario?.professionalId ?? ''
  const { data: gradeHorarios } = useAvailabilityTemplate(profId)
  const { data: ausencias } = useAbsences(profId)
  const { data: bloqueios } = useBlockedSlots(profId, hojeIso, limiteIso)
  const { data: consultas } = useScheduleAppointments(hojeIso, limiteIso)
  const agendar = useCreateScheduleAppointment()
  const atualizarConsulta = useUpdateScheduleAppointment()

  /** Disponibilidade só do dentista logado — é ele quem vai atender. */
  function disponibilidade(): AvailabilityInput {
    return {
      template: gradeHorarios ?? [],
      blocked: bloqueios ?? [],
      absences: ausencias ?? [],
      appointments: (consultas ?? []).filter(a => a.professionalId === profId),
    }
  }
  async function consultarPacientes(pedido?: PatientDirectoryRequest) {
    return queryPatientDirectory(pacientes ?? [], pedido)
  }

  function pacienteParaAgenda(referencia?: string):
    | { ok: true; id: string; patient: Patient }
    | { ok: false; erro: string } {
    if (referencia?.trim()) {
      const resolution = resolvePatientReference(pacientes ?? [], referencia)
      return resolution.ok
        ? { ok: true, id: resolution.patient.id, patient: resolution.patient }
        : { ok: false, erro: resolution.error }
    }
    if (!patientId || !paciente) {
      return {
        ok: false,
        erro: 'Nenhum paciente selecionado. Diga o nome ou código do paciente.',
      }
    }
    return { ok: true, id: patientId, patient: paciente }
  }

  /**
   * Histórico do paciente. Sem filtro: o resumo pré-carregado (últimos 5,
   * já quente antes do atendimento começar). Com `data` e/ou `dente`: busca
   * DIRECIONADA no histórico inteiro — "o que foi feito no dente 26 em
   * março?" perderia a resposta se ficasse só nos 5 mais recentes, e esta
   * paciente sozinha já tem 26 atendimentos no MESMO dia (ver
   * odontogramRevisions.ts), o que empurra qualquer data antiga para fora
   * dos 5 rapidinho.
   */
  async function consultarHistorico(filtro?: { data?: string; dente?: number }) {
    if (!patientId || !paciente) {
      return { ok: false, erro: 'Nenhum paciente selecionado.' }
    }

    if (filtro?.data || filtro?.dente != null) {
      try {
        const encontrados = await searchPatientHistory(patientId, { date: filtro.data, tooth: filtro.dente })
        // "resposta" já pronta: sem isso, ela recebe o JSON cru e precisa
        // SINTETIZAR sozinha em tempo real, sob pressão de fala — foi
        // exatamente esse ponto que a travou numa consulta real (perguntada
        // duas vezes, ficou muda até o dentista digitar "Responda.", com o
        // resultado da ferramenta já na mão). O código monta a frase; ela só lê.
        const resposta = filtro.dente != null
          ? resumoPorDente(encontrados, filtro.dente)
          : resumoUltimosAtendimentos(encontrados)
        return { ok: true, atendimentos: encontrados, resposta }
      } catch (e) {
        return { ok: false, erro: errorMessage(e, 'Não consegui buscar no histórico agora.') }
      }
    }

    if (!resumoClinico) return { ok: false, erro: 'Ainda estou carregando o histórico. Repete daqui a pouco?' }
    // Os lembretes vão JUNTO do histórico: são a parte do passado que existe
    // justamente para ser dita hoje, e uma ferramenta separada só para eles
    // seria uma chamada a mais para a mesma pergunta ("como ela está?").
    return {
      ok: true,
      ...resumoClinico,
      // Mesma frase pronta do ramo filtrado, para "o que fizemos ultimamente?"
      // não depender de o modelo condensar sozinho uma lista de atendimentos
      // que, para pacientes com vários registros no mesmo dia, é bem maior do
      // que parece — ver clinicalHistorySpeech.ts.
      resposta: resumoUltimosAtendimentos(resumoClinico.ultimosAtendimentos),
      lembretes: (lembretes ?? []).map(l => ({ id: l.id, texto: l.texto })),
    }
  }

  /**
   * "Cibelly, me lembre no próximo atendimento da Michelle de usar outro
   * material." Fica preso ao paciente em atendimento — a ferramenta não recebe
   * paciente, pela mesma razão de agendarConsulta: um nome mal entendido no
   * meio da frase não pode escrever na ficha de outra pessoa.
   */
  async function criarLembrete(p: { texto: string }) {
    if (!patientId || !paciente) return { ok: false, erro: 'Nenhum paciente em atendimento.' }
    const texto = p.texto?.trim()
    if (!texto) return { ok: false, erro: 'Não entendi o que anotar.' }
    try {
      await adicionarLembrete.mutateAsync({ patientId, texto })
    } catch (e) {
      return { ok: false, erro: errorMessage(e, 'Não consegui salvar o lembrete.') }
    }
    return { ok: true, lembrete: texto }
  }

  /** Marca um lembrete como resolvido — some do atendimento, fica no histórico. */
  async function concluirLembrete(p: { id: string }) {
    if (!patientId) return { ok: false, erro: 'Nenhum paciente em atendimento.' }
    // Só um lembrete DESTE paciente: o id vem de uma resposta anterior, mas
    // conferir aqui é barato e fecha a porta para um id de outra ficha.
    const alvo = (lembretes ?? []).find(l => l.id === p.id)
    if (!alvo) return { ok: false, erro: 'Não achei esse lembrete entre os abertos deste paciente.' }
    try {
      await fecharLembrete.mutateAsync({ id: alvo.id, patientId })
    } catch (e) {
      return { ok: false, erro: errorMessage(e, 'Não consegui concluir o lembrete.') }
    }
    return { ok: true, concluido: alvo.texto }
  }

  /**
   * "O Lucas tem alguma coisa em aberto?" — SÓ LEITURA.
   *
   * Nada aqui mexe em dinheiro: não dá baixa, não cancela, não fatura. Dar
   * baixa por voz é outra ferramenta, com confirmação obrigatória, e ela não
   * existe ainda de propósito.
   *
   * A PERMISSÃO NÃO É REGRA DE PROMPT: a consulta sai com o JWT do próprio
   * dentista, então quem não tem a feature `finance` no perfil de acesso
   * simplesmente não lê a tabela — a RLS recusa antes de qualquer frase ser
   * montada. O `catch` transforma essa recusa numa explicação, em vez de
   * deixá-la virar "não encontrei nada", que soaria como "está tudo quitado".
   *
   * As frases saem prontas de patientFinanceSpeech.ts (17 testes), e não da
   * cabeça do modelo: o número vai ser dito em voz alta na frente do paciente.
   */
  async function consultarFinanceiroPaciente(p: {
    paciente?: string
    assunto?: 'em_aberto' | 'ultimo_pagamento' | 'a_faturar'
  }) {
    /**
     * Sem nome, vale o paciente ABERTO — e a separação entre as superfícies já
     * garante o comportamento certo sem flag nenhuma: na superfície global o
     * hook recebe `patientId: null` (ver CibellyGlobal.tsx), então lá o silêncio
     * sobre quem é vira um pedido de nome, não um palpite sobre quem está na
     * cadeira. No odontograma há cadeira, e usá-la é o esperado.
     */
    let alvoId: string | null = null
    if (p.paciente?.trim()) {
      const resolution = resolvePatientReference(pacientes ?? [], p.paciente)
      if (!resolution.ok) return { ok: false, erro: resolution.error }
      alvoId = resolution.patient.id
    } else {
      alvoId = patientId
    }
    if (!alvoId) {
      return { ok: false, erro: 'De qual paciente? Me diz o nome ou o código PAC.' }
    }

    const nome = nomeFaladoDoPaciente(alvoId)
    const assunto = p.assunto ?? 'em_aberto'

    try {
      if (assunto === 'a_faturar') {
        const todas = await listUnbilledSessions()
        const doPaciente = todas.filter(s => s.patientId === alvoId)
        return {
          ok: true,
          resposta: resumoAFaturar(doPaciente, nome),
          procedimentos: doPaciente.map(s => ({
            descricao: s.description, data: s.date, valor: s.amount,
          })),
        }
      }

      const titulos = await listPatientReceivables(alvoId)
      if (assunto === 'ultimo_pagamento') {
        return { ok: true, resposta: resumoDoUltimoPagamento(titulos, nome) }
      }

      const abertos = dividaDoPaciente(titulos)
      return {
        ok: true,
        resposta: resumoDoQueDeve(titulos, nome),
        // O detalhe vai junto para ela responder "quais?" sem outra chamada —
        // só o que o paciente deve, nunca as parcelas de cartão.
        emAberto: abertos.map(r => ({
          descricao: r.description,
          vencimento: r.dueDate,
          valor: restanteDoTitulo(r),
          vencido: r.status === 'overdue',
        })),
      }
    } catch (e) {
      return {
        ok: false,
        erro: errorMessage(
          e,
          'Não consegui ler o financeiro deste paciente — pode ser que o seu perfil de acesso não tenha o Financeiro liberado.',
        ),
      }
    }
  }

  async function consultarAgenda(p: {
    paciente?: string
    data?: string
    hora?: string
    duracao?: number
    dias?: number
    /** O recorte que ele escolheu ao responder PERGUNTA_DO_RECORTE. */
    mostrar?: FocoDaAgenda
  }, context?: CibellyToolContext) {
    if (!profId) {
      return { ok: false, erro: 'Seu login não está vinculado a um cadastro de profissional, então não sei de qual agenda falar.' }
    }
    const duracao = p.duracao ?? 60

    /**
     * O alvo é OPCIONAL aqui — diferente de agendar e cancelar, que exigem
     * saber de quem se trata.
     *
     * "Quem está agendado sexta às 9h?" não tem paciente para informar:
     * descobrir quem é É a pergunta. Antes esta função abria exigindo um alvo,
     * e no modo geral (pedal F) isso virava um laço — ela pedia o nome do
     * paciente para responder justamente o que revelaria o nome.
     *
     * No modo geral SEM nome não se assume o paciente aberto: o pedal F
     * significa "não é sobre quem está na cadeira".
     */
    const modoGeral = context?.listeningMode === 'general'
    let alvoId: string | null = null
    let pacienteAlvo: Patient | null = null
    if (p.paciente?.trim()) {
      const resolution = resolvePatientReference(pacientes ?? [], p.paciente)
      if (!resolution.ok) return { ok: false, erro: resolution.error }
      alvoId = resolution.patient.id
      pacienteAlvo = resolution.patient
    } else if (!modoGeral && patientId && paciente) {
      alvoId = patientId
      pacienteAlvo = paciente
    }

    // As consultas JÁ MARCADAS deste paciente vão em TODA resposta. Sem isto,
    // ela agendava mas não sabia responder "quando é a consulta dela?" —
    // acabava de marcar e, na pergunta seguinte, dizia que não sabia.
    const consultasDoPaciente = !alvoId ? [] : (consultas ?? [])
      .filter(a => a.patientId === alvoId && a.status !== 'canceled')
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .map(a => ({
        id: a.id,          // é por ele que o cancelamento identifica a consulta
        data: isoToBrDate(a.date),
        dataIso: a.date,
        quando: `${dataPorExtenso(a.date)}, às ${a.startTime}`,
        hora: a.startTime,
        servico: a.activity,
        situacao: a.status,
      }))

    // Data E hora: a pergunta é "esse horário serve?" OU "quem está aí?".
    if (p.data && p.hora) {
      // QUEM ocupa — a resposta que faltava. Vai em qualquer caso: livre ou
      // não, com alvo ou sem. A consulta das 8h30 ainda ocupa as 9h, e é por
      // isso que a sobreposição está testada em utils/agendaOccupancy.ts.
      const ocupando = consultasNoHorario(consultas ?? [], p.data, p.hora)
      const quemEsta = textoDaOcupacao(ocupando, nomeFaladoDoPaciente)
      const respostaQuem = ocupando.length === 0
        ? `Ninguém agendado em ${dataPorExtenso(p.data)} às ${p.hora}.`
        : `Em ${dataPorExtenso(p.data)} às ${p.hora}: ${quemEsta}.`

      const motivo = checkSlot(disponibilidade(), p.data, p.hora, duracao, hojeIso)
      if (!motivo) {
        return {
          ok: true, livre: true, data: p.data, hora: p.hora,
          agendados: quemEsta || undefined,
          resposta: respostaQuem,
          consultasDoPaciente,
        }
      }
      return {
        ok: true,
        livre: false,
        agendados: quemEsta || undefined,
        resposta: respostaQuem,
        motivo: UNAVAILABLE_LABEL[motivo],
        // Já devolve alternativas: recusar sem oferecer saída obriga o dentista
        // a perguntar de novo.
        alternativas: nextFreeSlots(disponibilidade(), p.data, duracao, hojeIso, 3),
        consultasDoPaciente,
      }
    }

    /**
     * "COMO ESTÁ MINHA AGENDA?" — devolve a PERGUNTA, não a agenda.
     *
     * Vem antes de qualquer ramo que monte lista: sem dia definido, sem
     * paciente e sem dizer o que quer ver, a resposta honesta é um recorte, e
     * qualquer coisa que a ferramenta devolvesse aqui viraria locução. Por isso
     * o retorno não traz vaga nem agendamento nenhum — ela não tem o que ler
     * além da pergunta. Ver perguntaAmplaDemais em utils/agendaOccupancy.ts.
     */
    if (perguntaAmplaDemais({
      data: p.data, dias: p.dias, temPacienteAlvo: Boolean(pacienteAlvo), foco: p.mostrar,
    })) {
      return { ok: true, precisaRecorte: true, resposta: PERGUNTA_DO_RECORTE }
    }

    // `dias` sem `data` é "a partir de hoje" — é como ele pergunta ("tenho
    // consulta essa semana?"), e sem isto a chamada caía no caminho antigo, que
    // devolve uma vaga por dia em vez dos blocos do período.
    if (p.data || p.dias || p.mostrar) {
      const inicioIso = p.data ?? hojeIso
      // PERÍODO numa chamada só. Sem isto, perguntada sobre "esta semana" ela
      // chamava a ferramenta um dia por vez — sete idas medidas num atendimento
      // real, cada uma relendo o prompt inteiro e devolvendo uma dúzia de
      // faixas sobrepostas. Demorou tanto que o dentista repetiu a pergunta.
      const dias = Math.min(Math.max(p.dias ?? 1, 1), 14)
      const inicio = new Date(`${inicioIso}T12:00:00Z`)
      const agenda = []
      for (let i = 0; i < dias; i++) {
        const iso = new Date(inicio.getTime() + i * 86_400_000).toISOString().slice(0, 10)
        // Já vem em BLOCOS ("08:00–12:00"), não em janelas de 30 min: é assim
        // que se fala, e é uma fração do texto de volta no contexto.
        const livres = mergeFreeSlots(freeSlotsOfDay(disponibilidade(), iso, duracao, hojeIso))
        agenda.push({ data: isoToBrDate(iso), dataIso: iso, dia: dataPorExtenso(iso).split(',')[0], livres })
      }
      // FRASE PRONTA para ela ler. Perguntada "essa semana tem consulta?", ela
      // respondeu só "sim" — a informação estava toda aqui e não foi dita.
      // Pedir no prompt para ser menos lacônica é a classe de regra que falha;
      // devolver a resposta escrita é a que funcionou nas datas.
      // A frase tem de falar do PERÍODO PERGUNTADO. Antes ela usava todas as
      // consultas do paciente: perguntado sobre a terça, o campo respondia
      // "tem consulta segunda-feira" — a Cibelly descartava a frase e compunha
      // sozinha, e era aí que ela demorava.
      const fimIso = agenda[agenda.length - 1]?.dataIso ?? inicioIso
      const noPeriodo = consultasDoPaciente.filter(c => c.dataIso >= inicioIso && c.dataIso <= fimIso)
      const livresNoPeriodo = agenda.filter(d => d.livres.length > 0)
      const resumoLivres = livresNoPeriodo
        .map(d => `${d.dia}: ${formatFreeStartRanges(d.livres)}`)
        .join('; ')

      // SEM paciente-alvo a frase fala da AGENDA, não de alguém: é o modo
      // geral perguntando "quem está marcado sexta?". Com alvo, o texto
      // continua igual ao de antes.
      const consultasTexto = !pacienteAlvo
        ? agenda
          .map(d => {
            const doDia = consultasDoDia(consultas ?? [], d.dataIso)
            return doDia.length === 0
              ? `${d.dia}: ninguém agendado.`
              : `${d.dia}: ${textoDaOcupacao(doDia, nomeFaladoDoPaciente)}.`
          })
          .join(' ')
        : noPeriodo.length > 0
          ? `${pacienteAlvo.name} já tem ${noPeriodo.length === 1 ? 'consulta' : noPeriodo.length + ' consultas'}: `
            + noPeriodo.map(c => c.quando).join('; ') + '.'
          : `${pacienteAlvo.name} não tem consulta nesse período.`
      // `fim` é a hora em que a última consulta TERMINA. A fala lista
      // `ultimoInicio`, senão "08:00 às 11:00" oferece 11:00 como início
      // justamente quando esse horário já pode estar ocupado.
      const vagasTexto = livresNoPeriodo.length === 0
        ? ' Não há outro horário livre nesse período.'
        : ` Para uma consulta de ${duracao} minutos, os horários de início livres são ${resumoLivres}.`

      // AS VAGAS SÓ ENTRAM QUANDO HÁ UM PACIENTE EM VISTA — ou quando ele
      // PEDIU as vagas.
      //
      // "Quem está agendado sexta?" é pergunta sobre a agenda, não pedido de
      // horário — e a resposta vinha com a lista de quem está marcado MAIS
      // todas as faixas livres do período, tudo lido em voz alta. Era uma
      // pergunta simples virando meio minuto de locução.
      //
      // Com paciente-alvo o par continua fazendo sentido: quem pergunta "a Ana
      // tem consulta essa semana?" quer saber se tem e, se não, quando dá.
      //
      // `mostrar` é o recorte que ele escolheu depois de PERGUNTA_DO_RECORTE:
      // uma coisa ou a outra, nunca as duas — foi para não ler as duas que a
      // pergunta existe.
      const resposta = p.mostrar === 'vagas'
        ? vagasTexto.trim()
        : p.mostrar === 'agendamentos'
          ? consultasTexto
          : pacienteAlvo ? consultasTexto + vagasTexto : consultasTexto

      /**
       * SÓ A FRASE PRONTA — `agenda` (os blocos livres de cada dia) NÃO volta.
       *
       * Ela já está resumida dentro de `resposta`, no recorte que o dentista
       * pediu. Devolver o array cru junto era entregar o material completo a um
       * modelo instruído a ser prestativo: perguntado "quem está marcado
       * sexta?", ele lia a frase E depois recitava as faixas livres dos sete
       * dias. Não dá para consertar isso pedindo brevidade — o jeito é não ter
       * o que recitar.
       */
      return { ok: true, resposta, consultasDoPaciente: noPeriodo }
    }
    // O que sobra é "quando é a consulta dela?" — alguém nomeado, sem dia.
    // Sem paciente E sem recorte, perguntaAmplaDemais já devolveu a pergunta lá
    // em cima; a checagem aqui é o compilador cobrando que o invariante seja
    // dito, e não presumido.
    if (!pacienteAlvo) {
      return { ok: true, precisaRecorte: true, resposta: PERGUNTA_DO_RECORTE }
    }
    return {
      ok: true,
      resposta: consultasDoPaciente.length === 0
        ? `${pacienteAlvo.name} não tem consulta marcada.`
        : `${pacienteAlvo.name} tem consulta em ${consultasDoPaciente.map(c => c.quando).join('; ')}.`,
      consultasDoPaciente,
      proximasVagas: nextFreeSlots(disponibilidade(), hojeIso, duracao, hojeIso, 5),
    }
  }

  /**
   * Cancela uma consulta já marcada do paciente em atendimento.
   *
   * Identifica por data + hora (é como o dentista fala: "cancela a das 15h"),
   * nunca por posição na lista — "a segunda" mudaria de significado entre a
   * leitura e o comando. Cancela, não apaga: a consulta continua no histórico
   * com status 'canceled', e o horário volta a ficar livre (cancelada e falta
   * não ocupam, mesmo recorte do resto do sistema).
   */
  async function cancelarConsulta(p: {
    paciente?: string
    data: string
    hora?: string
    confirmado?: boolean
    ditoPeloDentista?: string
  }) {
    const alvoPaciente = pacienteParaAgenda(p.paciente)
    if (!alvoPaciente.ok) return alvoPaciente

    // A FRASE precisa ter pedido cancelamento. Num atendimento real, um ruído
    // transcrito como "Senhor Nando." fez ela anunciar "vou iniciar o
    // cancelamento conforme você confirmou" e chamar esta ferramenta — ninguém
    // tinha pedido nada. A confirmação em duas etapas segurou, mas é a última
    // linha; esta é a primeira.
    if (!pediuCancelamento(p.ditoPeloDentista)) {
      return {
        ok: false,
        erro: 'Não ouvi pedido de cancelamento. NÃO cancele nada e NÃO diga que ele confirmou algo — '
          + 'se achou que ele pediu, pergunte com todas as letras antes de tentar de novo.',
      }
    }

    const doPaciente = (consultas ?? []).filter(
      a => a.patientId === alvoPaciente.id && a.status !== 'canceled' && a.date === p.data,
    )
    const alvos = p.hora ? doPaciente.filter(a => a.startTime === p.hora) : doPaciente

    if (alvos.length === 0) {
      return { ok: false, erro: `Não achei consulta desse paciente em ${isoToBrDate(p.data)}${p.hora ? ` às ${p.hora}` : ''}.` }
    }
    // Ambiguidade não se resolve no chute: com duas no mesmo dia e sem hora
    // dita, cancelar a errada é pior que perguntar.
    if (alvos.length > 1) {
      return {
        ok: false,
        erro: 'Há mais de uma consulta nesse dia. Qual horário?',
        opcoes: alvos.map(a => a.startTime),
      }
    }

    const alvo = alvos[0]

    // CONFIRMAÇÃO OBRIGATÓRIA — diferente de marcar dente, que se desfaz com
    // uma palavra. Cancelar atinge o PACIENTE: ele pode ter sido avisado, pode
    // já estar a caminho, e o horário volta a ser vendido para outra pessoa.
    // Uma frase mal entendida não pode desmarcar ninguém, então a ferramenta
    // devolve o que SERIA cancelado e só age na segunda chamada.
    if (!p.confirmado) {
      return {
        ok: true,
        precisaConfirmar: true,
        consulta: {
          paciente: alvoPaciente.patient.name,
          data: isoToBrDate(alvo.date),
          quando: `${dataPorExtenso(alvo.date)}, às ${alvo.startTime}`,
          hora: alvo.startTime,
          servico: alvo.activity,
        },
        instrucao: 'Leia estes dados em voz alta e pergunte se pode cancelar. Só chame de novo, com confirmado=true, depois de um sim claro.',
      }
    }

    try {
      await atualizarConsulta.mutateAsync({
        id: alvo.id,
        payload: { ...alvo, status: 'canceled' },
      })
    } catch (e) {
      return { ok: false, erro: errorMessage(e, 'Não foi possível cancelar.') }
    }
    return { ok: true, cancelada: `${isoToBrDate(p.data)} às ${alvo.startTime}` }
  }

  async function agendarConsulta(p: {
    paciente?: string
    data: string; hora?: string; duracao?: number; servico?: string; encaixe?: boolean
    sala?: string; confirmaFimDeSemana?: boolean; ditoPeloDentista?: string; confirmaData?: boolean
  }) {
    const alvoPaciente = pacienteParaAgenda(p.paciente)
    if (!alvoPaciente.ok) return alvoPaciente
    if (!profId) return { ok: false, erro: 'Seu login não está vinculado a um cadastro de profissional.' }

    // DATA AMBÍGUA — a trava mais importante daqui.
    //
    // "quinta que vem" tem duas leituras em português, e medi as duas saindo do
    // MESMO modelo no MESMO dia (30/07 numa rodada, 06/08 na outra). Pedir no
    // prompt para ela perguntar não funcionou: ela não se percebe em dúvida.
    // Então ela declara a frase que ouviu e QUEM JULGA É O CÓDIGO — mesma
    // doutrina do cancelamento e do fim de semana.
    const ambigua = p.confirmaData ? null : datasAmbiguas(p.ditoPeloDentista, hojeIso)
    if (ambigua) {
      return {
        ok: true,
        precisaConfirmar: true,
        opcoes: [dataPorExtenso(ambigua.proxima), dataPorExtenso(ambigua.seguinte)],
        instrucao: 'Pergunte qual das duas, lendo as datas. Depois chame de novo com a data escolhida e confirmaData=true.',
      }
    }

    // Antes de checar horário: sem saber a sala, nem adianta seguir. A regra
    // (uma sala resolve sozinha, duas ou mais precisam de escolha) mora em
    // utils/roomChoice.ts, com teste — nome falado tem caso de borda demais
    // para ficar solto aqui dentro.
    const escolha = chooseRoom((salas ?? []).map(s => s.name), p.sala)
    if (!escolha.ok) return { ok: false, erro: escolha.reason, salas: escolha.rooms }

    const duracao = p.duracao ?? 60

    /**
     * SEM HORÁRIO, NÃO MARCA — oferece.
     *
     * `hora` era campo OBRIGATÓRIO no schema da ferramenta: pedindo "marca um
     * retorno pra ela semana que vem", o modelo não tinha como chamar sem um
     * horário, então inventava um. E inventado ele passa por todas as travas
     * daqui — o horário existe, está livre, a sala resolve — e vira consulta
     * de verdade, com o paciente avisado por WhatsApp de um horário que
     * ninguém escolheu.
     *
     * Pedir no prompt para ela perguntar não resolveria: o campo obrigatório é
     * uma força maior que qualquer instrução. A correção é o schema deixar de
     * exigir e o CÓDIGO recusar — mesma doutrina da data ambígua logo acima.
     */
    if (!p.hora?.trim()) {
      const livres = mergeFreeSlots(freeSlotsOfDay(disponibilidade(), p.data, duracao, hojeIso))
      return {
        ok: true,
        precisaConfirmar: true,
        data: dataPorExtenso(p.data),
        // Faixas de INÍCIO, não blocos: "08:00 às 11:00" ofereceria 11:00 como
        // início justamente quando esse horário já não cabe a consulta inteira.
        horariosLivres: livres.length ? formatFreeStartRanges(livres) : null,
        instrucao: livres.length
          ? 'O dentista não disse a hora. Leia os horários livres desse dia e pergunte qual ele quer. '
            + 'Só chame de novo depois que ele escolher, com a hora em HH:MM.'
          : 'O dentista não disse a hora, e esse dia não tem horário livre para essa duração. '
            + 'Diga isso e pergunte que outro dia ele quer.',
      }
    }

    // Encaixe é a única forma de furar a regra, e só quando pedido de propósito.
    if (!p.encaixe) {
      const motivo = checkSlot(disponibilidade(), p.data, p.hora, duracao, hojeIso)
      if (motivo) {
        return {
          ok: false,
          erro: UNAVAILABLE_LABEL[motivo],
          alternativas: nextFreeSlots(disponibilidade(), p.data, duracao, hojeIso, 3),
        }
      }
    }

    // FIM DE SEMANA — avisa e pergunta, depois de o horário já ter passado na
    // checagem de disponibilidade (avisar sobre um sábado para depois recusar o
    // horário seriam dois incômodos para chegar no mesmo "não").
    //
    // Aviso, nunca recusa: clínica que atende sábado existe, e o dentista é
    // quem sabe. O que se evita é o cálculo relativo inocente — "daqui a duas
    // semanas" cai em fim de semana com frequência e quase nunca é o que ele
    // quis, e aí o paciente é quem descobre.
    const diaDeFimDeSemana = fimDeSemana(p.data)
    if (diaDeFimDeSemana && !p.confirmaFimDeSemana) {
      return {
        ok: true,
        precisaConfirmar: true,
        aviso: `${dataPorExtenso(p.data)} é ${diaDeFimDeSemana}.`,
        instrucao: 'Diga isso em voz alta e pergunte se pode marcar assim mesmo. Só chame de novo, com confirmaFimDeSemana=true, depois de um sim.',
      }
    }

    let confirmacaoWhatsapp: { status: string; reason?: string } | undefined
    try {
      const criada = await agendar.mutateAsync({
        patientId: alvoPaciente.id,
        professionalId: profId,
        activity: p.servico?.trim() || 'Consulta',
        date: p.data,
        startTime: p.hora,
        endTime: addMinutes(p.hora, duracao),
        status: 'scheduled',
        isOverbook: p.encaixe ?? false,
        room: escolha.room,
      })
      confirmacaoWhatsapp = criada.confirmation
    } catch (e) {
      // A trava do banco (agenda dupla, sala ocupada) chega aqui — o texto dela
      // é mais preciso que qualquer coisa que eu inventasse.
      return { ok: false, erro: errorMessage(e, 'Não foi possível agendar.') }
    }

    return {
      ok: true,
      agendado: `${alvoPaciente.patient.name} em ${isoToBrDate(p.data)} às ${p.hora}`,
      // A confirmação sai daqui PRONTA para ser lida. Deixar ela deduzir o dia
      // da semana foi o que produziu "quinta dia 30, do mês que vem" num dia 26
      // do mesmo mês — a data certa, dita errado.
      quando: `${dataPorExtenso(p.data)}, às ${p.hora}`,
      distancia: distanciaDeHoje(p.data, hojeIso),
      sala: escolha.room,
      encaixe: p.encaixe ?? false,
      confirmacaoWhatsapp,
    }
  }

  async function consultarMateriais(busca?: string, somenteAcabando?: boolean) {
    const todos = await listMaterialsWithSuppliers()
    const termo = busca?.trim().toLowerCase()
    return todos
      .filter(m => (!termo || m.nome.toLowerCase().includes(termo)))
      .filter(m => (!somenteAcabando || m.acabando))
  }

  /**
   * Registra o consumo ditado. A BAIXA no estoque acontece no banco, quando o
   * atendimento é encerrado e os materiais entram no procedimento (trigger
   * tr_material_stock) — não aqui: dar baixa agora e o dentista fechar a aba
   * sem encerrar deixaria o estoque menor do que a realidade, sem procedimento
   * nenhum para justificar.
   *
   * O retorno já projeta como o estoque VAI ficar, que é o que ela precisa para
   * avisar "está acabando" na hora, e não só no fim.
   */
  async function registrarMaterialUsado(materiais: { nome: string; quantidade: string }[]) {
    const cadastro = await listMaterialsWithSuppliers()

    return materiais.map(uso => {
      const termo = uso.nome.trim().toLowerCase()
      const m = cadastro.find(c => c.nome.toLowerCase() === termo)
        ?? cadastro.find(c => c.nome.toLowerCase().includes(termo))

      if (!m) {
        return { nome: uso.nome, ok: false, erro: 'Material não encontrado no cadastro.' }
      }

      materiaisUsadosRef.current.push({ nome: m.nome, quantidade: uso.quantidade, materialId: m.id })

      // Mesma leitura da trigger: número do início do texto, senão não baixa.
      const qtd = Number((uso.quantidade.match(/^\s*(\d+([.,]\d+)?)/)?.[1] ?? '').replace(',', '.'))
      const restante = Number.isFinite(qtd) && qtd > 0 ? m.estoque - qtd : m.estoque

      return {
        nome: m.nome,
        ok: true,
        usado: uso.quantidade,
        restante,
        minimo: m.minimo,
        acabando: restante <= m.minimo,
        fornecedores: m.fornecedores.map(f => f.nome),
      }
    })
  }

  function mensagemDeErroDoWhatsApp(error: unknown): string {
    const code = errorMessage(error, 'whatsapp_send_failed')
    if (code.includes('whatsapp_not_connected')) {
      return 'O WhatsApp da clínica não está conectado.'
    }
    if (code.includes('forbidden')) {
      return 'Seu acesso não permite enviar mensagens pelo WhatsApp.'
    }
    if (code.includes('rate_limited')) {
      return 'O limite de segurança de mensagens foi atingido. Aguarde antes de enviar novamente.'
    }
    if (code.includes('recipient_without_whatsapp')) {
      return 'O destinatário não tem WhatsApp cadastrado.'
    }
    if (code.includes('invalid_phone')) {
      return 'O WhatsApp cadastrado é inválido. Informe DDD e número; o DDI 55 é adicionado automaticamente.'
    }
    if (code.includes('send_failed')) {
      const detail = code.match(/send_failed(?::\s*([^]+))?/)?.[1]?.trim()
      return detail
        ? `A Evolution API recusou o envio: ${detail}`
        : 'A Evolution API recusou o envio. Verifique a conexão da instância e o WhatsApp do destinatário.'
    }
    if (code.includes('evolution_not_configured')) {
      return 'A Evolution API ainda não está configurada para esta instalação.'
    }
    if (code.includes('recipient_lookup_failed')) {
      return 'Não foi possível localizar os destinatários cadastrados.'
    }
    if (code.includes('send_claim_failed')) {
      return 'Não foi possível registrar o envio com segurança. Tente novamente.'
    }
    return 'Não foi possível enviar a mensagem pelo WhatsApp.'
  }

  /**
   * Mensagem ao paciente. SEM o campo `paciente`, o destinatário é o que está
   * aberto no odontograma; COM ele, o cadastro é consultado por nome.
   *
   * A resolução por nome mora em utils/messageRecipient.ts e nunca escolhe
   * entre homônimos — duas "Ana" viram pergunta, não aposta. O número não
   * trafega aqui em momento nenhum: vai o ID, e o servidor resolve o telefone
   * dentro da clínica.
   *
   * A primeira chamada só devolve a prévia; a segunda precisa repetir
   * exatamente paciente + texto (a impressão digital inclui o ID, então
   * confirmar para um paciente não envia para outro).
   */
  async function enviarMensagemPaciente(pedido: PatientMessageRequest) {
    let alvoId = patientId
    let alvoNome = paciente ? `${paciente.name} (${paciente.code})` : ''

    if (pedido.paciente?.trim()) {
      const escolha = resolverDestinatario(pacientes ?? [], pedido.paciente)
      if (!escolha.ok) return { ok: false, erro: escolha.erro }
      alvoId = escolha.paciente.id
      alvoNome = descreverPaciente(escolha.paciente)
    } else {
      if (!patientId || !paciente) {
        return { ok: false, erro: 'Nenhum paciente em atendimento. Diga o nome de quem deve receber.' }
      }
      if (!paciente.whatsapp) {
        return { ok: false, erro: `${paciente.name} não tem WhatsApp cadastrado.` }
      }
    }
    if (!alvoId) return { ok: false, erro: 'Não consegui identificar o destinatário.' }

    const mensagem = pedido.mensagem.trim()
    if (!mensagem) return { ok: false, erro: 'A mensagem está vazia.' }

    if (!pedido.confirmado) {
      pendingPatientMessageRef.current = pendingMessageConfirmation([alvoId], mensagem)
      return {
        ok: true,
        precisaConfirmar: true,
        destinatario: alvoNome,
        mensagem,
        instrucao:
          'Leia o destinatário COMPLETO (nome e código) e a mensagem. Só chame novamente com confirmado=true depois de um sim claro.',
      }
    }

    if (!matchesPendingMessage(pendingPatientMessageRef.current, [alvoId], mensagem)) {
      pendingPatientMessageRef.current = pendingMessageConfirmation([alvoId], mensagem)
      return {
        ok: true,
        precisaConfirmar: true,
        destinatario: alvoNome,
        mensagem,
        instrucao:
          'A confirmação anterior não corresponde a este paciente ou a esta mensagem. Leia novamente e aguarde um sim claro.',
      }
    }

    pendingPatientMessageRef.current = null
    try {
      const envio = await sendWhatsAppMessage(
        [{ type: 'patient', id: alvoId }],
        mensagem,
      )
      return {
        ok: true,
        enviado: envio.sent > 0,
        reutilizado: envio.results.some(item => item.reused),
        // `alvoNome`, e não o paciente aberto: com destinatário por nome os
        // dois divergem, e confirmar em voz alta o nome errado depois de já
        // ter enviado é pior do que não confirmar nada.
        destinatario: alvoNome,
      }
    } catch (error) {
      return { ok: false, erro: mensagemDeErroDoWhatsApp(error) }
    }
  }

  /**
   * Pedido de orçamento por WhatsApp aos fornecedores.
   *
   * QUEM decide o que cotar é `resolverPedidoDeOrcamento` (puro, testado) —
   * inclusive o caso que quebrou em atendimento real, de nome de FORNECEDOR
   * chegando no campo do material. Aqui fica só o que tem efeito: montar a
   * mensagem, confirmar e enviar.
   */
  async function solicitarOrcamento(pedido: QuoteRequest) {
    const cadastro = await listMaterialsWithSuppliers()
    const alvo = resolverPedidoDeOrcamento(cadastro, pedido)
    if (!alvo.ok) return alvo

    // Só os fornecedores pedidos (quando o dentista nomeou um) e com WhatsApp.
    const filtroFornecedor = pedido.fornecedor?.trim()
    const semWhatsapp = new Set<string>()
    /** fornecedor → materiais que ELE fornece dentre os escolhidos. */
    const porFornecedor = new Map<string, { nome: string; materiais: string[] }>()

    for (const m of alvo.materiais) {
      for (const f of m.fornecedores) {
        if (filtroFornecedor && !matchesSearch(f.nome, filtroFornecedor)) continue
        if (!f.whatsapp) { semWhatsapp.add(f.nome); continue }
        const atual = porFornecedor.get(f.id) ?? { nome: f.nome, materiais: [] }
        atual.materiais.push(m.nome)
        porFornecedor.set(f.id, atual)
      }
    }

    if (porFornecedor.size === 0) {
      const nomes = alvo.materiais.map(m => m.nome).join(', ')
      return {
        ok: false,
        erro: semWhatsapp.size
          ? `Nenhum fornecedor de ${nomes} tem WhatsApp cadastrado.`
          : `${nomes} não tem fornecedor cadastrado. Cadastre em Administrativo → Fornecedores.`,
      }
    }

    // Cada fornecedor recebe UMA mensagem com a lista dele — não uma por
    // material, que encheria o WhatsApp de quem fornece três coisas.
    // Fornecedores com a mesma lista compartilham o mesmo texto e vão num
    // envio só (é o caso comum, de um material com vários fornecedores).
    const quantidade = pedido.quantidade?.trim()
    const textoDe = (materiais: string[]) => {
      const itens = materiais.length === 1 && quantidade
        ? `${quantidade} de ${materiais[0]}`
        : materiais.join(', ')
      return `Olá! Aqui é da ${clinica?.name ?? 'clínica'}. Gostaríamos de solicitar `
        + `um orçamento para ${itens}. Por favor, informe valor, disponibilidade, `
        + 'prazo de entrega e condições de pagamento.'
    }

    const lotes = new Map<string, { ids: string[]; nomes: string[] }>()
    for (const [id, dados] of porFornecedor) {
      const texto = textoDe(dados.materiais)
      const lote = lotes.get(texto) ?? { ids: [], nomes: [] }
      lote.ids.push(id)
      lote.nomes.push(dados.nome)
      lotes.set(texto, lote)
    }

    const todosIds = [...porFornecedor.keys()]
    const todosNomes = [...porFornecedor.values()].map(f => f.nome)
    // Uma confirmação para o pedido INTEIRO: a impressão digital cobre todos os
    // destinatários e todos os textos juntos, então mudar qualquer parte exige
    // confirmar de novo.
    const assinatura = [...lotes.keys()].sort().join('\n---\n')

    if (
      !pedido.confirmado ||
      !matchesPendingMessage(pendingSupplierMessageRef.current, todosIds, assinatura)
    ) {
      pendingSupplierMessageRef.current = pendingMessageConfirmation(todosIds, assinatura)
      return {
        ok: true,
        precisaConfirmar: true,
        materiais: alvo.materiais.map(m => m.nome),
        destinatarios: todosNomes,
        mensagens: [...lotes.entries()].map(([texto, lote]) => ({ para: lote.nomes, texto })),
        semWhatsapp: semWhatsapp.size ? [...semWhatsapp] : undefined,
        instrucao:
          'Leia os destinatários e pergunte se pode enviar. Só chame novamente com confirmado=true depois de um sim claro.',
      }
    }

    pendingSupplierMessageRef.current = null
    try {
      const enviados: string[] = []
      const falhas: string[] = []
      let total = 0
      for (const [texto, lote] of lotes) {
        const envio = await sendWhatsAppMessage(
          lote.ids.map(id => ({ type: 'supplier' as const, id })),
          texto,
        )
        total += envio.sent
        enviados.push(...envio.results.flatMap(i => i.sent && i.name ? [i.name] : []))
        falhas.push(...envio.results.flatMap(i => !i.sent && !i.pending && i.name ? [i.name] : []))
      }
      return {
        ok: true,
        enviado: total,
        materiais: alvo.materiais.map(m => m.nome),
        destinatarios: enviados,
        falhas: falhas.length ? falhas : undefined,
        semWhatsapp: semWhatsapp.size ? [...semWhatsapp] : undefined,
      }
    } catch (error) {
      return { ok: false, erro: mensagemDeErroDoWhatsApp(error) }
    }
  }

  // ── CARRINHO DE COMPRAS ────────────────────────────────────────────────────

  /**
   * "Cibelly, poe resina A2 no carrinho."
   *
   * Casa com o catálogo quando dá; quando não dá, guarda o que foi DITO. O
   * dentista fala "luva tamanho P" e o item pode não estar cadastrado —
   * recusar a fala transformaria o carrinho num formulário de cadastro no meio
   * do atendimento, que é o oposto do que ele serve.
   */
  async function adicionarAoCarrinho(pedido: CartAddRequest) {
    const nome = pedido.produto?.trim()
    if (!nome) return { ok: false, erro: 'Não entendi qual produto pôr no carrinho.' }

    /**
     * A busca no catálogo é CONVENIÊNCIA, não pré-requisito — e estava sem
     * rede.
     *
     * Ela serve só para ligar o item a um material cadastrado (e, por ele, a um
     * fornecedor). Fora de um `try`, qualquer falha da RPC derrubava a chamada
     * inteira ANTES de tocar no carrinho: o dentista dizia "põe fio de sutura
     * no carrinho", nada era anotado, e a exceção subia sem virar um `erro`
     * legível — a Cibelly não tinha o que dizer além de uma falha genérica.
     *
     * Falhando, segue como item FORA do catálogo: é exatamente o caminho que
     * esta função já trata para um nome que não existe no cadastro, com aviso
     * de que não haverá fornecedor ligado. Anotar sem fornecedor é muito melhor
     * que não anotar.
     */
    let achado: Awaited<ReturnType<typeof listMaterialsWithSuppliers>>[number] | undefined
    try {
      const materiais = await listMaterialsWithSuppliers()
      achado = materiais.find(m => matchesSearch(m.nome, nome))
    } catch {
      achado = undefined
    }

    try {
      await addToPurchaseList({
        materialId: achado?.id,
        label: achado ? undefined : nome,
        quantidade: pedido.quantidade,
        unidade: pedido.unidade,
        observacao: pedido.observacao,
      })
    } catch (e) {
      return { ok: false, erro: errorMessage(e, 'Não consegui pôr no carrinho.') }
    }

    const qtd = pedido.quantidade
      ? `${pedido.quantidade}${pedido.unidade ? ` ${pedido.unidade}` : ''} de `
      : ''
    return {
      ok: true,
      // Frase pronta: a Cibelly lê isto. O aviso de item fora do catálogo é o
      // que impede o dentista de achar que o pedido vai chegar a alguém.
      resposta: achado
        ? `Anotei ${qtd}${achado.nome} no carrinho.`
        : `Anotei ${qtd}${nome} no carrinho. Esse item não está no cadastro de materiais, então não tem fornecedor ligado — no orçamento eu aviso.`,
    }
  }

  /** "Cibelly, quais produtos estão no carrinho?" */
  async function consultarCarrinho() {
    const itens = await listPurchaseList()
    if (itens.length === 0) return { ok: true, resposta: 'O carrinho está vazio.' }

    const linhas = itens.map(i => {
      const qtd = i.quantidade ? `${i.quantidade}${i.unidade ? ` ${i.unidade}` : ''} de ` : ''
      return `${qtd}${i.nome}`
    })
    return {
      ok: true,
      resposta: `${itens.length} ${itens.length === 1 ? 'item' : 'itens'} no carrinho: ${linhas.join(', ')}.`,
    }
  }

  /**
   * "Cibelly, pede orçamento do carrinho."
   *
   * DUAS ETAPAS, com a mesma trava do orçamento avulso: a confirmação carrega
   * a assinatura do pedido INTEIRO — destinatários e textos juntos —, então
   * mudar qualquer parte entre o "confirma?" e o "sim" invalida o aceite.
   * Mensagem para fornecedor é ação para FORA, e não sai de uma frase mal
   * ouvida no barulho do consultório.
   */
  async function pedirOrcamentoDoCarrinho(pedido: CartQuoteRequest) {
    const carrinho = await getCartBySupplier()
    if (carrinho.totalItens === 0) {
      return { ok: false, erro: 'O carrinho está vazio — não há o que orçar.' }
    }

    const nomeClinica = clinica?.name ?? 'clínica'
    const grupos = carrinho.fornecedores.map(g => ({
      ...g,
      texto: mensagemDoOrcamento(g, nomeClinica),
    }))

    /** O que NÃO vai sair — dito ANTES do envio, não depois. */
    const avisos: string[] = []
    if (carrinho.semFornecedor.length) {
      avisos.push(`Sem fornecedor cadastrado: ${carrinho.semFornecedor.map(i => i.nome).join(', ')}.`)
    }

    const ids = grupos.map(g => g.supplierId)
    const assinatura = grupos.map(g => g.texto).sort().join('\n---\n')

    if (
      !pedido.confirmado
      || !matchesPendingMessage(pendingSupplierMessageRef.current, ids, assinatura)
    ) {
      pendingSupplierMessageRef.current = pendingMessageConfirmation(ids, assinatura)
      return {
        ok: true,
        precisaConfirmar: true,
        destinatarios: grupos.map(g => g.fornecedor),
        pedidos: grupos.map(g => ({ para: g.fornecedor, itens: g.itens.map(i => i.nome) })),
        semFornecedor: carrinho.semFornecedor.length
          ? carrinho.semFornecedor.map(i => i.nome)
          : undefined,
        instrucao:
          'Leia quem recebe o quê e o que ficou de fora, e pergunte se pode enviar. Só chame de novo com confirmado=true depois de um sim claro.',
      }
    }

    pendingSupplierMessageRef.current = null
    const enviados: string[] = []
    const falhas: string[] = []
    for (const g of grupos) {
      // GRAVA ANTES de mandar: se o envio falhar, o pedido fica com o motivo
      // registrado em vez de desaparecer — e o dentista descobre olhando, não
      // quando o material não chega.
      const quoteId = await registrarOrcamento(g.supplierId, g.texto, g.itens.map(i => i.id))
      try {
        const envio = await sendWhatsAppMessage([{ type: 'supplier', id: g.supplierId }], g.texto)
        const ok = envio.sent > 0
        await marcarEnvioDoOrcamento(quoteId, ok, ok ? undefined : 'Fornecedor sem WhatsApp ou envio recusado')
        if (ok) enviados.push(g.fornecedor)
        else falhas.push(g.fornecedor)
      } catch (error) {
        await marcarEnvioDoOrcamento(quoteId, false, mensagemDeErroDoWhatsApp(error))
        falhas.push(g.fornecedor)
      }
    }

    return {
      ok: enviados.length > 0,
      enviado: enviados.length,
      destinatarios: enviados,
      falhas: falhas.length ? falhas : undefined,
      semFornecedor: carrinho.semFornecedor.length
        ? carrinho.semFornecedor.map(i => i.nome)
        : undefined,
      avisos: avisos.length ? avisos : undefined,
    }
  }

  return {
    /** Consumo ditado na sessão — a página o esvazia ao encerrar o atendimento. */
    materiaisUsadosRef,
    lembretes,
    documentoPendente,
    fecharPreviaDocumento,
    orcamentoPendente,
    fecharPreviaOrcamento,
    consultarPacientes,
    emitirDocumento,
    criarOrcamentoPaciente,
    consultarMateriais,
    registrarMaterialUsado,
    solicitarOrcamento,
    adicionarAoCarrinho,
    consultarCarrinho,
    pedirOrcamentoDoCarrinho,
    enviarMensagemPaciente,
    consultarAgenda,
    agendarConsulta,
    consultarHistorico,
    consultarFinanceiroPaciente,
    cancelarConsulta,
    criarLembrete,
    concluirLembrete,
  }
}
