import type { Role } from '@/types/domain'

// Cargos padrão da clínica — as páginas marcadas são os switches ligados
// na aba Cargos do Administrativo.
export const MOCK_ROLES: Role[] = [
  {
    id: 'c1',
    clinicId: 'c1',
    name: 'Recepcionista',
    pages: ['dashboard', 'schedule', 'patients'],
  },
  {
    id: 'c2',
    clinicId: 'c1',
    name: 'Especialista',
    pages: ['dashboard', 'schedule', 'patients', 'professionals'],
  },
  {
    id: 'c3',
    clinicId: 'c1',
    name: 'Gerente',
    // Gerente enxerga tudo, inclusive Financeiro e Administrativo.
    pages: ['dashboard', 'schedule', 'patients', 'professionals', 'finance', 'admin', 'settings'],
  },
]
