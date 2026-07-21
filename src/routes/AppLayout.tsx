import { Outlet } from 'react-router-dom'
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
    </div>
  )
}
