import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Tabs } from '@/components/Tabs/Tabs'
import { IconProfissionais } from '@/components/icons'
import { useProfissional } from '@/hooks/useProfissionais'
import { ProfileSummary } from './ProfileSummary'
import { PersonalDataCard } from './PersonalData/PersonalDataCard'
import { PersonalDataForm } from './PersonalData/PersonalDataForm'
import { CurriculumCard } from './Curriculum/CurriculumCard'
import { CurriculumForm } from './Curriculum/CurriculumForm'
import { EarningsTab } from './Earnings/EarningsTab'
import { ScheduleTab } from './Schedule/ScheduleTab'
import styles from './ProfessionalProfilePage.module.scss'

type TabKey = 'dados' | 'curriculo' | 'ganhos' | 'agenda'

const TABS = [
  { key: 'dados',     label: 'Dados pessoais' },
  { key: 'curriculo', label: 'Currículo' },
  { key: 'ganhos',    label: 'Ganhos' },
  { key: 'agenda',    label: 'Agenda' },
]

/** Perfil do profissional: card-resumo à esquerda + painel da aba ativa à
 *  direita. Cada aba mora no próprio arquivo; aqui fica só a casca e o
 *  estado de "qual aba" / "está editando". */
export function ProfessionalProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data: profissional, isLoading } = useProfissional(id ?? '')

  const [tab, setTab] = useState<TabKey>('dados')
  const [editandoDados, setEditandoDados] = useState(false)
  const [editandoCv, setEditandoCv] = useState(false)

  // Trocar de aba no meio de uma edição descarta o rascunho (o formulário
  // desmonta e nasce de novo a partir do cadastro salvo).
  function mudarTab(key: string) {
    setTab(key as TabKey)
    if (key !== 'dados') setEditandoDados(false)
    if (key !== 'curriculo') setEditandoCv(false)
  }

  function abrirEdicaoDados() {
    setEditandoCv(false)
    setEditandoDados(true)
    setTab('dados')   // a edição vive na aba de dados pessoais
  }

  function abrirEdicaoCv() {
    setEditandoDados(false)
    setEditandoCv(true)
    setTab('curriculo')
  }

  // Zona de cabeçalho compartilhada: fica no lugar em QUALQUER estado da página
  // (carregando, não encontrado, conteúdo) — o breadcrumb nunca pula.
  const cabecalho = (
    <header className={styles.topo}>
      <PageHeader title="Perfil do profissional" icon={<IconProfissionais />} />
      <Tabs tabs={TABS} active={tab} onChange={mudarTab} />
    </header>
  )

  if (isLoading) {
    return <>{cabecalho}<PageLoader /></>
  }

  if (!profissional) {
    return (
      <>
        {cabecalho}
        <EmptyState title="Profissional não encontrado" description="Verifique se o link está correto." />
      </>
    )
  }

  return (
    <>
      {cabecalho}

      <div className={styles.grid}>
        <ProfileSummary profissional={profissional} onEditar={abrirEdicaoDados} />

        {/* ── Painel da direita: conteúdo da aba ativa ── */}
        <div className={styles.painel}>
          {tab === 'dados' && (editandoDados ? (
            <PersonalDataForm profissional={profissional} onFechar={() => setEditandoDados(false)} />
          ) : (
            <PersonalDataCard profissional={profissional} onEditar={abrirEdicaoDados} />
          ))}

          {tab === 'curriculo' && (editandoCv ? (
            <CurriculumForm profissional={profissional} onFechar={() => setEditandoCv(false)} />
          ) : (
            <CurriculumCard profissional={profissional} onEditar={abrirEdicaoCv} />
          ))}

          {tab === 'ganhos' && <EarningsTab profissional={profissional} />}

          {tab === 'agenda' && <ScheduleTab profissional={profissional} />}
        </div>
      </div>
    </>
  )
}
