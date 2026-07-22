import { useState } from 'react'
import type { DragEvent } from 'react'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronLeft, IconChevronRight, IconClock, IconPhone } from '@/components/icons'
import { useLeads, useSetLeadStatus } from '@/hooks/useLeads'
import { initials } from '@/utils/text'
import type { Lead, LeadStatus } from '@/types/domain'
import styles from './LeadsKanban.module.scss'

// Funil de contatos no desenho do Pipeline do projeto neo:
// kicker + título por coluna e textos próprios de coluna vazia.
const COLUMNS: {
  status: LeadStatus
  kicker: string
  title: string
  emptyTitle: string
  emptyHint: string
}[] = [
  {
    status: 'new', kicker: 'Entrada', title: 'Novos contatos',
    emptyTitle: 'Nenhum contato novo', emptyHint: 'Novos interessados entram aqui.',
  },
  {
    status: 'negotiating', kicker: 'Proposta', title: 'Em negociação',
    emptyTitle: 'Ninguém em negociação', emptyHint: 'Contatos conversando sobre valores e planos ficam aqui.',
  },
  {
    status: 'scheduling', kicker: 'Agenda', title: 'Agendamento',
    emptyTitle: 'Nada em agendamento', emptyHint: 'Mova um contato para cá ao marcar a avaliação.',
  },
  {
    status: 'converted', kicker: 'Fechados', title: 'Converteu',
    emptyTitle: 'Nenhuma conversão ainda', emptyHint: 'Contatos que viraram pacientes aparecem aqui.',
  },
  {
    status: 'lost', kicker: 'Perdidos', title: 'Perdeu',
    emptyTitle: 'Nenhum perdido', emptyHint: 'Contatos sem interesse aparecem aqui.',
  },
]

/** Kanban do funil de leads: arraste entre colunas ou mova pelas setas. */
export function LeadsKanban() {
  const { data: leads, isLoading } = useLeads()
  const { mutate: setStatus } = useSetLeadStatus()
  const [targetColumn, setTargetColumn] = useState<LeadStatus | null>(null)

  if (isLoading) {
    return <div className={styles.loading}><Spinner size="lg" /></div>
  }

  const list = leads ?? []

  function move(id: string, status: LeadStatus) {
    setStatus({ id, status })
  }

  function handleDrop(e: DragEvent, status: LeadStatus) {
    e.preventDefault()
    setTargetColumn(null)
    const id = e.dataTransfer.getData('text/plain')
    if (id) move(id, status)
  }

  // Só limpa o realce ao sair da COLUNA (não ao passar sobre os cards internos).
  function handleColumnDragLeave(e: DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setTargetColumn(null)
  }

  return (
    <div className={styles.board}>
      {COLUMNS.map((col, index) => {
        const columnLeads = list.filter(l => l.status === col.status)
        const previous = COLUMNS[index - 1]?.status
        const next     = COLUMNS[index + 1]?.status

        return (
          <section
            key={col.status}
            className={`${styles.coluna} ${targetColumn === col.status ? styles['coluna--alvo'] : ''}`}
            aria-label={`Coluna ${col.title}`}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDragEnter={() => setTargetColumn(col.status)}
            onDragLeave={handleColumnDragLeave}
            onDrop={e => handleDrop(e, col.status)}
          >
            <header className={styles.colunaHead}>
              <div>
                <span className={styles.colunaKicker}>{col.kicker}</span>
                <h2 className={styles.colunaTitulo}>{col.title}</h2>
              </div>
              <span className={styles.contador}>{columnLeads.length}</span>
            </header>

            <div className={styles.colunaBody}>
              {columnLeads.length === 0 ? (
                <div className={styles.vazio}>
                  <strong>{col.emptyTitle}</strong>
                  <span>{col.emptyHint}</span>
                </div>
              ) : (
                columnLeads.map(l => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    previous={previous}
                    next={next}
                    onMove={move}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

interface LeadCardProps {
  lead: Lead
  previous?: LeadStatus
  next?: LeadStatus
  onMove: (id: string, status: LeadStatus) => void
}

function LeadCard({ lead, previous, next, onMove }: LeadCardProps) {
  return (
    <article
      className={styles.card}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', lead.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      <div className={styles.cardTop}>
        <span className={styles.avatar}>{initials(lead.name)}</span>
        <div className={styles.cardTitle}>
          <strong>{lead.name}</strong>
          <span><IconPhone /> {lead.phone}</span>
        </div>
      </div>

      <div className={styles.chips}>
        <span className={styles.chip}>{lead.interest}</span>
      </div>

      <div className={styles.cardFoot}>
        <span className={styles.cardFootInfo}>
          <IconClock /> {lead.createdAt} · {lead.source}
        </span>

        {/* Setas: alternativa ao arrastar (teclado / touch). */}
        <span className={styles.setas}>
          <button
            type="button"
            className={styles.setaBtn}
            disabled={!previous}
            onClick={() => previous && onMove(lead.id, previous)}
            aria-label={`Mover ${lead.name} para a etapa anterior`}
          >
            <IconChevronLeft />
          </button>
          <button
            type="button"
            className={styles.setaBtn}
            disabled={!next}
            onClick={() => next && onMove(lead.id, next)}
            aria-label={`Mover ${lead.name} para a próxima etapa`}
          >
            <IconChevronRight />
          </button>
        </span>
      </div>
    </article>
  )
}
