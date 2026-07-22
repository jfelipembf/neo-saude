import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Tabs } from '@/components/Tabs/Tabs'
import { IconConfiguracoes } from '@/components/icons'
import { AccountTab } from './Account/AccountTab'
import { SubscriptionTab } from './Subscription/SubscriptionTab'
import { WhatsAppTab } from './WhatsApp/WhatsAppTab'
import { AutomationTab } from './Automation/AutomationTab'
import styles from './SettingsPage.module.scss'

type TabKey = 'conta' | 'assinatura' | 'whatsapp' | 'automacao'

const TABS = [
  { key: 'conta',      label: 'Conta' },
  { key: 'assinatura', label: 'Assinatura' },
  { key: 'whatsapp',   label: 'WhatsApp' },
  { key: 'automacao',  label: 'Automação' },
]

/** Configurações: conta do usuário, conexão do WhatsApp e mensagens automáticas.
 *  Mesmo desenho do Administrativo — cabeçalho + abas, uma aba por arquivo. */
export function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('conta')

  return (
    <>
      <header className={styles.topo}>
        <PageHeader title="Configurações" icon={<IconConfiguracoes />} />
        <Tabs tabs={TABS} active={tab} onChange={k => setTab(k as TabKey)} />
      </header>

      {tab === 'conta'      && <AccountTab />}
      {tab === 'assinatura' && <SubscriptionTab />}
      {tab === 'whatsapp'   && <WhatsAppTab />}
      {tab === 'automacao'  && <AutomationTab />}
    </>
  )
}
