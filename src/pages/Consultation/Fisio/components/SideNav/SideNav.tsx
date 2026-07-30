import { useState } from 'react'
import { IconMenu } from '@/components/icons'
import { ITENS } from './sideNavItems'
import type { SideNavKey } from './sideNavItems'
import styles from './SideNav.module.scss'

export type { SideNavKey }

interface SideNavProps {
  /** Ausente = o componente escolhe sozinho o primeiro item como ativo, e só
   *  avisa por `onSelecionar`. Presente = quem chama decide o que fica aceso —
   *  útil quando o conteúdo à direita ainda define isso por conta própria. */
  ativo?: SideNavKey
  onSelecionar?: (chave: SideNavKey) => void
}

/**
 * MENU LATERAL do atendimento — só no DESKTOP; o celular ganha formato
 * próprio depois (ver SideNav.module.scss).
 *
 * NÃO fica colado no cabeçalho nem soldado ao cartão do paciente: é uma peça
 * própria, com borda, cantos arredondados e sombra — por isso flutua ao lado
 * dos outros, em vez de se misturar com eles.
 *
 * COLAPSA para uma coluna só de ícones — o hambúrguer no topo alterna entre os
 * dois estados. O rótulo de cada item continua no DOM quando colapsado (só
 * fica visualmente escondido), então o leitor de tela lê o menu igual nos
 * dois estados.
 */
export function SideNav({ ativo, onSelecionar }: SideNavProps) {
  const [expandido, setExpandido] = useState(true)
  const [ativoInterno, setAtivoInterno] = useState<SideNavKey>(ITENS[0].chave)
  const chaveAtiva = ativo ?? ativoInterno

  function selecionar(chave: SideNavKey) {
    setAtivoInterno(chave)
    onSelecionar?.(chave)
  }

  return (
    <nav
      className={`${styles.raiz} ${expandido ? '' : styles.raizColapsada}`}
      aria-label="Seções do atendimento"
    >
      <div className={styles.topo}>
        <button
          type="button"
          className={styles.hamburguer}
          onClick={() => setExpandido(e => !e)}
          aria-expanded={expandido}
          aria-label={expandido ? 'Recolher menu' : 'Expandir menu'}
          title={expandido ? 'Recolher menu' : 'Expandir menu'}
        >
          <IconMenu />
        </button>
      </div>

      <ul className={styles.lista}>
        {ITENS.map(item => (
          <li key={item.chave}>
            <button
              type="button"
              className={`${styles.item} ${item.chave === chaveAtiva ? styles.itemAtivo : ''}`}
              aria-pressed={item.chave === chaveAtiva}
              title={item.label}
              onClick={() => selecionar(item.chave)}
            >
              {item.icon}
              <span className={styles.rotulo}>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
