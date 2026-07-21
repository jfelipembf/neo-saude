import type { AppointmentHistory } from '@/types/domain'

// Ordenado da mais recente para a mais antiga (ordem de exibição da timeline).
export const MOCK_HISTORICO_CONSULTAS: AppointmentHistory[] = [
  {
    id: 'h1', pacienteId: 'p1', data: '15/07/2026', hora: '08:00',
    atendimento: 'Consulta clínica', profissional: 'Dra. Camila Duarte', duracao: '40 min',
    procedimentos: ['Avaliação geral', 'Aferição de pressão arterial', 'Solicitação de exames de rotina'],
    materiais: [
      { nome: 'Luvas de procedimento', quantidade: '2 un' },
      { nome: 'Abaixador de língua',   quantidade: '1 un' },
    ],
    observacao: 'Paciente relatou dores de cabeça recorrentes. Retorno marcado após resultado dos exames.',
  },
  {
    id: 'h2', pacienteId: 'p1', data: '02/06/2026', hora: '09:30',
    atendimento: 'Retorno', profissional: 'Dra. Camila Duarte', duracao: '25 min',
    procedimentos: ['Análise de exames laboratoriais', 'Ajuste de medicação'],
    observacao: 'Exames dentro da normalidade; mantida a dose atual com reavaliação em 60 dias.',
  },
  {
    id: 'h3', pacienteId: 'p1', data: '12/05/2026', hora: '14:00',
    atendimento: 'Sessão de fisioterapia', profissional: 'Dr. Bruno Teixeira', duracao: '50 min',
    procedimentos: ['Liberação miofascial lombar', 'Exercícios de fortalecimento do core'],
    materiais: [
      { nome: 'Bola suíça',            quantidade: '1 un' },
      { nome: 'Faixa elástica média',  quantidade: '1 un' },
      { nome: 'Gel de contato',        quantidade: '10 ml' },
    ],
  },
  {
    id: 'h4', pacienteId: 'p1', data: '20/04/2026', hora: '10:40',
    atendimento: 'Limpeza dental', profissional: 'Dra. Paula Menezes', duracao: '45 min',
    procedimentos: ['Profilaxia completa', 'Aplicação de flúor', 'Orientação de higiene bucal'],
    materiais: [
      { nome: 'Pasta profilática',     quantidade: '5 g' },
      { nome: 'Flúor gel',             quantidade: '3 ml' },
      { nome: 'Sugador descartável',   quantidade: '1 un' },
    ],
  },
  {
    id: 'h5', pacienteId: 'p2', data: '10/07/2026', hora: '10:00',
    atendimento: 'Limpeza dental', profissional: 'Dra. Paula Menezes', duracao: '40 min',
    procedimentos: ['Profilaxia completa', 'Remoção de tártaro'],
    materiais: [
      { nome: 'Pasta profilática',   quantidade: '5 g' },
      { nome: 'Sugador descartável', quantidade: '1 un' },
    ],
  },
  {
    id: 'h6', pacienteId: 'p3', data: '02/07/2026', hora: '15:30',
    atendimento: 'Avaliação fisioterapia', profissional: 'Dr. Bruno Teixeira', duracao: '60 min',
    procedimentos: ['Anamnese completa', 'Testes de mobilidade', 'Plano de tratamento inicial'],
    observacao: 'Encaminhada para 10 sessões, duas vezes por semana.',
  },
]
