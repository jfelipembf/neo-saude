import { Fragment, useState } from 'react'
import type { ReactNode } from 'react'
import { IconChevronRight } from '@/components/icons'
import styles from './Table.module.scss'

export interface TableColumn<T> {
  /** Chave do dado (usada quando não há render custom). */
  key: string
  label: string
  /** Célula custom (Badge, link, formatação…). */
  render?: (row: T) => ReactNode
  /** Classe aplicada ao <th> E ao <td> da coluna — para alinhar valor à direita,
   *  fixar a largura da coluna de ações, etc. Sem ela, uma tabela com coluna de
   *  dinheiro precisava reimplementar a <table> inteira só pelo alinhamento. */
  className?: string
  /**
   * Some da tabela em telas ≤768px (mesmo corte de `@include mobile`) — CSS
   * puro (`display: none`), não uma segunda árvore de colunas condicional.
   * `colSpan` das linhas de "vazio"/detalhe continua contando TODAS as
   * colunas (inclusive as ocultas) de propósito: uma coluna com `display:none`
   * colapsa para 0px mas continua ocupando a posição no grid da tabela, então
   * o colspan cheio ainda fecha exatamente na borda das colunas visíveis —
   * testado antes de generalizar isto para as ~14 tabelas do projeto.
   *
   * Marque como básico (deixe DE FORA) só o que responde "o que é isto, quanto,
   * e o que eu faço com isso" — datas secundárias, colunas de referência e
   * detalhamento ficam para quem girar o aparelho ou abrir no desktop.
   */
  hideOnMobile?: boolean
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  /** Linha clicável (ex.: abrir perfil). */
  onRowClick?: (row: T) => void
  /** Classe extra por linha (ex.: destacar o dia em que o saldo fica negativo).
   *  Devolva undefined para as linhas sem destaque. */
  rowClassName?: (row: T) => string | undefined
  emptyMessage?: string
  /** Barra DENTRO do cartão, acima da tabela (filtros, "N por página") — modelo do perfil do paciente. */
  toolbar?: ReactNode
  /** Rodapé DENTRO do cartão, abaixo da tabela (ex.: <Pagination />). */
  footer?: ReactNode
  /** Conteúdo do detalhe expandido: adiciona a coluna da setinha e a linha
   *  expansível (modelo da tabela de pagamentos). */
  renderExpanded?: (row: T) => ReactNode
  /** Descreve a linha no aria-label do botão de expandir — sem isto o leitor de
   *  tela anuncia só "Ver detalhes", igual em todas as linhas.
   *  Ex.: row => row.description */
  expandedLabel?: (row: T) => string
}

export function Table<T>({
  columns, data, rowKey, onRowClick, rowClassName, emptyMessage = 'Nenhum registro.',
  toolbar, footer, renderExpanded, expandedLabel,
}: TableProps<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const expandable = Boolean(renderExpanded)
  const totalColumns = columns.length + (expandable ? 1 : 0)

  function toggle(id: string) {
    setExpanded(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={styles.wrapper}>
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {expandable && <th className={styles.thSeta} aria-label="Expandir" />}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={[col.className, col.hideOnMobile ? styles.hideMobile : ''].filter(Boolean).join(' ')}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td className={styles.empty} colSpan={totalColumns}>{emptyMessage}</td>
              </tr>
            )}
            {data.map(row => {
              const id = rowKey(row)
              const isOpen = expanded.has(id)
              // Sem onRowClick, a linha inteira alterna a expansão.
              const handleRowClick = onRowClick
                ? () => onRowClick(row)
                : expandable
                  ? () => toggle(id)
                  : undefined
              return (
                <Fragment key={id}>
                  <tr
                    className={[handleRowClick ? styles.clickable : '', rowClassName?.(row) ?? '']
                      .filter(Boolean).join(' ') || undefined}
                    onClick={handleRowClick}
                  >
                    {expandable && (
                      <td className={styles.tdSeta}>
                        <button
                          type="button"
                          className={`${styles.setaBtn} ${isOpen ? styles['setaBtn--aberta'] : ''}`}
                          onClick={e => { e.stopPropagation(); toggle(id) }}
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? 'Recolher' : 'Ver'} detalhes${expandedLabel ? ` de ${expandedLabel(row)}` : ''}`}
                        >
                          <IconChevronRight />
                        </button>
                      </td>
                    )}
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={[col.className, col.hideOnMobile ? styles.hideMobile : ''].filter(Boolean).join(' ')}
                      >
                        {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                      </td>
                    ))}
                  </tr>

                  {isOpen && renderExpanded && (
                    <tr className={styles.detalheRow}>
                      <td colSpan={totalColumns}>
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
