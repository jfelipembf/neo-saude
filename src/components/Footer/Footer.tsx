import logo from '@/assets/images/logo/logo.svg'
import styles from './Footer.module.scss'

/** Rodapé global do app: "powered by" + logo, discreto no canto inferior direito. */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.texto}>powered by</span>
      <img src={logo} alt="Logo" className={styles.logo} />
    </footer>
  )
}
