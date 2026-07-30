import { IconHome } from '@/components/icons'
import { CHAVE_INICIO } from './navItems'
import type { ChaveInicio, NavItem } from './navItems'
import styles from './MobileNav.module.scss'

interface MobileNavProps<K extends string> {
  itens: readonly NavItem<K>[]
  /** As DUAS seções que ganham atalho fixo: esquerda e direita do botão
   *  central. A MESMA tupla vai para o MobileHome, que as remove da grade —
   *  passar a lista uma vez só é o que impede a barra e a grade de discordarem
   *  sobre o que já tem atalho. */
  atalhos: readonly [K, K]
  ativo: K | ChaveInicio | null
  onSelecionar: (chave: K | ChaveInicio) => void
}

/**
 * NAVEGAÇÃO INFERIOR — só no PWA mobile (ver MobileNav.module.scss); é o
 * contraponto do menu lateral, que não cabe numa tela de celular.
 *
 * Três destinos: dois atalhos fixos e, no centro, a casinha elevada que abre a
 * grade com TODO o resto (ver MobileHome).
 *
 * Rótulo e ícone dos atalhos saem de `itens`, NUNCA escritos aqui. A versão
 * anterior os tinha em JSX literal, e o resultado foi a barra e o menu lateral
 * mostrando ícones DIFERENTES para a mesma seção depois que o conjunto de
 * ícones migrou — o menu já usava os novos e a barra continuou nos antigos.
 * Derivando da lista, isso não tem como acontecer de novo.
 */
export function MobileNav<K extends string>({
  itens, atalhos, ativo, onSelecionar,
}: MobileNavProps<K>) {
  const [esquerda, direita] = atalhos.map(
    chave => itens.find(i => i.chave === chave),
  )

  function botao(item: NavItem<K> | undefined) {
    // Atalho que não existe na lista não vira botão fantasma: some, e o menu
    // continua com dois destinos em vez de um buraco clicável.
    if (!item) return null
    return (
      <button
        type="button"
        className={`${styles.item} ${ativo === item.chave ? styles.itemAtivo : ''}`}
        aria-pressed={ativo === item.chave}
        onClick={() => onSelecionar(item.chave)}
      >
        {item.icon}
        <span className={styles.rotulo}>{item.label}</span>
      </button>
    )
  }

  return (
    <nav className={styles.raiz} aria-label="Navegação">
      {botao(esquerda)}

      <button
        type="button"
        className={`${styles.inicio} ${ativo === CHAVE_INICIO ? styles.inicioAtivo : ''}`}
        aria-pressed={ativo === CHAVE_INICIO}
        aria-label="Início"
        title="Início"
        onClick={() => onSelecionar(CHAVE_INICIO)}
      >
        <IconHome />
      </button>

      {botao(direita)}
    </nav>
  )
}
