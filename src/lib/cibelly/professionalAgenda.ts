import type { Patient, ScheduledAppointment } from '@/types/domain'

export interface ProfessionalAgendaEntry {
  paciente: string
  codigo: string
  inicio: string
  fim: string
  servico: string
  sala?: string
  situacao: ScheduledAppointment['status']
}

function minutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

export function professionalAgendaEntries(
  appointments: ScheduledAppointment[],
  patients: Patient[],
  input: {
    professionalId: string
    date: string
    time?: string
  },
): ProfessionalAgendaEntry[] {
  const byId = new Map(patients.map(patient => [patient.id, patient]))
  const requestedMinute = input.time ? minutes(input.time) : null

  return appointments
    .filter(appointment =>
      appointment.professionalId === input.professionalId
      && appointment.date === input.date
      && appointment.status !== 'canceled'
      && (requestedMinute === null
        || (
          minutes(appointment.startTime) <= requestedMinute
          && requestedMinute < minutes(appointment.endTime)
        )))
    .sort((left, right) => left.startTime.localeCompare(right.startTime))
    .map(appointment => {
      const patient = byId.get(appointment.patientId)
      return {
        paciente: patient?.name ?? 'Paciente não identificado',
        codigo: patient?.code ?? '',
        inicio: appointment.startTime,
        fim: appointment.endTime,
        servico: appointment.activity,
        sala: appointment.room,
        situacao: appointment.status,
      }
    })
}
