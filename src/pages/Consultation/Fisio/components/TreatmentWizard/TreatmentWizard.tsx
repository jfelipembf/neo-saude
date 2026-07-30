import { useRef } from 'react'
import { Button } from '@/components/Button/Button'
import { IconChevronLeft } from '@/components/icons'
import { Wizard } from '../../../Components/Wizard/Wizard'
import type { WizardStep } from '../../../Components/Wizard/Wizard'
import { useClinicalEntries } from '@/hooks/useClinicalEntries'
import { KINDS_DO_TRATAMENTO } from '@/services/clinicalEntriesService'
import { Anamnesis } from '../../../Components/Anamnesis/Anamnesis'
import type { AnamnesisFormHandle } from '@/pages/Patients/Profile/Anamnesis/AnamnesisForm'
import { Diagnosis } from '../Diagnosis/Diagnosis'
import { PatientTestsPanel } from '@/pages/Patients/Profile/Tests/PatientTestsPanel'
import type { PatientTestsHandle } from '@/pages/Patients/Profile/Tests/PatientTestsPanel'
import { BodyCompositionPanel } from '../BodyCompositionPanel/BodyCompositionPanel'
import type { BodyCompositionHandle } from '../BodyCompositionPanel/BodyCompositionPanel'
import { TreatmentNotes } from '../TreatmentNotes/TreatmentNotes'
import type { TreatmentNotesHandle } from '../TreatmentNotes/TreatmentNotes'
import type { CarePlan } from '@/services/carePlansService'
import styles from './TreatmentWizard.module.scss'

interface TreatmentWizardProps {
  plano: CarePlan
  patientId: string
  appointmentId: string
  professionalId?: string
  onConcluir: () => void
  /**
   * Sai do roteiro SEM exigir que as quatro etapas estejam feitas — volta ao
   * cartão. Cada etapa já grava por conta própria ao clicar em Salvar, então
   * sair no meio não perde nada; só devolve a tela ao resumo.
   */
  onVoltar: () => void
}

const ETAPAS_PENDENTES = [
  { key: 'medidas', label: 'Medidas' },
]

/**
 * O ROTEIRO DE ABERTURA do tratamento, já na tela — não num modal.
 *
 * `plano` é o CARE_PLAN DE VERDADE, já gravado — não mais um objeto local. É o
 * que permite recortar diagnóstico e testes por `carePlanId`: sem um id real,
 * não haveria por que filtrar.
 *
 * A ordem não é arbitrária: sem diagnóstico não há o que a anamnese detalhe, e
 * sem os dois não se sabe qual teste aplicar.
 */
export function TreatmentWizard({
  plano, patientId, appointmentId, professionalId, onConcluir, onVoltar,
}: TreatmentWizardProps) {
  const { data: entradas } = useClinicalEntries(patientId)

  // O DIAGNÓSTICO É DO TRATAMENTO, NÃO DA PESSOA.
  //
  // O banco já carimba `care_plan_id` em `diagnosis`/`problems` na gravação
  // (gatilho `tg_carimba_plano`); o que faltava era a LEITURA filtrar por ele.
  // Os demais kinds (antecedente cirúrgico, histórico familiar, medicação,
  // risco) atravessam tratamentos de propósito — por isso o filtro só peneira
  // os dois kinds de `KINDS_DO_TRATAMENTO`, e deixa o resto passar sempre.
  const entradasVisiveis = (entradas ?? []).filter(
    e => !KINDS_DO_TRATAMENTO.includes(e.kind) || e.carePlanId === plano.id,
  )

  // O formulário da anamnese e o painel de testes não têm botão próprio aqui:
  // quem grava é o "Salvar" do roteiro, por estes refs.
  const anamnese = useRef<AnamnesisFormHandle>(null)
  const testes = useRef<PatientTestsHandle>(null)
  const medidas = useRef<BodyCompositionHandle>(null)
  const notas = useRef<TreatmentNotesHandle>(null)

  const passos: WizardStep[] = [
    {
      key: 'diagnostico',
      label: 'Diagnóstico',
      // O painel de diagnóstico grava cada registro no próprio formulário,
      // então não sobra nada para o wizard gravar aqui. O gancho existe para
      // o botão fazer o ciclo Salvar → Salvo → Avançar.
      salvar: () => {},
      conteudo: (
        <Diagnosis
          patientId={patientId}
          appointmentId={appointmentId}
          professionalId={professionalId}
          entradas={entradasVisiveis}
        />
      ),
    },
    {
      key: 'anamnese',
      label: 'Anamnese',
      // GRAVAÇÃO DE VERDADE: o botão do roteiro chama o formulário. Se falhar,
      // o erro sobe e o Wizard mantém a pessoa na etapa — que é a razão de
      // salvar e avançar serem dois cliques.
      salvar: async () => {
        if (!anamnese.current) throw new Error('O formulário de anamnese ainda não está pronto.')
        await anamnese.current.salvar()
      },
      conteudo: <Anamnesis patientId={patientId} sempreAberta ref={anamnese} />,
    },
    {
      key: 'testes',
      label: 'Testes',
      // GRAVAÇÃO DE VERDADE: o botão do roteiro fecha o resultado que estiver
      // aberto. Sem formulário aberto não há pendência — aplicar teste é
      // opcional na sessão, e exigir um só para poder avançar faria inventar
      // resultado.
      salvar: async () => {
        if (!testes.current) throw new Error('O painel de testes ainda não está pronto.')
        await testes.current.salvar()
      },
      // carePlanId recorta o histórico exibido a ESTE tratamento — sem isto o
      // mesmo sintoma do diagnóstico (resultado antigo aparecendo aqui) se
      // repetiria nos testes.
      conteudo: <PatientTestsPanel patientId={patientId} semAcoes carePlanId={plano.id} ref={testes} />,
    },
    ...ETAPAS_PENDENTES.map(e => ({
      ...e,
      salvar: async () => {
        if (!medidas.current) throw new Error('O painel de avaliação ainda não está pronto.')
        await medidas.current.salvar()
      },
      conteudo: (
        <BodyCompositionPanel
          patientId={patientId}
          professionalId={professionalId}
          semAcoes
          ref={medidas}
        />
      ),
    })),
    {
      key: 'observacoes',
      label: 'Observações',
      // ÚLTIMA etapa, de propósito: texto livre só depois de diagnóstico,
      // anamnese, testes e medidas terem o lugar estruturado deles — aqui
      // entra só o que sobrou.
      salvar: async () => {
        if (!notas.current) throw new Error('O campo de observações ainda não está pronto.')
        await notas.current.salvar()
      },
      conteudo: (
        <TreatmentNotes
          patientId={patientId}
          planId={plano.id}
          valorInicial={plano.observacaoAbertura}
          ref={notas}
        />
      ),
    },
  ]

  return (
    <section className={styles.raiz}>
      <header className={styles.cabecalho}>
        {/* Ghost, não outline: é saída, não uma ação do roteiro — não deve
            competir visualmente com Voltar/Avançar do rodapé, que são essas. */}
        <Button variant="ghost" size="sm" iconLeft={<IconChevronLeft />} onClick={onVoltar}>
          Voltar ao tratamento
        </Button>
        <h2 className={styles.titulo}>{plano.titulo ?? 'Tratamento'}</h2>
        <span className={styles.resumo}>
          Início {plano.inicio}
          {plano.sessoesPrevistas != null && ` · ${plano.sessoesPrevistas} sessões previstas`}
        </span>
      </header>

      <Wizard passos={passos} rotuloConcluir="Concluir abertura" onConcluir={onConcluir} />
    </section>
  )
}
