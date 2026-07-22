import { useState } from 'react'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Pagination } from '@/components/Pagination/Pagination'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useRooms } from '@/hooks/useRooms'
import { useDebounce } from '@/hooks/useDebounce'
import { matchesSearch } from '@/utils/search'
import { IconRoom, IconPlus, IconSearch, IconEdit } from '@/components/icons'
import type { Room } from '@/types/domain'
import { RoomFormModal } from './RoomFormModal'
import styles from './RoomsTab.module.scss'

/** Aba "Salas": tabela no padrão do projeto (por página + busca + paginação). */
export function RoomsTab() {
  const { data: rooms, isLoading } = useRooms()

  // Modal de sala: null = fechado; { room } = edição; {} = cadastro novo.
  const [roomModal, setRoomModal] = useState<{ room?: Room } | null>(null)

  // Paginação + busca (mesmo desenho das listas de pacientes e materiais).
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')

  const term = useDebounce(search)
  const filtered = (rooms ?? []).filter(s => matchesSearch(s.name, term))

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const columns: TableColumn<Room>[] = [
    {
      key: 'name',
      label: 'Sala',
      render: s => (
        <span className={styles.salaCell}>
          {s.photo ? (
            <img src={s.photo} alt={`Foto da sala ${s.name}`} className={styles.thumb} />
          ) : (
            <span className={styles.semThumb}><IconRoom /></span>
          )}
          {s.name}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Ação',
      render: s => (
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<IconEdit />}
          title="Editar sala"
          aria-label={`Editar ${s.name}`}
          onClick={() => setRoomModal({ room: s })}
        />
      ),
    },
  ]

  if (isLoading) return <PageLoader />

  return (
    <>
      <Table
        columns={columns}
        data={visible}
        rowKey={s => s.id}
        emptyMessage={term ? 'Nenhuma sala encontrada para a busca.' : 'Nenhuma sala cadastrada.'}
        toolbar={
          <>
            <PerPageSelect perPage={perPage} onChange={n => { setPerPage(n); setPage(1) }} />
            <div className={styles.toolbarDireita}>
              <Input
                size="sm"
                iconLeft={<IconSearch />}
                placeholder="Buscar sala..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                aria-label="Buscar sala"
                className={styles.busca}
              />
              <Button size="sm" iconLeft={<IconPlus />} onClick={() => setRoomModal({})}>
                Nova sala
              </Button>
            </div>
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

      {/* Monta só quando aberto — o formulário nasce com os dados atuais. */}
      {roomModal && <RoomFormModal room={roomModal.room} onClose={() => setRoomModal(null)} />}
    </>
  )
}
