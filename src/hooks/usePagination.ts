import { useState } from 'react'

/**
 * Paginação client-side de listas (Tabelas): estado de página + fatia visível.
 * A lista pode encolher (busca, filtro, exclusão) — a página atual é sempre
 * ajustada para nunca cair numa página que não existe mais.
 */
export function usePagination<T>(items: T[], initialPerPage = 5) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPageState] = useState(initialPerPage)

  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const visible = items.slice((currentPage - 1) * perPage, currentPage * perPage)

  function setPerPage(n: number) {
    setPerPageState(n)
    setPage(1)
  }

  return { visible, currentPage, totalPages, perPage, total: items.length, setPage, setPerPage }
}
