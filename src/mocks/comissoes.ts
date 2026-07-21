import type { ProfessionalCommission } from '@/types/domain'

// Regras de comissão por profissional — os demais aparecem "sem comissão
// configurada" na aba Comissões do Administrativo.
export const MOCK_COMISSOES: ProfessionalCommission[] = [
  {
    profissionalId: 'f1', tipo: 'percentual', valor: 40, base: 'recebido',
    repasse: 'dia_fixo', diaRepasse: 5, status: 'ativo',
    observacao: 'Percentual padrão de clínica geral.',
  },
  {
    profissionalId: 'f2', tipo: 'percentual', valor: 35, base: 'realizado',
    repasse: 'dia_fixo', diaRepasse: 10, status: 'ativo',
  },
  {
    profissionalId: 'f3', tipo: 'valor_fixo', valor: 80, base: 'recebido',
    repasse: 'no_atendimento', status: 'ativo',
    observacao: 'R$ 80 por sessão, pago no dia do atendimento.',
  },
]
