import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Spinner } from '@/components/Spinner/Spinner'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { IconBuscar, IconEstrela, IconOlho } from '@/components/icons'
import { useProfissionais } from '@/hooks/useProfissionais'
import { useDebounce } from '@/hooks/useDebounce'
import { initials } from '@/utils/text'
import { combinaBusca } from '@/utils/search'
import type { Professional } from '@/types/domain'
import styles from './ProfessionalsTable.module.scss'

interface ProfessionalsTableProps {
  /** Ação do botão "Ver" (ex.: abrir o perfil do profissional). */
  onView?: (profissional: Professional) => void
}

/** Lista de profissionais: busca, paginação e linhas altas com foto maior,
 *  especialidade explicada e nota de atendimento. */
export function ProfessionalsTable({ onView }: ProfessionalsTableProps) {
  const { data: profissionais, isLoading } = useProfissionais()

  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(5)

  // Termo "estabilizado" (debounce) — hook, então fica ANTES de qualquer
  // return condicional (ordem dos hooks precisa ser igual em todo render).
  const termo = useDebounce(busca)

  if (isLoading) {
    return <div className={styles.loading}><Spinner /></div>
  }

  // Busca sem acento e sem partículas ("maria souza" acha "Maria de Souza").
  const filtrados = (profissionais ?? []).filter(p =>
    combinaBusca(p.nome, termo) || combinaBusca(p.especialidade, termo),
  )

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
  // Se a lista encolher (busca ou "por página"), não fica em página fantasma.
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

  const columns: TableColumn<Professional>[] = [
    {
      key: 'profissional',
      label: 'Profissional',
      render: p => (
        <span className={styles.profCell}>
          <span className={styles.avatar}>{initials(p.nome)}</span>
          <span className={styles.profInfo}>
            <span className={styles.nome}>{p.nome}</span>
            <span className={styles.registro}>{p.registro}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'especialidade',
      label: 'Especialidade',
      render: p => (
        <span className={styles.espCell}>
          <span className={styles.especialidade}>{p.especialidade}</span>
          {p.descricao && <span className={styles.descricao}>{p.descricao}</span>}
        </span>
      ),
    },
    {
      key: 'nota',
      label: 'Nota',
      render: p => (
        p.nota != null ? (
          <span className={styles.nota} title="Nota média de atendimento">
            <IconEstrela />
            {p.nota.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
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
          iconLeft={<IconOlho />}
          title="Ver perfil"
          aria-label={`Ver perfil de ${p.nome}`}
          onClick={e => { e.stopPropagation(); onView?.(p) }}
        />
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={visiveis}
      rowKey={p => p.id}
      onRowClick={onView}
      emptyMessage={termo ? 'Nenhum profissional encontrado para a busca.' : 'Nenhum profissional cadastrado.'}
      toolbar={
        <>
          <PerPageSelect porPagina={porPagina} onChange={n => { setPorPagina(n); setPagina(1) }} />
          <Input
            size="sm"
            iconLeft={<IconBuscar />}
            placeholder="Buscar por nome ou especialidade..."
            value={busca}
            onChange={e => { setBusca(e.target.value); setPagina(1) }}
            aria-label="Buscar profissional"
            className={styles.busca}
          />
        </>
      }
      footer={
        <Pagination
          page={paginaAtual}
          totalPages={totalPaginas}
          onChange={setPagina}
          totalItems={filtrados.length}
          itemsPerPage={porPagina}
        />
      }
    />
  )
}
