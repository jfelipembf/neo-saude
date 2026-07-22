import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Tabs } from '@/components/Tabs/Tabs'
import { IconSettings } from '@/components/icons'
import { AccountTab } from './Account/AccountTab'
import { SubscriptionTab } from './Subscription/SubscriptionTab'
import { WhatsAppTab } from './WhatsApp/WhatsAppTab'
import { AutomationTab } from './Automation/AutomationTab'
import styles from './SettingsPage.module.scss'

type TabKey = 'account' | 'subscription' | 'whatsapp' | 'automation'

const TABS = [
  { key: 'account',      label: 'Conta' },
  { key: 'subscription', label: 'Assinatura' },
  { key: 'whatsapp',   label: 'WhatsApp' },
  { key: 'automation',  label: 'Automação' },
]

/** Configurações: conta do usuário, conexão do WhatsApp e mensagens automáticas.
 *  Mesmo desenho do Administrativo — cabeçalho + abas, uma aba por arquivo. */
export function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('account')

  return (
    <>
      <header className={styles.topo}>
        <PageHeader title="Configurações" icon={<IconSettings />} />
        <Tabs tabs={TABS} active={tab} onChange={k => setTab(k as TabKey)} />
      </header>

      {tab === 'account'      && <AccountTab />}
      {tab === 'subscription' && <SubscriptionTab />}
      {tab === 'whatsapp'   && <WhatsAppTab />}
      {tab === 'automation'  && <AutomationTab />}
    </>
  )
}
