import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useToast } from '@/components/Toast/useToast'
import { useMovimentosCaixa, useCaixaSessao, useAbrirCaixa, useFecharCaixa } from '@/hooks/useFinanceiro'
import { usePagination } from '@/hooks/usePagination'
import { formatarReais, parseReais } from '@/utils/format'
import type { CashMovement } from '@/types/domain'
import shared from '../shared/finance.module.scss'
import styles from './CashTab.module.scss'

/** Aba "Caixa": abrir/fechar o turno + resumo e movimentos do dia. */
export function CashTab() {
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

  const columns: TableColumn<CashMovement>[] = [
    { key: 'nome',       label: 'Nome', render: m => <span className={shared.celulaForte}>{m.nome}</span> },
    { key: 'forma',      label: 'Forma de pagamento', render: m => m.formaPagamento ?? '—' },
    { key: 'descricao',  label: 'Descrição' },
    { key: 'lancamento', label: 'Lançamento' },
    {
      key: 'valor', label: 'Valor',
      render: m => (
        <span className={`${shared.valor} ${m.tipo === 'entrada' ? shared.pos : shared.neg}`}>
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
          {/* Cabeçalho do turno: operador + estatísticas inline. */}
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
          iconLeft={<span className={shared.prefixo}>R$</span>}
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
            iconLeft={<span className={shared.prefixo}>R$</span>}
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
