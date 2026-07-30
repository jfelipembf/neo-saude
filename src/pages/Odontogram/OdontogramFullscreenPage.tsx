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
import { OdontogramTimeline } from './OdontogramTimeline'
import { Anamnesis } from '@/pages/Consultation/Components/Anamnesis/Anamnesis'
import { SideNav } from '@/pages/Consultation/Components/Shell/SideNav'
import { MobileNav } from '@/pages/Consultation/Components/Shell/MobileNav'
import { MobileHome } from '@/pages/Consultation/Components/Shell/MobileHome'
import { CHAVE_INICIO } from '@/pages/Consultation/Components/Shell/navItems'
import { BudgetsPanel } from '@/components/BudgetsPanel/BudgetsPanel'
import { DocumentsUpload } from '@/components/DocumentsUpload/DocumentsUpload'
import { PrescriptionsPanel } from '@/components/PrescriptionsPanel/PrescriptionsPanel'
import { TreatmentsPanel } from '@/components/TreatmentsPanel/TreatmentsPanel'
import { isMobileViewport } from '@/utils/viewport'
import { ATALHOS_DA_BARRA, ITENS } from './sideNavItems'
import type { OdontogramNavKey } from './sideNavItems'
import { useCloseReminder } from '@/hooks/usePatientReminders'
import {
  useOdontogramRevision, useOdontogramRevisions, usePatientOdontogram,
  useRecordExamSession, useSavePatientOdontogram,
} from '@/hooks/usePatientOdontogram'
import { useScheduleAppointments, useUpdateScheduleAppointment } from '@/hooks/useSchedule'
import { toIsoDate } from '@/utils/date'
import { useSession } from '@/context/SessionProvider'
import { useTheme } from '@/context/ThemeProvider'
import { PatientPicker } from '@/components/PatientPicker/PatientPicker'
import { CibellyPedalButton } from '@/components/CibellyPedalButton/CibellyPedalButton'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { carregarPedal } from '@/lib/cibelly/pedalConfig'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconX, IconMic, IconCheck } from '@/components/icons'
import { errorMessage } from '@/utils/errors'
import { APP_ROUTES } from '@/constants'
import type { Patient } from '@/types/domain'
import casca from '@/pages/Consultation/Components/Shell/Shell.module.scss'
import styles from './OdontogramFullscreenPage.module.scss'

/** Acima de quanto tempo desiste de esperar o motor e mostra a tela mesmo
 *  assim — um detector que nunca desiste vira loading eterno se o motor mudar
 *  de forma um dia e o seletor abaixo parar de bater. */
const READY_TIMEOUT_MS = 5000

/** Quanto tempo o aviso "aplicado" fica visível depois de confirmar_marcacao. */
const APPLIED_BADGE_MS = 4000

/** Teto para a re-hidratação do motor ao retomar a seção do odontograma. */
const RE_HIDRATACAO_TIMEOUT_MS = 3000

interface ToothNote {
  tooth: number
  /** Resumo clínico do motor, já em pt-BR ("Cárie · Mobilidade Grau 1"). */
  clinical: string
  /** Anotação livre digitada/ditada, se houver. */
  text: string
}

/** 'inicio' só existe no PWA mobile — a grade de ícones atrás do botão central
 *  da barra inferior (ver Shell/MobileHome). */
