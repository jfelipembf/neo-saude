import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useToast } from '@/components/Toast/Toast'
import { IconDocument, IconX } from '@/components/icons'
import { APP_ROUTES } from '@/constants'
import { useSession } from '@/context/SessionProvider'
import { usePatient } from '@/hooks/usePatients'
import { usePatientPrescriptions } from '@/hooks/usePrescriptions'
import { useScheduleAppointments } from '@/hooks/useSchedule'
import { usePatientConsultations } from '@/hooks/useMedicalRecord'
import { useConsultationChart, useSaveConsultationChart } from '@/hooks/useMedicalNote'
import type { MedicalNote } from '@/services/medicalNoteService'
import { useClinicalEntries } from '@/hooks/useClinicalEntries'
import { usePatientMedications } from '@/hooks/useMedications'
import { useUpdateScheduleAppointment } from '@/hooks/useSchedule'
import { errorMessage } from '@/utils/errors'
import { toIsoDate } from '@/utils/date'
import { ConsultationDocuments } from './ConsultationDocuments'
import { ConsultationHeader } from './ConsultationHeader'
import { ConsultationPatientCard } from './ConsultationPatientCard'
import { MedicalNoteForm } from './MedicalNoteForm'
import { Anamnesis } from './Components/Anamnesis/Anamnesis'
import { ClinicalSectionPanel } from './ClinicalSectionPanel'
import { EvolutionTimeline } from './EvolutionTimeline'
import { MedicationsPanel } from './MedicationsPanel'
import { CLINICAL_SECTIONS } from './clinicalSections'
import type { ClinicalEntryKind } from '@/services/clinicalEntriesService'
import styles from './ConsultationPage.module.scss'

/** O que está aberto na direita: uma seção clínica, os documentos, ou nada. */
type PainelAberto = ClinicalEntryKind | 'documentos' | 'exames' | null

/** O título do painel aberto — fonte única para os dois tipos. */
function tituloDoPainel(painel: Exclude<PainelAberto, null>): string {
  if (painel === 'documentos') return 'Documentos'
  if (painel === 'exames') return 'Exames'
  return CLINICAL_SECTIONS.find(s => s.kind === painel)?.label ?? ''
}

/**
 * TELA DE ATENDIMENTO — tela cheia, um paciente por vez.
 *
 * Irmã do AppLayout, não filha (ver AppRouter.tsx): sem Header nem navegação,
 * porque durante a consulta a tela inteira é o atendimento. Sair é um gesto
 * explícito, não um clique de menu no meio de um texto não salvo.
 *
 * Três colunas, cada uma com uma pergunta:
 *  · esquerda — QUEM é a pessoa e o que já foi feito nela
 *  · centro   — o que está sendo escrito AGORA
 *  · direita  — o que sai desta consulta em papel
 *
 * O cabeçalho repete o mesmo desenho da página de impressão (logo + clínica),
 * de propósito: o médico vê na tela o mesmo carimbo que vai sair no documento.
 */
