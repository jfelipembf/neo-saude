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
import { useContasReceber, useBaixarContaReceber, useCancelarContaReceber } from '@/hooks/useFinanceiro'
import { usePagination } from '@/hooks/usePagination'
import { TIPO_PAGAMENTO_LABEL } from '@/constants'
import { formatarReais } from '@/utils/format'
import type { Receivable } from '@/types/domain'
import { SettleModal } from '../shared/SettleModal'
import shared from '../shared/finance.module.scss'

/** Restante a receber = líquido − o que já entrou (baixas parciais). */
function restanteDe(c: Receivable) {
  return c.valorBruto - c.taxa - (c.valorRecebido ?? 0)
}

/** Aba "Contas a Receber": listagem, baixa (inclusive parcial) e cancelamento. */
export function ReceivableTab() {
  const toast = useToast()
  const { data: contas, isLoading } = useContasReceber()
  const { mutate: baixar, isPending: baixando } = useBaixarContaReceber()
  const { mutate: cancelar } = useCancelarContaReceber()

  const lista = contas ?? []
  const pag = usePagination(lista)

  const [aBaixar, setABaixar] = useState<Receivable | null>(null)
  const [aCancelar, setACancelar] = useState<Receivable | null>(null)

  if (isLoading) return <PageLoader />

  const emAberto = (c: Receivable) => c.status === 'pendente' || c.status === 'vencido'
  const aReceber = lista.filter(emAberto).reduce((s, c) => s + restanteDe(c), 0)
  const recebido = lista.reduce((s, c) => s + (c.valorRecebido ?? (c.status === 'pago' ? c.valorBruto - c.taxa : 0)), 0)

  const columns: TableColumn<Receivable>[] = [
    { key: 'descricao',   label: 'Descrição', render: c => <span className={shared.celulaForte}>{c.descricao}</span> },
    { key: 'vencimento',  label: 'Vencimento' },
    { key: 'recebimento', label: 'Recebimento', render: c => c.recebimento ?? '—' },
    { key: 'forma',       label: 'Forma', render: c => c.forma ? TIPO_PAGAMENTO_LABEL[c.forma] : '—' },
    { key: 'origem',      label: 'Origem' },
    { key: 'bruto',       label: 'Bruto', render: c => <span className={shared.valor}>{formatarReais(c.valorBruto)}</span> },
    { key: 'taxa',        label: 'Taxa', render: c => c.taxa > 0 ? <span className={shared.neg}>{formatarReais(c.taxa)}</span> : <span className={shared.traco}>—</span> },
    {
      key: 'liquido', label: 'Líquido',
      // A coluna mostra o RESTANTE a receber (líquido − parciais).
      render: c => <span className={`${shared.valor} ${shared.pos}`}>{formatarReais(Math.max(restanteDe(c), 0))}</span>,
    },
    { key: 'status',      label: 'Status', render: c => <Badge status={c.status} /> },
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
        emptyMessage="Nenhuma conta a receber."
        toolbar={<PerPageSelect porPagina={pag.porPagina} onChange={pag.mudarPorPagina} />}
        footer={
          <div className={shared.rodapeTabela}>
            <div className={shared.resumo}>
              <span className={shared.resumoItem}>A receber <strong className={shared.pos}>{formatarReais(aReceber)}</strong></span>
              <span className={shared.resumoItem}>Recebido <strong>{formatarReais(recebido)}</strong></span>
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
