import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { useToast } from '@/components/Toast/useToast'
import { useCriarSala, useAtualizarSala } from '@/hooks/useSalas'
import type { Sala } from '@/types/domain'
import styles from './RoomFormModal.module.scss'

interface RoomFormModalProps {
  /** Sala em edição — undefined significa cadastro novo. */
  sala?: Sala
  onClose: () => void
}

/** Modal de cadastro/edição de sala (página Inicial). */
export function RoomFormModal({ sala, onClose }: RoomFormModalProps) {
  const toast = useToast()
  const { mutate: criar, isPending: criando } = useCriarSala()
  const { mutate: atualizar, isPending: salvando } = useAtualizarSala()

  const [nome, setNome] = useState(sala?.nome ?? '')
  const [foto, setFoto] = useState<string | undefined>(sala?.foto)
  const [erroNome, setErroNome] = useState('')

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setErroNome('Informe o nome da sala.')
      return
    }
    const dados = { nome: nome.trim(), foto }
    const opcoes = {
      onSuccess: () => {
        toast.success(sala ? 'Sala atualizada!' : 'Sala cadastrada!')
        onClose()
      },
    }
    if (sala) atualizar({ id: sala.id, dados }, opcoes)
    else criar(dados, opcoes)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={sala ? 'Editar sala' : 'Nova sala'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-sala" loading={criando || salvando}>
            {sala ? 'Salvar alterações' : 'Cadastrar sala'}
          </Button>
        </>
      }
    >
      <form id="form-sala" className={styles.form} onSubmit={aoSalvar}>
        <Input
          label="Nome"
          placeholder="Ex: Consultório 1"
          value={nome}
          onChange={e => { setNome(e.target.value); setErroNome('') }}
          error={erroNome}
          autoFocus
        />
        <PhotoInput label="Foto da sala" value={foto} onChange={setFoto} />
      </form>
    </Modal>
  )
}
