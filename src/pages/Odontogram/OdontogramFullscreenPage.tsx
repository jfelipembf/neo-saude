import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import OdontogramShell, { getOdontogramState, loadOdontogramState } from '@/lib/odontogramShell/odontogram-shell'
import '@/lib/odontogramShell/odontogram-shell.css'
import { hideDefaultLayers } from '@/lib/odontogramShell/layers'
import {
  useCibelly,
  type DocumentRequest,
  type PatientMessageRequest,
  type QuoteRequest,
} from '@/hooks/useCibelly'
import { useCreatePrescription } from '@/hooks/usePrescriptions'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { useCurrentUser } from '@/hooks/useUser'
import { useClinic } from '@/hooks/useClinic'
import { usePatients } from '@/hooks/usePatients'
import { useRooms } from '@/hooks/useRooms'
import { chooseRoom } from '@/utils/roomChoice'
import { readOdontogram, travarEscritaNoOdontograma } from '@/lib/odontogramShell/toothFields'
import { agruparAchados, notasLivres } from '@/utils/toothNoteGroups'
import { resumoPorDente, resumoUltimosAtendimentos } from '@/utils/clinicalHistorySpeech'
import { resolverPedidoDeOrcamento } from '@/utils/quoteRequest'
import { matchesSearch } from '@/utils/search'
import { OdontogramTimeline } from './OdontogramTimeline'
import { pediuCancelamento } from '@/utils/cancelIntent'
import { dataPorExtenso, distanciaDeHoje, fimDeSemana, datasAmbiguas } from '@/utils/spokenDate'
import { usePatientReminders, useAddReminder, useCloseReminder } from '@/hooks/usePatientReminders'
import {
  CLINICAL_DOCUMENT_STYLES, attendanceCertificateText, certificateBody,
  examRequestBody, leaveCertificateText, prescriptionBody,
} from '@/utils/clinicalDocument'
import { listMaterialsWithSuppliers } from '@/services/materialsService'
import { sendWhatsAppMessage } from '@/services/whatsappService'
import {
  matchesPendingMessage,
  pendingMessageConfirmation,
  type PendingMessageConfirmation,
} from '@/lib/cibelly/messageConfirmation'
import { searchPatientHistory } from '@/services/odontogramService'
import { useAvailabilityTemplate, useAbsences, useBlockedSlots } from '@/hooks/useProfessionalAvailability'
import {
  useCreateScheduleAppointment, useScheduleAppointments, useUpdateScheduleAppointment,
} from '@/hooks/useSchedule'
import {
  checkSlot, formatFreeStartRanges, freeSlotsOfDay, mergeFreeSlots,
  nextFreeSlots, UNAVAILABLE_LABEL,
  type AvailabilityInput,
} from '@/utils/availability'
import { formatCpf } from '@/utils/format'
import { addMinutes, formatLongDate, toIsoDate, isoToBrDate } from '@/utils/date'
import {
  useOdontogramRevision, useOdontogramRevisions, usePatientClinicalSummary, usePatientOdontogram,
  useRecordExamSession, useSavePatientOdontogram,
} from '@/hooks/usePatientOdontogram'
import { useSession } from '@/context/SessionProvider'
import { useTheme } from '@/context/ThemeProvider'
import { PatientPicker } from '@/components/PatientPicker/PatientPicker'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Button } from '@/components/Button/Button'
import { Spinner } from '@/components/Spinner/Spinner'
import {
  IconX, IconMic, IconCheck, IconTooth, IconDocument, IconMessage,
} from '@/components/icons'
import { errorMessage } from '@/utils/errors'
import { APP_ROUTES } from '@/constants'
import type { Patient } from '@/types/domain'
import styles from './OdontogramFullscreenPage.module.scss'

/** Acima de quanto tempo desiste de esperar o motor e mostra a tela mesmo
 *  assim — um detector que nunca desiste vira loading eterno se o motor mudar
 *  de forma um dia e o seletor abaixo parar de bater. */
const READY_TIMEOUT_MS = 5000

/** Quanto tempo o aviso "aplicado" fica visível depois de confirmar_marcacao. */
const APPLIED_BADGE_MS = 4000

interface ToothNote {
  tooth: number
  /** Resumo clínico do motor, já em pt-BR ("Cárie · Mobilidade Grau 1"). */
  clinical: string
  /** Anotação livre digitada/ditada, se houver. */
  text: string
}

type MobilePanel = 'odontogram' | 'findings' | 'activity'

// O motor monta o title do tile como "<resumo clínico>" e, SÓ SE houver
// anotação, concatena "\n📝 <texto>" no fim (odontogram.ts:updateToothTooltip).
// Uma versão anterior daqui cortava tudo que vinha ANTES do marcador — ou seja,
// jogava fora exatamente os achados. As duas partes aparecem na coluna: o
// resumo vem traduzido do próprio motor, então acompanha qualquer edição —
// nossa ou da Cibelly — sem a gente espelhar texto.
const NOTE_MARKER = '📝 '

function splitTitle(title: string): { clinical: string; text: string } {
  const idx = title.indexOf(NOTE_MARKER)
  if (idx === -1) return { clinical: title.trim(), text: '' }
  return {
    clinical: title.slice(0, idx).trim(),
    text: title.slice(idx + NOTE_MARKER.length).trim(),
  }
}

