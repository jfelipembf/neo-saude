import { useState } from 'react'
import type { FormEvent } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { useToast } from '@/components/Toast/useToast'
import { IconCheck, IconMais, IconRelogio } from '@/components/icons'
import { useTarefas, useSetStatusTarefa, useCriarTarefa } from '@/hooks/useTarefas'
import type { PrioridadeTarefa, Tarefa } from '@/types/domain'
import styles from './TasksCard.module.scss'

const OPCOES_PRIORIDADE = [
  { value: 'alta',  label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
]

/** Card compacto de tarefas (coluna estreita do Dashboard, sob a agenda). */
export function TasksCard() {
  const toast = useToast()
  const { data: tarefas, isLoading } = useTarefas()
  const { mutate: setStatus } = useSetStatusTarefa()
  const { mutate: criar, isPending: criando } = useCriarTarefa()

  const [modalAberto, setModalAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>('media')
  const [prazoIso, setPrazoIso] = useState('')
  const [erroTitulo, setErroTitulo] = useState('')

  const lista = tarefas ?? []
  // Pendentes primeiro (na ordem original); concluídas afundam para o fim.
  const ordenadas = [...lista].sort(
    (a, b) => Number(a.status === 'concluida') - Number(b.status === 'concluida'),
  )
  const feitas = lista.filter(t => t.status === 'concluida').length

  // Check alterna concluída ↔ a fazer (mesma lógica dos círculos de presença).
  function alternar(t: Tarefa) {
    setStatus({ id: t.id, status: t.status === 'concluida' ? 'a_fazer' : 'concluida' })
  }

  function fecharModal() {
    setModalAberto(false)
    setTitulo('')
    setPrioridade('media')
    setPrazoIso('')
    setErroTitulo('')
  }

  function aoCriar(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) {
      setErroTitulo('Dê um título para a tarefa.')
      return
    }
    criar(
      {
        titulo: titulo.trim(),
        prioridade,
        // input date entrega 'aaaa-mm-dd'; o domínio guarda 'dd/mm'.
        prazo: prazoIso ? `${prazoIso.slice(8, 10)}/${prazoIso.slice(5, 7)}` : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Tarefa criada!')
          fecharModal()
        },
      },
    )
  }

  return (
    <section className={styles.card} aria-label="Tarefas">
      <header className={styles.header}>
        <h2 className={styles.title}>Tarefas</h2>
        <span className={styles.headerAcoes}>
          <span className={styles.contador}>{feitas} de {lista.length}</span>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconMais />}
            onClick={() => setModalAberto(true)}
            title="Nova tarefa"
            aria-label="Criar nova tarefa"
          />
        </span>
      </header>

      {isLoading ? (
        <div className={styles.loading}><Spinner /></div>
      ) : (
        <ul className={styles.list}>
          {ordenadas.length === 0 && (
            <li className={styles.emptyItem}>Nenhuma tarefa por aqui.</li>
          )}
          {ordenadas.map(t => (
            <li key={t.id} className={styles.item}>
              <button
                type="button"
                className={`${styles.checkBtn} ${t.status === 'concluida' ? styles['checkBtn--active'] : ''}`}
                onClick={() => alternar(t)}
                title={t.status === 'concluida' ? 'Reabrir tarefa' : 'Concluir tarefa'}
                aria-label={`${t.status === 'concluida' ? 'Reabrir' : 'Concluir'}: ${t.titulo}`}
              >
                <IconCheck />
              </button>

              <div className={styles.info}>
                <span className={`${styles.titulo} ${t.status === 'concluida' ? styles['titulo--feita'] : ''}`}>
                  {t.titulo}
                </span>
                <span className={styles.meta}>
                  <Badge status={t.prioridade} className={styles.badge} />
                  {t.prazo && <span className={styles.prazo}><IconRelogio /> {t.prazo}</span>}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title="Nova tarefa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={fecharModal}>Cancelar</Button>
            <Button type="submit" form="form-nova-tarefa" loading={criando}>
              Criar tarefa
            </Button>
          </>
        }
      >
        <form id="form-nova-tarefa" className={styles.form} onSubmit={aoCriar}>
          <Input
            label="Título"
            placeholder="Ex.: Confirmar consultas de amanhã"
            value={titulo}
            onChange={e => { setTitulo(e.target.value); setErroTitulo('') }}
            error={erroTitulo}
            autoFocus
          />
          <Select
            label="Prioridade"
            options={OPCOES_PRIORIDADE}
            value={prioridade}
            onChange={e => setPrioridade(e.target.value as PrioridadeTarefa)}
          />
          <Input
            label="Prazo"
            type="date"
            value={prazoIso}
            onChange={e => setPrazoIso(e.target.value)}
            hint="Opcional"
          />
        </form>
      </Modal>
    </section>
  )
}
