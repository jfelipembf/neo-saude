import { useMemo, useState } from 'react'
import { usePatients } from '@/hooks/usePatients'
import { useDebounce } from '@/hooks/useDebounce'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { Input } from '@/components/Input/Input'
import { IconSearch, IconChevronDown, IconX } from '@/components/icons'
import { matchesSearch } from '@/utils/search'
import { digitsOnly, initials } from '@/utils/text'
import type { Patient } from '@/types/domain'
import styles from './PatientPicker.module.scss'

/** Teto de sugestões: lista longa em dropdown vira rolagem dentro de rolagem. */
const MAX_SUGESTOES = 8

interface PatientPickerProps {
  /** ID do paciente escolhido — nunca o nome (homônimo escolheria o errado). */
  value: string | null
  onChange: (patient: Patient | null) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  /** Trava a troca e explica por quê (ex.: atendimento em andamento). */
  lockedReason?: string
}

/**
 * Escolhe um paciente por busca (nome, telefone ou CPF).
 *
 * Trabalha com ID, de propósito: o padrão que existia na base resolvia o
 * paciente por `patients.find(p => p.name === termo)` (AppointmentModal), o que
 * agenda para a pessoa errada quando há dois homônimos — não repetir isso aqui
 * é metade do motivo deste componente existir.
 *
 * Filtra no cliente porque `listPatients()` já traz a clínica inteira e a lista
 * costuma estar quente no cache (Header e Agenda a carregam). Se um dia isso
 * pesar, o conserto é uma busca no servidor dentro do service — a API deste
 * componente não muda.
 */
export function PatientPicker({
  value, onChange, className, placeholder = 'Buscar paciente por nome, telefone ou CPF…',
  disabled = false, lockedReason,
}: PatientPickerProps) {
  const { data: patients = [], isLoading } = usePatients()
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const termo = useDebounce(busca)

  const ref = useOutsideClick<HTMLDivElement>(() => setAberto(false), aberto)

  const selecionado = useMemo(
    () => patients.find(p => p.id === value) ?? null,
    [patients, value],
  )

  const sugestoes = useMemo(() => {
    const t = termo.trim()
    // Sem termo, mostra os primeiros — abrir e ver uma lista vazia parece quebrado.
    const base = t
      ? patients.filter(p =>
          matchesSearch(p.name, t)
          || (p.commonName ? matchesSearch(p.commonName, t) : false)
          || (t.length >= 3 && digitsOnly(p.phone).includes(digitsOnly(t)))
          || (p.cpf ? digitsOnly(p.cpf).includes(digitsOnly(t)) : false),
        )
      : patients
    return base.slice(0, MAX_SUGESTOES)
  }, [patients, termo])

  const travado = disabled || Boolean(lockedReason)

  function escolher(p: Patient) {
    onChange(p)
    setAberto(false)
    setBusca('')
  }

  return (
    <div className={`${styles.raiz} ${className ?? ''}`} ref={ref}>
      <button
        type="button"
        className={styles.gatilho}
        onClick={() => setAberto(v => !v)}
        disabled={travado}
        title={lockedReason}
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        {selecionado ? (
          <>
            <span className={styles.avatar}>
              {selecionado.photo
                ? <img src={selecionado.photo} alt="" className={styles.avatarImg} />
                : initials(selecionado.name)}
            </span>
            <span className={styles.nome}>{selecionado.commonName || selecionado.name}</span>
            <span className={styles.codigo}>{selecionado.code}</span>
          </>
        ) : (
          <span className={styles.vazio}>{isLoading ? 'Carregando pacientes…' : 'Escolher paciente'}</span>
        )}
        <IconChevronDown />
      </button>

      {selecionado && !travado && (
        <button
          type="button"
          className={styles.limpar}
          onClick={() => onChange(null)}
          title="Limpar paciente"
          aria-label="Limpar paciente"
        >
          <IconX />
        </button>
      )}

      {aberto && !travado && (
        <div className={styles.painel}>
          <Input
            size="sm"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder={placeholder}
            iconLeft={<IconSearch />}
            autoComplete="off"
            autoFocus
          />
          {sugestoes.length === 0 ? (
            <p className={styles.semResultado}>Nenhum paciente encontrado.</p>
          ) : (
            <ul className={styles.lista} role="listbox">
              {sugestoes.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={styles.item}
                    onClick={() => escolher(p)}
                    role="option"
                    aria-selected={p.id === value}
                  >
                    <span className={styles.avatar}>
                      {p.photo ? <img src={p.photo} alt="" className={styles.avatarImg} /> : initials(p.name)}
                    </span>
                    <span className={styles.itemTexto}>
                      <span className={styles.itemNome}>{p.name}</span>
                      <span className={styles.itemMeta}>
                        {p.code}{p.phone ? ` · ${p.phone}` : ''}
                      </span>
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
