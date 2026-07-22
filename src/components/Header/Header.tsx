import { NavLink } from 'react-router-dom'
import { APP_ROUTES } from '@/constants'
import { useTheme } from '@/context/ThemeProvider'
import { HeaderSearch } from '@/components/HeaderSearch/HeaderSearch'
import { ProfileMenu } from '@/components/ProfileMenu/ProfileMenu'
import {
  IconLogo, IconDashboard, IconSchedule, IconPatients, IconProfessionals, IconFinance,
  IconAdmin, IconTheme,
} from '@/components/icons'
import styles from './Header.module.scss'

const NAV_ITEMS = [
  { to: APP_ROUTES.DASHBOARD,      label: 'Dashboard',      icon: <IconDashboard />, end: true },
  { to: APP_ROUTES.SCHEDULE,         label: 'Agenda',         icon: <IconSchedule /> },
  { to: APP_ROUTES.PATIENTS,      label: 'Pacientes',      icon: <IconPatients /> },
  { to: APP_ROUTES.PROFESSIONALS,  label: 'Profissionais',  icon: <IconProfessionals /> },
  { to: APP_ROUTES.FINANCE,     label: 'Financeiro',     icon: <IconFinance /> },
  { to: APP_ROUTES.ADMIN, label: 'Administrativo', icon: <IconAdmin /> },
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
        {/* Busca global de pacientes — antes do seletor de tema (lua). */}
        <HeaderSearch />
        <button type="button" className={styles.iconBtn} onClick={toggleTheme} title="Alternar tema" aria-label="Alternar tema">
          <IconTheme />
        </button>
        {/* Identidade + menu (perfil · configurações · sair). */}
        <ProfileMenu />
      </div>
    </header>
  )
}
