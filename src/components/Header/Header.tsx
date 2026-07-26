import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { APP_ROUTES, FULLSCREEN_ROUTES, SPECIALTY_BADGE_LABEL } from '@/constants'
import type { AppPage } from '@/types/domain'
import { useTheme } from '@/context/ThemeProvider'
import { useSession } from '@/context/SessionProvider'
import { HeaderSearch } from '@/components/HeaderSearch/HeaderSearch'
import { ProfileMenu } from '@/components/ProfileMenu/ProfileMenu'
import {
  IconLogo, IconDashboard, IconToday, IconSchedule, IconPatients, IconProfessionals, IconFinance,
  IconAdmin, IconTheme,
} from '@/components/icons'
import odontoIAIcon from '@/assets/images/icon/odontoIA.png'
import styles from './Header.module.scss'

// `feature` casa 1:1 com a chave do mapa de permissões (my_session) e com a aba
// Cargos: o item some do menu quando o cargo não pode ver aquela página.
// São 7 das 8 páginas de AppPage — 'settings' NÃO entra aqui de propósito:
// Configurações é alcançada pelo ProfileMenu (avatar), não pela barra.
interface NavItem {
  to:       string
  label:    string
  icon:     ReactNode
  feature:  AppPage
  end?:     boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: APP_ROUTES.TODAY,         label: 'Hoje',           icon: <IconToday />,         feature: 'today' },
  { to: APP_ROUTES.DASHBOARD,     label: 'Dashboard',      icon: <IconDashboard />,     feature: 'dashboard', end: true },
  { to: APP_ROUTES.SCHEDULE,      label: 'Agenda',         icon: <IconSchedule />,      feature: 'schedule' },
  { to: APP_ROUTES.PATIENTS,      label: 'Pacientes',      icon: <IconPatients />,      feature: 'patients' },
  { to: APP_ROUTES.PROFESSIONALS, label: 'Profissionais',  icon: <IconProfessionals />, feature: 'professionals' },
  { to: APP_ROUTES.FINANCE,       label: 'Financeiro',     icon: <IconFinance />,       feature: 'finance' },
  { to: APP_ROUTES.ADMIN,         label: 'Administrativo', icon: <IconAdmin />,         feature: 'admin' },
]

/** Barra horizontal do topo: marca à esquerda, navegação no centro, ações à direita. */
export function Header() {
  const navigate = useNavigate()
  const { toggleTheme } = useTheme()
  const { canView, specialty } = useSession()
  const navItems = NAV_ITEMS.filter(item => canView(item.feature))
  // Mesma feature que protege a leitura do odontograma por RLS ('patients') +
  // o gate de especialidade (só faz sentido em odontologia) — ver comment do
  // FeatureGuard da rota em AppRouter.tsx.
  const showOdontogram = specialty === 'dentistry' && canView('patients')
  const specialtyBadge = specialty ? SPECIALTY_BADGE_LABEL[specialty] : undefined

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.brand}>
          <span className={styles.brandLogo}><IconLogo /></span>
          {specialtyBadge && (
            <>
              <span className={styles.brandDivider} aria-hidden="true" />
              <span className={styles.brandBadge}>{specialtyBadge}</span>
            </>
          )}
        </div>

        <div className={styles.actions}>
          {/* Busca global de pacientes — antes do seletor de tema (lua). */}
          <HeaderSearch />
          {showOdontogram && (
            <button
              type="button"
              className={styles.aiBtn}
              onClick={() => navigate(FULLSCREEN_ROUTES.ODONTOGRAM)}
              title="Odontograma em tela cheia"
              aria-label="Abrir odontograma em tela cheia"
            >
              <img src={odontoIAIcon} alt="" className={styles.aiIcon} />
              <span className={styles.aiLabel}>Odonto IA</span>
            </button>
          )}
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
