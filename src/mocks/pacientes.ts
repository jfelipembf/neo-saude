import type { Paciente } from '@/types/domain'

export const MOCK_PACIENTES: Paciente[] = [
  { id: 'p1', nome: 'Maria Oliveira',   cpf: '935.975.310-67', telefone: '(79) 99911-2233', convenio: 'Unimed',      ultimaVisita: '15/07/2026', status: 'ativo' },
  { id: 'p2', nome: 'João Santos',      cpf: '481.220.654-30', telefone: '(79) 99844-5566', convenio: 'Particular',  ultimaVisita: '10/07/2026', status: 'ativo' },
  { id: 'p3', nome: 'Ana Costa',        cpf: '702.114.983-55', telefone: '(79) 99777-8899', convenio: 'Bradesco',    ultimaVisita: '02/07/2026', status: 'ativo' },
  { id: 'p4', nome: 'Carlos Pereira',   telefone: '(79) 99622-3344', convenio: 'SulAmérica',  ultimaVisita: '28/06/2026', status: 'ativo' },
  { id: 'p5', nome: 'Fernanda Lima',    telefone: '(79) 99555-6677', convenio: 'Particular',  ultimaVisita: '20/06/2026', status: 'ativo' },
  { id: 'p6', nome: 'Ricardo Almeida',  telefone: '(79) 99433-2211', convenio: 'Unimed',      ultimaVisita: '12/05/2026', status: 'inativo' },
  { id: 'p7', nome: 'Juliana Rocha',    telefone: '(79) 99311-9988', convenio: 'Amil',        ultimaVisita: '18/07/2026', status: 'ativo' },
  { id: 'p8', nome: 'Pedro Nascimento', telefone: '(79) 99299-8877', convenio: 'Particular',  ultimaVisita: '05/03/2026', status: 'inativo' },
]
