import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { useToast } from '@/components/Toast/Toast'
import { useCreateOdontoProcedure, useUpdateOdontoProcedure } from '@/hooks/useOdontoProcedures'
import type { OdontoProcedure } from '@/types/domain'
import styles from './OdontoProcedureFormModal.module.scss'

interface OdontoProcedureFormModalProps {
  /** Serviço em edição — undefined significa cadastro novo. */
  procedure?: OdontoProcedure
  onClose: () => void
}

/** Modal de cadastro/edição de serviço (aba Serviços da odontologia). */
export function OdontoProcedureFormModal({ procedure, onClose }: OdontoProcedureFormModalProps) {
  const toast = useToast()
  const { mutate: create, isPending: creating } = useCreateOdontoProcedure()
  const { mutate: update, isPending: saving } = useUpdateOdontoProcedure()

  const [name, setName] = useState(procedure?.name ?? '')
  const [price, setPrice] = useState(procedure ? String(procedure.price) : '')
  const [nameError, setNameError] = useState('')

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Informe o nome do serviço.')
      return
    }
    const payload = { name: name.trim(), price: Math.max(0, Number(price) || 0) }
    const options = {
      onSuccess: () => {
        toast.success(procedure ? 'Serviço atualizado!' : 'Serviço cadastrado!')
        onClose()
      },
    }
    if (procedure) update({ id: procedure.id, payload }, options)
    else create(payload, options)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={procedure ? 'Editar serviço' : 'Novo serviço'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-servico-odonto" loading={creating || saving}>
            {procedure ? 'Salvar' : 'Cadastrar serviço'}
          </Button>
        </>
      }
    >
      <form id="form-servico-odonto" className={styles.form} onSubmit={handleSave}>
        <Input
          label="Nome do serviço"
          placeholder="Ex: Limpeza, Restauração, Extração..."
          value={name}
          onChange={e => { setName(e.target.value); setNameError('') }}
          error={nameError}
          autoFocus
        />
        <Input
          label="Valor (R$)"
          type="number" min={0} step="0.01"
          placeholder="Ex: 150,00"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
      </form>
    </Modal>
  )
}
