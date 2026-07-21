import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { useToast } from '@/components/Toast/useToast'
import { useSalvarConsultorio } from '@/hooks/useConsultorio'
import type { DadosConsultorio, Endereco } from '@/types/domain'
import { AddressFields } from './AddressFields'
import styles from './ClinicTab.module.scss'

interface ClinicFormModalProps {
  /** Cadastro atual — o formulário nasce preenchido (monta só com o modal aberto). */
  inicial: DadosConsultorio
  onClose: () => void
}

/** Modal de edição dos dados do consultório (página Inicial). */
export function ClinicFormModal({ inicial, onClose }: ClinicFormModalProps) {
  const toast = useToast()
  const { mutate: salvar, isPending: salvando } = useSalvarConsultorio()

  const [form, setForm] = useState<DadosConsultorio>(inicial)
  const [erroNome, setErroNome] = useState('')

  const set = (campo: keyof DadosConsultorio) => (valor: string) => {
    setForm(atual => ({ ...atual, [campo]: valor }))
    if (campo === 'nome') setErroNome('')
  }

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      setErroNome('Informe o nome do consultório.')
      return
    }
    salvar(form, {
      onSuccess: () => {
        toast.success('Dados do consultório salvos!')
        onClose()
      },
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Dados do consultório"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-consultorio" loading={salvando}>
            Salvar
          </Button>
        </>
      }
    >
      <form id="form-consultorio" className={styles.form} onSubmit={aoSalvar}>
        <PhotoInput
          label="Logo"
          value={form.logo}
          onChange={url => setForm(atual => ({ ...atual, logo: url }))}
        />

        <Input
          label="Nome"
          placeholder="Ex: Clínica Neo Saúde"
          value={form.nome}
          onChange={e => set('nome')(e.target.value)}
          error={erroNome}
        />
        <Input
          label="CNPJ"
          placeholder="00.000.000/0000-00"
          value={form.cnpj}
          onChange={e => set('cnpj')(e.target.value)}
        />

        <div className={styles.grid2}>
          <Input
            label="E-mail"
            type="email"
            placeholder="contato@clinica.com.br"
            value={form.email}
            onChange={e => set('email')(e.target.value)}
          />
          <Input
            label="Telefone"
            type="tel"
            placeholder="(79) 3200-0000"
            value={form.telefone}
            onChange={e => set('telefone')(e.target.value)}
          />
        </div>

        <AddressFields
          value={form}
          onChange={(campo: keyof Endereco, valor) => set(campo)(valor)}
        />
      </form>
    </Modal>
  )
}
