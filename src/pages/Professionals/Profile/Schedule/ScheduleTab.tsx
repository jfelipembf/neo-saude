import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar } from '@/components/Calendar/Calendar'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { IconSchedule, IconPhone, IconMessage, IconEye } from '@/components/icons'
import { buildRoute, DAY_OF_WEEK_LONG } from '@/constants'
import { useScheduleSlots } from '@/hooks/useSchedule'
import { usePatients } from '@/hooks/usePatients'
import { toIsoDate, localDate } from '@/utils/date'
import { digitsOnly } from '@/utils/text'
import type { Professional } from '@/types/domain'
import shared from '../shared/profile.module.scss'
import styles from './ScheduleTab.module.scss'

interface ScheduleTabProps {
  professional: Professional
}

/** Aba "Agenda": calendário + atendimentos do dia escolhido. A grade é semanal
 *  (recorrente), então um dia do calendário mostra as sessões daquele dia da
 *  semana. */
export function ScheduleTab({ professional }: ScheduleTabProps) {
  const navigate = useNavigate()
  const { data: slots } = useScheduleSlots()
  const { data: patients } = usePatients()

  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()))

  const today = new Date()
  const professionalSlots = (slots ?? []).filter(
    s => s.status === 'active' && s.professionalId === professional.id,
  )

  // Pontinho no calendário nos dias com atendimento (janela de ±6 meses —
  // cobre de sobra a navegação entre meses).
  const weekdaysWithAppointments = new Set(professionalSlots.map(s => s.weekday))
  const marked: string[] = []
  for (let i = -182; i <= 182; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    if (weekdaysWithAppointments.has(d.getDay())) marked.push(toIsoDate(d))
  }

  const selectedDay = localDate(selectedDate)
  const daySlots = professionalSlots
    .filter(s => s.weekday === selectedDay.getDay())
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Contatos dos pacientes do dia (a grade guarda o id; o nome sai daqui).
  const patientById = new Map((patients ?? []).map(p => [p.id, p]))

  return (
    <section className={shared.formCard} aria-label="Agenda">
      <h2 className={shared.formTitulo}>Agenda</h2>

      {professionalSlots.length === 0 ? (
        <EmptyState
          icon={<IconSchedule />}
          title="Nenhum horário na grade"
          description="Este profissional ainda não tem sessões recorrentes na grade semanal."
        />
      ) : (
        <div className={styles.agendaGrid}>
          <Calendar
            size="lg"
            markedDates={marked}
            selected={selectedDate}
            onSelect={setSelectedDate}
          />

          <div className={styles.agendaDia}>
            <h3 className={styles.agendaDiaTitulo}>
              {DAY_OF_WEEK_LONG[selectedDay.getDay()]}, {selectedDay.toLocaleDateString('pt-BR')}
            </h3>

            {daySlots.length === 0 ? (
              <p className={styles.agendaVazia}>Sem atendimentos neste dia.</p>
            ) : (
              <ul className={styles.agendaLista}>
                {daySlots.map(s => {
                  const patient = patientById.get(s.patientId)
                  const patientName = patient?.name ?? '—'
                  const whatsapp = patient?.whatsapp ?? patient?.phone   // WhatsApp cadastrado ou o próprio celular
                  return (
                    <li key={s.id} className={styles.agendaItem}>
                      <span className={styles.agendaHora}>{s.startTime}–{s.endTime}</span>
                      <span className={styles.agendaInfo}>
                        <span className={styles.agendaPaciente}>{patientName}</span>
                        <span className={styles.agendaMeta}>
                          {[s.activity, s.room].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className={styles.agendaAcoes}>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<IconPhone />}
                          disabled={!patient?.phone}
                          title="Ligar"
                          aria-label={`Ligar para ${patientName}`}
                          onClick={() => {
                            window.location.href = `tel:+55${digitsOnly(patient!.phone)}`
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<IconMessage />}
                          disabled={!whatsapp}
                          title="Chamar no WhatsApp"
                          aria-label={`Chamar ${patientName} no WhatsApp`}
                          onClick={() => window.open(`https://wa.me/55${digitsOnly(whatsapp ?? '')}`, '_blank')}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<IconEye />}
                          disabled={!patient}
                          title="Ver perfil do paciente"
                          aria-label={`Ver perfil de ${patientName}`}
                          onClick={() => navigate(buildRoute.patientProfile(patient!.id))}
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
