import type { Room } from '@/types/domain'

export const MOCK_ROOMS: Room[] = [
  { id: 's1', clinicId: 'c1', name: 'Consultório 1',          photo: 'https://picsum.photos/seed/neosaude-sala1/640/400' },
  { id: 's2', clinicId: 'c1', name: 'Consultório 2',          photo: 'https://picsum.photos/seed/neosaude-sala2/640/400' },
  { id: 's3', clinicId: 'c1', name: 'Sala de Odontologia',    photo: 'https://picsum.photos/seed/neosaude-sala3/640/400' },
  { id: 's4', clinicId: 'c1', name: 'Sala de Fisioterapia',   photo: 'https://picsum.photos/seed/neosaude-sala4/640/400' },
  { id: 's5', clinicId: 'c1', name: 'Sala de Esterilização' },
  { id: 's6', clinicId: 'c1', name: 'Recepção' },
]
