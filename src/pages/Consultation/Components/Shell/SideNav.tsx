import { useState } from 'react'
import type { ReactNode } from 'react'
import { IconMenu } from '@/components/icons'
import type { NavItem } from './navItems'
import styles from './SideNav.module.scss'

interface SideNavProps<K extends string> {
  itens: readonly NavItem<K>[]
  /** CONTROLE PURO, sem estado interno. A versão anterior aceitava `ativo`
   *  opcional E mantinha um `ativoInterno` — quando a página passava
   *  `undefined` (o caso da grade 'inicio' no PWA), o menu voltava a se
   *  governar sozinho e acendia um item que não era o que estava aberto. Ficava
   *  invisível só porque naquela largura o menu é `display:none`; nas telas
   *  novas o bug nasceria de graça. `null` = nenhum item aceso. */
  ativo: K | null
  onSelecionar: (chave: K) => void
  /**
   * Ação fixa no PÉ do menu, separada da lista de seções.
   *
   * É onde vive o que ENCERRA o atendimento — a única coisa aqui que não
   * navega, mas grava e sai. Longe dos itens de seção de propósito: no meio
   * deles, um clique errado numa lista que se percorre o tempo todo fecharia o
   * atendimento; no pé, fica onde a mão só vai quando a intenção é terminar.
   */
  rodape?: ReactNode
}

/**
 * MENU LATERAL do atendimento — só no DESKTOP (ver SideNav.module.scss); no
 * celular quem navega é a barra inferior.
 *
 * NÃO fica colado no cabeçalho nem soldado ao conteúdo: é peça própria, com
 * borda, cantos arredondados e sombra, flutuando ao lado dos outros.
 *
 * COLAPSA para uma coluna só de ícones — o hambúrguer no topo alterna. O rótulo
 * continua no DOM quando colapsado (só some visualmente), então o leitor de
 * tela lê o menu igual nos dois estados.
 *
 * GENÉRICO na chave: as três especialidades usam esta mesma peça, mudando só a
 * lista de `itens`. Copiá-la por pasta significaria manter três cópias em
 * sincronia — e o gate não pega divergência de CSS Module, porque classe
 * faltando vira `undefined` em silêncio.
 */
export function SideNav<K extends string>({ itens, ativo, onSelecionar, rodape }: SideNavProps<K>) {
  const [expandido, setExpandido] = useState(true)

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
        {itens.map(item => (
          <li key={item.chave}>
            <button
              type="button"
              className={`${styles.item} ${item.chave === ativo ? styles.itemAtivo : ''}`}
              aria-pressed={item.chave === ativo}
              title={item.label}
              onClick={() => onSelecionar(item.chave)}
            >
              {item.icon}
              <span className={styles.rotulo}>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* `margin-top: auto` no CSS empurra para o fim da coluna — assim ele
          encosta no pé do menu mesmo com poucas seções na lista. */}
      {rodape && <div className={styles.rodape}>{rodape}</div>}
    </nav>
  )
}
