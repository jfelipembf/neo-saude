import type { Consulta } from '@/types/domain'

export const MOCK_CONSULTAS: Consulta[] = [
  { id: 'c1', hora: '08:00', paciente: 'Maria Oliveira',   atendimento: 'Consulta clínica',      profissional: 'Dra. Camila Duarte',  status: 'concluida' },
  { id: 'c2', hora: '08:40', paciente: 'João Santos',      atendimento: 'Retorno',               profissional: 'Dra. Camila Duarte',  status: 'concluida' },
  { id: 'c3', hora: '09:30', paciente: 'Ana Costa',        atendimento: 'Avaliação fisioterapia', profissional: 'Dr. Bruno Teixeira', status: 'em_atendimento' },
  { id: 'c4', hora: '10:00', paciente: 'Juliana Rocha',    atendimento: 'Limpeza dental',        profissional: 'Dra. Paula Menezes',  status: 'confirmada' },
  { id: 'c5', hora: '10:40', paciente: 'Carlos Pereira',   atendimento: 'Sessão psicologia',     profissional: 'Dr. André Villas',    status: 'confirmada' },
  { id: 'c6', hora: '11:20', paciente: 'Fernanda Lima',    atendimento: 'Consulta nutrição',     profissional: 'Dra. Renata Campos',  status: 'agendada' },
  { id: 'c7', hora: '14:00', paciente: 'Ricardo Almeida',  atendimento: 'Consulta clínica',      profissional: 'Dra. Camila Duarte',  status: 'agendada' },
  { id: 'c8', hora: '15:30', paciente: 'Pedro Nascimento', atendimento: 'Retorno ortodontia',    profissional: 'Dra. Paula Menezes',  status: 'cancelada' },
]
