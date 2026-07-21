import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Pagination } from '@/components/Pagination/Pagination'
import { Select } from '@/components/Select/Select'
import { SideList } from '@/components/SideList/SideList'
import { Textarea } from '@/components/Textarea/Textarea'
import { FormSection } from '@/components/FormSection/FormSection'
import { Toggle } from '@/components/Toggle/Toggle'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Tabs } from '@/components/Tabs/Tabs'
import { useToast } from '@/components/Toast/useToast'
import { IconFinanceiro, IconCheck, IconX } from '@/components/icons'
import {
  useMovimentosCaixa, useFluxoCaixa, useContasPagar, useContasReceber,
  useContasBancarias, useAdquirentes, useBaixarContaPagar, useBaixarContaReceber,
  useCaixaSessao, useAbrirCaixa, useFecharCaixa,
  useSalvarContaBancaria, useSalvarAdquirente,
  useCancelarContaPagar, useCancelarContaReceber,
} from '@/hooks/useFinanceiro'
import { usePagination } from '@/hooks/usePagination'
import { TIPO_PAGAMENTO_LABEL, OPCOES_POR_PAGINA } from '@/constants'
import { formatarReais, parseReais } from '@/utils/format'
import { toIsoDate } from '@/utils/date'
import type { BaixaInput } from '@/services/financeiroService'
import type {
  ContaPagar, ContaReceber, FluxoCaixaDia, MovimentoCaixa,
  TaxaParcela, TipoContaBancaria, TipoPagamento,
} from '@/types/domain'
import styles from './FinancePage.module.scss'

type TabKey = 'caixa' | 'fluxo' | 'pagar' | 'receber' | 'bancos' | 'adquirentes'

const TABS = [
  { key: 'caixa',       label: 'Caixa' },
  { key: 'fluxo',       label: 'Fluxo de caixa' },
  { key: 'pagar',       label: 'Contas a Pagar' },
  { key: 'receber',     label: 'Contas a Receber' },
  { key: 'bancos',      label: 'Contas bancárias' },
  { key: 'adquirentes', label: 'Adquirentes' },
]

export function FinancePage() {
  const [tab, setTab] = useState<TabKey>('caixa')

  return (
    <>
      {/* Zona de cabeçalho: título + abas coladas (mesmo desenho do perfil do paciente). */}
      <header className={styles.topo}>
        <PageHeader title="Financeiro" icon={<IconFinanceiro />} />
        <Tabs tabs={TABS} active={tab} onChange={k => setTab(k as TabKey)} />
      </header>

      {tab === 'caixa' && <CaixaTab />}
      {tab === 'fluxo' && <FluxoTab />}
      {tab === 'pagar' && <PagarTab />}
      {tab === 'receber' && <ReceberTab />}
      {tab === 'bancos' && <BancosTab />}
      {tab === 'adquirentes' && <AdquirentesTab />}
    </>
  )
}

/** Select "N por página" padrão das toolbars destas tabelas. */
function PerPageSelect({ porPagina, onChange }: { porPagina: number; onChange: (n: number) => void }) {
  return (
    <Select
      size="sm"
      options={OPCOES_POR_PAGINA}
      value={String(porPagina)}
      onChange={e => onChange(Number(e.target.value))}
      aria-label="Registros por página"
      className={styles.porPagina}
    />
  )
}

const OPCOES_FORMA_PAGAMENTO = (Object.keys(TIPO_PAGAMENTO_LABEL) as TipoPagamento[])
  .map(tipo => ({ value: tipo, label: TIPO_PAGAMENTO_LABEL[tipo] }))

interface SettleModalProps {
  titulo: string
  confirmLabel: string
  dataLabel: string
  valorLabel: string
  hintValor?: string
  valorInicial: number
  confirmando: boolean
  onClose: () => void
  onConfirm: (baixa: BaixaInput) => void
}

/** Modal de baixa (Confirmar Pagamento / Recebimento) — desenho do neo:
 *  data, forma, conta bancária, valor e observação. */
