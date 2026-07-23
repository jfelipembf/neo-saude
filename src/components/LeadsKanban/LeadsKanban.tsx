import { useState } from 'react'
import type { DragEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconClock, IconPhone, IconPlus } from '@/components/icons'
import { useLeads, useSetLeadStatus } from '@/hooks/useLeads'
import { LEAD_STATUS_LABEL } from '@/constants'
import { initials } from '@/utils/text'
import type { Lead, LeadStatus } from '@/types/domain'
import { LeadDetailDrawer } from './LeadDetailDrawer'
import { NewLeadModal } from './NewLeadModal'
import styles from './LeadsKanban.module.scss'

// Funil de contatos no desenho do Pipeline do projeto neo: kicker por coluna e
// textos próprios de coluna vazia. O título vem de LEAD_STATUS_LABEL (fonte
// única, compartilhada com o Select "O que aconteceu" do painel do lead).
const COLUMNS: {
  status: LeadStatus
  kicker: string
  emptyTitle: string
  emptyHint: string
}[] = [
  {
    status: 'new', kicker: 'Entrada',
    emptyTitle: 'Nenhum contato novo', emptyHint: 'Novos interessados entram aqui.',
  },
  {
    status: 'negotiating', kicker: 'Proposta',
    emptyTitle: 'Ninguém em negociação', emptyHint: 'Contatos conversando sobre valores e planos ficam aqui.',
  },
  {
    status: 'scheduling', kicker: 'Agenda',
    emptyTitle: 'Nada em agendamento', emptyHint: 'Mova um contato para cá ao marcar a avaliação.',
  },
  {
    status: 'converted', kicker: 'Fechados',
    emptyTitle: 'Nenhuma conversão ainda', emptyHint: 'Contatos que viraram pacientes aparecem aqui.',
  },
  {
    status: 'lost', kicker: 'Perdidos',
    emptyTitle: 'Nenhum perdido', emptyHint: 'Contatos sem interesse aparecem aqui.',
  },
]

/** Kanban do funil de leads: arraste um card entre colunas, ou clique para
 *  abrir os detalhes (status, observação e histórico) no painel lateral. */
export function LeadsKanban() {
  const { data: leads, isLoading } = useLeads()
  const { mutate: setStatus } = useSetLeadStatus()
  const [targetColumn, setTargetColumn] = useState<LeadStatus | null>(null)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<Lead | null>(null)

  if (isLoading) {
    return <div className={styles.loading}><Spinner size="lg" /></div>
  }

  const list = leads ?? []

  function handleDrop(e: DragEvent, status: LeadStatus) {
    e.preventDefault()
    setTargetColumn(null)
    const id = e.dataTransfer.getData('text/plain')
    if (id) setStatus({ id, status })
  }

  // Só limpa o realce ao sair da COLUNA (não ao passar sobre os cards internos).
  function handleColumnDragLeave(e: DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setTargetColumn(null)
  }

  return (
    <>
      <div className={styles.toolbar}>
        <Button size="sm" iconLeft={<IconPlus />} onClick={() => setCreating(true)}>
          Novo contato
        </Button>
      </div>

      <div className={styles.board}>
        {COLUMNS.map(col => {
          const columnLeads = list.filter(l => l.status === col.status)

          return (
            <section
              key={col.status}
              className={`${styles.coluna} ${targetColumn === col.status ? styles['coluna--alvo'] : ''}`}
              aria-label={`Coluna ${LEAD_STATUS_LABEL[col.status]}`}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
              onDragEnter={() => setTargetColumn(col.status)}
              onDragLeave={handleColumnDragLeave}
              onDrop={e => handleDrop(e, col.status)}
            >
              <header className={styles.colunaHead}>
                <div>
                  <span className={styles.colunaKicker}>{col.kicker}</span>
                  <h2 className={styles.colunaTitulo}>{LEAD_STATUS_LABEL[col.status]}</h2>
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
                    <LeadCard key={l.id} lead={l} onOpen={setSelected} />
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>

      {creating && <NewLeadModal onClose={() => setCreating(false)} />}
      {selected && <LeadDetailDrawer lead={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

interface LeadCardProps {
  lead: Lead
  onOpen: (lead: Lead) => void
}

function LeadCard({ lead, onOpen }: LeadCardProps) {
  return (
    <article
      className={styles.card}
      draggable
      onClick={() => onOpen(lead)}
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
          <IconClock /> {lead.createdAt}
        </span>
      </div>
    </article>
  )
}
