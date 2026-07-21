import { useState } from 'react'
import type { DragEvent } from 'react'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronEsquerda, IconChevronDireita, IconRelogio } from '@/components/icons'
import { useConsultasDoDia, useSetStatusConsulta } from '@/hooks/useConsultas'
import type { Appointment, AppointmentStatus } from '@/types/domain'
import styles from './KanbanBoard.module.scss'

// Fluxo do atendimento, da chegada à alta. Cancelada/faltou ficam fora do
// quadro — são marcadas pela lista da agenda, não pelo fluxo.
const COLUNAS: { status: AppointmentStatus; titulo: string }[] = [
  { status: 'agendada',       titulo: 'Agendada' },
  { status: 'confirmada',     titulo: 'Confirmada' },
  { status: 'em_atendimento', titulo: 'Em atendimento' },
  { status: 'concluida',      titulo: 'Concluída' },
]

/** Kanban das consultas do dia: arraste entre colunas ou mova pelas setas. */
export function KanbanBoard() {
  const { data: consultas, isLoading } = useConsultasDoDia()
  const { mutate: setStatus } = useSetStatusConsulta()
  const [colunaAlvo, setColunaAlvo] = useState<AppointmentStatus | null>(null)

  if (isLoading) {
    return <div className={styles.loading}><Spinner size="lg" /></div>
  }

  const lista = consultas ?? []

  function mover(id: string, status: AppointmentStatus) {
    setStatus({ id, status })
  }

  function aoSoltar(e: DragEvent, status: AppointmentStatus) {
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
        const daColuna = lista.filter(c => c.status === col.status)
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
            <header className={styles.colunaHeader}>
              <h2 className={styles.colunaTitulo}>{col.titulo}</h2>
              <span className={styles.colunaContador}>{daColuna.length}</span>
            </header>

            <ul className={styles.colunaLista}>
              {daColuna.length === 0 && (
                <li className={styles.vazio}>Solte uma consulta aqui</li>
              )}
              {daColuna.map(c => (
                <li key={c.id}>
                  <ConsultaCard
                    consulta={c}
                    anterior={anterior}
                    proxima={proxima}
                    onMover={mover}
                  />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

interface ConsultaCardProps {
  consulta: Appointment
  anterior?: AppointmentStatus
  proxima?: AppointmentStatus
  onMover: (id: string, status: AppointmentStatus) => void
}

function ConsultaCard({ consulta, anterior, proxima, onMover }: ConsultaCardProps) {
  return (
    <article
      className={styles.consulta}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', consulta.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      <p className={styles.paciente}>{consulta.paciente}</p>
      <p className={styles.linha}><IconRelogio /> {consulta.hora} · {consulta.atendimento}</p>

      <div className={styles.rodape}>
        <span className={styles.profissional}>{consulta.profissional}</span>

        {/* Setas: alternativa ao arrastar (teclado / touch). */}
        <span className={styles.setas}>
          <button
            type="button"
            className={styles.setaBtn}
            disabled={!anterior}
            onClick={() => anterior && onMover(consulta.id, anterior)}
            aria-label={`Mover ${consulta.paciente} para a coluna anterior`}
          >
            <IconChevronEsquerda />
          </button>
          <button
            type="button"
            className={styles.setaBtn}
            disabled={!proxima}
            onClick={() => proxima && onMover(consulta.id, proxima)}
            aria-label={`Mover ${consulta.paciente} para a próxima coluna`}
          >
            <IconChevronDireita />
          </button>
        </span>
      </div>
    </article>
  )
}
