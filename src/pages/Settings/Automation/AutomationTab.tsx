import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { useAutomations, useSaveAutomation } from '@/hooks/useWhatsApp'
import { useWhatsAppConnection } from '@/hooks/useWhatsApp'
import type { WhatsAppAutomation } from '@/types/domain'
import { AUTOMATION_CATALOG, COMMON_VARIABLES } from './automations'
import type { AutomationCatalog } from './automations'
import styles from './AutomationTab.module.scss'

/** Aba "Automação": mensagens disparadas por evento no WhatsApp conectado. */
export function AutomationTab() {
  const { data: automations, isLoading } = useAutomations()
  const { data: connection } = useWhatsAppConnection()

  if (isLoading || !automations) return <PageLoader />

  const disconnected = connection?.status !== 'connected'

  return (
    <div className={styles.coluna}>
      {/* Automação sem número pareado não sai do lugar — avisa antes. */}
      {disconnected && (
        <p className={styles.aviso}>
          O WhatsApp não está conectado. As automações ficam salvas, mas só passam a
          enviar depois do pareamento na aba <strong>WhatsApp</strong>.
        </p>
      )}

      {AUTOMATION_CATALOG.map(item => {
        // Sem registro salvo ainda (clínica nova / sem conexão): o card aparece
        // do mesmo jeito, num padrão inativo e vazio pronto para configurar.
        const current = automations.find(a => a.trigger === item.trigger)
          ?? { trigger: item.trigger, status: 'inactive' as const, message: '', sendTime: undefined }
        return <AutomationCard key={item.trigger} catalog={item} automation={current} />
      })}
    </div>
  )
}

interface AutomationCardProps {
  catalog: AutomationCatalog
  automation: WhatsAppAutomation
}

/** Um gatilho: liga/desliga, horário (quando agendado) e texto da mensagem. */
function AutomationCard({ catalog, automation }: AutomationCardProps) {
  const toast = useToast()
  const { mutate: save, isPending: saving } = useSaveAutomation()

  const [message, setMessage] = useState(automation.message)
  const [sendTime, setSendTime] = useState(automation.sendTime ?? '')

  const active = automation.status === 'active'
  // Só habilita "Salvar" quando algo mudou de fato.
  const changed = message !== automation.message || sendTime !== (automation.sendTime ?? '')

  function persist(payload: Partial<WhatsAppAutomation>, successMessage: string) {
    save(
      {
        trigger: catalog.trigger,
        payload: {
          status: automation.status,
          message,
          sendTime: catalog.scheduled ? sendTime || undefined : undefined,
          ...payload,
        },
      },
      { onSuccess: () => toast.success(successMessage) },
    )
  }

  return (
    <FormSection
      title={catalog.title}
      description={catalog.description}
      actions={
        <Toggle
          label={active ? 'Ativa' : 'Inativa'}
          checked={active}
          onChange={v => persist(
            { status: v ? 'active' : 'inactive' },
            v ? 'Automação ativada!' : 'Automação desativada.',
          )}
        />
      }
    >
      <div className={styles.corpo}>
        {catalog.scheduled && (
          <div className={styles.horario}>
            <Input
              label="Horário de envio"
              type="time"
              value={sendTime}
              onChange={e => setSendTime(e.target.value)}
              hint="Disparo diário nesse horário."
            />
          </div>
        )}

        <Textarea
          label="Mensagem"
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
        />

        <div className={styles.rodape}>
          <div className={styles.variaveis}>
            <span className={styles.variaveisLabel}>Variáveis:</span>
            {[...COMMON_VARIABLES, ...catalog.variables].map(v => (
              <code key={v} className={styles.variavel}>{v}</code>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={!changed}
            loading={saving}
            onClick={() => persist({}, 'Mensagem salva!')}
          >
            Salvar
          </Button>
        </div>
      </div>
    </FormSection>
  )
}
