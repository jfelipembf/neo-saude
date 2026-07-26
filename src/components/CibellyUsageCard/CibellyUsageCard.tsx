import { useCibellyUsage } from '@/hooks/useCibellyUsage'
import { usePatientName } from '@/hooks/useDisplayNames'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { IconMic } from '@/components/icons'
import styles from './CibellyUsageCard.module.scss'

/**
 * ⚠️ TEMPORÁRIO — comparação de custo real OpenAI × Gemini, pedida para ficar
 * um tempo no Dashboard e depois SAIR. Para remover:
 *  1. tirar o import e o bloco deste componente de DashboardPage.tsx;
 *  2. apagar esta pasta, src/hooks/useCibellyUsage.ts,
 *     src/services/cibellyUsageService.ts, src/lib/cibelly/pricing.ts (+ .test);
 *  3. reverter a migration cibelly_usage_temp (DROP TABLE cibelly_usage) e o
 *     bloco marcado "MEDIÇÃO TEMPORÁRIA" em useCibelly.ts e geminiLive.ts.
 *
 * O custo mostrado é em DÓLAR — a moeda real da fatura dos dois provedores.
 * Converter para R$ aqui somaria uma segunda aproximação (câmbio) em cima de
 * uma já existente (a própria tabela de preço); dólar é o número exato.
 */
export function CibellyUsageCard() {
  const { data: sessoes, isLoading } = useCibellyUsage()
  const patientName = usePatientName()

  if (isLoading) return null
  if (!sessoes || sessoes.length === 0) {
    return (
      <section className={styles.card}>
        <h2 className={styles.titulo}>
          <IconMic /> Custo da Cibelly (temporário)
        </h2>
        <EmptyState title="Nenhuma sessão de voz registrada ainda." />
      </section>
    )
  }

  const totalUsd = sessoes.reduce((soma, s) => soma + s.costUsd, 0)

  return (
    <section className={styles.card}>
      <h2 className={styles.titulo}>
        <IconMic /> Custo da Cibelly (temporário)
      </h2>
      <p className={styles.aviso}>
        Comparação OpenAI × Gemini, calculada a partir do consumo real de tokens de cada sessão. Card removido assim que a comparação terminar.
      </p>

      <div className={styles.resumo}>
        Últimas {sessoes.length} sessões: <strong>${totalUsd.toFixed(4)}</strong>
      </div>

      <ul className={styles.lista}>
        {sessoes.map(s => (
          <li key={s.id} className={styles.item}>
            <div className={styles.linha1}>
              <span className={`${styles.provedor} ${s.provider === 'openai' ? styles.openai : styles.gemini}`}>
                {s.provider === 'openai' ? 'OpenAI' : 'Gemini'}
              </span>
              <span className={styles.modelo}>{s.model}</span>
              <span className={styles.custo}>${s.costUsd.toFixed(4)}</span>
            </div>
            <div className={styles.linha2}>
              <span className={styles.paciente}>{s.patientId ? patientName(s.patientId) : '—'}</span>
              <span className={styles.detalhe}>
                {new Date(s.startedAt).toLocaleString('pt-BR', {
                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                })} · {s.totalTokens.toLocaleString('pt-BR')} tokens
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
