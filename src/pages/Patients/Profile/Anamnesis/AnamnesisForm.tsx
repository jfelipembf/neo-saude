import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { useSaveAnamnesis } from '@/hooks/useAnamnesis'
import type { EditAnamnesis } from '@/services/anamnesisService'
import type { Anamnesis } from '@/types/domain'
import { ANAMNESIS_SECTIONS } from './questions'
import styles from './Anamnesis.module.scss'

/** Ficha em branco: as respostas fechadas começam na opção mais comum. */
const EMPTY_FORM: EditAnamnesis = {
  medications: 'no',
  allergy: 'no',
  bloodPressure: 'normal',
  heartCondition: 'no',
  shortnessOfBreath: 'no',
  diabetes: 'no',
  bleeding: 'normal',
  healing: 'normal',
  surgery: 'no',
  pregnant: 'no',
  anesthesiaReaction: 'no',
  toothGumPain: 'no',
  gumBleeding: 'no',
  badTasteDryMouth: 'no',
  flossing: 'daily',
  jawPainClicking: 'no',
  grindsTeeth: 'no',
  faceSores: 'no',
  smokes: 'no',
}

/** Tira a chave e a data (carimbada no service) — o resto é o rascunho editável. */
function draftFromRecord(record: Anamnesis | null): EditAnamnesis {
  if (!record) return { ...EMPTY_FORM }
  const draft: Record<string, unknown> = { ...record }
  delete draft.patientId
  delete draft.updatedAt
  return draft as EditAnamnesis
}

interface AnamnesisFormProps {
  patientId: string
  record: Anamnesis | null
  onClose: () => void
}

/** Formulário da anamnese — as perguntas vêm de `questions.ts`, então incluir
 *  uma pergunta nova não exige mexer aqui. */
export function AnamnesisForm({ patientId, record, onClose }: AnamnesisFormProps) {
  const toast = useToast()
  const { mutate: save, isPending: saving } = useSaveAnamnesis(patientId)

  const [form, setForm] = useState<EditAnamnesis>(() => draftFromRecord(record))

  function set(field: keyof EditAnamnesis, value: string) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    save(form, {
      onSuccess: () => {
        toast.success('Anamnese salva!')
        onClose()
      },
    })
  }

  return (
    <section className={styles.card} aria-label="Editar anamnese">
      <div className={styles.head}>
        <h2 className={styles.titulo}>{record ? 'Editar anamnese' : 'Preencher anamnese'}</h2>
      </div>

      <form className={styles.form} onSubmit={handleSave}>
        {ANAMNESIS_SECTIONS.map(section => (
          <section key={section.title} className={styles.secao}>
            <h3 className={styles.secaoTitulo}>{section.title}</h3>
            {section.description && <p className={styles.secaoDica}>{section.description}</p>}

            {section.questions.map(q => {
              const value = form[q.field] ?? ''
              const showDetail = q.detail && q.detail.when.includes(String(value))

              return (
                <div key={q.field} className={styles.campo}>
                  {q.type === 'options' ? (
                    <>
                      <span className={styles.pergunta}>{q.question}</span>
                      <SegmentedControl
                        options={q.options!}
                        value={String(value)}
                        onChange={v => set(q.field, v)}
                      />
                    </>
                  ) : q.type === 'longText' ? (
                    <Textarea
                      label={q.question}
                      rows={2}
                      value={String(value)}
                      onChange={e => set(q.field, e.target.value)}
                    />
                  ) : (
                    <Input
                      label={q.question}
                      value={String(value)}
                      onChange={e => set(q.field, e.target.value)}
                    />
                  )}

                  {/* Detalhe só aparece quando a resposta pede (ex.: "Qual?"). */}
                  {showDetail && (
                    <div className={styles.detalheCampo}>
                      <Input
                        label={q.detail!.label}
                        value={String(form[q.detail!.field] ?? '')}
                        onChange={e => set(q.detail!.field, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        ))}

        <div className={styles.formAcoes}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" loading={saving}>Salvar anamnese</Button>
        </div>
      </form>
    </section>
  )
}
