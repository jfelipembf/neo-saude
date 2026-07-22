import type { Treatment } from '@/types/domain'

// Snapshot do odontograma no formato do payload de export do motor
// ({version, teeth}) — só os dentes marcados; os demais voltam saudáveis.
const odonto = (teeth: Record<string, Record<string, unknown>>) =>
  ({ version: '2.10', teeth }) as Record<string, unknown>

// ── Reabilitação oral (t6): a ficha EVOLUI entre os procedimentos ────────────
// Cada snapshot é a boca INTEIRA naquele dia — expandir os procedimentos na
// timeline mostra o antes/depois no odontograma.

// Dia 1 — avaliação: cáries no 16 e 25, amálgama antigo com cárie recorrente
// no 36, siso 48 incluso, 21 escurecido (necrose) e cálculo nos incisivos.
const t6Dia1 = {
  16: { caries: ['caries-occlusal'], cariesSeverity: { occlusal: 5 } },
  25: { caries: ['caries-mesial', 'caries-occlusal'], cariesSeverity: { mesial: 3, occlusal: 4 } },
  36: {
    fillingMaterial: 'amalgam', fillingSurfaces: ['occlusal'],
    fillingSurfaceMaterials: { occlusal: 'amalgam' },
    caries: ['caries-occlusal'], cariesSeverity: { occlusal: 3 },   // recorrente sob o amálgama
  },
  48: { toothSelection: 'tooth-under-gum' },
  21: { discoloration: 'nonvital' },
  31: { calculus: true },
  41: { calculus: true },
}

// Dia 2 — 16 e 36 restaurados em resina; cálculo removido na profilaxia.
const t6Dia2 = {
  16: { fillingMaterial: 'composite', fillingSurfaces: ['occlusal'], fillingSurfaceMaterials: { occlusal: 'composite' } },
  36: { fillingMaterial: 'composite', fillingSurfaces: ['occlusal'], fillingSurfaceMaterials: { occlusal: 'composite' } },
  25: t6Dia1[25],
  48: t6Dia1[48],
  21: t6Dia1[21],
}

// Dia 3 — 25 restaurado e 48 extraído; falta só a endodontia do 21.
const t6Dia3 = {
  16: t6Dia2[16],
  36: t6Dia2[36],
  25: { fillingMaterial: 'composite', fillingSurfaces: ['mesial', 'occlusal'], fillingSurfaceMaterials: { mesial: 'composite', occlusal: 'composite' } },
  48: { toothSelection: 'no-tooth-after-extraction' },
  21: t6Dia1[21],
}

