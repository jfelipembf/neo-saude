import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { IconEdit, IconPrint, IconDocument } from '@/components/icons'
import { useSession } from '@/context/SessionProvider'
import { usePatientAnamnesis } from '@/hooks/useAnamnesis'
import { usePatientCustomQuestions } from '@/hooks/usePatientCustomQuestions'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { esc } from '@/utils/printDocument'
import type { Anamnesis, ClinicSpecialty, PatientCustomQuestion } from '@/types/domain'
import { AnamnesisForm } from './AnamnesisForm'
import { CustomQuestionsSection } from './CustomQuestionsSection'
import { sectionsForSpecialty, answerLabel, isAlert } from './questions'
import type { AnamnesisSection } from './questions'
import styles from './Anamnesis.module.scss'

/** Quem assina a ficha, no rodapé impresso — varia por ramo. */
const SIGNATURE_LABEL: Partial<Record<ClinicSpecialty, string>> = {
  dentistry: 'Cirurgião-dentista',
  physiotherapy: 'Fisioterapeuta',
}

/** Miolo impresso da ficha — mesma ordem das perguntas da tela. As perguntas
 *  personalizadas do paciente entram como uma seção a mais, no fim. */
function anamnesisBody(
  record: Anamnesis, sections: AnamnesisSection[], specialty: ClinicSpecialty | undefined,
  customQuestions: PatientCustomQuestion[], patientName?: string,
) {
  const body = sections.map(section => {
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

  const customBlock = customQuestions.length === 0 ? '' : (() => {
    const rows = customQuestions.map(q =>
      `<tr><td>${esc(q.questionText)}</td><td><strong>${esc(q.answerText || '—')}</strong></td></tr>`,
    ).join('')
    return `<h2 class="secao">Personalizado</h2><table>${rows}</table>`
  })()

  const signature = specialty ? (SIGNATURE_LABEL[specialty] ?? 'Profissional responsável') : 'Profissional responsável'

  return `
    ${patientName ? `<p><strong>Paciente:</strong> ${esc(patientName)}</p>` : ''}
    <p><strong>Atualizada em:</strong> ${esc(record.updatedAt)}</p>
    ${body}
    ${customBlock}
    <p class="clausula">Declaro para os devidos fins que as informações acima prestadas são verdadeiras.</p>
    <div class="assinaturas"><span>Paciente ou responsável legal</span><span>${esc(signature)}</span></div>`
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

/** Aba "Anamnese": questionário de saúde do paciente — as perguntas mudam com
 *  o ramo da clínica (odontologia, fisioterapia...). */
export function AnamnesisTab({ patientId, patientName }: AnamnesisTabProps) {
  const { data: record, isLoading } = usePatientAnamnesis(patientId)
  const { data: customQuestions } = usePatientCustomQuestions(patientId)
  const printDocument = usePrintDocument()
  const [editing, setEditing] = useState(false)
  const { specialty } = useSession()
  const sections = sectionsForSpecialty(specialty)

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

  return (
    <div className={styles.wrap}>
      {!record ? (
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
      ) : (
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
                  body: anamnesisBody(record, sections, specialty, customQuestions ?? [], patientName),
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
        </section>
      )}

      {/* Perguntas personalizadas: permanentes ao paciente, à parte da ficha
          versionada — por isso ficam visíveis mesmo sem a anamnese padrão preenchida. */}
      <section className={styles.card} aria-label="Perguntas personalizadas do paciente">
        <CustomQuestionsSection patientId={patientId} />
      </section>
    </div>
  )
}
