import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/Input/Input'
import { usePatients } from '@/hooks/usePatients'
import { useDebounce } from '@/hooks/useDebounce'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { buildRoute } from '@/constants'
import { matchesSearch } from '@/utils/search'
import { digitsOnly, initials } from '@/utils/text'
import { IconSearch } from '@/components/icons'
import styles from './HeaderSearch.module.scss'

/** Busca global de pacientes no header (nome, telefone ou CPF) com dropdown. */
export function HeaderSearch() {
  const navigate = useNavigate()
  const { data: patients } = usePatients()

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false), open)

  // Só refiltra depois que o usuário para de digitar (mesmo padrão das listas).
  const term = useDebounce(search)
  const digits = digitsOnly(term)

  const results = term.trim().length >= 2
    ? (patients ?? [])
        .filter(p =>
          matchesSearch(p.name, term) ||
          (digits.length > 0 && digitsOnly(p.phone).includes(digits)) ||
          (digits.length > 0 && digitsOnly(p.cpf ?? '').includes(digits)),
        )
        .slice(0, 6)
    : []

  function openPatient(id: string) {
    navigate(buildRoute.patientProfile(id))
    setSearch('')
    setOpen(false)
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <Input
        size="sm"
        iconLeft={<IconSearch />}
        placeholder="Buscar paciente..."
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        aria-label="Buscar paciente"
        autoComplete="off"
        className={styles.campo}
      />

      {open && term.trim().length >= 2 && (
        <div className={styles.dropdown}>
          {results.length === 0 ? (
            <p className={styles.vazio}>Nenhum paciente encontrado.</p>
          ) : (
            <ul className={styles.lista}>
              {results.map(p => (
                <li key={p.id}>
                  <button type="button" className={styles.item} onClick={() => openPatient(p.id)}>
                    <span className={styles.avatar}>
                      {p.photo ? <img src={p.photo} alt="" className={styles.avatarImg} /> : initials(p.name)}
                    </span>
                    <span className={styles.info}>
                      <span className={styles.nome}>{p.name}</span>
                      <span className={styles.meta}>{[p.phone, p.cpf].filter(Boolean).join(' · ')}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
