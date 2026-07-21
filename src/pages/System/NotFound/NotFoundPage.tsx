import { Link } from 'react-router-dom'
import { APP_ROUTES } from '@/constants'
import styles from './NotFoundPage.module.scss'

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <span className={styles.code}>404</span>
      <h1 className={styles.title}>Página não encontrada</h1>
      <p className={styles.description}>O endereço acessado não existe ou foi movido.</p>
      <Link to={APP_ROUTES.DASHBOARD} className={styles.link}>Voltar para o início</Link>
    </div>
  )
}
