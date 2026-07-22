import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Tabs } from '@/components/Tabs/Tabs'
import { IconProfessionals } from '@/components/icons'
import { useProfessional } from '@/hooks/useProfessionals'
import { ProfileSummary } from './ProfileSummary'
import { PersonalDataCard } from './PersonalData/PersonalDataCard'
import { PersonalDataForm } from './PersonalData/PersonalDataForm'
import { CurriculumCard } from './Curriculum/CurriculumCard'
import { CurriculumForm } from './Curriculum/CurriculumForm'
import { EarningsTab } from './Earnings/EarningsTab'
import { ScheduleTab } from './Schedule/ScheduleTab'
import styles from './ProfessionalProfilePage.module.scss'

type TabKey = 'personal' | 'curriculum' | 'earnings' | 'schedule'

const TABS = [
  { key: 'personal',     label: 'Dados pessoais' },
  { key: 'curriculum', label: 'Currículo' },
  { key: 'earnings',    label: 'Ganhos' },
  { key: 'schedule',    label: 'Agenda' },
]

/** Perfil do profissional: card-resumo à esquerda + painel da aba ativa à
 *  direita. Cada aba mora no próprio arquivo; aqui fica só a casca e o
 *  estado de "qual aba" / "está editando". */
export function ProfessionalProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data: professional, isLoading } = useProfessional(id ?? '')

  const [tab, setTab] = useState<TabKey>('personal')
  const [editingData, setEditingData] = useState(false)
  const [editingCv, setEditingCv] = useState(false)

  // Trocar de aba no meio de uma edição descarta o rascunho (o formulário
  // desmonta e nasce de novo a partir do cadastro salvo).
  function changeTab(key: string) {
    setTab(key as TabKey)
    if (key !== 'personal') setEditingData(false)
    if (key !== 'curriculum') setEditingCv(false)
  }

  function openDataEdit() {
    setEditingCv(false)
    setEditingData(true)
    setTab('personal')   // a edição vive na aba de dados pessoais
  }

  function openCvEdit() {
    setEditingData(false)
    setEditingCv(true)
    setTab('curriculum')
  }

  // Zona de cabeçalho compartilhada: fica no lugar em QUALQUER estado da página
  // (carregando, não encontrado, conteúdo) — o breadcrumb nunca pula.
  const headerZone = (
    <header className={styles.topo}>
      <PageHeader title="Perfil do profissional" icon={<IconProfessionals />} />
      <Tabs tabs={TABS} active={tab} onChange={changeTab} />
    </header>
  )

  if (isLoading) {
    return <>{headerZone}<PageLoader /></>
  }

  if (!professional) {
    return (
      <>
        {headerZone}
        <EmptyState title="Profissional não encontrado" description="Verifique se o link está correto." />
      </>
    )
  }

  return (
    <>
      {headerZone}

      <div className={styles.grid}>
        <ProfileSummary professional={professional} onEdit={openDataEdit} />

        {/* ── Painel da direita: conteúdo da aba ativa ── */}
        <div className={styles.painel}>
          {tab === 'personal' && (editingData ? (
            <PersonalDataForm professional={professional} onClose={() => setEditingData(false)} />
          ) : (
            <PersonalDataCard professional={professional} onEdit={openDataEdit} />
          ))}

          {tab === 'curriculum' && (editingCv ? (
            <CurriculumForm professional={professional} onClose={() => setEditingCv(false)} />
          ) : (
            <CurriculumCard professional={professional} onEdit={openCvEdit} />
          ))}

          {tab === 'earnings' && <EarningsTab professional={professional} />}

          {tab === 'schedule' && <ScheduleTab professional={professional} />}
        </div>
      </div>
    </>
  )
}
