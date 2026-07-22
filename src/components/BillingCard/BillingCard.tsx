import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Spinner } from '@/components/Spinner/Spinner'
import { usePagamentos } from '@/hooks/usePagamentos'
import { usePacientes } from '@/hooks/usePacientes'
import { APP_ROUTES, buildRoute } from '@/constants'
import { formatarReais } from '@/utils/format'
import { IconRelogio, IconOlho } from '@/components/icons'
import styles from './BillingCard.module.scss'

/** dd/mm/aaaa → número ordenável (aaaammdd). */
function ordemDaData(data: string) {
  const [dia, mes, ano] = data.split('/').map(Number)
  return ano * 10000 + mes * 100 + dia
}

/**
 * Card do Dashboard com o que há para cobrar: pagamentos vencidos e pendentes,
 * do mais atrasado para o mais recente. O detalhe fica no perfil do paciente.
 */
export function BillingCard() {
  const navigate = useNavigate()
  const { data: pagamentos, isLoading } = usePagamentos()
  const { data: pacientes } = usePacientes()

  const nomePorId = new Map((pacientes ?? []).map(p => [p.id, p.nome]))

  // Em aberto = o que ainda entra no caixa (cancelado e pago ficam de fora).
  const emAberto = (pagamentos ?? []).filter(p => p.status === 'vencido' || p.status === 'pendente')
  const lista = [...emAberto].sort((a, b) => {
    // Vencidos primeiro; dentro de cada grupo, o mais antigo cobra primeiro.
    const atrasoA = Number(a.status === 'vencido')
    const atrasoB = Number(b.status === 'vencido')
    if (atrasoA !== atrasoB) return atrasoB - atrasoA
    return ordemDaData(a.data) - ordemDaData(b.data)
  })

  const total = lista.reduce((soma, p) => soma + p.valor, 0)
  const vencidos = lista.filter(p => p.status === 'vencido').length

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>Cobranças</h2>
        <div className={styles.headerDireita}>
          {vencidos > 0 && (
            <span className={styles.contagem}>{vencidos} vencida{vencidos > 1 ? 's' : ''}</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate(APP_ROUTES.FINANCEIRO)}>
            Ver todas
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className={styles.carregando}><Spinner /></div>
      ) : (
        <>
          <ul className={styles.lista}>
            {lista.length === 0 && (
              <li className={styles.vazio}>Nenhuma cobrança em aberto.</li>
            )}
            {lista.map(p => (
              <li key={p.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemPaciente}>{nomePorId.get(p.pacienteId) ?? 'Paciente'}</span>
                  <span className={styles.itemDescricao}>{p.descricao}</span>
                  <span className={styles.itemData}><IconRelogio /> {p.data}</span>
                </div>

                <span className={styles.itemDireita}>
                  <span className={styles.valor}>{formatarReais(p.valor)}</span>
                  <Badge status={p.status} />
                </span>

                <button
                  type="button"
                  className={styles.verBtn}
                  onClick={() => navigate(buildRoute.pacientePerfil(p.pacienteId))}
                  title="Abrir perfil do paciente"
                  aria-label={`Abrir perfil de ${nomePorId.get(p.pacienteId) ?? 'paciente'}`}
                >
                  <IconOlho />
                </button>
              </li>
            ))}
          </ul>

          {lista.length > 0 && (
            <footer className={styles.rodape}>
              <span className={styles.rodapeLabel}>Total em aberto</span>
              <strong className={styles.rodapeValor}>{formatarReais(total)}</strong>
            </footer>
          )}
        </>
      )}
    </section>
  )
}
