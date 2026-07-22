import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Spinner } from '@/components/Spinner/Spinner'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { IconSearch, IconStar, IconEye } from '@/components/icons'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useDebounce } from '@/hooks/useDebounce'
import { initials } from '@/utils/text'
import { matchesSearch } from '@/utils/search'
import type { Professional } from '@/types/domain'
import styles from './ProfessionalsTable.module.scss'

interface ProfessionalsTableProps {
  /** Ação do botão "Ver" (ex.: abrir o perfil do profissional). */
  onView?: (professional: Professional) => void
}

/** Lista de profissionais: busca, paginação e linhas altas com foto maior,
 *  especialidade explicada e nota de atendimento. */
export function ProfessionalsTable({ onView }: ProfessionalsTableProps) {
  const { data: professionals, isLoading } = useProfessionals()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(5)

  // Termo "estabilizado" (debounce) — hook, então fica ANTES de qualquer
  // return condicional (ordem dos hooks precisa ser igual em todo render).
  const term = useDebounce(search)

  if (isLoading) {
    return <div className={styles.loading}><Spinner /></div>
  }

  // Busca sem acento e sem partículas ("maria souza" acha "Maria de Souza").
  const filtered = (professionals ?? []).filter(p =>
    matchesSearch(p.name, term) || matchesSearch(p.specialty, term),
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  // Se a lista encolher (busca ou "por página"), não fica em página fantasma.
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const columns: TableColumn<Professional>[] = [
    {
      key: 'profissional',
      label: 'Profissional',
      render: p => (
        <span className={styles.profCell}>
          <span className={styles.avatar}>
            {p.photo ? <img src={p.photo} alt="" className={styles.avatarImg} /> : initials(p.name)}
          </span>
          <span className={styles.profInfo}>
            <span className={styles.nome}>{p.name}</span>
            <span className={styles.registro}>{p.license}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'especialidade',
      label: 'Especialidade',
      render: p => (
        <span className={styles.espCell}>
          <span className={styles.especialidade}>{p.specialty}</span>
          {p.description && <span className={styles.descricao}>{p.description}</span>}
        </span>
      ),
    },
    {
      key: 'nota',
      label: 'Nota',
      render: p => (
        p.rating != null ? (
          <span className={styles.nota} title="Nota média de atendimento">
            <IconStar />
            {p.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
        ) : <span className={styles.semNota}>—</span>
      ),
    },
    {
      key: 'acoes',
      label: 'Ação',
      render: p => (
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<IconEye />}
          title="Ver perfil"
          aria-label={`Ver perfil de ${p.name}`}
          onClick={e => { e.stopPropagation(); onView?.(p) }}
        />
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={visible}
      rowKey={p => p.id}
      onRowClick={onView}
      emptyMessage={term ? 'Nenhum profissional encontrado para a busca.' : 'Nenhum profissional cadastrado.'}
      toolbar={
        <>
          <PerPageSelect perPage={perPage} onChange={n => { setPerPage(n); setPage(1) }} />
          <Input
            size="sm"
            iconLeft={<IconSearch />}
            placeholder="Buscar por nome ou especialidade..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            aria-label="Buscar profissional"
            className={styles.busca}
          />
        </>
      }
      footer={
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onChange={setPage}
          totalItems={filtered.length}
          itemsPerPage={perPage}
        />
      }
    />
  )
}
