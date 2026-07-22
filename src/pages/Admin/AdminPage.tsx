import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Tabs } from '@/components/Tabs/Tabs'
import { IconAdministrativo } from '@/components/icons'
import { RoomsTab } from './Rooms/RoomsTab'
import { MaterialsTab } from './Materials/MaterialsTab'
import { CommissionsTab } from './Commissions/CommissionsTab'
import { RolesTab } from './Roles/RolesTab'
import { InsurancesTab } from './Insurances/InsurancesTab'
import styles from './AdminPage.module.scss'

type TabKey = 'salas' | 'materiais' | 'convenios' | 'comissoes' | 'cargos'

const TABS = [
  { key: 'salas',     label: 'Salas' },
  { key: 'materiais', label: 'Materiais' },
  { key: 'convenios', label: 'Convênios' },
  { key: 'comissoes', label: 'Comissões' },
  { key: 'cargos',    label: 'Cargos' },
]

/** Página Administrativo: uma rota só, com o conteúdo organizado em abas. */
export function AdminPage() {
  const [tab, setTab] = useState<TabKey>('salas')

  return (
    <>
      <header className={styles.topo}>
        <PageHeader title="Administrativo" icon={<IconAdministrativo />} />
        <Tabs tabs={TABS} active={tab} onChange={key => setTab(key as TabKey)} />
      </header>

      {tab === 'salas'     && <RoomsTab />}
      {tab === 'materiais' && <MaterialsTab />}
      {tab === 'convenios' && <InsurancesTab />}
      {tab === 'comissoes' && <CommissionsTab />}
      {tab === 'cargos'    && <RolesTab />}
    </>
  )
}
