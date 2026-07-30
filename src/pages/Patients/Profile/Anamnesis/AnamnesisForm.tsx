import { useImperativeHandle, useState } from 'react'
import type { FormEvent, Ref } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/Toast'
import { useSession } from '@/context/SessionProvider'
import { useSaveAnamnesis } from '@/hooks/useAnamnesis'
import type { EditAnamnesis } from '@/services/anamnesisService'
import type { Anamnesis, ClinicSpecialty } from '@/types/domain'
import { sectionsForSpecialty } from './questions'
import styles from './Anamnesis.module.scss'

/** Ficha em branco do NÚCLEO: as respostas fechadas começam na opção mais comum. */
const CORE_EMPTY: EditAnamnesis = {
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
}

/** Some às respostas do núcleo o padrão da seção específica do ramo. */
function emptyFormFor(specialty: ClinicSpecialty | undefined): EditAnamnesis {
  if (specialty === 'dentistry') {
    return {
      ...CORE_EMPTY,
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
  }
  if (specialty === 'medicine') {
    return { ...CORE_EMPTY, smokes: 'no', physicalActivity: 'no' }
  }
  if (specialty === 'physiotherapy') {
    return {
      ...CORE_EMPTY,
      priorTreatment: 'no',
      physicalActivity: 'no',
      affectedSide: 'not_applicable',
      dailyImpact: 'no',
      redFlags: 'no',
    }
  }
  return { ...CORE_EMPTY }
}

/** Tira a chave e a data (carimbada no service) — o resto é o rascunho editável. */
function draftFromRecord(record: Anamnesis | null, specialty: ClinicSpecialty | undefined): EditAnamnesis {
  if (!record) return emptyFormFor(specialty)
  const draft: Record<string, unknown> = { ...record }
  delete draft.patientId
  delete draft.updatedAt
  return draft as EditAnamnesis
}

/** O que a tela de fora pode pedir ao formulário. */
export interface AnamnesisFormHandle {
  salvar: () => Promise<void>
}

interface AnamnesisFormProps {
  patientId: string
  record: Anamnesis | null
  /** Ausente = o formulário não tem para onde voltar (é a própria tela), e o
   *  botão Cancelar some junto. */
  onClose?: () => void
  /**
   * Esconde o rodapé de ações. Quem grava passa a ser a tela de fora, pelo
   * `ref` — é o caso da etapa de um roteiro, onde já existe um "Salvar" do
   * próprio roteiro e dois botões de salvar na mesma tela é a receita para
   * gravar metade e achar que gravou tudo.
   */
  semAcoes?: boolean
  ref?: Ref<AnamnesisFormHandle>
  /**
   * Modo COLUNA ESTREITA — o painel da tela de atendimento.
   *
   * Tira o cartão e o título: lá o painel já tem moldura e cabeçalho próprios,
   * e o formulário chegava como um cartão dentro de outro, com "Editar
   * anamnese" logo abaixo de "Anamnese". As perguntas e o salvamento são
   * exatamente os mesmos — é a MESMA ficha, vista de outro lugar.
   */
  compact?: boolean
}

/** Formulário da anamnese — as perguntas vêm de `questions.ts`, então incluir
 *  uma pergunta nova não exige mexer aqui. */
export function AnamnesisForm({
  patientId, record, onClose, compact = false, semAcoes = false, ref,
}: AnamnesisFormProps) {
  const toast = useToast()
  const { specialty } = useSession()
  const { mutate: save, mutateAsync: saveAsync, isPending: saving } = useSaveAnamnesis(patientId)
  const sections = sectionsForSpecialty(specialty)

  const [form, setForm] = useState<EditAnamnesis>(() => draftFromRecord(record, specialty))

  function set(field: keyof EditAnamnesis, value: string) {
    setForm(current => ({ ...current, [field]: value }))
  }

  // A gravação exposta para fora. `mutateAsync` e não `mutate`: quem chama
  // precisa ESPERAR o resultado para saber se pode seguir — com `mutate` o
  // roteiro avançaria antes de o servidor responder.
  useImperativeHandle(ref, () => ({
    salvar: async () => {
      await saveAsync(form)
      toast.success('Anamnese salva!')
    },
  }), [form, saveAsync, toast])

  function handleSave(e: FormEvent) {
    e.preventDefault()
    save(form, {
      onSuccess: () => {
        toast.success('Anamnese salva!')
        onClose?.()
      },
    })
  }

  return (
    <section className={compact ? styles.compacto : styles.card} aria-label="Editar anamnese">
      {!compact && (
        <div className={styles.head}>
          <h2 className={styles.titulo}>{record ? 'Editar anamnese' : 'Preencher anamnese'}</h2>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSave}>
        {sections.map(section => (
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
                      {/* `wrap`: as opções daqui têm rótulo longo ("Controlada
                          com medicamento", "Durante a higiene") e a ficha é
                          usada tanto na coluna estreita do atendimento quanto
                          no celular. Sem quebrar, a última opção saía do
                          contêiner — e opção que transborda não se marca. */}
                      <SegmentedControl
                        options={q.options!}
                        value={String(value)}
                        onChange={v => set(q.field, v)}
                        wrap
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

        {!semAcoes && (
          <div className={styles.formAcoes}>
            {onClose && (
              <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            )}
            <Button type="submit" loading={saving}>Salvar anamnese</Button>
          </div>
        )}
      </form>
    </section>
  )
}
