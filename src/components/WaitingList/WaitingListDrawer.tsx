import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Drawer } from '@/components/Drawer/Drawer'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Spinner } from '@/components/Spinner/Spinner'
import { useToast } from '@/components/Toast/Toast'
import { IconCheck, IconClock, IconEdit, IconPlus, IconTrash } from '@/components/icons'
import { useResolveWaitingListEntry, useWaitingList } from '@/hooks/useWaitingList'
import { errorMessage } from '@/utils/errors'
import { formatPhone } from '@/utils/format'
import type { WaitingListEntry } from '@/types/domain'
import { WaitingListForm } from './WaitingListForm'
import styles from './WaitingList.module.scss'

interface WaitingListDrawerProps {
  open: boolean
  onClose: () => void
}

/**
 * A LISTA DE ESPERA da agenda, num painel lateral.
 *
 * Painel e não página: a fila só é útil ao lado da grade — abre-se quando
 * alguém desmarca, procura-se quem chamar e volta-se para o horário vago. Numa
 * rota própria a recepção perderia a grade de vista no momento exato em que
 * precisa dela.
 *
 * A ordem é a de ENTRADA. Chegar antes é o único critério que a pessoa do outro
 * lado do balcão entende e não discute.
 */
export function WaitingListDrawer({ open, onClose }: WaitingListDrawerProps) {
  const toast = useToast()
  const { data: fila, isLoading } = useWaitingList()
  const { mutate: resolver } = useResolveWaitingListEntry()

  /** null = lista; 'nova' = formulário em branco; entrada = edição. */
  const [form, setForm] = useState<'nova' | WaitingListEntry | null>(null)
  const [aDesistir, setADesistir] = useState<WaitingListEntry | null>(null)

  const lista = fila ?? []

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        size="md"
        title={`Lista de espera${lista.length ? ` (${lista.length})` : ''}`}
        footer={form === null && (
          <Button iconLeft={<IconPlus />} onClick={() => setForm('nova')}>
            Adicionar à lista
          </Button>
        )}
      >
        {form !== null ? (
          <WaitingListForm
            entrada={form === 'nova' ? null : form}
            onDone={() => setForm(null)}
          />
        ) : isLoading ? (
          <Spinner />
        ) : lista.length === 0 ? (
          <EmptyState
            icon={<IconClock />}
            title="Ninguém esperando"
            description="Quem procurar atendimento e não achar horário entra aqui. Quando um paciente desmarcar, é esta a fila que a recepção percorre."
          />
        ) : (
          <ol className={styles.fila}>
            {lista.map((e, i) => (
              <li key={e.id} className={styles.item}>
                {/* A POSIÇÃO na fila, não o id: é a primeira coisa que se
                    pergunta ao telefone ("sou o quê da lista?"). */}
                <span className={styles.posicao}>{i + 1}</span>

                <div className={styles.dados}>
                  <div className={styles.linhaNome}>
                    <strong className={styles.nome}>{e.patientName}</strong>
                    {/* Selo simples, não Badge: convênio é um NOME livre da
                        clínica, não um status do domínio — o STATUS_MAP não
                        tem (nem deveria ter) uma entrada por operadora. */}
                    <span className={styles.convenio}>{e.insuranceName ?? 'Particular'}</span>
                  </div>

                  {/* Telefone em destaque: a ação desta tela é LIGAR. */}
                  {(e.mobilePhone || e.homePhone) && (
                    <span className={styles.contato}>
                      {[e.mobilePhone, e.homePhone].filter(Boolean)
                        .map(p => formatPhone(p)).join(' · ')}
                    </span>
                  )}
                  {e.email && <span className={styles.contatoFraco}>{e.email}</span>}
                  {e.notes && <p className={styles.observacao}>{e.notes}</p>}
                  <span className={styles.desde}>Na fila desde {e.createdAt}</span>
                </div>

                <div className={styles.acoes}>
                  <Button
                    variant="ghost" size="sm" iconLeft={<IconCheck />}
                    aria-label={`Marcar ${e.patientName} como agendado`}
                    title="Já agendei"
                    onClick={() => resolver({ id: e.id, status: 'scheduled' }, {
                      onSuccess: () => toast.success(`${e.patientName} saiu da fila.`),
                      onError: err => toast.error(errorMessage(err, 'Não foi possível atualizar.')),
                    })}
                  />
                  <Button
                    variant="ghost" size="sm" iconLeft={<IconEdit />}
                    aria-label={`Editar ${e.patientName}`}
                    onClick={() => setForm(e)}
                  />
                  <Button
                    variant="ghost" size="sm" iconLeft={<IconTrash />}
                    aria-label={`Remover ${e.patientName} da fila`}
                    onClick={() => setADesistir(e)}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </Drawer>

      <ConfirmDialog
        open={aDesistir !== null}
        onClose={() => setADesistir(null)}
        onConfirm={() => {
          if (!aDesistir) return
          resolver({ id: aDesistir.id, status: 'canceled' }, {
            onSuccess: () => toast.success(`${aDesistir.patientName} saiu da fila.`),
            onError: err => toast.error(errorMessage(err, 'Não foi possível remover.')),
          })
          setADesistir(null)
        }}
        title="Tirar da lista de espera?"
        message={`${aDesistir?.patientName ?? ''} sai da fila. O registro fica guardado com a data — é ele que responde quanto tempo as pessoas esperam e quantas desistem, que é o argumento para abrir mais horário.`}
        confirmLabel="Tirar da fila"
      />
    </>
  )
}
