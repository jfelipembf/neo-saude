import type { Tratamento } from '@/types/domain'

export const MOCK_TRATAMENTOS: Tratamento[] = [
  {
    id: 't1', pacienteId: 'p1', dente: '16', procedimento: 'Restauração em resina composta',
    data: '10/07/2026', status: 'finalizado', observacao: 'Cárie oclusal — resina A2',
  },
  {
    id: 't2', pacienteId: 'p1', dente: '21', procedimento: 'Profilaxia e aplicação de flúor',
    data: '10/07/2026', status: 'finalizado',
  },
  {
    id: 't3', pacienteId: 'p1', dente: '36', procedimento: 'Tratamento de canal (1ª sessão)',
    data: '15/07/2026', status: 'em_aberto', observacao: 'Retorno agendado para a 2ª sessão',
  },
  {
    id: 't4', pacienteId: 'p1', dente: '42', procedimento: 'Extração',
    data: '02/06/2026', status: 'extraido', observacao: 'Indicação ortodôntica',
  },
  {
    id: 't5', pacienteId: 'p2', dente: '11', procedimento: 'Clareamento em consultório',
    data: '08/07/2026', status: 'finalizado',
  },
]
