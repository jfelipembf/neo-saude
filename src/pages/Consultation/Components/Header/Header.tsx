import { useState } from 'react'
import type { ReactNode } from 'react'
import { IconChevronDown, IconLogo, IconLogout, IconUser } from '@/components/icons'
import { SPECIALTY_BADGE_LABEL } from '@/constants/specialty'
import { useSession } from '@/context/SessionProvider'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { idadeDoPaciente } from '@/utils/patientAge'
import type { Patient } from '@/types/domain'
import styles from './Header.module.scss'

interface HeaderProps {
  /** Ausente enquanto a busca não resolve — o topo nasce com o esqueleto no
   *  lugar em vez de sumir, para o cabeçalho não pular de altura ao carregar. */
  paciente?: Patient
  onSair: () => void
  /** Ações da especialidade, entre a marca e o menu do paciente. A fisioterapia
   *  não passa nada; a medicina põe aqui o cronômetro e o par
   *  Iniciar/Finalizar consulta, que são a ação mais forte daquela tela e não
   *  existem nas outras. */
  acoes?: ReactNode
}

/**
 * TOPO DA TELA DE ATENDIMENTO — a marca à esquerda, o paciente à direita.
 *
 * Compartilhado: fica em Components/ porque médico, fisioterapeuta e dentista
 * veem o mesmo topo. Duas cópias divergem no primeiro ajuste que alguém fizer
 * em uma só.
 *
 * A identidade do paciente vira um menu (mesmo padrão do ProfileMenu da barra
 * principal): foto, nome e e-mail no gatilho, e é dentro dele — não solto ao
 * lado — que mora o botão de sair.
 *
 * Foto, nome e e-mail vêm de PROPS, não de busca própria: quem está sendo
 * atendido é o paciente da SESSÃO aberta, e cada tela já sabe qual é — buscar
 * de novo aqui dentro duplicaria a mesma pergunta que o resto da tela já fez.
 */
export function Header({ paciente, onSair, acoes }: HeaderProps) {
  const { specialty } = useSession()
  const [aberto, setAberto] = useState(false)
  const ref = useOutsideClick<HTMLDivElement>(() => setAberto(false), aberto)

  // Idade ao lado do nome: é dado CLÍNICO nas três especialidades — dose
  // pediátrica, faixa de referência de sinal vital e conduta mudam com ela.
  // Vinha do cartão do paciente da tela médica, que a casca nova aposentou.
  const idade = idadeDoPaciente(paciente?.birthDate)

  const avatar = paciente?.photo
    ? <img src={paciente.photo} alt="" className={styles.avatarImg} />
    : <IconUser />

  const specialtyBadge = specialty ? SPECIALTY_BADGE_LABEL[specialty] : undefined

  return (
    <header className={styles.topo}>
      <div className={styles.marca}>
        <span className={styles.logo}><IconLogo /></span>
        {specialtyBadge && (
          <>
            <span className={styles.marcaDivider} aria-hidden="true" />
            <span className={styles.marcaBadge}>{specialtyBadge}</span>
          </>
        )}
      </div>

      {acoes && <div className={styles.acoes}>{acoes}</div>}

      <div className={styles.menu} ref={ref}>
        <button
          type="button"
          className={styles.gatilho}
          onClick={() => setAberto(a => !a)}
          aria-haspopup="menu"
          aria-expanded={aberto}
          aria-label={`Dados de ${paciente?.name ?? 'paciente'}`}
        >
          <span className={styles.avatar}>{avatar}</span>
          {/* Nome e e-mail somem no phone — sobra só a foto; o dropdown repete os dois. */}
          <span className={styles.identidade}>
            <strong className={styles.nome}>{paciente?.name}</strong>
            {idade && <span className={styles.idade}>{idade}</span>}
            {paciente?.email && <span className={styles.email}>{paciente.email}</span>}
          </span>
          <span className={`${styles.chevron} ${aberto ? styles.chevronAberto : ''}`}>
            <IconChevronDown />
          </span>
        </button>

        {aberto && (
          <div className={styles.dropdown} role="menu">
            <div className={styles.dropdownHead}>
              <span className={styles.avatarGrande}>{avatar}</span>
              <span className={styles.identidade}>
                <strong className={styles.nome}>{paciente?.name}</strong>
            {idade && <span className={styles.idade}>{idade}</span>}
                {paciente?.email && <span className={styles.email}>{paciente.email}</span>}
              </span>
            </div>
            <button
              type="button"
              className={styles.itemSair}
              role="menuitem"
              onClick={() => { setAberto(false); onSair() }}
            >
              <IconLogout />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
