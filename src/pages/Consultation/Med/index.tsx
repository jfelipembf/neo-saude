import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useToast } from '@/components/Toast/Toast'
import { IconDocument } from '@/components/icons'
import { APP_ROUTES } from '@/constants'
import { useSession } from '@/context/SessionProvider'
import { usePatient } from '@/hooks/usePatients'
import { usePatientPrescriptions } from '@/hooks/usePrescriptions'
import { useScheduleAppointments, useUpdateScheduleAppointment } from '@/hooks/useSchedule'
import { usePatientConsultations } from '@/hooks/useMedicalRecord'
import { useConsultationChart, useSaveConsultationChart } from '@/hooks/useMedicalNote'
import type { MedicalNote } from '@/services/medicalNoteService'
import { useClinicalEntries } from '@/hooks/useClinicalEntries'
import { usePatientMedications } from '@/hooks/useMedications'
import { errorMessage } from '@/utils/errors'
import { toIsoDate } from '@/utils/date'
import { isMobileViewport } from '@/utils/viewport'
import { Header } from '../Components/Header/Header'
import { SideNav } from '../Components/Shell/SideNav'
import { MobileNav } from '../Components/Shell/MobileNav'
import { MobileHome } from '../Components/Shell/MobileHome'
import { CHAVE_INICIO } from '../Components/Shell/navItems'
import { Anamnesis } from '../Components/Anamnesis/Anamnesis'
import { ClinicalSectionPanel } from '../Components/ClinicalSectionPanel/ClinicalSectionPanel'
import { MedicationsPanel } from '../Components/MedicationsPanel/MedicationsPanel'
import { VitalSignsPanel } from '../Components/VitalSignsPanel/VitalSignsPanel'
import { ConsultationDocuments } from '../Components/Documents/ConsultationDocuments'
import { EvolutionTimeline } from './components/EvolutionTimeline'
import { PatientCard } from './components/PatientCard/PatientCard'
import { MedicalNoteForm } from './components/MedicalNoteForm'
import { ATALHOS_DA_BARRA, ITENS } from './sideNavItems'
import type { MedNavKey } from './sideNavItems'
import casca from '../Components/Shell/Shell.module.scss'
import styles from './Med.module.scss'

/** 'inicio' só existe no PWA mobile — a grade de ícones atrás do botão central
 *  da barra inferior. No menu lateral do desktop não há botão que leve a ela. */
type Secao = MedNavKey | typeof CHAVE_INICIO

/** Quanto tempo sem digitar até o rascunho ir para o banco. 2s é longo o
 *  bastante para não gravar a cada tecla e curto o bastante para que trocar de
 *  seção logo depois de escrever já encontre a ficha salva. */
const ESPERA_DO_RASCUNHO_MS = 2000

/**
 * ATENDIMENTO MÉDICO — tela cheia, um paciente por vez.
 *
 * Irmã do AppLayout, não filha (ver AppRouter): sem Header do app nem
 * navegação, porque durante a consulta a tela inteira é o atendimento.
 *
 * MESMA CASCA das outras especialidades (Components/Shell): menu lateral no
 * desktop, barra inferior no PWA. O que muda é a lista de seções e o mapa
 * seção→painel, ambos desta pasta.
 *
 * O que ERA a coluna esquerda foi redistribuído, não perdido: identidade do
 * paciente e Sair foram para o cabeçalho compartilhado; o par
 * Iniciar/Finalizar entra pelo slot `acoes` dele; e a MEDICAÇÃO EM USO ficou
 * junto da Ficha — é o dado que muda conduta na hora, e escondê-lo atrás de um
 * clique seria o mesmo que não tê-lo.
 */