export function ConsultationPage() {
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
  // Histórico das CONSULTAS, não do odontograma — ver listPatientConsultations.
  const { data: anteriores } = usePatientConsultations(consulta?.patientId ?? null, appointmentId ?? undefined)
  const { data: documentos } = usePatientPrescriptions(consulta?.patientId ?? '')
  const { data: fichaSalva, isLoading: carregandoEvolucao } = useConsultationChart(appointmentId)
  const { mutate: salvar, isPending: salvando } = useSaveConsultationChart()
  const { mutate: atualizarConsulta, isPending: mudandoStatus } = useUpdateScheduleAppointment()

  /**
   * Quando esta consulta começou — só nesta aba.
   *
   * A SITUAÇÃO da consulta (`in_service` → `completed`) vai para o banco e
   * sobrevive a tudo; o cronômetro, não. Guardar o instante exato exigiria
   * coluna nova, e o número que importa clinicamente já está no par
   * agendado/concluído. Se a página recarregar no meio, a consulta continua
   * em atendimento e o cronômetro recomeça — está dito na tela.
   */
  const [inicio, setInicio] = useState<Date | null>(null)

  /**
   * QUAL PAINEL ESTÁ ABERTO À DIREITA.
   *
   * A direita deixou de ser coluna fixa de documentos e virou contextual: só
   * uma coisa por vez, escolhida na barra acima do editor. Fechada, o editor
   * ocupa a largura toda — que é o estado em que o médico passa a maior parte
   * da consulta.
   */
  const [painel, setPainel] = useState<PainelAberto>(null)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const { data: entradas } = useClinicalEntries(consulta?.patientId ?? null)
  const { data: medicacoes } = usePatientMedications(consulta?.patientId ?? null)

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

  // Comparação por JSON: as seções são poucas e rasas, e o custo disto some
  // perto de perguntar campo a campo qual mudou.
  const sujo = ficha !== null && (
    JSON.stringify(ficha) !== JSON.stringify(fichaSalva?.note ?? {})
    || peso !== (fichaSalva?.weightKg != null ? String(fichaSalva.weightKg) : '')
    || altura !== (fichaSalva?.heightCm != null ? String(fichaSalva.heightCm) : '')
  )
  // A lista vem ordenada por data desc — o primeiro de cada tipo é o vigente.
  const emUso = (medicacoes ?? []).filter(m => !m.endedOn)
  // A SITUAÇÃO manda, não o cronômetro: recarregar a página perde o relógio,
  // mas a consulta continua em atendimento — e é ela que decide qual botão sai.
  const emAtendimento = consulta.status === 'in_service'

  /**
   * Sair com texto não salvo passa pelo ConfirmDialog do projeto, e não pelo
   * `window.confirm`: o nativo não é estilizável, aparece fora da tela cheia e
   * quebra o desenho justamente no momento em que o médico está prestes a
   * perder a evolução digitada.
   */
  function sair() {
    if (sujo) { setConfirmandoSaida(true); return }
    navigate(APP_ROUTES.TODAY)
  }

  function iniciarConsulta() {
    if (!consulta) return
    setInicio(new Date())
    atualizarConsulta({ id: consulta.id, payload: { ...consulta, status: 'in_service' } }, {
      onError: e => toast.error(errorMessage(e, 'Não foi possível iniciar a consulta.')),
    })
  }

  function finalizarConsulta() {
    if (!consulta) return
    // Salva a evolução JUNTO: finalizar com texto não gravado seria perder o
    // trabalho da consulta no gesto que a encerra.
    if (sujo && ficha !== null && appointmentId) {
      salvar({
        appointmentId, note: ficha,
        weightKg: numeroOuIndefinido(peso),
        heightCm: numeroOuIndefinido(altura),
      })
    }
    atualizarConsulta({ id: consulta.id, payload: { ...consulta, status: 'completed' } }, {
      onSuccess: () => {
        setInicio(null)
        toast.success('Consulta finalizada.')
        navigate(APP_ROUTES.TODAY)
      },
      onError: e => toast.error(errorMessage(e, 'Não foi possível finalizar a consulta.')),
    })
  }

  /** Peso/altura vêm de <input>: string vazia é "não medi", não zero. */
  function numeroOuIndefinido(v: string): number | undefined {
    const n = Number(v.replace(',', '.'))
    return v.trim() && Number.isFinite(n) && n > 0 ? n : undefined
  }

  function salvarEvolucao() {
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

  return (
    <div className={styles.tela}>
      <ConsultationHeader
        emAtendimento={emAtendimento}
        ocupado={mudandoStatus}
        onIniciar={iniciarConsulta}
        onFinalizar={finalizarConsulta}
      />

      <div className={`${styles.corpo} ${painel === null ? styles.semPainel : ''}`}>
        {/* ── ESQUERDA: quem é a pessoa, e o que já foi feito nela ── */}
        <aside className={styles.colunaEsquerda}>
          <ConsultationPatientCard
            paciente={paciente ?? undefined}
            medicacoes={medicacoes ?? []}
            inicio={inicio}
            onSair={sair}
          />
        </aside>

        {/* ── CENTRO: o que está sendo escrito agora ── */}
        <main className={styles.centro}>
          <div className={styles.centroCabecalho}>
            <h2 className={styles.blocoTitulo}>Evolução da consulta</h2>
          </div>

          {/* A BARRA. Cada botão abre o painel da direita; clicar no que já
              está aberto fecha, e o editor volta a ocupar a largura toda.
              O contador diz quantos registros a seção já tem — sem ele, saber
              se há histórico exigiria abrir uma por uma. */}
          <div className={styles.barraSecoes}>
            {CLINICAL_SECTIONS.map(s => {
              // Medicação conta as EM USO (tabela própria); as demais contam
              // registros. Sem esta exceção o botão mostraria zero mesmo com
              // remédio ativo, porque a contagem olhava a tabela errada.
              const quantos = s.kind === 'medications'
                ? emUso.length
                : (entradas ?? []).filter(e => e.kind === s.kind).length
              return (
                <button
                  key={s.kind}
                  type="button"
                  className={`${styles.botaoSecao} ${painel === s.kind ? styles.botaoSecaoAtivo : ''}`}
                  aria-pressed={painel === s.kind}
                  onClick={() => setPainel(p => (p === s.kind ? null : s.kind))}
                >
                  {s.label}
                  {quantos > 0 && <span className={styles.contadorSecao}>{quantos}</span>}
                </button>
              )
            })}
            {/* Dois botões, não um: entregar documento e pedir exame são
                momentos diferentes da consulta. */}
            <button
              type="button"
              className={`${styles.botaoSecao} ${painel === 'documentos' ? styles.botaoSecaoAtivo : ''}`}
              aria-pressed={painel === 'documentos'}
              onClick={() => setPainel(p => (p === 'documentos' ? null : 'documentos'))}
            >
              Documentos
            </button>
            <button
              type="button"
              className={`${styles.botaoSecao} ${painel === 'exames' ? styles.botaoSecaoAtivo : ''}`}
              aria-pressed={painel === 'exames'}
              onClick={() => setPainel(p => (p === 'exames' ? null : 'exames'))}
            >
              Exames
            </button>
          </div>
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

          {/* Segundo botão no PÉ do editor: quem escreve uma evolução longa
              termina embaixo, e subir até o topo para salvar é o caminho para
              esquecer de salvar. */}
          <div className={styles.editorRodape}>
            {sujo && <span className={styles.naoSalvo}>Alterações não salvas</span>}
            <Button loading={salvando} disabled={!sujo} onClick={salvarEvolucao}>
              Salvar ficha
            </Button>
          </div>

          {/* O QUE FOI ESCRITO ANTES, embaixo do que se escreve agora.
              A coluna esquerda serve para se ORIENTAR (data e uma linha); aqui
              o médico LÊ a evolução anterior enquanto redige a de hoje, que é
              o gesto da consulta de retorno. */}
          <div className={styles.centroCabecalho}>
            <h2 className={styles.blocoTitulo}>Evoluções anteriores</h2>
          </div>
          <EvolutionTimeline consultas={anteriores ?? []} />
        </main>

        {/* ── DIREITA: contextual — só o que foi pedido na barra ── */}
        {painel !== null && (
          <aside className={styles.colunaDireita}>
            {/* Cabeçalho do painel: título e fechar na MESMA linha, separados
                do conteúdo por uma régua. O título vive aqui e não dentro de
                cada painel — assim os dois tipos (seção clínica e documentos)
                abrem exatamente com o mesmo desenho. */}
            <header className={styles.painelCabecalho}>
              <h2 className={styles.painelTitulo}>{tituloDoPainel(painel)}</h2>
              <Button
                variant="ghost" size="sm" iconLeft={<IconX />}
                aria-label="Fechar painel"
                onClick={() => setPainel(null)}
              />
            </header>

            {painel === 'documentos' || painel === 'exames' ? (
              <ConsultationDocuments
                foco={painel}
                appointmentId={consulta.id}
                patientId={consulta.patientId}
                patientName={paciente?.name ?? ''}
                patientCpf={paciente?.cpf}
                specialty={specialty}
                documentos={documentos ?? []}
              />
            ) : painel === 'anamnesis' ? (
              /* Anamnese NÃO é anotação de texto livre: é o questionário do
                 paciente, o mesmo do perfil. Reaproveitado inteiro para não
                 existirem duas fichas do mesmo paciente. */
              <Anamnesis patientId={consulta.patientId} />
            ) : painel === 'medications' ? (
              /* Medicação tem painel PRÓPRIO: trocar, alterar dose e suspender
                 são eventos com estado, não texto livre como as outras seções. */
              <MedicationsPanel
                patientId={consulta.patientId}
                appointmentId={consulta.id}
                professionalId={consulta.professionalId}
                medicacoes={medicacoes ?? []}
              />
            ) : (
              <ClinicalSectionPanel
                kind={painel}
                patientId={consulta.patientId}
                appointmentId={consulta.id}
                professionalId={consulta.professionalId}
                entradas={entradas ?? []}
              />
            )}
          </aside>
        )}
      </div>

      <ConfirmDialog
        open={confirmandoSaida}
        onClose={() => setConfirmandoSaida(false)}
        onConfirm={() => { setConfirmandoSaida(false); navigate(APP_ROUTES.TODAY) }}
        title="Sair sem salvar?"
        message="A ficha desta consulta ainda não foi salva e será perdida. Salvar leva um clique — o botão está no pé do formulário."
        variant="danger"
        confirmLabel="Sair sem salvar"
      />
    </div>
  )
}
