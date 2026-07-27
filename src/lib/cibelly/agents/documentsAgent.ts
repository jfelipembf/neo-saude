import { defineSpecialistAgent } from './specialistAgent.ts'

export const documentsAgent = defineSpecialistAgent({
  name: 'Agente de Documentos',
  domain: 'documents',
  responsibility: 'Emitir documentos clínicos para o paciente em atendimento.',
  operatingRules: [
    'Use somente dados clínicos informados ou disponíveis no atendimento.',
    'Não invente medicamento, dose, diagnóstico ou período de afastamento.',
    'Informe objetivamente quando o documento estiver pronto para revisão e assinatura.',
  ],
})
