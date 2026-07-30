import { useState } from 'react'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Pagination } from '@/components/Pagination/Pagination'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useOdontoProcedures } from '@/hooks/useOdontoProcedures'
import { useDebounce } from '@/hooks/useDebounce'
import { matchesSearch } from '@/utils/search'
import { formatBRL } from '@/utils/format'
import { IconTooth, IconPlus, IconSearch, IconEdit } from '@/components/icons'
import type { OdontoProcedure } from '@/types/domain'
import { OdontoProcedureFormModal } from './OdontoProcedureFormModal'
import styles from './OdontoProceduresTab.module.scss'

/** Aba "Serviços" da odontologia: tabela no padrão do projeto (mesmo desenho de Salas) —
 *  só nome + preço, sem os campos de contrato/pacote da aba Serviços de fisioterapia. */
export function OdontoProceduresTab() {
  const { data: procedures, isLoading } = useOdontoProcedures()

  // Modal de serviço: null = fechado; { procedure } = edição; {} = cadastro novo.
  const [procedureModal, setProcedureModal] = useState<{ procedure?: OdontoProcedure } | null>(null)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')

  const term = useDebounce(search)
  const filtered = (procedures ?? []).filter(s => matchesSearch(s.name, term))

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const columns: TableColumn<OdontoProcedure>[] = [
    {
      key: 'name',
      label: 'Serviço',
      render: s => (
        <span className={styles.servicoCell}>
          <span className={styles.icone}><IconTooth /></span>
          {s.name}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Valor',
      render: s => formatBRL(s.price),
    },
    {
      key: 'actions',
      label: 'Ação',
      render: s => (
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<IconEdit />}
          title="Editar serviço"
          aria-label={`Editar ${s.name}`}
          onClick={() => setProcedureModal({ procedure: s })}
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
        emptyMessage={term ? 'Nenhum serviço encontrado para a busca.' : 'Nenhum serviço cadastrado.'}
        toolbar={
          <>
            <PerPageSelect perPage={perPage} onChange={n => { setPerPage(n); setPage(1) }} />
            <div className={styles.toolbarDireita}>
              <Input
                size="sm"
                iconLeft={<IconSearch />}
                placeholder="Buscar serviço..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                aria-label="Buscar serviço"
                className={styles.busca}
              />
              <Button size="sm" iconLeft={<IconPlus />} onClick={() => setProcedureModal({})}>
                Novo serviço
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
      {procedureModal && (
        <OdontoProcedureFormModal procedure={procedureModal.procedure} onClose={() => setProcedureModal(null)} />
      )}
    </>
  )
}
