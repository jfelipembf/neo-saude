export const MESSAGE_CONFIRMATION_TTL_MS = 2 * 60_000

export interface PendingMessageConfirmation {
  fingerprint: string
  expiresAt: number
}

function normalizeMessage(message: string): string {
  return message.trim().replace(/\s+/g, ' ')
}

export function messageConfirmationFingerprint(
  recipientIds: string[],
  message: string,
): string {
  return `${[...new Set(recipientIds)].sort().join(',')}:${normalizeMessage(message)}`
}

export function pendingMessageConfirmation(
  recipientIds: string[],
  message: string,
  now = Date.now(),
): PendingMessageConfirmation {
  return {
    fingerprint: messageConfirmationFingerprint(recipientIds, message),
    expiresAt: now + MESSAGE_CONFIRMATION_TTL_MS,
  }
}

export function matchesPendingMessage(
  pending: PendingMessageConfirmation | null,
  recipientIds: string[],
  message: string,
  now = Date.now(),
): boolean {
  return Boolean(
    pending &&
    pending.expiresAt >= now &&
    pending.fingerprint === messageConfirmationFingerprint(recipientIds, message),
  )
}
