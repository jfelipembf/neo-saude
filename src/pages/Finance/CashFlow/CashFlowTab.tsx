import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useFluxoCaixa } from '@/hooks/useFinanceiro'
import { usePagination } from '@/hooks/usePagination'
import { formatarReais } from '@/utils/format'
import type { CashFlowDay } from '@/types/domain'
import shared from '../shared/finance.module.scss'

/** Linha da tabela: o dia do serviço + os acumulados calculados aqui. */
type LinhaFluxo = CashFlowDay & { liquido: number; projetado: number }

/** Aba "Fluxo de caixa": projeção diária cumulativa a partir do saldo atual. */
export function CashFlowTab() {
  const { data, isLoading } = useFluxoCaixa()

  const saldoBase = data?.saldoBase ?? 0
  const dias = data?.dias ?? []

  // Saldo projetado cumulativo a partir do saldo base.
  const linhas: LinhaFluxo[] = []
  let acumulado = saldoBase
  for (const d of dias) {
    const liquido = d.entradas - d.saidas
    acumulado += liquido
    linhas.push({ ...d, liquido, projetado: acumulado })
  }

  const pag = usePagination(linhas)

  if (isLoading) return <PageLoader />

  const totalEntradas = dias.reduce((s, d) => s + d.entradas, 0)
  const totalSaidas   = dias.reduce((s, d) => s + d.saidas, 0)
  const projetado     = linhas.length ? linhas[linhas.length - 1].projetado : saldoBase

  const columns: TableColumn<LinhaFluxo>[] = [
    {
      key: 'data', label: 'Data',
      render: d => (
        <span className={shared.celulaForte}>
          {d.data} <span className={shared.contagem}>({d.lancamentos})</span>
        </span>
      ),
    },
    { key: 'entradas', label: 'Entradas', render: d => d.entradas > 0 ? <span className={shared.pos}>{formatarReais(d.entradas)}</span> : <span className={shared.traco}>—</span> },
    { key: 'saidas',   label: 'Saídas',   render: d => d.saidas > 0 ? <span className={shared.neg}>{formatarReais(d.saidas)}</span> : <span className={shared.traco}>—</span> },
    {
      key: 'liquido', label: 'Líquido',
      render: d => (
        <span className={`${shared.valor} ${d.liquido >= 0 ? shared.pos : shared.neg}`}>
          {d.liquido >= 0 ? '+' : ''}{formatarReais(d.liquido)}
        </span>
      ),
    },
    {
      key: 'projetado', label: 'Saldo projetado',
      render: d => (
        <span className={`${shared.valor} ${d.projetado < 0 ? shared.neg : ''}`}>{formatarReais(d.projetado)}</span>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={pag.visiveis}
      rowKey={d => d.id}
      emptyMessage="Sem projeção no período."
      toolbar={<PerPageSelect porPagina={pag.porPagina} onChange={pag.mudarPorPagina} />}
      footer={
        <div className={shared.rodapeTabela}>
          <div className={shared.resumo}>
            <span className={shared.resumoItem}>Saldo atual <strong>{formatarReais(saldoBase)}</strong></span>
            <span className={shared.resumoItem}>Entradas <strong className={shared.pos}>{formatarReais(totalEntradas)}</strong></span>
            <span className={shared.resumoItem}>Saídas <strong className={shared.neg}>{formatarReais(totalSaidas)}</strong></span>
            <span className={`${shared.resumoItem} ${shared.resumoDireita}`}>Projetado <strong>{formatarReais(projetado)}</strong></span>
          </div>
          <div className={shared.rodapePaginacao}>
            <Pagination
              page={pag.paginaAtual}
              totalPages={pag.totalPaginas}
              onChange={pag.setPagina}
              totalItems={pag.total}
              itemsPerPage={pag.porPagina}
            />
          </div>
        </div>
      }
    />
  )
}
