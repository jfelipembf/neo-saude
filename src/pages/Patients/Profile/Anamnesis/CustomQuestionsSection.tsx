import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Input } from '@/components/Input/Input'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { IconPlus, IconEdit, IconTrash, IconCheck } from '@/components/icons'
import {
  usePatientCustomQuestions, useAddPatientCustomQuestion,
  useUpdatePatientCustomQuestion, useDeletePatientCustomQuestion,
} from '@/hooks/usePatientCustomQuestions'
import type { PatientCustomQuestion } from '@/types/domain'
import styles from './Anamnesis.module.scss'

interface Props {
  patientId: string
}

type Mode = { kind: 'new' } | { kind: 'edit'; id: string } | null

/** Perguntas que o profissional cria para ESTE paciente — permanentes, à parte
 *  do questionário padrão da clínica (não fazem parte da ficha versionada). */
export function CustomQuestionsSection({ patientId }: Props) {
  const toast = useToast()
  const { data: questions } = usePatientCustomQuestions(patientId)
  const { mutate: add, isPending: adding } = useAddPatientCustomQuestion(patientId)
  const { mutate: update, isPending: saving } = useUpdatePatientCustomQuestion(patientId)
  const { mutate: remove } = useDeletePatientCustomQuestion(patientId)

  const [mode, setMode] = useState<Mode>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [toDelete, setToDelete] = useState<PatientCustomQuestion | null>(null)

  const list = questions ?? []

  function openNew() { setMode({ kind: 'new' }); setQuestion(''); setAnswer('') }
  function openEdit(q: PatientCustomQuestion) { setMode({ kind: 'edit', id: q.id }); setQuestion(q.questionText); setAnswer(q.answerText ?? '') }
  function closeForm() { setMode(null); setQuestion(''); setAnswer('') }

  function handleSave() {
    if (!question.trim()) return
    const options = { onSuccess: () => { toast.success('Pergunta salva!'); closeForm() } }
    if (mode?.kind === 'edit') update({ id: mode.id, question: question.trim(), answer: answer.trim() || undefined }, options)
    else add({ question: question.trim(), answer: answer.trim() || undefined }, options)
  }

  return (
    <section className={styles.secao} aria-label="Perguntas personalizadas">
      <div className={styles.secaoCabecalho}>
        <h3 className={styles.secaoTitulo}>Personalizado</h3>
        {!mode && (
          <Button size="sm" variant="ghost" iconLeft={<IconPlus />} onClick={openNew}>
            Adicionar pergunta
          </Button>
        )}
      </div>
      <p className={styles.secaoDica}>
        Perguntas próprias deste paciente — não fazem parte do questionário padrão da clínica.
      </p>

      {list.length === 0 && !mode && (
        <p className={styles.customVazio}>Nenhuma pergunta personalizada ainda.</p>
      )}

      <ul className={styles.customLista}>
        {list.map(q => (
          mode?.kind === 'edit' && mode.id === q.id ? (
            <li key={q.id} className={styles.customForm}>
              <Input label="Pergunta" value={question} onChange={e => setQuestion(e.target.value)} autoFocus />
              <Textarea label="Resposta" rows={2} value={answer} onChange={e => setAnswer(e.target.value)} />
              <div className={styles.customFormAcoes}>
                <Button variant="ghost" size="sm" onClick={closeForm} disabled={saving}>Cancelar</Button>
                <Button size="sm" iconLeft={<IconCheck />} loading={saving} onClick={handleSave}>Salvar</Button>
              </div>
            </li>
          ) : (
            <li key={q.id} className={styles.customItem}>
              <div className={styles.customItemTexto}>
                <span className={styles.customPergunta}>{q.questionText}</span>
                <span className={styles.customResposta}>{q.answerText || '—'}</span>
              </div>
              <div className={styles.customItemAcoes}>
                <button
                  type="button" className={styles.customIconBtn}
                  title="Editar" aria-label={`Editar pergunta: ${q.questionText}`}
                  onClick={() => openEdit(q)}
                >
                  <IconEdit />
                </button>
                <button
                  type="button" className={styles.customIconBtn}
                  title="Excluir" aria-label={`Excluir pergunta: ${q.questionText}`}
                  onClick={() => setToDelete(q)}
                >
                  <IconTrash />
                </button>
              </div>
            </li>
          )
        ))}

        {mode?.kind === 'new' && (
          <li className={styles.customForm}>
            <Input
              label="Pergunta"
              placeholder="Ex: Prefere sessão pela manhã ou à tarde?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              autoFocus
            />
            <Textarea
              label="Resposta"
              rows={2}
              placeholder="Pode deixar em branco e preencher depois"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />
            <div className={styles.customFormAcoes}>
              <Button variant="ghost" size="sm" onClick={closeForm} disabled={adding}>Cancelar</Button>
              <Button size="sm" iconLeft={<IconCheck />} loading={adding} onClick={handleSave}>Salvar</Button>
            </div>
          </li>
        )}
      </ul>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove(toDelete.id, { onSuccess: () => { toast.success('Pergunta excluída.'); setToDelete(null) } })
        }}
        title="Excluir pergunta personalizada"
        message={toDelete ? `Deseja excluir "${toDelete.questionText}"?` : ''}
        variant="danger"
      />
    </section>
  )
}
