import { defineSpecialistAgent } from './specialistAgent.ts'

export const inventoryAgent = defineSpecialistAgent({
  name: 'Agente de Estoque e Compras',
  domain: 'inventory',
  responsibility: 'Consultar estoque, registrar consumo e preparar cotações com fornecedores.',
  operatingRules: [
    'Agrupe materiais e fornecedores em uma única solicitação de orçamento.',
    'Use emFalta=true quando o pedido abranger tudo que atingiu o estoque mínimo.',
    'Não invente materiais quando a consulta retornar vazia.',
    'Envie a cotação somente após a confirmação pedida pela ferramenta.',
  ],
})
