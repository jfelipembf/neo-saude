import type { PatientDocument } from '@/types/domain'

export const MOCK_DOCUMENTS: PatientDocument[] = [
  {
    id: 'd1',
    clinicId: 'c1', patientId: 'p1', name: 'Resultado de exames laboratoriais',
    description: 'Hemograma completo e glicemia de jejum solicitados na consulta de junho.',
    fileName: 'exames-maria-jun2026.pdf', type: 'PDF', size: '240 KB', uploadedAt: '02/06/2026',
  },
  {
    id: 'd2',
    clinicId: 'c1', patientId: 'p1', name: 'Raio-X panorâmico',
    description: 'Radiografia para avaliação ortodôntica.',
    fileName: 'raio-x-panoramico.jpg', type: 'JPG', size: '1,8 MB', uploadedAt: '20/04/2026',
  },
  {
    id: 'd4',
    clinicId: 'c1', patientId: 'p1', name: 'Atestado médico',
    description: 'Afastamento de 2 dias emitido na consulta de julho.',
    fileName: 'atestado-jul2026.pdf', type: 'PDF', size: '84 KB', uploadedAt: '15/07/2026',
  },
  {
    id: 'd5',
    clinicId: 'c1', patientId: 'p1', name: 'Receituário',
    fileName: 'receituario-jun2026.pdf', type: 'PDF', size: '72 KB', uploadedAt: '02/06/2026',
  },
  {
    id: 'd6',
    clinicId: 'c1', patientId: 'p1', name: 'Ficha de anamnese',
    description: 'Preenchida no primeiro atendimento.',
    fileName: 'anamnese-maria.pdf', type: 'PDF', size: '188 KB', uploadedAt: '20/04/2026',
  },
  {
    id: 'd7',
    clinicId: 'c1', patientId: 'p1', name: 'Plano de tratamento fisioterapia',
    fileName: 'plano-fisio.pdf', type: 'PDF', size: '132 KB', uploadedAt: '12/05/2026',
  },
  {
    id: 'd3',
    clinicId: 'c1', patientId: 'p2', name: 'Termo de consentimento',
    fileName: 'termo-consentimento.pdf', type: 'PDF', size: '96 KB', uploadedAt: '10/07/2026',
  },
]
