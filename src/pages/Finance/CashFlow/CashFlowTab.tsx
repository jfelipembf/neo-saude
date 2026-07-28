import { useMemo, useState } from 'react'
import { Button } from '@/components/Button/Button'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Select } from '@/components/Select/Select'
import { IconChevronLeft, IconChevronRight, IconPrint } from '@/components/icons'
import { useBankAccounts, useCashFlowMatrix } from '@/hooks/useFinance'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import {
  buildCashFlowMatrix, defaultCashFlowWindow, shiftCashFlowWindow,
} from '@/utils/cashFlowMatrix'
import type { CashFlowGranularity, CashFlowMatrixRow } from '@/utils/cashFlowMatrix'
import { isoToBrDate } from '@/utils/date'
import { formatBRL } from '@/utils/format'
import { esc } from '@/utils/printDocument'
import styles from './CashFlowTab.module.scss'

const VISOES = [
  { value: 'day'   as const, label: 'Diário' },
  { value: 'week'  as const, label: 'Semanal' },
  { value: 'month' as const, label: 'Mensal' },
]

/**
 * FLUXO DE CAIXA EM MATRIZ: categoria na linha, período na coluna.
 *
 * A pergunta desta tela não é "quanto tem" — é "para ONDE está indo". Uma lista
 * de dias com o saldo responde a primeira e some com a segunda: o mês fecha em
 * 12 mil e ninguém sabe quanto disso foi folha e quanto foi imposto.
 *
 * As três linhas de baixo são o encadeamento: Geração de caixa (receita −
 * despesa do período), Saldo anterior e Saldo final — o final de uma coluna é o
 * anterior da seguinte. É o que transforma colunas soltas em fluxo.
 */
export function CashFlowTab() {
  const [visao, setVisao] = useState<CashFlowGranularity>('day')
  const [janela, setJanela] = useState(() => defaultCashFlowWindow('day'))
  const [conta, setConta] = useState('')

  const { data: contas } = useBankAccounts()
  const { data, isLoading } = useCashFlowMatrix(janela, visao, conta || undefined)
  const imprimir = usePrintDocument()

  const matriz = useMemo(
    () => buildCashFlowMatrix(data?.cells ?? [], data?.openingBalance ?? 0, janela, visao),
    [data, janela, visao],
  )

  /** Trocar de visão troca também a janela — 7 colunas de mês não é "mensal". */
  function mudarVisao(nova: CashFlowGranularity) {
    setVisao(nova)
    setJanela(defaultCashFlowWindow(nova))
  }

  const periodo = `${isoToBrDate(janela.from)} a ${isoToBrDate(janela.to)}`

  if (isLoading && !data) return <PageLoader />

  return (
    <section className={styles.painel}>
      <header className={styles.barra}>
        <Select
          size="sm"
          className={styles.contaField}
          value={conta}
          onChange={e => setConta(e.target.value)}
          aria-label="Conta bancária"
          options={[
            { value: '', label: 'Todas as contas' },
            ...(contas ?? []).map(c => ({ value: c.id, label: c.name })),
          ]}
        />

        <SegmentedControl size="sm" options={VISOES} value={visao} onChange={mudarVisao} />

        {/* O período é TEXTO, não campo: quem o move são as setas ao lado. Um
            date picker aqui deixaria escolher intervalos que não fecham em
            balde inteiro, e a coluna passaria a somar meio mês. */}
        <span className={styles.periodo}>{periodo}</span>

        <div className={styles.navegacao}>
          <Button
            variant="outline" size="sm" iconLeft={<IconChevronLeft />}
            aria-label="Período anterior"
            onClick={() => setJanela(j => shiftCashFlowWindow(j, visao, -1))}
          />
          <Button
            variant="outline" size="sm" iconLeft={<IconChevronRight />}
            aria-label="Próximo período"
            onClick={() => setJanela(j => shiftCashFlowWindow(j, visao, 1))}
          />
          <Button
            variant="ghost" size="sm" iconLeft={<IconPrint />}
            aria-label="Imprimir"
            onClick={() => imprimir({
              title: 'Fluxo de caixa',
              subtitle: periodo,
              body: corpoImpresso(matriz.columns.map(c => c.label), matriz.rows),
              styles: ESTILOS_IMPRESSAO,
            })}
          />
        </div>
      </header>

      {/* A rolagem é do CONTÊINER, não da página: com 12 colunas de mês a tabela
          passa da largura da tela, e é ela que precisa rolar — a primeira coluna
          fica presa (`position: sticky`) para o nome da categoria não sumir
          junto. */}
      <div className={styles.rolagem}>
        <table className={styles.matriz}>
          <thead>
            <tr>
              <th className={styles.cabecalhoCanto} scope="col">Categoria</th>
              {matriz.columns.map(c => (
                <th key={c.id} scope="col">{c.label}</th>
              ))}
              <th className={styles.colunaTotal} scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {matriz.rows.map(linha => (
              <tr key={linha.key} className={classeDaLinha(linha)}>
                <th scope="row" className={styles.celulaRotulo}>{linha.label}</th>
                {linha.values.map((v, i) => (
                  <td key={matriz.columns[i].id} className={classeDoValor(linha, v)}>
                    {formatBRL(v)}
                  </td>
                ))}
                <td className={`${styles.colunaTotal} ${classeDoValor(linha, linha.total)}`}>
                  {formatBRL(linha.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function classeDaLinha(linha: CashFlowMatrixRow): string {
  if (linha.type === 'group') {
    return linha.tone === 'revenue' ? styles.linhaReceita : styles.linhaDespesa
  }
  if (linha.type === 'result') {
    return linha.key === 'closing' ? styles.linhaSaldoFinal : styles.linhaResultado
  }
  return styles.linhaCategoria
}

/** Vermelho só onde negativo é NOTÍCIA: saldo e geração de caixa. Uma despesa
 *  de 300 não é um problema — é uma despesa; pintar toda a coluna de vermelho
 *  faria o olho parar de distinguir a linha que importa. */
function classeDoValor(linha: CashFlowMatrixRow, valor: number): string {
  if (linha.type !== 'result') return ''
  if (valor < 0) return styles.negativo
  return linha.key === 'closing' ? styles.positivo : ''
}

// ── Impressão ────────────────────────────────────────────────────────────────

const ESTILOS_IMPRESSAO = `
  table { font-size: 11px; }
  th, td { text-align: right; padding: 4px 6px; }
  th:first-child, td:first-child { text-align: left; }
  .grupo td, .grupo th { font-weight: 700; background: #f1f5f9; }
  .resultado td, .resultado th { font-weight: 700; border-top: 1px solid #94a3b8; }
`

function corpoImpresso(colunas: string[], linhas: CashFlowMatrixRow[]): string {
  const cabecalho = `<tr><th>Categoria</th>${
    colunas.map(c => `<th>${esc(c)}</th>`).join('')
  }<th>Total</th></tr>`

  const corpo = linhas.map(l => {
    const classe = l.type === 'group' ? 'grupo' : l.type === 'result' ? 'resultado' : ''
    return `<tr class="${classe}"><th>${esc(l.label)}</th>${
      l.values.map(v => `<td>${esc(formatBRL(v))}</td>`).join('')
    }<td>${esc(formatBRL(l.total))}</td></tr>`
  }).join('')

  return `<table>${cabecalho}${corpo}</table>`
}
