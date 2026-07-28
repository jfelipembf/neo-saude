import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import OdontogramShell, { getOdontogramState, loadOdontogramState } from '@/lib/odontogramShell/odontogram-shell'
import '@/lib/odontogramShell/odontogram-shell.css'
import { hideDefaultLayers } from '@/lib/odontogramShell/layers'
import {
  useCibelly,
} from '@/hooks/useCibelly'
import { useCibellyPedal } from '@/hooks/useCibellyPedal'
import { useCibellyGeneralTools } from '@/hooks/useCibellyGeneralTools'
import { usePatients } from '@/hooks/usePatients'
import { readOdontogram, travarEscritaNoOdontograma } from '@/lib/odontogramShell/toothFields'
import { agruparAchados, notasLivres } from '@/utils/toothNoteGroups'
import { OdontogramTimeline } from './OdontogramTimeline'
import { useCloseReminder } from '@/hooks/usePatientReminders'
import {
  useOdontogramRevision, useOdontogramRevisions, usePatientOdontogram,
  useRecordExamSession, useSavePatientOdontogram,
} from '@/hooks/usePatientOdontogram'
import { useSession } from '@/context/SessionProvider'
import { useTheme } from '@/context/ThemeProvider'
import { PatientPicker } from '@/components/PatientPicker/PatientPicker'
import { CibellyPedalButton } from '@/components/CibellyPedalButton/CibellyPedalButton'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { DrugCatalogDrawer } from '@/components/DrugCatalog/DrugCatalogDrawer'
import { PedalSetupModal } from '@/components/CibellyPedalButton/PedalSetupModal'
import { carregarPedal } from '@/lib/cibelly/pedalConfig'
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
  // Gaveta do catálogo de medicamentos. Fica aqui com os outros estados de UI:
  // declarada mais abaixo, caía depois de um return antecipado e quebrava a
  // ordem dos hooks.
  const [catalogoAberto, setCatalogoAberto] = useState(false)
  // Configuração do pedal Bluetooth: qual tecla cada botão manda e se ele
  // sustenta a tecla. Vive no navegador — o pedal é do computador, não da
  // clínica (ver lib/cibelly/pedalConfig).
  const [pedal, setPedal] = useState(carregarPedal)
  const [pedalAberto, setPedalAberto] = useState(false)

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
  const fecharLembrete = useCloseReminder()

  /**
   * As ferramentas que NÃO dependem do desenho — agenda, materiais,
   * fornecedores, mensagens, cadastro, prontuário.
   *
   * Moraram nesta página até o pedal F passar a valer em qualquer tela. Estão
   * num hook compartilhado para que a tela cheia e o provider global usem a
   * MESMA implementação: duas versões de "cancelar consulta" sairiam de
   * sincronia e uma delas cancelaria a consulta errada.
   */
  const ferramentas = useCibellyGeneralTools({ patientId, paciente })
  const { materiaisUsadosRef, lembretes, documentoPendente, fecharPreviaDocumento } = ferramentas

  /**
   * O que está marcado no odontograma agora. Sem isto ela era cega ao próprio
   * trabalho — não conferia, não respondia "como está o 28?" e remarcava o que
   * já estava marcado.
   *
   * Fica AQUI, e não no hook compartilhado: depende do motor do odontograma,
   * que é global de módulo e só existe montado nesta tela.
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


  const cibelly = useCibelly(specialty === 'dentistry', patientId, {
    aoConsultarPacientes: ferramentas.consultarPacientes,
    aoEmitirDocumento: ferramentas.emitirDocumento,
    aoConsultarMateriais: ferramentas.consultarMateriais,
    aoRegistrarMaterial: ferramentas.registrarMaterialUsado,
    aoSolicitarOrcamento: ferramentas.solicitarOrcamento,
    aoEnviarMensagemPaciente: ferramentas.enviarMensagemPaciente,
    aoConsultarAgenda: ferramentas.consultarAgenda,
    aoAgendar: ferramentas.agendarConsulta,
    aoConsultarHistorico: ferramentas.consultarHistorico,
    aoConsultarFinanceiro: ferramentas.consultarFinanceiroPaciente,
    aoLerOdontograma: lerOdontograma,
    aoCancelarConsulta: ferramentas.cancelarConsulta,
    aoCriarLembrete: ferramentas.criarLembrete,
    aoConcluirLembrete: ferramentas.concluirLembrete,
  })
  useCibellyPedal({
    enabled: cibelly.status === 'listening',
    // O paciente selecionado na ficha é o contexto clínico do pedal J. Não
    // dependa do estado efêmero do botão "Iniciar atendimento": ele volta a
    // false após um recarregamento e fazia o pedal parecer inativo mesmo com a
    // ficha correta aberta.
    patientAvailable: !!patientId,
    startListening: cibelly.iniciarEscuta,
    stopListening: cibelly.encerrarEscuta,
    config: pedal,
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

  const emProcessamento = cibelly.status === 'listening' && cibelly.processando
  const statusTexto = {
    idle: 'Cibelly em espera',
    connecting: 'Conectando a Cibelly…',
    listening: emProcessamento
      ? 'Cibelly processando… aguarde'
      : cibelly.modoEscuta === 'patient'
        ? `Ouvindo paciente${patientName ? ` · ${patientName}` : ''}`
        : cibelly.modoEscuta === 'general'
          ? 'Ouvindo demanda geral'
          : 'Pedal pronto',
    error: cibelly.error ?? 'Cibelly indisponível',
  }[cibelly.status]
  const statusTextoCurto = {
    idle: 'Em espera',
    connecting: 'Conectando…',
    listening: emProcessamento
      ? 'Processando'
      : cibelly.modoEscuta === 'patient'
        ? 'Paciente'
        : cibelly.modoEscuta === 'general'
          ? 'Geral'
          : 'Pedal pronto',
    error: 'Indisponível',
  }[cibelly.status]
  const pedalAtivo = cibelly.modoEscuta !== null
  const mostrarMolduraCibelly = pedalAtivo
    || emProcessamento
    || cibelly.status === 'error'
  const classeChipCibelly = emProcessamento
    ? styles.chipProcessando
    : pedalAtivo
      ? styles.chipListening
      : cibelly.status === 'listening'
        ? styles.chipReady
        : styles[`chip${cibelly.status[0].toUpperCase()}${cibelly.status.slice(1)}`]

  // BOTÃO NA TELA, NO LUGAR DO PEDAL J FÍSICO — que ainda não chegou. Mesmo
  // paciente-atual do teclado (ver useCibellyPedal acima); some sozinho
  // quando o pedal de verdade estiver em todo consultório.
  const botaoPedalHabilitado = cibelly.status === 'listening' && !!patientId
  const botaoPedalMotivo = !patientId
    ? 'Escolha um paciente para falar com a Cibelly'
    : statusTexto
  const botaoPedalRotulo = `Segure para falar com a Cibelly${patientName ? ` sobre ${patientName}` : ''}`

  return (
    <div className={[
      styles.tela,
      mostrarMolduraCibelly ? styles.telaOuvindo : '',
      emProcessamento ? styles.telaProcessando : '',
      cibelly.status === 'error' ? styles.telaErro : '',
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

          {/* Consulta de medicamento fica na barra e NÃO depende de paciente
              escolhido: a pergunta "qual a apresentação da clindamicina?"
              aparece antes de abrir a ficha de alguém. */}
          <Button variant="ghost" size="md" onClick={() => setCatalogoAberto(true)}>
            Medicamentos
          </Button>

          {/* O pedal é HARDWARE de cada consultório, e cada modelo manda uma
              tecla diferente — não há como o app adivinhar. Aqui o dentista
              ensina, pisando. */}
          <Button variant="ghost" size="md" onClick={() => setPedalAberto(true)} title="Configurar pedal">
            Pedal
          </Button>
        </div>

        <div className={styles.barraDireita}>
          {cibelly.status !== 'idle' && (
            <span
              className={`${styles.chip} ${classeChipCibelly}`}
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

      <DrugCatalogDrawer open={catalogoAberto} onClose={() => setCatalogoAberto(false)} />

      <PedalSetupModal
        open={pedalAberto}
        onClose={() => setPedalAberto(false)}
        onSaved={setPedal}
      />

      <CibellyPedalButton
        mode="patient"
        enabled={botaoPedalHabilitado}
        active={cibelly.modoEscuta === 'patient'}
        processing={emProcessamento}
        onStart={cibelly.iniciarEscuta}
        onStop={cibelly.encerrarEscuta}
        label={botaoPedalRotulo}
        disabledReason={botaoPedalMotivo}
      />

      {/* PRÉVIA DO DOCUMENTO — a Cibelly monta e mostra aqui, mas só salva e
          manda pra impressora depois de um "sim" falado (ver emitirDocumento
          em useCibellyGeneralTools.ts). O iframe reproduz o MESMO HTML que
          vai pro papel, timbre e tudo — o dentista vê exatamente o que vai
          sair antes de confirmar. */}
      <Modal
        open={documentoPendente !== null}
        onClose={fecharPreviaDocumento}
        title={documentoPendente?.titulo ?? 'Documento'}
        size="lg"
        footer={<Button variant="ghost" onClick={fecharPreviaDocumento}>Cancelar</Button>}
      >
        <p className={styles.previaAviso}>Diga “sim” para confirmar a impressão.</p>
        {documentoPendente && (
          <iframe
            className={styles.previaDocumento}
            title="Prévia do documento"
            srcDoc={documentoPendente.html}
            // Fora da ordem de Tab: um clique de leitura dentro do iframe não
            // deveria prender o foco de teclado lá, porque o pedal J escuta no
            // window de FORA — um frame com foco não deixa a tecla chegar nele.
            tabIndex={-1}
          />
        )}
      </Modal>

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
