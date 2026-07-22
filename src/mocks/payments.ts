import type { Payment } from '@/types/domain'

// `tratamentos` atribui cada item a um profissional — é daí que sai a aba
// "Ganhos" do perfil do especialista (só pagamentos PAGOS contam como ganho).
export const MOCK_PAYMENTS: Payment[] = [
  // ── Maria Oliveira (p1) ────────────────────────────────────────────────────
  {
    id: 'pg1',
    clinicId: 'c1', code: 'PAG-000001', patientId: 'p1', date: '15/07/2026', description: 'Consulta clínica', amount: 290, status: 'paid',
    entries: [
      { method: 'credit', amount: 290, cardBrand: 'Visa', authorizationCode: 'A73H21', nsu: '004512', installments: 3 },
    ],
    treatments: [{ name: 'Consulta clínica', professionalId: 'f1', amount: 290 }],
  },
  {
    id: 'pg2',
    clinicId: 'c1', code: 'PAG-000002', patientId: 'p1', date: '28/06/2026', description: 'Exames laboratoriais', amount: 480, status: 'paid',
    // Pagamento dividido: metade no PIX, metade no crédito à vista.
    entries: [
      { method: 'pix',     amount: 240 },
      { method: 'credit', amount: 240, cardBrand: 'Mastercard', authorizationCode: 'B91X07', nsu: '004488', installments: 1 },
    ],
    treatments: [{ name: 'Exames laboratoriais', professionalId: 'f1', amount: 480 }],
  },
  {
    id: 'pg3',
    clinicId: 'c1', code: 'PAG-000003', patientId: 'p1', date: '25/07/2026', description: 'Sessão de fisioterapia', amount: 150, status: 'pending',
    entries: [],
    treatments: [
      { name: 'Sessão de fisioterapia', professionalId: 'f3', amount: 150 },
    ],
  },
  {
    id: 'pg7',
    clinicId: 'c1', code: 'PAG-000004', patientId: 'p1', date: '02/06/2026', description: 'Retorno', amount: 120, status: 'paid',
    entries: [{ method: 'pix', amount: 120 }],
    treatments: [{ name: 'Retorno', professionalId: 'f1', amount: 120 }],
  },
  {
    id: 'pg8',
    clinicId: 'c1', code: 'PAG-000005', patientId: 'p1', date: '12/05/2026', description: 'Consulta clínica', amount: 290, status: 'paid',
    entries: [{ method: 'debit', amount: 290, cardBrand: 'Visa', authorizationCode: 'D18M42', nsu: '004102' }],
    treatments: [{ name: 'Consulta clínica', professionalId: 'f1', amount: 290 }],
  },
  {
    id: 'pg9',
    clinicId: 'c1', code: 'PAG-000006', patientId: 'p1', date: '20/04/2026', description: 'Sessão de fisioterapia', amount: 150, status: 'paid',
    entries: [{ method: 'cash', amount: 150 }],
    treatments: [{ name: 'Sessão de fisioterapia', professionalId: 'f3', amount: 150 }],
  },
  {
    id: 'pg10',
    clinicId: 'c1', code: 'PAG-000007', patientId: 'p1', date: '18/03/2026', description: 'Exames laboratoriais', amount: 350, status: 'paid',
    entries: [{ method: 'credit', amount: 350, cardBrand: 'Mastercard', authorizationCode: 'E67Q11', nsu: '003988', installments: 2 }],
    treatments: [{ name: 'Exames laboratoriais', professionalId: 'f1', amount: 350 }],
  },
  {
    id: 'pg11',
    clinicId: 'c1', code: 'PAG-000008', patientId: 'p1', date: '10/06/2026', description: 'Avaliação postural', amount: 180, status: 'overdue',
    entries: [],
    treatments: [
      { name: 'Avaliação postural',      professionalId: 'f3', amount: 90 },
      { name: 'Sessão de fisioterapia',  professionalId: 'f3', amount: 90 },
    ],
  },

  // ── João Santos (p2) ───────────────────────────────────────────────────────
  {
    id: 'pg4',
    clinicId: 'c1', code: 'PAG-000009', patientId: 'p2', date: '10/07/2026', description: 'Limpeza dental', amount: 220, status: 'paid',
    entries: [
      { method: 'debit', amount: 220, cardBrand: 'Elo', authorizationCode: 'C55K93', nsu: '004501' },
    ],
    treatments: [{ name: 'Limpeza dental', professionalId: 'f2', amount: 220 }],
  },
  {
    id: 'pg5',
    clinicId: 'c1', code: 'PAG-000010', patientId: 'p2', date: '12/06/2026', description: 'Retorno', amount: 120, status: 'paid',
    entries: [{ method: 'cash', amount: 120 }],
    treatments: [{ name: 'Retorno odontológico', professionalId: 'f2', amount: 120 }],
  },
  {
    id: 'pg15',
    clinicId: 'c1', code: 'PAG-000011', patientId: 'p2', date: '21/05/2026', description: 'Restauração em resina', amount: 350, status: 'paid',
    entries: [{ method: 'pix', amount: 350 }],
    treatments: [{ name: 'Restauração em resina', professionalId: 'f2', amount: 350 }],
  },
  {
    id: 'pg22',
    clinicId: 'c1', code: 'PAG-000012', patientId: 'p2', date: '15/04/2026', description: 'Clareamento em consultório', amount: 900, status: 'paid',
    entries: [{ method: 'credit', amount: 900, cardBrand: 'Visa', authorizationCode: 'F12P88', nsu: '004033', installments: 6 }],
    treatments: [{ name: 'Clareamento em consultório', professionalId: 'f2', amount: 900 }],
  },
  {
    id: 'pg23',
    clinicId: 'c1', code: 'PAG-000013', patientId: 'p2', date: '10/03/2026', description: 'Consulta odontológica', amount: 180, status: 'paid',
    entries: [{ method: 'pix', amount: 180 }],
    treatments: [{ name: 'Consulta odontológica', professionalId: 'f2', amount: 180 }],
  },

  // ── Ana Costa (p3) ─────────────────────────────────────────────────────────
  {
    id: 'pg6',
    clinicId: 'c1', code: 'PAG-000014', patientId: 'p3', date: '30/06/2026', description: 'Avaliação nutricional', amount: 180, status: 'overdue',
    entries: [],
    treatments: [{ name: 'Avaliação nutricional', professionalId: 'f5', amount: 180 }],
  },
  {
    id: 'pg12',
    clinicId: 'c1', code: 'PAG-000015', patientId: 'p3', date: '05/07/2026', description: 'Consulta clínica', amount: 290, status: 'paid',
    entries: [{ method: 'pix', amount: 290 }],
    treatments: [{ name: 'Consulta clínica', professionalId: 'f1', amount: 290 }],
  },
  {
    id: 'pg19',
    clinicId: 'c1', code: 'PAG-000016', patientId: 'p3', date: '14/05/2026', description: 'Consulta clínica', amount: 290, status: 'paid',
    entries: [{ method: 'cash', amount: 290 }],
    treatments: [{ name: 'Consulta clínica', professionalId: 'f1', amount: 290 }],
  },

  // ── Carlos Pereira (p4) ────────────────────────────────────────────────────
  {
    id: 'pg13',
    clinicId: 'c1', code: 'PAG-000017', patientId: 'p4', date: '08/07/2026', description: 'Sessões de fisioterapia', amount: 450, status: 'paid',
    entries: [{ method: 'credit', amount: 450, cardBrand: 'Elo', authorizationCode: 'G44T02', nsu: '004520', installments: 3 }],
    treatments: [{ name: 'Sessões de fisioterapia (3x)', professionalId: 'f3', amount: 450 }],
  },
  {
    id: 'pg16',
    clinicId: 'c1', code: 'PAG-000018', patientId: 'p4', date: '22/06/2026', description: 'Sessões de fisioterapia', amount: 300, status: 'paid',
    entries: [{ method: 'pix', amount: 300 }],
    treatments: [{ name: 'Sessões de fisioterapia (2x)', professionalId: 'f3', amount: 300 }],
  },
  {
    id: 'pg20',
    clinicId: 'c1', code: 'PAG-000019', patientId: 'p4', date: '18/04/2026', description: 'Avaliação + fisioterapia', amount: 240, status: 'paid',
    entries: [{ method: 'cash', amount: 240 }],
    treatments: [
      { name: 'Avaliação postural',     professionalId: 'f3', amount: 90 },
      { name: 'Sessão de fisioterapia', professionalId: 'f3', amount: 150 },
    ],
  },
  {
    id: 'pg24',
    clinicId: 'c1', code: 'PAG-000020', patientId: 'p4', date: '12/03/2026', description: 'Sessões de fisioterapia', amount: 300, status: 'paid',
    entries: [{ method: 'pix', amount: 300 }],
    treatments: [{ name: 'Sessões de fisioterapia (2x)', professionalId: 'f3', amount: 300 }],
  },

  // ── Fernanda Lima (p5) ─────────────────────────────────────────────────────
  {
    id: 'pg14',
    clinicId: 'c1', code: 'PAG-000021', patientId: 'p5', date: '17/07/2026', description: 'Pilates clínico — mensalidade', amount: 380, status: 'paid',
    entries: [{ method: 'pix', amount: 380 }],
    treatments: [{ name: 'Pilates clínico — mensalidade', professionalId: 'f3', amount: 380 }],
  },
  {
    id: 'pg18',
    clinicId: 'c1', code: 'PAG-000022', patientId: 'p5', date: '15/06/2026', description: 'Pilates clínico — mensalidade', amount: 380, status: 'paid',
    entries: [{ method: 'pix', amount: 380 }],
    treatments: [{ name: 'Pilates clínico — mensalidade', professionalId: 'f3', amount: 380 }],
  },
  {
    id: 'pg21',
    clinicId: 'c1', code: 'PAG-000023', patientId: 'p5', date: '12/05/2026', description: 'Pilates clínico — mensalidade', amount: 380, status: 'paid',
    entries: [{ method: 'cash', amount: 380 }],
    treatments: [{ name: 'Pilates clínico — mensalidade', professionalId: 'f3', amount: 380 }],
  },

  // ── Juliana Rocha (p7) ─────────────────────────────────────────────────────
  {
    id: 'pg17',
    clinicId: 'c1', code: 'PAG-000024', patientId: 'p7', date: '03/07/2026', description: 'Consulta clínica', amount: 290, status: 'paid',
    entries: [{ method: 'debit', amount: 290, cardBrand: 'Visa', authorizationCode: 'H09W55', nsu: '004515' }],
    treatments: [{ name: 'Consulta clínica', professionalId: 'f1', amount: 290 }],
  },
]
