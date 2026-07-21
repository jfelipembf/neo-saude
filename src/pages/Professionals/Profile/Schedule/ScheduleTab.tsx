import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar } from '@/components/Calendar/Calendar'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { IconAgenda, IconTelefone, IconMensagem, IconOlho } from '@/components/icons'
import { buildRoute, DAY_OF_WEEK_LONG } from '@/constants'
import { useGradeSessoes } from '@/hooks/useGrade'
import { usePacientes } from '@/hooks/usePacientes'
import { toIsoDate, dataLocal } from '@/utils/date'
import { somenteDigitos } from '@/utils/text'
import type { Professional } from '@/types/domain'
import shared from '../shared/profile.module.scss'
import styles from './ScheduleTab.module.scss'

/** Nome como aparece na grade (sem o prefixo "Dr./Dra."). */
function nomeNaGrade(nome: string) {
  return nome.replace(/^Dra?\.\s*/i, '')
}

interface ScheduleTabProps {
  profissional: Professional
}

/** Aba "Agenda": calendário + atendimentos do dia escolhido. A grade é semanal
 *  (recorrente), então um dia do calendário mostra as sessões daquele dia da
 *  semana. */
export function ScheduleTab({ profissional }: ScheduleTabProps) {
  const navigate = useNavigate()
  const { data: sessoes } = useGradeSessoes()
  const { data: pacientes } = usePacientes()

  const [dataSelecionada, setDataSelecionada] = useState(() => toIsoDate(new Date()))

  const hoje = new Date()
  const nome = nomeNaGrade(profissional.nome)
  const sessoesProfissional = (sessoes ?? []).filter(
    s => s.status === 'ativa' && s.profissional === nome,
  )

  // Pontinho no calendário nos dias com atendimento (janela de ±6 meses —
  // cobre de sobra a navegação entre meses).
  const diasComAtendimento = new Set(sessoesProfissional.map(s => s.diaSemana))
  const marcadas: string[] = []
  for (let i = -182; i <= 182; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i)
    if (diasComAtendimento.has(d.getDay())) marcadas.push(toIsoDate(d))
  }

  const diaSelecionado = dataLocal(dataSelecionada)
  const sessoesDoDia = sessoesProfissional
    .filter(s => s.diaSemana === diaSelecionado.getDay())
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))

  // Contatos dos pacientes do dia (a grade guarda só o nome).
  const pacientePorNome = new Map((pacientes ?? []).map(p => [p.nome, p]))

  return (
    <section className={shared.formCard} aria-label="Agenda">
      <h2 className={shared.formTitulo}>Agenda</h2>

      {sessoesProfissional.length === 0 ? (
        <EmptyState
          icon={<IconAgenda />}
          title="Nenhum horário na grade"
          description="Este profissional ainda não tem sessões recorrentes na grade semanal."
        />
      ) : (
        <div className={styles.agendaGrid}>
          <Calendar
            size="lg"
            markedDates={marcadas}
            selected={dataSelecionada}
            onSelect={setDataSelecionada}
          />

          <div className={styles.agendaDia}>
            <h3 className={styles.agendaDiaTitulo}>
              {DAY_OF_WEEK_LONG[diaSelecionado.getDay()]}, {diaSelecionado.toLocaleDateString('pt-BR')}
            </h3>

            {sessoesDoDia.length === 0 ? (
              <p className={styles.agendaVazia}>Sem atendimentos neste dia.</p>
            ) : (
              <ul className={styles.agendaLista}>
                {sessoesDoDia.map(s => {
                  const pac = pacientePorNome.get(s.paciente)
                  const zap = pac?.whatsapp ?? pac?.telefone   // WhatsApp cadastrado ou o próprio celular
                  return (
                    <li key={s.id} className={styles.agendaItem}>
                      <span className={styles.agendaHora}>{s.horaInicio}–{s.horaFim}</span>
                      <span className={styles.agendaInfo}>
                        <span className={styles.agendaPaciente}>{s.paciente}</span>
                        <span className={styles.agendaMeta}>
                          {[s.atividade, s.sala].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className={styles.agendaAcoes}>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<IconTelefone />}
                          disabled={!pac?.telefone}
                          title="Ligar"
                          aria-label={`Ligar para ${s.paciente}`}
                          onClick={() => {
                            window.location.href = `tel:+55${somenteDigitos(pac!.telefone)}`
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<IconMensagem />}
                          disabled={!zap}
                          title="Chamar no WhatsApp"
                          aria-label={`Chamar ${s.paciente} no WhatsApp`}
                          onClick={() => window.open(`https://wa.me/55${somenteDigitos(zap ?? '')}`, '_blank')}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<IconOlho />}
                          disabled={!pac}
                          title="Ver perfil do paciente"
                          aria-label={`Ver perfil de ${s.paciente}`}
                          onClick={() => navigate(buildRoute.pacientePerfil(pac!.id))}
                        />
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
