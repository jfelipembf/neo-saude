import type { Quote } from '@/types/domain'

// Orçamentos de demonstração — mais recente primeiro.
export const MOCK_ORCAMENTOS: Quote[] = [
  {
    id: 'o1', pacienteId: 'p1', nome: 'Plano de tratamento de Maria Oliveira',
    data: '18/07/2026', status: 'aguardando',
    itens: [
      {
        tratamento: 'Restauração em resina composta', profissional: 'Dra. Paula Menezes',
        convenio: 'Particular', dentes: ['16', '25'], faces: ['O/I'],
        valorUnitario: 350, multiplicaPorDente: true, valor: 700,
      },
      {
        tratamento: 'Clareamento em consultório', profissional: 'Dra. Paula Menezes',
        convenio: 'Particular', valorUnitario: 900, valor: 900,
      },
    ],
    desconto: 100,
    parcelas: 3,
    observacao: 'Valores válidos por 30 dias.',
  },
  {
    id: 'o2', pacienteId: 'p1', nome: 'Tratamento de canal — dente 36',
    data: '10/07/2026', status: 'aprovado',
    itens: [
      {
        tratamento: 'Tratamento endodôntico (canal)', profissional: 'Dra. Paula Menezes',
        convenio: 'Particular', dentes: ['36'], valorUnitario: 750, valor: 750,
      },
    ],
    parcelas: 1,
  },
]