// Sessões (procedimentos) em ordem cronológica — a timeline percorre o array.
export const MOCK_TREATMENTS: Treatment[] = [
  {
    id: 't6',
    clinicId: 'c1', patientId: 'p1', tooth: '16, 21, 25, 36, 48',
    procedure: 'Reabilitação oral — plano restaurador',
    status: 'open', startedAt: '05/07/2026',
    notes: 'Plano pós-avaliação: restaurações, exodontia do 48 e endodontia do 21.',
    sessions: [
      {
        id: 't6s1',
      description: 'Avaliação clínica e mapeamento', date: '05/07/2026', professionalId: 'f2',
        amount: 180,
        teeth: ['16', '21', '25', '31', '36', '41', '48'],
        odontogram: odonto(t6Dia1),
        actions: [
          'Dente 16: Cárie oclusal profunda (ICDAS 5)',
          'Dente 25: Cárie mésio-oclusal',
          'Dente 36: Restauração de amálgama com cárie recorrente',
          'Dente 48: Siso incluso — exodontia indicada',
          'Dente 21: Escurecimento por necrose pulpar — endodontia indicada',
          'Dentes 31 e 41: Cálculo lingual',
        ],
        materials: [{ name: 'Película radiográfica periapical', quantity: '4 un' }],
        notes: 'Plano de tratamento apresentado e aprovado pelo paciente.',
      },
      {
        id: 't6s2',
      description: 'Profilaxia e substituição das restaurações', date: '12/07/2026', professionalId: 'f2',
        amount: 650,
        teeth: ['16', '31', '36', '41'],
        odontogram: odonto(t6Dia2),
        actions: [
          'Dente 16: Remoção da cárie e restauração em resina composta',
          'Dente 36: Troca do amálgama por resina composta',
          'Dentes 31 e 41: Raspagem e polimento — cálculo removido',
        ],
        materials: [
          { name: 'Resina fotopolimerizável A2', quantity: '1 tubete' },
          { name: 'Ácido fosfórico 37%',         quantity: '2 ml' },
          { name: 'Pasta profilática',           quantity: '1 dose' },
        ],
      },
      {
        id: 't6s3',
      description: 'Restauração do 25 e exodontia do 48', date: '19/07/2026', professionalId: 'f2',
        amount: 780,
        teeth: ['25', '48'],
        odontogram: odonto(t6Dia3),
        actions: [
          'Dente 25: Restauração mésio-oclusal em resina composta',
          'Dente 48: Exodontia do siso incluso e sutura',
        ],
        materials: [
          { name: 'Anestésico articaína 4%', quantity: '2 tubetes' },
          { name: 'Fio de sutura 4-0',       quantity: '1 envelope' },
          { name: 'Resina fotopolimerizável A2', quantity: '1 tubete' },
        ],
        notes: 'Falta a endodontia do 21 — agendar próximo procedimento.',
      },
    ],
  },
  {
    // O exemplo do conceito: UM tratamento com procedimentos em DIAS diferentes.
    id: 't3',
    clinicId: 'c1', patientId: 'p1', tooth: '36', procedure: 'Tratamento de canal',
    status: 'open', startedAt: '15/07/2026',
    notes: 'Molar com pulpite irreversível',
    sessions: [
      {
        id: 't3s1',
      description: 'Abertura e instrumentação', date: '15/07/2026', professionalId: 'f2',
        amount: 450,
        teeth: ['36'],
        odontogram: odonto({ 36: { caries: ['caries-occlusal'], cariesSeverity: { occlusal: 5 }, endo: 'endo-medical-filling' } }),
        actions: [
          'Dente 36: Anestesia e isolamento absoluto',
          'Dente 36: Abertura coronária',
          'Dente 36: Instrumentação dos canais mesiais',
          'Dente 36: Medicação intracanal e selamento provisório',
        ],
        materials: [
          { name: 'Anestésico articaína 4%',   quantity: '2 tubetes' },
          { name: 'Lima rotatória 25/.06',     quantity: '1 un' },
          { name: 'Hipoclorito de sódio 2,5%', quantity: '20 ml' },
        ],
      },
      {
        id: 't3s2',
      description: 'Instrumentação do canal distal', date: '19/07/2026', professionalId: 'f2',
        amount: 300,
        teeth: ['36'],
        odontogram: odonto({ 36: { endo: 'endo-medical-filling' } }),
        actions: [
          'Dente 36: Remoção do selamento provisório',
          'Dente 36: Instrumentação do canal distal',
          'Dente 36: Irrigação final e nova medicação intracanal',
        ],
        materials: [
          { name: 'Lima rotatória 30/.05',     quantity: '1 un' },
          { name: 'Hipoclorito de sódio 2,5%', quantity: '15 ml' },
        ],
        notes: 'Obturação prevista para o próximo procedimento.',
      },
    ],
  },
  {
    id: 't1',
    clinicId: 'c1', patientId: 'p1', tooth: '16', procedure: 'Restauração em resina composta',
    status: 'finished', startedAt: '10/07/2026', completedAt: '10/07/2026',
    notes: 'Cárie oclusal — resina A2',
    sessions: [
      {
        id: 't1s1',
      description: 'Restauração', date: '10/07/2026', professionalId: 'f2',
        amount: 350,
        teeth: ['16'],
        odontogram: odonto({ 16: { fillingMaterial: 'composite', fillingSurfaces: ['occlusal'], fillingSurfaceMaterials: { occlusal: 'composite' } } }),
        actions: [
          'Dente 16: Remoção do tecido cariado',
          'Dente 16: Restauração incremental em resina A2',
          'Dente 16: Ajuste oclusal e polimento',
        ],
        materials: [
          { name: 'Resina fotopolimerizável A2', quantity: '1 tubete' },
          { name: 'Ácido fosfórico 37%',         quantity: '2 ml' },
        ],
      },
    ],
  },
  {
    id: 't4',
    clinicId: 'c1', patientId: 'p1', tooth: '42', procedure: 'Extração', status: 'extracted',
    startedAt: '02/06/2026', completedAt: '02/06/2026', notes: 'Indicação ortodôntica',
    sessions: [
      {
        id: 't4s1',
      description: 'Exodontia', date: '02/06/2026', professionalId: 'f2',
        amount: 400,
        teeth: ['42'],
        odontogram: odonto({ 42: { toothSelection: 'no-tooth-after-extraction' } }),
        actions: ['Dente 42: Anestesia local', 'Dente 42: Exodontia e sutura simples'],
        materials: [
          { name: 'Anestésico lidocaína 2%', quantity: '2 tubetes' },
          { name: 'Fio de sutura 4-0',       quantity: '1 envelope' },
        ],
      },
    ],
  },
  {
    id: 't5',
    clinicId: 'c1', patientId: 'p2', tooth: '11', procedure: 'Clareamento em consultório',
    status: 'finished', startedAt: '08/07/2026', completedAt: '08/07/2026',
    sessions: [
      {
        id: 't5s1',
      description: 'Clareamento', date: '08/07/2026', professionalId: 'f2',
        amount: 900,
        actions: ['Dente 11: Barreira gengival', 'Dente 11: Gel clareador em 3 aplicações de 15 min'],
        materials: [{ name: 'Gel clareador 35%', quantity: '1 seringa' }],
      },
    ],
  },
]
