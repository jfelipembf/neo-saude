/**
 * AGRUPA OS ACHADOS POR TIPO, não por dente.
 *
 * A coluna listava um bloco por dente, todos com o mesmo peso visual. Com
 * aparelho na arcada inteira isso virava "Aparelho ortodôntico: Bracket"
 * repetido dezesseis vezes — dezesseis blocos para uma informação só.
 *
 * O dentista não pensa dente a dente; pensa "onde tem cárie?", "quais estão
 * com aparelho?". Agrupado, a mesma coluna responde isso de relance:
 * "Aparelho — 11 a 18, 21 a 28".
 *
 * O resumo clínico vem PRONTO do motor, com os achados de um dente separados
 * por " · " (ver splitTitle na página). Aqui só se divide e se reagrupa — nada
 * de espelhar nome de achado, senão a lista sai de sincronia com o motor a cada
 * achado novo.
 */

export interface ToothNoteInput {
  tooth: number
  /** Resumo do motor: "Restauração de amálgama · Aparelho ortodôntico: Bracket" */
  clinical: string
  /** Anotação livre, se houver. */
  text: string
}

export interface AchadoAgrupado {
  /** O achado como o motor escreve. */
  achado: string
  dentes: number[]
  /** "11 a 18, 21 a 28" — faixas contíguas colapsadas. */
  resumo: string
}

export interface NotaLivre {
  tooth: number
  text: string
}

const SEPARADOR = ' · '

/**
 * Colapsa sequência em faixa: [11,12,13,14,17] → "11 a 14, 17".
 *
 * Contíguo é o número seguinte E o mesmo quadrante — 18 e 21 são vizinhos na
 * boca mas quadrantes diferentes, e "18 a 21" não quer dizer nada para um
 * dentista.
 */
export function resumirDentes(dentes: number[]): string {
  const ordenados = [...new Set(dentes)].sort((a, b) => a - b)
  if (ordenados.length === 0) return ''

  const faixas: string[] = []
  let inicio = ordenados[0]
  let anterior = ordenados[0]

  const fecha = () => {
    if (inicio === anterior) faixas.push(String(inicio))
    // Dois números seguidos ficam melhores separados que como faixa.
    else if (anterior - inicio === 1) faixas.push(`${inicio}, ${anterior}`)
    else faixas.push(`${inicio} a ${anterior}`)
  }

  for (const d of ordenados.slice(1)) {
    const mesmoQuadrante = Math.floor(d / 10) === Math.floor(anterior / 10)
    if (d === anterior + 1 && mesmoQuadrante) { anterior = d; continue }
    fecha()
    inicio = d
    anterior = d
  }
  fecha()
  return faixas.join(', ')
}

/** Achados agrupados, do mais frequente para o menos — o que domina a boca primeiro. */
export function agruparAchados(notes: ToothNoteInput[]): AchadoAgrupado[] {
  const porAchado = new Map<string, number[]>()

  for (const n of notes) {
    for (const parte of n.clinical.split(SEPARADOR)) {
      const achado = parte.trim()
      if (!achado) continue
      const lista = porAchado.get(achado) ?? []
      lista.push(n.tooth)
      porAchado.set(achado, lista)
    }
  }

  return [...porAchado.entries()]
    .map(([achado, dentes]) => ({ achado, dentes, resumo: resumirDentes(dentes) }))
    .sort((a, b) => b.dentes.length - a.dentes.length || a.achado.localeCompare(b.achado))
}

/**
 * As anotações livres ficam SEPARADAS dos achados.
 *
 * São de natureza diferente: achado é estruturado e se agrupa; anotação é uma
 * frase sobre aquele dente e some se agrupada. Misturadas, era impossível
 * distinguir o que estava desenhado do que era só texto.
 */
export function notasLivres(notes: ToothNoteInput[]): NotaLivre[] {
  return notes
    .filter(n => n.text.trim())
    .map(n => ({ tooth: n.tooth, text: n.text.trim() }))
    .sort((a, b) => a.tooth - b.tooth)
}
