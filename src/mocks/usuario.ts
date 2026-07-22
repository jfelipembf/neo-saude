import type { UserProfile } from '@/types/domain'

export const MOCK_USUARIO: UserProfile = {
  id: 'NS-00016',
  profissionalId: 'f1',        // Dra. Camila Duarte em mocks/profissionais
  foto: 'https://i.pravatar.cc/160?img=45',   // demonstração; sem foto cai nas iniciais
  nome: 'Dra. Camila Duarte',
  especialidade: 'Clínica Geral',
  registro: 'CRM/SE 12345',
  email: 'demo@neosaude.com.br',
  telefone: '(79) 99123-4567',
  endereco: 'Av. Beira Mar, 795 — Sala 600',
  cidade: 'Aracaju/SE',
  cep: '49020-010',
  membroDesde: '12/03/2024',
}
