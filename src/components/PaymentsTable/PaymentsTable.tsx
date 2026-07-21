import { Fragment, useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Pagination } from '@/components/Pagination/Pagination'
import { PaymentModal } from '@/components/PaymentModal/PaymentModal'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronDireita, IconImprimir } from '@/components/icons'
import { usePagamentosDoPaciente } from '@/hooks/usePagamentos'
import { TIPO_PAGAMENTO_LABEL, OPCOES_POR_PAGINA } from '@/constants'
import type { FormaPagamento, Pagamento, StatusPagamento } from '@/types/domain'
import styles from './PaymentsTable.module.scss'

const OPCOES_FILTRO = [
  { value: 'todos',    label: 'Todos os status' },
  { value: 'pendente', label: 'Em aberto' },
  { value: 'vencido',  label: 'Atrasado' },
  { value: 'pago',     label: 'Pago' },
]

function formatarReais(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Resumo das formas para a linha fechada: "Pix + Crédito". */
function resumoFormas(formas: FormaPagamento[]) {
  if (formas.length === 0) return '—'
  return formas.map(f => TIPO_PAGAMENTO_LABEL[f.tipo]).join(' + ')
}

/** Pares label/valor exibidos no detalhe de uma forma (só os que existem). */
function detalhesForma(f: FormaPagamento) {
  const pares: { label: string; valor: string }[] = [{ label: 'Valor', valor: formatarReais(f.valor) }]
  if (f.data) pares.push({ label: 'Recebido em', valor: f.data })
  if (f.parcelas) {
    pares.push({
      label: 'Parcelas',
      valor: f.parcelas === 1 ? 'À vista' : `${f.parcelas}× de ${formatarReais(f.valor / f.parcelas)}`,
    })
  }
  if (f.bandeira)    pares.push({ label: 'Bandeira',    valor: f.bandeira })
  if (f.autorizacao) pares.push({ label: 'Autorização', valor: f.autorizacao })
  if (f.nsu)         pares.push({ label: 'NSU',         valor: f.nsu })
  return pares
}

/** Abre uma janela de impressão com o recibo simples do pagamento. */
function imprimirRecibo(pg: Pagamento, pacienteNome?: string) {
  const janela = window.open('', '_blank', 'width=420,height=640')
  if (!janela) return

  const formas = pg.formas
    .map(f => `<tr><td>${TIPO_PAGAMENTO_LABEL[f.tipo]}${f.parcelas && f.parcelas > 1 ? ` (${f.parcelas}×)` : ''}${f.bandeira ? ` · ${f.bandeira}` : ''}${f.autorizacao ? ` · aut. ${f.autorizacao}` : ''}</td><td class="valor">${formatarReais(f.valor)}</td></tr>`)
    .join('')

  janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Recibo — Neo Saúde</title>
    <style>
      body { font-family: system-ui, sans-serif; color: #12211C; margin: 24px; font-size: 14px; }
      h1 { font-size: 18px; margin: 0 0 2px; } .sub { color: #667; margin: 0 0 16px; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      td { padding: 6px 0; border-bottom: 1px solid #e2e8e5; } .valor { text-align: right; white-space: nowrap; }
      .total td { font-weight: 700; border-bottom: none; }
      .rodape { margin-top: 24px; font-size: 11px; color: #889; }
    </style></head><body>
    <h1>Neo Saúde</h1>
    <p class="sub">Recibo de pagamento</p>
    ${pacienteNome ? `<p><strong>Paciente:</strong> ${pacienteNome}</p>` : ''}
    <p><strong>Referente a:</strong> ${pg.descricao}<br><strong>Data:</strong> ${pg.data}</p>
    <table>
      ${formas}
      <tr class="total"><td>Total</td><td class="valor">${formatarReais(pg.valor)}</td></tr>
    </table>
    <p class="rodape">Documento gerado eletronicamente, sem valor fiscal.</p>
  </body></html>`)
  janela.document.close()
  janela.focus()
  janela.print()
}

interface PaymentsTableProps {
  pacienteId: string
  /** Nome exibido no recibo impresso e no modal de pagamento. */
  pacienteNome?: string
  /** CPF exibido no modal de pagamento. */
  pacienteCpf?: string
}

/** Tabela de pagamentos: filtro por status, paginação, detalhe expansível, receber e recibo. */
export function PaymentsTable({ pacienteId, pacienteNome, pacienteCpf }: PaymentsTableProps) {
  const { data: pagamentos, isLoading } = usePagamentosDoPaciente(pacienteId)

  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [aReceber, setAReceber] = useState<Pagamento | null>(null)
  const [filtro, setFiltro] = useState<'todos' | StatusPagamento>('todos')
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(5)

  if (isLoading) {
    return <div className={styles.loading}><Spinner /></div>
  }

  const lista = pagamentos ?? []

  if (lista.length === 0) {
    return (
      <EmptyState
        title="Nenhum pagamento registrado"
        description="Cobranças, recibos e histórico financeiro do paciente ficarão aqui."
      />
    )
  }

  const filtrados = filtro === 'todos' ? lista : lista.filter(p => p.status === filtro)
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
  // O filtro pode encolher a lista: nunca fica numa página que não existe mais.
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

  function alternar(id: string) {
    setAbertos(atual => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  return (
    <div className={styles.root}>
      <div className={styles.wrapper}>
        <div className={styles.toolbar}>
          <Select
            size="sm"
            options={OPCOES_POR_PAGINA}
            value={String(porPagina)}
            onChange={e => { setPorPagina(Number(e.target.value)); setPagina(1) }}
            aria-label="Registros por página"
            className={styles.porPagina}
          />
          <Select
            size="sm"
            options={OPCOES_FILTRO}
            value={filtro}
            onChange={e => { setFiltro(e.target.value as 'todos' | StatusPagamento); setPagina(1) }}
            aria-label="Filtrar pagamentos por status"
            className={styles.filtro}
          />
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thSeta} aria-label="Expandir" />
              <th>Data</th>
              <th>Descrição</th>
              <th>Pagamento</th>
              <th className={styles.thValor}>Valor</th>
              <th>Status</th>
              <th className={styles.thAcoes} aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {visiveis.length === 0 && (
              <tr>
                <td className={styles.vazio} colSpan={7}>Nenhum pagamento com esse status.</td>
              </tr>
            )}
            {visiveis.map(pg => {
              const aberto = abertos.has(pg.id)
              const emAberto = pg.status !== 'pago'
              return (
                <Fragment key={pg.id}>
                  <tr className={styles.linha} onClick={() => alternar(pg.id)}>
                    <td className={styles.tdSeta}>
                      <button
                        type="button"
                        className={`${styles.setaBtn} ${aberto ? styles['setaBtn--aberta'] : ''}`}
                        onClick={e => { e.stopPropagation(); alternar(pg.id) }}
                        aria-expanded={aberto}
                        aria-label={`${aberto ? 'Recolher' : 'Ver'} detalhes do pagamento de ${pg.data}`}
                      >
                        <IconChevronDireita />
                      </button>
                    </td>
                    <td>{pg.data}</td>
                    <td>{pg.descricao}</td>
                    <td className={styles.tdFormas}>{resumoFormas(pg.formas)}</td>
                    <td className={styles.tdValor}>{formatarReais(pg.valor)}</td>
                    <td><Badge status={pg.status} /></td>
                    <td className={styles.tdAcoes}>
                      {emAberto ? (
                        <Button
                          size="sm"
                          onClick={e => { e.stopPropagation(); setAReceber(pg) }}
                        >
                          Receber
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          iconLeft={<IconImprimir />}
                          onClick={e => { e.stopPropagation(); imprimirRecibo(pg, pacienteNome) }}
                        >
                          Recibo
                        </Button>
                      )}
                    </td>
                  </tr>

                  {aberto && (
                    <tr className={styles.detalheRow}>
                      <td colSpan={7}>
                        <div className={styles.detalhe}>
                          {pg.formas.length === 0 ? (
                            <p className={styles.semFormas}>
                              Nenhum recebimento registrado — pagamento {pg.status === 'vencido' ? 'vencido' : 'em aberto'}.
                            </p>
                          ) : (
                            pg.formas.map((f, indice) => (
                              <div key={indice} className={styles.forma}>
                                <span className={styles.formaTipo}>{TIPO_PAGAMENTO_LABEL[f.tipo]}</span>
                                <dl className={styles.formaDados}>
                                  {detalhesForma(f).map(par => (
                                    <div key={par.label} className={styles.par}>
                                      <dt>{par.label}</dt>
                                      <dd>{par.valor}</dd>
                                    </div>
                                  ))}
                                </dl>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>

        <div className={styles.rodape}>
          <Pagination
            page={paginaAtual}
            totalPages={totalPaginas}
            onChange={setPagina}
            totalItems={filtrados.length}
            itemsPerPage={porPagina}
          />
        </div>
      </div>

      <PaymentModal
        pagamento={aReceber}
        paciente={pacienteNome ? { nome: pacienteNome, cpf: pacienteCpf } : undefined}
        onClose={() => setAReceber(null)}
      />
    </div>
  )
}
