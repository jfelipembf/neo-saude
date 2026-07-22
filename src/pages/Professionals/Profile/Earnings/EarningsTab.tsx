import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { usePatients } from '@/hooks/usePatients'
import { usePayments } from '@/hooks/usePayments'
import { usePagination } from '@/hooks/usePagination'
import { formatBRL } from '@/utils/format'
import type { Professional } from '@/types/domain'
import { earningsBuckets, monthRange, GRANULARITY_OPTIONS } from './buckets'
import type { EarningsGranularity } from './buckets'
import shared from '../shared/profile.module.scss'
import styles from './EarningsTab.module.scss'

interface EarningsTabProps {
  professional: Professional
}

/** Aba "Ganhos": barras por período (clicáveis) + destrinchado por paciente. */
export function EarningsTab({ professional }: EarningsTabProps) {
  const { data: patients } = usePatients()
  const { data: payments } = usePayments()

  const [granularity, setGranularity] = useState<EarningsGranularity>('month')
  const [fromIso, setFromIso] = useState(() => monthRange(new Date()).de)
  const [toIso, setToIso] = useState(() => monthRange(new Date()).ate)

  const today = new Date()
  const patientById = new Map((patients ?? []).map(p => [p.id, p]))

  // Itens de pagamentos PAGOS atribuídos a este profissional.
  const earningsItems = (payments ?? [])
    .filter(p => p.status === 'paid')
    .flatMap(p =>
      (p.treatments ?? [])
        .filter(t => t.professionalId === professional.id)
        .map(t => ({
          dateIso: p.date.split('/').reverse().join('-'),
          date: p.date,
          patientId: p.patientId,
          name: t.name,
          amount: t.amount,
        })),
    )

  // Gráfico: um período por barra, conforme a granularidade escolhida.
  const periods = earningsBuckets(granularity, today).map(b => ({
    ...b,
    total: earningsItems.filter(g => g.dateIso >= b.de && g.dateIso <= b.ate).reduce((s, g) => s + g.amount, 0),
  }))
  const maxTotal = Math.max(1, ...periods.map(m => m.total))

  // Lista: agregado por paciente DENTRO do período, maior ganho primeiro.
  const periodItems = earningsItems.filter(g => g.dateIso >= fromIso && g.dateIso <= toIso)
  const periodTotal = periodItems.reduce((sum, g) => sum + g.amount, 0)
  const byPatient = [...periodItems
    .reduce((map, g) => {
      const current = map.get(g.patientId) ?? {
        patientId: g.patientId,
        name: patientById.get(g.patientId)?.name ?? 'Paciente',
        total: 0,
        items: [] as typeof periodItems,
      }
      current.total += g.amount
      current.items.push(g)
      return map.set(g.patientId, current)
    }, new Map<string, { patientId: string; name: string; total: number; items: typeof periodItems }>())
    .values()]
    .sort((a, b) => b.total - a.total)

  const pagination = usePagination(byPatient)

  // Trocar a granularidade já seleciona o período ATUAL dela (hoje, esta
  // semana, este mês, este ano) — as barras refinam a partir daí.
  function changeGranularity(g: EarningsGranularity) {
    setGranularity(g)
    const current = earningsBuckets(g, new Date()).at(-1)!
    setFromIso(current.de)
    setToIso(current.ate)
    pagination.setPage(1)
  }

  const columns: TableColumn<(typeof byPatient)[number]>[] = [
    { key: 'paciente', label: 'Paciente', render: g => <span className={styles.ganhosPaciente}>{g.name}</span> },
    {
      key: 'procedimentos',
      label: 'Procedimentos',
      render: g => `${g.items.length} ${g.items.length === 1 ? 'procedimento' : 'procedimentos'}`,
    },
    {
      key: 'total',
      label: 'Ganho no período',
      render: g => <span className={styles.ganhosItemValor}>{formatBRL(g.total)}</span>,
    },
  ]

  return (
    <div className={styles.ganhosTab}>
      <section className={shared.formCard} aria-label="Ganhos">
        <div className={shared.detalheHead}>
          <div>
            <h2 className={shared.formTitulo}>Ganhos</h2>
            <span className={styles.ganhosDica}>Clique em um período para filtrar a lista</span>
          </div>
          <SegmentedControl
            options={GRANULARITY_OPTIONS}
            value={granularity}
            onChange={changeGranularity}
          />
        </div>

        {/* Gráfico de barras: um período por coluna; o clique filtra a lista. */}
        <div className={styles.ganhosChart}>
          {periods.map(m => {
            const active = fromIso === m.de && toIso === m.ate
            return (
              <button
                key={m.de}
                type="button"
                className={`${styles.ganhosColuna} ${active ? styles.ganhosColunaAtiva : ''}`}
                onClick={() => { setFromIso(m.de); setToIso(m.ate); pagination.setPage(1) }}
                title={`${m.rotulo}: ${formatBRL(m.total)}`}
                aria-label={`${m.rotulo}: ${formatBRL(m.total)}`}
                aria-pressed={active}
              >
                <span className={styles.ganhosValor}>
                  {m.total > 0 ? formatBRL(m.total).replace(/,00$/, '') : ''}
                </span>
                <span className={styles.ganhosArea}>
                  {/* Altura vem do dado — via custom property, não estilo inline. */}
                  <span
                    className={styles.ganhosBarra}
                    style={{ '--altura': `${(m.total / maxTotal) * 100}%` } as CSSProperties}
                  />
                </span>
                <span className={styles.ganhosRotulo}>{m.rotulo}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Ganhos por paciente no período: expandir mostra cada procedimento. */}
      <Table
        columns={columns}
        data={pagination.visible}
        rowKey={g => g.patientId}
        emptyMessage="Sem ganhos no período selecionado."
        renderExpanded={g => (
          <ul className={styles.ganhosExp}>
            {[...g.items]
              .sort((a, b) => b.dateIso.localeCompare(a.dateIso))
              .map((item, i) => (
                <li key={`${item.dateIso}-${i}`} className={styles.ganhosExpLinha}>
                  <span className={styles.ganhosExpData}>{item.date}</span>
                  <span className={styles.ganhosExpNome}>{item.name}</span>
                  <span className={styles.ganhosItemValor}>{formatBRL(item.amount)}</span>
                </li>
              ))}
          </ul>
        )}
        toolbar={<PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />}
        footer={
          <div className={styles.ganhosRodape}>
            <span className={styles.ganhosResumo}>
              Total no período <strong>{formatBRL(periodTotal)}</strong>
            </span>
            <Pagination
              page={pagination.currentPage}
              totalPages={pagination.totalPages}
              onChange={pagination.setPage}
              totalItems={pagination.total}
              itemsPerPage={pagination.perPage}
            />
          </div>
        }
      />
    </div>
  )
}
