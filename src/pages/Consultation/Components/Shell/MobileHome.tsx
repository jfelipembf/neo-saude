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
  itens, ocultar, onSelecionar,
}: MobileHomeProps<K>) {
  const daGrade = itens.filter(item => !ocultar.includes(item.chave))

  return (
    <div className={styles.raiz}>
      {daGrade.map(item => (
        <button
          key={item.chave}
          type="button"
          className={styles.item}
          onClick={() => onSelecionar(item.chave)}
        >
          <span className={styles.icone}>{item.icon}</span>
          <span className={styles.rotulo}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
