import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { useToast } from '@/components/Toast/Toast'
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
  /** 'lg': caixa mais alta — usado onde a imagem precisa de mais espaço pra
   *  aparecer inteira (ex.: logo da clínica), não só uma miniatura.
   *  'portrait': retângulo vertical de largura fixa (não estica pra 100%) —
   *  para quando a foto abre o formulário, tipo capa de produto. */
  size?: 'md' | 'lg' | 'portrait'
}

/** Campo de foto com preview: escolhe a imagem, sobe pro Storage e persiste. */
export function PhotoInput({ label = 'Foto', value, onChange, folder = 'assets', size = 'md' }: PhotoInputProps) {
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

      <label className={`${styles.drop} ${size !== 'md' ? styles[`drop--${size}`] : ''}`}>
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
