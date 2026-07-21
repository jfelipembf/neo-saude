import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Tabs } from '@/components/Tabs/Tabs'
import { IconFinanceiro } from '@/components/icons'
import { CashTab } from './Cash/CashTab'
import { CashFlowTab } from './CashFlow/CashFlowTab'
import { PayableTab } from './Payable/PayableTab'
import { ReceivableTab } from './Receivable/ReceivableTab'
import { BanksTab } from './Banks/BanksTab'
import { AcquirersTab } from './Acquirers/AcquirersTab'
import styles from './FinancePage.module.scss'

type TabKey = 'caixa' | 'fluxo' | 'pagar' | 'receber' | 'bancos' | 'adquirentes'

const TABS = [
  { key: 'caixa',       label: 'Caixa' },
  { key: 'fluxo',       label: 'Fluxo de caixa' },
  { key: 'pagar',       label: 'Contas a Pagar' },
  { key: 'receber',     label: 'Contas a Receber' },
  { key: 'bancos',      label: 'Contas bancárias' },
  { key: 'adquirentes', label: 'Adquirentes' },
]

export function FinancePage() {
  const [tab, setTab] = useState<TabKey>('caixa')

  return (
    <>
      {/* Zona de cabeçalho: título + abas coladas (mesmo desenho do perfil do paciente). */}
      <header className={styles.topo}>
        <PageHeader title="Financeiro" icon={<IconFinanceiro />} />
        <Tabs tabs={TABS} active={tab} onChange={k => setTab(k as TabKey)} />
      </header>

      {tab === 'caixa'       && <CashTab />}
      {tab === 'fluxo'       && <CashFlowTab />}
      {tab === 'pagar'       && <PayableTab />}
      {tab === 'receber'     && <ReceivableTab />}
      {tab === 'bancos'      && <BanksTab />}
      {tab === 'adquirentes' && <AcquirersTab />}
    </>
  )
}
