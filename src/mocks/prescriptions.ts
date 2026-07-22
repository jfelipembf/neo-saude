import type { Prescription } from '@/types/domain'

// Prescrições e documentos emitidos — mais recente primeiro.
export const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'pr1',
    clinicId: 'c1', code: 'REC-000001', patientId: 'p1', type: 'prescription', title: 'Receituário',
    date: '19/07/2026', professionalId: 'f2',
    medications: [
      { name: 'Amoxicilina 500 mg', dosage: '1 cápsula a cada 8h por 7 dias', quantity: '1 caixa' },
      { name: 'Ibuprofeno 600 mg',  dosage: '1 comprimido a cada 8h por 3 dias, se dor', quantity: '1 caixa' },
    ],
    notes: 'Pós-operatório de procedimento endodôntico.',
  },
  {
    id: 'pr2',
    clinicId: 'c1', code: 'REC-000002', patientId: 'p1', type: 'certificate', title: 'Atestado — 2 dias',
    date: '19/07/2026', professionalId: 'f2',
    text: 'Atesto, para os devidos fins, que Maria Oliveira esteve sob meus cuidados profissionais nesta data, necessitando de 2 dia(s) de afastamento de suas atividades a partir de hoje.',
  },
  {
    id: 'pr3',
    clinicId: 'c1', code: 'REC-000003', patientId: 'p1', type: 'clinical_record', title: 'Evolução clínica',
    date: '15/07/2026', professionalId: 'f2',
    text: 'Paciente compareceu para abertura e instrumentação do canal do dente 36. Anestesia e isolamento absoluto sem intercorrências. Medicação intracanal e selamento provisório. Retorno em 4 dias para instrumentação do canal distal.',
  },
  {
    id: 'pr4',
    clinicId: 'c1', code: 'REC-000004', patientId: 'p1', type: 'document', title: 'Orientações pós-restauração',
    date: '10/07/2026', professionalId: 'f2',
    text: 'Evitar alimentos duros nas primeiras 24 horas. A sensibilidade leve ao frio é esperada nos primeiros dias. Manter a escovação normal com escova macia. Em caso de dor ao morder, entrar em contato para ajuste oclusal.',
  },
]
