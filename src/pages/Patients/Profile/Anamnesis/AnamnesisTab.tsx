import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { IconEdit, IconPrint, IconDocument } from '@/components/icons'
import { usePatientAnamnesis } from '@/hooks/useAnamnesis'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { esc } from '@/utils/printDocument'
import type { Anamnesis } from '@/types/domain'
import { AnamnesisForm } from './AnamnesisForm'
import { ANAMNESIS_SECTIONS, answerLabel, isAlert } from './questions'
import styles from './Anamnesis.module.scss'

/** Miolo impresso da ficha — mesma ordem das perguntas da tela. */
function anamnesisBody(record: Anamnesis, patientName?: string) {
  const sections = ANAMNESIS_SECTIONS.map(section => {
    const rows = section.questions.map(p => {
      const value = record[p.field]
      const answer = p.type === 'options' ? answerLabel(p, value) : (value || '—')
      const detail = p.detail ? record[p.detail.field] : undefined
      return `<tr><td>${esc(p.question)}</td><td><strong>${esc(answer)}</strong>${
        detail ? `<br><small>${esc(p.detail!.label)}: ${esc(detail)}</small>` : ''
      }</td></tr>`
    }).join('')
    return `<h2 class="secao">${esc(section.title)}</h2><table>${rows}</table>`
  }).join('')

  return `
    ${patientName ? `<p><strong>Paciente:</strong> ${esc(patientName)}</p>` : ''}
    <p><strong>Atualizada em:</strong> ${esc(record.updatedAt)}</p>
    ${sections}
    <p class="clausula">Declaro para os devidos fins que as informações acima prestadas são verdadeiras.</p>
    <div class="assinaturas"><span>Paciente ou responsável legal</span><span>Cirurgião-dentista</span></div>`
}

const ANAMNESIS_STYLES = `
  .secao { font-size: 13px; margin: 18px 0 4px; text-transform: uppercase;
           letter-spacing: 0.05em; color: #334; }
  td:first-child { width: 58%; }
`

interface AnamnesisTabProps {
  patientId: string
  patientName?: string
}

/** Aba "Anamnese": questionário de saúde do paciente (modelo do CRO). */
export function AnamnesisTab({ patientId, patientName }: AnamnesisTabProps) {
  const { data: record, isLoading } = usePatientAnamnesis(patientId)
  const printDocument = usePrintDocument()
  const [editing, setEditing] = useState(false)

  if (isLoading) return <PageLoader />

  if (editing) {
    return (
      <AnamnesisForm
        patientId={patientId}
        record={record ?? null}
        onClose={() => setEditing(false)}
      />
    )
  }

  if (!record) {
    return (
      <EmptyState
        icon={<IconDocument />}
        title="Anamnese ainda não preenchida"
        description="Registre o questionário de saúde antes do primeiro atendimento — alergias, medicamentos e condições que mudam a conduta clínica."
        action={
          <Button iconLeft={<IconEdit />} onClick={() => setEditing(true)}>
            Preencher anamnese
          </Button>
        }
      />
    )
  }

  return (
    <section className={styles.card} aria-label="Anamnese do paciente">
      <div className={styles.head}>
        <div>
          <h2 className={styles.titulo}>Anamnese</h2>
          <span className={styles.atualizada}>Atualizada em {record.updatedAt}</span>
        </div>
        <div className={styles.acoes}>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconPrint />}
            onClick={() => printDocument({
              title: 'Ficha de anamnese',
              subtitle: patientName,
              body: anamnesisBody(record, patientName),
              styles: ANAMNESIS_STYLES,
            })}
          >
            Imprimir
          </Button>
          <Button variant="outline" size="sm" iconLeft={<IconEdit />} onClick={() => setEditing(true)}>
            Editar
          </Button>
        </div>
      </div>

      {ANAMNESIS_SECTIONS.map(section => (
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
    </section>
  )
}
