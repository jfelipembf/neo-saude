import type { Profissional } from '@/types/domain'

export const MOCK_PROFISSIONAIS: Profissional[] = [
  {
    id: 'f1', nome: 'Dra. Camila Duarte', especialidade: 'Clínica Geral', registro: 'CRM/SE 12345', status: 'ativo',
    descricao: 'Consultas de rotina, check-ups e acompanhamento de condições crônicas.', nota: 4.9,
  },
  {
    id: 'f2', nome: 'Dra. Paula Menezes', especialidade: 'Odontologia', registro: 'CRO/SE 4567', status: 'ativo',
    descricao: 'Limpeza, restaurações e estética dental.', nota: 4.8,
  },
  {
    id: 'f3', nome: 'Dr. Bruno Teixeira', especialidade: 'Fisioterapia', registro: 'CREFITO-16 78901', status: 'ativo',
    descricao: 'Reabilitação ortopédica, RPG e pilates clínico.', nota: 4.7,
  },
  {
    id: 'f4', nome: 'Dr. André Villas', especialidade: 'Psicologia', registro: 'CRP-19 2345', status: 'ativo',
    descricao: 'Terapia individual para adultos e adolescentes.', nota: 5,
  },
  {
    id: 'f5', nome: 'Dra. Renata Campos', especialidade: 'Nutrição', registro: 'CRN-5 6789', status: 'ativo',
    descricao: 'Emagrecimento, nutrição esportiva e reeducação alimentar.', nota: 4.6,
  },
  {
    id: 'f6', nome: 'Dr. Felipe Araújo', especialidade: 'Dermatologia', registro: 'CRM/SE 23456', status: 'inativo',
    descricao: 'Consultas dermatológicas e pequenos procedimentos.', nota: 4.5,
  },
]
