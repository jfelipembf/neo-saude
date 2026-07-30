import { IconBloodPressure, IconDocument, IconHome } from '@/components/icons'
import styles from './MobileNav.module.scss'

export type MobileNavKey = 'prontuarios' | 'inicio' | 'sinais-vitais'

interface MobileNavProps {
  ativo: MobileNavKey | null
  onSelecionar: (chave: MobileNavKey) => void
}

/**
 * NAVEGAÇÃO INFERIOR — só no PWA mobile (ver MobileNav.module.scss); é o
 * contraponto do SideNav do desktop, que não cabe numa tela de celular.
 *
 * Só 3 destinos cabem na barra: Prontuários e Sinais vitais são os atalhos
 * fixos; todo o RESTO das seções (Testes, Avaliações, Anamnese, Meus
 * tratamentos...) mora atrás do botão central — ver MobileHome.
 *
 * O botão do centro é a casinha NUM CÍRCULO, elevada acima da barra — mesmo
 * padrão visual de app com botão central em destaque.
 */
export function MobileNav({ ativo, onSelecionar }: MobileNavProps) {
  return (
    <nav className={styles.raiz} aria-label="Navegação">
      <button
        type="button"
        className={`${styles.item} ${ativo === 'prontuarios' ? styles.itemAtivo : ''}`}
        aria-pressed={ativo === 'prontuarios'}
        onClick={() => onSelecionar('prontuarios')}
      >
        <IconDocument />
        <span className={styles.rotulo}>Prontuários</span>
      </button>

      <button
        type="button"
        className={`${styles.inicio} ${ativo === 'inicio' ? styles.inicioAtivo : ''}`}
        aria-pressed={ativo === 'inicio'}
        aria-label="Início"
        title="Início"
        onClick={() => onSelecionar('inicio')}
      >
        <IconHome />
      </button>

      <button
        type="button"
        className={`${styles.item} ${ativo === 'sinais-vitais' ? styles.itemAtivo : ''}`}
        aria-pressed={ativo === 'sinais-vitais'}
        onClick={() => onSelecionar('sinais-vitais')}
      >
        <IconBloodPressure />
        <span className={styles.rotulo}>Sinais vitais</span>
      </button>
    </nav>
  )
}
