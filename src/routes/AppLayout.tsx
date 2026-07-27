import { Outlet } from 'react-router-dom'
import { CibellyGlobal } from '@/components/CibellyGlobal/CibellyGlobal'
import { Footer } from '@/components/Footer/Footer'
import { Header } from '@/components/Header/Header'
import styles from './AppLayout.module.scss'

/** Casca das rotas autenticadas: header horizontal no topo + conteúdo rolável
 *  com o rodapé "powered by" no fim. */
export function AppLayout() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.content}>
        <Outlet />
      </main>
      <Footer />
      {/* O pedal F da Cibelly em qualquer tela autenticada. Fica AQUI de
          propósito: o odontograma em tela cheia é irmão deste layout, não
          filho, então este componente não existe lá — e as duas sessões nunca
          disputam o microfone. */}
      <CibellyGlobal />
    </div>
  )
}
