import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Drawer } from '@/components/Drawer/Drawer'
import { useToast } from '@/components/Toast/useToast'
import { useCreateLead } from '@/hooks/useLeads'
import styles from './NewLeadModal.module.scss'

interface NewLeadModalProps {
  onClose: () => void
}

/**
 * Painel "Novo contato": cadastro manual de um lead direto na primeira etapa
 * do funil ('new'). Desliza da direita — o dentista preenche olhando o
 * Kanban ao lado, e não perde o quadro de vista como um modal centralizado
 * faria. Nome/sobrenome seguem o mesmo desenho do cadastro de paciente (dois
 * campos que viram um `name` só); e-mail é opcional — nem todo contato chega
 * com um. Telefone e interesse são obrigatórios porque a tabela `lead` os
 * exige (NOT NULL + CHECK de não-vazio).
 */
export function NewLeadModal({ onClose }: NewLeadModalProps) {
  const toast = useToast()
  const { mutate: createLead, isPending: saving } = useCreateLead()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [interest, setInterest] = useState('')
  const [error, setError] = useState('')

  function save() {
    if (!firstName.trim()) {
      setError('Informe o nome do contato.')
      return
    }
    if (!phone.trim()) {
      setError('Informe o telefone.')
      return
    }
    if (!interest.trim()) {
      setError('Informe o interesse.')
      return
    }

    createLead(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        interest: interest.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Contato cadastrado!')
          onClose()
        },
      },
    )
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Novo contato"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button loading={saving} onClick={save}>Cadastrar</Button>
        </>
      }
    >
      <div className={styles.corpo}>
        <div className={styles.linha2}>
          <Input
            label="Nome"
            placeholder="Maria"
            value={firstName}
            onChange={e => { setFirstName(e.target.value); setError('') }}
            autoFocus
          />
          <Input
            label="Sobrenome"
            placeholder="Oliveira"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
          />
        </div>

        <div className={styles.linha2}>
          <Input
            label="E-mail"
            type="email"
            placeholder="maria@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            label="Telefone"
            type="tel"
            placeholder="(79) 99999-0000"
            value={phone}
            onChange={e => { setPhone(e.target.value); setError('') }}
          />
        </div>

        <Input
          label="Interesse"
          placeholder="Clareamento dental, avaliação ortodôntica…"
          value={interest}
          onChange={e => { setInterest(e.target.value); setError('') }}
        />

        {error && <p className={styles.erro}>{error}</p>}
      </div>
    </Drawer>
  )
}
