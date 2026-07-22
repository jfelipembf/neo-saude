import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { FormSection } from '@/components/FormSection/FormSection'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useToast } from '@/components/Toast/useToast'
import { IconCheck, IconX } from '@/components/icons'
import {
  useConexaoWhatsApp, useConectarWhatsApp, useDesconectarWhatsApp, useRenovarQrWhatsApp,
} from '@/hooks/useWhatsApp'
import { QrCodeMock } from './QrCodeMock'
import styles from './WhatsAppTab.module.scss'

/** Aba "WhatsApp": estado da conexão e pareamento por QR.
 *  DEMONSTRAÇÃO — nenhuma sessão real é aberta (ver whatsappService). */
export function WhatsAppTab() {
  const toast = useToast()
  const { data: conexao, isLoading } = useConexaoWhatsApp()
  const { mutate: conectar, isPending: conectando } = useConectarWhatsApp()
  const { mutate: desconectar, isPending: desconectando } = useDesconectarWhatsApp()
  const { mutate: renovarQr, isPending: renovando } = useRenovarQrWhatsApp()

  if (isLoading || !conexao) return <PageLoader />

  const conectado = conexao.status === 'conectado'

  return (
    <div className={styles.coluna}>
      <FormSection
        title="Conexão"
        description="O número conectado é o remetente das mensagens automáticas."
        actions={<Badge status={conexao.status} />}
      >
        {conectado ? (
          <div className={styles.conectado}>
            <div className={styles.dados}>
              <div className={styles.par}>
                <dt>Número</dt>
                <dd>{conexao.numero}</dd>
              </div>
              <div className={styles.par}>
                <dt>Conectado em</dt>
                <dd>{conexao.conectadoEm}</dd>
              </div>
            </div>

            <Button
              variant="danger"
              iconLeft={<IconX />}
              loading={desconectando}
              onClick={() => desconectar(undefined, {
                onSuccess: () => toast.success('WhatsApp desconectado.'),
              })}
            >
              Desconectar
            </Button>
          </div>
        ) : (
          <div className={styles.pareamento}>
            <QrCodeMock valor={conexao.qrCode ?? 'neo-saude'} />

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
                  loading={conectando}
                  onClick={() => conectar(undefined, {
                    onSuccess: () => toast.success('WhatsApp conectado!'),
                  })}
                >
                  Simular pareamento
                </Button>
                <Button
                  variant="outline"
                  loading={renovando}
                  onClick={() => renovarQr()}
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
