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
export const MOCK_TRATAMENTOS: Treatment[] = [
  {
    id: 't6', pacienteId: 'p1', dente: '16, 21, 25, 36, 48',
    procedimento: 'Reabilitação oral — plano restaurador',
    status: 'em_aberto', iniciadoEm: '05/07/2026',
    observacao: 'Plano pós-avaliação: restaurações, exodontia do 48 e endodontia do 21.',
    sessoes: [
      {
        id: 't6s1', descricao: 'Avaliação clínica e mapeamento', data: '05/07/2026', profissional: 'Dr. Ricardo Alves',
        valor: 180,
        dentes: ['16', '21', '25', '31', '36', '41', '48'],
        odontograma: odonto(t6Dia1),
        acoes: [
          'Dente 16: Cárie oclusal profunda (ICDAS 5)',
          'Dente 25: Cárie mésio-oclusal',
          'Dente 36: Restauração de amálgama com cárie recorrente',
          'Dente 48: Siso incluso — exodontia indicada',
          'Dente 21: Escurecimento por necrose pulpar — endodontia indicada',
          'Dentes 31 e 41: Cálculo lingual',
        ],
        materiais: [{ nome: 'Película radiográfica periapical', quantidade: '4 un' }],
        observacao: 'Plano de tratamento apresentado e aprovado pelo paciente.',
      },
      {
        id: 't6s2', descricao: 'Profilaxia e substituição das restaurações', data: '12/07/2026', profissional: 'Dr. Ricardo Alves',
        valor: 650,
        dentes: ['16', '31', '36', '41'],
        odontograma: odonto(t6Dia2),
        acoes: [
          'Dente 16: Remoção da cárie e restauração em resina composta',
          'Dente 36: Troca do amálgama por resina composta',
          'Dentes 31 e 41: Raspagem e polimento — cálculo removido',
        ],
        materiais: [
          { nome: 'Resina fotopolimerizável A2', quantidade: '1 tubete' },
          { nome: 'Ácido fosfórico 37%',         quantidade: '2 ml' },
          { nome: 'Pasta profilática',           quantidade: '1 dose' },
        ],
      },
      {
        id: 't6s3', descricao: 'Restauração do 25 e exodontia do 48', data: '19/07/2026', profissional: 'Dr. Ricardo Alves',
        valor: 780,
        dentes: ['25', '48'],
        odontograma: odonto(t6Dia3),
        acoes: [
          'Dente 25: Restauração mésio-oclusal em resina composta',
          'Dente 48: Exodontia do siso incluso e sutura',
        ],
        materiais: [
          { nome: 'Anestésico articaína 4%', quantidade: '2 tubetes' },
          { nome: 'Fio de sutura 4-0',       quantidade: '1 envelope' },
          { nome: 'Resina fotopolimerizável A2', quantidade: '1 tubete' },
        ],
        observacao: 'Falta a endodontia do 21 — agendar próximo procedimento.',
      },
    ],
  },
  {
    // O exemplo do conceito: UM tratamento com procedimentos em DIAS diferentes.
    id: 't3', pacienteId: 'p1', dente: '36', procedimento: 'Tratamento de canal',
    status: 'em_aberto', iniciadoEm: '15/07/2026',
    observacao: 'Molar com pulpite irreversível',
    sessoes: [
      {
        id: 't3s1', descricao: 'Abertura e instrumentação', data: '15/07/2026', profissional: 'Dra. Paula Menezes',
        valor: 450,
        dentes: ['36'],
        odontograma: odonto({ 36: { caries: ['caries-occlusal'], cariesSeverity: { occlusal: 5 }, endo: 'endo-medical-filling' } }),
        acoes: [
          'Dente 36: Anestesia e isolamento absoluto',
          'Dente 36: Abertura coronária',
          'Dente 36: Instrumentação dos canais mesiais',
          'Dente 36: Medicação intracanal e selamento provisório',
        ],
        materiais: [
          { nome: 'Anestésico articaína 4%',   quantidade: '2 tubetes' },
          { nome: 'Lima rotatória 25/.06',     quantidade: '1 un' },
          { nome: 'Hipoclorito de sódio 2,5%', quantidade: '20 ml' },
        ],
      },
      {
        id: 't3s2', descricao: 'Instrumentação do canal distal', data: '19/07/2026', profissional: 'Dra. Paula Menezes',
        valor: 300,
        dentes: ['36'],
        odontograma: odonto({ 36: { endo: 'endo-medical-filling' } }),
        acoes: [
          'Dente 36: Remoção do selamento provisório',
          'Dente 36: Instrumentação do canal distal',
          'Dente 36: Irrigação final e nova medicação intracanal',
        ],
        materiais: [
          { nome: 'Lima rotatória 30/.05',     quantidade: '1 un' },
          { nome: 'Hipoclorito de sódio 2,5%', quantidade: '15 ml' },
        ],
        observacao: 'Obturação prevista para o próximo procedimento.',
      },
    ],
  },
  {
    id: 't1', pacienteId: 'p1', dente: '16', procedimento: 'Restauração em resina composta',
    status: 'finalizado', iniciadoEm: '10/07/2026', concluidoEm: '10/07/2026',
    observacao: 'Cárie oclusal — resina A2',
    sessoes: [
      {
        id: 't1s1', descricao: 'Restauração', data: '10/07/2026', profissional: 'Dra. Paula Menezes',
        valor: 350,
        dentes: ['16'],
        odontograma: odonto({ 16: { fillingMaterial: 'composite', fillingSurfaces: ['occlusal'], fillingSurfaceMaterials: { occlusal: 'composite' } } }),
        acoes: [
          'Dente 16: Remoção do tecido cariado',
          'Dente 16: Restauração incremental em resina A2',
          'Dente 16: Ajuste oclusal e polimento',
        ],
        materiais: [
          { nome: 'Resina fotopolimerizável A2', quantidade: '1 tubete' },
          { nome: 'Ácido fosfórico 37%',         quantidade: '2 ml' },
        ],
      },
    ],
  },
  {
    id: 't4', pacienteId: 'p1', dente: '42', procedimento: 'Extração', status: 'extraido',
    iniciadoEm: '02/06/2026', concluidoEm: '02/06/2026', observacao: 'Indicação ortodôntica',
    sessoes: [
      {
        id: 't4s1', descricao: 'Exodontia', data: '02/06/2026', profissional: 'Dra. Paula Menezes',
        valor: 400,
        dentes: ['42'],
        odontograma: odonto({ 42: { toothSelection: 'no-tooth-after-extraction' } }),
        acoes: ['Dente 42: Anestesia local', 'Dente 42: Exodontia e sutura simples'],
        materiais: [
          { nome: 'Anestésico lidocaína 2%', quantidade: '2 tubetes' },
          { nome: 'Fio de sutura 4-0',       quantidade: '1 envelope' },
        ],
      },
    ],
  },
  {
    id: 't5', pacienteId: 'p2', dente: '11', procedimento: 'Clareamento em consultório',
    status: 'finalizado', iniciadoEm: '08/07/2026', concluidoEm: '08/07/2026',
    sessoes: [
      {
        id: 't5s1', descricao: 'Clareamento', data: '08/07/2026', profissional: 'Dra. Paula Menezes',
        valor: 900,
        acoes: ['Dente 11: Barreira gengival', 'Dente 11: Gel clareador em 3 aplicações de 15 min'],
        materiais: [{ nome: 'Gel clareador 35%', quantidade: '1 seringa' }],
      },
    ],
  },
]
