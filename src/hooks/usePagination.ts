import { useState } from 'react'

/**
 * Paginação client-side de listas (Tabelas): estado de página + fatia visível.
 * A lista pode encolher (busca, filtro, exclusão) — a página atual é sempre
 * ajustada para nunca cair numa página que não existe mais.
 */
export function usePagination<T>(itens: T[], porPaginaInicial = 5) {
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(porPaginaInicial)

  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = itens.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

  function mudarPorPagina(n: number) {
    setPorPagina(n)
    setPagina(1)
  }

  return { visiveis, paginaAtual, totalPaginas, porPagina, total: itens.length, setPagina, mudarPorPagina }
}
