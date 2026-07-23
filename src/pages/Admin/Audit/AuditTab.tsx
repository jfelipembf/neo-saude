import { useMemo, useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { IconAdmin, IconSearch } from '@/components/icons'
import { useAuditLog } from '@/hooks/useAudit'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { AUDIT_FETCH_LIMIT } from '@/services/auditService'
import {
  AUDIT_TABLE_OPTIONS, AUDIT_ACTION_OPTIONS, AUDIT_HIDDEN_FIELDS,
  auditTableLabel, auditFieldLabel,
} from '@/constants'
import type { AuditAction, AuditEntry } from '@/types/domain'
import styles from './AuditTab.module.scss'

/** dd/mm/aaaa HH:MM da trilha. */
function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/** Valor de um campo no diff, legível (booleano, objeto, vazio). */
function fmtValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/** Detalhe expandido: o que mudou (antes → depois), ou os campos do registro. */
function AuditDiff({ entry }: { entry: AuditEntry }) {
  if (entry.action === 'update') {
    const changed = entry.changedFields.filter(f => !AUDIT_HIDDEN_FIELDS.has(f))
    if (changed.length === 0) return <p className={styles.diffVazio}>Sem alterações relevantes.</p>
    return (
      <ul className={styles.diffLista}>
        {changed.map(f => (
          <li key={f} className={styles.diffLinha}>
            <span className={styles.campo}>{auditFieldLabel(f)}</span>
            <span className={styles.antigo}>{fmtValue(entry.oldData?.[f])}</span>
            <span className={styles.seta}>→</span>
            <span className={styles.novo}>{fmtValue(entry.newData?.[f])}</span>
          </li>
        ))}
      </ul>
    )
  }

  // insert / delete: mostra os campos relevantes do snapshot.
  const snapshot = entry.action === 'insert' ? entry.newData : entry.oldData
  const fields = Object.entries(snapshot ?? {})
    .filter(([k, v]) => !AUDIT_HIDDEN_FIELDS.has(k) && v !== null && v !== '')
  return (
    <div>
      <p className={styles.diffTitulo}>
        {entry.action === 'insert' ? 'Registro criado' : 'Registro excluído'}
      </p>
      <ul className={styles.diffLista}>
        {fields.map(([k, v]) => (
          <li key={k} className={styles.diffLinha}>
            <span className={styles.campo}>{auditFieldLabel(k)}</span>
            <span className={entry.action === 'insert' ? styles.novo : styles.antigo}>{fmtValue(v)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Aba "Auditoria": trilha imutável de ações da clínica (quem, o quê, quando,
 * antes → depois). Lê `audit_log` via RPC list_audit_log, restrita a admins
 * pela RLS. Paginação keyset ("carregar mais").
 */
export function AuditTab() {
  const [table, setTable] = useState('')
  const [action, setAction] = useState<'' | AuditAction>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput)

  const filters = useMemo(
    () => ({ table: table || undefined, action: action || undefined, from: from || undefined, to: to || undefined, search: search || undefined }),
    [table, action, from, to, search],
  )

  const { data, isLoading, isError } = useAuditLog(filters)
  const entries = data ?? []
  const pagination = usePagination(entries, 20)

  const columns: TableColumn<AuditEntry>[] = [
    { key: 'when', label: 'Quando', render: e => <span className={styles.quando}>{fmtWhen(e.createdAt)}</span> },
    // "Sistema" só quando NÃO há ator (trigger/cron/seed). Com ator, mostra o
    // nome resolvido (ou o e-mail, quando o perfil ainda não tem nome).
    { key: 'who', label: 'Quem', render: e => <span className={styles.quem}>{e.actorId ? (e.actorName || 'Usuário') : 'Sistema'}</span> },
    { key: 'action', label: 'Ação', render: e => <Badge status={e.action} /> },
    { key: 'entity', label: 'Entidade', render: e => auditTableLabel(e.tableName) },
    {
      key: 'record',
      label: 'Registro',
      render: e => (
        <span className={styles.registro} title={e.recordLabel}>
          {e.recordLabel || `#${e.recordId.slice(0, 8)}`}
        </span>
      ),
    },
    {
      key: 'changes',
      label: 'Alterações',
      render: e => {
        const changed = e.changedFields.filter(f => !AUDIT_HIDDEN_FIELDS.has(f))
        if (e.action !== 'update' || changed.length === 0) return <span className={styles.semAlt}>—</span>
        return (
          <span className={styles.chips}>
            {changed.slice(0, 3).map(f => <span key={f} className={styles.chip}>{auditFieldLabel(f)}</span>)}
            {changed.length > 3 && <span className={styles.chip}>+{changed.length - 3}</span>}
          </span>
        )
      },
    },
  ]

  const toolbar = (
    <div className={styles.filtros}>
      <Select
        aria-label="Entidade"
        options={[{ value: '', label: 'Todas as entidades' }, ...AUDIT_TABLE_OPTIONS]}
        value={table}
        onChange={e => setTable(e.target.value)}
        className={styles.fEntidade}
      />
      <Select
        aria-label="Ação"
        options={[{ value: '', label: 'Todas as ações' }, ...AUDIT_ACTION_OPTIONS]}
        value={action}
        onChange={e => setAction(e.target.value as '' | AuditAction)}
        className={styles.fAcao}
      />
      <Input type="date" aria-label="De" value={from} onChange={e => setFrom(e.target.value)} className={styles.fData} />
      <Input type="date" aria-label="Até" value={to} onChange={e => setTo(e.target.value)} className={styles.fData} />
      <Input
        iconLeft={<IconSearch />}
        placeholder="Buscar por usuário ou conteúdo..."
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        aria-label="Buscar"
        className={styles.busca}
      />
    </div>
  )

  return (
    <div className={styles.painel}>
      <header className={styles.cabecalho}>
        <h2 className={styles.titulo}>Auditoria</h2>
        <p className={styles.hint}>
          Trilha de quem fez o quê, quando e o que mudou. Registro imutável — não pode ser editado nem apagado.
        </p>
      </header>

      {isLoading ? (
        <div className={styles.carregando}><Spinner size="lg" /></div>
      ) : isError ? (
        <EmptyState title="Não foi possível carregar a auditoria" description="Tente novamente em instantes." />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<IconAdmin />}
          title="Nenhum registro na trilha"
          description="Assim que houver ações na clínica (cadastros, edições, baixas), elas aparecem aqui."
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={pagination.visible}
            rowKey={e => e.id}
            toolbar={toolbar}
            renderExpanded={e => <AuditDiff entry={e} />}
            emptyMessage="Nenhum registro para os filtros escolhidos."
            footer={
              <div className={styles.rodape}>
                <PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />
                <Pagination
                  page={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onChange={pagination.setPage}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.perPage}
                />
              </div>
            }
          />
          {entries.length >= AUDIT_FETCH_LIMIT && (
            <p className={styles.aviso}>
              Mostrando os {AUDIT_FETCH_LIMIT} registros mais recentes. Refine por período para ver outros.
            </p>
          )}
        </>
      )}
    </div>
  )
}
