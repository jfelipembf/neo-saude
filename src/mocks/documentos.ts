import type { DocumentoPaciente } from '@/types/domain'

export const MOCK_DOCUMENTOS: DocumentoPaciente[] = [
  {
    id: 'd1', pacienteId: 'p1', nome: 'Resultado de exames laboratoriais',
    descricao: 'Hemograma completo e glicemia de jejum solicitados na consulta de junho.',
    arquivo: 'exames-maria-jun2026.pdf', tipo: 'PDF', tamanho: '240 KB', enviadoEm: '02/06/2026',
  },
  {
    id: 'd2', pacienteId: 'p1', nome: 'Raio-X panorâmico',
    descricao: 'Radiografia para avaliação ortodôntica.',
    arquivo: 'raio-x-panoramico.jpg', tipo: 'JPG', tamanho: '1,8 MB', enviadoEm: '20/04/2026',
  },
  {
    id: 'd4', pacienteId: 'p1', nome: 'Atestado médico',
    descricao: 'Afastamento de 2 dias emitido na consulta de julho.',
    arquivo: 'atestado-jul2026.pdf', tipo: 'PDF', tamanho: '84 KB', enviadoEm: '15/07/2026',
  },
  {
    id: 'd5', pacienteId: 'p1', nome: 'Receituário',
    arquivo: 'receituario-jun2026.pdf', tipo: 'PDF', tamanho: '72 KB', enviadoEm: '02/06/2026',
  },
  {
    id: 'd6', pacienteId: 'p1', nome: 'Ficha de anamnese',
    descricao: 'Preenchida no primeiro atendimento.',
    arquivo: 'anamnese-maria.pdf', tipo: 'PDF', tamanho: '188 KB', enviadoEm: '20/04/2026',
  },
  {
    id: 'd7', pacienteId: 'p1', nome: 'Plano de tratamento fisioterapia',
    arquivo: 'plano-fisio.pdf', tipo: 'PDF', tamanho: '132 KB', enviadoEm: '12/05/2026',
  },
  {
    id: 'd3', pacienteId: 'p2', nome: 'Termo de consentimento',
    arquivo: 'termo-consentimento.pdf', tipo: 'PDF', tamanho: '96 KB', enviadoEm: '10/07/2026',
  },
]
