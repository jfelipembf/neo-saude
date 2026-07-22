import type { ClinicData } from '@/types/domain'

export const MOCK_CLINIC: ClinicData = {
  id: 'c1',                    // o tenant desta instalação
  specialty: 'dentistry',
  // Logo de demonstração — no uso real vem do upload em Administrativo.
  photo: '/pwa-192x192.png',
  name: 'Clínica Neo Saúde',
  cnpj: '12.345.678/0001-90',
  email: 'contato@neosaude.com.br',
  phone: '(79) 3211-0000',
  cep: '49000-000',
  state: 'SE',
  city: 'Aracaju',
  neighborhood: 'Centro',
  street: 'Av. Beira Mar',
  number: '1234',
}
