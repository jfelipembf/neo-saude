import { useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Spinner } from '@/components/Spinner/Spinner'
import { useToast } from '@/components/Toast/Toast'
import { IconCheck, IconUndo, IconWhatsApp, IconX } from '@/components/icons'
import {
  useWhatsAppConnection, useConnectWhatsApp, useDisconnectWhatsApp, useRefreshWhatsAppQr,
  useSendWhatsAppTest,
} from '@/hooks/useWhatsApp'
import type { WhatsAppPairingResult } from '@/services/whatsappService'
import { displayPhone } from '@/utils/format'
import styles from './WhatsAppTab.module.scss'

function connectionError(error: unknown): string {
  const code = error instanceof Error ? error.message : ''
  if (code.includes('evolution_not_configured')) {
    return 'A Evolution API ainda não foi configurada para esta instalação.'
  }
  if (code.includes('forbidden')) {
    return 'Seu acesso não permite alterar a conexão do WhatsApp.'
  }
  if (code.includes('create_failed') || code.includes('connect_failed')) {
    return 'A Evolution API recusou a conexão. Confira o servidor e tente novamente.'
  }
  return 'Não foi possível gerar o QR Code. Tente novamente.'
}

/** O que a Edge Function aceita: 10 a 13 dígitos (com ou sem o 55). */
function digitosDoTelefone(valor: string): string {
  return valor.replace(/\D/g, '')
}

function testeError(error: unknown): string {
  const code = error instanceof Error ? error.message : ''
  if (code.includes('whatsapp_not_connected')) return 'Conecte um número antes de testar o envio.'
  if (code.includes('clinic_rate_limited')) return 'Limite de envios por minuto atingido. Espere um pouco.'
  if (code.includes('recipient_rate_limited')) return 'Esse número já recebeu testes demais nos últimos 15 minutos.'
  if (code.includes('forbidden')) return 'Seu acesso não permite enviar mensagens.'
  if (code.includes('evolution_not_configured')) return 'A Evolution API ainda não foi configurada.'
  if (code.includes('invalid_phone')) return 'A Evolution recusou esse número. Confira DDD e dígitos.'
  if (code.includes('recipient_without_whatsapp')) return 'Esse número não tem WhatsApp.'
  if (code.includes('send_failed')) {
    const detail = code.match(/send_failed(?::\s*([^]+))?/)?.[1]?.trim()
    return detail
      ? `A Evolution API recusou o envio: ${detail}`
      : 'A Evolution API recusou o envio. Confira a conexão e o número.'
  }
  // Código desconhecido NÃO vira "erro genérico": num campo que existe só para
  // diagnosticar, esconder o motivo é o pior resultado possível. Mostra o que
  // veio — é feio, mas é acionável (e o console tem a resposta inteira).
  return code
    ? `Falha no envio: ${code}`
    : 'Não foi possível enviar a mensagem de teste.'
}

