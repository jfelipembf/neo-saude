import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSession } from '@/context/SessionProvider'
import { useUsuarioLogado } from '@/hooks/useUsuario'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { APP_ROUTES, buildRoute } from '@/constants'
import { initials } from '@/utils/text'
import { IconUsuario, IconConfiguracoes, IconSair, IconChevronBaixo } from '@/components/icons'
import styles from './ProfileMenu.module.scss'

/** Identidade do usuário logado no canto direito: foto, nome e e-mail, com o
 *  menu de perfil (meu perfil · configurações · sair). */
export function ProfileMenu() {
  const navigate = useNavigate()
  const { signOut } = useSession()
  const { data: usuario } = useUsuarioLogado()

  const [aberto, setAberto] = useState(false)
  const ref = useOutsideClick<HTMLDivElement>(() => setAberto(false), aberto)

  if (!usuario) return null

  const avatar = usuario.foto
    ? <img src={usuario.foto} alt="" className={styles.avatarImg} />
    : <span className={styles.avatarIniciais}>{initials(usuario.nome)}</span>

  /** Perfil do profissional correspondente; sem vínculo, cai nas configurações. */
  function irParaPerfil() {
    setAberto(false)
    navigate(usuario!.profissionalId
      ? buildRoute.profissionalPerfil(usuario!.profissionalId)
      : APP_ROUTES.CONFIGURACOES)
  }

  return (
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={styles.gatilho}
        onClick={() => setAberto(a => !a)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={`Menu de ${usuario.nome}`}
      >
        <span className={styles.avatar}>{avatar}</span>
        {/* Nome e e-mail somem no mobile — sobra só a foto. */}
        <span className={styles.identidade}>
          <span className={styles.nome}>{usuario.nome}</span>
          <span className={styles.email}>{usuario.email}</span>
        </span>
        <span className={`${styles.chevron} ${aberto ? styles['chevron--aberto'] : ''}`}>
          <IconChevronBaixo />
        </span>
      </button>

      {aberto && (
        <div className={styles.menu} role="menu">
          {/* Repete a identidade: no mobile o gatilho mostra só a foto. */}
          <div className={styles.menuHead}>
            <span className={styles.avatarGrande}>{avatar}</span>
            <span className={styles.menuIdentidade}>
              <span className={styles.nome}>{usuario.nome}</span>
              <span className={styles.email}>{usuario.email}</span>
            </span>
          </div>

          <div className={styles.menuLista}>
            <button type="button" className={styles.item} role="menuitem" onClick={irParaPerfil}>
              <IconUsuario />
              Meu perfil
            </button>

            <NavLink
              to={APP_ROUTES.CONFIGURACOES}
              className={styles.item}
              role="menuitem"
              onClick={() => setAberto(false)}
            >
              <IconConfiguracoes />
              Configurações
            </NavLink>

            <button
              type="button"
              className={`${styles.item} ${styles['item--sair']}`}
              role="menuitem"
              onClick={() => { setAberto(false); void signOut() }}
            >
              <IconSair />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
