import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Tabs } from '@/components/Tabs/Tabs'
import { IconFinance } from '@/components/icons'
import { CashTab } from './Cash/CashTab'
import { CashFlowTab } from './CashFlow/CashFlowTab'
import { PayableTab } from './Payable/PayableTab'
import { ReceivableTab } from './Receivable/ReceivableTab'
import { ReconciliationTab } from './Reconciliation/ReconciliationTab'
import { DelinquencyTab } from './Delinquency/DelinquencyTab'
import { BanksTab } from './Banks/BanksTab'
import { AcquirersTab } from './Acquirers/AcquirersTab'
import styles from './FinancePage.module.scss'

type TabKey = 'cash' | 'cashFlow' | 'payables' | 'receivables' | 'reconciliation' | 'delinquency' | 'banks' | 'acquirers'

const TABS = [
  { key: 'cash',       label: 'Caixa' },
  { key: 'cashFlow',       label: 'Fluxo de caixa' },
  { key: 'payables',       label: 'Contas a Pagar' },
  { key: 'receivables',     label: 'Contas a Receber' },
  { key: 'reconciliation', label: 'Conciliação' },
  { key: 'delinquency',    label: 'Inadimplência' },
  { key: 'banks',      label: 'Contas bancárias' },
  { key: 'acquirers', label: 'Adquirentes' },
]

export function FinancePage() {
  const [tab, setTab] = useState<TabKey>('cash')

  return (
    <>
      {/* Zona de cabeçalho: título + abas coladas (mesmo desenho do perfil do paciente). */}
      <header className={styles.topo}>
        <PageHeader title="Financeiro" icon={<IconFinance />} />
        <Tabs tabs={TABS} active={tab} onChange={k => setTab(k as TabKey)} />
      </header>

      {tab === 'cash'       && <CashTab />}
      {tab === 'cashFlow'       && <CashFlowTab />}
      {tab === 'payables'       && <PayableTab />}
      {tab === 'receivables'     && <ReceivableTab />}
      {tab === 'reconciliation' && <ReconciliationTab />}
      {tab === 'delinquency'    && <DelinquencyTab />}
      {tab === 'banks'      && <BanksTab />}
      {tab === 'acquirers' && <AcquirersTab />}
    </>
  )
}
