import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { IconCamera, IconX } from '@/components/icons'
import { useToast } from '@/components/Toast/Toast'
import { signAssetUrls, uploadImage } from '@/lib/storage'
import styles from './PhotoUploader.module.scss'

interface PhotoUploaderProps {
  fotos: string[]
  onChange: (fotos: string[]) => void
  /** Pasta no bucket (ex.: 'body-composition'). */
  pasta: string
  /** Teto de fotos. Padrão 12 — o mesmo CHECK que o banco impõe. */
  max?: number
  label?: string
}

/**
 * FILEIRA DE FOTOS — cada uma no seu retângulo, lado a lado.
 *
 * A vaga de upload é mais um item da fileira, sempre por último: a foto nova
 * entra ao lado da anterior e a vaga continua ali, alcançável para a próxima —
 * sem precisar achar um botão separado embaixo depois de já ter fotos.
 *
 * Aceita SELEÇÃO MÚLTIPLA no seletor de arquivos: fotografar frente, perfil e
 * costas e enviar as três de uma vez é o caminho normal.
 *
 * O TETO é o MESMO do banco (12). Repetido aqui de propósito: a tela avisa
 * antes de enviar, e o CHECK continua sendo quem garante — validação de tela é
 * cortesia, não muralha.
 */
export function PhotoUploader({
  fotos, onChange, pasta, max = 12, label,
}: PhotoUploaderProps) {
  const toast = useToast()
  const [enviando, setEnviando] = useState(false)
  // `fotos` GUARDA OS PATHS — é o que vai para o banco no salvar. O bucket é
  // privado, então `<img>` não pode usar o path direto; este mapa é só para
  // exibição, path -> URL assinada.
  const [urlAssinada, setUrlAssinada] = useState<Map<string, string>>(new Map())

  // Chave por CONTEÚDO do array, não pela referência: `fotos` é recriado a
  // cada onChange do pai, e depender da referência assinaria de novo a cada
  // tecla digitada no formulário, não só quando uma foto entra ou sai. Extraída
  // numa variável para o linter conseguir checar a dependência estaticamente.
  const chaveFotos = fotos.join('|')

  useEffect(() => {
    let cancelado = false
    signAssetUrls(fotos).then(mapa => { if (!cancelado) setUrlAssinada(mapa) })
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver `chaveFotos` acima.
  }, [chaveFotos])

  const total = fotos.length
  const cheio = total >= max

  async function escolher(e: ChangeEvent<HTMLInputElement>) {
    const escolhidos = Array.from(e.target.files ?? [])
    // Limpa antes de qualquer await: permite reescolher o MESMO arquivo depois,
    // que é o caso de quem enviou a foto errada e corrigiu o enquadramento.
    e.target.value = ''
    if (!escolhidos.length) return

    const cabem = escolhidos.slice(0, max - total)
    if (cabem.length < escolhidos.length) {
      toast.error(`Cabem no máximo ${max} fotos — as demais foram ignoradas.`)
    }

    setEnviando(true)
    try {
      // Em série, não em paralelo: são fotos de câmera, e três uploads
      // simultâneos num 4G de consultório derrubam os três.
      const novas: string[] = []
      for (const arquivo of cabem) novas.push(await uploadImage(arquivo, pasta))
      onChange([...fotos, ...novas])
    } catch {
      toast.error('Não foi possível enviar a foto.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={styles.raiz}>
      {label && <span className={styles.rotulo}>{label}</span>}

      <div className={styles.fileira}>
        {fotos.map((path, i) => (
          <div key={path} className={styles.item}>
            <img
              src={urlAssinada.get(path) ?? path}
              alt={`Foto ${i + 1}`}
              className={styles.foto}
            />
            <button
              type="button"
              className={styles.remover}
              aria-label={`Remover foto ${i + 1}`}
              onClick={() => onChange(fotos.filter(f => f !== path))}
            >
              <IconX />
            </button>
          </div>
        ))}

        {!cheio && (
          <label className={`${styles.item} ${styles.vaga} ${enviando ? styles.vagaEnviando : ''}`}>
            <IconCamera />
            {enviando ? 'Enviando…' : 'Adicionar'}
            <input
              type="file"
              accept="image/*"
              multiple
              className={styles.input}
              onChange={escolher}
              disabled={enviando}
            />
          </label>
        )}
      </div>

      {cheio && <p className={styles.limite}>Limite de {max} fotos atingido.</p>}
    </div>
  )
}
