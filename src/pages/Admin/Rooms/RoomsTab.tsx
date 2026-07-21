import { useState } from 'react'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { Pagination } from '@/components/Pagination/Pagination'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useSalas } from '@/hooks/useSalas'
import { IconSala, IconMais, IconBuscar, IconEditar } from '@/components/icons'
import { OPCOES_POR_PAGINA } from '@/constants'
import type { Sala } from '@/types/domain'
import { RoomFormModal } from './RoomFormModal'
import styles from './RoomsTab.module.scss'

/** Aba "Salas": tabela no padrão do projeto (por página + busca + paginação). */
export function RoomsTab() {
  const { data: salas, isLoading } = useSalas()

  // Modal de sala: null = fechado; { sala } = edição; {} = cadastro novo.
  const [modalSala, setModalSala] = useState<{ sala?: Sala } | null>(null)

  // Paginação + busca (mesmo desenho das listas de pacientes e materiais).
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [busca, setBusca] = useState('')

  const termo = busca.trim().toLowerCase()
  const filtradas = (salas ?? []).filter(s => !termo || s.nome.toLowerCase().includes(termo))

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtradas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

  const columns: TableColumn<Sala>[] = [
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
      label: '',
      render: s => (
        <Button variant="outline" size="sm" iconLeft={<IconEditar />} onClick={() => setModalSala({ sala: s })}>
          Editar
        </Button>
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
            <Select
              size="sm"
              options={OPCOES_POR_PAGINA}
              value={String(porPagina)}
              onChange={e => { setPorPagina(Number(e.target.value)); setPagina(1) }}
              aria-label="Registros por página"
              className={styles.porPagina}
            />
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
