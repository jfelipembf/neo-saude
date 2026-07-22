import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Tabs } from '@/components/Tabs/Tabs'
import { IconFinance } from '@/components/icons'
import { useUnbilledSessions } from '@/hooks/useFinance'
import { CashFlowTab } from './CashFlow/CashFlowTab'
import { PayableTab } from './Payable/PayableTab'
import { ReceivableTab } from './Receivable/ReceivableTab'
import { ReconciliationTab } from './Reconciliation/ReconciliationTab'
import { DelinquencyTab } from './Delinquency/DelinquencyTab'
import styles from './FinancePage.module.scss'

// "A faturar" vive DENTRO de Contas a Receber (tudo que é dinheiro a entrar num
// lugar só — desenho enxuto validado contra o modelo da EVO). Contas bancárias
// e Adquirentes são CADASTRO, não operação diária: moraram para o Administrativo.
// NÃO existe aba "Caixa" (sessão abrir/fechar): nada gravava movimento nela, e a
// referência do segmento (Simples Dental) resolve conferência diária com
// relatório sobre os lançamentos — não com ritual de sessão (isso é para
// operação com várias recepcionistas no dinheiro físico, caso Feegow).
type TabKey = 'cashFlow' | 'payables' | 'receivables' | 'reconciliation' | 'delinquency'

export function FinancePage() {
  const [tab, setTab] = useState<TabKey>('cashFlow')
  // O contador vive AQUI, e não dentro da aba: uma pendência que só aparece
  // depois de você clicar na aba não avisa ninguém. É a diferença entre uma
  // rede de segurança e um relatório que ninguém abre.
  const { data: unbilled } = useUnbilledSessions()

  const tabs = [
    { key: 'cashFlow',       label: 'Fluxo de caixa' },
    { key: 'payables',       label: 'Contas a Pagar' },
    { key: 'receivables',     label: 'Contas a Receber', badge: unbilled?.length ?? 0 },
    { key: 'reconciliation', label: 'Conciliação' },
    { key: 'delinquency',    label: 'Inadimplência' },
  ]

  return (
    <>
      {/* Zona de cabeçalho: título + abas coladas (mesmo desenho do perfil do paciente). */}
      <header className={styles.topo}>
        <PageHeader title="Financeiro" icon={<IconFinance />} />
        <Tabs tabs={tabs} active={tab} onChange={k => setTab(k as TabKey)} />
      </header>

      {tab === 'cashFlow'       && <CashFlowTab />}
      {tab === 'payables'       && <PayableTab />}
      {tab === 'receivables'     && <ReceivableTab />}
      {tab === 'reconciliation' && <ReconciliationTab />}
      {tab === 'delinquency'    && <DelinquencyTab />}
    </>
  )
}