/**
 * Odontograma em TELA CHEIA — sem Header nem Footer (é a única rota do app fora
 * do AppLayout, ver AppRouter.tsx). É a tela de EXAME: escolhe-se o paciente,
 * inicia-se o atendimento, e o que for marcado (à mão ou pela voz da Cibelly)
 * vira a ficha corrente do odontograma daquele paciente.
 *
 * ENCERRAR O ATENDIMENTO GRAVA DUAS COISAS, complementares:
 *  1. a FICHA CORRENTE (patient_odontogram) — "como a boca está hoje", uma
 *     linha por paciente, sobrescrita a cada atendimento;
 *  2. o REGISTRO NO PRONTUÁRIO (treatment_session, via record_exam_session) —
 *     "como ficou no dia 26", imutável, auditado, e o que aparece na aba
 *     Tratamento do perfil.
 * A segunda faltava, e por isso o atendimento não aparecia em lugar nenhum do
 * perfil. Ela NÃO gera cobrança: a RPC omite o valor, e sessão sem valor nasce
 * `unbilled` sem recebível, fora de "A faturar" e de Ganhos — garantia do banco,
 * verificada em SQL. A sessão nasce num tratamento "Atendimento do dia" e o
 * dentista reatribui depois ao tratamento de verdade.
 *
 * ⚠️ O motor é GLOBAL DE MÓDULO: uma instância por vez, sem patientId, e o
 * estado é o que estiver desenhado. Trocar de paciente sem chamar
 * loadOdontogramState faz o paciente B herdar as marcações do A — e um salvar
 * nesse estado grava a boca do A no prontuário do B. É o pior erro possível
 * aqui, e é o que o efeito de carga abaixo existe para impedir.
 *
 * O painel de edição do motor e o card-resumo ficam ocultos (ver .module.scss);
 * o modo de visualização é fixo (oclusal + siso). Sobra o gráfico, mais a
 * coluna de Anotações que este componente monta.
 *
 * Gate de especialidade é só UX (ver constants/specialty.ts): a parede real é o
 * FeatureGuard da rota (feature 'patients', a mesma da RLS de patient_odontogram).
 */
