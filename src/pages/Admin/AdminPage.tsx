import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Tabs } from '@/components/Tabs/Tabs'
import { IconAdmin } from '@/components/icons'
import { RoomsTab } from './Rooms/RoomsTab'
import { MaterialsTab } from './Materials/MaterialsTab'
import { ServicesTab } from './Services/ServicesTab'
import { TestsTab } from './Tests/TestsTab'
import { CommissionsTab } from './Commissions/CommissionsTab'
import { RolesTab } from './Roles/RolesTab'
import { CollaboratorsTab } from './Collaborators/CollaboratorsTab'
import { InsurancesTab } from './Insurances/InsurancesTab'
import { GoalsTab } from './Goals/GoalsTab'
import { AuditTab } from './Audit/AuditTab'
import { useSession } from '@/context/SessionProvider'
import { appliesToSpecialty } from '@/constants/specialty'
import type { ClinicSpecialty } from '@/types/domain'
import styles from './AdminPage.module.scss'

type TabKey = 'rooms' | 'materials' | 'services' | 'tests' | 'insurances' | 'commissions' | 'roles' | 'collaborators' | 'goals' | 'audit'

// `specialties`/`excludeSpecialties` filtram a aba por ramo (ver constants/specialty).
// Serviços/Contratos não se aplicam à odontologia (que trabalha por procedimentos
// e orçamentos) → escondida no ramo dentistry.
const TABS: { key: TabKey; label: string; specialties?: ClinicSpecialty[]; excludeSpecialties?: ClinicSpecialty[] }[] = [
  { key: 'rooms',     label: 'Salas' },
  // Materiais (insumos/estoque) não se aplica à fisioterapia → escondido nesse ramo.
  { key: 'materials', label: 'Materiais', excludeSpecialties: ['physiotherapy'] },
  { key: 'services',  label: 'Serviços', excludeSpecialties: ['dentistry'] },
  // Testes/escalas de avaliação — específico de fisioterapia.
  { key: 'tests',     label: 'Testes', specialties: ['physiotherapy'] },
  { key: 'insurances', label: 'Convênios' },
  { key: 'commissions', label: 'Comissões' },
  { key: 'roles',    label: 'Cargos' },
  { key: 'collaborators', label: 'Colaboradores' },
  { key: 'goals',    label: 'Metas' },
  { key: 'audit',    label: 'Auditoria' },
]

/** Página Administrativo: uma rota só, com o conteúdo organizado em abas. */
export function AdminPage() {
  const [tab, setTab] = useState<TabKey>('rooms')
  const { specialty } = useSession()
  const visibleTabs = TABS.filter(t => appliesToSpecialty(specialty, t))

  return (
    <>
      <header className={styles.topo}>
        <PageHeader title="Administrativo" icon={<IconAdmin />} />
        <Tabs tabs={visibleTabs} active={tab} onChange={key => setTab(key as TabKey)} />
      </header>

      {tab === 'rooms'     && <RoomsTab />}
      {tab === 'materials' && <MaterialsTab />}
      {tab === 'services'  && <ServicesTab />}
      {tab === 'tests'     && <TestsTab />}
      {tab === 'insurances' && <InsurancesTab />}
      {tab === 'commissions' && <CommissionsTab />}
      {tab === 'roles'    && <RolesTab />}
      {tab === 'collaborators' && <CollaboratorsTab />}
      {tab === 'goals'    && <GoalsTab />}
      {tab === 'audit'    && <AuditTab />}
    </>
  )
}
