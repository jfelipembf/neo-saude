import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Badge } from '@/components/Badge/Badge'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useToast } from '@/components/Toast/useToast'
import { IconCheck, IconX } from '@/components/icons'
import { useContasPagar, useBaixarContaPagar, useCancelarContaPagar } from '@/hooks/useFinanceiro'
import { usePagination } from '@/hooks/usePagination'
import { formatarReais } from '@/utils/format'
import type { Payable } from '@/types/domain'
import { SettleModal } from '../shared/SettleModal'
import shared from '../shared/finance.module.scss'

/** Aba "Contas a Pagar": listagem, baixa e cancelamento de despesas. */
export function PayableTab() {
  const toast = useToast()
  const { data: contas, isLoading } = useContasPagar()
  const { mutate: baixar, isPending: baixando } = useBaixarContaPagar()
  const { mutate: cancelar } = useCancelarContaPagar()

  const lista = contas ?? []
  const pag = usePagination(lista)

  const [aBaixar, setABaixar] = useState<Payable | null>(null)
  const [aCancelar, setACancelar] = useState<Payable | null>(null)

  if (isLoading) return <PageLoader />

  const emAberto = (c: Payable) => c.status === 'pendente' || c.status === 'vencido'
  const aPagar = lista.filter(emAberto).reduce((s, c) => s + c.valor, 0)
  const pago   = lista.filter(c => c.status === 'pago').reduce((s, c) => s + (c.valorPago ?? c.valor), 0)

  const columns: TableColumn<Payable>[] = [
    { key: 'descricao',  label: 'Descrição', render: c => <span className={shared.celulaForte}>{c.descricao}</span> },
    { key: 'categoria',  label: 'Categoria' },
    { key: 'vencimento', label: 'Vencimento' },
    { key: 'pagamento',  label: 'Pagamento', render: c => c.pagamento ?? '—' },
    { key: 'fornecedor', label: 'Fornecedor' },
    { key: 'valor',      label: 'Valor', render: c => <span className={shared.valor}>{formatarReais(c.valor)}</span> },
    { key: 'status',     label: 'Status', render: c => <Badge status={c.status} /> },
    {
      key: 'acoes', label: 'Ação',
      render: c => emAberto(c) && (
        <span className={shared.acoes}>
          <button
            type="button"
            className={`${shared.acaoBtn} ${shared['acaoBtn--confirmar']}`}
            title="Dar baixa"
            aria-label={`Dar baixa em ${c.descricao}`}
            onClick={() => setABaixar(c)}
          >
            <IconCheck />
          </button>
          <button
            type="button"
            className={`${shared.acaoBtn} ${shared['acaoBtn--cancelar']}`}
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
          <div className={shared.rodapeTabela}>
            <div className={shared.resumo}>
              <span className={shared.resumoItem}>A pagar <strong className={shared.neg}>{formatarReais(aPagar)}</strong></span>
              <span className={shared.resumoItem}>Pago <strong className={shared.pos}>{formatarReais(pago)}</strong></span>
              <span className={`${shared.resumoItem} ${shared.resumoDireita}`}>Registros <strong>{lista.length}</strong></span>
            </div>
            <div className={shared.rodapePaginacao}>
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

      {/* ── Modal: dar baixa ── */}
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
