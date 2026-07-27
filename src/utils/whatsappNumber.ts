/**
 * Converte telefone brasileiro para o formato internacional exigido pelo
 * WhatsApp/Evolution: DDI 55 + DDD + número, somente dígitos.
 *
 * Aceita cadastro local, número já internacional e os formatos nacionais com
 * zero de tronco ou código de operadora.
 */
export function normalizeBrazilianWhatsappNumber(
  value: string | null | undefined,
): string | null {
  let digits = String(value ?? '').split('@')[0].replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)

  if (digits.startsWith('55')) {
    const national = digits.slice(2)
    return national.length === 10 || national.length === 11 ? digits : null
  }

  if (digits.startsWith('0')) {
    const withoutTrunk = digits.slice(1)
    if (withoutTrunk.length === 10 || withoutTrunk.length === 11) {
      digits = withoutTrunk
    } else {
      const withoutCarrier = digits.slice(3)
      if (withoutCarrier.length === 10 || withoutCarrier.length === 11) {
        digits = withoutCarrier
      }
    }
  }

  return digits.length === 10 || digits.length === 11
    ? `55${digits}`
    : null
}
