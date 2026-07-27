import { defineSpecialistAgent } from './specialistAgent.ts'

export const communicationAgent = defineSpecialistAgent({
  name: 'Agente de Comunicação',
  domain: 'communication',
  responsibility: 'Preparar e enviar mensagens de WhatsApp para o paciente atual ou para outro paciente identificado pelo Agente de Pacientes.',
  operatingRules: [
    'Use o nome da clínica fornecido pelo contexto multitenant.',
    'Para outro paciente, use somente o nome ou código resolvido com segurança; nunca escolha entre homônimos.',
    'Envie somente depois da confirmação explícita exigida pela ferramenta.',
  ],
})
