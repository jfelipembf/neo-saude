// Especializações dos testes de fisioterapia (Administrativo → Testes). Lista
// fixa de sugestões comuns — o usuário pode digitar a própria especialização
// via a opção "Outra" (sentinela OTHER_TEST_SPECIALTY, ver TestsTab).
export const TEST_SPECIALTY_OPTIONS = [
  'Neurológica',
  'Ortopédica',
  'Respiratória (Cardiorrespiratória)',
  'Pediátrica',
  'Esportiva',
  'Geriátrica',
  'Uroginecológica',
  'Reumatológica',
] as const

/** Sentinela do Select: escolher "Outra" libera o campo de texto livre. */
export const OTHER_TEST_SPECIALTY = '__other__'
