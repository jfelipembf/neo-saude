import { useState } from 'react'
import { AddressFields } from '@/components/AddressFields/AddressFields'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Select } from '@/components/Select/Select'
import { SideList } from '@/components/SideList/SideList'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { SEX_OPTIONS, SEX_LABEL } from '@/constants'
import { useRoles } from '@/hooks/useRoles'
import {
  useCollaborators, useCreateCollaborator, useSetCollaboratorRole,
  useSetCollaboratorStatus, useResetCollaboratorPassword,
} from '@/hooks/useStaff'
import { userMessage } from '@/lib/errors'
import { cepToDb, phoneToDb } from '@/utils/text'
import { IconPhone, IconEmail, IconMessage } from '@/components/icons'
import type { Address, Collaborator, Gender } from '@/types/domain'
import styles from './CollaboratorsTab.module.scss'

/**
 * Aba "Colaboradores": membros da clínica COM login (recepção, gerência…),
 * cada um com um cargo da página de Cargos. Especialistas ficam de fora
 * (aparecem em Profissionais). O contratante cria o login com uma senha e o
 * colaborador já entra; o cargo define a que páginas ele tem acesso.
 *
 * O cadastro é um FORMULÁRIO INLINE na área de detalhe (não um modal): clicar
 * em + abre o formulário completo — dados pessoais, contato, endereço e cargo —
 * para preencher e salvar ali mesmo (pedido do dono).
 */
