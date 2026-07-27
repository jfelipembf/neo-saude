function normalizeConfirmation(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[.,!?;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const CLEAR_CONFIRMATIONS = new Set([
  'sim',
  'sim pode',
  'pode',
  'pode sim',
  'pode enviar',
  'pode mandar',
  'pode solicitar',
  'envie',
  'manda',
  'mande',
  'solicite',
  'confirmo',
  'confirmado',
  'isso',
  'isso mesmo',
  'correto',
  'ok',
  'pode fazer',
  'faca',
])

export function isClearAffirmativeConfirmation(text: string): boolean {
  return CLEAR_CONFIRMATIONS.has(normalizeConfirmation(text))
}
