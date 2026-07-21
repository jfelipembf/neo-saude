import { useState } from 'react'
import type { DragEvent } from 'react'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronEsquerda, IconChevronDireita, IconRelogio, IconTelefone } from '@/components/icons'
import { useLeads, useSetStatusLead } from '@/hooks/useLeads'
import type { Lead, StatusLead } from '@/types/domain'
import styles from './LeadsKanban.module.scss'

// Funil de contatos no desenho do Pipeline do projeto neo:
// kicker + título por coluna e textos próprios de coluna vazia.
const COLUNAS: {
  status: StatusLead
  kicker: string
  titulo: string
  vazioTitulo: string
  vazioDica: string
}[] = [
  {
    status: 'novo_contato', kicker: 'Entrada', titulo: 'Novos contatos',
    vazioTitulo: 'Nenhum contato novo', vazioDica: 'Novos interessados entram aqui.',
  },
  {
    status: 'em_negociacao', kicker: 'Proposta', titulo: 'Em negociação',
    vazioTitulo: 'Ninguém em negociação', vazioDica: 'Contatos conversando sobre valores e planos ficam aqui.',
  },
  {
    status: 'agendamento', kicker: 'Agenda', titulo: 'Agendamento',
    vazioTitulo: 'Nada em agendamento', vazioDica: 'Mova um contato para cá ao marcar a avaliação.',
  },
  {
    status: 'converteu', kicker: 'Fechados', titulo: 'Converteu',
    vazioTitulo: 'Nenhuma conversão ainda', vazioDica: 'Contatos que viraram pacientes aparecem aqui.',
  },
  {
    status: 'perdeu', kicker: 'Perdidos', titulo: 'Perdeu',
    vazioTitulo: 'Nenhum perdido', vazioDica: 'Contatos sem interesse aparecem aqui.',
  },
]

/** Iniciais para o avatar do card (primeiro + último nome). */
function initials(nome: string) {
  const partes = nome.split(' ').filter(Boolean)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

/** Kanban do funil de leads: arraste entre colunas ou mova pelas setas. */
export function LeadsKanban() {
  const { data: leads, isLoading } = useLeads()
  const { mutate: setStatus } = useSetStatusLead()
  const [colunaAlvo, setColunaAlvo] = useState<StatusLead | null>(null)

  if (isLoading) {
    return <div className={styles.loading}><Spinner size="lg" /></div>
  }

  const lista = leads ?? []

  function mover(id: string, status: StatusLead) {
    setStatus({ id, status })
  }

  function aoSoltar(e: DragEvent, status: StatusLead) {
    e.preventDefault()
    setColunaAlvo(null)
    const id = e.dataTransfer.getData('text/plain')
    if (id) mover(id, status)
  }

  // Só limpa o realce ao sair da COLUNA (não ao passar sobre os cards internos).
  function aoSairDaColuna(e: DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setColunaAlvo(null)
  }

  return (
    <div className={styles.board}>
      {COLUNAS.map((col, indice) => {
        const daColuna = lista.filter(l => l.status === col.status)
        const anterior = COLUNAS[indice - 1]?.status
        const proxima  = COLUNAS[indice + 1]?.status

        return (
          <section
            key={col.status}
            className={`${styles.coluna} ${colunaAlvo === col.status ? styles['coluna--alvo'] : ''}`}
            aria-label={`Coluna ${col.titulo}`}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDragEnter={() => setColunaAlvo(col.status)}
            onDragLeave={aoSairDaColuna}
            onDrop={e => aoSoltar(e, col.status)}
          >
            <header className={styles.colunaHead}>
              <div>
                <span className={styles.colunaKicker}>{col.kicker}</span>
                <h2 className={styles.colunaTitulo}>{col.titulo}</h2>
              </div>
              <span className={styles.contador}>{daColuna.length}</span>
            </header>

            <div className={styles.colunaBody}>
              {daColuna.length === 0 ? (
                <div className={styles.vazio}>
                  <strong>{col.vazioTitulo}</strong>
                  <span>{col.vazioDica}</span>
                </div>
              ) : (
                daColuna.map(l => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    anterior={anterior}
                    proxima={proxima}
                    onMover={mover}
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
  anterior?: StatusLead
  proxima?: StatusLead
  onMover: (id: string, status: StatusLead) => void
}

function LeadCard({ lead, anterior, proxima, onMover }: LeadCardProps) {
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
        <span className={styles.avatar}>{initials(lead.nome)}</span>
        <div className={styles.cardTitle}>
          <strong>{lead.nome}</strong>
          <span><IconTelefone /> {lead.telefone}</span>
        </div>
      </div>

      <div className={styles.chips}>
        <span className={styles.chip}>{lead.interesse}</span>
      </div>

      <div className={styles.cardFoot}>
        <span className={styles.cardFootInfo}>
          <IconRelogio /> {lead.criadoEm} · {lead.origem}
        </span>

        {/* Setas: alternativa ao arrastar (teclado / touch). */}
        <span className={styles.setas}>
          <button
            type="button"
            className={styles.setaBtn}
            disabled={!anterior}
            onClick={() => anterior && onMover(lead.id, anterior)}
            aria-label={`Mover ${lead.nome} para a etapa anterior`}
          >
            <IconChevronEsquerda />
          </button>
          <button
            type="button"
            className={styles.setaBtn}
            disabled={!proxima}
            onClick={() => proxima && onMover(lead.id, proxima)}
            aria-label={`Mover ${lead.nome} para a próxima etapa`}
          >
            <IconChevronDireita />
          </button>
        </span>
      </div>
    </article>
  )
}
