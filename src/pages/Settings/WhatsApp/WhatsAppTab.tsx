import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { FormSection } from '@/components/FormSection/FormSection'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useToast } from '@/components/Toast/useToast'
import { IconCheck, IconX } from '@/components/icons'
import {
  useWhatsAppConnection, useConnectWhatsApp, useDisconnectWhatsApp, useRefreshWhatsAppQr,
} from '@/hooks/useWhatsApp'
import { QrCodeMock } from './QrCodeMock'
import styles from './WhatsAppTab.module.scss'

/** Aba "WhatsApp": estado da conexão e pareamento por QR.
 *  DEMONSTRAÇÃO — nenhuma sessão real é aberta (ver whatsappService). */
export function WhatsAppTab() {
  const toast = useToast()
  const { data: connection, isLoading } = useWhatsAppConnection()
  const { mutate: connect, isPending: connecting } = useConnectWhatsApp()
  const { mutate: disconnect, isPending: disconnecting } = useDisconnectWhatsApp()
  const { mutate: refreshQr, isPending: refreshing } = useRefreshWhatsAppQr()

  if (isLoading || !connection) return <PageLoader />

  const connected = connection.status === 'connected'

  return (
    <div className={styles.coluna}>
      <FormSection
        title="Conexão"
        description="O número conectado é o remetente das mensagens automáticas."
        actions={<Badge status={connection.status} />}
      >
        {connected ? (
          <div className={styles.conectado}>
            <div className={styles.dados}>
              <div className={styles.par}>
                <dt>Número</dt>
                <dd>{connection.phoneNumber}</dd>
              </div>
              <div className={styles.par}>
                <dt>Conectado em</dt>
                <dd>{connection.connectedAt}</dd>
              </div>
            </div>

            <Button
              variant="danger"
              iconLeft={<IconX />}
              loading={disconnecting}
              onClick={() => disconnect(undefined, {
                onSuccess: () => toast.success('WhatsApp desconectado.'),
              })}
            >
              Desconectar
            </Button>
          </div>
        ) : (
          <div className={styles.pareamento}>
            <QrCodeMock value={connection.qrCode ?? 'neo-saude'} />

            <div className={styles.instrucoes}>
              <h4 className={styles.passosTitulo}>Como conectar</h4>
              <ol className={styles.passos}>
                <li>Abra o WhatsApp no celular da clínica.</li>
                <li>Toque em <strong>Mais opções</strong> → <strong>Aparelhos conectados</strong>.</li>
                <li>Toque em <strong>Conectar aparelho</strong> e aponte para este código.</li>
              </ol>

              <p className={styles.aviso}>
                Demonstração: nenhuma sessão real é aberta. O botão abaixo simula a
                leitura do código pelo aparelho.
              </p>

              <div className={styles.acoes}>
                <Button
                  iconLeft={<IconCheck />}
                  loading={connecting}
                  onClick={() => connect(undefined, {
                    onSuccess: () => toast.success('WhatsApp conectado!'),
                  })}
                >
                  Simular pareamento
                </Button>
                <Button
                  variant="outline"
                  loading={refreshing}
                  onClick={() => refreshQr()}
                >
                  Gerar novo código
                </Button>
              </div>
            </div>
          </div>
        )}
      </FormSection>
    </div>
  )
}
