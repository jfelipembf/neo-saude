/** Date → 'aaaa-mm-dd' (fuso local — evita o shift de dia do toISOString/UTC). */
export function toIsoDate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Date → 'dd/mm' (rótulos curtos de data na UI). */
export function toShortDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
