import type { ClinicData, TechnicalManager } from '@/types/domain'

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

export const MOCK_TECHNICAL_MANAGER: TechnicalManager = {
  firstName: 'Camila',
  lastName: 'Duarte',
  sex: 'female',
  birthDate: '12/05/1988',
  phone: '(79) 99988-7766',
  email: 'camila.duarte@neosaude.com.br',
  cep: '49000-000',
  state: 'SE',
  city: 'Aracaju',
  neighborhood: 'Jardins',
  street: 'Rua das Acácias',
  number: '56',
}
