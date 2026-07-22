import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useCommissions } from '@/hooks/useCommissions'
import { useProfessionalEarnings } from '@/hooks/useProfessionals'
import { usePagination } from '@/hooks/usePagination'
import { formatBRL } from '@/utils/format'
import type { Professional, ProfessionalCommission, ProfessionalEarning } from '@/types/domain'
import { earningsBuckets, monthRange, GRANULARITY_OPTIONS } from './buckets'
import type { EarningsGranularity } from './buckets'
import shared from '../shared/profile.module.scss'
import styles from './EarningsTab.module.scss'

interface EarningsTabProps {
  professional: Professional
}

/**
 * Valor de UM procedimento na base da comissão.
 *
 * base 'performed' (produzido) = o que foi executado, receba a clínica ou não.
 * base 'received'  (recebido)  = o que já entrou pelos títulos ligados à sessão.
 *
 * LIMITE do modelo, e ele é honesto: procedimento coberto por CONTRATO
 * ('covered') não tem título próprio — a dívida nasceu no orçamento, e as
 * parcelas do orçamento não têm profissional. Não dá para dizer qual parcela
 * pagou qual procedimento sem inventar o apontamento, e apontamento inventado
 * vira comissão errada no bolso de alguém. Nesses casos o recebido é 0 e a tela
 * AVISA, em vez de somar zero em silêncio.
 */
function baseValue(item: ProfessionalEarning, base: ProfessionalCommission['base']) {
  return base === 'received' ? item.receivedAmount : item.amount
}

/** Comissão de um conjunto de procedimentos, pela regra cadastrada. */
function commissionOf(items: ProfessionalEarning[], rule: ProfessionalCommission) {
  if (rule.type === 'fixed') {
    // Valor FIXO é por procedimento — não é percentual de nada.
    return rule.amount * items.length
  }
  return items.reduce((sum, i) => sum + baseValue(i, rule.base), 0) * rule.amount / 100
}

/** Resumo da regra para o cabeçalho ("40% sobre o recebido"). */
function ruleSummary(rule: ProfessionalCommission) {
  if (rule.type === 'fixed') return `${formatBRL(rule.amount)} por procedimento`
  const base = rule.base === 'received' ? 'sobre o recebido' : 'sobre o produzido'
  return `${String(rule.amount).replace('.', ',')}% ${base}`
}

/**
 * Aba "Ganhos": produção do profissional por período (barras clicáveis) e o
 * destrinchado por paciente, com a COMISSÃO aplicada.
 *
 * Duas correções de fundo em relação ao que existia:
 *  1. a fonte era `billed_treatment`, tabela congelada com zero linhas — todo
 *     profissional via R$ 0,00. Agora vem de treatment_session, via a RPC
 *     professional_earnings;
 *  2. o percentual de professional_commission NUNCA era aplicado: a tela
 *     mostrava o bruto do procedimento como se fosse o ganho do profissional.
 */
