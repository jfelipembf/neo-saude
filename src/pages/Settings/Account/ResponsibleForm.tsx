import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { Select } from '@/components/Select/Select'
import { useToast } from '@/components/Toast/useToast'
import { useSalvarResponsavel } from '@/hooks/useConsultorio'
import { OPCOES_SEXO } from '@/constants'
import type { Address, Gender, TechnicalManager } from '@/types/domain'
import { AddressFields } from './AddressFields'
import styles from './AccountTab.module.scss'

interface ResponsibleFormModalProps {
  responsavel: TechnicalManager
  onClose: () => void
}

/** Modal de edição do responsável técnico: foto, dados pessoais e endereço. */
export function ResponsibleFormModal({ responsavel, onClose }: ResponsibleFormModalProps) {
  const toast = useToast()
  const { mutate: salvar, isPending: salvando } = useSalvarResponsavel()

  const [form, setForm] = useState<TechnicalManager>(responsavel)
  const [erroNome, setErroNome] = useState('')

  const set = (campo: keyof TechnicalManager) => (valor: string | undefined) => {
    setForm(atual => ({ ...atual, [campo]: valor }))
    if (campo === 'nome') setErroNome('')
  }

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      setErroNome('Informe o nome do responsável.')
      return
    }
    salvar(form, {
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
          <Button variant="ghost" onClick={onClose} disabled={salvando}>Cancelar</Button>
          <Button type="submit" form="form-responsavel" loading={salvando}>Salvar</Button>
        </>
      }
    >
      <form id="form-responsavel" className={styles.form} onSubmit={aoSalvar}>
        <PhotoInput
          label="Foto"
          value={form.foto}
          onChange={url => setForm(atual => ({ ...atual, foto: url }))}
        />

        <div className={styles.grid2}>
          <Input
            label="Nome"
            value={form.nome}
            onChange={e => set('nome')(e.target.value)}
            error={erroNome}
          />
          <Input label="Sobrenome" value={form.sobrenome} onChange={e => set('sobrenome')(e.target.value)} />
        </div>

        <div className={styles.grid2}>
          <Select
            label="Sexo"
            options={OPCOES_SEXO}
            placeholder="Selecione..."
            value={form.sexo ?? ''}
            onChange={e => set('sexo')(e.target.value as Gender)}
          />
          <Input
            label="Nascimento"
            placeholder="dd/mm/aaaa"
            value={form.nascimento ?? ''}
            onChange={e => set('nascimento')(e.target.value)}
          />
        </div>

        <div className={styles.grid2}>
          <Input label="Telefone" type="tel" value={form.telefone} onChange={e => set('telefone')(e.target.value)} />
          <Input label="E-mail" type="email" value={form.email} onChange={e => set('email')(e.target.value)} />
        </div>

        <AddressFields
          value={form}
          onChange={(campo: keyof Address, valor) => set(campo)(valor)}
        />
      </form>
    </Modal>
  )
}
