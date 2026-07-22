import type { Professional } from '@/types/domain'

export const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: 'f1',
    clinicId: 'c1', code: 'PRO-000001', name: 'Dra. Camila Duarte', specialty: 'Clínica Geral', license: 'CRM/SE 12345', status: 'active',
    description: 'Consultas de rotina, check-ups e acompanhamento de condições crônicas.', rating: 4.9,
    email: 'camila.duarte@neosaude.com.br', phone: '(79) 3211-4501', whatsapp: '(79) 99811-4501',
    sex: 'female', birthDate: '14/03/1988',
    cep: '49010-390', state: 'SE', city: 'Aracaju', neighborhood: 'São José', number: '120',
    specializations: ['Medicina de Família', 'Geriatria', 'Doenças crônicas'],
    education: [
      { course: 'Residência em Medicina de Família e Comunidade', institution: 'UFBA', year: '2016' },
      { course: 'Graduação em Medicina', institution: 'UFS', year: '2013' },
    ],
    experiences: [
      { position: 'Médica clínica', workplace: 'Neo Saúde — Aracaju/SE', period: '2019 – atual' },
      { position: 'Médica da ESF', workplace: 'Prefeitura de Aracaju', period: '2016 – 2019' },
    ],
    courses: ['ACLS — Suporte Avançado de Vida (2023)', 'Manejo de diabetes na atenção primária (2022)'],
    languages: ['Português', 'Inglês'],
  },
  {
    id: 'f2',
    clinicId: 'c1', code: 'PRO-000002', name: 'Dra. Paula Menezes', specialty: 'Odontologia', license: 'CRO/SE 4567', status: 'active',
    description: 'Limpeza, restaurações e estética dental.', rating: 4.8,
    email: 'paula.menezes@neosaude.com.br', phone: '(79) 3211-4502', whatsapp: '(79) 99822-4502',
    sex: 'female', birthDate: '02/09/1991',
    cep: '49025-040', state: 'SE', city: 'Aracaju', neighborhood: 'Grageru', number: '455',
    specializations: ['Endodontia', 'Dentística restauradora', 'Estética dental'],
    education: [
      { course: 'Especialização em Endodontia', institution: 'ABO-SE', year: '2019' },
      { course: 'Graduação em Odontologia', institution: 'UFS', year: '2015' },
    ],
    experiences: [
      { position: 'Cirurgiã-dentista', workplace: 'Neo Saúde — Aracaju/SE', period: '2020 – atual' },
      { position: 'Dentista clínica', workplace: 'Clínica Sorrir — Aracaju/SE', period: '2016 – 2020' },
    ],
    courses: ['Instrumentação mecanizada em Endodontia (2023)', 'Facetas em resina composta (2021)'],
    languages: ['Português', 'Inglês', 'Espanhol'],
  },
  {
    id: 'f3',
    clinicId: 'c1', code: 'PRO-000003', name: 'Dr. Bruno Teixeira', specialty: 'Fisioterapia', license: 'CREFITO-16 78901', status: 'active',
    description: 'Reabilitação ortopédica, RPG e pilates clínico.', rating: 4.7,
    email: 'bruno.teixeira@neosaude.com.br', phone: '(79) 3211-4503', whatsapp: '(79) 99833-4503',
    sex: 'male', birthDate: '27/11/1990',
    cep: '49037-470', state: 'SE', city: 'Aracaju', neighborhood: 'Jardins', number: '88',
    specializations: ['Ortopedia e traumatologia', 'RPG', 'Pilates clínico'],
    education: [
      { course: 'Especialização em Fisioterapia Traumato-Ortopédica', institution: 'UNIT', year: '2018' },
      { course: 'Graduação em Fisioterapia', institution: 'UNIT', year: '2014' },
    ],
    experiences: [
      { position: 'Fisioterapeuta', workplace: 'Neo Saúde — Aracaju/SE', period: '2021 – atual' },
    ],
    courses: ['Formação completa em RPG (2019)', 'Pilates clínico — aparelhos e solo (2017)'],
    languages: ['Português'],
  },
  {
    id: 'f4',
    clinicId: 'c1', code: 'PRO-000004', name: 'Dr. André Villas', specialty: 'Psicologia', license: 'CRP-19 2345', status: 'active',
    description: 'Terapia individual para adultos e adolescentes.', rating: 5,
    email: 'andre.villas@neosaude.com.br', phone: '(79) 3211-4504', whatsapp: '(79) 99844-4504',
  },
  {
    id: 'f5',
    clinicId: 'c1', code: 'PRO-000005', name: 'Dra. Renata Campos', specialty: 'Nutrição', license: 'CRN-5 6789', status: 'active',
    description: 'Emagrecimento, nutrição esportiva e reeducação alimentar.', rating: 4.6,
    email: 'renata.campos@neosaude.com.br', phone: '(79) 3211-4505', whatsapp: '(79) 99855-4505',
  },
  {
    id: 'f6',
    clinicId: 'c1', code: 'PRO-000006', name: 'Dr. Felipe Araújo', specialty: 'Dermatologia', license: 'CRM/SE 23456', status: 'inactive',
    description: 'Consultas dermatológicas e pequenos procedimentos.', rating: 4.5,
    email: 'felipe.araujo@neosaude.com.br', phone: '(79) 3211-4506', whatsapp: '(79) 99866-4506',
  },
]