function SettleModal({
  titulo, confirmLabel, dataLabel, valorLabel, hintValor,
  valorInicial, confirmando, onClose, onConfirm,
}: SettleModalProps) {
  const { data: contas } = useContasBancarias()

  const [dataIso, setDataIso] = useState(() => toIsoDate(new Date()))
  const [forma, setForma] = useState('')
  const [contaId, setContaId] = useState('')
  const [valorTexto, setValorTexto] = useState(() =>
    valorInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  )
  const [observacao, setObservacao] = useState('')
  const [erroValor, setErroValor] = useState('')

  const opcoesConta = (contas ?? []).map(c => ({ value: c.id, label: c.nome }))

  function confirmar() {
    const valor = parseReais(valorTexto)
    if (!Number.isFinite(valor) || valor <= 0) {
      setErroValor('Informe um valor válido.')
      return
    }
    onConfirm({
      data: dataIso.split('-').reverse().join('/'),
      forma: (forma || undefined) as TipoPagamento | undefined,
      contaBancariaId: contaId || undefined,
      valor,
      observacoes: observacao.trim() || undefined,
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={titulo}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={confirmando}>Cancelar</Button>
          <Button loading={confirmando} onClick={confirmar}>{confirmLabel}</Button>
        </>
      }
    >
      <div className={styles.fields}>
        <Input label={dataLabel} type="date" value={dataIso} onChange={e => setDataIso(e.target.value)} />
        <Select
          label="Forma de pagamento"
          placeholder="Selecione..."
          options={OPCOES_FORMA_PAGAMENTO}
          value={forma}
          onChange={e => setForma(e.target.value)}
        />
        <Select
          label="Conta bancária"
          placeholder="Selecione a conta..."
          options={opcoesConta}
          value={contaId}
          onChange={e => setContaId(e.target.value)}
        />
        <Input
          label={valorLabel}
          iconLeft={<span className={styles.prefixo}>R$</span>}
          inputMode="decimal"
          value={valorTexto}
          onChange={e => { setValorTexto(e.target.value); setErroValor('') }}
          error={erroValor}
          hint={hintValor}
        />
        <div className={styles.fieldFull}>
          <Textarea
            label="Observação"
            rows={2}
            placeholder="Nota interna sobre esta baixa (opcional)"
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}

// ── 1. Caixa: abrir/fechar + resumo do turno + movimentos ────────────────────
function CaixaTab() {
  const toast = useToast()
  const { data: sessao, isLoading: carregandoSessao } = useCaixaSessao()
  const { data: movimentos, isLoading: carregandoMovimentos } = useMovimentosCaixa()
  const { mutate: abrir, isPending: abrindo } = useAbrirCaixa()
  const { mutate: fechar, isPending: fechando } = useFecharCaixa()

  const lista = movimentos ?? []
  const pag = usePagination(lista)

  const [modalAbrir, setModalAbrir] = useState(false)
  const [modalFechar, setModalFechar] = useState(false)
  const [fundoTexto, setFundoTexto] = useState('')
  const [contagemTexto, setContagemTexto] = useState('')
  const [erroValor, setErroValor] = useState('')

  if (carregandoSessao || carregandoMovimentos) return <PageLoader />

  const entradas = lista.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0)
  const saidas   = lista.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0)
  const abertura = sessao?.valorAbertura ?? 0
  const saldoTurno = abertura + entradas - saidas

  function aoAbrirCaixa() {
    const fundo = parseReais(fundoTexto || '0')
    if (!Number.isFinite(fundo) || fundo < 0) {
      setErroValor('Informe um valor válido.')
      return
    }
    abrir(fundo, {
      onSuccess: () => {
        toast.success('Caixa aberto!')
        setModalAbrir(false)
        setFundoTexto('')
        setErroValor('')
      },
    })
  }

  function aoFecharCaixa() {
    fechar(undefined, {
      onSuccess: () => {
        toast.success('Caixa fechado!')
        setModalFechar(false)
        setContagemTexto('')
      },
    })
  }

  const columns: TableColumn<MovimentoCaixa>[] = [
    { key: 'nome',       label: 'Nome', render: m => <span className={styles.celulaForte}>{m.nome}</span> },
    { key: 'forma',      label: 'Forma de pagamento', render: m => m.formaPagamento ?? '—' },
    { key: 'descricao',  label: 'Descrição' },
    { key: 'lancamento', label: 'Lançamento' },
    {
      key: 'valor', label: 'Valor',
      render: m => (
        <span className={`${styles.valor} ${m.tipo === 'entrada' ? styles.pos : styles.neg}`}>
          {m.tipo === 'entrada' ? '+' : '−'}{formatarReais(m.valor)}
        </span>
      ),
    },
  ]

  return (
    <div className={styles.aba}>
      {!sessao?.aberto ? (
        <EmptyState
          title="Caixa fechado"
          description="Abra o caixa para registrar as movimentações do dia."
          action={<Button onClick={() => setModalAbrir(true)}>Abrir Caixa</Button>}
        />
      ) : (
        <>
          {/* Cabeçalho do turno (desenho do Caixa do neo): operador + estatísticas inline. */}
          <div className={styles.turnoBar}>
            <div className={styles.caixaInfo}>
              <span className={styles.caixaOperador}>{sessao.operador?.toUpperCase()}</span>
              <span className={styles.caixaAbertura}>Caixa aberto em {sessao.abertoEm}</span>
            </div>

            <div className={styles.turnoStats}>
              <div className={styles.turnoStat}>
                <span className={styles.turnoLabel}>Valor inicial</span>
                <span className={styles.turnoValor}>{formatarReais(abertura)}</span>
              </div>
              <div className={styles.turnoStat}>
                <span className={styles.turnoLabel}>Entradas</span>
                <span className={`${styles.turnoValor} ${styles['turnoValor--entrada']}`}>{formatarReais(entradas)}</span>
              </div>
              <div className={styles.turnoStat}>
                <span className={styles.turnoLabel}>Saídas</span>
                <span className={`${styles.turnoValor} ${styles['turnoValor--saida']}`}>{formatarReais(saidas)}</span>
              </div>
              <div className={styles.turnoStat}>
                <span className={styles.turnoLabel}>Saldo do turno</span>
                <span className={`${styles.turnoValor} ${styles['turnoValor--saldo']}`}>{formatarReais(saldoTurno)}</span>
              </div>
            </div>

            <Button variant="danger" loading={fechando} onClick={() => setModalFechar(true)}>
              Fechar Caixa
            </Button>
          </div>

          <Table
            columns={columns}
            data={pag.visiveis}
            rowKey={m => m.id}
            emptyMessage="Nenhum movimento no caixa de hoje."
            toolbar={<PerPageSelect porPagina={pag.porPagina} onChange={pag.mudarPorPagina} />}
            footer={
              <Pagination
                page={pag.paginaAtual}
                totalPages={pag.totalPaginas}
                onChange={pag.setPagina}
                totalItems={pag.total}
                itemsPerPage={pag.porPagina}
              />
            }
          />
        </>
      )}

      {/* ── Abertura de Caixa ── */}
      <Modal
        open={modalAbrir}
        onClose={() => setModalAbrir(false)}
        title="Abertura de Caixa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalAbrir(false)} disabled={abrindo}>Cancelar</Button>
            <Button loading={abrindo} onClick={aoAbrirCaixa}>Abrir Caixa</Button>
          </>
        }
      >
        <Input
          label="Fundo de troco inicial"
          iconLeft={<span className={styles.prefixo}>R$</span>}
          inputMode="decimal"
          placeholder="0,00"
          value={fundoTexto}
          onChange={e => { setFundoTexto(e.target.value); setErroValor('') }}
          error={erroValor}
          hint="Valor em dinheiro disponível na gaveta ao iniciar o dia."
          autoFocus
        />
      </Modal>

      {/* ── Fechamento de Caixa ── */}
      <Modal
        open={modalFechar}
        onClose={() => setModalFechar(false)}
        title="Fechamento de Caixa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalFechar(false)} disabled={fechando}>Revisar</Button>
            <Button variant="danger" loading={fechando} onClick={aoFecharCaixa}>Confirmar fechamento</Button>
          </>
        }
      >
        <div className={styles.modalCorpo}>
          <p className={styles.modalDica}>
            Informe o valor contado fisicamente na gaveta. O saldo esperado do turno é{' '}
            <strong>{formatarReais(saldoTurno)}</strong> — divergências ficam registradas no fechamento.
          </p>
          <Input
            label="Contagem da gaveta"
            iconLeft={<span className={styles.prefixo}>R$</span>}
            inputMode="decimal"
            placeholder="0,00"
            value={contagemTexto}
            onChange={e => setContagemTexto(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  )
}