export function MedPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const appointmentId = params.get('consulta')

  const { specialty } = useSession()
  // A consulta vem da agenda de HOJE, que é de onde se entra nesta tela. Não há
  // busca por id solto no serviço, e criar uma só para cá seria uma segunda
  // porta para o mesmo dado.
  const hojeIso = toIsoDate(new Date())
  const { data: doDia, isLoading } = useScheduleAppointments(hojeIso, hojeIso)
  const consulta = (doDia ?? []).find(a => a.id === appointmentId)
  const { data: paciente } = usePatient(consulta?.patientId ?? '')
  const { data: anteriores } = usePatientConsultations(consulta?.patientId ?? null, appointmentId ?? undefined)
  const { data: documentos } = usePatientPrescriptions(consulta?.patientId ?? '')
  const { data: fichaSalva, isLoading: carregandoEvolucao } = useConsultationChart(appointmentId)
  const { mutate: salvar, isPending: salvando } = useSaveConsultationChart()
  const { mutate: atualizarConsulta } = useUpdateScheduleAppointment()
  const { data: entradas } = useClinicalEntries(consulta?.patientId ?? null)
  const { data: medicacoes } = usePatientMedications(consulta?.patientId ?? null)

  const [confirmandoSaida, setConfirmandoSaida] = useState(false)

  // PORTA DE ENTRADA por aparelho: no PWA é a grade de ícones, de onde se
  // escolhe; no desktop, que já mostra o menu inteiro do lado, entra-se direto
  // na Ficha, que é onde a consulta acontece. Lido uma vez na montagem — girar
  // o aparelho no meio do atendimento não deve trocar de seção sozinho.
  const [secao, setSecao] = useState<Secao>(() => (isMobileViewport() ? CHAVE_INICIO : 'ficha'))

  const [ficha, setFicha] = useState<MedicalNote | null>(null)
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  // Deriva em render, não em efeito: o rascunho nasce do que está gravado, e uma
  // revalidação em segundo plano não apaga o que está sendo digitado.
  const [carregadaDe, setCarregadaDe] = useState<string | null>(null)
  if (fichaSalva !== undefined && appointmentId && carregadaDe !== appointmentId) {
    setCarregadaDe(appointmentId)
    setFicha(fichaSalva.note)
    setPeso(fichaSalva.weightKg != null ? String(fichaSalva.weightKg) : '')
    setAltura(fichaSalva.heightCm != null ? String(fichaSalva.heightCm) : '')
  }

  // Comparação por JSON: as seções são poucas e rasas, e o custo disto some
  // perto de perguntar campo a campo qual mudou.
  const sujo = ficha !== null && (
    JSON.stringify(ficha) !== JSON.stringify(fichaSalva?.note ?? {})
    || peso !== (fichaSalva?.weightKg != null ? String(fichaSalva.weightKg) : '')
    || altura !== (fichaSalva?.heightCm != null ? String(fichaSalva.heightCm) : '')
  )

  /**
   * AUTOSSALVA O RASCUNHO.
   *
   * Com menu lateral, trocar de seção no meio de uma evolução longa perderia o
   * texto sem aviso — na tela antiga o painel lateral abria AO LADO do editor,
   * então não havia esse risco. Em vez de barrar a navegação com um "sair sem
   * salvar?" a cada clique, a ficha passa a se gravar sozinha.
   *
   * Sem toast: gravação automática que anuncia a si mesma vira ruído a cada
   * pausa de digitação. O aviso "Alterações não salvas" no rodapé já diz o
   * estado, e some quando o rascunho sobe.
   */
  useEffect(() => {
    if (!sujo || !appointmentId || ficha === null) return
    const t = setTimeout(() => {
      salvar({
        appointmentId, note: ficha,
        weightKg: numeroOuIndefinido(peso),
        heightCm: numeroOuIndefinido(altura),
      })
    }, ESPERA_DO_RASCUNHO_MS)
    return () => clearTimeout(t)
    // `salvar` fica FORA das dependências de propósito: é recriado a cada
    // render (novo useMutation) e reagendaria o timer para sempre, gravando em
    // laço. O que deve disparar o autossalvamento é o CONTEÚDO mudar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sujo, ficha, peso, altura, appointmentId])

  /**
   * A CONSULTA JÁ COMEÇOU quando esta tela abre.
   *
   * O clique em "Iniciar atendimento" aconteceu antes, na lista de Hoje — é de
   * lá que se entra aqui. Um segundo botão de iniciar seria a MESMA ação pedida
   * duas vezes, e a tela nasceria num estado que o profissional já resolveu.
   * Mesmo precedente da tela de fisioterapia.
   *
   * REF e não estado: "qual consulta eu já disparei" não aparece na tela, então
   * guardá-lo em useState só causaria um render a mais e transformaria a própria
   * trava em dependência do efeito — que passaria a reagir à mudança que ele
   * mesmo provocou.
   */
  const jaIniciou = useRef<string | null>(null)
  useEffect(() => {
    if (!consulta || jaIniciou.current === consulta.id) return
    if (consulta.status !== 'scheduled' && consulta.status !== 'confirmed') return
    jaIniciou.current = consulta.id
    atualizarConsulta({ id: consulta.id, payload: { ...consulta, status: 'in_service' } }, {
      onError: e => toast.error(errorMessage(e, 'Não foi possível iniciar a consulta.')),
    })
    // Só o ID nas dependências: `consulta` é recriada a cada busca (mesmo id,
    // referência nova) e `atualizarConsulta`/`toast` a cada render — incluir
    // qualquer um deles repetiria o disparo em laço.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta?.id, consulta?.status])

  if (!appointmentId) {
    return (
      <EmptyState
        icon={<IconDocument />}
        title="Nenhuma consulta escolhida"
        description="Entre pela tela Hoje, na lista de pacientes, e clique em Iniciar atendimento."
      />
    )
  }

  if (isLoading || carregandoEvolucao) return <PageLoader />

  if (!consulta) {
    return (
      <EmptyState
        icon={<IconDocument />}
        title="Consulta não encontrada"
        description="Ela pode ter sido cancelada ou pertencer a outra clínica."
      />
    )
  }

  /** Peso/altura vêm de <input>: string vazia é "não medi", não zero. */
  function numeroOuIndefinido(v: string): number | undefined {
    const n = Number(v.replace(',', '.'))
    return v.trim() && Number.isFinite(n) && n > 0 ? n : undefined
  }

  /**
   * Sair com texto não salvo ainda passa pelo ConfirmDialog, mesmo com o
   * autossalvamento: entre a última tecla e a gravação existe uma janela de
   * dois segundos, e é exatamente nela que alguém fecha a tela.
   */
  function sair() {
    if (sujo) { setConfirmandoSaida(true); return }
    navigate(APP_ROUTES.TODAY)
  }

  function salvarFicha() {
    if (!appointmentId || ficha === null) return
    salvar({
      appointmentId, note: ficha,
      weightKg: numeroOuIndefinido(peso),
      heightCm: numeroOuIndefinido(altura),
    }, {
      onSuccess: () => toast.success('Ficha salva.'),
      onError: e => toast.error(errorMessage(e, 'Não foi possível salvar a ficha.')),
    })
  }

  /** Painel de cada seção. Sai daqui e não de dentro do menu para que a lista
   *  de itens continue sendo só rótulo e ícone. */
  function painelDaSecao() {
    switch (secao) {
      case CHAVE_INICIO:
        return <MobileHome itens={ITENS} ocultar={ATALHOS_DA_BARRA} onSelecionar={setSecao} />

      case 'ficha':
        return (
          <>
            <div className={styles.editor}>
              <MedicalNoteForm
                note={ficha ?? {}}
                onChangeNote={setFicha}
                peso={peso}
                altura={altura}
                onChangePeso={setPeso}
                onChangeAltura={setAltura}
              />
            </div>

            {/* O botão fica, apesar do autossalvamento: ele é a confirmação
                explícita de quem terminou de escrever e quer ver o "Ficha
                salva" antes de sair. */}
            <div className={styles.editorRodape}>
              {sujo && <span className={styles.naoSalvo}>Alterações não salvas</span>}
              <Button loading={salvando} disabled={!sujo} onClick={salvarFicha}>
                Salvar ficha
              </Button>
            </div>

            {/* O QUE FOI ESCRITO ANTES, embaixo do que se escreve agora — o
                gesto da consulta de retorno é ler o anterior enquanto se redige
                o de hoje, e por isso não virou seção separada no menu. */}
            <div className={styles.centroCabecalho}>
              <h2 className={styles.blocoTitulo}>Evoluções anteriores</h2>
            </div>
            <EvolutionTimeline consultas={anteriores ?? []} />
          </>
        )

      case 'documentos':
      case 'exames':
        return (
          <ConsultationDocuments
            foco={secao}
            appointmentId={consulta!.id}
            patientId={consulta!.patientId}
            patientName={paciente?.name ?? ''}
            patientCpf={paciente?.cpf}
            specialty={specialty}
            documentos={documentos ?? []}
          />
        )

      case 'medicacoes':
        /* Medicação tem painel PRÓPRIO: trocar, alterar dose e suspender são
           eventos com estado, não texto livre como as outras seções. */
        return (
          <MedicationsPanel
            patientId={consulta!.patientId}
            appointmentId={consulta!.id}
            professionalId={consulta!.professionalId}
            medicacoes={medicacoes ?? []}
            patientName={paciente?.name}
            patientCpf={paciente?.cpf}
            specialty={specialty}
          />
        )

      case 'sinais-vitais':
        return (
          <VitalSignsPanel
            patientId={consulta!.patientId}
            professionalId={consulta!.professionalId}
            treatmentSessionId={consulta!.id}
          />
        )

      case 'anamnese':
        /* Anamnese NÃO é anotação de texto livre: é o questionário do paciente,
           o mesmo do perfil. Reaproveitado inteiro para não existirem duas
           fichas do mesmo paciente. */
        return <Anamnesis patientId={consulta!.patientId} />

      default: {
        // As quatro seções de texto livre são o MESMO painel com `kind`
        // diferente — o rótulo muda, a mecânica não.
        const kind = {
          diagnostico: 'problems',
          'antecedentes-cirurgicos': 'surgical_history',
          'historico-familiar': 'family_history',
          risco: 'risks',
        }[secao] as 'problems' | 'surgical_history' | 'family_history' | 'risks'
        return (
          <ClinicalSectionPanel
            kind={kind}
            patientId={consulta!.patientId}
            appointmentId={consulta!.id}
            professionalId={consulta!.professionalId}
            entradas={entradas ?? []}
          />
        )
      }
    }
  }

  return (
    <div className={casca.tela}>
      <Header paciente={paciente ?? undefined} onSair={sair} />

      <div className={`${casca.corpo} ${casca.corpoComCartao}`}>
        {/* 'inicio' não existe no menu do desktop — `null` (nenhum item aceso)
         *  é a leitura correta ali. */}
        <SideNav
          itens={ITENS}
          ativo={secao === CHAVE_INICIO ? null : secao}
          onSelecionar={setSecao}
        />

        <main className={casca.principal}>{painelDaSecao()}</main>

        {/* O QUE A PESSOA TOMA E O QUE ELA TEM, sem clique. Do outro lado do
            menu: navegação à esquerda, contexto à direita, trabalho no meio. */}
        <PatientCard
          paciente={paciente ?? undefined}
          medicacoes={medicacoes ?? []}
          diagnosticos={(entradas ?? []).filter(e => e.kind === 'problems')}
        />
      </div>

      <MobileNav itens={ITENS} atalhos={ATALHOS_DA_BARRA} ativo={secao} onSelecionar={setSecao} />

      <ConfirmDialog
        open={confirmandoSaida}
        onClose={() => setConfirmandoSaida(false)}
        onConfirm={() => { setConfirmandoSaida(false); navigate(APP_ROUTES.TODAY) }}
        title="Sair sem salvar?"
        message="A ficha desta consulta tem alterações que ainda não subiram. Salvar leva um clique — o botão está no pé do formulário."
        variant="danger"
        confirmLabel="Sair sem salvar"
      />
    </div>
  )
}
