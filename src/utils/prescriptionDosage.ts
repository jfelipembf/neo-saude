/**
 * A POSOLOGIA ESCRITA — "1 comprimido a cada 8 horas por 7 dias".
 *
 * O formulário coleta os pedaços separados (quantidade por vez, vezes ao dia,
 * duração) porque é assim que o médico pensa; o papel precisa da frase inteira,
 * porque é assim que o paciente e o farmacêutico leem. Esta função faz a ponte,
 * e é pura para caber em teste — receita com posologia errada é dano direto.
 */

export interface Posologia {
  /** Quanto por vez: "1 comprimido", "10 gotas", "5 mL". */
  dose?: string
  /** Quantas vezes ao dia. */
  vezesAoDia?: number
  /** Por quantos dias. Ausente = uso contínuo. */
  dias?: number
  /** Texto livre que substitui tudo ("se dor", "em jejum"). */
  observacao?: string
  /**
   * Não acrescentar "de uso contínuo" ao fim.
   *
   * Para quem já mostra isso de outro jeito — a lista de medicação tem um selo
   * "contínuo" ao lado do nome, e a frase repetindo vira "contínuo · 50mg, uma
   * vez ao dia, de uso contínuo".
   */
  semSufixoContinuo?: boolean
}

/** 24h dividido pelas tomadas — como se escreve em receita. */
function intervalo(vezesAoDia: number): string | null {
  if (vezesAoDia <= 0) return null
  if (vezesAoDia === 1) return 'uma vez ao dia'
  if (24 % vezesAoDia !== 0) return `${vezesAoDia} vezes ao dia`
  return `a cada ${24 / vezesAoDia} horas`
}

/**
 * Monta a frase da posologia. Partes ausentes simplesmente não aparecem — meia
 * posologia é melhor que uma frase com "undefined" no meio, e o médico vê na
 * prévia o que falta.
 */
export function posologiaPorExtenso(p: Posologia): string {
  const partes: string[] = []

  if (p.dose?.trim()) partes.push(p.dose.trim())

  const frequencia = p.vezesAoDia ? intervalo(p.vezesAoDia) : null
  if (frequencia) partes.push(frequencia)

  if (p.dias && p.dias > 0) {
    partes.push(`por ${p.dias} ${p.dias === 1 ? 'dia' : 'dias'}`)
  }

  // Sem duração e com frequência é uso contínuo — dizer isso evita o paciente
  // parar sozinho no fim da caixa. Quem já sinaliza de outro jeito desliga.
  if (!p.dias && frequencia && !p.semSufixoContinuo) partes.push('de uso contínuo')

  if (p.observacao?.trim()) partes.push(p.observacao.trim())

  return partes.join(', ')
}
