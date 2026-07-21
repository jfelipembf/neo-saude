import type { Prescription } from '@/types/domain'

// Prescrições e documentos emitidos — mais recente primeiro.
export const MOCK_PRESCRICOES: Prescription[] = [
  {
    id: 'pr1', pacienteId: 'p1', tipo: 'receituario', titulo: 'Receituário',
    data: '19/07/2026', profissional: 'Dra. Paula Menezes',
    medicamentos: [
      { nome: 'Amoxicilina 500 mg', posologia: '1 cápsula a cada 8h por 7 dias', quantidade: '1 caixa' },
      { nome: 'Ibuprofeno 600 mg',  posologia: '1 comprimido a cada 8h por 3 dias, se dor', quantidade: '1 caixa' },
    ],
    observacao: 'Pós-operatório de procedimento endodôntico.',
  },
  {
    id: 'pr2', pacienteId: 'p1', tipo: 'atestado', titulo: 'Atestado — 2 dias',
    data: '19/07/2026', profissional: 'Dra. Paula Menezes',
    texto: 'Atesto, para os devidos fins, que Maria Oliveira esteve sob meus cuidados profissionais nesta data, necessitando de 2 dia(s) de afastamento de suas atividades a partir de hoje.',
  },
  {
    id: 'pr3', pacienteId: 'p1', tipo: 'prontuario', titulo: 'Evolução clínica',
    data: '15/07/2026', profissional: 'Dra. Paula Menezes',
    texto: 'Paciente compareceu para abertura e instrumentação do canal do dente 36. Anestesia e isolamento absoluto sem intercorrências. Medicação intracanal e selamento provisório. Retorno em 4 dias para instrumentação do canal distal.',
  },
  {
    id: 'pr4', pacienteId: 'p1', tipo: 'documento', titulo: 'Orientações pós-restauração',
    data: '10/07/2026', profissional: 'Dra. Paula Menezes',
    texto: 'Evitar alimentos duros nas primeiras 24 horas. A sensibilidade leve ao frio é esperada nos primeiros dias. Manter a escovação normal com escova macia. Em caso de dor ao morder, entrar em contato para ajuste oclusal.',
  },
]
