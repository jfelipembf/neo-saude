import type { Professional } from '@/types/domain'

export const MOCK_PROFISSIONAIS: Professional[] = [
  {
    id: 'f1', nome: 'Dra. Camila Duarte', especialidade: 'Clínica Geral', registro: 'CRM/SE 12345', status: 'ativo',
    descricao: 'Consultas de rotina, check-ups e acompanhamento de condições crônicas.', nota: 4.9,
    email: 'camila.duarte@neosaude.com.br', telefone: '(79) 3211-4501', whatsapp: '(79) 99811-4501',
    sexo: 'feminino', nascimento: '14/03/1988',
    cep: '49010-390', estado: 'SE', cidade: 'Aracaju', bairro: 'São José', numero: '120',
    especializacoes: ['Medicina de Família', 'Geriatria', 'Doenças crônicas'],
    formacao: [
      { curso: 'Residência em Medicina de Família e Comunidade', instituicao: 'UFBA', ano: '2016' },
      { curso: 'Graduação em Medicina', instituicao: 'UFS', ano: '2013' },
    ],
    experiencias: [
      { cargo: 'Médica clínica', local: 'Neo Saúde — Aracaju/SE', periodo: '2019 – atual' },
      { cargo: 'Médica da ESF', local: 'Prefeitura de Aracaju', periodo: '2016 – 2019' },
    ],
    cursos: ['ACLS — Suporte Avançado de Vida (2023)', 'Manejo de diabetes na atenção primária (2022)'],
    idiomas: ['Português', 'Inglês'],
  },
  {
    id: 'f2', nome: 'Dra. Paula Menezes', especialidade: 'Odontologia', registro: 'CRO/SE 4567', status: 'ativo',
    descricao: 'Limpeza, restaurações e estética dental.', nota: 4.8,
    email: 'paula.menezes@neosaude.com.br', telefone: '(79) 3211-4502', whatsapp: '(79) 99822-4502',
    sexo: 'feminino', nascimento: '02/09/1991',
    cep: '49025-040', estado: 'SE', cidade: 'Aracaju', bairro: 'Grageru', numero: '455',
    especializacoes: ['Endodontia', 'Dentística restauradora', 'Estética dental'],
    formacao: [
      { curso: 'Especialização em Endodontia', instituicao: 'ABO-SE', ano: '2019' },
      { curso: 'Graduação em Odontologia', instituicao: 'UFS', ano: '2015' },
    ],
    experiencias: [
      { cargo: 'Cirurgiã-dentista', local: 'Neo Saúde — Aracaju/SE', periodo: '2020 – atual' },
      { cargo: 'Dentista clínica', local: 'Clínica Sorrir — Aracaju/SE', periodo: '2016 – 2020' },
    ],
    cursos: ['Instrumentação mecanizada em Endodontia (2023)', 'Facetas em resina composta (2021)'],
    idiomas: ['Português', 'Inglês', 'Espanhol'],
  },
  {
    id: 'f3', nome: 'Dr. Bruno Teixeira', especialidade: 'Fisioterapia', registro: 'CREFITO-16 78901', status: 'ativo',
    descricao: 'Reabilitação ortopédica, RPG e pilates clínico.', nota: 4.7,
    email: 'bruno.teixeira@neosaude.com.br', telefone: '(79) 3211-4503', whatsapp: '(79) 99833-4503',
    sexo: 'masculino', nascimento: '27/11/1990',
    cep: '49037-470', estado: 'SE', cidade: 'Aracaju', bairro: 'Jardins', numero: '88',
    especializacoes: ['Ortopedia e traumatologia', 'RPG', 'Pilates clínico'],
    formacao: [
      { curso: 'Especialização em Fisioterapia Traumato-Ortopédica', instituicao: 'UNIT', ano: '2018' },
      { curso: 'Graduação em Fisioterapia', instituicao: 'UNIT', ano: '2014' },
    ],
    experiencias: [
      { cargo: 'Fisioterapeuta', local: 'Neo Saúde — Aracaju/SE', periodo: '2021 – atual' },
    ],
    cursos: ['Formação completa em RPG (2019)', 'Pilates clínico — aparelhos e solo (2017)'],
    idiomas: ['Português'],
  },
  {
    id: 'f4', nome: 'Dr. André Villas', especialidade: 'Psicologia', registro: 'CRP-19 2345', status: 'ativo',
    descricao: 'Terapia individual para adultos e adolescentes.', nota: 5,
    email: 'andre.villas@neosaude.com.br', telefone: '(79) 3211-4504', whatsapp: '(79) 99844-4504',
  },
  {
    id: 'f5', nome: 'Dra. Renata Campos', especialidade: 'Nutrição', registro: 'CRN-5 6789', status: 'ativo',
    descricao: 'Emagrecimento, nutrição esportiva e reeducação alimentar.', nota: 4.6,
    email: 'renata.campos@neosaude.com.br', telefone: '(79) 3211-4505', whatsapp: '(79) 99855-4505',
  },
  {
    id: 'f6', nome: 'Dr. Felipe Araújo', especialidade: 'Dermatologia', registro: 'CRM/SE 23456', status: 'inativo',
    descricao: 'Consultas dermatológicas e pequenos procedimentos.', nota: 4.5,
    email: 'felipe.araujo@neosaude.com.br', telefone: '(79) 3211-4506', whatsapp: '(79) 99866-4506',
  },
]
