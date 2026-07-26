/**
 * A FRASE PRONTA do histórico — o que faltava para ela não travar.
 *
 * `ler_odontograma` e `consultar_agenda` sempre devolvem um campo `resposta`
 * já escrito; `consultar_historico` devolvia só o JSON cru (a lista de
 * atendimentos, cada um com uma lista enorme de achados) e pedia para o modelo
 * SINTETIZAR sozinho, em tempo real, sob a regra solta "resuma em uma ou duas
 * frases". Na prática ela travou: perguntada duas vezes "quais foram os
 * procedimentos da consulta anterior?", ficou muda até o dentista digitar
 * "Responda." — com o resultado da ferramenta já na mão, `ok: true` e tudo.
 *
 * A causa provável não é o modelo "esquecer de falar": é a MASSA de dado bruto
 * que ele recebeu para condensar sob pressão de tempo real — pior ainda para
 * esta paciente, que tem múltiplos atendimentos NO MESMO DIA (mesmo problema
 * do odontogramRevisions.ts), então "os últimos 5" eram 5 cópias quase
 * idênticas do dia 26/07, com dezenas de achados cada.
 *
 * A correção segue o mesmo molde das outras ferramentas: o CÓDIGO monta a
 * frase, o modelo só lê. Zero síntese em tempo real.
 */

import { localDate, toShortDate } from '@/utils/date'

interface AtendimentoResumo {
  data: string
  descricao?: string
  tratamento?: string
  dentes: string[]
  achados: string[]
}

/** Dedup por dia, mantendo o PRIMEIRO — a RPC já ordena por
 *  (performed_on desc, created_at desc), então o primeiro de cada dia já é o
 *  mais recente daquele dia. Mesma lógica de marcosPorDia, aplicada aqui. */
function porDiaMaisRecente(atendimentos: AtendimentoResumo[]): AtendimentoResumo[] {
  const vistos = new Set<string>()
  const unicos: AtendimentoResumo[] = []
  for (const a of atendimentos) {
    if (!a.data || vistos.has(a.data)) continue
    vistos.add(a.data)
    unicos.push(a)
  }
  return unicos
}

/**
 * "Últimos atendimentos", em frases curtas, do mais recente para o mais
 * antigo — o que o prompt já pedia, só que agora pronto em vez de exigido.
 */
export function resumoUltimosAtendimentos(
  atendimentos: AtendimentoResumo[], limite = 3,
): string {
  const dias = porDiaMaisRecente(atendimentos).slice(0, limite)
  if (dias.length === 0) return 'Não encontrei atendimento anterior no histórico.'

  return dias.map(a => {
    const data = toShortDate(localDate(a.data))
    const oque = a.descricao || a.tratamento || 'atendimento'
    const dentes = a.dentes.length ? `, ${a.dentes.length} dente${a.dentes.length > 1 ? 's' : ''} tocado${a.dentes.length > 1 ? 's' : ''}` : ''
    return `dia ${data}: ${oque}${dentes}`
  }).join('; ')
}

/**
 * Resposta para "o que foi feito no dente N?" — extrai só a linha DAQUELE
 * dente do resumo (o motor já prefixa cada achado com "Dente N: ..."), em vez
 * de falar a lista inteira de dentes tocados na sessão.
 */
export function resumoPorDente(atendimentos: AtendimentoResumo[], dente: number): string {
  const dias = porDiaMaisRecente(atendimentos)
  if (dias.length === 0) return `Não encontrei atendimento com o dente ${dente} no histórico.`

  const prefixo = `Dente ${dente}:`
  const linhas = dias.map(a => {
    const linha = a.achados.find(x => x.startsWith(prefixo))
    if (!linha) return null
    const data = toShortDate(localDate(a.data))
    // Corta o "Dente N:" repetido — já ficou implícito na pergunta.
    return `dia ${data}: ${linha.slice(prefixo.length).trim()}`
  }).filter((x): x is string => x !== null)

  return linhas.length ? linhas.join('; ') : `Não achei o dente ${dente} marcado nesses atendimentos.`
}
