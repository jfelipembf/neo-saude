import { supabase } from '@/lib/supabase'

/**
 * REGISTRO DE ERRO DO APP — grava em `app_error`, que o projeto da Plataforma
 * (separado, mesmo banco Supabase) lê para o painel de monitoramento.
 *
 * Grava pela RPC `log_app_error`, que é o ÚNICO caminho de escrita em
 * `app_error`: a tabela não tem grant de INSERT para `authenticated`. Um log que
 * quem errou pode escrever à vontade (ou apagar) não é log.
 *
 * A MÁSCARA DE ID É FEITA NO BANCO, não aqui. É de propósito: este arquivo roda
 * no navegador, onde qualquer um pode chamar a RPC com o que quiser — a garantia
 * de que um id de paciente não entra no log tem de morar do lado que não se
 * consegue burlar. O que existe aqui é conveniência; o que existe lá é a regra.
 *
 * Tudo é best-effort e NUNCA lança: falhar ao registrar um erro não pode virar
 * um segundo erro em cima do primeiro.
 */

export type ErrorSource = 'boundary' | 'query' | 'manual'

export interface ErrorContext {
  source?: ErrorSource
  level?: 'error' | 'warning'
  /** Sobrescreve a rota; por padrão usa a do navegador. */
  route?: string
}

/**
 * Extrai uma mensagem legível de QUALQUER coisa que tenha sido lançada.
 *
 * JavaScript deixa lançar qualquer valor, e os erros do Supabase chegam como
 * objeto simples (`{ message, details, hint }`) e não como `Error` — sem este
 * tratamento eles virariam a string "[object Object]", que agrupada no "top
 * erros" empilharia falhas sem nenhuma relação numa linha só.
 */
export function mensagemDoErro(error: unknown): string {
  if (error instanceof Error) return error.message || error.name
  if (typeof error === 'string') return error
  if (error != null && typeof error === 'object') {
    const e = error as Record<string, unknown>
    for (const chave of ['message', 'details', 'hint', 'error_description', 'error']) {
      const v = e[chave]
      if (typeof v === 'string' && v.trim()) return v
    }
    try {
      return JSON.stringify(error)
    } catch {
      // Referência circular — JSON.stringify lança, e aqui isso viraria um erro
      // dentro do registrador de erro.
      return 'Erro não serializável'
    }
  }
  if (error === undefined) return 'Erro desconhecido'
  return String(error)
}

/** Versão do app gravada junto do erro — permite ver regressão por release. */
const RELEASE = import.meta.env.VITE_APP_RELEASE || import.meta.env.MODE

export function registrarErro(error: unknown, contexto?: ErrorContext): void {
  try {
    const mensagem = mensagemDoErro(error)
    if (!mensagem) return

    void supabase.rpc('log_app_error', {
      p_message: mensagem.slice(0, 2000),
      p_level: contexto?.level ?? 'error',
      p_source: contexto?.source ?? 'manual',
      p_route: contexto?.route
        ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
      p_stack: error instanceof Error ? error.stack : undefined,
      p_release: RELEASE,
      p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    }).then(() => {}, () => {})   // engole falha de rede: best-effort
  } catch {
    // Nunca propaga. Se o registro do erro quebrar, o app segue.
  }
}