type Secao = OdontogramNavKey | typeof CHAVE_INICIO

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
  /**
   * O AGENDAMENTO de onde este atendimento veio — presente quando se entrou
   * pela tela Hoje, ausente quando se abriu a ferramenta solta pelo cabeçalho.
   *
   * É por ele que a fila do Hoje sabe que o paciente está na cadeira: sem
   * marcar o status, o agendamento ficava "agendado" a consulta inteira e a
   * recepção não tinha como saber que já tinha começado.
   */
  const appointmentId = searchParams.get('atendimento')
  const [patientName, setPatientName] = useState('')

  const shellRef = useRef<HTMLDivElement>(null)

  /**
   * ⚠️ O MOTOR NÃO É SÓ DESTA TELA — E ELA PRECISA SABER DISSO.
   *
   * `OdontogramShell` é uma instância GLOBAL DE MÓDULO: existe UMA por vez, e
   * montar um segundo shell em qualquer lugar do app rebate o motor para ele.
   * O painel de Tratamentos monta os seus (o do procedimento e o de leitura de
   * cada dia) e chama `loadOdontogramState` com o snapshot daquele dia — ou
   * seja, abrir Tratamentos TOMA o motor desta tela e sobrescreve o desenho do
   * atendimento em curso com uma ficha antiga.
   *
   * O sintoma visível era o odontograma sumir ao voltar da seção. O sintoma
   * invisível era pior: `getOdontogramState()` passava a devolver o snapshot do
   * tratamento, e um "Finalizar atendimento" nesse estado gravaria a boca de
   * OUTRO DIA como sendo a de hoje.
   *
   * A tela então trata o motor como emprestado: ao sair da seção guarda o
   * desenho aqui, e ao voltar remonta o shell (o `key`) e re-hidrata. Enquanto
   * está fora, ESTE estado é a verdade — não o motor.
   */
  const [estadoVivo, setEstadoVivo] = useState<Record<string, unknown> | null>(null)
  /** Sobe a cada retomada; serve de `key` para forçar um shell novo. */
  const [montagemDoMotor, setMontagemDoMotor] = useState(0)
  /** O motor está desenhando a ficha DESTA tela? Falso enquanto outra seção o
   *  tem, e entre a remontagem e o fim da re-hidratação. */
  const [motorNosso, setMotorNosso] = useState(true)
  /**
   * Em qual montagem do motor as camadas padrão já foram acertadas.
   *
   * Número, e não booleano, para servir também às RETOMADAS: cada shell novo
   * nasce com osso e polpa ligados, então o flash voltaria a cada volta do
   * Tratamentos se isto ficasse `true` para sempre. Comparado com
   * `montagemDoMotor`, ele volta a ser "não pronto" sozinho na remontagem —
   * sem precisar de um `setState` no corpo do efeito, que a regra
   * `react-hooks/set-state-in-effect` recusa.
   */
  const [camadasProntasEm, setCamadasProntasEm] = useState(-1)
  const [notes, setNotes] = useState<ToothNote[]>([])
  const [ready, setReady] = useState(false)
  const [emAtendimento, setEmAtendimento] = useState(false)
  // PORTA DE ENTRADA por aparelho: no PWA é a grade de ícones; no desktop,
  // direto no odontograma, que é o motivo de esta tela existir.
  // Lido uma vez na montagem (`isMobileViewport`, não reativo de propósito):
  // girar o aparelho no meio do atendimento não deve trocar de seção sozinho.
  const [secao, setSecao] = useState<Secao>(() => (isMobileViewport() ? CHAVE_INICIO : 'odontograma'))

  /**
   * CEDE O MOTOR AO SAIR DA SEÇÃO, RETOMA AO VOLTAR — ver `estadoVivo`.
   *
   * Saindo: fotografa o desenho ANTES que o painel da outra seção monte o
   * shell dele. Feito DURANTE O RENDER (padrão do projeto, e o que a regra
   * `react-hooks/set-state-in-effect` exige) e não num efeito, o que aqui
   * também é mais correto: este render acontece antes do commit que esconde o
   * odontograma e monta o outro painel, então o motor ainda é o nosso e
   * `getOdontogramState()` devolve o desenho de verdade. Num efeito, o shell
   * do outro painel já poderia ter montado e a foto sairia dele.
   *
   * Voltando: sobe `montagemDoMotor`, que é `key` do shell. Só chamar
   * `loadOdontogramState` não bastaria — se outro painel montou um shell, o
   * motor está ligado ao contêiner DELE e o nosso ficou uma caixa vazia, que
   * era exatamente o "o odontograma não aparece". O `key` novo força um shell
   * novo, e ele reata o motor a este contêiner.
   */
  const [secaoAnterior, setSecaoAnterior] = useState<Secao>(secao)
  if (secao !== secaoAnterior) {
    if (secaoAnterior === 'odontograma') {
      setEstadoVivo(getOdontogramState())
      setMotorNosso(false)
    }
    if (secao === 'odontograma') setMontagemDoMotor(n => n + 1)
    setSecaoAnterior(secao)
  }
  const [sujo, setSujo] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  // Gaveta do catálogo de medicamentos. Fica aqui com os outros estados de UI:
  // declarada mais abaixo, caía depois de um return antecipado e quebrava a
  // ordem dos hooks.
  // Configuração do pedal Bluetooth: qual tecla cada botão manda e se ele
  // sustenta a tecla. Vive no navegador — o pedal é do computador, não da
  // clínica (ver lib/cibelly/pedalConfig).
  const [pedal] = useState(carregarPedal)

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

  const hojeIso = toIsoDate(new Date())
  const { data: consultasDeHoje } = useScheduleAppointments(hojeIso, hojeIso)
  const consulta = appointmentId
    ? (consultasDeHoje ?? []).find(a => a.id === appointmentId)
    : undefined
  const { mutate: atualizarConsulta } = useUpdateScheduleAppointment()

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
  const {
    materiaisUsadosRef, lembretes, documentoPendente, fecharPreviaDocumento, orcamentoPendente, fecharPreviaOrcamento,
  } = ferramentas

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
    aoCriarOrcamentoPaciente: ferramentas.criarOrcamentoPaciente,
    aoConsultarMateriais: ferramentas.consultarMateriais,
    aoRegistrarMaterial: ferramentas.registrarMaterialUsado,
    aoSolicitarOrcamento: ferramentas.solicitarOrcamento,
    aoAdicionarAoCarrinho: ferramentas.adicionarAoCarrinho,
    aoConsultarCarrinho: ferramentas.consultarCarrinho,
    aoPedirOrcamentoDoCarrinho: ferramentas.pedirOrcamentoDoCarrinho,
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
    // dependa de `emAtendimento`: é estado efêmero, volta a false após um
    // recarregamento e fazia o pedal parecer inativo mesmo com a ficha correta
    // aberta.
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
    // Refaz a cada shell novo: o contêiner é outro, e o `.tooth-tile` que este
    // efeito procura só existe depois que a grade DAQUELE shell desenha.
  }, [montagemDoMotor])

  // Visões padrão fixas (osso e polpa desligados) — mesma regra do
  // TreatmentsPanel. Reaplica a cada shell novo: o shell nasce com as camadas
  // padrão ligadas, então sem isto voltar do Tratamentos traria osso e polpa
  // de volta à tela.
  useEffect(() => {
    const root = shellRef.current
    if (!root) return
    return hideDefaultLayers(root, () => setCamadasProntasEm(montagemDoMotor))
  }, [montagemDoMotor])

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
    // Nunca com o motor emprestado (Tratamentos aberto): trocar de paciente ou
    // de data ali dentro carregaria a ficha no shell DELE e ainda gravaria um
    // marco zero tirado do snapshot do tratamento. Fica para a retomada — o
    // `carregadoRef` continua desatualizado, então este efeito refaz a carga
    // assim que `motorNosso` voltar a ser verdadeiro.
    if (!motorNosso) return
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
  }, [ready, patientId, carregandoFicha, fichaSalva, revisao, carregandoRevisao, payloadRevisao, motorNosso])

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
  /**
   * O ATENDIMENTO ABRE SOZINHO — não há mais botão de iniciar.
   *
   * Quem chega aqui já clicou "Iniciar atendimento" na tela Hoje; repetir a
   * decisão significava, na prática, dentista marcando dente com a sessão
   * fechada e descobrindo no fim que nada tinha sido registrado — porque é o
   * ENCERRAMENTO que grava o treatment_session no prontuário, e sem abertura
   * não há o que encerrar.
   *
   * Espera o paciente: entrando direto em /odontograma, sem `?patient=`, não há
   * ficha para abrir — a sessão nasce quando um paciente for escolhido.
   *
   * NÃO abre em modo histórico: ali a tela é somente-leitura, e cunhar um token
   * de atendimento para uma revisão antiga criaria um registro de hoje a partir
   * do que foi visto em maio.
   *
   * Guarda em `useRef` e não em estado: ela responde "já abri para ESTE
   * paciente?" e não pode virar dependência do efeito, senão o próprio
   * `setEmAtendimento` reagendaria a abertura.
   */
  const jaAbriu = useRef<string | null>(null)
  useEffect(() => {
    if (!patientId || emHistorico) return
    if (jaAbriu.current === patientId) return
    jaAbriu.current = patientId
    // Token novo por atendimento: é o que separa "gravar de novo o mesmo
    // atendimento" (idempotente) de "este é outro atendimento".
    tokenAtendimentoRef.current = crypto.randomUUID()
    setEmAtendimento(true)
  }, [patientId, emHistorico])

  /**
   * O AGENDAMENTO PASSA A "EM ATENDIMENTO" — é o que a fila do Hoje lê.
   *
   * Efeito separado do de cima porque as duas coisas dependem de gatilhos
   * diferentes: aquele espera o PACIENTE, este espera a consulta ter CHEGADO da
   * busca (ela é assíncrona e não existe quando a tela monta). Juntá-los faria
   * a abertura do atendimento esperar uma requisição de rede que, na entrada
   * pelo cabeçalho, nem acontece — ali não há agendamento nenhum.
   */
  const jaMarcouEmAtendimento = useRef<string | null>(null)
  useEffect(() => {
    if (!consulta || emHistorico) return
    if (jaMarcouEmAtendimento.current === consulta.id) return
    if (consulta.status !== 'scheduled' && consulta.status !== 'confirmed') return
    jaMarcouEmAtendimento.current = consulta.id
    atualizarConsulta({ id: consulta.id, payload: { ...consulta, status: 'in_service' } })
    // Dependências só nos campos que importam: `consulta` é recriada a cada
    // busca (mesmo id, referência nova) e `atualizarConsulta` a cada render —
    // incluí-los repetiria a gravação em laço. A guarda por id cobre o resto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta?.id, consulta?.status, emHistorico])

  /**
   * CEDE O MOTOR AO SAIR DA SEÇÃO, RETOMA AO VOLTAR.
   *
   * Saindo: fotografa o desenho ANTES que o painel da outra seção monte o
   * shell dele — depois disso `getOdontogramState()` já não é o nosso.
   *
   * Voltando: sobe `montagemDoMotor`, que é `key` do shell. Só chamar
   * `loadOdontogramState` não bastaria: se outro painel montou um shell, o
   * motor está ligado ao contêiner DELE, e o nosso ficou uma caixa vazia — era
   * exatamente o "o odontograma não aparece". O `key` novo força um shell
   * novo, que reata o motor a este contêiner.
   */
  /**
   * RE-HIDRATA depois da remontagem, com repetição.
   *
   * O motor monta assíncrono e o shell anterior ainda pode estar se destruindo
   * — uma única chamada cairia no vazio. Repete até a grade confirmar (o
   * resumo do dente aparece no `title` do tile) ou até o teto de tempo, mesma
   * técnica do TreatmentsPanel. Só então o motor volta a ser a fonte da
   * verdade (`motorNosso`), e não antes: finalizar o atendimento no meio da
   * re-hidratação leria uma boca pela metade.
   */
  useEffect(() => {
    if (montagemDoMotor === 0 || secao !== 'odontograma') return
    const alvo = estadoVivo
    const root = shellRef.current
    if (!root) return
    const dentes = Object.keys((alvo?.teeth as Record<string, unknown> | undefined) ?? {})
    const inicio = Date.now()
    const timer = setInterval(() => {
      loadOdontogramState(alvo)
      const pronto = dentes.length === 0
        ? root.querySelector('.tooth-tile[data-tooth]') !== null
        : dentes.some(d => root.querySelector(`.tooth-tile[data-tooth="${d}"]`)?.getAttribute('title'))
      if (pronto || Date.now() - inicio > RE_HIDRATACAO_TIMEOUT_MS) {
        clearInterval(timer)
        setMotorNosso(true)
      }
    }, 150)
    return () => clearInterval(timer)
    // Dispara pela REMONTAGEM, não pelo snapshot. `estadoVivo` é lido como foto
    // do instante da retomada; incluí-lo nas dependências refaria a
    // re-hidratação no momento em que ele é gravado — que é a SAÍDA da seção,
    // com o painel de Tratamentos já dono do motor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montagemDoMotor])

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
    if (!root || !motorNosso) return

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
    // Reata ao shell novo a cada retomada, e SÓ enquanto o motor é nosso.
    // Sem a guarda de `motorNosso`, a remontagem rodaria `collect()` antes da
    // re-hidratação terminar: o contêiner ainda vazio devolveria zero tiles,
    // `notes` seria zerada — e é dela que saem os achados gravados no
    // prontuário no encerramento — e o `sujo` compararia o marco zero contra o
    // snapshot que o Tratamentos deixou no motor, acusando alteração que
    // ninguém fez.
  }, [montagemDoMotor, motorNosso])

  /**
   * A ficha corrente — do motor quando ele é nosso, do ref quando não é.
   *
   * Todo caminho que GRAVA passa por aqui. Ler `getOdontogramState()` direto,
   * com o Tratamentos aberto, gravaria o snapshot dele.
   */
  function fichaCorrente(): Record<string, unknown> {
    return motorNosso ? getOdontogramState() : (estadoVivo ?? {})
  }

  async function salvarFicha() {
    if (!patientId) return
    // Última barreira do modo histórico: salvar aqui gravaria a boca de um dia
    // ANTIGO por cima da ficha corrente — o oposto de consultar o histórico.
    if (emHistorico) return
    setErroSalvar(null)
    const payload = fichaCorrente()
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
        odontogram: fichaCorrente(),
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

  async function fecharAtendimento() {
    await encerrarAtendimento()
    setEmAtendimento(false)

    // Sem agendamento (entrada pelo cabeçalho, ferramenta solta) não há status
    // a mudar nem fila para onde voltar: a tela simplesmente fica.
    if (!consulta) return
    atualizarConsulta({ id: consulta.id, payload: { ...consulta, status: 'completed' } }, {
      onSuccess: () => navigate(APP_ROUTES.TODAY),
      onError: e => setErroSalvar(errorMessage(e, 'O atendimento foi gravado, mas não foi possível marcar a consulta como concluída.')),
    })
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
  /**
   * A ARCADA SÓ APARECE COM A VISUALIZAÇÃO ESTABILIZADA.
   *
   * `ready` diz só que a grade desenhou — e ela desenha ANTES de
   * `hideDefaultLayers` conseguir apertar os botões de osso e polpa, que o
   * motor traz LIGADOS. Mostrar naquele instante exibia a arcada completa por
   * uma fração de segundo, e depois ela "se corrigia" sozinha: lê como defeito
   * de carregamento, não como transição.
   *
   * Esconde só o CARD do odontograma, não a tela: o `.conteudo` também carrega
   * o menu lateral e, no PWA, a grade de ícones — segurar tudo isso por causa
   * de dois botões do motor atrasaria a tela inteira à toa.
   *
   * `visibility` e não `display: none`: o motor mede o próprio grid, e um
   * contêiner sem caixa o faria calcular zero — voltaria como arcada
   * espremida. Invisível, ele continua ocupando o mesmo espaço e medindo certo.
   *
   * O teto de 3s dentro do próprio `hideDefaultLayers` impede que isto vire
   * card eternamente invisível se o motor mudar os ids dos botões um dia: ele
   * desiste, chama o retorno mesmo assim, e a arcada aparece.
   */
  const arcadaEmPreparo = camadasProntasEm !== montagemDoMotor

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

  /**
   * O QUE APARECE À DIREITA DO MENU.
   *
   * O odontograma NÃO entra aqui de propósito — ele fica sempre montado no JSX
   * abaixo, só oculto (ver o comentário lá). Este switch cobre as demais
   * seções, todas painéis que já existiam: os mesmos das abas do perfil do
   * paciente e da tela de atendimento, agora ao alcance de quem está com a mão
   * na boca do paciente, sem sair do odontograma.
   */
  function painelDaSecao() {
    if (secao === CHAVE_INICIO) {
      return <MobileHome itens={ITENS} ocultar={ATALHOS_DA_BARRA} onSelecionar={setSecao} />
    }
    // Todos os painéis são do PACIENTE: sem um escolhido não há o que mostrar,
    // e cada um deles montaria uma busca com id vazio.
    if (!patientId) {
      return (
        <div className={styles.semPaciente}>
          <p>Escolha um paciente para começar.</p>
        </div>
      )
    }
    switch (secao) {
      case 'anamnese':
        return <Anamnesis patientId={patientId} />
      case 'tratamentos':
        // Sem desenhar a ficha do dia: o odontograma vivo é a primeira seção
        // deste mesmo menu, e o motor é um só (ver `estadoVivo`).
        return <TreatmentsPanel patientId={patientId} patientName={paciente?.name} hideOdontogram />
      case 'orcamentos':
        return <BudgetsPanel patientId={patientId} patientName={paciente?.name} />
      case 'prescricoes':
        return (
          <PrescriptionsPanel
            patientId={patientId}
            patientName={paciente?.name}
            patientCpf={paciente?.cpf}
          />
        )
      case 'documentos':
        return <DocumentsUpload patientId={patientId} />
      default:
        return null
    }
  }

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


          {patientId && !emAtendimento && sujo && !emHistorico && (
            <Button variant="ghost" size="md" onClick={salvarFicha} disabled={salvar.isPending}>
              Salvar
            </Button>
          )}
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

      {/* LEMBRETES do atendimento anterior. Subiram para o topo quando a coluna
          da direita saiu: servem para mudar a conduta ANTES de ela começar, e
          escondê-los atrás de uma seção do menu é o mesmo que não tê-los. */}
      {(lembretes?.length ?? 0) > 0 && (
        <aside className={styles.lembretes} aria-label="Lembretes deste paciente">
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

      <div className={`${styles.conteudo} ${ready ? '' : styles.carregandoConteudo}`}>
        {/* FINALIZAR no pé do menu. O iniciar não existe mais — a sessão abre
            sozinha ao entrar (ver `jaAbriu`), porque o clique de começar já foi
            dado na tela Hoje. Finalizar segue sendo explícito: é ele que grava
            o atendimento no prontuário e conclui o agendamento; fazê-lo
            automático no `fechar` transformaria um X acidental em registro
            clínico gravado. */}
        <SideNav
          itens={ITENS}
          ativo={secao === CHAVE_INICIO ? null : secao}
          onSelecionar={setSecao}
          rodape={emAtendimento && (
            <Button variant="danger" size="sm" onClick={fecharAtendimento} disabled={salvar.isPending}>
              Finalizar atendimento
            </Button>
          )}
        />

        {/* O ODONTOGRAMA NUNCA DESMONTA — só fica oculto.
            O motor é global de módulo, mede o próprio grid ao montar e zera o
            desenho ao ser desmontado. Trocá-lo por um `case` do switch abaixo
            apagaria o atendimento em curso toda vez que o dentista fosse ver a
            anamnese. Por isso ele vive FORA de painelDaSecao(), sempre no DOM,
            escondido por CSS quando outra seção está aberta.

            Em modo histórico o desenho fica inerte: o clique do dente não passa
            pela trava do toothFields (ele entra pelos handlers do próprio
            motor), então o bloqueio dele é aqui, onde o clique chega. */}
        <div
          className={[
            styles.quadro,
            emHistorico ? styles.quadroInerte : '',
            secao === 'odontograma' ? '' : styles.secaoOculta,
            arcadaEmPreparo ? styles.quadroEmPreparo : '',
          ].filter(Boolean).join(' ')}
          ref={shellRef}
        >
          {!patientId && ready && (
            <div className={styles.semPaciente}>
              <p>Escolha um paciente para começar.</p>
            </div>
          )}
          {/* `key` que muda a cada retomada: é o que reata o motor a ESTE
              contêiner depois que outra seção o levou (ver o efeito acima). */}
          <OdontogramShell key={montagemDoMotor} language="pt-br" darkMode={dark} enableNotes />
        </div>

        {secao !== 'odontograma' && (
          <main className={`${casca.principal} ${styles.painel}`}>{painelDaSecao()}</main>
        )}
      </div>

      <MobileNav itens={ITENS} atalhos={ATALHOS_DA_BARRA} ativo={secao} onSelecionar={setSecao} />

      <CibellyPedalButton
        mode="patient"
        enabled={botaoPedalHabilitado}
        active={cibelly.modoEscuta === 'patient'}
        processing={emProcessamento}
        onStart={cibelly.iniciarEscuta}
        onStop={cibelly.encerrarEscuta}
        label={botaoPedalRotulo}
        disabledReason={botaoPedalMotivo}
        activation={pedal.activation}
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

      {/* PRÉVIA DO ORÇAMENTO — mesma doutrina: a Cibelly monta e mostra aqui,
          só salva (na mesma tabela do editor manual de Orçamentos) e manda
          pra impressora depois de um "sim" falado (ver criarOrcamentoPaciente
          em useCibellyGeneralTools.ts). */}
      <Modal
        open={orcamentoPendente !== null}
        onClose={fecharPreviaOrcamento}
        title={orcamentoPendente?.titulo ?? 'Orçamento'}
        size="lg"
        footer={<Button variant="ghost" onClick={fecharPreviaOrcamento}>Cancelar</Button>}
      >
        <p className={styles.previaAviso}>
          Diga “sim” para finalizar. O orçamento fica <strong>pendente</strong> até o
          paciente aceitar, no botão “Aprovar” da lista de Orçamentos.
        </p>
        {orcamentoPendente && (
          <iframe
            className={styles.previaDocumento}
            title="Prévia do orçamento"
            srcDoc={orcamentoPendente.html}
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
