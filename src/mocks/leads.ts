import type { Lead } from '@/types/domain'

export const MOCK_LEADS: Lead[] = [
  { id: 'l1', clinicId: 'c1', name: 'Beatriz Souza',    phone: '(79) 99811-2233', source: 'Instagram',  interest: 'Avaliação nutricional', createdAt: '19/07', status: 'new' },
  { id: 'l2', clinicId: 'c1', name: 'Marcos Vinícius',  phone: '(79) 99622-3344', source: 'Google',     interest: 'Consulta clínica',      createdAt: '20/07', status: 'new' },
  { id: 'l3', clinicId: 'c1', name: 'Larissa Prado',    phone: '(79) 98133-4455', source: 'Indicação',  interest: 'Limpeza dental',        createdAt: '21/07', status: 'new' },
  { id: 'l9', clinicId: 'c1', name: 'Vanessa Almeida',  phone: '(79) 99599-0011', source: 'WhatsApp',   interest: 'Pacote de fisioterapia', createdAt: '18/07', status: 'negotiating' },
  { id: 'l10', clinicId: 'c1', name: 'Henrique Dias',   phone: '(79) 98400-1122', source: 'Google',     interest: 'Plano odontológico',     createdAt: '19/07', status: 'negotiating' },
  { id: 'l4', clinicId: 'c1', name: 'Otávio Ramos',     phone: '(79) 99744-5566', source: 'WhatsApp',   interest: 'Fisioterapia',          createdAt: '17/07', status: 'scheduling' },
  { id: 'l5', clinicId: 'c1', name: 'Camila Ferreira',  phone: '(79) 98455-6677', source: 'Instagram',  interest: 'Sessão psicologia',     createdAt: '18/07', status: 'scheduling' },
  { id: 'l6', clinicId: 'c1', name: 'Diego Martins',    phone: '(79) 99366-7788', source: 'Google',     interest: 'Dermatologia',          createdAt: '14/07', status: 'converted' },
  { id: 'l7', clinicId: 'c1', name: 'Patrícia Nunes',   phone: '(79) 98277-8899', source: 'Indicação',  interest: 'Consulta clínica',      createdAt: '12/07', status: 'converted' },
  { id: 'l8', clinicId: 'c1', name: 'Rafael Barbosa',   phone: '(79) 99188-9900', source: 'Instagram',  interest: 'Ortodontia',            createdAt: '10/07', status: 'lost' },
]
