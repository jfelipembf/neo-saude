import type { Room } from '@/types/domain'

export const MOCK_SALAS: Room[] = [
  { id: 's1', nome: 'Consultório 1',          foto: 'https://picsum.photos/seed/neosaude-sala1/640/400' },
  { id: 's2', nome: 'Consultório 2',          foto: 'https://picsum.photos/seed/neosaude-sala2/640/400' },
  { id: 's3', nome: 'Sala de Odontologia',    foto: 'https://picsum.photos/seed/neosaude-sala3/640/400' },
  { id: 's4', nome: 'Sala de Fisioterapia',   foto: 'https://picsum.photos/seed/neosaude-sala4/640/400' },
  { id: 's5', nome: 'Sala de Esterilização' },
  { id: 's6', nome: 'Recepção' },
]
