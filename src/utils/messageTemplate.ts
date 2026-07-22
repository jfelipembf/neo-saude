/**
 * Preenche um template de mensagem (o mesmo formato das automações de
 * WhatsApp em Configurações: `{paciente}`, `{valor}`, `{data}`…) com os
 * valores reais. Placeholder sem valor correspondente permanece como está —
 * melhor um `{profissional}` visível para revisar do que sumir com o texto.
 */
export function fillTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
}
