import { useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Spinner } from '@/components/Spinner/Spinner'
import { useLembretes, useAlternarLembrete, useRemoverLembrete } from '@/hooks/useLembretes'
import { IconCheck, IconMais, IconLixeira, IconRelogio } from '@/components/icons'
import { ReminderFormModal } from './ReminderFormModal'
import styles from './RemindersCard.module.scss'

/** Urgência do lembrete comparando dd/mm com a data atual (ano corrente). */
function statusDoLembrete(data: string): 'hoje' | 'atrasado' | 'em_breve' {
  const [dia, mes] = data.split('/').map(Number)
  const agora = new Date()
  const alvo = new Date(agora.getFullYear(), mes - 1, dia).getTime()
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime()
  if (alvo === hoje) return 'hoje'
  return alvo < hoje ? 'atrasado' : 'em_breve'
}

/** Card de lembretes do Dashboard: criar (modal), concluir e excluir. */
export function RemindersCard() {
  const { data: lembretes, isLoading } = useLembretes()
  const { mutate: alternar } = useAlternarLembrete()
  const { mutate: remover } = useRemoverLembrete()

  const [modalAberto, setModalAberto] = useState(false)

  const lista = lembretes ?? []
  const pendentes = lista.filter(l => !l.concluido).length

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>Lembretes</h2>
        <div className={styles.headerDireita}>
          {pendentes > 0 && <span className={styles.contagem}>{pendentes} pendente{pendentes > 1 ? 's' : ''}</span>}
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconMais />}
            onClick={() => setModalAberto(true)}
            aria-label="Novo lembrete"
          />
        </div>
      </header>

      {isLoading ? (
        <div className={styles.carregando}><Spinner /></div>
      ) : (
        <ul className={styles.lista}>
          {lista.length === 0 && (
            <li className={styles.vazio}>Nenhum lembrete. Crie o primeiro no botão +.</li>
          )}
          {lista.map(l => (
            <li key={l.id} className={`${styles.item} ${l.concluido ? styles['item--feito'] : ''}`}>
              <button
                type="button"
                className={`${styles.checkBtn} ${l.concluido ? styles['checkBtn--ativo'] : ''}`}
                onClick={() => alternar(l.id)}
                title={l.concluido ? 'Reabrir lembrete' : 'Concluir lembrete'}
                aria-label={`${l.concluido ? 'Reabrir' : 'Concluir'}: ${l.texto}`}
              >
                <IconCheck />
              </button>

              <div className={styles.itemInfo}>
                <span className={styles.itemTexto}>{l.texto}</span>
                {l.data && <span className={styles.itemData}><IconRelogio /> {l.data}</span>}
              </div>

              {/* Urgência só para pendentes com data (concluído já conta a história). */}
              {l.data && !l.concluido && <Badge status={statusDoLembrete(l.data)} />}

              <button
                type="button"
                className={styles.removerBtn}
                onClick={() => remover(l.id)}
                title="Excluir lembrete"
                aria-label={`Excluir: ${l.texto}`}
              >
                <IconLixeira />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Monta só quando aberto — o formulário nasce limpo a cada criação. */}
      {modalAberto && <ReminderFormModal onClose={() => setModalAberto(false)} />}
    </section>
  )
}
