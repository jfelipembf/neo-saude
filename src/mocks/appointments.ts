import type { Appointment } from '@/types/domain'

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'c1', clinicId: 'c1', time: '08:00', patientId: 'p1',   service: 'Consulta clínica',      professionalId: 'f1',  status: 'completed' },
  { id: 'c2', clinicId: 'c1', time: '08:40', patientId: 'p2',      service: 'Retorno',               professionalId: 'f1',  status: 'completed' },
  { id: 'c3', clinicId: 'c1', time: '09:30', patientId: 'p3',        service: 'Avaliação fisioterapia', professionalId: 'f3', status: 'in_service' },
  { id: 'c4', clinicId: 'c1', time: '10:00', patientId: 'p7',    service: 'Limpeza dental',        professionalId: 'f2',  status: 'confirmed' },
  { id: 'c5', clinicId: 'c1', time: '10:40', patientId: 'p4',   service: 'Sessão psicologia',     professionalId: 'f4',    status: 'confirmed' },
  { id: 'c6', clinicId: 'c1', time: '11:20', patientId: 'p5',    service: 'Consulta nutrição',     professionalId: 'f5',  status: 'scheduled' },
  { id: 'c7', clinicId: 'c1', time: '14:00', patientId: 'p6',  service: 'Consulta clínica',      professionalId: 'f1',  status: 'scheduled' },
  { id: 'c8', clinicId: 'c1', time: '15:30', patientId: 'p8', service: 'Retorno ortodontia',    professionalId: 'f2',  status: 'canceled' },
]
