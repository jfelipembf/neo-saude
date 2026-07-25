import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Pega o texto já digitado no prontuário e manda pra mesma Edge Function do
 * ditado (`transcribe-audio`, que aceita áudio OU texto) reorganizar no
 * formato SOAP. Ao contrário do ditado (que SOMA ao campo), isto SUBSTITUI o
 * conteúdo — é uma reescrita do que já estava lá, não um acréscimo.
 */
export function useNoteEnhancement() {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enhance(html: string): Promise<string | null> {
    setError(null)
    setIsEnhancing(true)
    try {
      const formData = new FormData()
      formData.append('text', html)
      const { data, error: fnError } = await supabase.functions.invoke('transcribe-audio', { body: formData })
      if (fnError) throw fnError
      return (data as { html?: string })?.html ?? null
    } catch {
      setError('Não foi possível aprimorar o prontuário. Tente novamente.')
      return null
    } finally {
      setIsEnhancing(false)
    }
  }

  return { isEnhancing, error, enhance }
}
