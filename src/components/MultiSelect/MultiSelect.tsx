import { useMemo, useState } from 'react'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { IconChevronDown, IconX, IconCheck, IconSearch } from '@/components/icons'
import { matchesSearch } from '@/utils/search'
import styles from './MultiSelect.module.scss'

/** A partir de quantas opções vale a pena ter busca dentro do menu. */
const MIN_PARA_BUSCA = 8

export interface MultiSelectOption {
  value: string
  label: string
  /** Linha secundária (ex.: o e-mail do fornecedor) — ajuda a distinguir homônimos. */
  meta?: string
}

interface MultiSelectProps {
  label?: string
  hint?: string
  options: MultiSelectOption[]
  /** Os valores escolhidos. Componente controlado: quem chama guarda o estado. */
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  /** Texto quando não há NENHUMA opção cadastrada (diferente de "nada encontrado"). */
  emptyMessage?: string
  disabled?: boolean
}

/**
 * Escolha de VÁRIOS itens num menu suspenso, com os escolhidos aparecendo como
 * etiquetas no próprio campo.
 *
 * Substitui o padrão de "lista inteira de checkboxes aberta na página": com
 * cinco opções aquilo até funciona, mas o campo cresce sem limite conforme o
 * cadastro cresce, e quem já escolheu precisa varrer a lista toda para lembrar
 * o que marcou. Aqui o que está escolhido fica sempre visível e o resto fica
 * guardado.
 *
 * O menu NÃO fecha ao escolher — a graça é marcar vários seguidos. Fecha no
 * clique fora, no Esc (via useOutsideClick) ou no botão.
 */
export function MultiSelect({
  label, hint, options, value, onChange,
  placeholder = 'Selecione…', emptyMessage = 'Nada cadastrado ainda.', disabled = false,
}: MultiSelectProps) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const ref = useOutsideClick<HTMLDivElement>(() => setAberto(false), aberto)

  const escolhidos = useMemo(
    // Percorre `options` (e não `value`) para a ordem das etiquetas ser a do
    // cadastro, estável — pela ordem de clique elas dançariam a cada marcação.
    () => options.filter(o => value.includes(o.value)),
    [options, value],
  )

  const comBusca = options.length >= MIN_PARA_BUSCA
  const visiveis = useMemo(() => {
    if (!comBusca || !busca.trim()) return options
    return options.filter(o => matchesSearch(o.label, busca) || (o.meta ? matchesSearch(o.meta, busca) : false))
  }, [options, busca, comBusca])

  function alternar(v: string) {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }

  return (
    <div className={styles.campo}>
      {label && <span className={styles.rotulo}>{label}</span>}

      <div className={styles.involucro} ref={ref}>
        <button
          type="button"
          className={styles.gatilho}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={aberto}
          onClick={() => setAberto(a => !a)}
        >
          {escolhidos.length === 0 ? (
            <span className={styles.placeholder}>{placeholder}</span>
          ) : (
            <span className={styles.etiquetas}>
              {escolhidos.map(o => (
                <span key={o.value} className={styles.etiqueta}>
                  {o.label}
                  {/* <span> e não <button>: já estamos DENTRO do botão que abre o
                      menu, e botão aninhado é HTML inválido. O clique para de
                      subir, então remover não abre o menu junto. */}
                  <span
                    className={styles.remover}
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remover ${o.label}`}
                    onClick={e => { e.stopPropagation(); alternar(o.value) }}
                  >
                    <IconX />
                  </span>
                </span>
              ))}
            </span>
          )}
          <span className={styles.chevron} aria-hidden="true"><IconChevronDown /></span>
        </button>

        {aberto && !disabled && (
          <div className={styles.menu}>
            {comBusca && (
              <div className={styles.buscaLinha}>
                <IconSearch />
                <input
                  className={styles.buscaInput}
                  placeholder="Buscar…"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {options.length === 0 ? (
              <p className={styles.vazio}>{emptyMessage}</p>
            ) : visiveis.length === 0 ? (
              <p className={styles.vazio}>Nada encontrado.</p>
            ) : (
              <ul className={styles.lista} role="listbox" aria-multiselectable="true">
                {visiveis.map(o => {
                  const marcado = value.includes(o.value)
                  return (
                    <li key={o.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={marcado}
                        className={`${styles.opcao} ${marcado ? styles.opcaoMarcada : ''}`}
                        onClick={() => alternar(o.value)}
                      >
                        <span className={styles.marca} aria-hidden="true">
                          {marcado && <IconCheck />}
                        </span>
                        <span className={styles.textos}>
                          <span className={styles.nome}>{o.label}</span>
                          {o.meta && <span className={styles.meta}>{o.meta}</span>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {hint && <span className={styles.dica}>{hint}</span>}
    </div>
  )
}
