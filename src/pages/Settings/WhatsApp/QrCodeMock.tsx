import styles from './WhatsAppTab.module.scss'

const LADO = 21   // QR versão 1: 21×21 módulos

/** Hash simples e estável — o mesmo texto sempre desenha o mesmo QR. */
function embaralhar(texto: string, posicao: number) {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= posicao
  h = Math.imul(h, 16777619)
  return (h >>> 0) % 100
}

/** Os três quadrados de orientação (cantos), como num QR de verdade. */
function ehMarcador(linha: number, coluna: number) {
  const dentroDoBloco = (l: number, c: number) => {
    const dl = Math.abs(l - 3)
    const dc = Math.abs(c - 3)
    // Anel externo cheio, anel do meio vazio, centro cheio.
    return dl === 3 || dc === 3 ? true : dl <= 1 && dc <= 1
  }
  if (linha < 7 && coluna < 7) return dentroDoBloco(linha, coluna)
  if (linha < 7 && coluna >= LADO - 7) return dentroDoBloco(linha, coluna - (LADO - 7))
  if (linha >= LADO - 7 && coluna < 7) return dentroDoBloco(linha - (LADO - 7), coluna)
  return null   // fora dos marcadores
}

interface QrCodeMockProps {
  /** Texto do pareamento — muda o desenho quando o QR é renovado. */
  valor: string
}

/**
 * Desenho de QR para DEMONSTRAÇÃO — não codifica nada de verdade.
 * Feito com grid de divs (e não <svg>) porque SVG no projeto é só para ícones.
 * Ao ligar o gateway real, trocar por uma imagem/canvas do QR devolvido por ele.
 */
export function QrCodeMock({ valor }: QrCodeMockProps) {
  const modulos = Array.from({ length: LADO * LADO }, (_, i) => {
    const linha = Math.floor(i / LADO)
    const coluna = i % LADO
    const marcador = ehMarcador(linha, coluna)
    if (marcador !== null) return marcador
    // Zona de silêncio ao redor dos marcadores fica clara, como num QR real.
    if ((linha < 8 && coluna < 8) || (linha < 8 && coluna >= LADO - 8)
      || (linha >= LADO - 8 && coluna < 8)) return false
    return embaralhar(valor, i) > 48
  })

  return (
    <div className={styles.qr} role="img" aria-label="QR Code de pareamento (demonstração)">
      {modulos.map((cheio, i) => (
        <span key={i} className={cheio ? styles.qrCheio : undefined} />
      ))}
    </div>
  )
}
