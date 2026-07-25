// ─────────────────────────────────────────────────────────────────────────────
// Leitura do tamanho de tela em JS. O layout inteiro se ajusta por CSS (mixins
// `mobile`/`phone` de styles/_breakpoints.scss) — este arquivo é só para a
// decisão que o CSS NÃO consegue tomar: escolher um VALOR INICIAL de estado.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️ Precisa bater com `$bp-tablet` de `src/styles/_breakpoints.scss`.
 *
 * A duplicação é consciente: variável SCSS não é legível do JS sem plugin, e
 * criar um pipeline para exportar um número não se paga. Está declarada UMA vez
 * aqui, com este aviso, em vez de espalhar `768` pelos componentes.
 */
export const MOBILE_MAX_WIDTH = 768

/**
 * A tela é de celular/tablet em retrato AGORA?
 *
 * Uso previsto: inicializador preguiçoso de `useState`, lido UMA vez na
 * montagem. NÃO é reativo de propósito — trocar a visualização no meio do uso
 * (ao girar o aparelho, ou quando o teclado virtual muda a altura) passaria por
 * cima da escolha de quem está usando, que é pior do que começar no modo
 * "errado".
 *
 * Guarda o `typeof window` porque isto pode rodar fora do navegador (jsdom nos
 * testes tem matchMedia mockado; SSR não teria nem window).
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches
}
