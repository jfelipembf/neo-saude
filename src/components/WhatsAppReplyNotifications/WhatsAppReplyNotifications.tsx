import { createPortal } from 'react-dom'
import { IconWhatsApp, IconX } from '@/components/icons'
import {
  useDismissWhatsAppInboundMessage, useWhatsAppInboundMessages,
} from '@/hooks/useWhatsAppInboundMessages'
import { displayPhone } from '@/utils/format'
import styles from './WhatsAppReplyNotifications.module.scss'

/**
 * NOTIFICAÇÃO DE RESPOSTA NO WHATSAPP — persistente, nunca some sozinha.
 *
 * Monta uma vez por sessão autenticada (ver AuthGuard.tsx — é o único lugar
 * que cobre tanto o AppLayout quanto a tela cheia do odontograma, que é rota
 * IRMÃ dele). Mesmo formato de CibellyGlobal: decide sozinho se tem algo pra
 * mostrar, `null` quando não tem — quem monta não precisa saber.
 *
 * Canto SUPERIOR direito de propósito: o Toast já ocupa o inferior direito
 * (ver Toast.module.scss) e os dois nunca deveriam competir pelo mesmo canto.
 */
export function WhatsAppReplyNotifications() {
  const { data: mensagens } = useWhatsAppInboundMessages()
  const descartar = useDismissWhatsAppInboundMessage()

  if (!mensagens?.length) return null

  return createPortal(
    <div className={styles.stack} role="status" aria-live="polite">
      {mensagens.map(m => (
        <div key={m.id} className={styles.cartao}>
          <IconWhatsApp />
          <div className={styles.corpo}>
            <span className={styles.remetente}>{m.senderName ?? displayPhone(m.senderPhone)}</span>
            <p className={styles.texto}>{m.body}</p>
          </div>
          <button
            type="button"
            className={styles.fechar}
            onClick={() => descartar.mutate(m.id)}
            aria-label="Fechar"
          >
            <IconX />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
