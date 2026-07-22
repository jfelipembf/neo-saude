import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Button } from '@/components/Button/Button'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useToast } from '@/components/Toast/useToast'
import { usePagination } from '@/hooks/usePagination'
import { IconMessage } from '@/components/icons'
import { useReceivables, useCollectionAttempts, useAddCollectionAttempt } from '@/hooks/useFinance'
import { usePatients } from '@/hooks/usePatients'
import { useClinic } from '@/hooks/useClinic'
import { useAutomations } from '@/hooks/useWhatsApp'
import { formatBRL } from '@/utils/format'
import { parseBrDate, toShortDateWithYear } from '@/utils/date'
import { digitsOnly } from '@/utils/text'
import { fillTemplate } from '@/utils/messageTemplate'
import type { Receivable } from '@/types/domain'
import shared from '../shared/finance.module.scss'

/** Débitos de um paciente, agrupados para a cobrança (é o paciente que
 *  recebe a mensagem, não cada parcela separada). */
interface DebtorGroup {
  patientId: string
  patientName: string
  phone: string
  items: Receivable[]
  total: number
  oldestDueDate: string   // dd/mm/aaaa — a mais antiga, para o {data} do template
}

/** Aba "Inadimplência": vencidos agrupados por paciente, cobrança via
 *  WhatsApp (reaproveita o template configurado em Automações) e a trilha
 *  de tentativas já feitas. */
export function DelinquencyTab() {
  const toast = useToast()
  const { data: receivables, isLoading: loadingReceivables } = useReceivables()
  const { data: patients, isLoading: loadingPatients } = usePatients()
  const { data: clinic } = useClinic()
  const { data: automations } = useAutomations()
  const { data: attempts } = useCollectionAttempts()
  const { mutate: addAttempt } = useAddCollectionAttempt()

  const patientById = new Map((patients ?? []).map(p => [p.id, p]))
  const billingTemplate = automations?.find(a => a.trigger === 'billing')?.message
    ?? 'Olá, {paciente}. Consta um saldo em aberto de {valor}, com vencimento em {data}.'

  /**
   * 🚨 `debtor === 'payer'` é a trava do cartão NESTA TELA, e ela é cinto por
   * cima do suspensório: o CHECK receivable_acquirer_never_overdue_ck já impede
   * que um título de maquininha fique 'overdue', e a rotina diária pula esses
   * títulos. Mesmo assim o filtro está escrito aqui, porque esta é a tela que
   * dispara mensagem de cobrança para o paciente — e cobrar alguém por uma
   * venda que a adquirente já garantiu não é um bug de listagem, é o cliente
   * do nosso cliente sendo constrangido por uma dívida que ele não tem.
   */
  const overdue = (receivables ?? []).filter(
    r => r.status === 'overdue' && r.debtor === 'payer' && r.patientId,
  )

  const groups = new Map<string, DebtorGroup>()
  for (const r of overdue) {
    const patient = patientById.get(r.patientId!)
    if (!patient) continue
    const group = groups.get(patient.id) ?? {
      patientId: patient.id, patientName: patient.name,
      phone: patient.whatsapp ?? patient.phone,
      items: [], total: 0, oldestDueDate: r.dueDate,
    }
    group.items.push(r)
    group.total += r.grossAmount - r.fee - (r.receivedAmount ?? 0)
    if (parseBrDate(r.dueDate) < parseBrDate(group.oldestDueDate)) group.oldestDueDate = r.dueDate
    groups.set(patient.id, group)
  }

  const rows = [...groups.values()].sort((a, b) => b.total - a.total)
  const totalOverdue = rows.reduce((s, g) => s + g.total, 0)
  const pagination = usePagination(rows)

  if (loadingReceivables || loadingPatients) return <PageLoader />

  function attemptsOf(patientId: string) {
    return (attempts ?? []).filter(a => a.patientId === patientId).sort((a, b) => parseBrDate(b.date).getTime() - parseBrDate(a.date).getTime())
  }

  function collect(group: DebtorGroup) {
    const message = fillTemplate(billingTemplate, {
      paciente: group.patientName,
      valor: formatBRL(group.total),
      data: group.oldestDueDate,
      clinica: clinic?.name ?? 'a clínica',
    })
    window.open(`https://wa.me/55${digitsOnly(group.phone)}?text=${encodeURIComponent(message)}`, '_blank')
    addAttempt({
      patientId: group.patientId,
      date: toShortDateWithYear(new Date()),
      channel: 'whatsapp',
      amountCharged: group.total,
    }, { onSuccess: () => toast.success(`Cobrança registrada para ${group.patientName}.`) })
  }

  const columns: TableColumn<DebtorGroup>[] = [
    { key: 'patient', label: 'Paciente', render: g => <span className={shared.celulaForte}>{g.patientName}</span> },
    { key: 'count', label: 'Parcelas', render: g => <span className={shared.contagem}>{g.items.length}</span> },
    { key: 'oldest', label: 'Vencida desde', render: g => g.oldestDueDate },
    { key: 'total', label: 'Total em aberto', render: g => <span className={`${shared.valor} ${shared.neg}`}>{formatBRL(g.total)}</span> },
    {
      key: 'actions', label: 'Ação',
      render: g => (
        <Button
          size="sm"
          variant="secondary"
          iconLeft={<IconMessage />}
          disabled={!g.phone}
          title={g.phone ? undefined : 'Paciente sem telefone cadastrado'}
          onClick={() => collect(g)}
        >
          Cobrar
        </Button>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={pagination.visible}
      rowKey={g => g.patientId}
      emptyMessage="Nenhum paciente inadimplente. 🎉"
      toolbar={<PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />}
      renderExpanded={g => {
        const history = attemptsOf(g.patientId)
        return (
          <ul className={shared.detalheLista}>
            {g.items.map(item => (
              <li key={item.id} className={shared.detalheItem}>
                <span>{item.description}</span>
                <span className={shared.contagem}>Venceu em {item.dueDate}</span>
                <span className={shared.neg}>{formatBRL(item.grossAmount - item.fee - (item.receivedAmount ?? 0))}</span>
              </li>
            ))}
            {history.length > 0 && (
              <>
                <li className={shared.detalheItem}><span className={shared.contagem}>Tentativas de cobrança</span></li>
                {history.map(a => (
                  <li key={a.id} className={shared.detalheItem}>
                    <span>{a.date} · {a.channel === 'whatsapp' ? 'WhatsApp' : a.channel === 'phone' ? 'Telefone' : 'E-mail'}</span>
                    <span className={shared.contagem}>{formatBRL(a.amountCharged)}</span>
                  </li>
                ))}
              </>
            )}
          </ul>
        )
      }}
      footer={
        <div className={shared.rodapeTabela}>
          <div className={shared.resumo}>
            <span className={shared.resumoItem}>Total em aberto <strong className={shared.neg}>{formatBRL(totalOverdue)}</strong></span>
            <span className={`${shared.resumoItem} ${shared.resumoDireita}`}>Devedores <strong>{rows.length}</strong></span>
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
  )
}
