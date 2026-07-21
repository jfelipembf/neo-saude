import type { Lead } from '@/types/domain'

export const MOCK_LEADS: Lead[] = [
  { id: 'l1', nome: 'Beatriz Souza',    telefone: '(79) 99811-2233', origem: 'Instagram',  interesse: 'Avaliação nutricional', criadoEm: '19/07', status: 'novo_contato' },
  { id: 'l2', nome: 'Marcos Vinícius',  telefone: '(79) 99622-3344', origem: 'Google',     interesse: 'Consulta clínica',      criadoEm: '20/07', status: 'novo_contato' },
  { id: 'l3', nome: 'Larissa Prado',    telefone: '(79) 98133-4455', origem: 'Indicação',  interesse: 'Limpeza dental',        criadoEm: '21/07', status: 'novo_contato' },
  { id: 'l9', nome: 'Vanessa Almeida',  telefone: '(79) 99599-0011', origem: 'WhatsApp',   interesse: 'Pacote de fisioterapia', criadoEm: '18/07', status: 'em_negociacao' },
  { id: 'l10', nome: 'Henrique Dias',   telefone: '(79) 98400-1122', origem: 'Google',     interesse: 'Plano odontológico',     criadoEm: '19/07', status: 'em_negociacao' },
  { id: 'l4', nome: 'Otávio Ramos',     telefone: '(79) 99744-5566', origem: 'WhatsApp',   interesse: 'Fisioterapia',          criadoEm: '17/07', status: 'agendamento' },
  { id: 'l5', nome: 'Camila Ferreira',  telefone: '(79) 98455-6677', origem: 'Instagram',  interesse: 'Sessão psicologia',     criadoEm: '18/07', status: 'agendamento' },
  { id: 'l6', nome: 'Diego Martins',    telefone: '(79) 99366-7788', origem: 'Google',     interesse: 'Dermatologia',          criadoEm: '14/07', status: 'converteu' },
  { id: 'l7', nome: 'Patrícia Nunes',   telefone: '(79) 98277-8899', origem: 'Indicação',  interesse: 'Consulta clínica',      criadoEm: '12/07', status: 'converteu' },
  { id: 'l8', nome: 'Rafael Barbosa',   telefone: '(79) 99188-9900', origem: 'Instagram',  interesse: 'Ortodontia',            criadoEm: '10/07', status: 'perdeu' },
]
