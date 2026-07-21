import type { ClinicData, TechnicalManager } from '@/types/domain'

export const MOCK_CONSULTORIO: ClinicData = {
  // Logo de demonstração — no uso real vem do upload em Administrativo.
  logo: '/pwa-192x192.png',
  nome: 'Clínica Neo Saúde',
  cnpj: '12.345.678/0001-90',
  email: 'contato@neosaude.com.br',
  telefone: '(79) 3211-0000',
  cep: '49000-000',
  estado: 'SE',
  cidade: 'Aracaju',
  bairro: 'Centro',
  rua: 'Av. Beira Mar',
  numero: '1234',
}

export const MOCK_RESPONSAVEL: TechnicalManager = {
  nome: 'Camila',
  sobrenome: 'Duarte',
  sexo: 'feminino',
  nascimento: '12/05/1988',
  telefone: '(79) 99988-7766',
  email: 'camila.duarte@neosaude.com.br',
  cep: '49000-000',
  estado: 'SE',
  cidade: 'Aracaju',
  bairro: 'Jardins',
  rua: 'Rua das Acácias',
  numero: '56',
}
