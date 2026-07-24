import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useToast } from '@/components/Toast/useToast'
import { uploadImage, signAssetUrl } from '@/lib/storage'
import { IconCamera, IconX } from '@/components/icons'
import { goniometryAngle } from '@/utils/goniometry'
import type { GoniometryPoints } from '@/types/domain'
import styles from './GoniometryPhoto.module.scss'

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const POINT_LABEL = ['Ponto A', 'Vértice (articulação)', 'Ponto C']

interface GoniometryPhotoProps {
  /** Path persistido (formato do PhotoInput) OU já uma URL assinada quando vem
   *  de um teste carregado (listTests já assina antes de chegar aqui). */
  image?: string
  points: GoniometryPoints
  onImage: (url: string | undefined) => void
  onPointsChange: (points: GoniometryPoints) => void
  /** Dispara sempre que o ângulo calculado mudar (foto carregada + pontos). */
  onValueChange?: (value: number | null) => void
  folder?: string
}

/**
 * Goniômetro digital: foto + 3 pontos arrastáveis (A·vértice·C), ângulo entre
 * os dois segmentos calculado ao vivo. Sobe a foto pro Storage — mesmo
 * caminho do PhotoInput.
 */
export function GoniometryPhoto({ image, points, onImage, onPointsChange, onValueChange, folder = 'tests' }: GoniometryPhotoProps) {
  const toast = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const [uploading, setUploading] = useState(false)
  // Só sabido depois que a foto carrega no <img> — necessário p/ a medida
  // sair correta em fotos retangulares (ver utils/goniometry).
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  // `image` guarda o PATH bruto (o que é persistido) — não dá pra exibir num
  // <img> direto (bucket privado). Testes já salvos chegam com a URL JÁ
  // assinada (listTests assina antes); um upload FRESCO desta sessão ainda
  // não passou por isso, então assinamos aqui na hora — senão a foto fica
  // quebrada bem no momento em que o fisio precisa arrastar os pontos nela.
  const [freshSigned, setFreshSigned] = useState<{ forPath: string; url: string } | null>(null)
  const displaySrc = freshSigned && freshSigned.forPath === image ? freshSigned.url : image

  const angle = naturalSize ? goniometryAngle(points, naturalSize) : null

  useEffect(() => {
    onValueChange?.(angle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle])

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setNaturalSize(null)
    try {
      const path = await uploadImage(file, folder)
      const signed = await signAssetUrl(path)
      setFreshSigned({ forPath: path, url: signed ?? path })
      onImage(path)
    } catch {
      toast.error('Não foi possível enviar a foto.')
    } finally {
      setUploading(false)
    }
  }

  function removeImage() {
    onImage(undefined)
    setFreshSigned(null)
    setNaturalSize(null)
  }

  function movePoint(index: number, clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return
    const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)
    const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100)
    const next = [...points] as GoniometryPoints
    next[index] = { x, y }
    onPointsChange(next)
  }

  function nudgePoint(index: number, dx: number, dy: number) {
    const p = points[index]
    const next = [...points] as GoniometryPoints
    next[index] = { x: clamp(p.x + dx, 0, 100), y: clamp(p.y + dy, 0, 100) }
    onPointsChange(next)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(index: number) {
    return (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return
      e.preventDefault()
      movePoint(index, e.clientX, e.clientY)
    }
  }

  // Setas do teclado nudgeiam o ponto — acessível para quem não usa mouse/touch.
  function handleKeyDown(index: number) {
    return (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? 5 : 1
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      }
      const move = moves[e.key]
      if (!move) return
      e.preventDefault()
      nudgePoint(index, move[0], move[1])
    }
  }

  if (!displaySrc) {
    return (
      <label className={styles.dropzone}>
        <span className={styles.dropzoneConteudo}>
          <IconCamera />
          <span>{uploading ? 'Enviando...' : 'Adicionar foto'}</span>
        </span>
        <input type="file" accept="image/*" onChange={pickImage} className={styles.dropzoneInput} disabled={uploading} />
      </label>
    )
  }

  const vertex = points[1]

  return (
    <div className={styles.wrap}>
      <div className={styles.foto} ref={containerRef}>
        <img
          src={displaySrc}
          alt="Foto para medição"
          className={styles.img}
          draggable={false}
          onLoad={e => setNaturalSize({ w: e.currentTarget.naturalWidth || 1, h: e.currentTarget.naturalHeight || 1 })}
        />

        <svg className={styles.linhas} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} />
          <line x1={points[1].x} y1={points[1].y} x2={points[2].x} y2={points[2].y} />
        </svg>

        {points.map((p, i) => (
          <div
            key={i}
            className={`${styles.ponto} ${i === 1 ? styles['ponto--vertice'] : ''}`}
            style={{ '--x': `${p.x}%`, '--y': `${p.y}%` } as CSSProperties}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove(i)}
            onKeyDown={handleKeyDown(i)}
            role="slider"
            tabIndex={0}
            aria-label={`${POINT_LABEL[i]} — arraste ou use as setas do teclado`}
            aria-valuetext={`${Math.round(p.x)}%, ${Math.round(p.y)}%`}
          />
        ))}

        {angle !== null && (
          <span className={styles.angulo} style={{ '--x': `${vertex.x}%`, '--y': `${vertex.y}%` } as CSSProperties}>
            {angle}°
          </span>
        )}
      </div>

      <div className={styles.rodape}>
        <span className={styles.dica}>Arraste os 3 pontos: A e C nos segmentos, o do meio na articulação medida.</span>
        <button type="button" className={styles.trocar} onClick={removeImage}>
          <IconX /> Trocar foto
        </button>
      </div>
    </div>
  )
}
