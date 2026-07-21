import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { usePacientes } from '@/hooks/usePacientes'
import { usePagamentos } from '@/hooks/usePagamentos'
import { usePagination } from '@/hooks/usePagination'
import { formatarReais } from '@/utils/format'
import type { Professional } from '@/types/domain'
import { bucketsGanhos, rangeDoMes, OPCOES_GRANULARIDADE } from './buckets'
import type { EarningsGranularity } from './buckets'
import shared from '../shared/profile.module.scss'
import styles from './EarningsTab.module.scss'

interface EarningsTabProps {
  profissional: Professional
}

/** Aba "Ganhos": barras por período (clicáveis) + destrinchado por paciente. */
export function EarningsTab({ profissional }: EarningsTabProps) {
  const { data: pacientes } = usePacientes()
  const { data: pagamentos } = usePagamentos()

  const [granularidade, setGranularidade] = useState<EarningsGranularity>('mes')
  const [deIso, setDeIso] = useState(() => rangeDoMes(new Date()).de)
  const [ateIso, setAteIso] = useState(() => rangeDoMes(new Date()).ate)

  const hoje = new Date()
  const pacientePorId = new Map((pacientes ?? []).map(p => [p.id, p]))

  // Itens de pagamentos PAGOS atribuídos a este profissional.
  const itensGanhos = (pagamentos ?? [])
    .filter(p => p.status === 'pago')
    .flatMap(p =>
      (p.tratamentos ?? [])
        .filter(t => t.profissional === profissional.nome)
        .map(t => ({
          dataIso: p.data.split('/').reverse().join('-'),
          data: p.data,
          pacienteId: p.pacienteId,
          nome: t.nome,
          valor: t.valor,
        })),
    )

  // Gráfico: um período por barra, conforme a granularidade escolhida.
  const periodos = bucketsGanhos(granularidade, hoje).map(b => ({
    ...b,
    total: itensGanhos.filter(g => g.dataIso >= b.de && g.dataIso <= b.ate).reduce((s, g) => s + g.valor, 0),
  }))
  const maiorTotal = Math.max(1, ...periodos.map(m => m.total))

  // Lista: agregado por paciente DENTRO do período, maior ganho primeiro.
  const noPeriodo = itensGanhos.filter(g => g.dataIso >= deIso && g.dataIso <= ateIso)
  const totalPeriodo = noPeriodo.reduce((soma, g) => soma + g.valor, 0)
  const porPaciente = [...noPeriodo
    .reduce((mapa, g) => {
      const atual = mapa.get(g.pacienteId) ?? {
        pacienteId: g.pacienteId,
        nome: pacientePorId.get(g.pacienteId)?.nome ?? 'Paciente',
        total: 0,
        itens: [] as typeof noPeriodo,
      }
      atual.total += g.valor
      atual.itens.push(g)
      return mapa.set(g.pacienteId, atual)
    }, new Map<string, { pacienteId: string; nome: string; total: number; itens: typeof noPeriodo }>())
    .values()]
    .sort((a, b) => b.total - a.total)

  const pag = usePagination(porPaciente)

  // Trocar a granularidade já seleciona o período ATUAL dela (hoje, esta
  // semana, este mês, este ano) — as barras refinam a partir daí.
  function mudarGranularidade(g: EarningsGranularity) {
    setGranularidade(g)
    const atual = bucketsGanhos(g, new Date()).at(-1)!
    setDeIso(atual.de)
    setAteIso(atual.ate)
    pag.setPagina(1)
  }

  const colunas: TableColumn<(typeof porPaciente)[number]>[] = [
    { key: 'paciente', label: 'Paciente', render: g => <span className={styles.ganhosPaciente}>{g.nome}</span> },
    {
      key: 'procedimentos',
      label: 'Procedimentos',
      render: g => `${g.itens.length} ${g.itens.length === 1 ? 'procedimento' : 'procedimentos'}`,
    },
    {
      key: 'total',
      label: 'Ganho no período',
      render: g => <span className={styles.ganhosItemValor}>{formatarReais(g.total)}</span>,
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
            options={OPCOES_GRANULARIDADE}
            value={granularidade}
            onChange={mudarGranularidade}
          />
        </div>

        {/* Gráfico de barras: um período por coluna; o clique filtra a lista. */}
        <div className={styles.ganhosChart}>
          {periodos.map(m => {
            const ativo = deIso === m.de && ateIso === m.ate
            return (
              <button
                key={m.de}
                type="button"
                className={`${styles.ganhosColuna} ${ativo ? styles.ganhosColunaAtiva : ''}`}
                onClick={() => { setDeIso(m.de); setAteIso(m.ate); pag.setPagina(1) }}
                title={`${m.rotulo}: ${formatarReais(m.total)}`}
                aria-label={`${m.rotulo}: ${formatarReais(m.total)}`}
                aria-pressed={ativo}
              >
                <span className={styles.ganhosValor}>
                  {m.total > 0 ? formatarReais(m.total).replace(/,00$/, '') : ''}
                </span>
                <span className={styles.ganhosArea}>
                  {/* Altura vem do dado — via custom property, não estilo inline. */}
                  <span
                    className={styles.ganhosBarra}
                    style={{ '--altura': `${(m.total / maiorTotal) * 100}%` } as CSSProperties}
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
        columns={colunas}
        data={pag.visiveis}
        rowKey={g => g.pacienteId}
        emptyMessage="Sem ganhos no período selecionado."
        renderExpanded={g => (
          <ul className={styles.ganhosExp}>
            {[...g.itens]
              .sort((a, b) => b.dataIso.localeCompare(a.dataIso))
              .map((item, i) => (
                <li key={`${item.dataIso}-${i}`} className={styles.ganhosExpLinha}>
                  <span className={styles.ganhosExpData}>{item.data}</span>
                  <span className={styles.ganhosExpNome}>{item.nome}</span>
                  <span className={styles.ganhosItemValor}>{formatarReais(item.valor)}</span>
                </li>
              ))}
          </ul>
        )}
        toolbar={<PerPageSelect porPagina={pag.porPagina} onChange={pag.mudarPorPagina} />}
        footer={
          <div className={styles.ganhosRodape}>
            <span className={styles.ganhosResumo}>
              Total no período <strong>{formatarReais(totalPeriodo)}</strong>
            </span>
            <Pagination
              page={pag.paginaAtual}
              totalPages={pag.totalPaginas}
              onChange={pag.setPagina}
              totalItems={pag.total}
              itemsPerPage={pag.porPagina}
            />
          </div>
        }
      />
    </div>
  )
}
