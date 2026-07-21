import type { ScheduleSlot } from '@/types/domain'

// Cores por atividade (pasteurizadas pela máscara --grade-card-scrim no card).
const FISIO = '#10B981'
const PILATES = '#8B5CF6'
const CLINICA = '#3B82F6'
const NUTRI = '#F59E0B'
const PSICO = '#EC4899'

export const MOCK_GRADE_SESSOES: ScheduleSlot[] = [
  // Segunda
  { id: 'g1',  paciente: 'Maria Oliveira',   atividade: 'Fisioterapia',          diaSemana: 1, horaInicio: '07:00', horaFim: '08:00', profissional: 'Bruno Teixeira', sala: 'Sala 2',  cor: FISIO,   status: 'ativa' },
  { id: 'g2',  paciente: 'Ana Costa',        atividade: 'Consulta clínica',      diaSemana: 1, horaInicio: '09:00', horaFim: '10:00', profissional: 'Camila Duarte',  sala: 'Cons. 1', cor: CLINICA, status: 'ativa' },
  { id: 'g3',  paciente: 'Carlos Pereira',   atividade: 'Consulta clínica',      diaSemana: 1, horaInicio: '10:00', horaFim: '11:00', profissional: 'Camila Duarte',  sala: 'Cons. 1', cor: CLINICA, status: 'ativa' },
  { id: 'g4',  paciente: 'Fernanda Lima',    atividade: 'Pilates clínico',       diaSemana: 1, horaInicio: '18:00', horaFim: '19:00', profissional: 'Bruno Teixeira', sala: 'Sala 3',  cor: PILATES, status: 'ativa' },
  // Terça
  { id: 'g5',  paciente: 'Juliana Rocha',    atividade: 'Avaliação nutricional', diaSemana: 2, horaInicio: '08:00', horaFim: '09:00', profissional: 'Renata Campos',  sala: 'Cons. 2', cor: NUTRI,   status: 'ativa' },
  { id: 'g6',  paciente: 'Ricardo Almeida',  atividade: 'Psicologia',            diaSemana: 2, horaInicio: '14:00', horaFim: '15:00', profissional: 'André Villas',   sala: 'Cons. 3', cor: PSICO,   status: 'ativa' },
  { id: 'g7',  paciente: 'Pedro Nascimento', atividade: 'Psicologia',            diaSemana: 2, horaInicio: '15:00', horaFim: '16:00', profissional: 'André Villas',   sala: 'Cons. 3', cor: PSICO,   status: 'ativa' },
  // Quarta
  { id: 'g8',  paciente: 'João Santos',      atividade: 'Fisioterapia',          diaSemana: 3, horaInicio: '07:00', horaFim: '08:00', profissional: 'Bruno Teixeira', sala: 'Sala 2',  cor: FISIO,   status: 'ativa' },
  { id: 'g9',  paciente: 'Maria Oliveira',   atividade: 'Consulta clínica',      diaSemana: 3, horaInicio: '09:00', horaFim: '10:00', profissional: 'Camila Duarte',  sala: 'Cons. 1', cor: CLINICA, status: 'ativa' },
  { id: 'g10', paciente: 'Fernanda Lima',    atividade: 'Pilates clínico',       diaSemana: 3, horaInicio: '18:00', horaFim: '19:00', profissional: 'Bruno Teixeira', sala: 'Sala 3',  cor: PILATES, status: 'cancelada' },
  // Quinta
  { id: 'g11', paciente: 'Beatriz Souza',    atividade: 'Avaliação nutricional', diaSemana: 4, horaInicio: '08:00', horaFim: '09:00', profissional: 'Renata Campos',  sala: 'Cons. 2', cor: NUTRI,   status: 'ativa' },
  { id: 'g12', paciente: 'Carlos Pereira',   atividade: 'Psicologia',            diaSemana: 4, horaInicio: '14:00', horaFim: '15:00', profissional: 'André Villas',   sala: 'Cons. 3', cor: PSICO,   status: 'ativa' },
  // Sexta
  { id: 'g13', paciente: 'Ana Costa',        atividade: 'Fisioterapia',          diaSemana: 5, horaInicio: '07:00', horaFim: '08:00', profissional: 'Bruno Teixeira', sala: 'Sala 2',  cor: FISIO,   status: 'ativa' },
  { id: 'g14', paciente: 'Juliana Rocha',    atividade: 'Consulta clínica',      diaSemana: 5, horaInicio: '09:00', horaFim: '10:00', profissional: 'Camila Duarte',  sala: 'Cons. 1', cor: CLINICA, status: 'ativa' },
  // Sábado
  { id: 'g15', paciente: 'Ricardo Almeida',  atividade: 'Pilates clínico',       diaSemana: 6, horaInicio: '09:00', horaFim: '10:00', profissional: 'Bruno Teixeira', sala: 'Sala 3',  cor: PILATES, status: 'ativa' },
]