export function CollaboratorsTab() {
  const toast = useToast()
  const { data: collaborators, isLoading } = useCollaborators()
  const { data: roles } = useRoles()
  const { mutate: setRole, isPending: savingRole } = useSetCollaboratorRole()
  const { mutate: setStatus, isPending: savingStatus } = useSetCollaboratorStatus()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [passwordFor, setPasswordFor] = useState<Collaborator | null>(null)

  if (isLoading) return <PageLoader />

  const list = collaborators ?? []
  const selected = list.find(c => c.clinicUserId === selectedId) ?? null
  const roleOptions = (roles ?? []).map(r => ({ value: r.id, label: r.name }))

  const items = list.map(c => ({
    id: c.clinicUserId,
    label: c.name,
    sublabel: `${c.roleName}${c.status === 'suspended' ? ' · Suspenso' : ''}`,
    avatarUrl: c.photo,
    avatar: true,
  }))

  function changeRole(roleId: string) {
    if (!selected || roleId === selected.roleId) return
    setRole(
      { clinicUserId: selected.clinicUserId, roleId },
      {
        onSuccess: () => toast.success('Cargo atualizado!'),
        onError: e => toast.error(userMessage(e, 'Não foi possível trocar o cargo.')),
      },
    )
  }

  function toggleActive(active: boolean) {
    if (!selected) return
    setStatus(
      { clinicUserId: selected.clinicUserId, status: active ? 'active' : 'suspended' },
      {
        onSuccess: () => toast.success(active ? 'Colaborador reativado!' : 'Colaborador suspenso.'),
        onError: e => toast.error(userMessage(e, 'Não foi possível alterar o status.')),
      },
    )
  }

  const contacts = selected
    ? [
        { label: 'E-mail',   value: selected.email,    icon: <IconEmail /> },
        { label: 'Telefone', value: selected.phone,    icon: <IconPhone /> },
        { label: 'WhatsApp', value: selected.whatsapp, icon: <IconMessage /> },
      ]
    : []

  // Endereço em uma linha só (partes vazias somem) — exibição, não formulário.
  const address = selected
    ? [selected.cep, selected.state, selected.city, selected.neighborhood, selected.number ? `Nº ${selected.number}` : undefined]
        .filter(Boolean).join(' · ')
    : ''

  return (
    <div className={styles.layout}>
      <SideList
        title="Colaboradores"
        size="lg"
        items={items}
        selectedId={creating ? null : selectedId}
        onSelect={id => { setSelectedId(String(id)); setCreating(false) }}
        onAdd={() => { setCreating(true); setSelectedId(null) }}
        searchPlaceholder="Buscar colaborador..."
        emptyText="Nenhum colaborador cadastrado"
      />

      <div className={styles.formArea}>
        {creating ? (
          <NewCollaboratorForm
            roleOptions={roleOptions}
            onCancel={() => setCreating(false)}
            onCreated={() => setCreating(false)}
          />
        ) : !selected ? (
          <EmptyState
            title="Nenhum colaborador selecionado"
            description="Selecione um colaborador na lista ao lado, ou clique em + para cadastrar um novo login com cargo."
          />
        ) : (
          <div className={styles.formRoot}>
            <FormSection
              title={selected.name}
              description="Cadastro preenchido pela clínica ao criar o colaborador."
              actions={<Badge status={selected.status} />}
            >
              <ul className={styles.contatos}>
                {contacts.map(c => (
                  <li key={c.label} className={styles.contato}>
                    <span className={styles.contatoIcone}>{c.icon}</span>
                    <span className={styles.contatoTexto}>
                      <span className={styles.contatoLabel}>{c.label}</span>
                      <span className={styles.contatoValor}>{c.value || '—'}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <dl className={styles.cadastro}>
                <div className={styles.cadastroItem}>
                  <dt>Sexo</dt>
                  <dd>{selected.sex ? SEX_LABEL[selected.sex] : '—'}</dd>
                </div>
                <div className={styles.cadastroItem}>
                  <dt>Nascimento</dt>
                  <dd>{selected.birthDate ?? '—'}</dd>
                </div>
                <div className={styles.cadastroItem}>
                  <dt>Endereço</dt>
                  <dd>{address || '—'}</dd>
                </div>
              </dl>
            </FormSection>

            <FormSection
              title="Cargo e acesso"
              description="O cargo (definido na aba Cargos) decide a quais páginas este colaborador tem acesso."
              actions={
                <Toggle
                  label={selected.status === 'active' ? 'Ativo' : 'Suspenso'}
                  checked={selected.status === 'active'}
                  onChange={toggleActive}
                  disabled={savingStatus}
                />
              }
            >
              <Select
                label="Cargo"
                options={roleOptions}
                value={selected.roleId}
                onChange={e => changeRole(e.target.value)}
                disabled={savingRole}
              />
            </FormSection>

            <FormSection
              title="Acesso ao sistema"
              description="Redefina a senha caso o colaborador precise de uma nova."
            >
              <Button variant="outline" onClick={() => setPasswordFor(selected)}>
                Redefinir senha
              </Button>
            </FormSection>
          </div>
        )}
      </div>

      {passwordFor && (
        <ResetPasswordModal
          collaborator={passwordFor}
          onClose={() => setPasswordFor(null)}
        />
      )}
    </div>
  )
}

// ── Formulário inline: novo colaborador (cadastro completo + login) ──────────
interface NewCollaboratorFormProps {
  roleOptions: { value: string; label: string }[]
  onCancel: () => void
  onCreated: () => void
}

function NewCollaboratorForm({ roleOptions, onCancel, onCreated }: NewCollaboratorFormProps) {
  const toast = useToast()
  const { mutate: create, isPending } = useCreateCollaborator()

  // Dados pessoais
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [sex, setSex] = useState('')
  const [birthDateIso, setBirthDateIso] = useState('')
  // Contato
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  // Endereço — o bloco compartilhado (AddressFields) preenche estado/cidade/
  // bairro sozinho ao completar o CEP (ViaCEP), como no cadastro de pacientes.
  const [address, setAddress] = useState<Partial<Address>>({})
  // Cargo e acesso
  const [roleId, setRoleId] = useState(roleOptions[0]?.value ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function save() {
    // Mesmas travas do cadastro de pacientes: formato errado morre no
    // formulário, com mensagem — não vira erro críptico de banco.
    if (!firstName.trim()) { setError('Informe o nome do colaborador.'); return }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError('Informe um e-mail válido.'); return }
    if (phone.trim() && !phoneToDb(phone)) { setError('Telefone inválido — informe DDD + número (10 a 11 dígitos).'); return }
    if (whatsapp.trim() && !phoneToDb(whatsapp)) { setError('WhatsApp inválido — informe DDD + número (10 a 11 dígitos).'); return }
    if (address.cep?.trim() && !cepToDb(address.cep)) { setError('CEP inválido — são 8 dígitos (00000-000).'); return }
    if (password.length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); return }
    if (!roleId) { setError('Selecione o cargo.'); return }

    create(
      {
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        password,
        roleId,
        phone: phone.trim() || undefined,
        details: {
          sex: sex as Gender | '',
          birthDate: birthDateIso,
          whatsapp: whatsapp.trim(),
          cep: address.cep ?? '',
          state: address.state ?? '',
          city: address.city ?? '',
          neighborhood: address.neighborhood ?? '',
          number: address.number ?? '',
        },
      },
      {
        onSuccess: () => { toast.success('Colaborador cadastrado! Ele já pode fazer login.'); onCreated() },
        onError: e => setError(userMessage(e, 'Não foi possível criar o colaborador.')),
      },
    )
  }

  return (
    <div className={styles.formRoot}>
      <FormSection title="Dados pessoais" description="Cadastro do colaborador mantido pela clínica.">
        <div className={styles.grid2}>
          <Input label="Nome" placeholder="Maria" value={firstName} onChange={e => { setFirstName(e.target.value); setError('') }} autoFocus />
          <Input label="Sobrenome" placeholder="Oliveira" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <div className={styles.grid2}>
          <Select label="Sexo" options={SEX_OPTIONS} placeholder="Selecione..." value={sex} onChange={e => setSex(e.target.value)} />
          <Input label="Data de nascimento" type="date" value={birthDateIso} onChange={e => setBirthDateIso(e.target.value)} />
        </div>
      </FormSection>

      <FormSection title="Contato" description="O e-mail é o login de acesso ao sistema.">
        <Input
          label="E-mail"
          type="email"
          placeholder="maria@email.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          autoComplete="off"
        />
        <div className={styles.grid2}>
          <Input label="Telefone" type="tel" placeholder="(79) 3200-0000" value={phone} onChange={e => setPhone(e.target.value)} />
          <Input label="WhatsApp" type="tel" placeholder="(79) 99999-0000" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
        </div>
      </FormSection>

      <FormSection title="Endereço" description="Digite o CEP e o endereço se preenche sozinho.">
        <AddressFields
          value={address}
          onChange={(field, value) => { setAddress(a => ({ ...a, [field]: value })); setError('') }}
          showStreet={false}
        />
      </FormSection>

      <FormSection
        title="Cargo e acesso"
        description="O cargo decide a quais páginas o colaborador tem acesso; ele entra imediatamente com o e-mail e a senha definidos aqui."
      >
        <div className={styles.grid2}>
          <Select label="Cargo" options={roleOptions} value={roleId} onChange={e => { setRoleId(e.target.value); setError('') }} />
          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo de 6 caracteres"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            autoComplete="new-password"
          />
        </div>
        {error && <p className={styles.erro}>{error}</p>}
      </FormSection>

      <div className={styles.acoesForm}>
        <Button variant="ghost" onClick={onCancel} disabled={isPending}>Cancelar</Button>
        <Button loading={isPending} onClick={save}>Cadastrar colaborador</Button>
      </div>
    </div>
  )
}

// ── Modal: redefinir senha ───────────────────────────────────────────────────
function ResetPasswordModal({ collaborator, onClose }: { collaborator: Collaborator; onClose: () => void }) {
  const toast = useToast()
  const { mutate: reset, isPending } = useResetCollaboratorPassword()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function save() {
    if (password.length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); return }
    reset(
      { userId: collaborator.userId, password },
      {
        onSuccess: () => { toast.success('Senha redefinida!'); onClose() },
        onError: e => setError(userMessage(e, 'Não foi possível redefinir a senha.')),
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Redefinir senha — ${collaborator.name}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button loading={isPending} onClick={save}>Salvar senha</Button>
        </>
      }
    >
      <div className={styles.modalCorpo}>
        <Input
          label="Nova senha"
          type="password"
          placeholder="Mínimo de 6 caracteres"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          autoComplete="new-password"
          autoFocus
        />
        {error && <p className={styles.erro}>{error}</p>}
      </div>
    </Modal>
  )
}
