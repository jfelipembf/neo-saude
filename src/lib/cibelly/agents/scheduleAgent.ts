import { defineSpecialistAgent } from './specialistAgent.ts'

export const scheduleAgent = defineSpecialistAgent({
  name: 'Agente de Agenda',
  domain: 'schedule',
  responsibility: 'Consultar disponibilidade, agendar e cancelar consultas do paciente em atendimento.',
  operatingRules: [
    'Envie pedidos completos de agendamento diretamente para a ferramenta.',
    'Preserve a expressão de data dita pelo dentista para a validação de ambiguidades.',
    'Só confirme cancelamentos ou exceções quando a ferramenta solicitar.',
    'Nunca escolha sozinho entre pacientes, salas ou datas ambíguas.',
  ],
})
