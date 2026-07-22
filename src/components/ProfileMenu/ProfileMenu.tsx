import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSession } from '@/context/SessionProvider'
import { useCurrentUser } from '@/hooks/useUser'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { APP_ROUTES, buildRoute } from '@/constants'
import { initials } from '@/utils/text'
import { IconUser, IconSettings, IconLogout, IconChevronDown } from '@/components/icons'
import styles from './ProfileMenu.module.scss'

/** Identidade do usuário logado no canto direito: foto, nome e e-mail, com o
 *  menu de perfil (meu perfil · configurações · sair). */
export function ProfileMenu() {
  const navigate = useNavigate()
  const { signOut, canView } = useSession()
  const { data: user } = useCurrentUser()

  const [open, setOpen] = useState(false)
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false), open)

  if (!user) return null

  // "Configurações" é gated pela feature settings; "Meu perfil" só aparece se
  // leva a algum lugar (perfil de profissional OU a página de configurações).
  const canSettings = canView('settings')
  const showProfile = Boolean(user.professionalId) || canSettings

  const avatar = user.photo
    ? <img src={user.photo} alt="" className={styles.avatarImg} />
    : <span className={styles.avatarIniciais}>{initials(user.name)}</span>

  /** Perfil do profissional correspondente; sem vínculo, cai nas configurações. */
  function goToProfile() {
    setOpen(false)
    navigate(user!.professionalId
      ? buildRoute.professionalProfile(user!.professionalId)
      : APP_ROUTES.SETTINGS)
  }

  return (
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={styles.gatilho}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu de ${user.name}`}
      >
        <span className={styles.avatar}>{avatar}</span>
        {/* Nome e e-mail somem no mobile — sobra só a foto. */}
        <span className={styles.identidade}>
          <span className={styles.nome}>{user.name}</span>
          <span className={styles.email}>{user.email}</span>
        </span>
        <span className={`${styles.chevron} ${open ? styles['chevron--aberto'] : ''}`}>
          <IconChevronDown />
        </span>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {/* Repete a identidade: no mobile o gatilho mostra só a foto. */}
          <div className={styles.menuHead}>
            <span className={styles.avatarGrande}>{avatar}</span>
            <span className={styles.menuIdentidade}>
              <span className={styles.nome}>{user.name}</span>
              <span className={styles.email}>{user.email}</span>
            </span>
          </div>

          <div className={styles.menuLista}>
            {showProfile && (
              <button type="button" className={styles.item} role="menuitem" onClick={goToProfile}>
                <IconUser />
                Meu perfil
              </button>
            )}

            {canSettings && (
              <NavLink
                to={APP_ROUTES.SETTINGS}
                className={styles.item}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <IconSettings />
                Configurações
              </NavLink>
            )}

            <button
              type="button"
              className={`${styles.item} ${styles['item--sair']}`}
              role="menuitem"
              onClick={() => { setOpen(false); void signOut() }}
            >
              <IconLogout />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
