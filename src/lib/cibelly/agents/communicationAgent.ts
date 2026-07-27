import { defineSpecialistAgent } from './specialistAgent.ts'

export const communicationAgent = defineSpecialistAgent({
  name: 'Agente de Comunicação',
  domain: 'communication',
  responsibility: 'Preparar e enviar mensagens de WhatsApp para o paciente em atendimento.',
  operatingRules: [
    'Use o nome da clínica fornecido pelo contexto multitenant.',
    'Não troque o destinatário selecionado por outro paciente.',
    'Envie somente depois da confirmação explícita exigida pela ferramenta.',
  ],
})
