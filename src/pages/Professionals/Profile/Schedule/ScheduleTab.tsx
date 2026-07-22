import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar } from '@/components/Calendar/Calendar'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { IconSchedule, IconPhone, IconMessage, IconEye } from '@/components/icons'
import { buildRoute, DAY_OF_WEEK_LONG } from '@/constants'
import { useAgendaAppointments } from '@/hooks/useSchedule'
import { usePatients } from '@/hooks/usePatients'
import { toIsoDate, localDate } from '@/utils/date'
import { digitsOnly } from '@/utils/text'
import type { Professional } from '@/types/domain'
import shared from '../shared/profile.module.scss'
import styles from './ScheduleTab.module.scss'

interface ScheduleTabProps {
  professional: Professional
}

/** Aba "Agenda": calendário + consultas do dia escolhido. Consultas são
 *  eventos datados (não recorrentes); a janela de ±6 meses cobre de sobra a
 *  navegação do calendário. */
export function ScheduleTab({ professional }: ScheduleTabProps) {
  const navigate = useNavigate()
  const today = new Date()
  const fromIso = toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 182))
  const toIso = toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 182))
  const { data: appointments } = useAgendaAppointments(fromIso, toIso)
  const { data: patients } = usePatients()

  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()))

  const professionalSlots = (appointments ?? []).filter(
    s => s.status !== 'canceled' && s.professionalId === professional.id,
  )

  // Pontinho no calendário nos dias com atendimento.
  const marked = [...new Set(professionalSlots.map(s => s.date))]

  const selectedDay = localDate(selectedDate)
  const daySlots = professionalSlots
    .filter(s => s.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Contatos dos pacientes do dia (a grade guarda o id; o nome sai daqui).
  const patientById = new Map((patients ?? []).map(p => [p.id, p]))

  return (
    <section className={shared.formCard} aria-label="Agenda">
      <h2 className={shared.formTitulo}>Agenda</h2>

      {professionalSlots.length === 0 ? (
        <EmptyState
          icon={<IconSchedule />}
          title="Nenhuma consulta agendada"
          description="Este profissional ainda não tem consultas agendadas na Agenda."
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
