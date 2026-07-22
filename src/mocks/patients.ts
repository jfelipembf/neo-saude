import type { Patient } from '@/types/domain'

export const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', clinicId: 'c1', code: 'PAC-000001', name: 'Maria Oliveira',   cpf: '935.975.310-67', phone: '(79) 99911-2233', insurance: 'Unimed',      lastVisit: '15/07/2026', status: 'active' },
  { id: 'p2', clinicId: 'c1', code: 'PAC-000002', name: 'João Santos',      cpf: '481.220.654-30', phone: '(79) 99844-5566', insurance: 'Particular',  lastVisit: '10/07/2026', status: 'active' },
  { id: 'p3', clinicId: 'c1', code: 'PAC-000003', name: 'Ana Costa',        cpf: '702.114.983-55', phone: '(79) 99777-8899', insurance: 'Bradesco',    lastVisit: '02/07/2026', status: 'active' },
  { id: 'p4', clinicId: 'c1', code: 'PAC-000004', name: 'Carlos Pereira',   phone: '(79) 99622-3344', insurance: 'SulAmérica',  lastVisit: '28/06/2026', status: 'active' },
  { id: 'p5', clinicId: 'c1', code: 'PAC-000005', name: 'Fernanda Lima',    phone: '(79) 99555-6677', insurance: 'Particular',  lastVisit: '20/06/2026', status: 'active' },
  { id: 'p6', clinicId: 'c1', code: 'PAC-000006', name: 'Ricardo Almeida',  phone: '(79) 99433-2211', insurance: 'Unimed',      lastVisit: '12/05/2026', status: 'inactive' },
  { id: 'p7', clinicId: 'c1', code: 'PAC-000007', name: 'Juliana Rocha',    phone: '(79) 99311-9988', insurance: 'Amil',        lastVisit: '18/07/2026', status: 'active' },
  { id: 'p8', clinicId: 'c1', code: 'PAC-000008', name: 'Pedro Nascimento', phone: '(79) 99299-8877', insurance: 'Particular',  lastVisit: '05/03/2026', status: 'inactive' },
]
