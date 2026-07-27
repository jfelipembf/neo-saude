import { useRef, useState } from 'react'
import type { Patient } from '@/types/domain'
import { useSession } from '@/context/SessionProvider'
import { useCurrentUser } from '@/hooks/useUser'
import { useClinic } from '@/hooks/useClinic'
import { usePatients } from '@/hooks/usePatients'
import { usePatientName } from '@/hooks/useDisplayNames'
import { useRooms } from '@/hooks/useRooms'
import { useCreatePrescription } from '@/hooks/usePrescriptions'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { usePatientReminders, useAddReminder, useCloseReminder } from '@/hooks/usePatientReminders'
import { usePatientClinicalSummary } from '@/hooks/usePatientOdontogram'
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
} from '@/lib/cibelly/sessionTypes'
import {
  matchesPendingMessage, pendingMessageConfirmation,
  type PendingMessageConfirmation,
} from '@/lib/cibelly/messageConfirmation'
import { consultasDoDia, consultasNoHorario, textoDaOcupacao } from '@/utils/agendaOccupancy'
import { chooseRoom } from '@/utils/roomChoice'
import { descreverPaciente, resolverDestinatario } from '@/utils/messageRecipient'
import { spokenName } from '@/utils/spokenName'
import { resolverPedidoDeOrcamento } from '@/utils/quoteRequest'
import { resumoPorDente, resumoUltimosAtendimentos } from '@/utils/clinicalHistorySpeech'
import { pediuCancelamento } from '@/utils/cancelIntent'
import { dataPorExtenso, distanciaDeHoje, fimDeSemana, datasAmbiguas } from '@/utils/spokenDate'
import { addMinutes, formatLongDate, toIsoDate, isoToBrDate } from '@/utils/date'
import { formatCpf } from '@/utils/format'
import { matchesSearch } from '@/utils/search'
import { errorMessage } from '@/utils/errors'
import {
  CLINICAL_DOCUMENT_STYLES, attendanceCertificateText, certificateBody,
  examRequestBody, leaveCertificateText, prescriptionBody,
} from '@/utils/clinicalDocument'
import { listMaterialsWithSuppliers } from '@/services/materialsService'
import { sendWhatsAppMessage } from '@/services/whatsappService'
import { searchPatientHistory } from '@/services/odontogramService'
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
  const imprimir = usePrintDocument()
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
      return { ok: false as const, erro: errorMessage(e, 'Não foi possível salvar o documento.') }
    }

    imprimir({ title: titulo, subtitle: paciente.name, body: corpo, styles: CLINICAL_DOCUMENT_STYLES })
    return { ok: true as const, resumo }
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

  async function consultarAgenda(p: {
    paciente?: string
    data?: string
    hora?: string
    duracao?: number
    dias?: number
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

    // `dias` sem `data` é "a partir de hoje" — é como ele pergunta ("tenho
    // consulta essa semana?"), e sem isto a chamada caía no caminho antigo, que
    // devolve uma vaga por dia em vez dos blocos do período.
    if (p.data || p.dias) {
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

      // AS VAGAS SÓ ENTRAM QUANDO HÁ UM PACIENTE EM VISTA.
      //
      // "Quem está agendado sexta?" é pergunta sobre a agenda, não pedido de
      // horário — e a resposta vinha com a lista de quem está marcado MAIS
      // todas as faixas livres do período, tudo lido em voz alta. Era uma
      // pergunta simples virando meio minuto de locução.
      //
      // Com paciente-alvo o par continua fazendo sentido: quem pergunta "a Ana
      // tem consulta essa semana?" quer saber se tem e, se não, quando dá.
      const resposta = pacienteAlvo ? consultasTexto + vagasTexto : consultasTexto

      return { ok: true, resposta, consultasDoPaciente: noPeriodo, agenda }
    }
    // Sem data, sem hora e sem paciente: "como está a agenda?". Responde as
    // próximas vagas, que é a única leitura possível sem nenhum recorte.
    if (!pacienteAlvo) {
      return {
        ok: true,
        resposta: 'Diga o dia (e a hora, se quiser) para eu ver quem está agendado, ou o nome do paciente.',
        proximasVagas: nextFreeSlots(disponibilidade(), hojeIso, duracao, hojeIso, 5),
      }
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
    data: string; hora: string; duracao?: number; servico?: string; encaixe?: boolean
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
  return {
    /** Consumo ditado na sessão — a página o esvazia ao encerrar o atendimento. */
    materiaisUsadosRef,
    lembretes,
    consultarPacientes,
    emitirDocumento,
    consultarMateriais,
    registrarMaterialUsado,
    solicitarOrcamento,
    enviarMensagemPaciente,
    consultarAgenda,
    agendarConsulta,
    consultarHistorico,
    cancelarConsulta,
    criarLembrete,
    concluirLembrete,
  }
}
