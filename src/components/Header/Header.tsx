import { NavLink } from 'react-router-dom'
import { APP_ROUTES } from '@/constants'
import { useTheme } from '@/context/ThemeProvider'
import { useSession } from '@/context/SessionProvider'
import { HeaderSearch } from '@/components/HeaderSearch/HeaderSearch'
import { ProfileMenu } from '@/components/ProfileMenu/ProfileMenu'
import {
  IconLogo, IconDashboard, IconSchedule, IconPatients, IconProfessionals, IconFinance,
  IconAdmin, IconTheme,
} from '@/components/icons'
import styles from './Header.module.scss'

// `feature` casa 1:1 com a chave do mapa de permissões (my_session) e com a aba
// Cargos: o item some do menu quando o cargo não pode ver aquela página.
const NAV_ITEMS = [
  { to: APP_ROUTES.DASHBOARD,      label: 'Dashboard',      icon: <IconDashboard />, feature: 'dashboard',     end: true },
  { to: APP_ROUTES.SCHEDULE,         label: 'Agenda',         icon: <IconSchedule />,      feature: 'schedule' },
  { to: APP_ROUTES.PATIENTS,      label: 'Pacientes',      icon: <IconPatients />,      feature: 'patients' },
  { to: APP_ROUTES.PROFESSIONALS,  label: 'Profissionais',  icon: <IconProfessionals />, feature: 'professionals' },
  { to: APP_ROUTES.FINANCE,     label: 'Financeiro',     icon: <IconFinance />,       feature: 'finance' },
  { to: APP_ROUTES.ADMIN, label: 'Administrativo', icon: <IconAdmin />,         feature: 'admin' },
]

/** Barra horizontal do topo: marca à esquerda, navegação no centro, ações à direita. */
export function Header() {
  const { toggleTheme } = useTheme()
  const { canView } = useSession()
  const navItems = NAV_ITEMS.filter(item => canView(item.feature))

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.brand}>
          <span className={styles.brandLogo}><IconLogo /></span>
        </div>

        <div className={styles.actions}>
          {/* Busca global de pacientes — antes do seletor de tema (lua). */}
          <HeaderSearch />
          <button type="button" className={styles.iconBtn} onClick={toggleTheme} title="Alternar tema" aria-label="Alternar tema">
            <IconTheme />
          </button>
          {/* Identidade + menu (perfil · configurações · sair). */}
          <ProfileMenu />
        </div>
      </div>

      {/* Segunda barra: só a navegação, separada da barra de marca/ações. */}
      <nav className={styles.navBar}>
        {navItems.map(item => (
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
    </header>
  )
}