export function EarningsTab({ professional }: EarningsTabProps) {
  const { data: earnings } = useProfessionalEarnings(professional.id)
  const { data: commissions } = useCommissions()

  const [granularity, setGranularity] = useState<EarningsGranularity>('month')
  const [fromIso, setFromIso] = useState(() => monthRange(new Date()).de)
  const [toIso, setToIso] = useState(() => monthRange(new Date()).ate)

  const today = new Date()

  // Regra ATIVA do profissional. Sem regra não se inventa percentual: a tela
  // passa a mostrar produção e diz, com todas as letras, que falta cadastrar.
  const rule = (commissions ?? []).find(c => c.professionalId === professional.id && c.status === 'active')
  const base: ProfessionalCommission['base'] = rule?.base ?? 'performed'
  const items = earnings ?? []

  /** O número que vai na barra e na coluna: comissão quando há regra. */
  const valueOf = (list: ProfessionalEarning[]) =>
    rule ? commissionOf(list, rule) : list.reduce((sum, i) => sum + i.amount, 0)

  // Gráfico: um período por barra, conforme a granularidade escolhida.
  const periods = earningsBuckets(granularity, today).map(b => ({
    ...b,
    total: valueOf(items.filter(g => g.dateIso >= b.de && g.dateIso <= b.ate)),
  }))
  const maxTotal = Math.max(1, ...periods.map(m => m.total))

  // Lista: agregado por paciente DENTRO do período, maior ganho primeiro.
  const periodItems = items.filter(g => g.dateIso >= fromIso && g.dateIso <= toIso)
  const periodTotal = valueOf(periodItems)
  const periodBase = periodItems.reduce((sum, g) => sum + baseValue(g, base), 0)
  // Procedimentos cujo recebimento não é atribuível (contrato aprovado).
  const unattributable = base === 'received'
    ? periodItems.filter(g => g.billingStatus === 'covered')
    : []

  const byPatient = [...periodItems
    .reduce((map, g) => {
      const current = map.get(g.patientId) ?? {
        patientId: g.patientId,
        name: g.patientName,
        items: [] as ProfessionalEarning[],
      }
      current.items.push(g)
      return map.set(g.patientId, current)
    }, new Map<string, { patientId: string; name: string; items: ProfessionalEarning[] }>())
    .values()]
    .map(p => ({ ...p, base: p.items.reduce((s, i) => s + baseValue(i, base), 0), total: valueOf(p.items) }))
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

  const baseLabel = base === 'received' ? 'Recebido' : 'Produzido'

  const columns: TableColumn<(typeof byPatient)[number]>[] = [
    { key: 'patient', label: 'Paciente', render: g => <span className={styles.ganhosPaciente}>{g.name}</span> },
    {
      key: 'procedures',
      label: 'Procedimentos',
      render: g => `${g.items.length} ${g.items.length === 1 ? 'procedimento' : 'procedimentos'}`,
    },
    { key: 'base', label: baseLabel, render: g => <span className={styles.ganhosBase}>{formatBRL(g.base)}</span> },
    {
      key: 'total',
      label: rule ? 'Comissão' : 'Produzido no período',
      render: g => <span className={styles.ganhosItemValor}>{formatBRL(g.total)}</span>,
    },
  ]

  return (
    <div className={styles.ganhosTab}>
      <section className={shared.formCard} aria-label="Ganhos">
        <div className={shared.detalheHead}>
          <div>
            <h2 className={shared.formTitulo}>Ganhos</h2>
            <span className={styles.ganhosDica}>
              {rule
                ? `${ruleSummary(rule)} · clique em um período para filtrar a lista`
                : 'Sem regra de comissão ativa — os valores abaixo são a PRODUÇÃO, não o ganho. Cadastre em Administrativo → Comissões.'}
            </span>
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

        {/* O aviso existe porque somar zero em silêncio seria pagar a menos sem
            ninguém perceber. */}
        {unattributable.length > 0 && (
          <p className={styles.ganhosAviso}>
            {unattributable.length} {unattributable.length === 1 ? 'procedimento' : 'procedimentos'} deste período
            {unattributable.length === 1 ? ' está coberto' : ' estão cobertos'} por contrato aprovado
            ({formatBRL(unattributable.reduce((s, i) => s + i.amount, 0))} de produção). O recebimento fica nas
            parcelas do orçamento, que não têm profissional — por isso não entra na base “sobre o recebido”.
          </p>
        )}
      </section>

      {/* Ganhos por paciente no período: expandir mostra cada procedimento. */}
      <Table
        columns={columns}
        data={pagination.visible}
        rowKey={g => g.patientId}
        emptyMessage="Sem procedimentos no período selecionado."
        renderExpanded={g => (
          <ul className={styles.ganhosExp}>
            {[...g.items]
              .sort((a, b) => b.dateIso.localeCompare(a.dateIso))
              .map(item => (
                <li key={item.sessionId} className={styles.ganhosExpLinha}>
                  <span className={styles.ganhosExpData}>{item.date}</span>
                  <span className={styles.ganhosExpNome}>{item.description}</span>
                  <span className={styles.ganhosBase}>{formatBRL(baseValue(item, base))}</span>
                  <span className={styles.ganhosItemValor}>
                    {formatBRL(rule ? commissionOf([item], rule) : item.amount)}
                  </span>
                </li>
              ))}
          </ul>
        )}
        toolbar={<PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />}
        footer={
          <div className={styles.ganhosRodape}>
            <span className={styles.ganhosResumo}>
              {baseLabel} <strong className={styles.ganhosBase}>{formatBRL(periodBase)}</strong>
              {' · '}
              {rule ? 'Comissão' : 'Total'} <strong>{formatBRL(periodTotal)}</strong>
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
