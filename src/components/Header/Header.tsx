import { NavLink } from 'react-router-dom'
import { APP_ROUTES } from '@/constants'
import { useTheme } from '@/context/ThemeProvider'
import { ProfileMenu } from '@/components/ProfileMenu/ProfileMenu'
import {
  IconLogo, IconDashboard, IconAgenda, IconPacientes, IconProfissionais, IconFinanceiro,
  IconAdministrativo, IconTema,
} from '@/components/icons'
import styles from './Header.module.scss'

const NAV_ITEMS = [
  { to: APP_ROUTES.DASHBOARD,      label: 'Dashboard',      icon: <IconDashboard />, end: true },
  { to: APP_ROUTES.AGENDA,         label: 'Agenda',         icon: <IconAgenda /> },
  { to: APP_ROUTES.PACIENTES,      label: 'Pacientes',      icon: <IconPacientes /> },
  { to: APP_ROUTES.PROFISSIONAIS,  label: 'Profissionais',  icon: <IconProfissionais /> },
  { to: APP_ROUTES.FINANCEIRO,     label: 'Financeiro',     icon: <IconFinanceiro /> },
  { to: APP_ROUTES.ADMINISTRATIVO, label: 'Administrativo', icon: <IconAdministrativo /> },
]

/** Barra horizontal do topo: marca à esquerda, navegação no centro, ações à direita. */
export function Header() {
  const { toggleTheme } = useTheme()

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandLogo}><IconLogo /></span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `${styles.link} ${isActive ? styles['link--active'] : ''}`}
          >
            <span className={styles.linkIcon}>{item.icon}</span>
            <span className={styles.linkLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.actions}>
        <button type="button" className={styles.iconBtn} onClick={toggleTheme} title="Alternar tema" aria-label="Alternar tema">
          <IconTema />
        </button>
        {/* Identidade + menu (perfil · configurações · sair). */}
        <ProfileMenu />
      </div>
    </header>
  )
}
