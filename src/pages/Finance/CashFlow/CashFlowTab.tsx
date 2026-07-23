import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Select } from '@/components/Select/Select'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { IconAlert, IconCheck } from '@/components/icons'
import { useCashFlow } from '@/hooks/useFinance'
import { CASH_FLOW_HORIZONS } from '@/services/financeService'
import type { CashFlowHorizon } from '@/services/financeService'
import { formatBRL } from '@/utils/format'
import type { CashFlowDay } from '@/types/domain'
import shared from '../shared/finance.module.scss'
import styles from './CashFlowTab.module.scss'

/** Linha da tabela: o dia do serviço + os acumulados calculados aqui. */
type CashFlowRow = CashFlowDay & { net: number; projected: number }

/** Opções do seletor de horizonte — uma projeção é um horizonte ROLANTE a
 *  partir de hoje, então o controle escolhe "quão longe olhar", não um intervalo
 *  no passado (que seria fluxo REALIZADO, outra tela). */
const HORIZON_OPTIONS = CASH_FLOW_HORIZONS.map(d => ({
  value: String(d),
  label: `Próximos ${d} dias`,
}))

/** Aba "Fluxo de caixa": projeção diária cumulativa a partir do saldo atual.
 *  Mostra o futuro de propósito — é uma PROJEÇÃO (não a DFC realizada). */
export function CashFlowTab() {
  const [horizon, setHorizon] = useState<CashFlowHorizon>(30)
  const { data, isLoading } = useCashFlow(horizon)

  const baseBalance = data?.baseBalance ?? 0
  const days = data?.days ?? []

  // Saldo projetado cumulativo a partir do saldo base, e o PRIMEIRO dia em que
  // ele fica negativo — a única pergunta que traz o dono a esta tela.
  const rows: CashFlowRow[] = []
  let accumulated = baseBalance
  let firstNegativeId: string | null = null
  for (const d of days) {
    const net = d.inflows - d.outflows
    accumulated += net
    if (firstNegativeId === null && accumulated < 0) firstNegativeId = d.id
    rows.push({ ...d, net, projected: accumulated })
  }
  const firstNegative = rows.find(r => r.id === firstNegativeId) ?? null

  if (isLoading) return <PageLoader />

  const totalInflows  = days.reduce((s, d) => s + d.inflows, 0)
  const totalOutflows = days.reduce((s, d) => s + d.outflows, 0)
  const projected     = rows.length ? rows[rows.length - 1].projected : baseBalance

  const columns: TableColumn<CashFlowRow>[] = [
    {
      key: 'data', label: 'Data',
      render: d => (
        <span className={shared.celulaForte}>
          {d.date} <span className={shared.contagem}>({d.entryCount})</span>
        </span>
      ),
    },
    { key: 'entradas', label: 'Entradas', render: d => d.inflows > 0 ? <span className={shared.pos}>{formatBRL(d.inflows)}</span> : <span className={shared.traco}>—</span> },
    { key: 'saidas',   label: 'Saídas',   render: d => d.outflows > 0 ? <span className={shared.neg}>{formatBRL(d.outflows)}</span> : <span className={shared.traco}>—</span> },
    {
      key: 'liquido', label: 'Líquido',
      render: d => (
        <span className={`${shared.valor} ${d.net >= 0 ? shared.pos : shared.neg}`}>
          {d.net >= 0 ? '+' : ''}{formatBRL(d.net)}
        </span>
      ),
    },
    {
      key: 'projetado', label: 'Saldo projetado',
      render: d => (
        <span className={`${shared.valor} ${d.projected < 0 ? shared.neg : ''}`}>{formatBRL(d.projected)}</span>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={rows}
      rowKey={d => d.id}
      rowClassName={d => (d.id === firstNegativeId ? styles.negativeRow : undefined)}
      emptyMessage="Sem projeção no período."
      toolbar={
        <div className={styles.horizon}>
          <span className={styles.horizonLabel}>Horizonte</span>
          <Select
            size="sm"
            options={HORIZON_OPTIONS}
            value={String(horizon)}
            onChange={e => setHorizon(Number(e.target.value) as CashFlowHorizon)}
            aria-label="Horizonte da projeção"
            className={styles.horizonField}
          />
        </div>
      }
      footer={
        <div className={shared.rodapeTabela}>
          {/* A resposta a "quando fico sem caixa?" fica sempre visível, antes dos totais. */}
          {firstNegative ? (
            <span className={`${styles.alert} ${styles.alertDanger}`}>
              <IconAlert /> Saldo fica negativo em {firstNegative.date} ({formatBRL(firstNegative.projected)})
            </span>
          ) : (
            <span className={`${styles.alert} ${styles.alertOk}`}>
              <IconCheck /> Saldo positivo em todo o horizonte
            </span>
          )}
          <div className={shared.resumo}>
            <span className={shared.resumoItem}>Saldo atual <strong>{formatBRL(baseBalance)}</strong></span>
            <span className={shared.resumoItem}>Entradas <strong className={shared.pos}>{formatBRL(totalInflows)}</strong></span>
            <span className={shared.resumoItem}>Saídas <strong className={shared.neg}>{formatBRL(totalOutflows)}</strong></span>
            <span className={`${shared.resumoItem} ${shared.resumoDireita}`}>Projetado <strong>{formatBRL(projected)}</strong></span>
          </div>
        </div>
      }
    />
  )
}
