import { Fragment, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { EvolutionTemplatePicker } from '@/components/EvolutionTemplatePicker/EvolutionTemplatePicker'
import { LastSessionNote } from '@/components/LastSessionNote/LastSessionNote'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { SoapEditor } from '@/components/SoapEditor/SoapEditor'
import { useToast } from '@/components/Toast/Toast'
import { IconDocument, IconX } from '@/components/icons'
import { APP_ROUTES } from '@/constants'
import { usePatient } from '@/hooks/usePatients'
import { usePatientEntitlements } from '@/hooks/usePatientEntitlements'
import { useScheduleAppointments, useUpdateScheduleAppointment } from '@/hooks/useSchedule'
import { useClinicalEntries } from '@/hooks/useClinicalEntries'
import { usePatientMedications } from '@/hooks/useMedications'
import { errorMessage } from '@/utils/errors'
import { toIsoDate } from '@/utils/date'
import { isBlankSoap, isSameSoapNote } from '@/utils/soap'
import type { SoapNote, SoapSection } from '@/types/domain'
import type { ClinicalEntryKind } from '@/services/clinicalEntriesService'
import { AnamnesisPanel } from './AnamnesisPanel'
import { ClinicalFindingsPanel } from './ClinicalFindingsPanel'
import { ClinicalSectionPanel } from './ClinicalSectionPanel'
import { ConsultationHeader } from './ConsultationHeader'
import { ConsultationPatientCard } from './ConsultationPatientCard'
import { EvolutionTimeline } from './EvolutionTimeline'
import { MedicationsPanel } from './MedicationsPanel'
import { PhysioDocumentsPanel } from './PhysioDocumentsPanel'
import { PhysioTestsPanel } from './PhysioTestsPanel'
import { CLINICAL_SECTIONS } from './clinicalSections'
import styles from './ConsultationPage.module.scss'

/**
 * O QUE ESTÁ ESCOLHIDO NA BARRA — um estado só.
 *
 * A barra é UMA fileira de botões iguais, então o usuário a lê como um
 * seletor: um aceso por vez. Guardar "aba do centro" e "painel da direita" em
 * dois estados separados fazia os dois discordarem — clicar em Testes trocava
 * o centro e deixava Anamnese aceso com o painel aberto do lado.
 *
 * Alguns destinos ocupam o CENTRO, outros abrem o painel da DIREITA; o que
 * decide é a natureza do conteúdo, não o clique:
 *
 *  · centro  — Hoje e Testes. Resultado de teste é série no tempo (tabela +
 *    gráfico); numa coluna de 400px vira rolagem horizontal.
 *  · direita — seções clínicas, documentos e exames: texto curto, que se lê ao
 *    lado do prontuário sem tirá-lo da vista.
 *
 * O prontuário não se perde quando o centro troca: o texto vive no estado
 * desta página, não dentro do editor.
 */
type Escolhido = 'prontuario' | 'hoje' | 'testes' | ClinicalEntryKind | 'documentos'

/** O que a barra mostra como título quando não é o prontuário. */
function tituloDoEscolhido(e: Escolhido): string {
  if (e === 'hoje') return 'Achados clínicos'
  if (e === 'testes') return 'Testes'
  if (e === 'documentos') return 'Documentos'
  return CLINICAL_SECTIONS.find(s => s.kind === e)?.label ?? ''
}

/**
 * Anamnese primeiro. A ordem de `CLINICAL_SECTIONS` serve ao atendimento
 * médico; aqui a anamnese abre o atendimento e o botão de Testes entra logo
 * depois dela (ver a barra).
 */
const SECOES_ORDENADAS = [
  ...CLINICAL_SECTIONS.filter(s => s.kind === 'anamnesis'),
  ...CLINICAL_SECTIONS.filter(s => s.kind !== 'anamnesis'),
]

/**
 * TELA DE ATENDIMENTO DA FISIOTERAPIA — tela cheia, uma sessão por vez.
 *
 * Mesmo esqueleto do atendimento médico (topo, três colunas, cronômetro), com
 * duas trocas que são a diferença entre as profissões:
 *
 *  · O centro é o PRONTUÁRIO SOAP, não a ficha médica de seis seções. É o
 *    formato que a fisioterapia já usa, com modelo de evolução, cópia da sessão
 *    anterior e o aviso de evolução carbonada — tudo isso já existia dentro do
 *    AppointmentModal, espremido numa coluna de modal.
 *  · Não há RECEITA. Fisioterapeuta não prescreve medicamento; ele registra
 *    conduta no prontuário. Atestado e relatório ficam (Resolução COFFITO
 *    414/2012 autoriza o atestado), e a medicação em uso aparece em LEITURA —
 *    saber o que o paciente toma muda a conduta mesmo sem prescrever.
 *
 * E um painel que só existe aqui: TESTES, com o histórico de resultados do
 * paciente — é o que mostra se a fisioterapia está funcionando.
 */
export function PhysioConsultationPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const appointmentId = params.get('sessao')

  const hojeIso = toIsoDate(new Date())
  const { data: doDia, isLoading } = useScheduleAppointments(hojeIso, hojeIso)
  const sessao = (doDia ?? []).find(a => a.id === appointmentId)
  const { data: paciente } = usePatient(sessao?.patientId ?? '')
  const { data: entradas } = useClinicalEntries(sessao?.patientId ?? null)
  const { data: medicacoes } = usePatientMedications(sessao?.patientId ?? null)
  const { data: pacotes } = usePatientEntitlements(sessao?.patientId ?? '')
  const { mutate: atualizar, isPending: salvando } = useUpdateScheduleAppointment()

  const [inicio, setInicio] = useState<Date | null>(null)
  const [escolhido, setEscolhido] = useState<Escolhido>('prontuario')
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)

  /** Seções que vieram COPIADAS e ainda não foram tocadas — ganham marca. */
  const [copiadas, setCopiadas] = useState<readonly SoapSection[]>([])
  const [nota, setNota] = useState<SoapNote | null>(null)
  const [carregadaDe, setCarregadaDe] = useState<string | null>(null)
  if (sessao && appointmentId && carregadaDe !== appointmentId) {
    setCarregadaDe(appointmentId)
    setNota(sessao.clinicalNote ?? {})
  }

  if (!appointmentId) {
    return (
      <EmptyState
        icon={<IconDocument />}
        title="Nenhuma sessão escolhida"
        description="Entre pela tela Hoje, na lista de pacientes, e clique em Iniciar sessão."
      />
    )
  }

  if (isLoading) return <PageLoader />

  if (!sessao) {
    return (
      <EmptyState
        icon={<IconDocument />}
        title="Sessão não encontrada"
        description="Ela pode ter sido cancelada ou pertencer a outra clínica."
      />
    )
  }

  const sujo = nota !== null && !isSameSoapNote(nota, sessao.clinicalNote ?? {})
  const emAtendimento = sessao.status === 'in_service'
  // Pacote com sessões restantes: é a primeira coisa que o paciente pergunta
  // no fim do atendimento ("quantas ainda tenho?").
  const pacoteAtivo = (pacotes ?? []).find(p => p.remaining !== null && p.remaining > 0)

  function sair() {
    if (sujo) { setConfirmandoSaida(true); return }
    navigate(APP_ROUTES.TODAY)
  }

  function salvarNota(depois?: () => void) {
    if (!sessao || nota === null) return
    atualizar({ id: sessao.id, payload: { ...sessao, clinicalNote: nota } }, {
      onSuccess: () => { toast.success('Prontuário salvo.'); depois?.() },
      onError: e => toast.error(errorMessage(e, 'Não foi possível salvar o prontuário.')),
    })
  }

  function iniciarSessao() {
    if (!sessao) return
    setInicio(new Date())
    atualizar({ id: sessao.id, payload: { ...sessao, status: 'in_service' } }, {
      onError: e => toast.error(errorMessage(e, 'Não foi possível iniciar a sessão.')),
    })
  }

  function finalizarSessao() {
    if (!sessao) return
    // Grava o prontuário JUNTO: encerrar com evolução não salva seria perder o
    // trabalho da sessão no gesto que a encerra.
    atualizar({
      id: sessao.id,
      payload: { ...sessao, status: 'completed', ...(nota !== null ? { clinicalNote: nota } : {}) },
    }, {
      onSuccess: () => {
        setInicio(null)
        toast.success('Sessão finalizada.')
        navigate(APP_ROUTES.TODAY)
      },
      onError: e => toast.error(errorMessage(e, 'Não foi possível finalizar a sessão.')),
    })
  }

  /** Clicar no que já está aceso volta ao prontuário — o botão é liga/desliga. */
  function alternar(destino: Escolhido) {
    setEscolhido(atual => (atual === destino ? 'prontuario' : destino))
  }

  /** Aplica um modelo ou repete a sessão anterior, marcando o que foi copiado. */
  function aplicarCopia(vinda: SoapNote) {
    setNota({ ...(nota ?? {}), ...vinda })
    setCopiadas(Object.keys(vinda) as SoapSection[])
  }

  return (
    <div className={styles.tela}>
      <ConsultationHeader
        emAtendimento={emAtendimento}
        ocupado={salvando}
        substantivo="sessão"
        onIniciar={iniciarSessao}
        onFinalizar={finalizarSessao}
      />

      {/* SEMPRE duas colunas: paciente à esquerda, tudo o mais no centro. A
          coluna da direita foi removida — texto clínico numa faixa de 400px
          quebra em quatro linhas, e o centro é a área larga da tela. */}
      <div className={`${styles.corpo} ${styles.semPainel}`}>
        <aside className={styles.colunaEsquerda}>
          <ConsultationPatientCard
            paciente={paciente ?? undefined}
            medicacoes={medicacoes ?? []}
            inicio={inicio}
            onSair={sair}
          >
            {/* SESSÕES DO PACOTE: só aqui. É a pergunta do paciente no fim do
                atendimento, e o número já vem calculado do banco (total menos
                usadas menos agendadas). */}
            {pacoteAtivo && (
              <div className={styles.bloco}>
                <span className={styles.blocoTitulo}>Pacote</span>
                <p className={styles.pacoteRestante}>
                  <strong>{pacoteAtivo.remaining}</strong> {pacoteAtivo.remaining === 1 ? 'sessão restante' : 'sessões restantes'}
                </p>
              </div>
            )}
          </ConsultationPatientCard>
        </aside>

        <main className={styles.centro}>
          <div className={styles.barraSecoes}>
            {/* HOJE abre a agenda do dia no centro. Sessão de fisioterapia é
                curta e emendada — sair da tela para pegar o próximo paciente e
                entrar de novo são quatro cliques e uma tela em branco no meio.
                Primeiro da barra porque é navegação, não seção clínica. */}
            <button
              type="button"
              className={`${styles.botaoSecao} ${escolhido === 'hoje' ? styles.botaoSecaoAtivo : ''}`}
              aria-pressed={escolhido === 'hoje'}
              onClick={() => alternar('hoje')}
            >
              Hoje
            </button>
            {/* Anamnese primeiro, Testes logo depois: são os dois que o
                fisioterapeuta abre no começo do atendimento — a ficha do
                paciente e como ele estava na última medição. O resto das
                seções vem em seguida. */}
            {SECOES_ORDENADAS.map(s => (
              <Fragment key={s.kind}>
                <button
                  type="button"
                  className={`${styles.botaoSecao} ${escolhido === s.kind ? styles.botaoSecaoAtivo : ''}`}
                  aria-pressed={escolhido === s.kind}
                  onClick={() => alternar(s.kind)}
                >
                  {s.label}
                </button>
                {/* Testes troca o CENTRO, não abre painel: resultado de teste
                    é série no tempo (tabela + gráfico) e não cabe numa coluna
                    estreita. Mesmo lugar que ocupa na aba Testes do perfil. */}
                {s.kind === 'anamnesis' && (
                  <button
                    key="testes"
                    type="button"
                    className={`${styles.botaoSecao} ${escolhido === 'testes' ? styles.botaoSecaoAtivo : ''}`}
                    aria-pressed={escolhido === 'testes'}
                    onClick={() => alternar('testes')}
                  >
                    Testes
                  </button>
                )}
              </Fragment>
            ))}
            <button
              type="button"
              className={`${styles.botaoSecao} ${escolhido === 'documentos' ? styles.botaoSecaoAtivo : ''}`}
              aria-pressed={escolhido === 'documentos'}
              onClick={() => alternar('documentos')}
            >
              Documentos
            </button>
          </div>

          {escolhido === 'prontuario' || escolhido === 'hoje' ? (
            <>
              {/* HOJE = o que foi achado + a evolução, na mesma rolagem. É a
                  tela de trabalho da sessão: o fisioterapeuta lança o achado e
                  escreve a evolução dele sem trocar de aba. */}
              {escolhido === 'hoje' && (
                <>
                  <header className={styles.painelCabecalho}>
                    <h2 className={styles.painelTitulo}>Achados clínicos</h2>
                    <Button
                      variant="ghost" size="sm" iconLeft={<IconX />}
                      aria-label="Voltar ao prontuário"
                      onClick={() => setEscolhido('prontuario')}
                    />
                  </header>
                  {/* Só o CAMPO. Os registros anteriores vão para depois do
                      SOAP — histórico é o que se consulta, não o que se
                      digita, e no meio da tela empurraria a evolução para
                      fora da vista. */}
                  <ClinicalSectionPanel
                    parte="formulario"
                    kind="problems"
                    patientId={sessao.patientId}
                    appointmentId={sessao.id}
                    professionalId={sessao.professionalId}
                    entradas={entradas ?? []}
                  />
                  <hr className={styles.divisorCentro} />
                </>
              )}
              {/* A evolução ANTERIOR, recolhida: conferir o que foi feito da
                  última vez sem sair da tela. O botão "repetir" traz só Objetivo
                  e Plano — Subjetivo e Avaliação são o que muda de uma sessão
                  para a outra. */}
              <LastSessionNote
                patientId={sessao.patientId}
                beforeDateIso={sessao.date}
                beforeStartTime={sessao.startTime}
                onRepeat={aplicarCopia}
              />

              <div className={styles.editor}>
                <SoapEditor
                  value={nota ?? {}}
                  onChange={n => { setNota(n); setCopiadas([]) }}
                  copiedSections={copiadas}
                />
              </div>

              <div className={styles.editorRodape}>
                {sujo && <span className={styles.naoSalvo}>Alterações não salvas</span>}
                <EvolutionTemplatePicker current={nota ?? {}} onApply={aplicarCopia} />
                <Button loading={salvando} disabled={!sujo || isBlankSoap(nota)} onClick={() => salvarNota()}>
                  Salvar prontuário
                </Button>
              </div>

              <EvolutionTimeline consultas={[]} />

              {/* REGISTROS ANTERIORES dos achados, no fim: é consulta, não
                  digitação. Só na aba Hoje — no prontuário puro seriam ruído
                  entre o editor e nada. */}
              {escolhido === 'hoje' && (
                <>
                  <hr className={styles.divisorCentro} />
                  <ClinicalSectionPanel
                    parte="registros"
                    kind="problems"
                    patientId={sessao.patientId}
                    appointmentId={sessao.id}
                    professionalId={sessao.professionalId}
                    entradas={entradas ?? []}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <header className={styles.painelCabecalho}>
                <h2 className={styles.painelTitulo}>{tituloDoEscolhido(escolhido)}</h2>
                <Button
                  variant="ghost" size="sm" iconLeft={<IconX />}
                  aria-label="Voltar ao prontuário"
                  onClick={() => setEscolhido('prontuario')}
                />
              </header>

              {/* Rascunho pendente: aqui o prontuário SAIU da vista (em Hoje
                  ele continua logo abaixo, então o aviso seria ruído). */}
              {sujo && (
                <p className={styles.rascunhoGuardado} role="status">
                  A evolução desta sessão continua escrita.{' '}
                  <button type="button" className={styles.voltarProntuario} onClick={() => setEscolhido('prontuario')}>
                    Voltar ao prontuário
                  </button>
                </p>
              )}

              {escolhido === 'testes' ? (
                <PhysioTestsPanel patientId={sessao.patientId} />
              ) : escolhido === 'documentos' ? (
                /* ARQUIVO, não emissora: o fisioterapeuta não emite atestado
                   nem solicita exame — ele guarda o que o paciente traz, em
                   quatro divisões. */
                <PhysioDocumentsPanel
                  patientId={sessao.patientId}
                  appointmentId={sessao.id}
                />
              ) : escolhido === 'anamnesis' ? (
                <AnamnesisPanel patientId={sessao.patientId} />
              ) : escolhido === 'problems' ? (
                <ClinicalFindingsPanel
                  patientId={sessao.patientId}
                  appointmentId={sessao.id}
                  professionalId={sessao.professionalId}
                  entradas={entradas ?? []}
                />
              ) : escolhido === 'medications' ? (
                <MedicationsPanel
                  patientId={sessao.patientId}
                  appointmentId={sessao.id}
                  professionalId={sessao.professionalId}
                  medicacoes={medicacoes ?? []}
                />
              ) : (
                <ClinicalSectionPanel
                  kind={escolhido}
                  patientId={sessao.patientId}
                  appointmentId={sessao.id}
                  professionalId={sessao.professionalId}
                  entradas={entradas ?? []}
                />
              )}
            </>
          )}
        </main>

      </div>

      <ConfirmDialog
        open={confirmandoSaida}
        onClose={() => setConfirmandoSaida(false)}
        onConfirm={() => { setConfirmandoSaida(false); navigate(APP_ROUTES.TODAY) }}
        title="Sair sem salvar?"
        message="O prontuário desta sessão ainda não foi salvo e será perdido. Salvar leva um clique — o botão está no pé do editor."
        variant="danger"
        confirmLabel="Sair sem salvar"
      />
    </div>
  )
}
