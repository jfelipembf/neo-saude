import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Tabs } from '@/components/Tabs/Tabs'
import { IconAdmin } from '@/components/icons'
import { RoomsTab } from './Rooms/RoomsTab'
import { MaterialsTab } from './Materials/MaterialsTab'
import { CommissionsTab } from './Commissions/CommissionsTab'
import { RolesTab } from './Roles/RolesTab'
import { CollaboratorsTab } from './Collaborators/CollaboratorsTab'
import { InsurancesTab } from './Insurances/InsurancesTab'
import { GoalsTab } from './Goals/GoalsTab'
// Cadastros financeiros (não são operação diária — por isso moram aqui, não no
// Financeiro): contas bancárias onde o dinheiro entra e adquirentes de cartão.
import { BanksTab } from './Banks/BanksTab'
import { AcquirersTab } from './Acquirers/AcquirersTab'
import styles from './AdminPage.module.scss'

type TabKey = 'rooms' | 'materials' | 'insurances' | 'commissions' | 'roles' | 'collaborators' | 'goals' | 'banks' | 'acquirers'

const TABS = [
  { key: 'rooms',     label: 'Salas' },
  { key: 'materials', label: 'Materiais' },
  { key: 'insurances', label: 'Convênios' },
  { key: 'commissions', label: 'Comissões' },
  { key: 'roles',    label: 'Cargos' },
  { key: 'collaborators', label: 'Colaboradores' },
  { key: 'goals',    label: 'Metas' },
  { key: 'banks',    label: 'Contas bancárias' },
  { key: 'acquirers', label: 'Adquirentes' },
]

/** Página Administrativo: uma rota só, com o conteúdo organizado em abas. */
export function AdminPage() {
  const [tab, setTab] = useState<TabKey>('rooms')

  return (
    <>
      <header className={styles.topo}>
        <PageHeader title="Administrativo" icon={<IconAdmin />} />
        <Tabs tabs={TABS} active={tab} onChange={key => setTab(key as TabKey)} />
      </header>

      {tab === 'rooms'     && <RoomsTab />}
      {tab === 'materials' && <MaterialsTab />}
      {tab === 'insurances' && <InsurancesTab />}
      {tab === 'commissions' && <CommissionsTab />}
      {tab === 'roles'    && <RolesTab />}
      {tab === 'collaborators' && <CollaboratorsTab />}
      {tab === 'goals'    && <GoalsTab />}
      {tab === 'banks'    && <BanksTab />}
      {tab === 'acquirers' && <AcquirersTab />}
    </>
  )
}
