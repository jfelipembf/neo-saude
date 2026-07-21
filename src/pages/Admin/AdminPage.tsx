import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Tabs } from '@/components/Tabs/Tabs'
import { IconAdministrativo } from '@/components/icons'
import { ClinicTab } from './Clinic/ClinicTab'
import { RoomsTab } from './Rooms/RoomsTab'
import { MaterialsTab } from './Materials/MaterialsTab'
import styles from './AdminPage.module.scss'

type TabKey = 'consultorio' | 'salas' | 'materiais'

const TABS = [
  { key: 'consultorio', label: 'Dados do consultório' },
  { key: 'salas',       label: 'Salas' },
  { key: 'materiais',   label: 'Materiais' },
]

/** Página Administrativo: uma rota só, com o conteúdo organizado em abas. */
export function AdminPage() {
  const [tab, setTab] = useState<TabKey>('consultorio')

  return (
    <>
      <header className={styles.topo}>
        <PageHeader title="Administrativo" icon={<IconAdministrativo />} />
        <Tabs tabs={TABS} active={tab} onChange={key => setTab(key as TabKey)} />
      </header>

      {tab === 'consultorio' && <ClinicTab />}
      {tab === 'salas'       && <RoomsTab />}
      {tab === 'materiais'   && <MaterialsTab />}
    </>
  )
}
