/**
 * QUANTAS VEZES UM SERVIÇO É COBRADO NUM ORÇAMENTO.
 *
 * Restauração no 26 e no 27 são DOIS procedimentos; uma moldagem que pega os
 * dois é UM. O catálogo (`OdontoProcedure`) não sabe a diferença — guarda só
 * nome e preço —, e no editor manual quem decide é uma caixa que o dentista
 * marca item a item. Por voz, quem decide é ele falando.
 *
 * Pura e testada de propósito: a ferramenta de voz montava o item com o preço
 * fixo, e "restauração nos dois" saía cobrando uma. Não é arredondamento — é
 * metade do valor do trabalho, num papel que o paciente leva e aceita.
 */

/**
 * @param dentes  quantos dentes o dentista citou para este serviço
 * @param porDente `true`/`false` quando ele disse; `undefined` quando não disse
 */
export function vezesCobradas(dentes: number, porDente?: boolean): number {
  // Um dente (ou nenhum) nunca multiplica, mesmo com `porDente: true` — não há
  // o que multiplicar, e devolver 0 zeraria o item.
  if (dentes <= 1) return 1

  /**
   * SEM RESPOSTA, MULTIPLICA. É o caso mais comum (restauração, extração,
   * canal) e erra para o lado CORRIGÍVEL: o dentista vê "× 2" na prévia e
   * desfaz antes de confirmar. O erro contrário — cobrar um quando eram dois —
   * sai da clínica sem ninguém notar.
   */
  return porDente ?? true ? dentes : 1
}
