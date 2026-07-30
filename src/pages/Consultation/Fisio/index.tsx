import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useToast } from '@/components/Toast/Toast'
import { APP_ROUTES } from '@/constants'
import { useArchivePreviousAnamnesis } from '@/hooks/useAnamnesis'
import {
  useCarePlans, useCreateCarePlan, useFinishCarePlan, useLinkAppointmentToPlan, useSetCarePlanPhoto,
} from '@/hooks/useCarePlans'
import { useClinicalEntries } from '@/hooks/useClinicalEntries'
import { usePatientMedications } from '@/hooks/useMedications'
import { usePatient } from '@/hooks/usePatients'
import { useScheduleAppointments } from '@/hooks/useSchedule'
import { KINDS_DO_TRATAMENTO } from '@/services/clinicalEntriesService'
import { PatientTestsPanel } from '@/pages/Patients/Profile/Tests/PatientTestsPanel'
import { toIsoDate } from '@/utils/date'
import { isMobileViewport } from '@/utils/viewport'
import { Anamnesis } from '../Components/Anamnesis/Anamnesis'
import { BodyCompositionPanel } from '../BodyCompositionPanel'
import { ClinicalSectionPanel } from '../ClinicalSectionPanel'
import { Header } from '../Components/Header/Header'
import { MedicationsPanel } from '../MedicationsPanel'
import { PhysioDocumentsPanel } from '../PhysioDocumentsPanel'
import { VitalSignsPanel } from '../VitalSignsPanel'
import { ClinicalRecord } from './components/ClinicalRecord/ClinicalRecord'
import { Diagnosis } from './components/Diagnosis/Diagnosis'
import { SideNav } from './components/SideNav/SideNav'
import type { SideNavKey } from './components/SideNav/SideNav'
import { MobileHome } from './components/MobileHome/MobileHome'
import { MobileNav } from './components/MobileNav/MobileNav'
import type { MobileNavKey } from './components/MobileNav/MobileNav'
import { MyTreatments } from './components/MyTreatments/MyTreatments'
import { NewTreatmentModal } from './components/NewTreatmentModal/NewTreatmentModal'
import { TreatmentWizard } from './components/TreatmentWizard/TreatmentWizard'
import styles from './Fisio.module.scss'

/** 'inicio' só existe no PWA mobile — a grade de ícones atrás do botão
 *  central da barra inferior (ver MobileHome). No SideNav do desktop não há
 *  botão que leve a este valor, então ele nunca aparece lá. */
type Secao = SideNavKey | 'inicio'

/**
 * ATENDIMENTO DE FISIOTERAPIA — a tela, do zero.
 *
 * O menu lateral decide o que `.principal` mostra — cada seção reaproveita o
 * painel que já existe em `Consultation/` (Anamnesis, Diagnosis,
 * BodyCompositionPanel, PatientTestsPanel, MedicationsPanel,
 * ClinicalSectionPanel, PhysioDocumentsPanel...), a mesma peça vista da tela
 * antiga por um menu novo.
 *
 * O cartão do tratamento e o roteiro de etapas NUNCA aparecem juntos: criar um
 * tratamento não abre o roteiro sozinho, é o clique em "Continuar" que decide
 * isso — ver `abrindoEtapas`.
 *
 * Sair volta para HOJE, não para o Dashboard: quem fecha uma sessão volta para
 * a fila de onde veio, e cair na visão gerencial obrigaria dois cliques para
 * chamar o próximo paciente.
 */
