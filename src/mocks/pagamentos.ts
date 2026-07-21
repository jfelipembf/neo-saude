import type { Pagamento } from '@/types/domain'

export const MOCK_PAGAMENTOS: Pagamento[] = [
  {
    id: 'pg1', pacienteId: 'p1', data: '15/07/2026', descricao: 'Consulta clínica', valor: 290, status: 'pago',
    formas: [
      { tipo: 'credito', valor: 290, bandeira: 'Visa', autorizacao: 'A73H21', nsu: '004512', parcelas: 3 },
    ],
  },
  {
    id: 'pg2', pacienteId: 'p1', data: '28/06/2026', descricao: 'Exames laboratoriais', valor: 480, status: 'pago',
    // Pagamento dividido: metade no PIX, metade no crédito à vista.
    formas: [
      { tipo: 'pix',     valor: 240 },
      { tipo: 'credito', valor: 240, bandeira: 'Mastercard', autorizacao: 'B91X07', nsu: '004488', parcelas: 1 },
    ],
  },
  {
    id: 'pg3', pacienteId: 'p1', data: '25/07/2026', descricao: 'Sessão de fisioterapia', valor: 150, status: 'pendente',
    formas: [],
    tratamentos: [
      { nome: 'Sessão de fisioterapia', profissional: 'Dr. Bruno Teixeira', valor: 150 },
    ],
  },
  {
    id: 'pg7', pacienteId: 'p1', data: '02/06/2026', descricao: 'Retorno', valor: 120, status: 'pago',
    formas: [{ tipo: 'pix', valor: 120 }],
  },
  {
    id: 'pg8', pacienteId: 'p1', data: '12/05/2026', descricao: 'Consulta clínica', valor: 290, status: 'pago',
    formas: [{ tipo: 'debito', valor: 290, bandeira: 'Visa', autorizacao: 'D18M42', nsu: '004102' }],
  },
  {
    id: 'pg9', pacienteId: 'p1', data: '20/04/2026', descricao: 'Sessão de fisioterapia', valor: 150, status: 'pago',
    formas: [{ tipo: 'dinheiro', valor: 150 }],
  },
  {
    id: 'pg10', pacienteId: 'p1', data: '18/03/2026', descricao: 'Exames laboratoriais', valor: 350, status: 'pago',
    formas: [{ tipo: 'credito', valor: 350, bandeira: 'Mastercard', autorizacao: 'E67Q11', nsu: '003988', parcelas: 2 }],
  },
  {
    id: 'pg11', pacienteId: 'p1', data: '10/06/2026', descricao: 'Avaliação postural', valor: 180, status: 'vencido',
    formas: [],
    tratamentos: [
      { nome: 'Avaliação postural',      profissional: 'Dr. Bruno Teixeira', valor: 90 },
      { nome: 'Sessão de fisioterapia',  profissional: 'Dr. Bruno Teixeira', valor: 90 },
    ],
  },
  {
    id: 'pg4', pacienteId: 'p2', data: '10/07/2026', descricao: 'Limpeza dental', valor: 220, status: 'pago',
    formas: [
      { tipo: 'debito', valor: 220, bandeira: 'Elo', autorizacao: 'C55K93', nsu: '004501' },
    ],
  },
  {
    id: 'pg5', pacienteId: 'p2', data: '12/06/2026', descricao: 'Retorno', valor: 120, status: 'pago',
    formas: [
      { tipo: 'dinheiro', valor: 120 },
    ],
  },
  {
    id: 'pg6', pacienteId: 'p3', data: '30/06/2026', descricao: 'Avaliação nutricional', valor: 180, status: 'vencido',
    formas: [],
  },
]
