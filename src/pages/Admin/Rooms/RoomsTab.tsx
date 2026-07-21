import { useState } from 'react'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Pagination } from '@/components/Pagination/Pagination'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useSalas } from '@/hooks/useSalas'
import { useDebounce } from '@/hooks/useDebounce'
import { combinaBusca } from '@/utils/search'
import { IconSala, IconMais, IconBuscar, IconEditar } from '@/components/icons'
import type { Room } from '@/types/domain'
import { RoomFormModal } from './RoomFormModal'
import styles from './RoomsTab.module.scss'

/** Aba "Salas": tabela no padrão do projeto (por página + busca + paginação). */
export function RoomsTab() {
  const { data: salas, isLoading } = useSalas()

  // Modal de sala: null = fechado; { sala } = edição; {} = cadastro novo.
  const [modalSala, setModalSala] = useState<{ sala?: Room } | null>(null)

  // Paginação + busca (mesmo desenho das listas de pacientes e materiais).
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [busca, setBusca] = useState('')

  const termo = useDebounce(busca)
  const filtradas = (salas ?? []).filter(s => combinaBusca(s.nome, termo))

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtradas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

  const columns: TableColumn<Room>[] = [
    {
      key: 'nome',
      label: 'Sala',
      render: s => (
        <span className={styles.salaCell}>
          {s.foto ? (
            <img src={s.foto} alt={`Foto da sala ${s.nome}`} className={styles.thumb} />
          ) : (
            <span className={styles.semThumb}><IconSala /></span>
          )}
          {s.nome}
        </span>
      ),
    },
    {
      key: 'acoes',
      label: 'Ação',
      render: s => (
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<IconEditar />}
          title="Editar sala"
          aria-label={`Editar ${s.nome}`}
          onClick={() => setModalSala({ sala: s })}
        />
      ),
    },
  ]

  if (isLoading) return <PageLoader />

  return (
    <>
      <Table
        columns={columns}
        data={visiveis}
        rowKey={s => s.id}
        emptyMessage={termo ? 'Nenhuma sala encontrada para a busca.' : 'Nenhuma sala cadastrada.'}
        toolbar={
          <>
            <PerPageSelect porPagina={porPagina} onChange={n => { setPorPagina(n); setPagina(1) }} />
            <div className={styles.toolbarDireita}>
              <Input
                size="sm"
                iconLeft={<IconBuscar />}
                placeholder="Buscar sala..."
                value={busca}
                onChange={e => { setBusca(e.target.value); setPagina(1) }}
                aria-label="Buscar sala"
                className={styles.busca}
              />
              <Button size="sm" iconLeft={<IconMais />} onClick={() => setModalSala({})}>
                Nova sala
              </Button>
            </div>
          </>
        }
        footer={
          <Pagination
            page={paginaAtual}
            totalPages={totalPaginas}
            onChange={setPagina}
            totalItems={filtradas.length}
            itemsPerPage={porPagina}
          />
        }
      />

      {/* Monta só quando aberto — o formulário nasce com os dados atuais. */}
      {modalSala && <RoomFormModal sala={modalSala.sala} onClose={() => setModalSala(null)} />}
    </>
  )
}
