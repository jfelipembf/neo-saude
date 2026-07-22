import { toIsoDate } from '@/utils/date'
import type { AgendaAppointment } from '@/types/domain'

// Cores por atividade (pasteurizadas pela máscara --grade-card-scrim no card).
const FISIO = '#10B981'
const PILATES = '#8B5CF6'
const CLINICA = '#3B82F6'
const NUTRI = '#F59E0B'
const PSICO = '#EC4899'

/** Data (aaaa-mm-dd) do dia da semana pedido DENTRO da semana atual — os mocks
 *  sempre povoam a semana visível ao abrir a Agenda. */
function thisWeek(weekday: number) {
  const today = new Date()
  return toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + weekday))
}

export const MOCK_SCHEDULE_SLOTS: AgendaAppointment[] = [
  // Segunda
  { id: 'g1', clinicId: 'c1',  patientId: 'p1',  activity: 'Fisioterapia',          date: thisWeek(1), startTime: '07:00', endTime: '08:00', professionalId: 'f3', room: 'Sala 2',  color: FISIO,   status: 'scheduled' },
  { id: 'g2', clinicId: 'c1',  patientId: 'p3',  activity: 'Consulta clínica',      date: thisWeek(1), startTime: '09:00', endTime: '10:00', professionalId: 'f1', room: 'Cons. 1', color: CLINICA, status: 'scheduled' },
  { id: 'g3', clinicId: 'c1',  patientId: 'p4',  activity: 'Consulta clínica',      date: thisWeek(1), startTime: '10:00', endTime: '11:00', professionalId: 'f1', room: 'Cons. 1', color: CLINICA, status: 'scheduled' },
  { id: 'g4', clinicId: 'c1',  patientId: 'p5',  activity: 'Pilates clínico',       date: thisWeek(1), startTime: '18:00', endTime: '19:00', professionalId: 'f3', room: 'Sala 3',  color: PILATES, status: 'scheduled' },
  // Terça
  { id: 'g5', clinicId: 'c1',  patientId: 'p7',  activity: 'Avaliação nutricional', date: thisWeek(2), startTime: '08:00', endTime: '09:00', professionalId: 'f5', room: 'Cons. 2', color: NUTRI,   status: 'scheduled' },
  { id: 'g6', clinicId: 'c1',  patientId: 'p6',  activity: 'Psicologia',            date: thisWeek(2), startTime: '14:00', endTime: '15:00', professionalId: 'f4', room: 'Cons. 3', color: PSICO,   status: 'scheduled' },
  { id: 'g7', clinicId: 'c1',  patientId: 'p8',  activity: 'Psicologia',            date: thisWeek(2), startTime: '15:00', endTime: '16:00', professionalId: 'f4', room: 'Cons. 3', color: PSICO,   status: 'scheduled' },
  // Quarta
  { id: 'g8', clinicId: 'c1',  patientId: 'p2',  activity: 'Fisioterapia',          date: thisWeek(3), startTime: '07:00', endTime: '08:00', professionalId: 'f3', room: 'Sala 2',  color: FISIO,   status: 'scheduled' },
  { id: 'g9', clinicId: 'c1',  patientId: 'p1',  activity: 'Consulta clínica',      date: thisWeek(3), startTime: '09:00', endTime: '10:00', professionalId: 'f1', room: 'Cons. 1', color: CLINICA, status: 'scheduled' },
  { id: 'g10', clinicId: 'c1', patientId: 'p5',  activity: 'Pilates clínico',       date: thisWeek(3), startTime: '18:00', endTime: '19:00', professionalId: 'f3', room: 'Sala 3',  color: PILATES, status: 'canceled' },
  // Quinta
  { id: 'g11', clinicId: 'c1', patientId: 'p3',  activity: 'Avaliação nutricional', date: thisWeek(4), startTime: '08:00', endTime: '09:00', professionalId: 'f5', room: 'Cons. 2', color: NUTRI,   status: 'scheduled' },
  { id: 'g12', clinicId: 'c1', patientId: 'p4',  activity: 'Psicologia',            date: thisWeek(4), startTime: '14:00', endTime: '15:00', professionalId: 'f4', room: 'Cons. 3', color: PSICO,   status: 'scheduled' },
  // Sexta
  { id: 'g13', clinicId: 'c1', patientId: 'p3',  activity: 'Fisioterapia',          date: thisWeek(5), startTime: '07:00', endTime: '08:00', professionalId: 'f3', room: 'Sala 2',  color: FISIO,   status: 'scheduled' },
  { id: 'g14', clinicId: 'c1', patientId: 'p7',  activity: 'Consulta clínica',      date: thisWeek(5), startTime: '09:00', endTime: '10:00', professionalId: 'f1', room: 'Cons. 1', color: CLINICA, status: 'scheduled' },
  // Sábado
  { id: 'g15', clinicId: 'c1', patientId: 'p6',  activity: 'Pilates clínico',       date: thisWeek(6), startTime: '09:00', endTime: '10:00', professionalId: 'f3', room: 'Sala 3',  color: PILATES, status: 'scheduled' },
]
