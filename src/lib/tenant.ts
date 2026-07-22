/**
 * Tenant e códigos humanos — ponto único.
 *
 * No Supabase (modo real):
 *  - A clínica atual NÃO vem de um claim do JWT. O modelo de segurança é por
 *    ASSOCIAÇÃO: `private.auth_clinic_ids()` lê a tabela `clinic_user` para o
 *    `auth.uid()` logado. O front descobre a clínica corrente chamando a RPC
 *    `my_session()` no login (ver SessionProvider), que devolve `clinic.id`.
 *    Esse UUID é guardado aqui via `setCurrentClinicId()` e lido pelos services
 *    com `getCurrentClinicId()`.
 *  - Nos INSERTs o cliente MANDA `clinic_id` (a policy `with_check` exige que
 *    ele pertença a `auth_clinic_ids()`); `id` e `code` NÃO são enviados —
 *    `id` tem default `gen_random_uuid()` e `code` é preenchido pelo trigger
 *    `tr_code` (BEFORE INSERT), sem corrida entre usuários.
 *
 * MODO MOCK (legado): `CURRENT_CLINIC` abaixo ainda é usado pelos services que
 * não foram migrados para o banco real. Cada service migrado troca
 * `CURRENT_CLINIC` por `getCurrentClinicId()`; quando o último sair, a const
 * pode ser removida.
 */

/** @deprecated Clínica fixa do modo mock — só para services ainda não migrados. */
export const CURRENT_CLINIC = 'c1'

/**
 * Clínica corrente resolvida da sessão real (UUID). É preenchida pelo
 * SessionProvider após o `my_session()`, e zerada no logout. Módulo-nível
 * (não é hook) porque os services não são componentes React.
 */
let currentClinicId: string | null = null

export function setCurrentClinicId(id: string | null): void {
  currentClinicId = id
}

/** UUID da clínica corrente. Lança se a sessão ainda não foi resolvida. */
export function getCurrentClinicId(): string {
  if (!currentClinicId) {
    throw new Error('Clínica atual não resolvida — sessão não inicializada (my_session).')
  }
  return currentClinicId
}

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
