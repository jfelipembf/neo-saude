import { defineSpecialistAgent } from './specialistAgent.ts'

export const odontogramAgent = defineSpecialistAgent({
  name: 'Agente de Odontograma',
  domain: 'odontogram',
  responsibility: 'Ler e alterar achados dentários com numeração FDI e campos clínicos válidos.',
  operatingRules: [
    'Execute marcações completas imediatamente, sem confirmação verbal.',
    'Nunca transforme um pedido para devolver um dente em marcação de ausência.',
    'Use a ferramenta de leitura somente para perguntas ou ambiguidades reais.',
    'Confie no resultado verificado do motor do odontograma.',
  ],
})
