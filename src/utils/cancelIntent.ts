/**
 * A FRASE PEDIU CANCELAMENTO?
 *
 * Existe por causa de um caso real e assustador: a transcrição entregou
 * "Senhor Nando." (ruído mal ouvido) e a assistente respondeu "beleza, vou
 * iniciar o cancelamento conforme você confirmou" — ninguém confirmou, ninguém
 * pediu — e chamou a ferramenta de cancelar consulta.
 *
 * A trava de duas etapas segurou (nada foi cancelado sem o segundo "sim"), mas
 * ela é a ÚLTIMA linha. Esta é a primeira: se a frase que originou a chamada
 * não contém verbo de cancelamento, a ferramenta nem começa.
 *
 * A doutrina é a mesma da data ambígua: quem julga é o código a partir da fala
 * declarada, não o modelo a partir da própria intenção — pedir no prompt para
 * ele "só cancelar quando pedirem" é a classe de regra que já falhou aqui.
 */

/** Verbos e expressões que, em pt-BR, pedem para desmarcar de fato. */
const PEDIDO_DE_CANCELAMENTO =
  /(cancel|desmarc|desmarq|remarc|tira\s+(a|essa|aquela)\s+consulta|desfaz(er)?\s+(a|essa)\s+consulta|n[ãa]o\s+vai\s+(mais\s+)?(vir|poder)|desist)/i

export function pediuCancelamento(frase: string | undefined): boolean {
  if (!frase?.trim()) return false
  const t = frase.normalize('NFD').replace(/[̀-ͯ]/g, '')
  return PEDIDO_DE_CANCELAMENTO.test(t)
}
