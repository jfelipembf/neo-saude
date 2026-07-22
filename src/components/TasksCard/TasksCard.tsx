import { useState } from 'react'
import type { FormEvent } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { useToast } from '@/components/Toast/useToast'
import { IconCheck, IconPlus, IconClock, IconTrash } from '@/components/icons'
import { useTasks, useSetTaskStatus, useCreateTask, useRemoveTask } from '@/hooks/useTasks'
import { PRIORITY_OPTIONS } from '@/constants'
import type { TaskPriority, Task } from '@/types/domain'
import styles from './TasksCard.module.scss'

/** Card compacto de tarefas (coluna estreita do Dashboard, sob a agenda). */
export function TasksCard() {
  const toast = useToast()
  const { data: tasks, isLoading } = useTasks()
  const { mutate: setStatus } = useSetTaskStatus()
  const { mutate: createTask, isPending: creating } = useCreateTask()
  const { mutate: removeTask } = useRemoveTask()

  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDateIso, setDueDateIso] = useState('')
  const [titleError, setTitleError] = useState('')

  const list = tasks ?? []
  // Pendentes primeiro (na ordem original); concluídas afundam para o fim.
  const sorted = [...list].sort(
    (a, b) => Number(a.status === 'done') - Number(b.status === 'done'),
  )
  const doneCount = list.filter(t => t.status === 'done').length

  // Check alterna concluída ↔ a fazer (mesma lógica dos círculos de presença).
  function toggleTask(t: Task) {
    setStatus({ id: t.id, status: t.status === 'done' ? 'todo' : 'done' })
  }

  function closeModal() {
    setModalOpen(false)
    setTitle('')
    setPriority('medium')
    setDueDateIso('')
    setTitleError('')
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('Dê um título para a tarefa.')
      return
    }
    createTask(
      {
        title: title.trim(),
        priority,
        // input date entrega 'aaaa-mm-dd'; o domínio guarda 'dd/mm'.
        dueDate: dueDateIso ? `${dueDateIso.slice(8, 10)}/${dueDateIso.slice(5, 7)}` : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Tarefa criada!')
          closeModal()
        },
      },
    )
  }

  return (
    <section className={styles.card} aria-label="Tarefas">
      <header className={styles.header}>
        <h2 className={styles.title}>Tarefas</h2>
        <span className={styles.headerAcoes}>
          <span className={styles.contador}>{doneCount} de {list.length}</span>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconPlus />}
            onClick={() => setModalOpen(true)}
            title="Nova tarefa"
            aria-label="Criar nova tarefa"
          />
        </span>
      </header>

      {isLoading ? (
        <div className={styles.loading}><Spinner /></div>
      ) : (
        <ul className={styles.list}>
          {sorted.length === 0 && (
            <li className={styles.emptyItem}>Nenhuma tarefa por aqui.</li>
          )}
          {sorted.map(t => (
            <li key={t.id} className={styles.item}>
              <button
                type="button"
                className={`${styles.checkBtn} ${t.status === 'done' ? styles['checkBtn--active'] : ''}`}
                onClick={() => toggleTask(t)}
                title={t.status === 'done' ? 'Reabrir tarefa' : 'Concluir tarefa'}
                aria-label={`${t.status === 'done' ? 'Reabrir' : 'Concluir'}: ${t.title}`}
              >
                <IconCheck />
              </button>

              <div className={styles.info}>
                <span className={`${styles.titulo} ${t.status === 'done' ? styles['titulo--feita'] : ''}`}>
                  {t.title}
                </span>
                <span className={styles.meta}>
                  <Badge status={t.priority} className={styles.badge} />
                  {t.dueDate && <span className={styles.prazo}><IconClock /> {t.dueDate}</span>}
                </span>
              </div>

              <button
                type="button"
                className={styles.removerBtn}
                onClick={() => removeTask(t.id)}
                title="Excluir tarefa"
                aria-label={`Excluir: ${t.title}`}
              >
                <IconTrash />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Nova tarefa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" form="form-nova-tarefa" loading={creating}>
              Criar tarefa
            </Button>
          </>
        }
      >
        <form id="form-nova-tarefa" className={styles.form} onSubmit={handleCreate}>
          <Input
            label="Título"
            placeholder="Ex.: Confirmar consultas de amanhã"
            value={title}
            onChange={e => { setTitle(e.target.value); setTitleError('') }}
            error={titleError}
            autoFocus
          />
          <Select
            label="Prioridade"
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={e => setPriority(e.target.value as TaskPriority)}
          />
          <Input
            label="Prazo"
            type="date"
            value={dueDateIso}
            onChange={e => setDueDateIso(e.target.value)}
            hint="Opcional"
          />
        </form>
      </Modal>
    </section>
  )
}
