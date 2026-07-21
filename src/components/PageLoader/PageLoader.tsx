import { Spinner } from '@/components/Spinner/Spinner'
import styles from './PageLoader.module.scss'

/** Loader de página inteira — fallback do Suspense nas rotas lazy. */
export function PageLoader() {
  return (
    <div className={styles.loader}>
      <Spinner size="lg" />
    </div>
  )
}
