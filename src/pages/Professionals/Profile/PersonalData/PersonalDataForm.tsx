import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { SEX_OPTIONS } from '@/constants'
import { useUpdateProfessional } from '@/hooks/useProfessionals'
import type { Professional, Gender } from '@/types/domain'
import shared from '../shared/profile.module.scss'

interface ProfessionalFormState {
  firstName: string
  lastName: string
  sex: Gender | ''
  birthDateIso: string   // aaaa-mm-dd (input date)
  specialty: string
  license: string
  description: string
  email: string
  phone: string
  whatsapp: string
  cep: string
  state: string
  city: string
  neighborhood: string
  number: string
  active: boolean
}

function formStateFromProfessional(p: Professional): ProfessionalFormState {
  // "Dra. Camila Duarte" → nome "Dra. Camila" + sobrenome "Duarte": o prefixo
  // do conselho fica junto do primeiro nome (dividir só no espaço deixaria
  // o nome como "Dra." solto).
  const parts = p.name.split(' ').filter(Boolean)
  const hasTitle = /^Dra?\.$/i.test(parts[0] ?? '') && parts.length > 1
  const cutIndex = hasTitle ? 2 : 1
  return {
    firstName: parts.slice(0, cutIndex).join(' '),
    lastName: parts.slice(cutIndex).join(' '),
    sex: p.sex ?? '',
    birthDateIso: p.birthDate ? p.birthDate.split('/').reverse().join('-') : '',
    specialty: p.specialty,
    license: p.license,
    description: p.description ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    whatsapp: p.whatsapp ?? '',
    cep: p.cep ?? '',
    state: p.state ?? '',
    city: p.city ?? '',
    neighborhood: p.neighborhood ?? '',
    number: p.number ?? '',
    active: p.status === 'active',
  }
}

interface PersonalDataFormProps {
  professional: Professional
  onClose: () => void
}

/** Aba "Dados pessoais" em modo edição. O rascunho nasce do cadastro salvo a
 *  cada montagem — fechar/trocar de aba descarta o que não foi salvo. */
export function PersonalDataForm({ professional, onClose }: PersonalDataFormProps) {
  const toast = useToast()
  const { mutate: save, isPending: saving } = useUpdateProfessional()

  const [form, setForm] = useState<ProfessionalFormState>(() => formStateFromProfessional(professional))
  const [nameError, setNameError] = useState('')

  const set = (field: keyof ProfessionalFormState) => (value: string | boolean) => {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'firstName') setNameError('')
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim()) {
      setNameError('Informe o nome do profissional.')
      return
    }
    save(
      {
        id: professional.id,
        payload: {
          name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          sex: form.sex || undefined,
          birthDate: form.birthDateIso ? form.birthDateIso.split('-').reverse().join('/') : '',
          specialty: form.specialty.trim(),
          license: form.license.trim(),
          // Vazio limpa o campo — `undefined` (não enviado) preservaria o valor.
          description: form.description.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim(),
          cep: form.cep.trim(),
          state: form.state.trim().toUpperCase(),
          city: form.city.trim(),
          neighborhood: form.neighborhood.trim(),
          number: form.number.trim(),
          status: form.active ? 'active' : 'inactive',
        },
      },
      {
        onSuccess: () => {
          toast.success('Dados atualizados!')
          onClose()
        },
      },
    )
  }

  return (
    <section className={shared.formCard} aria-label="Editar cadastro">
      <h2 className={shared.formTitulo}>Editar cadastro</h2>

      <form className={shared.form} onSubmit={handleSave}>
        <section className={shared.formSection}>
          <h3>Dados pessoais</h3>
          <div className={shared.grid2}>
            <Input label="Nome" value={form.firstName} onChange={e => set('firstName')(e.target.value)} error={nameError} autoFocus />
            <Input label="Sobrenome" value={form.lastName} onChange={e => set('lastName')(e.target.value)} />
          </div>
          <div className={shared.grid2}>
            <Select
              label="Sexo"
              options={SEX_OPTIONS}
              placeholder="Selecione..."
              value={form.sex}
              onChange={e => set('sex')(e.target.value)}
            />
            <Input
              label="Data de nascimento"
              type="date"
              value={form.birthDateIso}
              onChange={e => set('birthDateIso')(e.target.value)}
            />
          </div>
        </section>

        <section className={shared.formSection}>
          <h3>Dados profissionais</h3>
          <div className={shared.grid2}>
            <Input label="Especialidade" value={form.specialty} onChange={e => set('specialty')(e.target.value)} />
            <Input label="Registro (conselho)" placeholder="Ex: CRO/SE 4567" value={form.license} onChange={e => set('license')(e.target.value)} />
          </div>
          <Textarea
            label="Sobre a atuação"
            placeholder="Breve descrição da especialidade e dos atendimentos."
            rows={3}
            value={form.description}
            onChange={e => set('description')(e.target.value)}
          />
          <Toggle label="Profissional ativo" checked={form.active} onChange={v => set('active')(v)} />
        </section>

        <section className={shared.formSection}>
          <h3>Contato</h3>
          <Input label="E-mail" type="email" value={form.email} onChange={e => set('email')(e.target.value)} />
          <div className={shared.grid2}>
            <Input label="Telefone" type="tel" value={form.phone} onChange={e => set('phone')(e.target.value)} />
            <Input label="WhatsApp" type="tel" value={form.whatsapp} onChange={e => set('whatsapp')(e.target.value)} />
          </div>
        </section>

        <section className={shared.formSection}>
          <h3>Endereço</h3>
          <div className={shared.grid2}>
            <Input label="CEP" value={form.cep} onChange={e => set('cep')(e.target.value)} />
            <Input label="Estado" maxLength={2} value={form.state} onChange={e => set('state')(e.target.value)} />
          </div>
          <div className={shared.grid2}>
            <Input label="Cidade" value={form.city} onChange={e => set('city')(e.target.value)} />
            <Input label="Bairro" value={form.neighborhood} onChange={e => set('neighborhood')(e.target.value)} />
          </div>
          <div className={shared.grid2}>
            <Input label="Número" value={form.number} onChange={e => set('number')(e.target.value)} />
          </div>
        </section>

        <div className={shared.formAcoes}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" loading={saving}>Salvar alterações</Button>
        </div>
      </form>
    </section>
  )
}
