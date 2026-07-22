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

/** 'aaaa-mm-dd' → Date LOCAL (new Date(iso) interpretaria como UTC e o dia
 *  da semana escorregaria no fuso do Brasil). */
export function localDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Date → 'dd/mm/aaaa' (formato das datas do domínio). */
export function toShortDateWithYear(d: Date) {
  return `${toShortDate(d)}/${d.getFullYear()}`
}

/** 'dd/mm/aaaa' → Date local (para comparar vencimentos). */
export function parseBrDate(br: string) {
  const [day, month, year] = br.split('/').map(Number)
  return new Date(year, month - 1, day)
}

/** Soma dias corridos a uma data — usado para prever a data de repasse
 *  (data da venda + D+N dias da adquirente). */
export function addDays(d: Date, days: number) {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

/** Soma meses SEM transbordar: 31/01 + 1 mês → 28/02, não 03/03 (vencimento
 *  de parcela nunca deve pular para o mês seguinte). */
export function addMonths(d: Date, months: number) {
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d.getDate(), lastDay))
  return target
}
