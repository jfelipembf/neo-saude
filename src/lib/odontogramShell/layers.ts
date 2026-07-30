/**
 * Desliga por padrão as camadas de osso e polpa do gráfico (os botões, quando
 * visíveis, seguem disponíveis para religar) — retry até o motor montar os
 * botões, porque ele monta assíncrono e o clique num botão que ainda não
 * existe não faz nada.
 *
 * Fonte única: TreatmentsPanel (dentro do prontuário) e OdontogramFullscreenPage
 * (tela cheia) chamam a MESMA função — os "modos de visualização" ativos por
 * padrão (oclusal + siso ligados, osso + polpa desligados) são uma decisão de
 * produto, não de cada tela.
 */
export function hideDefaultLayers(root: HTMLElement, aoConcluir?: () => void): () => void {
  const hiddenByDefault = ['btnBoneVisible', 'btnPulpVisible']
  const start = Date.now()
  const timer = setInterval(() => {
    const pending = hiddenByDefault.filter(id => {
      const btn = root.querySelector<HTMLButtonElement>(`#${id}`)
      if (!btn) return true
      if (btn.getAttribute('aria-pressed') === 'true') btn.click()
      return btn.getAttribute('aria-pressed') === 'true'
    })
    if (pending.length === 0 || Date.now() - start > 3000) {
      clearInterval(timer)
      // Avisa que a visualização ESTABILIZOU. Quem mostra o gráfico precisa
      // saber disto: a grade termina de desenhar antes destes cliques, e
      // revelar naquele instante mostra a arcada com osso e polpa ligados por
      // uma fração de segundo, até os botões serem apertados. O flash lê como
      // defeito — "carregou errado e depois se corrigiu".
      aoConcluir?.()
    }
  }, 120)
  return () => clearInterval(timer)
}
