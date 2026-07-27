import { describe, expect, it } from 'vitest'
import type { Patient, ScheduledAppointment } from '@/types/domain'
import { professionalAgendaEntries } from './professionalAgenda'

const patients = [
  { id: 'patient-1', code: 'PAC-000001', name: 'Lucas Silva' },
  { id: 'patient-2', code: 'PAC-000002', name: 'Ana Souza' },
] as Patient[]

function appointment(
  extra: Partial<ScheduledAppointment> = {},
): ScheduledAppointment {
  return {
    id: 'appointment-1',
    clinicId: 'clinic-1',
    patientId: 'patient-1',
    professionalId: 'professional-1',
    activity: 'Consulta',
    date: '2026-07-31',
    startTime: '09:00',
    endTime: '10:00',
    status: 'scheduled',
    sendConfirmation: false,
    isOverbook: false,
    ...extra,
  }
}

describe('visão geral da agenda da Cibelly', () => {
  it('informa quem ocupa o horário, inclusive durante a consulta', () => {
    const result = professionalAgendaEntries(
      [appointment()],
      patients,
      {
        professionalId: 'professional-1',
        date: '2026-07-31',
        time: '09:30',
      },
    )

    expect(result).toEqual([expect.objectContaining({
      paciente: 'Lucas Silva',
      codigo: 'PAC-000001',
      inicio: '09:00',
      fim: '10:00',
    })])
  })

  it('ignora canceladas e consultas de outro profissional', () => {
    const result = professionalAgendaEntries(
      [
        appointment({ status: 'canceled' }),
        appointment({
          id: 'appointment-2',
          patientId: 'patient-2',
          professionalId: 'professional-2',
        }),
      ],
      patients,
      {
        professionalId: 'professional-1',
        date: '2026-07-31',
        time: '09:00',
      },
    )

    expect(result).toEqual([])
  })
})
