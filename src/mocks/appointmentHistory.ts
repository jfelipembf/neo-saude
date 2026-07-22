import type { AppointmentHistory } from '@/types/domain'

// Ordenado da mais recente para a mais antiga (ordem de exibição da timeline).
export const MOCK_APPOINTMENT_HISTORY: AppointmentHistory[] = [
  {
    id: 'h1',
    clinicId: 'c1', patientId: 'p1', date: '15/07/2026', time: '08:00',
    service: 'Consulta clínica', professionalId: 'f1', duration: '40 min',
    procedures: ['Avaliação geral', 'Aferição de pressão arterial', 'Solicitação de exames de rotina'],
    materials: [
      { name: 'Luvas de procedimento', quantity: '2 un' },
      { name: 'Abaixador de língua',   quantity: '1 un' },
    ],
    notes: 'Paciente relatou dores de cabeça recorrentes. Retorno marcado após resultado dos exames.',
  },
  {
    id: 'h2',
    clinicId: 'c1', patientId: 'p1', date: '02/06/2026', time: '09:30',
    service: 'Retorno', professionalId: 'f1', duration: '25 min',
    procedures: ['Análise de exames laboratoriais', 'Ajuste de medicação'],
    notes: 'Exames dentro da normalidade; mantida a dose atual com reavaliação em 60 dias.',
  },
  {
    id: 'h3',
    clinicId: 'c1', patientId: 'p1', date: '12/05/2026', time: '14:00',
    service: 'Sessão de fisioterapia', professionalId: 'f3', duration: '50 min',
    procedures: ['Liberação miofascial lombar', 'Exercícios de fortalecimento do core'],
    materials: [
      { name: 'Bola suíça',            quantity: '1 un' },
      { name: 'Faixa elástica média',  quantity: '1 un' },
      { name: 'Gel de contato',        quantity: '10 ml' },
    ],
  },
  {
    id: 'h4',
    clinicId: 'c1', patientId: 'p1', date: '20/04/2026', time: '10:40',
    service: 'Limpeza dental', professionalId: 'f2', duration: '45 min',
    procedures: ['Profilaxia completa', 'Aplicação de flúor', 'Orientação de higiene bucal'],
    materials: [
      { name: 'Pasta profilática',     quantity: '5 g' },
      { name: 'Flúor gel',             quantity: '3 ml' },
      { name: 'Sugador descartável',   quantity: '1 un' },
    ],
  },
  {
    id: 'h5',
    clinicId: 'c1', patientId: 'p2', date: '10/07/2026', time: '10:00',
    service: 'Limpeza dental', professionalId: 'f2', duration: '40 min',
    procedures: ['Profilaxia completa', 'Remoção de tártaro'],
    materials: [
      { name: 'Pasta profilática',   quantity: '5 g' },
      { name: 'Sugador descartável', quantity: '1 un' },
    ],
  },
  {
    id: 'h6',
    clinicId: 'c1', patientId: 'p3', date: '02/07/2026', time: '15:30',
    service: 'Avaliação fisioterapia', professionalId: 'f3', duration: '60 min',
    procedures: ['Anamnese completa', 'Testes de mobilidade', 'Plano de tratamento inicial'],
    notes: 'Encaminhada para 10 sessões, duas vezes por semana.',
  },
]
