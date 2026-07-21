import type { ChangeEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { IconCamera } from '@/components/icons'
import styles from './PhotoInput.module.scss'

interface PhotoInputProps {
  label?: string
  /** URL da imagem atual (objectURL no modo mock; URL do Storage no Supabase). */
  value?: string
  onChange: (url: string | undefined) => void
}

/** Campo de foto com preview: clica na área para escolher a imagem. */
export function PhotoInput({ label = 'Foto', value, onChange }: PhotoInputProps) {
  function aoEscolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (arquivo) onChange(URL.createObjectURL(arquivo))
    // Limpa o input: permite escolher o MESMO arquivo de novo após remover.
    e.target.value = ''
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
            Escolher foto
          </span>
        )}
        <input type="file" accept="image/*" className={styles.input} onChange={aoEscolher} />
      </label>

      {value && (
        <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
          Remover foto
        </Button>
      )}
    </div>
  )
}
