import { Link } from 'react-router-dom'
import { APP_ROUTES } from '@/constants'
import unauthorizedImage from '@/assets/images/401.png'
import styles from './UnauthorizedPage.module.scss'

/**
 * Página "sem acesso": o cargo do colaborador não libera a rota pedida.
 * Fica dentro do AppLayout, então o cabeçalho já mostra só o que ele pode abrir.
 */
export function UnauthorizedPage() {
  return (
    <div className={styles.page}>
      <img src={unauthorizedImage} alt="" className={styles.image} />
      <div className={styles.content}>
        <h1 className={styles.title}>Acesso restrito</h1>
        <p className={styles.description}>
          Seu cargo não tem permissão para esta página. Fale com o administrador
          da clínica se precisar de acesso.
        </p>
        <Link to={APP_ROUTES.DASHBOARD} className={styles.link}>Voltar para o início</Link>
      </div>
    </div>
  )
}
