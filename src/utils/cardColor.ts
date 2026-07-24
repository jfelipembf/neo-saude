// Máscara aplicada sobre a cor no CSS (--grade-card-scrim em _themes.scss) — o
// contraste do texto é decidido sobre a cor JÁ mascarada. Mantenha em sincronia.
// Compartilhado por todo card da grade da Agenda (consulta e turma) que
// pinta o fundo na cor do profissional.
const SCRIM = {
  dark:  { r: 13, g: 21, b: 18, a: 0.35 },
  light: { r: 255, g: 255, b: 255, a: 0.38 },
} as const

/** Luminância percebida (BT.601, 0..1) da cor do card APÓS a máscara do tema —
 *  decide se o texto sobre o card sai claro ou escuro. */
export function maskedLuminance(color: string | undefined, theme: 'dark' | 'light'): number {
  const m = (color ?? '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return 0   // cor desconhecida → assume escura (texto claro)
  const h = m[1].length === 3 ? [...m[1]].map(c => c + c).join('') : m[1]
  const n = parseInt(h, 16)
  const s = SCRIM[theme]
  const r = ((n >> 16) & 255) * (1 - s.a) + s.r * s.a
  const g = ((n >> 8) & 255) * (1 - s.a) + s.g * s.a
  const b = (n & 255) * (1 - s.a) + s.b * s.a
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
