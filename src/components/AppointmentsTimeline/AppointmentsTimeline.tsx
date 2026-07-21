import { useState } from 'react'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronBaixo, IconRelogio, IconCheck } from '@/components/icons'
import { useHistoricoConsultas } from '@/hooks/useConsultas'
import styles from './AppointmentsTimeline.module.scss'

interface AppointmentsTimelineProps {
  pacienteId: string
}

/**
 * Linha do tempo das consultas do paciente: cada parada mostra o que foi feito;
 * expandir revela materiais utilizados, observações e duração.
 */
export function AppointmentsTimeline({ pacienteId }: AppointmentsTimelineProps) {
  const { data: historico, isLoading } = useHistoricoConsultas(pacienteId)
  const [abertas, setAbertas] = useState<Set<string>>(new Set())

  if (isLoading) {
    return <div className={styles.loading}><Spinner /></div>
  }

  const consultas = historico ?? []

  if (consultas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma consulta registrada"
        description="O histórico de atendimentos do paciente aparecerá aqui."
      />
    )
  }

  function alternar(id: string) {
    setAbertas(atual => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  return (
    <ol className={styles.timeline}>
      {consultas.map(c => {
        const aberta = abertas.has(c.id)
        return (
          <li key={c.id} className={styles.item}>
            <span className={styles.ponto} aria-hidden="true" />

            <article className={styles.card}>
              <button
                type="button"
                className={styles.cabecalho}
                onClick={() => alternar(c.id)}
                aria-expanded={aberta}
                aria-label={`${aberta ? 'Recolher' : 'Expandir'} consulta de ${c.data}`}
              >
                <div className={styles.cabecalhoInfo}>
                  <span className={styles.data}>{c.data} · {c.hora}</span>
                  <h3 className={styles.titulo}>{c.atendimento}</h3>
                  <span className={styles.profissional}>{c.profissional}</span>
                </div>
                <span className={`${styles.seta} ${aberta ? styles['seta--aberta'] : ''}`}>
                  <IconChevronBaixo />
                </span>
              </button>

              {/* O que foi feito: sempre visível. */}
              <ul className={styles.procedimentos}>
                {c.procedimentos.map(p => (
                  <li key={p} className={styles.procedimento}>
                    <IconCheck /> {p}
                  </li>
                ))}
              </ul>

              {aberta && (
                <div className={styles.detalhe}>
                  {c.materiais && c.materiais.length > 0 && (
                    <div className={styles.bloco}>
                      <h4>Materiais utilizados</h4>
                      <ul className={styles.materiais}>
                        {c.materiais.map(m => (
                          <li key={m.nome} className={styles.material}>
                            <span>{m.nome}</span>
                            <span className={styles.quantidade}>{m.quantidade}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {c.observacoes && (
                    <div className={styles.bloco}>
                      <h4>Observações</h4>
                      <p className={styles.observacoes}>{c.observacoes}</p>
                    </div>
                  )}

                  {c.duracao && (
                    <span className={styles.duracao}>
                      <IconRelogio /> Duração: {c.duracao}
                    </span>
                  )}
                </div>
              )}
            </article>
          </li>
        )
      })}
    </ol>
  )
}
