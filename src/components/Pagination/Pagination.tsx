import { IconChevronEsquerda, IconChevronDireita } from '@/components/icons'
import styles from './Pagination.module.scss'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  /** Com totalItems + itemsPerPage exibe "1–5 de 12" ao lado dos controles. */
  totalItems?: number
  itemsPerPage?: number
}

/** Janela de páginas com reticências: 1 … 4 5 6 … 12 (desenho do neo). */
function getPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')

  const start = Math.max(2, current - 1)
  const end   = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('…')
  pages.push(total)

  return pages
}

export function Pagination({ page, totalPages, onChange, totalItems, itemsPerPage }: PaginationProps) {
  const pages = getPages(page, totalPages)

  const from = totalItems && itemsPerPage ? (page - 1) * itemsPerPage + 1 : null
  const to   = totalItems && itemsPerPage ? Math.min(page * itemsPerPage, totalItems) : null

  return (
    <div className={styles.wrapper}>
      {totalItems != null && from != null && to != null && (
        <span className={styles.info}>{from}–{to} de {totalItems}</span>
      )}

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <IconChevronEsquerda />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${styles.btn} ${p === page ? styles['btn--active'] : ''}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className={styles.btn}
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
        >
          <IconChevronDireita />
        </button>
      </div>
    </div>
  )
}
