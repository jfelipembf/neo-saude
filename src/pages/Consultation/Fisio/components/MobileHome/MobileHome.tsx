import { ITENS } from '../SideNav/sideNavItems'
import type { SideNavKey } from '../SideNav/sideNavItems'
import styles from './MobileHome.module.scss'

// Prontuários e Sinais vitais já têm atalho fixo na barra inferior — repeti-los
// aqui na grade seria a mesma seção em dois lugares.
const CHAVES_NA_BARRA = new Set<SideNavKey>(['prontuarios', 'sinais-vitais'])
const ITENS_DA_GRADE = ITENS.filter(item => !CHAVES_NA_BARRA.has(item.chave))

interface MobileHomeProps {
  onSelecionar: (chave: SideNavKey) => void
}

/**
 * INÍCIO do PWA mobile — a grade de ícones atrás do botão central da barra
 * inferior (ver MobileNav). É pra onde vai tudo que não coube nos 3 atalhos
 * fixos: tocar um ícone leva direto à seção.
 *
 * Mesmo rótulo+ícone do SideNav do desktop (import de `ITENS`) — a seção não
 * muda de nome ou de ícone só porque mudou de aparelho.
 */
export function MobileHome({ onSelecionar }: MobileHomeProps) {
  return (
    <div className={styles.raiz}>
      {ITENS_DA_GRADE.map(item => (
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
