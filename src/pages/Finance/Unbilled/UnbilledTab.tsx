import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { IconFinance } from '@/components/icons'
import { useSession } from '@/context/SessionProvider'
import { useUnbilledSessions } from '@/hooks/useFinance'
import { usePagination } from '@/hooks/usePagination'
import { useProfessionalName } from '@/hooks/useDisplayNames'
import { formatBRL } from '@/utils/format'
import type { UnbilledSession } from '@/types/domain'
import { BillSessionModal } from './BillSessionModal'
import styles from './UnbilledTab.module.scss'
import shared from '../shared/finance.module.scss'

/**
 * Aba "A faturar" — a REDE DE SEGURANÇA do módulo financeiro.
 *
 * Procedimento executado, com valor, que não virou título nem foi abatido de um
 * contrato. Desde que salvar um procedimento gera o recebível no mesmo commit,
 * cair aqui é exceção, e as exceções têm nome:
 *  · paciente de CONVÊNIO — a trava que impede cobrar 100% do particular
 *    automaticamente (o dia em que cobrar o paciente errado vira escala);
 *  · procedimento ANTERIOR à regra, que ninguém mandou cobrar.
 *
 * A lista lê a RPC unbilled_sessions (definer) porque cruza prontuário ×
 * financeiro: sem ela, quem cuida do dinheiro precisaria de acesso ao
 * prontuário inteiro para ver uma lista de valores em aberto.
 */
export function UnbilledTab() {
  const { canEdit } = useSession()
  const { data: sessions, isLoading } = useUnbilledSessions()
  const professionalName = useProfessionalName()

  const [toBill, setToBill] = useState<UnbilledSession | null>(null)

  const list = sessions ?? []
  const pagination = usePagination(list)
  const total = list.reduce((sum, s) => sum + s.amount, 0)

  if (isLoading) return <PageLoader />

  const columns: TableColumn<UnbilledSession>[] = [
    { key: 'date', label: 'Executado em' },
    { key: 'patient', label: 'Paciente', render: s => <span className={shared.celulaForte}>{s.patientName}</span> },
    {
      key: 'description', label: 'Procedimento',
      render: s => (
        <span className={styles.procedimento}>
          <span>{s.description}</span>
          <span className={shared.contagem}>{s.treatmentName}</span>
        </span>
      ),
    },
    {
      key: 'professional', label: 'Profissional',
      // Sessão sem autor existe (lançada pela recepção): traço, não vazio.
      render: s => s.professionalId ? professionalName(s.professionalId) : <span className={shared.traco}>—</span>,
    },
    {
      key: 'why', label: 'Por quê',
      // O motivo é a informação mais importante da linha: 'Contrato quitado'
      // significa "confira ANTES de cobrar, o paciente já pagou um plano".
      // Deduzir o motivo por hasInsurance mostrava "Sem contrato" justamente
      // onde existe contrato — e mandava cobrar de novo.
      render: s => s.pendingQuoteCode
        ? <Badge status="pending" label={`Contrato ${s.pendingQuoteCode} quitado`} />
        : s.hasInsurance
          ? <Badge status="pending" label="Convênio" />
          : <span className={shared.contagem}>Sem contrato</span>,
    },
    { key: 'amount', label: 'Valor', render: s => <span className={shared.valor}>{formatBRL(s.amount)}</span> },
    {
      key: 'actions', label: 'Ação',
      render: s => canEdit('finance') && (
        <Button size="sm" variant="secondary" iconLeft={<IconFinance />} onClick={() => setToBill(s)}>
          Faturar
        </Button>
      ),
    },
  ]

  return (
    <>
      <Table
        columns={columns}
        data={pagination.visible}
        rowKey={s => s.id}
        emptyMessage="Nada a faturar — todo procedimento executado já virou cobrança ou contrato. 🎉"
        toolbar={<PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />}
        footer={
          <div className={shared.rodapeTabela}>
            <div className={shared.resumo}>
              <span className={shared.resumoItem}>
                Produzido e não cobrado <strong className={shared.neg}>{formatBRL(total)}</strong>
              </span>
              <span className={`${shared.resumoItem} ${shared.resumoDireita}`}>
                Procedimentos <strong>{list.length}</strong>
              </span>
            </div>
            <div className={shared.rodapePaginacao}>
              <Pagination
                page={pagination.currentPage}
                totalPages={pagination.totalPages}
                onChange={pagination.setPage}
                totalItems={pagination.total}
                itemsPerPage={pagination.perPage}
              />
            </div>
          </div>
        }
      />

      {toBill && <BillSessionModal session={toBill} onClose={() => setToBill(null)} />}
    </>
  )
}
