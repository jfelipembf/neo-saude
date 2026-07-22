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
import { useCashMovements, useCashSession, useOpenCash, useCloseCash } from '@/hooks/useFinance'
import { usePagination } from '@/hooks/usePagination'
import { formatBRL, parseBRL } from '@/utils/format'
import type { CashMovement } from '@/types/domain'
import shared from '../shared/finance.module.scss'
import styles from './CashTab.module.scss'

/** Aba "Caixa": abrir/fechar o turno + resumo e movimentos do dia. */
export function CashTab() {
  const toast = useToast()
  const { data: session, isLoading: sessionLoading } = useCashSession()
  const { data: movements, isLoading: movementsLoading } = useCashMovements()
  const { mutate: openCash, isPending: opening } = useOpenCash()
  const { mutate: closeCash, isPending: closing } = useCloseCash()

  const list = movements ?? []
  const pagination = usePagination(list)

  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [openingText, setOpeningText] = useState('')
  const [countText, setCountText] = useState('')
  const [amountError, setAmountError] = useState('')

  if (sessionLoading || movementsLoading) return <PageLoader />

  const inflows = list.filter(m => m.type === 'inflow').reduce((s, m) => s + m.amount, 0)
  const outflows = list.filter(m => m.type === 'outflow').reduce((s, m) => s + m.amount, 0)
  const openingAmount = session?.openingAmount ?? 0
  const shiftBalance = openingAmount + inflows - outflows

  function handleOpenCash() {
    const amount = parseBRL(openingText || '0')
    if (!Number.isFinite(amount) || amount < 0) {
      setAmountError('Informe um valor válido.')
      return
    }
    openCash(amount, {
      onSuccess: () => {
        toast.success('Caixa aberto!')
        setShowOpenModal(false)
        setOpeningText('')
        setAmountError('')
      },
    })
  }

  function handleCloseCash() {
    closeCash(undefined, {
      onSuccess: () => {
        toast.success('Caixa fechado!')
        setShowCloseModal(false)
        setCountText('')
      },
    })
  }

  const columns: TableColumn<CashMovement>[] = [
    { key: 'nome',       label: 'Nome', render: m => <span className={shared.celulaForte}>{m.name}</span> },
    { key: 'forma',      label: 'Forma de pagamento', render: m => m.paymentMethod ?? '—' },
    { key: 'description',  label: 'Descrição' },
    { key: 'postedAt', label: 'Lançamento' },
    {
      key: 'valor', label: 'Valor',
      render: m => (
        <span className={`${shared.valor} ${m.type === 'inflow' ? shared.pos : shared.neg}`}>
          {m.type === 'inflow' ? '+' : '−'}{formatBRL(m.amount)}
        </span>
      ),
    },
  ]

  return (
    <div className={styles.aba}>
      {!session?.isOpen ? (
        <EmptyState
          title="Caixa fechado"
          description="Abra o caixa para registrar as movimentações do dia."
          action={<Button onClick={() => setShowOpenModal(true)}>Abrir Caixa</Button>}
        />
      ) : (
        <>
          {/* Cabeçalho do turno: operador + estatísticas inline. */}
          <div className={styles.turnoBar}>
            <div className={styles.caixaInfo}>
              <span className={styles.caixaOperador}>{session.operator?.toUpperCase()}</span>
              <span className={styles.caixaAbertura}>Caixa aberto em {session.openedAt}</span>
            </div>

            <div className={styles.turnoStats}>
              <div className={styles.turnoStat}>
                <span className={styles.turnoLabel}>Valor inicial</span>
                <span className={styles.turnoValor}>{formatBRL(openingAmount)}</span>
              </div>
              <div className={styles.turnoStat}>
                <span className={styles.turnoLabel}>Entradas</span>
                <span className={`${styles.turnoValor} ${styles['turnoValor--entrada']}`}>{formatBRL(inflows)}</span>
              </div>
              <div className={styles.turnoStat}>
                <span className={styles.turnoLabel}>Saídas</span>
                <span className={`${styles.turnoValor} ${styles['turnoValor--saida']}`}>{formatBRL(outflows)}</span>
              </div>
              <div className={styles.turnoStat}>
                <span className={styles.turnoLabel}>Saldo do turno</span>
                <span className={`${styles.turnoValor} ${styles['turnoValor--saldo']}`}>{formatBRL(shiftBalance)}</span>
              </div>
            </div>

            <Button variant="danger" loading={closing} onClick={() => setShowCloseModal(true)}>
              Fechar Caixa
            </Button>
          </div>

          <Table
            columns={columns}
            data={pagination.visible}
            rowKey={m => m.id}
            emptyMessage="Nenhum movimento no caixa de hoje."
            toolbar={<PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />}
            footer={
              <Pagination
                page={pagination.currentPage}
                totalPages={pagination.totalPages}
                onChange={pagination.setPage}
                totalItems={pagination.total}
                itemsPerPage={pagination.perPage}
              />
            }
          />
        </>
      )}

      {/* ── Abertura de Caixa ── */}
      <Modal
        open={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        title="Abertura de Caixa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowOpenModal(false)} disabled={opening}>Cancelar</Button>
            <Button loading={opening} onClick={handleOpenCash}>Abrir Caixa</Button>
          </>
        }
      >
        <Input
          label="Fundo de troco inicial"
          iconLeft={<span className={shared.prefixo}>R$</span>}
          inputMode="decimal"
          placeholder="0,00"
          value={openingText}
          onChange={e => { setOpeningText(e.target.value); setAmountError('') }}
          error={amountError}
          hint="Valor em dinheiro disponível na gaveta ao iniciar o dia."
          autoFocus
        />
      </Modal>

      {/* ── Fechamento de Caixa ── */}
      <Modal
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Fechamento de Caixa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCloseModal(false)} disabled={closing}>Revisar</Button>
            <Button variant="danger" loading={closing} onClick={handleCloseCash}>Confirmar fechamento</Button>
          </>
        }
      >
        <div className={styles.modalCorpo}>
          <p className={styles.modalDica}>
            Informe o valor contado fisicamente na gaveta. O saldo esperado do turno é{' '}
            <strong>{formatBRL(shiftBalance)}</strong> — divergências ficam registradas no fechamento.
          </p>
          <Input
            label="Contagem da gaveta"
            iconLeft={<span className={shared.prefixo}>R$</span>}
            inputMode="decimal"
            placeholder="0,00"
            value={countText}
            onChange={e => setCountText(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  )
}
