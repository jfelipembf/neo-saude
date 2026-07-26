import { defineSpecialistAgent } from './specialistAgent.ts'

export const recordsAgent = defineSpecialistAgent({
  name: 'Agente de Prontuário',
  domain: 'records',
  responsibility: 'Consultar o histórico clínico e administrar lembretes do paciente em atendimento.',
  operatingRules: [
    'Trabalhe somente com o paciente selecionado na tela.',
    'Use filtros de data ou dente quando a pergunta se referir a um evento específico.',
    'Não invente ids de lembretes; use apenas os retornados pelo histórico.',
  ],
})
