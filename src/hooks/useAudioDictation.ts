import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Grava áudio do microfone e manda pra Edge Function `transcribe-audio`, que
 * devolve o HTML já estruturado no formato SOAP (ver
 * supabase/functions/transcribe-audio). Quem usa só chama `start`/`stop` e
 * recebe o HTML pronto pra inserir no editor — nada de áudio fica no cliente
 * depois do `stop`.
 */
export function useAudioDictation() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  async function start() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      // A IA (Gemini) documenta suporte a WAV/MP3/AIFF/AAC/OGG Vorbis/FLAC — tenta
      // gravar direto num desses; navegador que não suportar nenhum cai no padrão
      // dele mesmo (Chrome grava em audio/webm, que na prática o Gemini também
      // aceita, mesmo fora da lista documentada).
      const preferredType = ['audio/ogg;codecs=opus', 'audio/mp4', 'audio/aac']
        .find(type => MediaRecorder.isTypeSupported(type))
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream)
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start()
      recorderRef.current = recorder
      setIsRecording(true)
    } catch {
      setError('Não foi possível acessar o microfone. Verifique a permissão do navegador.')
    }
  }

  /** Para a gravação, transcreve e devolve o HTML formatado (ou null se falhou). */
  function stop(): Promise<string | null> {
    return new Promise(resolve => {
      const recorder = recorderRef.current
      if (!recorder) { resolve(null); return }

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach(track => track.stop())
        setIsRecording(false)
        setIsTranscribing(true)
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
          const formData = new FormData()
          formData.append('audio', blob, 'gravacao.webm')

          const { data, error: fnError } = await supabase.functions.invoke('transcribe-audio', { body: formData })
          if (fnError) throw fnError
          resolve((data as { html?: string })?.html ?? null)
        } catch {
          setError('Não foi possível transcrever o áudio. Tente novamente.')
          resolve(null)
        } finally {
          setIsTranscribing(false)
        }
      }
      recorder.stop()
    })
  }

  return { isRecording, isTranscribing, error, start, stop }
}