export function FisioPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const appointmentId = params.get('sessao')

  const hojeIso = toIsoDate(new Date())
  const { data: doDia } = useScheduleAppointments(hojeIso, hojeIso)
  const sessao = (doDia ?? []).find(a => a.id === appointmentId)
  const { data: paciente } = usePatient(sessao?.patientId ?? '')

  // `isLoading` importa tanto quanto o dado: sem ele, ENQUANTO a busca não
  // volta, `planos` é `undefined` e `planoAtivo` fica `undefined` também — a
  // tela lia isso como "sem tratamento" e mostrava o botão de criar um novo
  // por uma fração de segundo, mesmo quando o paciente JÁ tem um ativo. Com
  // conexão lenta essa fração de segundo é tempo de sobra para o clique passar.
  const { data: planos, isLoading: carregandoPlanos } = useCarePlans(sessao?.patientId ?? '')
  const planoAtivo = (planos ?? []).find(p => p.status === 'active')

  const { data: entradas } = useClinicalEntries(sessao?.patientId ?? null)
  const { data: medicacoes } = usePatientMedications(sessao?.patientId ?? null)

  // O DIAGNÓSTICO É DO TRATAMENTO, NÃO DA PESSOA — mesmo filtro de
  // do gatilho do banco. Excluir o plano não apaga a anotação (a FK
  // preserva de propósito), mas sem este filtro o diagnóstico de um
  // tratamento encerrado vazaria para o próximo como se ainda valesse.
  // Antecedente cirúrgico, histórico familiar, medicação e risco atravessam
  // tratamentos e continuam inteiros, como o gatilho do banco já assume.
  const entradasVisiveis = (entradas ?? []).filter(
    e => !KINDS_DO_TRATAMENTO.includes(e.kind) || (planoAtivo != null && e.carePlanId === planoAtivo.id),
  )

  const criar = useCreateCarePlan()
  const arquivarAnamnese = useArchivePreviousAnamnesis(sessao?.patientId ?? '')
  const trocarFoto = useSetCarePlanPhoto(sessao?.patientId ?? '')
  const darAlta = useFinishCarePlan(sessao?.patientId ?? '')
  const vincularConsulta = useLinkAppointmentToPlan(sessao?.patientId ?? '')

  // PORTA DE ENTRADA diferente por aparelho: no PWA mobile é a grade de
  // ícones ('inicio', ver MobileHome) — é dali que o fisioterapeuta escolhe
  // pra onde ir, igual à home de um app de celular. No desktop, que já
  // mostra o menu inteiro do lado, entrar direto em "Sinais vitais" poupa um
  // clique do que costuma ser conferido primeiro na sessão.
  // Lido uma vez na montagem (`isMobileViewport`, não reativo de propósito):
  // girar o aparelho no meio do atendimento não deve trocar de seção sozinho.
  const [secao, setSecao] = useState<Secao>(() => (isMobileViewport() ? 'inicio' : 'sinais-vitais'))
  const [criandoTratamento, setCriandoTratamento] = useState(false)
  const [confirmandoAlta, setConfirmandoAlta] = useState(false)
  // O CARTÃO E O ROTEIRO NUNCA APARECEM JUNTOS. Criar um tratamento não abre o
  // roteiro sozinho — a tela volta ao cartão, e é o clique em "Continuar" que
  // decide entrar nas etapas. `false` por padrão vale tanto para quem acabou
  // de criar quanto para quem recarrega a página com um tratamento em curso.
  const [abrindoEtapas, setAbrindoEtapas] = useState(false)

  // LIGA A CONSULTA DE HOJE AO PLANO ATIVO — é dessa ligação que "sessões
  // realizadas" e a barra de progresso do cartão saem. Uma vez por (consulta,
  // plano): sem a marca, todo re-render tentaria regravar a mesma coluna.
  const jaVinculou = useRef<string | null>(null)
  useEffect(() => {
    if (!sessao || !planoAtivo) return
    const chave = `${sessao.id}:${planoAtivo.id}`
    if (jaVinculou.current === chave) return
    jaVinculou.current = chave
    vincularConsulta.mutate({ appointmentId: sessao.id, planId: planoAtivo.id })
    // Dependências DE PROPÓSITO só nos ids, não nos objetos: `sessao` e
    // `planoAtivo` são recriados a cada busca (mesmo id, referência nova), e
    // `vincularConsulta` é recriado a cada render (novo useMutation) — incluir
    // qualquer um dos três repetiria a ligação em loop. A guarda por `chave`
    // já cobre o que importa: religar quando a CONSULTA ou o PLANO mudam de
    // verdade, não quando a referência muda sem o id mudar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.id, planoAtivo?.id])

  // Troca de PLANO fecha o roteiro. Ajustado DURANTE o render, não em efeito:
  // sem isto, dar alta e abrir um tratamento novo (ou trocar de paciente)
  // poderia herdar `abrindoEtapas=true` de uma sessão anterior e pular direto
  // para o roteiro, sem passar pelo cartão.
  const [planoDoRoteiro, setPlanoDoRoteiro] = useState<string | null>(null)
  if ((planoAtivo?.id ?? null) !== planoDoRoteiro) {
    setPlanoDoRoteiro(planoAtivo?.id ?? null)
    if (abrindoEtapas) setAbrindoEtapas(false)
  }

  return (
    <div className={styles.tela}>
      <Header paciente={paciente ?? undefined} onSair={() => navigate(APP_ROUTES.TODAY)} />

      <div className={styles.corpo}>
        {/* 'inicio' não existe no menu do desktop — sem item ativo é a leitura
         *  correta ali (esse valor só chega vindo da navegação inferior). */}
        <SideNav ativo={secao === 'inicio' ? undefined : secao} onSelecionar={setSecao} />

        <main className={styles.principal}>
          {!sessao || carregandoPlanos ? (
            // A tela não tem base para afirmar nada ainda — nem o vazio, nem
            // a lista de tratamentos.
            <PageLoader />
          ) : abrindoEtapas && planoAtivo ? (
            <TreatmentWizard
              plano={planoAtivo}
              patientId={sessao.patientId}
              appointmentId={sessao.id}
              professionalId={sessao.professionalId}
              onConcluir={() => {
                toast.success('Abertura do tratamento concluída.')
                setAbrindoEtapas(false)
              }}
              onVoltar={() => setAbrindoEtapas(false)}
            />
          ) : secao === 'inicio' ? (
            <MobileHome onSelecionar={setSecao} />
          ) : secao === 'prontuarios' ? (
            <ClinicalRecord
              patientId={sessao.patientId}
              appointmentId={sessao.id}
              dateIso={sessao.date}
              startTime={sessao.startTime}
              clinicalNote={sessao.clinicalNote}
              carePlanId={planoAtivo?.id}
            />
          ) : secao === 'sinais-vitais' ? (
            // `treatmentSessionId` amarra cada aferição nova à consulta de
            // HOJE — é assim que "a data do dia" chega junto sem precisar de
            // um campo de data no formulário: quem aferiu na consulta de
            // hoje, aferiu com o `measured_at` de hoje (padrão do serviço).
            // `carePlanId` recorta o histórico exibido a ESTE tratamento —
            // mesmo princípio do Diagnóstico.
            <VitalSignsPanel
              patientId={sessao.patientId}
              professionalId={sessao.professionalId}
              treatmentSessionId={sessao.id}
              carePlanId={planoAtivo?.id}
            />
          ) : secao === 'meus-tratamentos' ? (
            <MyTreatments
              planos={planos ?? []}
              onNovoTratamento={() => setCriandoTratamento(true)}
              onContinuar={() => setAbrindoEtapas(true)}
              onFinalizar={() => setConfirmandoAlta(true)}
              onTrocarFoto={url => planoAtivo && trocarFoto.mutate(
                { planId: planoAtivo.id, url },
                {
                  onSuccess: () => toast.success('Foto do tratamento atualizada.'),
                  onError: (e: Error) => toast.error(e.message),
                },
              )}
            />
          ) : secao === 'testes' ? (
            // `carePlanId` recorta ao tratamento em curso, mesmo princípio do
            // Diagnóstico e dos Sinais vitais. Sem plano ativo, o próprio
            // painel cai para o histórico inteiro do paciente — não há
            // episódio a recortar.
            <PatientTestsPanel patientId={sessao.patientId} carePlanId={planoAtivo?.id} />
          ) : secao === 'avaliacoes' ? (
            // `carePlanId` recorta ao tratamento em curso, mesmo princípio do
            // Diagnóstico, dos Sinais vitais e dos Testes.
            <BodyCompositionPanel
              patientId={sessao.patientId}
              professionalId={sessao.professionalId}
              carePlanId={planoAtivo?.id}
            />
          ) : secao === 'diagnostico' ? (
            <Diagnosis
              patientId={sessao.patientId}
              appointmentId={sessao.id}
              professionalId={sessao.professionalId}
              entradas={entradasVisiveis}
            />
          ) : secao === 'anamnese' ? (
            <Anamnesis patientId={sessao.patientId} />
          ) : secao === 'medicacoes' ? (
            <MedicationsPanel
              patientId={sessao.patientId}
              appointmentId={sessao.id}
              professionalId={sessao.professionalId}
              medicacoes={medicacoes ?? []}
            />
          ) : secao === 'historico-familiar' ? (
            <ClinicalSectionPanel
              kind="family_history"
              patientId={sessao.patientId}
              appointmentId={sessao.id}
              professionalId={sessao.professionalId}
              entradas={entradasVisiveis}
            />
          ) : secao === 'risco' ? (
            <ClinicalSectionPanel
              kind="risks"
              patientId={sessao.patientId}
              appointmentId={sessao.id}
              professionalId={sessao.professionalId}
              entradas={entradasVisiveis}
            />
          ) : secao === 'antecedentes-cirurgicos' ? (
            <ClinicalSectionPanel
              kind="surgical_history"
              patientId={sessao.patientId}
              appointmentId={sessao.id}
              professionalId={sessao.professionalId}
              entradas={entradasVisiveis}
            />
          ) : (
            // 'documentos' — arquivo, não emissora: o fisioterapeuta não emite
            // atestado nem solicita exame por aqui, só guarda o que o
            // paciente traz.
            <PhysioDocumentsPanel patientId={sessao.patientId} appointmentId={sessao.id} />
          )}
        </main>
      </div>

      {/* Só aparece no PWA mobile (ver MobileNav.module.scss) — no desktop a
       *  navegação já mora no SideNav acima. */}
      <MobileNav
        ativo={secao === 'prontuarios' || secao === 'sinais-vitais' || secao === 'inicio' ? secao : null}
        onSelecionar={(chave: MobileNavKey) => setSecao(chave)}
      />

      <NewTreatmentModal
        // Segunda trava, além do botão só existir dentro de NoActiveTreatment:
        // se um plano ficar ativo ENQUANTO o modal está aberto (outra aba
        // criou um, ou o refetch ao focar a janela trouxe um plano que já
        // existia), `&& !planoAtivo` fecha o formulário na mesma renderização
        // — sem esperar o profissional clicar em algo para descobrir que o
        // tratamento já existe.
        open={criandoTratamento && !planoAtivo}
        onClose={() => setCriandoTratamento(false)}
        onCriar={dados => {
          if (!sessao) return
          criar.mutate(
            {
              patientId: sessao.patientId,
              titulo: dados.titulo,
              inicioIso: dados.inicioIso,
              sessoesPrevistas: dados.sessoes,
              professionalId: sessao.professionalId,
            },
            {
              onSuccess: () => {
                toast.success('Tratamento iniciado.')
                setCriandoTratamento(false)
                // FECHA A FICHA ANTERIOR — best-effort. Sem isto a anamnese do
                // tratamento novo abriria mostrando as respostas do episódio
                // passado, porque a ficha é uma-por-paciente e o novo plano não
                // muda essa conta sozinho. Falhar aqui não desfaz o tratamento
                // já criado: o profissional pode preencher uma anamnese nova
                // mesmo que a antiga não tenha sido arquivada.
                arquivarAnamnese.mutate(undefined, {
                  onError: (e: Error) => toast.error(
                    `Tratamento criado, mas a anamnese anterior não pôde ser arquivada: ${e.message}`,
                  ),
                })
              },
              // A mensagem já vem pronta do banco (ex.: "este paciente já tem
              // um tratamento em andamento") — repetir a regra aqui criaria
              // duas versões dela.
              onError: (e: Error) => toast.error(e.message),
            },
          )
        }}
      />

      <ConfirmDialog
        open={confirmandoAlta}
        title="Finalizar tratamento?"
        message={
          planoAtivo
            ? `O tratamento será encerrado com ${planoAtivo.sessoesRealizadas} sessão(ões) realizada(s). `
              + 'O sistema registra um retrato do estado atual para comparar com o do início — depois disso, a alta não muda.'
            : undefined
        }
        confirmLabel="Finalizar"
        onClose={() => setConfirmandoAlta(false)}
        onConfirm={() => {
          if (!planoAtivo) return
          setConfirmandoAlta(false)
          darAlta.mutate({ planId: planoAtivo.id }, {
            onSuccess: () => toast.success('Tratamento finalizado.'),
            onError: (e: Error) => toast.error(e.message),
          })
        }}
      />
    </div>
  )
}
