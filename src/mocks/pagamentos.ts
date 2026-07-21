import type { Payment } from '@/types/domain'

// `tratamentos` atribui cada item a um profissional — é daí que sai a aba
// "Ganhos" do perfil do especialista (só pagamentos PAGOS contam como ganho).
export const MOCK_PAGAMENTOS: Payment[] = [
  // ── Maria Oliveira (p1) ────────────────────────────────────────────────────
  {
    id: 'pg1', pacienteId: 'p1', data: '15/07/2026', descricao: 'Consulta clínica', valor: 290, status: 'pago',
    formas: [
      { tipo: 'credito', valor: 290, bandeira: 'Visa', autorizacao: 'A73H21', nsu: '004512', parcelas: 3 },
    ],
    tratamentos: [{ nome: 'Consulta clínica', profissional: 'Dra. Camila Duarte', valor: 290 }],
  },
  {
    id: 'pg2', pacienteId: 'p1', data: '28/06/2026', descricao: 'Exames laboratoriais', valor: 480, status: 'pago',
    // Pagamento dividido: metade no PIX, metade no crédito à vista.
    formas: [
      { tipo: 'pix',     valor: 240 },
      { tipo: 'credito', valor: 240, bandeira: 'Mastercard', autorizacao: 'B91X07', nsu: '004488', parcelas: 1 },
    ],
    tratamentos: [{ nome: 'Exames laboratoriais', profissional: 'Dra. Camila Duarte', valor: 480 }],
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
    tratamentos: [{ nome: 'Retorno', profissional: 'Dra. Camila Duarte', valor: 120 }],
  },
  {
    id: 'pg8', pacienteId: 'p1', data: '12/05/2026', descricao: 'Consulta clínica', valor: 290, status: 'pago',
    formas: [{ tipo: 'debito', valor: 290, bandeira: 'Visa', autorizacao: 'D18M42', nsu: '004102' }],
    tratamentos: [{ nome: 'Consulta clínica', profissional: 'Dra. Camila Duarte', valor: 290 }],
  },
  {
    id: 'pg9', pacienteId: 'p1', data: '20/04/2026', descricao: 'Sessão de fisioterapia', valor: 150, status: 'pago',
    formas: [{ tipo: 'dinheiro', valor: 150 }],
    tratamentos: [{ nome: 'Sessão de fisioterapia', profissional: 'Dr. Bruno Teixeira', valor: 150 }],
  },
  {
    id: 'pg10', pacienteId: 'p1', data: '18/03/2026', descricao: 'Exames laboratoriais', valor: 350, status: 'pago',
    formas: [{ tipo: 'credito', valor: 350, bandeira: 'Mastercard', autorizacao: 'E67Q11', nsu: '003988', parcelas: 2 }],
    tratamentos: [{ nome: 'Exames laboratoriais', profissional: 'Dra. Camila Duarte', valor: 350 }],
  },
  {
    id: 'pg11', pacienteId: 'p1', data: '10/06/2026', descricao: 'Avaliação postural', valor: 180, status: 'vencido',
    formas: [],
    tratamentos: [
      { nome: 'Avaliação postural',      profissional: 'Dr. Bruno Teixeira', valor: 90 },
      { nome: 'Sessão de fisioterapia',  profissional: 'Dr. Bruno Teixeira', valor: 90 },
    ],
  },

  // ── João Santos (p2) ───────────────────────────────────────────────────────
  {
    id: 'pg4', pacienteId: 'p2', data: '10/07/2026', descricao: 'Limpeza dental', valor: 220, status: 'pago',
    formas: [
      { tipo: 'debito', valor: 220, bandeira: 'Elo', autorizacao: 'C55K93', nsu: '004501' },
    ],
    tratamentos: [{ nome: 'Limpeza dental', profissional: 'Dra. Paula Menezes', valor: 220 }],
  },
  {
    id: 'pg5', pacienteId: 'p2', data: '12/06/2026', descricao: 'Retorno', valor: 120, status: 'pago',
    formas: [{ tipo: 'dinheiro', valor: 120 }],
    tratamentos: [{ nome: 'Retorno odontológico', profissional: 'Dra. Paula Menezes', valor: 120 }],
  },
  {
    id: 'pg15', pacienteId: 'p2', data: '21/05/2026', descricao: 'Restauração em resina', valor: 350, status: 'pago',
    formas: [{ tipo: 'pix', valor: 350 }],
    tratamentos: [{ nome: 'Restauração em resina', profissional: 'Dra. Paula Menezes', valor: 350 }],
  },
  {
    id: 'pg22', pacienteId: 'p2', data: '15/04/2026', descricao: 'Clareamento em consultório', valor: 900, status: 'pago',
    formas: [{ tipo: 'credito', valor: 900, bandeira: 'Visa', autorizacao: 'F12P88', nsu: '004033', parcelas: 6 }],
    tratamentos: [{ nome: 'Clareamento em consultório', profissional: 'Dra. Paula Menezes', valor: 900 }],
  },
  {
    id: 'pg23', pacienteId: 'p2', data: '10/03/2026', descricao: 'Consulta odontológica', valor: 180, status: 'pago',
    formas: [{ tipo: 'pix', valor: 180 }],
    tratamentos: [{ nome: 'Consulta odontológica', profissional: 'Dra. Paula Menezes', valor: 180 }],
  },

  // ── Ana Costa (p3) ─────────────────────────────────────────────────────────
  {
    id: 'pg6', pacienteId: 'p3', data: '30/06/2026', descricao: 'Avaliação nutricional', valor: 180, status: 'vencido',
    formas: [],
    tratamentos: [{ nome: 'Avaliação nutricional', profissional: 'Dra. Renata Campos', valor: 180 }],
  },
  {
    id: 'pg12', pacienteId: 'p3', data: '05/07/2026', descricao: 'Consulta clínica', valor: 290, status: 'pago',
    formas: [{ tipo: 'pix', valor: 290 }],
    tratamentos: [{ nome: 'Consulta clínica', profissional: 'Dra. Camila Duarte', valor: 290 }],
  },
  {
    id: 'pg19', pacienteId: 'p3', data: '14/05/2026', descricao: 'Consulta clínica', valor: 290, status: 'pago',
    formas: [{ tipo: 'dinheiro', valor: 290 }],
    tratamentos: [{ nome: 'Consulta clínica', profissional: 'Dra. Camila Duarte', valor: 290 }],
  },

  // ── Carlos Pereira (p4) ────────────────────────────────────────────────────
  {
    id: 'pg13', pacienteId: 'p4', data: '08/07/2026', descricao: 'Sessões de fisioterapia', valor: 450, status: 'pago',
    formas: [{ tipo: 'credito', valor: 450, bandeira: 'Elo', autorizacao: 'G44T02', nsu: '004520', parcelas: 3 }],
    tratamentos: [{ nome: 'Sessões de fisioterapia (3x)', profissional: 'Dr. Bruno Teixeira', valor: 450 }],
  },
  {
    id: 'pg16', pacienteId: 'p4', data: '22/06/2026', descricao: 'Sessões de fisioterapia', valor: 300, status: 'pago',
    formas: [{ tipo: 'pix', valor: 300 }],
    tratamentos: [{ nome: 'Sessões de fisioterapia (2x)', profissional: 'Dr. Bruno Teixeira', valor: 300 }],
  },
  {
    id: 'pg20', pacienteId: 'p4', data: '18/04/2026', descricao: 'Avaliação + fisioterapia', valor: 240, status: 'pago',
    formas: [{ tipo: 'dinheiro', valor: 240 }],
    tratamentos: [
      { nome: 'Avaliação postural',     profissional: 'Dr. Bruno Teixeira', valor: 90 },
      { nome: 'Sessão de fisioterapia', profissional: 'Dr. Bruno Teixeira', valor: 150 },
    ],
  },
  {
    id: 'pg24', pacienteId: 'p4', data: '12/03/2026', descricao: 'Sessões de fisioterapia', valor: 300, status: 'pago',
    formas: [{ tipo: 'pix', valor: 300 }],
    tratamentos: [{ nome: 'Sessões de fisioterapia (2x)', profissional: 'Dr. Bruno Teixeira', valor: 300 }],
  },

  // ── Fernanda Lima (p5) ─────────────────────────────────────────────────────
  {
    id: 'pg14', pacienteId: 'p5', data: '17/07/2026', descricao: 'Pilates clínico — mensalidade', valor: 380, status: 'pago',
    formas: [{ tipo: 'pix', valor: 380 }],
    tratamentos: [{ nome: 'Pilates clínico — mensalidade', profissional: 'Dr. Bruno Teixeira', valor: 380 }],
  },
  {
    id: 'pg18', pacienteId: 'p5', data: '15/06/2026', descricao: 'Pilates clínico — mensalidade', valor: 380, status: 'pago',
    formas: [{ tipo: 'pix', valor: 380 }],
    tratamentos: [{ nome: 'Pilates clínico — mensalidade', profissional: 'Dr. Bruno Teixeira', valor: 380 }],
  },
  {
    id: 'pg21', pacienteId: 'p5', data: '12/05/2026', descricao: 'Pilates clínico — mensalidade', valor: 380, status: 'pago',
    formas: [{ tipo: 'dinheiro', valor: 380 }],
    tratamentos: [{ nome: 'Pilates clínico — mensalidade', profissional: 'Dr. Bruno Teixeira', valor: 380 }],
  },

  // ── Juliana Rocha (p7) ─────────────────────────────────────────────────────
  {
    id: 'pg17', pacienteId: 'p7', data: '03/07/2026', descricao: 'Consulta clínica', valor: 290, status: 'pago',
    formas: [{ tipo: 'debito', valor: 290, bandeira: 'Visa', autorizacao: 'H09W55', nsu: '004515' }],
    tratamentos: [{ nome: 'Consulta clínica', profissional: 'Dra. Camila Duarte', valor: 290 }],
  },
]
