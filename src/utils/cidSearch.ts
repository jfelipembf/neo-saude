/**
 * O QUE O MÉDICO DIGITA × O QUE A TABELA GUARDA.
 *
 * O código na tabela do DATASUS é `B349`. Ninguém digita assim: escreve
 * "CID B34", "cid-10 b34.9", "B34.9". Todos querem a mesma linha, e sem
 * normalizar a busca devolve vazio para um código que EXISTE — que é a pior
 * resposta possível, porque parece que o CID não está cadastrado.
 */

/** Sobra "CID", "CID-10", "CID10" no começo — é rótulo, não parte do código. */
const PREFIXO = /^cid[\s-]*(10)?[\s-]*/i

/**
 * Devolve o termo pronto para as duas buscas: por código e por descrição.
 *
 * `codigo` vem sem ponto e em maiúsculas (como está gravado); `texto` mantém o
 * que foi digitado, sem o rótulo "CID", para a busca por doença.
 */
export function normalizarBuscaCid(termo: string): { codigo: string; texto: string } {
  const limpo = termo.replace(PREFIXO, '').trim()
  return {
    codigo: limpo.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
    texto: limpo,
  }
}

/** Parece um código (letra seguida de dígitos)? Decide se vale buscar por código. */
export function pareceCodigoCid(codigo: string): boolean {
  return /^[A-Z]\d/.test(codigo)
}
