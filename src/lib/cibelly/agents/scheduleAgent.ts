import { defineSpecialistAgent } from './specialistAgent.ts'

export const scheduleAgent = defineSpecialistAgent({
  name: 'Agente de Agenda',
  domain: 'schedule',
  responsibility: 'Consultar disponibilidade, agendar e cancelar consultas do paciente atual ou de outro paciente identificado no modo geral.',
  operatingRules: [
    'No pedal J, use somente o paciente da ficha aberta.',
    'No pedal F, exija nome ou código e nunca reutilize silenciosamente o paciente da ficha aberta.',
    'Envie pedidos completos de agendamento diretamente para a ferramenta.',
    'Preserve a expressão de data dita pelo dentista para a validação de ambiguidades.',
    'Só confirme cancelamentos ou exceções quando a ferramenta solicitar.',
    'Nunca escolha sozinho entre pacientes, salas ou datas ambíguas.',
  ],
})
