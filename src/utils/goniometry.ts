import type { GoniometryPoint, GoniometryPoints } from '@/types/domain'

/** A (segmento proximal) · vértice (a articulação medida) · C (segmento distal). */
export const GONIOMETRY_DEFAULT_POINTS: GoniometryPoints = [
  { x: 30, y: 25 },
  { x: 45, y: 55 },
  { x: 65, y: 30 },
]

/** Converte um ponto PERCENTUAL (0–100 da foto) para pixel REAL
 *  (naturalWidth/Height) — em percentual puro, uma foto retangular escala X e
 *  Y de forma diferente e a medida sairia torta; só é correta em pixel real. */
function toPx(p: GoniometryPoint, naturalSize: { w: number; h: number }) {
  return { x: (p.x / 100) * naturalSize.w, y: (p.y / 100) * naturalSize.h }
}

/** Ângulo (graus) entre os segmentos A→vértice e C→vértice. */
export function goniometryAngle(points: GoniometryPoints, naturalSize: { w: number; h: number }): number {
  const [a, vertex, c] = points.map(p => toPx(p, naturalSize))
  const angle1 = Math.atan2(a.y - vertex.y, a.x - vertex.x)
  const angle2 = Math.atan2(c.y - vertex.y, c.x - vertex.x)
  let angle = Math.abs((angle2 - angle1) * 180 / Math.PI)
  if (angle > 180) angle = 360 - angle
  return Math.round(angle * 10) / 10
}
