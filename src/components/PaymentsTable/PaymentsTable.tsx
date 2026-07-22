import { Fragment, useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Pagination } from '@/components/Pagination/Pagination'
import { PaymentModal } from '@/components/PaymentModal/PaymentModal'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronDireita, IconImprimir, IconFinanceiro } from '@/components/icons'
import { usePagamentosDoPaciente, useReceberPagamento } from '@/hooks/usePagamentos'
import { useToast } from '@/components/Toast/useToast'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { esc } from '@/utils/printDocument'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { TIPO_PAGAMENTO_LABEL } from '@/constants'
import type { PaymentEntry, Payment, PaymentStatus } from '@/types/domain'
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
function resumoFormas(formas: PaymentEntry[]) {
  if (formas.length === 0) return '—'
  return formas.map(f => TIPO_PAGAMENTO_LABEL[f.tipo]).join(' + ')
}

/** Pares label/valor exibidos no detalhe de uma forma (só os que existem). */
function detalhesForma(f: PaymentEntry) {
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

/** Miolo do recibo — o cabeçalho da clínica e o rodapé vêm da base de impressão. */
function corpoRecibo(pg: Payment, pacienteNome?: string) {
  const formas = pg.formas
    .map(f => `<tr><td>${esc(TIPO_PAGAMENTO_LABEL[f.tipo])}${f.parcelas && f.parcelas > 1 ? ` (${f.parcelas}×)` : ''}${f.bandeira ? ` · ${esc(f.bandeira)}` : ''}${f.autorizacao ? ` · aut. ${esc(f.autorizacao)}` : ''}</td><td class="valor">${formatarReais(f.valor)}</td></tr>`)
    .join('')

  return `
    ${pacienteNome ? `<p><strong>Patient:</strong> ${esc(pacienteNome)}</p>` : ''}
    <p><strong>Referente a:</strong> ${esc(pg.descricao)}<br><strong>Data:</strong> ${esc(pg.data)}</p>
    <table>
      ${formas}
      <tr class="total"><td>Total</td><td class="valor">${formatarReais(pg.valor)}</td></tr>
    </table>
    <p class="clausula">Recibo sem valor fiscal.</p>`
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
  const { mutate: receber, isPending: recebendo } = useReceberPagamento()
  const toast = useToast()
  const imprimir = usePrintDocument()

  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [aReceber, setAReceber] = useState<Payment | null>(null)
  const [filtro, setFiltro] = useState<'todos' | PaymentStatus>('todos')
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
          <PerPageSelect porPagina={porPagina} onChange={n => { setPorPagina(n); setPagina(1) }} />
          <Select
            size="sm"
            options={OPCOES_FILTRO}
            value={filtro}
            onChange={e => { setFiltro(e.target.value as 'todos' | PaymentStatus); setPagina(1) }}
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
              <th>Payment</th>
              <th className={styles.thValor}>Valor</th>
              <th>Status</th>
              <th className={styles.thAcoes}>Ação</th>
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
                          variant="ghost"
                          size="sm"
                          iconLeft={<IconFinanceiro />}
                          title="Receber pagamento"
                          aria-label={`Receber pagamento de ${pg.data}`}
                          onClick={e => { e.stopPropagation(); setAReceber(pg) }}
                        />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<IconImprimir />}
                          title="Imprimir recibo"
                          aria-label={`Imprimir recibo de ${pg.data}`}
                          onClick={e => {
                            e.stopPropagation()
                            imprimir({
                              titulo: 'Recibo de pagamento',
                              subtitulo: pg.descricao,
                              corpo: corpoRecibo(pg, pacienteNome),
                              largura: 520,
                            })
                          }}
                        />
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
        cobranca={aReceber && {
          id: aReceber.id,
          descricao: aReceber.descricao,
          valor: aReceber.valor,
          tratamentos: aReceber.tratamentos,
        }}
        paciente={pacienteNome ? { nome: pacienteNome, cpf: pacienteCpf } : undefined}
        confirmando={recebendo}
        onConfirm={dados => {
          if (!aReceber) return
          receber({ id: aReceber.id, dados }, {
            onSuccess: () => { toast.success('Pagamento registrado!'); setAReceber(null) },
          })
        }}
        onClose={() => setAReceber(null)}
      />
    </div>
  )
}
