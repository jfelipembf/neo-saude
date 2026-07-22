import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { useToast } from '@/components/Toast/useToast'
import { AddressFields } from '@/components/AddressFields/AddressFields'
import { useSaveClinic } from '@/hooks/useClinic'
import type { Address, ClinicData } from '@/types/domain'
import styles from './AccountTab.module.scss'

interface ClinicFormModalProps {
  clinic: ClinicData
  onClose: () => void
}

/** Modal de edição do cadastro da clínica: identificação, contato e endereço.
 *
 *  NÃO edita `specialty` (o ramo vem do plano contratado, não da clínica) nem a
 *  logo (tem seção própria, com upload). Os dois aparecem na aba só para leitura.
 *  Estes dados vão para o TOPO de todo documento impresso — recibo, orçamento,
 *  receituário — então errar aqui sai no papel que o paciente leva. */
export function ClinicFormModal({ clinic, onClose }: ClinicFormModalProps) {
  const toast = useToast()
  const { mutate: save, isPending: saving } = useSaveClinic()

  const [form, setForm] = useState<ClinicData>(clinic)
  const [nameError, setNameError] = useState('')

  const set = (field: keyof ClinicData) => (value: string) => {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'name') setNameError('')
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setNameError('Informe o nome da clínica.')
      return
    }
    save(form, {
      onSuccess: () => {
        toast.success('Dados da clínica salvos!')
        onClose()
      },
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Dados da clínica"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="form-clinica" loading={saving}>Salvar</Button>
        </>
      }
    >
      <form id="form-clinica" className={styles.form} onSubmit={handleSave}>
        <div className={styles.grid2}>
          <Input
            label="Nome da clínica"
            value={form.name}
            onChange={e => set('name')(e.target.value)}
            error={nameError}
          />
          <Input
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
            value={form.cnpj}
            onChange={e => set('cnpj')(e.target.value)}
          />
        </div>

        <div className={styles.grid2}>
          <Input
            label="Telefone"
            type="tel"
            placeholder="(00) 0000-0000"
            value={form.phone}
            onChange={e => set('phone')(e.target.value)}
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={e => set('email')(e.target.value)}
          />
        </div>

        <AddressFields
          value={form}
          onChange={(field: keyof Address, value) => set(field)(value)}
        />
      </form>
    </Modal>
  )
}
