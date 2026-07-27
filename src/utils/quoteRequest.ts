/**
 * QUAIS MATERIAIS ENTRAM NO PEDIDO DE ORÇAMENTO — e, quando não dá para
 * decidir, a pergunta EXATA que falta.
 *
 * Existe por causa de uma falha real: o dentista disse "peça um orçamento ao
 * Dental Cremer" — que é um FORNECEDOR — e a ferramenta só aceitava `material`.
 * O nome do fornecedor foi parar no campo do material, o catálogo respondeu
 * "não encontrei no cadastro de materiais", e a partir daí ela girou em falso
 * por seis turnos, chutando "odontocol creme", "ortodontico", e pedindo ao
 * dentista que confirmasse a marca. Nenhum chute podia dar certo: o nome nunca
 * foi de material.
 *
 * A correção é a mesma doutrina do resto da assistente — a FERRAMENTA diz o que
 * está errado, em vez de deixar o modelo adivinhar:
 *  - nome que não é material mas bate com FORNECEDOR devolve isso dito com
 *    todas as letras, mais os materiais daquele fornecedor;
 *  - "os que estão em falta" virou um campo (`emFalta`), porque era um pedido
 *    natural que o schema simplesmente não sabia expressar.
 *
 * Só decide O QUE cotar. Quem monta e envia a mensagem é a página — aqui não há
 * efeito nenhum, e por isso dá para testar tudo.
 */

import { matchesSearch } from '@/utils/search'

export interface FornecedorDoMaterial {
  id: string
  nome: string
  whatsapp?: string
}

export interface MaterialDoCatalogo {
  id: string
  nome: string
  estoque: number
  minimo: number
  /** Vem pronto do banco (estoque <= mínimo). */
  acabando: boolean
  fornecedores: FornecedorDoMaterial[]
}

export interface PedidoDeOrcamento {
  material?: string
  fornecedor?: string
  /** "peça orçamento do que está acabando" — sem citar material nenhum. */
  emFalta?: boolean
}

export type ResolucaoDeOrcamento =
  | { ok: true; materiais: MaterialDoCatalogo[] }
  | { ok: false; erro: string }

/** Nomes de fornecedor que aparecem no catálogo, sem repetir. Sai daqui e não
 *  de uma segunda consulta: fornecedor sem material nenhum não teria o que
 *  cotar de qualquer jeito. */
function fornecedoresDoCatalogo(catalogo: MaterialDoCatalogo[]): string[] {
  const nomes = new Map<string, string>()
  for (const m of catalogo) {
    for (const f of m.fornecedores) nomes.set(f.id, f.nome)
  }
  return [...nomes.values()]
}

function listar(nomes: string[]): string {
  return nomes.join(', ')
}

export function resolverPedidoDeOrcamento(
  catalogo: MaterialDoCatalogo[],
  pedido: PedidoDeOrcamento,
): ResolucaoDeOrcamento {
  const material = pedido.material?.trim()
  const fornecedor = pedido.fornecedor?.trim()

  const doFornecedor = (m: MaterialDoCatalogo) =>
    !fornecedor || m.fornecedores.some(f => matchesSearch(f.nome, fornecedor))

  // 1) "o que está em falta" — o pedido que o schema antigo não sabia expressar.
  if (pedido.emFalta) {
    const acabando = catalogo.filter(m => m.acabando && doFornecedor(m))
    if (acabando.length === 0) {
      return {
        ok: false,
        erro: fornecedor
          ? `Nenhum material de ${fornecedor} está abaixo do mínimo.`
          : 'Nenhum material está abaixo do mínimo agora.',
      }
    }
    return { ok: true, materiais: acabando }
  }

  // 2) Material nomeado.
  if (material) {
    const exato = catalogo.filter(m => m.nome.trim().toLowerCase() === material.toLowerCase())
    const achados = exato.length ? exato : catalogo.filter(m => matchesSearch(m.nome, material))

    if (achados.length === 1) return { ok: true, materiais: achados }
    if (achados.length > 1) {
      return { ok: false, erro: `Achei mais de um: ${listar(achados.map(m => m.nome))}. Qual deles?` }
    }

    // ⚠️ O CASO QUE QUEBROU. Antes daqui o erro era só "não encontrei no
    // cadastro de materiais", e ela passava a chutar nomes de material —
    // impossível acertar, porque o que o dentista falou era um FORNECEDOR.
    const comoFornecedor = fornecedoresDoCatalogo(catalogo).filter(n => matchesSearch(n, material))
    if (comoFornecedor.length > 0) {
      const nome = comoFornecedor[0]
      const materiaisDele = catalogo.filter(m => m.fornecedores.some(f => f.nome === nome))
      const acabando = materiaisDele.filter(m => m.acabando)
      return {
        ok: false,
        erro:
          `"${material}" é um FORNECEDOR (${nome}), não um material. `
          + (materiaisDele.length
            ? `Ele fornece: ${listar(materiaisDele.map(m => m.nome))}.`
              + (acabando.length ? ` Em falta: ${listar(acabando.map(m => m.nome))}.` : '')
              + ' Pergunte qual material cotar, ou peça o que está em falta.'
            : 'Ele não tem material vinculado.'),
      }
    }

    return { ok: false, erro: `Não encontrei "${material}" no cadastro de materiais.` }
  }

  // 3) Só o fornecedor, sem material e sem "em falta" — é o "peça um orçamento
  //    ao Fulano" solto. Devolve o que ele fornece para ela perguntar qual.
  if (fornecedor) {
    const materiaisDele = catalogo.filter(doFornecedor)
    if (materiaisDele.length === 0) {
      return { ok: false, erro: `Não encontrei materiais do fornecedor "${fornecedor}".` }
    }
    const acabando = materiaisDele.filter(m => m.acabando)
    return {
      ok: false,
      erro:
        `${fornecedor} fornece: ${listar(materiaisDele.map(m => m.nome))}.`
        + (acabando.length ? ` Em falta: ${listar(acabando.map(m => m.nome))}.` : '')
        + ' Qual material cotar?',
    }
  }

  return { ok: false, erro: 'Diga o material a cotar, ou peça o orçamento do que está em falta.' }
}
