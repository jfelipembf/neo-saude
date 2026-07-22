import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { useToast } from '@/components/Toast/useToast'
import { useCreateRoom, useUpdateRoom } from '@/hooks/useRooms'
import type { Room } from '@/types/domain'
import styles from './RoomFormModal.module.scss'

interface RoomFormModalProps {
  /** Sala em edição — undefined significa cadastro novo. */
  room?: Room
  onClose: () => void
}

/** Modal de cadastro/edição de sala (página Inicial). */
export function RoomFormModal({ room, onClose }: RoomFormModalProps) {
  const toast = useToast()
  const { mutate: create, isPending: creating } = useCreateRoom()
  const { mutate: update, isPending: saving } = useUpdateRoom()

  const [name, setName] = useState(room?.name ?? '')
  const [photo, setPhoto] = useState<string | undefined>(room?.photo)
  const [nameError, setNameError] = useState('')

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Informe o nome da sala.')
      return
    }
    const payload = { name: name.trim(), photo }
    const options = {
      onSuccess: () => {
        toast.success(room ? 'Sala atualizada!' : 'Sala cadastrada!')
        onClose()
      },
    }
    if (room) update({ id: room.id, payload }, options)
    else create(payload, options)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={room ? 'Editar sala' : 'Nova sala'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-sala" loading={creating || saving}>
            {room ? 'Salvar alterações' : 'Cadastrar sala'}
          </Button>
        </>
      }
    >
      <form id="form-sala" className={styles.form} onSubmit={handleSave}>
        <Input
          label="Nome"
          placeholder="Ex: Consultório 1"
          value={name}
          onChange={e => { setName(e.target.value); setNameError('') }}
          error={nameError}
          autoFocus
        />
        <PhotoInput label="Foto da sala" value={photo} onChange={setPhoto} folder="rooms" />
      </form>
    </Modal>
  )
}
