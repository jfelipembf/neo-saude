import type { Anamnesis } from '@/types/domain'
import { answerLabel, isAlert } from './questions'
import type { AnamnesisSection } from './questions'
import styles from './Anamnesis.module.scss'

interface AnamnesisAnswersProps {
  record: Anamnesis
  sections: AnamnesisSection[]
}

/**
 * A FICHA LIDA — pergunta à esquerda, resposta à direita.
 *
 * Componente próprio porque duas telas mostram a mesma ficha: a aba do perfil
 * e o painel do atendimento. Escrita duas vezes, uma delas ia parar de destacar
 * alergia ou gestação depois de qualquer mudança — e o destaque é justamente o
 * que faz a ficha valer alguma coisa no meio da consulta.
 */
export function AnamnesisAnswers({ record, sections }: AnamnesisAnswersProps) {
  return (
    <>
      {sections.map(section => (
        <section key={section.title} className={styles.secao}>
          <h3 className={styles.secaoTitulo}>{section.title}</h3>

          <dl className={styles.respostas}>
            {section.questions.map(p => {
              const value = record[p.field]
              const detail = p.detail ? record[p.detail.field] : undefined
              const alert = p.type === 'options' && isAlert(p.field, value)
              const open = p.type !== 'options'

              return (
                <div key={p.field} className={`${styles.resposta} ${open ? styles['resposta--aberta'] : ''}`}>
                  <dt>{p.question}</dt>
                  <dd className={alert ? styles.alerta : undefined}>
                    {p.type === 'options' ? answerLabel(p, value) : (value || '—')}
                    {detail && <span className={styles.detalhe}>{p.detail!.label}: {detail}</span>}
                  </dd>
                </div>
              )
            })}
          </dl>
        </section>
      ))}
    </>
  )
}
