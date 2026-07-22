import { useState } from 'react'
import type { FormEvent } from 'react'
import { AddressFields } from '@/components/AddressFields/AddressFields'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { COLOR_PALETTE } from '@/constants'
import { useSession } from '@/context/SessionProvider'
import { useCreateProfessional, useLinkProfessionalToUser } from '@/hooks/useProfessionals'
import { userMessage } from '@/lib/errors'
import type { Address } from '@/types/domain'
import styles from './ProfessionalFormModal.module.scss'

/** Rascunho do cadastro. Só o essencial para existir na agenda — currículo,
 *  sexo, nascimento e "sobre" ficam para o perfil, depois de criado. */
interface ProfessionalFormState {
  name: string
  specialty: string
  license: string
  color: string
  email: string
  phone: string
  cep: string
  state: string
  city: string
  neighborhood: string
  number: string
  /** Marca o profissional como sendo o próprio usuário logado. */
  isMe: boolean
}

const EMPTY_FORM: ProfessionalFormState = {
  name: '', specialty: '', license: '',
  color: COLOR_PALETTE[0],
  email: '', phone: '',
  cep: '', state: '', city: '', neighborhood: '', number: '',
  isMe: false,
}

interface ProfessionalFormModalProps {
  onClose: () => void
  /** Recebe o id recém-criado (a página costuma abrir o perfil novo). */
  onCreated?: (professionalId: string) => void
}

/**
 * Modal de cadastro de profissional.
 *
 * O "Sou eu" liga o cadastro ao login da sessão (RPC `link_professional_user`):
 * é o que faz o dono da clínica deixar de ver travessões em Configurações →
 * Conta, já que nome/código/especialidade/registro de lá vêm do `professional`.
 */
export function ProfessionalFormModal({ onClose, onCreated }: ProfessionalFormModalProps) {
  const toast = useToast()
  const { session } = useSession()
  const { mutateAsync: create, isPending: creating } = useCreateProfessional()
  const { mutateAsync: linkToUser, isPending: linking } = useLinkProfessionalToUser()

  const [form, setForm] = useState<ProfessionalFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')
  const [licenseError, setLicenseError] = useState('')

  const saving = creating || linking
  const userId = session?.user.id

  const set = (field: keyof ProfessionalFormState) => (value: string | boolean) => {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'name') setNameError('')
    if (field === 'license') setLicenseError('')
  }

  const setAddress = (field: keyof Address, value: string) => {
    // O domínio do profissional não guarda logradouro — o campo nem é exibido.
    if (field === 'street') return
    setForm(current => ({ ...current, [field]: value }))
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()

    const name = form.name.trim()
    const license = form.license.trim()
    setNameError(name ? '' : 'Informe o nome do profissional.')
    setLicenseError(license ? '' : 'Informe o registro no conselho.')
    if (!name || !license) return

    try {
      // Cadastro novo nasce ativo: quem para de atender é desativado no perfil.
      const professionalId = await create({
        name,
        specialty: form.specialty.trim(),
        license,
        color: form.color,
        status: 'active',
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        cep: form.cep.trim() || undefined,
        state: form.state.trim().toUpperCase() || undefined,
        city: form.city.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        number: form.number.trim() || undefined,
      })

      // O vínculo é um passo à parte: se ele falhar, o cadastro já está salvo e
      // o usuário refaz só a ligação (Perfil → vincular), sem redigitar tudo.
      if (form.isMe && userId) {
        try {
          await linkToUser({ professionalId, userId })
        } catch (error) {
          // A RPC diz POR QUE recusou (sem permissão de admin, login já ligado a
          // outro profissional) — o cadastro em si já está salvo.
          toast.error(userMessage(
            error,
            'Profissional cadastrado, mas não foi possível vincular ao seu login.',
          ))
          onClose()
          onCreated?.(professionalId)
          return
        }
      }

      toast.success('Profissional cadastrado!')
      onClose()
      onCreated?.(professionalId)
    } catch (error) {
      // O limite de profissionais do plano é barrado no banco, com a mensagem
      // pronta ("o plano X inclui N vagas…"). Trocá-la por um texto genérico
      // deixaria o usuário sem saber que precisa inativar alguém ou fazer
      // upgrade — justamente o erro mais provável desta tela.
      toast.error(userMessage(error, 'Não foi possível cadastrar o profissional.'))
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Novo profissional"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="form-new-professional" loading={saving}>
            Cadastrar profissional
          </Button>
        </>
      }
    >
      <form id="form-new-professional" className={styles.form} onSubmit={handleCreate}>
        <section className={styles.formSection}>
          <h3>Identificação</h3>
          <Input
            label="Nome completo"
            placeholder="Dra. Camila Duarte"
            value={form.name}
            onChange={e => set('name')(e.target.value)}
            error={nameError}
            autoFocus
          />
          <div className={styles.grid2}>
            <Input
              label="Especialidade"
              placeholder="Ortodontia"
              value={form.specialty}
              onChange={e => set('specialty')(e.target.value)}
            />
            <Input
              label="Registro (conselho)"
              placeholder="CRO/SE 4567"
              value={form.license}
              onChange={e => set('license')(e.target.value)}
              error={licenseError}
            />
          </div>

          <div className={styles.colorField}>
            <label className={styles.colorLabel} htmlFor="professional-color">
              Cor na agenda
            </label>
            <input
              id="professional-color"
              type="color"
              className={styles.colorInput}
              value={form.color}
              onChange={e => set('color')(e.target.value)}
            />
            <span className={styles.colorHint}>
              Identifica os atendimentos deste profissional na agenda.
            </span>
          </div>
        </section>

        <section className={styles.formSection}>
          <h3>Contato</h3>
          <div className={styles.grid2}>
            <Input
              label="E-mail"
              type="email"
              placeholder="camila@email.com"
              value={form.email}
              onChange={e => set('email')(e.target.value)}
            />
            <Input
              label="Telefone"
              type="tel"
              placeholder="(79) 99999-0000"
              value={form.phone}
              onChange={e => set('phone')(e.target.value)}
            />
          </div>
        </section>

        <section className={styles.formSection}>
          <h3>Endereço</h3>
          <AddressFields value={form} onChange={setAddress} showStreet={false} />
        </section>

        {userId && (
          <section className={styles.formSection}>
            <h3>Meu acesso</h3>
            <div className={styles.selfRow}>
              <Toggle
                label="Sou eu (vincular ao meu login)"
                checked={form.isMe}
                onChange={value => set('isMe')(value)}
              />
              <span className={styles.selfHint}>
                Liga este cadastro à sua conta: seus dados profissionais passam a
                aparecer em Configurações → Conta.
              </span>
            </div>
          </section>
        )}
      </form>
    </Modal>
  )
}
