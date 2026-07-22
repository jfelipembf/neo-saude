import styles from './WhatsAppTab.module.scss'

const SIDE = 21   // QR versão 1: 21×21 módulos

/** Hash simples e estável — o mesmo texto sempre desenha o mesmo QR. */
function scramble(text: string, position: number) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= position
  h = Math.imul(h, 16777619)
  return (h >>> 0) % 100
}

/** Os três quadrados de orientação (cantos), como num QR de verdade. */
function isMarker(row: number, col: number) {
  const insideBlock = (l: number, c: number) => {
    const dl = Math.abs(l - 3)
    const dc = Math.abs(c - 3)
    // Anel externo cheio, anel do meio vazio, centro cheio.
    return dl === 3 || dc === 3 ? true : dl <= 1 && dc <= 1
  }
  if (row < 7 && col < 7) return insideBlock(row, col)
  if (row < 7 && col >= SIDE - 7) return insideBlock(row, col - (SIDE - 7))
  if (row >= SIDE - 7 && col < 7) return insideBlock(row - (SIDE - 7), col)
  return null   // fora dos marcadores
}

interface QrCodeMockProps {
  /** Texto do pareamento — muda o desenho quando o QR é renovado. */
  value: string
}

/**
 * Desenho de QR para DEMONSTRAÇÃO — não codifica nada de verdade.
 * Feito com grid de divs (e não <svg>) porque SVG no projeto é só para ícones.
 * Ao ligar o gateway real, trocar por uma imagem/canvas do QR devolvido por ele.
 */
export function QrCodeMock({ value }: QrCodeMockProps) {
  const modules = Array.from({ length: SIDE * SIDE }, (_, i) => {
    const row = Math.floor(i / SIDE)
    const col = i % SIDE
    const marker = isMarker(row, col)
    if (marker !== null) return marker
    // Zona de silêncio ao redor dos marcadores fica clara, como num QR real.
    if ((row < 8 && col < 8) || (row < 8 && col >= SIDE - 8)
      || (row >= SIDE - 8 && col < 8)) return false
    return scramble(value, i) > 48
  })

  return (
    <div className={styles.qr} role="img" aria-label="QR Code de pareamento (demonstração)">
      {modules.map((filled, i) => (
        <span key={i} className={filled ? styles.qrCheio : undefined} />
      ))}
    </div>
  )
}
