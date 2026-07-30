import { IconLock } from '@/components/icons'
import type { NavItem } from './navItems'
import styles from './MobileHome.module.scss'

interface MobileHomeProps<K extends string> {
  itens: readonly NavItem<K>[]
  /** As chaves que JÁ têm atalho fixo na barra inferior — saem da grade, senão
   *  a mesma seção apareceria em dois lugares na mesma tela. Recebe a MESMA
   *  tupla que o MobileNav usa para montar os atalhos.
   *
   *  Tipado em `K` e não em `string`: com `string` o TypeScript infere K como
   *  `string` a partir desta prop e o `onSelecionar` da página deixa de casar. */
  ocultar: readonly K[]
  onSelecionar: (chave: K) => void
  /** Seções indisponíveis agora — mesma leitura do menu do desktop: cadeado no
   *  canto do ícone e brilho a menos, mas o toque continua valendo (é ele que
   *  leva ao vazio com o botão de abrir tratamento). */
  bloqueadas?: readonly K[]
}

/**
 * INÍCIO do PWA mobile — a grade de ícones atrás do botão central da barra
 * inferior. É para onde vai tudo que não coube nos atalhos fixos: tocar um
 * ícone leva direto à seção.
 *
 * Mesmo rótulo e mesmo ícone do menu lateral, porque vem da mesma lista — a
 * seção não muda de nome nem de cara só porque mudou de aparelho.
 */
export function MobileHome<K extends string>({
  itens, ocultar, onSelecionar, bloqueadas = [],
}: MobileHomeProps<K>) {
  const daGrade = itens.filter(item => !ocultar.includes(item.chave))

  return (
    <div className={styles.raiz}>
      {daGrade.map(item => {
        const bloqueada = bloqueadas.includes(item.chave)

        return (
          <button
            key={item.chave}
            type="button"
            className={`${styles.item} ${bloqueada ? styles.itemBloqueado : ''}`}
            onClick={() => onSelecionar(item.chave)}
          >
            <span className={styles.icone}>
              {item.icon}
              {bloqueada && <span className={styles.cadeado}><IconLock /></span>}
            </span>
            <span className={styles.rotulo}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