/** Aba "WhatsApp": conexão real com a Evolution API por QR Code. */
export function WhatsAppTab() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [pollingSince, setPollingSince] = useState<number | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingError, setPairingError] = useState<string | null>(null)
  const [testePhone, setTestePhone] = useState('')
  const [confirmandoTeste, setConfirmandoTeste] = useState(false)
  const { data: connection, isLoading } = useWhatsAppConnection(pollingSince)
  const { mutate: connect, isPending: requestingConnection } = useConnectWhatsApp()
  const { mutate: disconnect, isPending: disconnecting } = useDisconnectWhatsApp()
  const { mutate: refreshQr, isPending: refreshing } = useRefreshWhatsAppQr()
  const { mutate: enviarTeste, isPending: enviandoTeste } = useSendWhatsAppTest()

  if (isLoading || !connection) return <PageLoader />

  const connected = connection.status === 'connected'
  const pairing = connection.status === 'connecting'
  const qrCode = connection.qrCode ?? null

  function receiveQr(result: WhatsAppPairingResult) {
    setPairingCode(result.pairingCode ?? null)
    setPairingError(null)
  }

  function beginConnection() {
    setOpen(true)
    setPollingSince(Date.now())
    setPairingCode(null)
    setPairingError(null)
    connect(undefined, {
      onSuccess: receiveQr,
      onError: error => setPairingError(connectionError(error)),
    })
  }

  function resumeConnection() {
    setOpen(true)
    setPollingSince(Date.now())
    setPairingCode(null)
    setPairingError(null)
  }

  function renewQr() {
    setPollingSince(Date.now())
    setPairingError(null)
    refreshQr(undefined, {
      onSuccess: receiveQr,
      onError: error => setPairingError(connectionError(error)),
    })
  }

  function closeModal() {
    setOpen(false)
    setPollingSince(null)
    setPairingCode(null)
    setPairingError(null)
  }

  function dispararTeste() {
    enviarTeste(testePhone, {
      onSuccess: () => {
        toast.success(`Mensagem de teste enviada para ${displayPhone(digitosDoTelefone(testePhone))}.`)
        setTestePhone('')
      },
      onError: error => toast.error(testeError(error)),
    })
  }

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
                <dd>{displayPhone(connection.phoneNumber)}</dd>
              </div>
              <div className={styles.par}>
                <dt>Conectado em</dt>
                <dd>{connection.connectedAt ?? 'Agora'}</dd>
              </div>
            </div>

            <Button
              variant="danger"
              iconLeft={<IconX />}
              loading={disconnecting}
              onClick={() => disconnect(undefined, {
                onSuccess: () => toast.success('WhatsApp desconectado.'),
                onError: () => toast.error('Não foi possível desconectar o WhatsApp.'),
              })}
            >
              Desconectar
            </Button>
          </div>
        ) : (
          <div className={styles.desconectado}>
            <div>
              <h4 className={styles.passosTitulo}>Nenhum número conectado</h4>
              <p className={styles.texto}>
                Use o WhatsApp da clínica para ler o QR Code e habilitar as mensagens automáticas.
              </p>
            </div>
            <Button
              iconLeft={<IconWhatsApp />}
              loading={requestingConnection}
              onClick={pairing ? resumeConnection : beginConnection}
            >
              {pairing ? 'Exibir QR Code' : 'Conectar WhatsApp'}
            </Button>
          </div>
        )}
      </FormSection>

      {/* Só com um número conectado: sem conexão o envio falharia de qualquer
          jeito, e um campo que só sabe dar erro é pior que campo nenhum. */}
      {connected && (
        <FormSection
          title="Testar envio"
          description="Manda uma mensagem de teste para conferir se a Evolution está entregando. O texto é fixo e não usa dados de paciente."
        >
          <div className={styles.teste}>
            <Input
              label="Número do contato"
              placeholder="(79) 99999-9999"
              hint="Com DDD. Se omitir o DDI, o 55 do Brasil é assumido pelo servidor."
              value={testePhone}
              inputMode="tel"
              autoComplete="off"
              onChange={e => setTestePhone(e.target.value)}
            />
            <Button
              iconLeft={<IconWhatsApp />}
              loading={enviandoTeste}
              disabled={digitosDoTelefone(testePhone).length < 10}
              onClick={() => setConfirmandoTeste(true)}
            >
              Enviar teste
            </Button>
          </div>
        </FormSection>
      )}

      {/* Mensagem para fora da clínica não sai sem um sim explícito. */}
      <ConfirmDialog
        open={confirmandoTeste}
        onClose={() => setConfirmandoTeste(false)}
        onConfirm={dispararTeste}
        title="Enviar mensagem de teste?"
        message={`Uma mensagem de teste será enviada por WhatsApp para ${displayPhone(digitosDoTelefone(testePhone))}.`}
        confirmLabel="Enviar"
      />

      <Modal open={open} onClose={closeModal} title="Conectar WhatsApp" size="sm">
        {connected ? (
          <div className={styles.sucesso}>
            <span className={styles.sucessoIcone}><IconCheck /></span>
            <h3>WhatsApp conectado</h3>
            <p>{displayPhone(connection.phoneNumber)} está pronto para uso.</p>
            <Button iconLeft={<IconCheck />} onClick={closeModal}>Concluir</Button>
          </div>
        ) : (
          <div className={styles.modalQr} aria-live="polite">
            {(requestingConnection || refreshing) && !qrCode && (
              <div className={styles.carregando}>
                <Spinner />
                <span>Gerando QR Code...</span>
              </div>
            )}

            {pairingError && <div className={styles.erro}>{pairingError}</div>}

            {qrCode && (
              <>
                <img
                  className={styles.qrImagem}
                  src={qrCode}
                  alt="QR Code para conectar o WhatsApp"
                />
                <ol className={styles.passos}>
                  <li>Abra o WhatsApp no celular da clínica.</li>
                  <li>Acesse <strong>Aparelhos conectados</strong>.</li>
                  <li>Toque em <strong>Conectar aparelho</strong> e leia o código.</li>
                </ol>
                {pairingCode && (
                  <p className={styles.codigo}>
                    Código de pareamento: <strong>{pairingCode}</strong>
                  </p>
                )}
              </>
            )}

            {!qrCode && !requestingConnection && !refreshing && !pairingError && (
              <p className={styles.texto}>Preparando a conexão...</p>
            )}

            <div className={styles.modalAcoes}>
              <Button
                variant="outline"
                iconLeft={<IconUndo />}
                loading={refreshing}
                onClick={renewQr}
              >
                Atualizar QR Code
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