// ── 2. Fluxo de caixa: projeção diária cumulativa ────────────────────────────
function FluxoTab() {
  const { data, isLoading } = useFluxoCaixa()

  const saldoBase = data?.saldoBase ?? 0
  const dias = data?.dias ?? []

  // Saldo projetado cumulativo a partir do saldo base.
  const linhas: Array<FluxoCaixaDia & { liquido: number; projetado: number }> = []
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

  const columns: TableColumn<FluxoCaixaDia & { liquido: number; projetado: number }>[] = [
    {
      key: 'data', label: 'Data',
      render: d => (
        <span className={styles.celulaForte}>
          {d.data} <span className={styles.contagem}>({d.lancamentos})</span>
        </span>
      ),
    },
    { key: 'entradas', label: 'Entradas', render: d => d.entradas > 0 ? <span className={styles.pos}>{formatarReais(d.entradas)}</span> : <span className={styles.traco}>—</span> },
    { key: 'saidas',   label: 'Saídas',   render: d => d.saidas > 0 ? <span className={styles.neg}>{formatarReais(d.saidas)}</span> : <span className={styles.traco}>—</span> },
    {
      key: 'liquido', label: 'Líquido',
      render: d => (
        <span className={`${styles.valor} ${d.liquido >= 0 ? styles.pos : styles.neg}`}>
          {d.liquido >= 0 ? '+' : ''}{formatarReais(d.liquido)}
        </span>
      ),
    },
    {
      key: 'projetado', label: 'Saldo projetado',
      render: d => (
        <span className={`${styles.valor} ${d.projetado < 0 ? styles.neg : ''}`}>{formatarReais(d.projetado)}</span>
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
        <div className={styles.rodapeTabela}>
          <div className={styles.resumo}>
            <span className={styles.resumoItem}>Saldo atual <strong>{formatarReais(saldoBase)}</strong></span>
            <span className={styles.resumoItem}>Entradas <strong className={styles.pos}>{formatarReais(totalEntradas)}</strong></span>
            <span className={styles.resumoItem}>Saídas <strong className={styles.neg}>{formatarReais(totalSaidas)}</strong></span>
            <span className={`${styles.resumoItem} ${styles.resumoDireita}`}>Projetado <strong>{formatarReais(projetado)}</strong></span>
          </div>
          <div className={styles.rodapePaginacao}>
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

// ── 3. Contas a Pagar ────────────────────────────────────────────────────────
function PagarTab() {
  const toast = useToast()
  const { data: contas, isLoading } = useContasPagar()
  const { mutate: baixar, isPending: baixando } = useBaixarContaPagar()
  const { mutate: cancelar } = useCancelarContaPagar()

  const lista = contas ?? []
  const pag = usePagination(lista)

  const [aBaixar, setABaixar] = useState<ContaPagar | null>(null)
  const [aCancelar, setACancelar] = useState<ContaPagar | null>(null)

  if (isLoading) return <PageLoader />

  const emAberto = (c: ContaPagar) => c.status === 'pendente' || c.status === 'vencido'
  const aPagar = lista.filter(emAberto).reduce((s, c) => s + c.valor, 0)
  const pago   = lista.filter(c => c.status === 'pago').reduce((s, c) => s + (c.valorPago ?? c.valor), 0)

  const columns: TableColumn<ContaPagar>[] = [
    { key: 'descricao',  label: 'Descrição', render: c => <span className={styles.celulaForte}>{c.descricao}</span> },
    { key: 'categoria',  label: 'Categoria' },
    { key: 'vencimento', label: 'Vencimento' },
    { key: 'pagamento',  label: 'Pagamento', render: c => c.pagamento ?? '—' },
    { key: 'fornecedor', label: 'Fornecedor' },
    { key: 'valor',      label: 'Valor', render: c => <span className={styles.valor}>{formatarReais(c.valor)}</span> },
    { key: 'status',     label: 'Status', render: c => <Badge status={c.status} /> },
    {
      key: 'acoes', label: '',
      render: c => emAberto(c) && (
        <span className={styles.acoes}>
          <button
            type="button"
            className={`${styles.acaoBtn} ${styles['acaoBtn--confirmar']}`}
            title="Dar baixa"
            aria-label={`Dar baixa em ${c.descricao}`}
            onClick={() => setABaixar(c)}
          >
            <IconCheck />
          </button>
          <button
            type="button"
            className={`${styles.acaoBtn} ${styles['acaoBtn--cancelar']}`}
            title="Cancelar"
            aria-label={`Cancelar ${c.descricao}`}
            onClick={() => setACancelar(c)}
          >
            <IconX />
          </button>
        </span>
      ),
    },
  ]

  return (
    <>
    <Table
      columns={columns}
      data={pag.visiveis}
      rowKey={c => c.id}
      emptyMessage="Nenhuma conta a pagar."
      toolbar={<PerPageSelect porPagina={pag.porPagina} onChange={pag.mudarPorPagina} />}
      footer={
        <div className={styles.rodapeTabela}>
          <div className={styles.resumo}>
            <span className={styles.resumoItem}>A pagar <strong className={styles.neg}>{formatarReais(aPagar)}</strong></span>
            <span className={styles.resumoItem}>Pago <strong className={styles.pos}>{formatarReais(pago)}</strong></span>
            <span className={`${styles.resumoItem} ${styles.resumoDireita}`}>Registros <strong>{lista.length}</strong></span>
          </div>
          <div className={styles.rodapePaginacao}>
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

    {/* ── Modal: dar baixa (desenho do neo) ── */}
    {aBaixar && (
      <SettleModal
        key={aBaixar.id}
        titulo="Confirmar Pagamento"
        confirmLabel="Confirmar Pagamento"
        dataLabel="Data do pagamento"
        valorLabel="Valor pago"
        hintValor="Altere apenas se diferente do valor original."
        valorInicial={aBaixar.valor}
        confirmando={baixando}
        onClose={() => setABaixar(null)}
        onConfirm={baixa =>
          baixar(
            { id: aBaixar.id, baixa },
            { onSuccess: () => { toast.success('Pagamento confirmado!'); setABaixar(null) } },
          )
        }
      />
    )}

    {/* ── Cancelar despesa ── */}
    <ConfirmDialog
      open={aCancelar !== null}
      onClose={() => setACancelar(null)}
      onConfirm={() => {
        if (aCancelar) cancelar(aCancelar.id, { onSuccess: () => toast.success('Despesa cancelada.') })
      }}
      title="Cancelar Despesa"
      message={aCancelar ? `Deseja cancelar "${aCancelar.descricao}"?` : ''}
      variant="danger"
    />
    </>
  )
}

// ── 4. Contas a Receber ──────────────────────────────────────────────────────
function ReceberTab() {
  const toast = useToast()
  const { data: contas, isLoading } = useContasReceber()
  const { mutate: baixar, isPending: baixando } = useBaixarContaReceber()
  const { mutate: cancelar } = useCancelarContaReceber()

  const lista = contas ?? []
  const pag = usePagination(lista)

  const [aBaixar, setABaixar] = useState<ContaReceber | null>(null)
  const [aCancelar, setACancelar] = useState<ContaReceber | null>(null)

  if (isLoading) return <PageLoader />

  const emAberto = (c: ContaReceber) => c.status === 'pendente' || c.status === 'vencido'
  // Restante = líquido − o que já foi recebido (baixas parciais).
  const restanteDe = (c: ContaReceber) => c.valorBruto - c.taxa - (c.valorRecebido ?? 0)
  const aReceber = lista.filter(emAberto).reduce((s, c) => s + restanteDe(c), 0)
  const recebido = lista.reduce((s, c) => s + (c.valorRecebido ?? (c.status === 'pago' ? c.valorBruto - c.taxa : 0)), 0)

  const columns: TableColumn<ContaReceber>[] = [
    { key: 'descricao',   label: 'Descrição', render: c => <span className={styles.celulaForte}>{c.descricao}</span> },
    { key: 'vencimento',  label: 'Vencimento' },
    { key: 'recebimento', label: 'Recebimento', render: c => c.recebimento ?? '—' },
    { key: 'forma',       label: 'Forma', render: c => c.forma ? TIPO_PAGAMENTO_LABEL[c.forma] : '—' },
    { key: 'origem',      label: 'Origem' },
    { key: 'bruto',       label: 'Bruto', render: c => <span className={styles.valor}>{formatarReais(c.valorBruto)}</span> },
    { key: 'taxa',        label: 'Taxa', render: c => c.taxa > 0 ? <span className={styles.neg}>{formatarReais(c.taxa)}</span> : <span className={styles.traco}>—</span> },
    {
      key: 'liquido', label: 'Líquido',
      // Como no neo: a coluna mostra o RESTANTE a receber (líquido − parciais).
      render: c => <span className={`${styles.valor} ${styles.pos}`}>{formatarReais(Math.max(restanteDe(c), 0))}</span>,
    },
    { key: 'status',      label: 'Status', render: c => <Badge status={c.status} /> },
    {
      key: 'acoes', label: '',
      render: c => emAberto(c) && (
        <span className={styles.acoes}>
          <button
            type="button"
            className={`${styles.acaoBtn} ${styles['acaoBtn--confirmar']}`}
            title="Dar baixa"
            aria-label={`Dar baixa em ${c.descricao}`}
            onClick={() => setABaixar(c)}
          >
            <IconCheck />
          </button>
          <button
            type="button"
            className={`${styles.acaoBtn} ${styles['acaoBtn--cancelar']}`}
            title="Cancelar"
            aria-label={`Cancelar ${c.descricao}`}
            onClick={() => setACancelar(c)}
          >
            <IconX />
          </button>
        </span>
      ),
    },
  ]

  return (
    <>
    <Table
      columns={columns}
      data={pag.visiveis}
      rowKey={c => c.id}
      emptyMessage="Nenhuma conta a receber."
      toolbar={<PerPageSelect porPagina={pag.porPagina} onChange={pag.mudarPorPagina} />}
      footer={
        <div className={styles.rodapeTabela}>
          <div className={styles.resumo}>
            <span className={styles.resumoItem}>A receber <strong className={styles.pos}>{formatarReais(aReceber)}</strong></span>
            <span className={styles.resumoItem}>Recebido <strong>{formatarReais(recebido)}</strong></span>
            <span className={`${styles.resumoItem} ${styles.resumoDireita}`}>Registros <strong>{lista.length}</strong></span>
          </div>
          <div className={styles.rodapePaginacao}>
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

    {/* ── Modal: dar baixa (recebimento parcial mantém a conta em aberto) ── */}
    {aBaixar && (
      <SettleModal
        key={aBaixar.id}
        titulo="Confirmar Recebimento"
        confirmLabel="Confirmar Recebimento"
        dataLabel="Data do recebimento"
        valorLabel="Valor recebido"
        hintValor="Recebimento parcial mantém a conta em aberto com o restante."
        valorInicial={Math.max(restanteDe(aBaixar), 0)}
        confirmando={baixando}
        onClose={() => setABaixar(null)}
        onConfirm={baixa =>
          baixar(
            { id: aBaixar.id, baixa },
            { onSuccess: () => { toast.success('Recebimento registrado!'); setABaixar(null) } },
          )
        }
      />
    )}

    {/* ── Cancelar recebimento ── */}
    <ConfirmDialog
      open={aCancelar !== null}
      onClose={() => setACancelar(null)}
      onConfirm={() => {
        if (aCancelar) cancelar(aCancelar.id, { onSuccess: () => toast.success('Recebimento cancelado.') })
      }}
      title="Cancelar Recebimento"
      message={aCancelar ? `Deseja cancelar "${aCancelar.descricao}"?` : ''}
      variant="danger"
    />
    </>
  )
}

// ── 5. Contas bancárias: lista lateral + formulário (desenho do neo) ─────────
const TIPO_CONTA_LABEL: Record<TipoContaBancaria, string> = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  caixa:    'Caixa interno',
}

const OPCOES_TIPO_CONTA = (Object.keys(TIPO_CONTA_LABEL) as TipoContaBancaria[])
  .map(tipo => ({ value: tipo, label: TIPO_CONTA_LABEL[tipo] }))

interface ContaFormState {
  nome: string
  tipo: TipoContaBancaria
  banco: string
  agencia: string
  conta: string
  titular: string
  saldoTexto: string
  ativa: boolean
  observacoes: string
}

const CONTA_FORM_VAZIO: ContaFormState = {
  nome: '', tipo: 'corrente', banco: '', agencia: '', conta: '', titular: '',
  saldoTexto: '', ativa: true, observacoes: '',
}

function BancosTab() {
  const toast = useToast()
  const { data: contas, isLoading } = useContasBancarias()
  const { mutate: salvar, isPending: salvando } = useSalvarContaBancaria()

  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [nova, setNova] = useState(false)
  const [form, setForm] = useState<ContaFormState>(CONTA_FORM_VAZIO)
  const [erroNome, setErroNome] = useState('')

  if (isLoading) return <PageLoader />

  const lista = contas ?? []
  const formVisivel = selecionada !== null || nova
  const ehCaixaInterno = form.tipo === 'caixa'

  const items = lista.map(c => ({
    id: c.id,
    label: c.nome,
    sublabel: TIPO_CONTA_LABEL[c.tipo]
      + (c.banco ? ` · ${c.banco}` : '')
      + (c.ativa ? '' : ' · Inativa'),
  }))

  function set<K extends keyof ContaFormState>(campo: K, valor: ContaFormState[K]) {
    setForm(atual => ({ ...atual, [campo]: valor }))
    if (campo === 'nome') setErroNome('')
  }

  function selecionar(id: string) {
    const conta = lista.find(c => c.id === id)
    if (!conta) return
    setSelecionada(id)
    setNova(false)
    setErroNome('')
    setForm({
      nome: conta.nome,
      tipo: conta.tipo,
      banco: conta.banco ?? '',
      agencia: conta.agencia ?? '',
      conta: conta.conta ?? '',
      titular: conta.titular ?? '',
      saldoTexto: conta.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      ativa: conta.ativa,
      observacoes: conta.observacoes ?? '',
    })
  }

  function aoNova() {
    setSelecionada(null)
    setNova(true)
    setForm(CONTA_FORM_VAZIO)
    setErroNome('')
  }

  function aoCancelar() {
    setSelecionada(null)
    setNova(false)
    setForm(CONTA_FORM_VAZIO)
    setErroNome('')
  }

  function aoSalvar() {
    if (!form.nome.trim()) {
      setErroNome('Dê um nome à conta.')
      return
    }
    const saldo = parseReais(form.saldoTexto || '0')
    salvar(
      {
        id: selecionada,
        dados: {
          nome: form.nome.trim(),
          tipo: form.tipo,
          banco: ehCaixaInterno ? undefined : form.banco.trim() || undefined,
          agencia: ehCaixaInterno ? undefined : form.agencia.trim() || undefined,
          conta: ehCaixaInterno ? undefined : form.conta.trim() || undefined,
          titular: ehCaixaInterno ? undefined : form.titular.trim() || undefined,
          saldo: Number.isFinite(saldo) ? saldo : 0,
          ativa: form.ativa,
          observacoes: form.observacoes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Conta salva!')
          aoCancelar()
        },
      },
    )
  }

  return (
    <div className={styles.layout}>
      <SideList
        title="Contas"
        size="lg"
        items={items}
        selectedId={selecionada}
        onSelect={id => selecionar(String(id))}
        onAdd={aoNova}
        searchPlaceholder="Buscar conta..."
        emptyText="Nenhuma conta cadastrada"
      />

      <div className={styles.formArea}>
        {!formVisivel ? (
          <EmptyState
            title="Nenhuma conta selecionada"
            description="Selecione uma conta na lista ao lado ou crie uma nova clicando em +."
          />
        ) : (
          <>
            <div className={styles.formRoot}>
              <FormSection
                title="Dados da Conta"
                actions={<Toggle label="Status" checked={form.ativa} onChange={v => set('ativa', v)} />}
              >
                <div className={styles.fields}>
                  <div className={styles.fieldFull}>
                    <Input
                      label="Nome da conta"
                      placeholder="Ex.: Inter — Conta PJ, Caixa da recepção..."
                      value={form.nome}
                      onChange={e => set('nome', e.target.value)}
                      error={erroNome}
                    />
                  </div>
                  <Select
                    label="Tipo"
                    options={OPCOES_TIPO_CONTA}
                    value={form.tipo}
                    onChange={e => set('tipo', e.target.value as TipoContaBancaria)}
                  />
                  <Input
                    label="Saldo inicial"
                    iconLeft={<span className={styles.prefixo}>R$</span>}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form.saldoTexto}
                    onChange={e => set('saldoTexto', e.target.value)}
                  />
                </div>
              </FormSection>

              {!ehCaixaInterno && (
                <FormSection title="Dados Bancários">
                  <div className={styles.fields}>
                    <div className={styles.fieldFull}>
                      <Input label="Banco" placeholder="Ex.: Banco Inter, Itaú..." value={form.banco} onChange={e => set('banco', e.target.value)} />
                    </div>
                    <Input label="Agência" placeholder="0000" value={form.agencia} onChange={e => set('agencia', e.target.value)} />
                    <Input label="Conta" placeholder="00000-0" value={form.conta} onChange={e => set('conta', e.target.value)} />
                    <div className={styles.fieldFull}>
                      <Input label="Titular" placeholder="Razão social" value={form.titular} onChange={e => set('titular', e.target.value)} />
                    </div>
                  </div>
                </FormSection>
              )}

              <FormSection title="Observações">
                <Input label="Observações" placeholder="Opcional" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
              </FormSection>
            </div>

            {/* Ações no rodapé do formulário. */}
            <div className={styles.acoesBar}>
              <Button variant="ghost" onClick={aoCancelar} disabled={salvando}>Cancelar</Button>
              <Button loading={salvando} onClick={aoSalvar}>Salvar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── 6. Adquirentes: lista lateral + formulário (desenho do neo) ──────────────
const BANDEIRAS_DISPONIVEIS = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard', 'Diners']

/** '3,19' | '3.19' → número (percentuais dos formulários). */
function parsePercentual(texto: string) {
  return Number(texto.replace(',', '.'))
}

/** Editor de taxas por nº de parcelas (desenho do InstallmentTable do neo). */
function InstallmentsEditor({ rows, onChange }: { rows: TaxaParcela[]; onChange: (rows: TaxaParcela[]) => void }) {
  function adicionar() {
    const proxima = rows.length ? Math.max(...rows.map(r => r.parcelas)) + 1 : 2
    onChange([...rows, { parcelas: proxima, taxa: 0 }])
  }

  function remover(indice: number) {
    onChange(rows.filter((_, i) => i !== indice))
  }

  function mudar(indice: number, campo: keyof TaxaParcela, valor: number) {
    onChange(rows.map((r, i) => (i === indice ? { ...r, [campo]: valor } : r)))
  }

  return (
    <div className={styles.parcelas}>
      {rows.length > 0 && (
        <div className={styles.parcelaCabecalho}>
          <span>Parcelas</span>
          <span>Taxa (%)</span>
          <span />
        </div>
      )}

      {rows.map((row, i) => (
        <div key={i} className={styles.parcelaLinha}>
          <Input
            type="number"
            min={1}
            value={row.parcelas}
            onChange={e => mudar(i, 'parcelas', Number(e.target.value))}
            aria-label={`Número de parcelas da linha ${i + 1}`}
          />
          <Input
            type="number"
            min={0}
            step={0.01}
            value={row.taxa}
            onChange={e => mudar(i, 'taxa', Number(e.target.value))}
            aria-label={`Taxa da linha ${i + 1}`}
          />
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconX />}
            onClick={() => remover(i)}
            title="Remover parcela"
            aria-label={`Remover linha de ${row.parcelas} parcelas`}
          />
        </div>
      ))}

      {rows.length === 0 && <p className={styles.parcelaVazia}>Nenhuma parcela configurada.</p>}

      <div>
        <Button size="sm" variant="outline" onClick={adicionar}>+ Nova parcela</Button>
      </div>
    </div>
  )
}

interface AdquirenteFormState {
  nome: string
  ativa: boolean
  bandeiras: string[]
  taxaCreditoTexto: string
  taxaDebitoTexto: string
  taxasParcelas: TaxaParcela[]
  prazoTexto: string
  contaRepasseId: string
  observacoes: string
}

const ADQUIRENTE_FORM_VAZIO: AdquirenteFormState = {
  nome: '', ativa: true, bandeiras: [], taxaCreditoTexto: '', taxaDebitoTexto: '',
  taxasParcelas: [], prazoTexto: '1', contaRepasseId: '', observacoes: '',
}

function AdquirentesTab() {
  const toast = useToast()
  const { data: adquirentes, isLoading } = useAdquirentes()
  const { data: contas } = useContasBancarias()
  const { mutate: salvar, isPending: salvando } = useSalvarAdquirente()

  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [nova, setNova] = useState(false)
  const [form, setForm] = useState<AdquirenteFormState>(ADQUIRENTE_FORM_VAZIO)
  const [erroNome, setErroNome] = useState('')
  const [novaBandeira, setNovaBandeira] = useState('')

  if (isLoading) return <PageLoader />

  const lista = adquirentes ?? []
  const formVisivel = selecionada !== null || nova

  // Chips exibidos: as bandeiras conhecidas + qualquer custom já selecionada.
  const bandeirasExibidas = [
    ...BANDEIRAS_DISPONIVEIS,
    ...form.bandeiras.filter(b => !BANDEIRAS_DISPONIVEIS.includes(b)),
  ]

  const items = lista.map(a => ({
    id: a.id,
    label: a.nome,
    sublabel: `${a.bandeiras.length} bandeira(s) · D+${a.prazoRecebimento}`
      + (a.status === 'ativo' ? '' : ' · Inativa'),
  }))

  const opcoesConta = (contas ?? []).map(c => ({ value: c.id, label: c.nome }))

  function set<K extends keyof AdquirenteFormState>(campo: K, valor: AdquirenteFormState[K]) {
    setForm(atual => ({ ...atual, [campo]: valor }))
    if (campo === 'nome') setErroNome('')
  }

  function alternarBandeira(bandeira: string) {
    setForm(atual => ({
      ...atual,
      bandeiras: atual.bandeiras.includes(bandeira)
        ? atual.bandeiras.filter(b => b !== bandeira)
        : [...atual.bandeiras, bandeira],
    }))
  }

  /** Adiciona uma bandeira fora da lista padrão (já entra selecionada). */
  function adicionarBandeira() {
    const nome = novaBandeira.trim()
    if (!nome) return
    const existente = bandeirasExibidas.find(b => b.toLowerCase() === nome.toLowerCase())
    if (existente) {
      // Já conhecida: só garante a seleção, sem duplicar o chip.
      if (!form.bandeiras.includes(existente)) alternarBandeira(existente)
    } else {
      setForm(atual => ({ ...atual, bandeiras: [...atual.bandeiras, nome] }))
    }
    setNovaBandeira('')
  }

  function selecionar(id: string) {
    const adquirente = lista.find(a => a.id === id)
    if (!adquirente) return
    setSelecionada(id)
    setNova(false)
    setErroNome('')
    setNovaBandeira('')
    setForm({
      nome: adquirente.nome,
      ativa: adquirente.status === 'ativo',
      bandeiras: [...adquirente.bandeiras],
      taxaCreditoTexto: String(adquirente.taxaCredito).replace('.', ','),
      taxaDebitoTexto: String(adquirente.taxaDebito).replace('.', ','),
      taxasParcelas: (adquirente.taxasParcelas ?? []).map(t => ({ ...t })),
      prazoTexto: String(adquirente.prazoRecebimento),
      contaRepasseId: adquirente.contaRepasseId ?? '',
      observacoes: adquirente.observacoes ?? '',
    })
  }

  function aoNova() {
    setSelecionada(null)
    setNova(true)
    setForm(ADQUIRENTE_FORM_VAZIO)
    setErroNome('')
    setNovaBandeira('')
  }

  function aoCancelar() {
    setSelecionada(null)
    setNova(false)
    setForm(ADQUIRENTE_FORM_VAZIO)
    setErroNome('')
    setNovaBandeira('')
  }

  function aoSalvar() {
    if (!form.nome.trim()) {
      setErroNome('Dê um nome à adquirente.')
      return
    }
    const taxaCredito = parsePercentual(form.taxaCreditoTexto || '0')
    const taxaDebito  = parsePercentual(form.taxaDebitoTexto || '0')
    const prazo       = Number(form.prazoTexto || '1')
    salvar(
      {
        id: selecionada,
        dados: {
          nome: form.nome.trim(),
          bandeiras: form.bandeiras,
          taxaCredito: Number.isFinite(taxaCredito) ? taxaCredito : 0,
          taxaDebito: Number.isFinite(taxaDebito) ? taxaDebito : 0,
          // Só linhas válidas entram (parcelas ≥ 2 e taxa ≥ 0), ordenadas.
          taxasParcelas: form.taxasParcelas
            .filter(t => t.parcelas >= 2 && t.taxa >= 0)
            .sort((a, b) => a.parcelas - b.parcelas),
          prazoRecebimento: Number.isFinite(prazo) && prazo > 0 ? prazo : 1,
          contaRepasseId: form.contaRepasseId || undefined,
          status: form.ativa ? 'ativo' : 'inativo',
          observacoes: form.observacoes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Adquirente salva!')
          aoCancelar()
        },
      },
    )
  }

  return (
    <div className={styles.layout}>
      <SideList
        title="Adquirentes"
        size="lg"
        items={items}
        selectedId={selecionada}
        onSelect={id => selecionar(String(id))}
        onAdd={aoNova}
        searchPlaceholder="Buscar adquirente..."
        emptyText="Nenhuma adquirente cadastrada"
      />

      <div className={styles.formArea}>
        {!formVisivel ? (
          <EmptyState
            title="Nenhuma adquirente selecionada"
            description="Selecione uma adquirente na lista ao lado ou crie uma nova clicando em +."
          />
        ) : (
          <>
            <div className={styles.formRoot}>
              <FormSection
                title="Dados da Adquirente"
                actions={<Toggle label="Status" checked={form.ativa} onChange={v => set('ativa', v)} />}
              >
                <div className={styles.fields}>
                  <div className={styles.fieldFull}>
                    <Input
                      label="Nome da adquirente / maquininha"
                      placeholder="Ex.: Stone, Cielo, PagBank..."
                      value={form.nome}
                      onChange={e => set('nome', e.target.value)}
                      error={erroNome}
                    />
                  </div>
                  <Select
                    label="Conta de repasse"
                    placeholder="Selecione a conta..."
                    options={opcoesConta}
                    value={form.contaRepasseId}
                    onChange={e => set('contaRepasseId', e.target.value)}
                  />
                  <Input
                    label="Prazo de repasse (D+N)"
                    type="number"
                    min={1}
                    hint="Dias até o dinheiro cair (1 = D+1)."
                    value={form.prazoTexto}
                    onChange={e => set('prazoTexto', e.target.value)}
                  />
                </div>
              </FormSection>

              <FormSection title="Bandeiras e Taxas">
                <div className={styles.fields}>
                  <div className={styles.fieldFull}>
                    <span className={styles.subLabel}>Bandeiras aceitas</span>
                    <div className={styles.chips} role="group" aria-label="Bandeiras aceitas">
                      {bandeirasExibidas.map(b => (
                        <button
                          key={b}
                          type="button"
                          className={`${styles.chip} ${form.bandeiras.includes(b) ? styles['chip--ativa'] : ''}`}
                          aria-pressed={form.bandeiras.includes(b)}
                          onClick={() => alternarBandeira(b)}
                        >
                          {b}
                        </button>
                      ))}
                    </div>

                    {/* Bandeira fora da lista: digitar e adicionar (entra selecionada). */}
                    <div className={styles.novaBandeira}>
                      <Input
                        size="sm"
                        placeholder="Outra bandeira..."
                        value={novaBandeira}
                        onChange={e => setNovaBandeira(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarBandeira() } }}
                        aria-label="Nova bandeira"
                      />
                      <Button size="sm" variant="outline" onClick={adicionarBandeira} disabled={!novaBandeira.trim()}>
                        + Adicionar
                      </Button>
                    </div>
                  </div>
                  <Input
                    label="Taxa crédito à vista (%)"
                    inputMode="decimal"
                    placeholder="3,19"
                    value={form.taxaCreditoTexto}
                    onChange={e => set('taxaCreditoTexto', e.target.value)}
                  />
                  <Input
                    label="Taxa débito (%)"
                    inputMode="decimal"
                    placeholder="1,45"
                    value={form.taxaDebitoTexto}
                    onChange={e => set('taxaDebitoTexto', e.target.value)}
                  />

                  <div className={styles.fieldFull}>
                    <span className={styles.subLabel}>Crédito parcelado — taxa (%) por nº de parcelas</span>
                    <InstallmentsEditor
                      rows={form.taxasParcelas}
                      onChange={rows => set('taxasParcelas', rows)}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Observações">
                <Input label="Observações" placeholder="Opcional" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
              </FormSection>
            </div>

            {/* Ações no rodapé do formulário. */}
            <div className={styles.acoesBar}>
              <Button variant="ghost" onClick={aoCancelar} disabled={salvando}>Cancelar</Button>
              <Button loading={salvando} onClick={aoSalvar}>Salvar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
