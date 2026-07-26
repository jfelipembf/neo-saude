function normalizeWorkflowText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[.,!?;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function requestsLowStockQuote(text: string): boolean {
  const normalized = normalizeWorkflowText(text)
  const mentionsInventory = /\b(material|materiais|insumo|insumos|estoque)\b/
    .test(normalized)
  const mentionsLowStock =
    /\b(acab|falt|baixo|baixa|minim|repos|encerr)\w*/.test(normalized)
  const requestsQuote =
    /\b(orcament|cotac|cotar|preco|valor)\w*/.test(normalized)
    || (
      /\b(solicit|pec|ped)\w*/.test(normalized)
      && /\b(forneced|represent)\w*/.test(normalized)
    )

  return mentionsInventory && mentionsLowStock && requestsQuote
}
