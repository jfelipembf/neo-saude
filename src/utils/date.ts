import { MONTHS_LONG } from '@/constants/dates'

/** Date → 'aaaa-mm-dd' (fuso local — evita o shift de dia do toISOString/UTC). */
export function toIsoDate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Date → 'aaaa-mm' (chave do mês de referência dos gráficos). */
export function toIsoMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
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

/** 'dd/mm/aaaa' → 'aaaa-mm-dd' para o banco (null/vazio → null). */
export function brToIsoDate(br: string | null | undefined): string | null {
  if (!br) return null
  const d = parseBrDate(br)
  return Number.isNaN(d.getTime()) ? null : toIsoDate(d)
}

/** 'aaaa-mm-dd' (banco) → 'dd/mm/aaaa' do domínio (null/vazio → undefined). */
export function isoToBrDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined
  return toShortDateWithYear(localDate(iso))
}

/** '07:30' + 30min → '08:00' (hora do fim a partir da duração; vira ao passar
 *  da meia-noite). */
export function addMinutes(start: string, minutes: number) {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
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

/** Dias corridos entre duas datas (b - a), arredondado pra baixo — usado no
 *  alerta de "lead parado há X dias" no Kanban. */
export function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000)
}

/**
 * Data por extenso para o fecho de documento assinado:
 * '26/07/2026' → '26 de julho de 2026'.
 *
 * Recebe dd/mm/aaaa (o formato que circula no app) e devolve '' se não bater —
 * documento com data quebrada é pior que documento sem data.
 */
export function formatLongDate(br: string | undefined | null) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((br ?? '').trim())
  if (!m) return ''
  const [, dia, mes, ano] = m
  const nome = MONTHS_LONG[Number(mes) - 1]
  if (!nome) return ''
  return `${Number(dia)} de ${nome.toLowerCase()} de ${ano}`
}