export function OdontogramFullscreenPage() {
  const navigate = useNavigate()
  const { specialty } = useSession()
  const { theme } = useTheme()
  const dark = theme === 'dark'

  // O paciente vive na URL: recarregar a página ou reabrir o link no meio de um
  // atendimento não perde o contexto (e o F5 acidental é comum em tela cheia).
  const [searchParams, setSearchParams] = useSearchParams()
  const patientId = searchParams.get('patient')
  const [patientName, setPatientName] = useState('')

  const shellRef = useRef<HTMLDivElement>(null)
  const diarioRef = useRef<HTMLUListElement>(null)
  const [notes, setNotes] = useState<ToothNote[]>([])
  const [ready, setReady] = useState(false)
  const [emAtendimento, setEmAtendimento] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('odontogram')
  const [sujo, setSujo] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  const pendingPatientMessageRef = useRef<PendingMessageConfirmation | null>(null)
  const pendingSupplierMessageRef = useRef<PendingMessageConfirmation | null>(null)

  /**
   * Qual dia da ficha está na tela. `null` = ficha corrente ("Atual"), a única
   * editável; um sessionId = snapshot imutável daquele dia, SÓ LEITURA.
   *
   * A seleção guarda O PACIENTE junto e `revisao` é DERIVADA da comparação, em
   * vez de um efeito que zera a escolha ao trocar de paciente. A query do
   * snapshot é chaveada pela sessão (não pelo paciente), então uma seleção que
   * sobrevivesse à troca mostraria a boca do paciente ANTERIOR sob o nome do
   * novo — por um render que fosse. Derivado, esse estado não existe.
   */
  const [revisaoEscolhida, setRevisaoEscolhida] = useState<{ patientId: string; sessionId: string } | null>(null)
  const revisao = revisaoEscolhida?.patientId === patientId ? revisaoEscolhida.sessionId : null

  const { data: fichaSalva, isFetching: carregandoFicha } = usePatientOdontogram(patientId)
  const { data: revisoes } = useOdontogramRevisions(patientId)
  const { data: payloadRevisao, isFetching: carregandoRevisao } = useOdontogramRevision(revisao)
  /** Modo histórico só vale de verdade DEPOIS que o snapshot chegou — antes
   *  disso o motor ainda mostra a ficha corrente, e travar aí bloquearia a
   *  edição de uma boca que é a atual. */
  const emHistorico = revisao !== null && !carregandoRevisao
  const salvar = useSavePatientOdontogram()
  const registrarNoProntuario = useRecordExamSession()
  /** Identifica ESTE atendimento — a RPC é idempotente por ele. */
  const tokenAtendimentoRef = useRef<string>('')

  const { data: pacientes } = usePatients()
  const paciente = pacientes?.find(p => p.id === patientId)
  // Disparado JÁ na escolha do paciente (o hook roda com `enabled` no id), não
  // quando a Cibelly precisa: entre escolher e iniciar o atendimento passam
  // alguns segundos, tempo de sobra para a leitura terminar e o dado estar
  // quente na primeira pergunta sobre histórico.
  const { data: resumoClinico } = usePatientClinicalSummary(patientId)
  // Mesmo pré-carregamento do resumo, e pelo mesmo motivo: o lembrete existe
  // para ser dito no COMEÇO do atendimento, não depois que o dentista já
  // escolheu o material.
  const { data: lembretes } = usePatientReminders(patientId)
  // Salas da clínica — decidem se a Cibelly precisa PERGUNTAR em qual agendar.
  const { data: salas } = useRooms()
  const adicionarLembrete = useAddReminder()
  const fecharLembrete = useCloseReminder()
  const { data: usuario } = useCurrentUser()
  const { data: clinica } = useClinic()
  const criarPrescricao = useCreatePrescription()
  const imprimir = usePrintDocument()

  /**
   * Emite o documento que a Cibelly pediu: salva no prontuário (aba Prescrições
   * do perfil, com número para reimpressão) e abre a janela de impressão.
   *
   * Mora aqui, e não no hook de voz, porque quem tem paciente, profissional e
   * clínica em mãos é a página — o hook só repassa o pedido.
   */
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

  /**
   * O que está marcado no odontograma agora. Sem isto ela era cega ao próprio
   * trabalho — não conferia, não respondia "como está o 28?" e remarcava o que
   * já estava marcado.
   */
  async function lerOdontograma(p: { dentes?: number[] }) {
    if (!patientId) return { ok: false, erro: 'Nenhum paciente em atendimento.' }
    const marcados = readOdontogram(p.dentes)
    if (marcados.length === 0) {
      return { ok: true, vazio: true, resposta: p.dentes?.length
        ? `Não há nada marcado ${p.dentes.length === 1 ? 'no dente ' + p.dentes[0] : 'nesses dentes'}.`
        : 'O odontograma está sem marcação nenhuma.' }
    }
    return {
      ok: true,
      dentes: marcados,
      // Frase pronta, mesmo molde das datas e da agenda: ler não erra.
      resposta: marcados.map(m => `dente ${m.dente}: ${m.achados}${m.nota ? ` (anotação: ${m.nota})` : ''}`).join('; '),
    }
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

  async function consultarAgenda(p: { data?: string; hora?: string; duracao?: number; dias?: number }) {
    // Sem paciente não segue nem na consulta de horário: oferecer vaga para
    // depois descobrir que não há para quem marcar é fazer o dentista perder o
    // tempo duas vezes. A trava real de gravação está em agendarConsulta.
    if (!patientId || !paciente) {
      return { ok: false, erro: 'Nenhum paciente selecionado. Escolha o paciente antes de falar de agenda.' }
    }
    if (!profId) {
      return { ok: false, erro: 'Seu login não está vinculado a um cadastro de profissional, então não sei de qual agenda falar.' }
    }
    const duracao = p.duracao ?? 60

    // As consultas JÁ MARCADAS deste paciente vão em TODA resposta. Sem isto,
    // ela agendava mas não sabia responder "quando é a consulta dela?" —
    // acabava de marcar e, na pergunta seguinte, dizia que não sabia.
    const consultasDoPaciente = (consultas ?? [])
      .filter(a => a.patientId === patientId && a.status !== 'canceled')
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

    // Data E hora: a pergunta é "esse horário serve?".
    if (p.data && p.hora) {
      const motivo = checkSlot(disponibilidade(), p.data, p.hora, duracao, hojeIso)
      if (!motivo) return { ok: true, livre: true, data: p.data, hora: p.hora, consultasDoPaciente }
      return {
        ok: true,
        livre: false,
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

      const consultasTexto = noPeriodo.length > 0
        ? `${paciente.name} já tem ${noPeriodo.length === 1 ? 'consulta' : noPeriodo.length + ' consultas'}: `
          + noPeriodo.map(c => c.quando).join('; ') + '.'
        : `${paciente.name} não tem consulta nesse período.`
      // `fim` é a hora em que a última consulta TERMINA. A fala lista
      // `ultimoInicio`, senão "08:00 às 11:00" oferece 11:00 como início
      // justamente quando esse horário já pode estar ocupado.
      const vagasTexto = livresNoPeriodo.length === 0
        ? ' Não há outro horário livre nesse período.'
        : ` Para uma consulta de ${duracao} minutos, os horários de início livres são ${resumoLivres}.`
      const resposta = consultasTexto + vagasTexto

      return { ok: true, resposta, consultasDoPaciente: noPeriodo, agenda }
    }
    return {
      ok: true,
      resposta: consultasDoPaciente.length === 0
        ? `${paciente.name} não tem consulta marcada.`
        : `${paciente.name} tem consulta em ${consultasDoPaciente.map(c => c.quando).join('; ')}.`,
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
    data: string; hora?: string; confirmado?: boolean; ditoPeloDentista?: string
  }) {
    if (!patientId) return { ok: false, erro: 'Nenhum paciente em atendimento.' }

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
      a => a.patientId === patientId && a.status !== 'canceled' && a.date === p.data,
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
          paciente: paciente?.name,
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
    data: string; hora: string; duracao?: number; servico?: string; encaixe?: boolean
    sala?: string; confirmaFimDeSemana?: boolean; ditoPeloDentista?: string; confirmaData?: boolean
  }) {
    // A trava que importa: a consulta é SEMPRE do paciente em atendimento. A
    // ferramenta nem recebe paciente como parâmetro — não há como a voz apontar
    // para outra pessoa, mesmo entendendo um nome errado no meio da frase.
    if (!patientId || !paciente) return { ok: false, erro: 'Nenhum paciente em atendimento.' }
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
        patientId,
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
      agendado: `${paciente.name} em ${isoToBrDate(p.data)} às ${p.hora}`,
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
    return 'Não foi possível enviar a mensagem pelo WhatsApp.'
  }

  /**
   * O destinatário é sempre o paciente aberto. A primeira chamada só devolve a
   * prévia; a segunda precisa repetir exatamente paciente + texto.
   */
  async function enviarMensagemPaciente(pedido: PatientMessageRequest) {
    if (!patientId || !paciente) {
      return { ok: false, erro: 'Nenhum paciente em atendimento.' }
    }
    if (!paciente.whatsapp) {
      return { ok: false, erro: `${paciente.name} não tem WhatsApp cadastrado.` }
    }

    const mensagem = pedido.mensagem.trim()
    if (!mensagem) return { ok: false, erro: 'A mensagem está vazia.' }

    if (!pedido.confirmado) {
      pendingPatientMessageRef.current = pendingMessageConfirmation([patientId], mensagem)
      return {
        ok: true,
        precisaConfirmar: true,
        destinatario: paciente.name,
        mensagem,
        instrucao:
          'Leia o destinatário e a mensagem. Só chame novamente com confirmado=true depois de um sim claro.',
      }
    }

    if (!matchesPendingMessage(pendingPatientMessageRef.current, [patientId], mensagem)) {
      pendingPatientMessageRef.current = pendingMessageConfirmation([patientId], mensagem)
      return {
        ok: true,
        precisaConfirmar: true,
        destinatario: paciente.name,
        mensagem,
        instrucao:
          'A confirmação anterior não corresponde a esta mensagem. Leia novamente e aguarde um sim claro.',
      }
    }

    pendingPatientMessageRef.current = null
    try {
      const envio = await sendWhatsAppMessage(
        [{ type: 'patient', id: patientId }],
        mensagem,
      )
      return {
        ok: true,
        enviado: envio.sent > 0,
        reutilizado: envio.results.some(item => item.reused),
        destinatario: paciente.name,
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

  const cibelly = useCibelly(emAtendimento, patientId, {
    aoEmitirDocumento: emitirDocumento,
    aoConsultarMateriais: consultarMateriais,
    aoRegistrarMaterial: registrarMaterialUsado,
    aoSolicitarOrcamento: solicitarOrcamento,
    aoEnviarMensagemPaciente: enviarMensagemPaciente,
    aoConsultarAgenda: consultarAgenda,
    aoAgendar: agendarConsulta,
    aoConsultarHistorico: consultarHistorico,
    aoLerOdontograma: lerOdontograma,
    aoCancelarConsulta: cancelarConsulta,
    aoCriarLembrete: criarLembrete,
    aoConcluirLembrete: concluirLembrete,
  })
  const [appliedSeen, setAppliedSeen] = useState<typeof cibelly.lastApplied>(null)
  const [showApplied, setShowApplied] = useState(false)

  if (cibelly.lastApplied && cibelly.lastApplied !== appliedSeen) {
    setAppliedSeen(cibelly.lastApplied)
    setShowApplied(true)
    setSujo(true)
  }

  // Trocar de paciente zera "há alterações não salvas" e o erro anterior — são
  // fatos sobre a ficha que acabou de sair da tela, não sobre a que entrou.
  // Ajuste durante a renderização (padrão do React para estado derivado de
  // prop/estado que mudou), e não num efeito com setState.
  const [pacienteAtual, setPacienteAtual] = useState<string | null>(patientId)
  if (patientId !== pacienteAtual) {
    setPacienteAtual(patientId)
    setSujo(false)
    setErroSalvar(null)
  }

  useEffect(() => {
    if (!showApplied) return
    const timer = setTimeout(() => setShowApplied(false), APPLIED_BADGE_MS)
    return () => clearTimeout(timer)
  }, [showApplied])

  // O motor monta ASSÍNCRONO: ".tooth-tile[data-tooth]" só existe depois que a
  // grade termina de desenhar — é o sinal mais direto de "montou" que o shell
  // expõe, sem depender de evento nenhum.
  useEffect(() => {
    const root = shellRef.current
    if (!root) return
    const start = Date.now()
    const timer = setInterval(() => {
      const mounted = root.querySelector('.tooth-tile[data-tooth]') !== null
      if (mounted || Date.now() - start > READY_TIMEOUT_MS) {
        setReady(true)
        clearInterval(timer)
      }
    }, 100)
    return () => clearInterval(timer)
  }, [])

  // Visões padrão fixas (osso e polpa desligados) — mesma regra do TreatmentsPanel.
  useEffect(() => {
    const root = shellRef.current
    if (!root) return
    return hideDefaultLayers(root)
  }, [])

  // ⚠️ A guarda contra contaminação entre pacientes. Ao trocar de paciente
  // (inclusive para null) o motor é RECARREGADO: sem paciente, limpa a boca;
  // com paciente, carrega a ficha dele — ou limpa, se ele ainda não tiver
  // ficha. Nunca "deixa como está", que é o caminho para gravar a boca de um
  // no prontuário do outro.
  //
  // O ref guarda quem já foi carregado para NÃO recarregar quando `fichaSalva`
  // muda por outro motivo: depois de salvar, a mutation reescreve o cache, e
  // sem esta trava o motor recarregaria o payload recém-salvo a cada
  // salvamento — a boca piscaria e uma marcação feita no meio se perderia.
  const carregadoRef = useRef<string | null | undefined>(undefined)
  /** Estado do motor no instante da carga — referência do "tem alteração pendente". */
  const baselineRef = useRef<string>('')
  useEffect(() => {
    if (!ready || carregandoFicha || carregandoRevisao) return
    // A chave inclui a revisão: trocar de DIA recarrega o motor pelo mesmo
    // caminho que trocar de paciente. Sem isso, escolher outra data mudaria só
    // o destaque na régua e a boca continuaria a mesma na tela.
    const alvo = patientId ? `${patientId}|${revisao ?? 'atual'}` : null
    if (carregadoRef.current === alvo) return
    carregadoRef.current = alvo
    loadOdontogramState(alvo ? ((revisao ? payloadRevisao : fichaSalva?.payload) ?? null) : null)
    // Marco zero do "tem alteração pendente": o estado do motor JÁ NORMALIZADO
    // logo após a carga (e não o payload que mandamos), porque o hydrate aplica
    // migrações e auto-correções — comparar contra o payload cru acusaria
    // diferença onde não houve edição nenhuma.
    baselineRef.current = JSON.stringify(getOdontogramState())
  }, [ready, patientId, carregandoFicha, fichaSalva, revisao, carregandoRevisao, payloadRevisao])

  /**
   * A trava de escrita segue o modo da tela. Fica num efeito (e não no clique
   * da régua) para cobrir também a carga em andamento e o desmonte: sair da
   * tela com a trava ligada deixaria o motor travado para a próxima visita,
   * porque o módulo é global.
   */
  useEffect(() => {
    travarEscritaNoOdontograma(
      emHistorico
        ? 'A ficha está aberta numa data anterior, só para leitura. Volte para "Atual" para marcar.'
        : null,
    )
    return () => travarEscritaNoOdontograma(null)
  }, [emHistorico])


  // ⚠️ TRAVA DA URL. O seletor de paciente já fica bloqueado durante o
  // atendimento, mas o botão VOLTAR do navegador não passa por ele: bastava um
  // voltar/avançar para o `?patient=` mudar com a sessão de voz aberta. E o
  // prompt da Cibelly congela na hora de cunhar o token — ela continuaria com o
  // paciente anterior, e diria o nome DELE em voz alta na frente do atual.
  // Isso não é só dado errado; é dado de uma pessoa vazando para outra.
  //
  // Devolve a URL para o paciente da sessão. `replace` para não empilhar
  // histórico e o voltar seguinte funcionar como a pessoa espera.
  const pacienteDaSessaoRef = useRef<string | null>(null)
  useEffect(() => {
    if (!emAtendimento) { pacienteDaSessaoRef.current = null; return }
    if (pacienteDaSessaoRef.current === null) pacienteDaSessaoRef.current = patientId
    const dono = pacienteDaSessaoRef.current
    if (dono && patientId !== dono) {
      setSearchParams({ patient: dono }, { replace: true })
    }
  }, [emAtendimento, patientId, setSearchParams])

  useEffect(() => {
    const root = shellRef.current
    if (!root) return

    let scheduled = 0
    function collect() {
      scheduled = 0
      const byTooth = new Map<number, { clinical: string; text: string }>()
      root!.querySelectorAll<HTMLElement>('.tooth-tile[data-tooth][title]').forEach(tile => {
        const num = Number(tile.dataset.tooth)
        const partes = splitTitle(tile.getAttribute('title') ?? '')
        if (num && (partes.clinical || partes.text)) byTooth.set(num, partes)
      })
      setNotes(
        [...byTooth.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([tooth, partes]) => ({ tooth, ...partes })),
      )
      // "Tem alteração pendente?" comparando o estado ATUAL do motor com o
      // marco zero da carga. É o único jeito honesto: cobre marcação por voz,
      // clique no dente e o popover de anotação (que o motor pendura no
      // document.body, fora desta árvore) — e volta a ficar limpo se a pessoa
      // desfizer. A tentativa anterior (ouvir cliques no shell) acusava
      // alteração em TODO carregamento, porque hideDefaultLayers dispara
      // btn.click() nos botões de camada do próprio motor.
      if (baselineRef.current) {
        setSujo(JSON.stringify(getOdontogramState()) !== baselineRef.current)
      }
    }

    const observer = new MutationObserver(() => {
      if (scheduled) return
      scheduled = window.setTimeout(collect, 300)   // debounce das rajadas do motor
    })
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['title'] })
    collect()

    return () => {
      observer.disconnect()
      if (scheduled) window.clearTimeout(scheduled)
    }
  }, [])

  async function salvarFicha() {
    if (!patientId) return
    // Última barreira do modo histórico: salvar aqui gravaria a boca de um dia
    // ANTIGO por cima da ficha corrente — o oposto de consultar o histórico.
    if (emHistorico) return
    setErroSalvar(null)
    const payload = getOdontogramState()
    try {
      await salvar.mutateAsync({
        patientId,
        payload,
        // Carimbo lido junto com a ficha: se outra pessoa (ou outra aba) tiver
        // salvo no meio, a RPC recusa em vez de apagar o trabalho dela.
        expectedUpdatedAt: fichaSalva?.updatedAt ?? null,
      })
      // O que acabou de ser gravado vira o novo marco zero — sem isso a ficha
      // continuaria marcada como pendente logo após salvar.
      baselineRef.current = JSON.stringify(payload)
      setSujo(false)
    } catch (e) {
      setErroSalvar(errorMessage(e, 'Não foi possível salvar o odontograma.'))
    }
  }

  /**
   * "Sair sem salvar" pendente — troca de data e fechar a tela caem no MESMO
   * diálogo, porque as duas são a mesma pergunta ("descarta o que não foi
   * salvo?"); só a ação de confirmar muda. `onConfirm` guarda essa ação em vez
   * de um `tipo` + switch, porque o confirm de verdade é assíncrono (fica
   * esperando o clique) e a função capturada já sabe o que fazer quando isso
   * acontecer.
   */
  const [confirmSaida, setConfirmSaida] = useState<{ mensagem: string; onConfirm: () => void } | null>(null)

  /**
   * Troca o dia mostrado na régua.
   *
   * Marcação não salva morre na troca (o motor é recarregado), então pergunta
   * antes — mesmo padrão do fechar a tela. Sem a pergunta, consultar como
   * estava o 26 em maio apagaria em silêncio o exame que acabou de ser ditado.
   */
  function escolherRevisao(sessionId: string | null) {
    if (sessionId === revisao || !patientId) return
    const aplicar = () => setRevisaoEscolhida(sessionId ? { patientId, sessionId } : null)
    if (sujo) {
      setConfirmSaida({ mensagem: 'Há marcações não salvas. Ver outra data vai descartá-las.', onConfirm: aplicar })
      return
    }
    aplicar()
  }

  function escolherPaciente(p: Patient | null) {
    setPatientName(p?.commonName || p?.name || '')
    setSearchParams(p ? { patient: p.id } : {}, { replace: true })
  }

  /**
   * Encerrar o atendimento faz DUAS gravações complementares:
   *  1. a ficha corrente (patient_odontogram) — "como a boca está hoje";
   *  2. o registro no prontuário (treatment_session) — "como ficou no dia 26",
   *     imutável e auditável, que é o que aparece na aba Tratamento do perfil.
   * Só a primeira existia, e por isso o atendimento não aparecia em lugar nenhum.
   */
  async function encerrarAtendimento() {
    await salvarFicha()
    if (!patientId) return

    // Nada marcado, nada a registrar: um atendimento vazio no prontuário é
    // ruído, não histórico.
    if (notes.length === 0) return

    try {
      await registrarNoProntuario.mutateAsync({
        patientId,
        findings: notes.map(n => ({ tooth: n.tooth, clinical: n.clinical, note: n.text })),
        // É a gravação do consumo que dispara a baixa de estoque (trigger
        // tr_material_stock) — por isso ela acontece aqui, no encerramento, e
        // não no instante em que a Cibelly ouviu "usei duas seringas".
        materials: materiaisUsadosRef.current,
        odontogram: getOdontogramState(),
        // `notes` guardava a transcrição inteira do ditado — saiu junto com a
        // transcrição. O prontuário continua com o que importa e é verificável:
        // os achados por dente, os materiais consumidos, o snapshot do
        // odontograma e os documentos emitidos. A conversa em si não era
        // registro clínico: era rascunho, custava dinheiro por minuto de fala e
        // ainda gravava a voz do paciente em texto dentro da ficha.
        notes: 'Atendimento ditado por voz (Cibelly).',
        // Mesmo token do atendimento inteiro: reencerrar (ou uma retentativa de
        // rede) devolve o procedimento já gravado em vez de criar um segundo.
        clientToken: tokenAtendimentoRef.current,
      })
    } catch (e) {
      setErroSalvar(errorMessage(e, 'A ficha foi salva, mas não foi possível registrar o atendimento no prontuário.'))
    }
  }

  async function alternarAtendimento() {
    if (emAtendimento) {
      await encerrarAtendimento()
      setEmAtendimento(false)
    } else {
      // Token novo por atendimento: é o que separa "gravar de novo o mesmo
      // atendimento" (idempotente) de "este é outro atendimento".
      tokenAtendimentoRef.current = crypto.randomUUID()
      setEmAtendimento(true)
    }
  }

  function fechar() {
    if (sujo) {
      setConfirmSaida({ mensagem: 'Há marcações não salvas. Sair mesmo assim?', onConfirm: () => navigate(-1) })
      return
    }
    navigate(-1)
  }

  if (specialty && specialty !== 'dentistry') {
    return <Navigate to={APP_ROUTES.DASHBOARD} replace />
  }

  // Enquanto ela está processando/respondendo, falar por cima faz o SERVIDOR
  // (não o nosso código) tentar abrir uma resposta nova em cima de uma já
  // ativa — a API recusa, e como quem tentou foi o servidor sozinho, aquele
  // comando falado simplesmente some, sem chamar ferramenta nenhuma. Esse
  // estado avisa quando esperar, para o dentista não perder o comando.
  const emProcessamento = cibelly.status === 'listening' && cibelly.processando
  const statusTexto = {
    idle: 'Cibelly em espera',
    connecting: 'Conectando a Cibelly…',
    listening: emProcessamento ? 'Cibelly processando… aguarde' : `Cibelly ouvindo${patientName ? ` · ${patientName}` : ''}`,
    error: cibelly.error ?? 'Cibelly indisponível',
  }[cibelly.status]
  const statusTextoCurto = {
    idle: 'Em espera',
    connecting: 'Conectando…',
    listening: emProcessamento ? 'Processando · aguarde' : 'Ouvindo',
    error: 'Indisponível',
  }[cibelly.status]

  return (
    <div className={[
      styles.tela,
      emAtendimento ? styles.telaOuvindo : '',
      emProcessamento ? styles.telaProcessando : '',
      emAtendimento && cibelly.status === 'error' ? styles.telaErro : '',
    ].filter(Boolean).join(' ')}>
      <header className={styles.barra}>
        <div className={styles.barraEsquerda}>
          <PatientPicker
            className={styles.seletorPaciente}
            value={patientId}
            onChange={escolherPaciente}
            lockedReason={emAtendimento ? 'Encerre o atendimento para trocar de paciente' : undefined}
          />

          <Button
            variant={emAtendimento ? 'danger' : 'primary'}
            size="md"
            className={styles.atendimentoBotao}
            iconLeft={<IconMic />}
            onClick={alternarAtendimento}
            disabled={!patientId || salvar.isPending}
            title={!patientId ? 'Escolha um paciente para iniciar' : undefined}
          >
            <span className={styles.rotuloAtendimentoCompleto}>
              {emAtendimento ? 'Encerrar atendimento' : 'Iniciar atendimento'}
            </span>
            <span className={styles.rotuloAtendimentoCurto}>
              {emAtendimento ? 'Encerrar' : 'Iniciar'}
            </span>
          </Button>

          {patientId && !emAtendimento && sujo && !emHistorico && (
            <Button variant="ghost" size="md" onClick={salvarFicha} disabled={salvar.isPending}>
              Salvar
            </Button>
          )}
        </div>

        <div className={styles.barraDireita}>
          {emAtendimento && (
            <span
              className={`${styles.chip} ${emProcessamento ? styles.chipProcessando : styles[`chip${cibelly.status[0].toUpperCase()}${cibelly.status.slice(1)}`]}`}
              role="status"
              aria-live="polite"
              title={statusTexto}
            >
              {emProcessamento ? <Spinner size="sm" /> : <IconMic />}
              <span className={`${styles.chipTexto} ${styles.chipTextoCompleto}`}>{statusTexto}</span>
              <span className={`${styles.chipTexto} ${styles.chipTextoCurto}`}>{statusTextoCurto}</span>
            </span>
          )}
          {/* Em modo histórico o estado de salvamento não se aplica — o que a
              tela precisa dizer é POR QUE nada pode ser marcado. */}
          {emHistorico && (
            <span className={`${styles.chip} ${styles.chipHistorico}`} role="status">
              Somente leitura
            </span>
          )}
          {!emHistorico && salvar.isPending && <span className={styles.chip}><Spinner size="sm" />Salvando…</span>}
          {!emHistorico && !salvar.isPending && patientId && !sujo && (
            <span className={`${styles.chip} ${styles.chipSalvo}`} role="status" aria-label="Ficha salva">
              <IconCheck />
              <span className={styles.chipSalvoTexto}>Salvo</span>
            </span>
          )}

          <button
            type="button"
            className={styles.fechar}
            onClick={fechar}
            title="Fechar"
            aria-label="Fechar odontograma"
          >
            <IconX />
          </button>
        </div>
      </header>

      {patientId && (
        <OdontogramTimeline
          revisoes={revisoes ?? []}
          selecionado={revisao}
          onSelecionar={escolherRevisao}
          carregando={carregandoRevisao}
        />
      )}

      {((showApplied && cibelly.lastApplied) || erroSalvar) && (
        <div className={styles.avisos} role="status" aria-live="polite">
          {/* Não há mais banner de "proposta pendente": a Cibelly marca direto.
              O aviso agora é o que JÁ foi marcado — e o desfazer é falado
              ("desfaz aí"), não um botão, porque a mão está na boca do paciente. */}
          {showApplied && cibelly.lastApplied && (
            <p className={styles.aplicado}>{cibelly.lastApplied} — diga “desfaz” para reverter.</p>
          )}
          {erroSalvar && <p className={styles.erro}>{erroSalvar}</p>}
        </div>
      )}

      {!ready && (
        <div className={styles.carregando}>
          <Spinner size="lg" />
          <span>Carregando odontograma…</span>
        </div>
      )}

      <nav className={styles.mobileTabs} aria-label="Seções do atendimento">
        <button
          type="button"
          id="mobile-tab-odontogram"
          className={`${styles.mobileTab} ${mobilePanel === 'odontogram' ? styles.mobileTabAtiva : ''}`}
          role="tab"
          aria-selected={mobilePanel === 'odontogram'}
          aria-controls="mobile-panel-odontogram"
          onClick={() => setMobilePanel('odontogram')}
        >
          <IconTooth />
          <span>Odontograma</span>
        </button>
        <button
          type="button"
          id="mobile-tab-findings"
          className={`${styles.mobileTab} ${mobilePanel === 'findings' ? styles.mobileTabAtiva : ''}`}
          role="tab"
          aria-selected={mobilePanel === 'findings'}
          aria-controls="mobile-panel-findings"
          onClick={() => setMobilePanel('findings')}
        >
          <IconDocument />
          <span>Achados</span>
          {notes.length > 0 && <span className={styles.mobileTabContagem}>{notes.length}</span>}
        </button>
        <button
          type="button"
          id="mobile-tab-activity"
          className={`${styles.mobileTab} ${mobilePanel === 'activity' ? styles.mobileTabAtiva : ''}`}
          role="tab"
          aria-selected={mobilePanel === 'activity'}
          aria-controls="mobile-panel-activity"
          onClick={() => setMobilePanel('activity')}
        >
          <IconMessage />
          <span>Atividade</span>
          {cibelly.atividade.length > 0 && (
            <span className={styles.mobileTabContagem}>
              {cibelly.atividade.length > 99 ? '99+' : cibelly.atividade.length}
            </span>
          )}
        </button>
      </nav>

      {/* O shell continua MONTADO durante o carregamento — é o motor global de
          módulo; desmontar zeraria o estado. Só fica visualmente oculto. */}
      <div className={`${styles.conteudo} ${ready ? '' : styles.carregandoConteudo}`}>
        {/* Em modo histórico o desenho fica inerte: o clique do dente não passa
            pela trava do toothFields (ele entra pelos handlers do próprio
            motor), então o bloqueio dele é aqui, onde o clique chega. */}
        <div
          id="mobile-panel-odontogram"
          className={[
            styles.quadro,
            emHistorico ? styles.quadroInerte : '',
            mobilePanel !== 'odontogram' ? styles.mobilePanelOculto : '',
          ].filter(Boolean).join(' ')}
          role="tabpanel"
          aria-labelledby="mobile-tab-odontogram"
          ref={shellRef}
        >
          {!patientId && ready && (
            <div className={styles.semPaciente}>
              <p>Escolha um paciente para começar.</p>
            </div>
          )}
          <OdontogramShell language="pt-br" darkMode={dark} enableNotes />
        </div>

        <div className={styles.lateral}>
          <div
            id="mobile-panel-findings"
            className={`${styles.resumoClinico} ${mobilePanel !== 'findings' ? styles.mobilePanelOculto : ''}`}
            role="tabpanel"
            aria-labelledby="mobile-tab-findings"
          >
            {/* Recados do atendimento ANTERIOR. Ficam no topo da coluna, acima dos
                achados de hoje, porque servem para mudar a conduta antes de ela
                começar — embaixo de uma lista de dentes ninguém lê a tempo. Só
                aparece quando há algum: painel vazio permanente vira paisagem. */}
            {(lembretes?.length ?? 0) > 0 && (
              <aside className={styles.lembretes} aria-label="Lembretes deste paciente">
                <h2 className={styles.notasTitulo}>Lembretes</h2>
                <ul className={styles.lembretesLista}>
                  {lembretes?.map(l => (
                    <li key={l.id} className={styles.lembreteItem}>
                      <p className={styles.lembreteTexto}>{l.texto}</p>
                      <button
                        type="button"
                        className={styles.lembreteFeito}
                        title="Marcar como resolvido"
                        disabled={fecharLembrete.isPending}
                        onClick={() => patientId && fecharLembrete.mutate({ id: l.id, patientId })}
                      >
                        <IconCheck />
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            <aside className={styles.notas} aria-label="Achados do odontograma">
              <h2 className={styles.notasTitulo}>Achados</h2>
              {notes.length === 0 ? (
                <p className={styles.notasVazio}>
                  Os achados aparecem aqui conforme forem marcados — pela Cibelly ou com duplo
                  clique num dente para escrever à mão.
                </p>
              ) : (
                <>
                  {/* POR ACHADO, não por dente. Com aparelho na arcada inteira, a
                      lista por dente virava dezesseis blocos idênticos; agrupada,
                      a mesma informação é uma linha — e é assim que o dentista
                      pergunta ("onde tem cárie?"). */}
                  <ul className={styles.grupos}>
                    {agruparAchados(notes).map(g => (
                      <li key={g.achado} className={styles.grupo}>
                        <div className={styles.grupoTopo}>
                          <span className={styles.grupoNome}>{g.achado}</span>
                          <span className={styles.grupoContagem}>{g.dentes.length}</span>
                        </div>
                        <span className={styles.grupoDentes}>{g.resumo}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Anotação livre é de outra natureza: não agrupa, e some se
                      misturada com o que está desenhado. */}
                  {notasLivres(notes).length > 0 && (
                    <>
                      <h3 className={styles.subtitulo}>Anotações</h3>
                      <ul className={styles.notasLista}>
                        {notasLivres(notes).map(n => (
                          <li key={n.tooth} className={styles.notaItem}>
                            <span className={styles.notaDente}>Dente {n.tooth}</span>
                            <p className={styles.notaTexto}>{n.text}</p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </aside>
          </div>

          {/* DIÁRIO DO ATENDIMENTO — o que ela falou e o que ela executou.
              Existe para responder "por que ela não marcou o 23?": mostra se a
              ferramenta foi chamada, com quais argumentos e o que voltou.
              Não custa nada: a fala DELA vem junto do áudio que já foi gerado, e
              as chamadas são nossas. A transcrição da fala do DENTISTA, que era
              paga (whisper, por minuto), continua desligada. */}
          <aside
            id="mobile-panel-activity"
            className={[
              styles.diario,
              !emAtendimento && cibelly.atividade.length === 0 ? styles.diarioSomenteMobile : '',
              mobilePanel !== 'activity' ? styles.mobilePanelOculto : '',
            ].filter(Boolean).join(' ')}
            role="tabpanel"
            aria-labelledby="mobile-tab-activity"
            aria-label="Diário do atendimento"
          >
            <h2 className={styles.notasTitulo}>Atividade</h2>
            {cibelly.atividade.length === 0 ? (
              <p className={styles.notasVazio}>
                Sua fala, a resposta dela e cada ferramenta que ela usar — com os
                argumentos e o resultado — aparecem aqui.
              </p>
            ) : (
              <ul className={styles.diarioLista} ref={diarioRef}>
                {cibelly.atividade.map(a => (
                  <li key={a.id} className={`${styles.linha} ${styles['linha--' + a.tipo]}`}>
                    {a.tipo === 'ferramenta' ? (
                      <>
                        <span className={styles.linhaTitulo}>{a.texto}</span>
                        <code className={styles.linhaArgs}>{a.args}</code>
                        <code className={styles.linhaResultado}>{a.resultado}</code>
                      </>
                    ) : (
                      <span className={styles.linhaTitulo}>
                        <span className={styles.quem}>
                          {a.tipo === 'dentista'
                            ? 'Você'
                            : a.tipo === 'erro'
                              ? 'Erro'
                              : a.tipo === 'conferencia'
                                ? 'Conferência'
                                : 'Cibelly'}
                        </span>
                        {a.texto}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSaida !== null}
        onClose={() => setConfirmSaida(null)}
        onConfirm={() => confirmSaida?.onConfirm()}
        title="Descartar alterações?"
        message={confirmSaida?.mensagem}
        variant="danger"
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
      />
    </div>
  )
}
