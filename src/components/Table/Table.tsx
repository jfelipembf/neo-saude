import { Fragment, useState } from 'react'
import type { ReactNode } from 'react'
import { IconChevronDireita } from '@/components/icons'
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
  /** Conteúdo do detalhe expandido: adiciona a coluna da setinha e a linha
   *  expansível (modelo da tabela de pagamentos). */
  renderExpanded?: (row: T) => ReactNode
}

export function Table<T>({
  columns, data, rowKey, onRowClick, emptyMessage = 'Nenhum registro.',
  toolbar, footer, renderExpanded,
}: TableProps<T>) {
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set())

  const expansivel = Boolean(renderExpanded)
  const totalColunas = columns.length + (expansivel ? 1 : 0)

  function alternar(id: string) {
    setExpandidas(atual => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  return (
    <div className={styles.wrapper}>
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {expansivel && <th className={styles.thSeta} aria-label="Expandir" />}
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td className={styles.empty} colSpan={totalColunas}>{emptyMessage}</td>
              </tr>
            )}
            {data.map(row => {
              const id = rowKey(row)
              const aberta = expandidas.has(id)
              // Sem onRowClick, a linha inteira alterna a expansão.
              const aoClicarLinha = onRowClick
                ? () => onRowClick(row)
                : expansivel
                  ? () => alternar(id)
                  : undefined
              return (
                <Fragment key={id}>
                  <tr
                    className={aoClicarLinha ? styles.clickable : undefined}
                    onClick={aoClicarLinha}
                  >
                    {expansivel && (
                      <td className={styles.tdSeta}>
                        <button
                          type="button"
                          className={`${styles.setaBtn} ${aberta ? styles['setaBtn--aberta'] : ''}`}
                          onClick={e => { e.stopPropagation(); alternar(id) }}
                          aria-expanded={aberta}
                          aria-label={aberta ? 'Recolher detalhes' : 'Ver detalhes'}
                        >
                          <IconChevronDireita />
                        </button>
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key}>
                        {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                      </td>
                    ))}
                  </tr>

                  {aberta && renderExpanded && (
                    <tr className={styles.detalheRow}>
                      <td colSpan={totalColunas}>
                        <div className={styles.detalhe}>{renderExpanded(row)}</div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  )
}
