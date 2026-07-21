import type { ReactNode } from 'react'
import styles from './Table.module.scss'

export interface TableColumn<T> {
  /** Chave do dado (usada quando não há render custom). */
  key: string
  label: string
  /** Célula custom (Badge, link, formatação…). */
  render?: (row: T) => ReactNode
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  /** Linha clicável (ex.: abrir perfil). */
  onRowClick?: (row: T) => void
  emptyMessage?: string
  /** Barra DENTRO do cartão, acima da tabela (filtros, "N por página") — modelo do perfil do paciente. */
  toolbar?: ReactNode
  /** Rodapé DENTRO do cartão, abaixo da tabela (ex.: <Pagination />). */
  footer?: ReactNode
}

export function Table<T>({ columns, data, rowKey, onRowClick, emptyMessage = 'Nenhum registro.', toolbar, footer }: TableProps<T>) {
  return (
    <div className={styles.wrapper}>
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td className={styles.empty} colSpan={columns.length}>{emptyMessage}</td>
              </tr>
            )}
            {data.map(row => (
              <tr
                key={rowKey(row)}
                className={onRowClick ? styles.clickable : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  )
}
