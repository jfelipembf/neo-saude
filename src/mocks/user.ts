import type { UserProfile } from '@/types/domain'

export const MOCK_USER: UserProfile = {
  id: 'u1',
  clinicId: 'c1',
  code: 'NS-000016',
  professionalId: 'f1',        // Dra. Camila Duarte em mocks/professionals
  photo: 'https://i.pravatar.cc/160?img=45',   // demonstração; sem foto cai nas iniciais
  name: 'Dra. Camila Duarte',
  specialty: 'Clínica Geral',
  license: 'CRM/SE 12345',
  email: 'demo@neosaude.com.br',
  phone: '(79) 99123-4567',
  address: 'Av. Beira Mar, 795 — Sala 600',
  city: 'Aracaju/SE',
  cep: '49020-010',
  memberSince: '12/03/2024',
}
