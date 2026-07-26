function payloadErrorCodes(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return []
  const body = payload as {
    error?: unknown
    results?: Array<{ error?: unknown }>
  }
  const codes = typeof body.error === 'string' ? [body.error] : []
  for (const result of body.results ?? []) {
    if (typeof result.error === 'string') codes.push(result.error)
  }
  return [...new Set(codes)]
}

export function functionResultErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  const codes = payloadErrorCodes(payload)
  return codes.length ? codes.join(' ') : fallback
}

export async function supabaseFunctionErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  if (error && typeof error === 'object') {
    const context = (error as {
      context?: {
        clone?: () => Response
        json?: () => Promise<unknown>
      }
    }).context
    if (context?.json) {
      try {
        const clone = context.clone
        const response = typeof clone === 'function'
          ? clone.call(context)
          : context
        const readJson = response.json
        if (typeof readJson !== 'function') throw new Error('missing_json_reader')
        const message = functionResultErrorMessage(
          await readJson.call(response),
          '',
        )
        if (message) return message
      } catch {
        // A resposta pode já ter sido consumida; nesse caso usa a mensagem.
      }
    }

    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message.trim()
  }
  if (typeof error === 'string' && error.trim()) return error.trim()
  return fallback
}
