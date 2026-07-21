import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { useToast } from '@/components/Toast/useToast'
import { useSalvarResponsavel } from '@/hooks/useConsultorio'
import { OPCOES_SEXO } from '@/constants'
import type { Endereco, ResponsavelTecnico, SexoPaciente } from '@/types/domain'
import { AddressFields } from './AddressFields'
import styles from './ClinicTab.module.scss'

interface ResponsibleFormModalProps {
  /** Cadastro atual — o formulário nasce preenchido (monta só com o modal aberto). */
  inicial: ResponsavelTecnico
  onClose: () => void
}

// Estado do formulário: a data vive como aaaa-mm-dd (input date); vira dd/mm/aaaa ao salvar.
interface FormResponsavel extends Omit<ResponsavelTecnico, 'nascimento'> {
  nascimentoIso: string
}

/** Modal de edição do responsável técnico (página Inicial). */
export function ResponsibleFormModal({ inicial, onClose }: ResponsibleFormModalProps) {
  const toast = useToast()
  const { mutate: salvar, isPending: salvando } = useSalvarResponsavel()

  const [form, setForm] = useState<FormResponsavel>(() => {
    const { nascimento, ...resto } = inicial
    return { ...resto, nascimentoIso: nascimento ? nascimento.split('/').reverse().join('-') : '' }
  })
  const [erroNome, setErroNome] = useState('')

  const set = (campo: keyof FormResponsavel) => (valor: string) => {
    setForm(atual => ({ ...atual, [campo]: valor }))
    if (campo === 'nome') setErroNome('')
  }

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      setErroNome('Informe o nome do responsável.')
      return
    }
    const { nascimentoIso, ...resto } = form
    salvar(
      {
        ...resto,
        nascimento: nascimentoIso ? nascimentoIso.split('-').reverse().join('/') : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Responsável técnico salvo!')
          onClose()
        },
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Responsável técnico"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-responsavel" loading={salvando}>
            Salvar
          </Button>
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
            placeholder="Camila"
            value={form.nome}
            onChange={e => set('nome')(e.target.value)}
            error={erroNome}
          />
          <Input
            label="Sobrenome"
            placeholder="Duarte"
            value={form.sobrenome}
            onChange={e => set('sobrenome')(e.target.value)}
          />
        </div>

        <div className={styles.grid2}>
          <Select
            label="Sexo"
            options={OPCOES_SEXO}
            placeholder="Selecione..."
            value={form.sexo ?? ''}
            onChange={e => setForm(atual => ({ ...atual, sexo: (e.target.value || undefined) as SexoPaciente | undefined }))}
          />
          <Input
            label="Data de nascimento"
            type="date"
            value={form.nascimentoIso}
            onChange={e => set('nascimentoIso')(e.target.value)}
          />
        </div>

        <div className={styles.grid2}>
          <Input
            label="Telefone"
            type="tel"
            placeholder="(79) 99900-0000"
            value={form.telefone}
            onChange={e => set('telefone')(e.target.value)}
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="nome@clinica.com.br"
            value={form.email}
            onChange={e => set('email')(e.target.value)}
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
