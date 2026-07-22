import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { Select } from '@/components/Select/Select'
import { useToast } from '@/components/Toast/useToast'
import { useSaveTechnicalManager } from '@/hooks/useClinic'
import { SEX_OPTIONS } from '@/constants'
import type { Address, Gender, TechnicalManager } from '@/types/domain'
import { AddressFields } from './AddressFields'
import styles from './AccountTab.module.scss'

interface ResponsibleFormModalProps {
  manager: TechnicalManager
  onClose: () => void
}

/** Modal de edição do responsável técnico: foto, dados pessoais e endereço. */
export function ResponsibleFormModal({ manager, onClose }: ResponsibleFormModalProps) {
  const toast = useToast()
  const { mutate: save, isPending: saving } = useSaveTechnicalManager()

  const [form, setForm] = useState<TechnicalManager>(manager)
  const [nameError, setNameError] = useState('')

  const set = (field: keyof TechnicalManager) => (value: string | undefined) => {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'firstName') setNameError('')
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim()) {
      setNameError('Informe o nome do responsável.')
      return
    }
    save(form, {
      onSuccess: () => {
        toast.success('Responsável técnico salvo!')
        onClose()
      },
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Responsável técnico"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="form-responsavel" loading={saving}>Salvar</Button>
        </>
      }
    >
      <form id="form-responsavel" className={styles.form} onSubmit={handleSave}>
        <PhotoInput
          label="Foto"
          value={form.photo}
          onChange={url => setForm(current => ({ ...current, photo: url }))}
        />

        <div className={styles.grid2}>
          <Input
            label="Nome"
            value={form.firstName}
            onChange={e => set('firstName')(e.target.value)}
            error={nameError}
          />
          <Input label="Sobrenome" value={form.lastName} onChange={e => set('lastName')(e.target.value)} />
        </div>

        <div className={styles.grid2}>
          <Select
            label="Sexo"
            options={SEX_OPTIONS}
            placeholder="Selecione..."
            value={form.sex ?? ''}
            onChange={e => set('sex')(e.target.value as Gender)}
          />
          <Input
            label="Nascimento"
            placeholder="dd/mm/aaaa"
            value={form.birthDate ?? ''}
            onChange={e => set('birthDate')(e.target.value)}
          />
        </div>

        <div className={styles.grid2}>
          <Input label="Telefone" type="tel" value={form.phone} onChange={e => set('phone')(e.target.value)} />
          <Input label="E-mail" type="email" value={form.email} onChange={e => set('email')(e.target.value)} />
        </div>

        <AddressFields
          value={form}
          onChange={(field: keyof Address, value) => set(field)(value)}
        />
      </form>
    </Modal>
  )
}
