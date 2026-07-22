/**
 * Tenant e códigos humanos — ponto único.
 *
 * MODO MOCK: a clínica é fixa e o código é calculado em memória.
 *
 * No Supabase:
 *  - `clinicId` vem do JWT (`auth.jwt() ->> 'clinica_id'`), NUNCA do cliente —
 *    aceitar do front permitiria a uma clínica gravar na outra.
 *  - `code` vem de uma sequence por clínica, gerada no INSERT (trigger ou
 *    default), para não haver corrida entre dois usuários criando ao mesmo tempo.
 */

/** Clínica da sessão atual (mock: instalação de clínica única). */
export const CURRENT_CLINIC = 'c1'

/**
 * O que um formulário pode enviar: os dados da entidade MENOS os três campos
 * que só o servidor preenche.
 *
 *   `id`         a chave técnica nasce no banco
 *   `clinicId`   o tenant vem do JWT (ver acima) — aceitar do cliente
 *                permitiria a uma clínica gravar na outra
 *   `code`       a referência humana vem da sequence, sem corrida
 *
 * Use em todo tipo `New*`/`Edit*` de service, em vez de `Omit<X, 'id'>`:
 * assim o compilador impede o formulário de mandar o tenant.
 */
export type ClientPayload<T> = Omit<T, 'id' | 'clinicId' | 'code'>

/**
 * Próximo código humano da entidade: PAC-000001, PAC-000002…
 * Calcula a partir do que já existe — serve para o mock; no banco é a sequence.
 */
export function nextCode(prefix: string, existing: { code?: string }[]) {
  const max = existing.reduce((max, item) => {
    const n = Number(item.code?.split('-')[1] ?? 0)
    return Number.isFinite(n) && n > max ? n : max
  }, 0)
  return `${prefix}-${String(max + 1).padStart(6, '0')}`
}
