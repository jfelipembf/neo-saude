import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { useToast } from '@/components/Toast/useToast'
import { useCriarLembrete } from '@/hooks/useLembretes'
import styles from './RemindersCard.module.scss'

interface ReminderFormModalProps {
  onClose: () => void
}

/** Modal "Novo lembrete": texto + data opcional (Cancelar/Salvar no rodapé). */
export function ReminderFormModal({ onClose }: ReminderFormModalProps) {
  const toast = useToast()
  const { mutate: criar, isPending: criando } = useCriarLembrete()

  const [texto, setTexto] = useState('')
  const [dataIso, setDataIso] = useState('')
  const [erroTexto, setErroTexto] = useState('')

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    if (!texto.trim()) {
      setErroTexto('Descreva o lembrete.')
      return
    }
    criar(
      {
        texto: texto.trim(),
        // input date entrega 'aaaa-mm-dd'; o card exibe 'dd/mm'.
        data: dataIso ? `${dataIso.slice(8, 10)}/${dataIso.slice(5, 7)}` : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Lembrete criado!')
          onClose()
        },
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Novo lembrete"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-lembrete" loading={criando}>
            Salvar
          </Button>
        </>
      }
    >
      <form id="form-lembrete" className={styles.form} onSubmit={aoSalvar}>
        <Input
          label="Lembrete"
          placeholder="Ex: Ligar para confirmar consulta"
          value={texto}
          onChange={e => { setTexto(e.target.value); setErroTexto('') }}
          error={erroTexto}
          autoFocus
        />
        <Input
          label="Data (opcional)"
          type="date"
          value={dataIso}
          onChange={e => setDataIso(e.target.value)}
        />
      </form>
    </Modal>
  )
}
