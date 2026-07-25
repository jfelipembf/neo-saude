import { useEffect } from 'react'
import { useAudioDictation } from '@/hooks/useAudioDictation'
import { useNoteEnhancement } from '@/hooks/useNoteEnhancement'
import { Spinner } from '@/components/Spinner/Spinner'
import { useToast } from '@/components/Toast/Toast'
import { IconMic, IconSparkle } from '@/components/icons'
import styles from './AiNoteActions.module.scss'

interface AiNoteActionsProps {
  /** HTML atual do prontuário (mesmo `value` do RichTextEditor ao lado). */
  value: string
  /** Mesma função que já vai pro `onChange` do RichTextEditor — ditado SOMA
   *  ao campo, "Aprimorar" SUBSTITUI. Os dois só chamam onChange; quem
   *  sincroniza a tela é o próprio RichTextEditor (value é controlado). */
  onChange: (html: string) => void
}

/** Vem AO LADO do botão "Salvar prontuário" (rodapé), não dentro do
 *  RichTextEditor — o editor é genérico, IA é decisão de quem usa o campo. */
function hasText(html: string) {
  return html.replace(/<[^>]*>/g, '').trim().length > 0
}

export function AiNoteActions({ value, onChange }: AiNoteActionsProps) {
  const dictation = useAudioDictation()
  const enhancement = useNoteEnhancement()

  // Erro do ditado/aprimoramento (mic negado, IA falhou) — surge só uma vez,
  // então é aviso ao usuário (toast), não algo pra renderizar preso aqui.
  const toast = useToast()
  useEffect(() => {
    if (dictation.error) toast.error(dictation.error)
  }, [dictation.error, toast])
  useEffect(() => {
    if (enhancement.error) toast.error(enhancement.error)
  }, [enhancement.error, toast])

  async function handleMicClick() {
    if (dictation.isRecording) {
      const html = await dictation.stop()
      if (html) onChange(value + html)
      return
    }
    dictation.start()
  }

  // "Aprimorar com IA": diferente do ditado (que SOMA ao campo), isto
  // SUBSTITUI o conteúdo pela versão reorganizada no formato SOAP — é uma
  // reescrita do que já estava escrito, não um acréscimo.
  async function handleEnhanceClick() {
    if (!hasText(value)) return
    const html = await enhancement.enhance(value)
    if (html) onChange(html)
  }

  const busy = dictation.isTranscribing || enhancement.isEnhancing

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={`${styles.btn} ${dictation.isRecording ? styles['btn--recording'] : ''}`}
        disabled={dictation.isTranscribing || enhancement.isEnhancing}
        onClick={handleMicClick}
        aria-label={dictation.isRecording ? 'Parar ditado e transcrever' : 'Ditar prontuário por voz'}
        title={dictation.isRecording ? 'Parar ditado e transcrever' : 'Ditar prontuário por voz'}
      >
        {dictation.isTranscribing ? <Spinner size="sm" /> : <IconMic />}
      </button>

      <button
        type="button"
        className={styles.btn}
        disabled={busy || dictation.isRecording || !hasText(value)}
        onClick={handleEnhanceClick}
        aria-label="Aprimorar prontuário com IA"
        title="Aprimorar prontuário com IA (reorganiza no formato SOAP)"
      >
        {enhancement.isEnhancing ? <Spinner size="sm" /> : <IconSparkle />}
      </button>
    </div>
  )
}
