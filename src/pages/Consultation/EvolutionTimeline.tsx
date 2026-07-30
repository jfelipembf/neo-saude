import type { ConsultaAnterior } from '@/services/medicalRecordService'
import styles from './ConsultationPage.module.scss'
import { SafeHtml } from '@/components/SafeHtml/SafeHtml'

interface EvolutionTimelineProps {
  consultas: ConsultaAnterior[]
}

/**
 * O QUE FOI ESCRITO NAS CONSULTAS ANTERIORES, por inteiro.
 *
 * Fica embaixo do editor, e não só na coluna esquerda, porque as duas leituras
 * são diferentes: à esquerda o médico se ORIENTA (data e uma linha); aqui ele
 * LÊ o que registrou da última vez enquanto escreve o de hoje — que é o gesto
 * real da consulta de retorno.
 *
 * O HTML é sanitizado na exibição, não só na gravação: o texto pode ter sido
 * gravado por outra via (importação, IA, versão antiga do editor), e confiar
 * que "já veio limpo" é como se cria XChildren armazenado.
 */
export function EvolutionTimeline({ consultas }: EvolutionTimelineProps) {
  // Só as que TÊM texto: consulta sem evolução já aparece na coluna esquerda,
  // e aqui viraria um cartão vazio entre dois cheios.
  const comTexto = consultas.filter(c => c.evolucao.trim())

  if (comTexto.length === 0) {
    return <p className={styles.vazio}>Nenhuma evolução registrada em consultas anteriores.</p>
  }

  return (
    <ol className={styles.timeline}>
      {comTexto.map(c => (
        <li key={c.id} className={styles.marco}>
          <span className={styles.marcoData}>{c.data} · {c.servico}</span>
          {/* Saneamento agora vive no SafeHtml — um lugar só para todo HTML
              vindo do banco. */}
          <SafeHtml html={c.evolucao} className={styles.evolucaoAnterior} />
        </li>
      ))}
    </ol>
  )
}
