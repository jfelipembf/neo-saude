/**
 * Texto de erro para mostrar a quem usa.
 *
 * Existe porque `e instanceof Error` NÃO cobre o que o Supabase devolve: tanto
 * `PostgrestError` (banco/RPC) quanto `FunctionsHttpError` (Edge Function) são
 * objetos simples com `message`, e não instâncias de Error. Um `catch` que só
 * testa `instanceof Error` cai no texto genérico e esconde justamente a
 * mensagem útil — foi o que fez "Não foi possível salvar o odontograma."
 * aparecer no lugar de "permission denied for column updated_by".
 *
 * `hint` entra junto quando existe: é onde o Postgres põe o "e agora?" (ex.:
 * "Recarregue antes de salvar"), que costuma ser mais acionável que a mensagem.
 */
export function errorMessage(e: unknown, fallback: string): string {
  if (typeof e === 'string' && e.trim()) return e

  if (e && typeof e === 'object') {
    const erro = e as { message?: unknown; hint?: unknown; details?: unknown }
    const message = typeof erro.message === 'string' ? erro.message.trim() : ''
    const hint = typeof erro.hint === 'string' ? erro.hint.trim() : ''
    // `details` só entra se não houver mensagem: sozinho ele costuma ser
    // técnico demais ("Key (patient_id)=(...) already exists").
    const details = typeof erro.details === 'string' ? erro.details.trim() : ''

    const texto = message || details
    if (texto) return hint && hint !== texto ? `${texto} ${hint}` : texto
  }

  return fallback
}
