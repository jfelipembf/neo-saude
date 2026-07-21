import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header/Header'
import styles from './AppLayout.module.scss'

/** Casca das rotas autenticadas: header horizontal no topo + conteúdo rolável. */
export function AppLayout() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
