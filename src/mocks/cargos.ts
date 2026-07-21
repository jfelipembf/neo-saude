import type { Role } from '@/types/domain'

// Cargos padrão da clínica — as páginas marcadas são os switches ligados
// na aba Cargos do Administrativo.
export const MOCK_CARGOS: Role[] = [
  {
    id: 'c1',
    nome: 'Recepcionista',
    paginas: ['dashboard', 'agenda', 'pacientes'],
  },
  {
    id: 'c2',
    nome: 'Especialista',
    paginas: ['dashboard', 'agenda', 'pacientes', 'profissionais'],
  },
  {
    id: 'c3',
    nome: 'Gerente',
    // Gerente enxerga tudo, inclusive Financeiro e Administrativo.
    paginas: ['dashboard', 'agenda', 'pacientes', 'profissionais', 'financeiro', 'administrativo', 'configuracoes'],
  },
]
