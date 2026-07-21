import type { Insurance } from '@/types/domain'

// Convênios aceitos — os selects de convênio do app (cadastro do paciente,
// orçamentos) montam as opções a partir desta lista (+ "Particular").
export const MOCK_CONVENIOS: Insurance[] = [
  {
    id: 'cv1', nome: 'Unimed', ans: '30.437-3', telefone: '(79) 4002-1010',
    email: 'credenciado@unimed.com.br', prazoRepasseDias: 30, status: 'ativo',
  },
  {
    id: 'cv2', nome: 'Bradesco Saúde', ans: '00.586-5', telefone: '(11) 4004-2700',
    prazoRepasseDias: 45, status: 'ativo',
  },
  {
    id: 'cv3', nome: 'SulAmérica', ans: '00.632-1', telefone: '(11) 4004-4935',
    prazoRepasseDias: 30, status: 'ativo',
  },
  {
    id: 'cv4', nome: 'Amil', ans: '32.632-6', telefone: '(11) 3004-1000',
    prazoRepasseDias: 60, status: 'ativo',
  },
  {
    id: 'cv5', nome: 'Hapvida', ans: '36.812-0', telefone: '(85) 4002-3633',
    prazoRepasseDias: 45, status: 'inativo',
    observacao: 'Credenciamento em análise.',
  },
]
