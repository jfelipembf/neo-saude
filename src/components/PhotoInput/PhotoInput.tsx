import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { useToast } from '@/components/Toast/useToast'
import { uploadImage } from '@/lib/storage'
import { IconCamera } from '@/components/icons'
import styles from './PhotoInput.module.scss'

interface PhotoInputProps {
  label?: string
  /** URL pública da imagem atual (persiste no Storage; objectURL no mock). */
  value?: string
  onChange: (url: string | undefined) => void
  /** Subpasta no Storage por entidade (ex.: 'clinic', 'materials'). */
  folder?: string
}

/** Campo de foto com preview: escolhe a imagem, sobe pro Storage e persiste. */
export function PhotoInput({ label = 'Foto', value, onChange, folder = 'assets' }: PhotoInputProps) {
  const toast = useToast()
  const [uploading, setUploading] = useState(false)

  async function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''   // permite reescolher o MESMO arquivo após remover
    if (!file) return

    setUploading(true)
    try {
      onChange(await uploadImage(file, folder))
    } catch {
      toast.error('Não foi possível enviar a imagem.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>

      <label className={styles.drop}>
        {value ? (
          <img src={value} alt="Foto selecionada" className={styles.preview} />
        ) : (
          <span className={styles.placeholder}>
            <IconCamera />
            {uploading ? 'Enviando...' : 'Escolher foto'}
          </span>
        )}
        <input type="file" accept="image/*" className={styles.input} onChange={handleSelect} disabled={uploading} />
      </label>

      {value && !uploading && (
        <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
          Remover foto
        </Button>
      )}
    </div>
  )
}
