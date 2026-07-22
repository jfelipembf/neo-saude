import { useState } from 'react'
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
import { useRoles } from '@/hooks/useRoles'
import {
  useCollaborators, useCreateCollaborator, useSetCollaboratorRole,
  useSetCollaboratorStatus, useResetCollaboratorPassword,
} from '@/hooks/useStaff'
import { userMessage } from '@/lib/errors'
import { IconPhone, IconEmail } from '@/components/icons'
import type { Collaborator } from '@/types/domain'
import styles from './CollaboratorsTab.module.scss'

/**
 * Aba "Colaboradores": membros da clínica COM login (recepção, gerência…),
 * cada um com um cargo da página de Cargos. Especialistas ficam de fora
 * (aparecem em Profissionais). O contratante cria o login com uma senha e o
 * colaborador já entra; o cargo define a que páginas ele tem acesso.
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
        { label: 'E-mail',   value: selected.email,  icon: <IconEmail /> },
        { label: 'Telefone', value: selected.phone,  icon: <IconPhone /> },
      ]
    : []

  return (
    <div className={styles.layout}>
      <SideList
        title="Colaboradores"
        size="lg"
        items={items}
        selectedId={selectedId}
        onSelect={id => setSelectedId(String(id))}
        onAdd={() => setCreating(true)}
        searchPlaceholder="Buscar colaborador..."
        emptyText="Nenhum colaborador cadastrado"
      />

      <div className={styles.formArea}>
        {!selected ? (
          <EmptyState
            title="Nenhum colaborador selecionado"
            description="Selecione um colaborador na lista ao lado, ou clique em + para cadastrar um novo login com cargo."
          />
        ) : (
          <div className={styles.formRoot}>
            <FormSection
              title={selected.name}
              description="Os dados de contato pertencem ao usuário e só ele os edita no próprio perfil."
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

      {creating && (
        <CreateCollaboratorModal
          roleOptions={roleOptions}
          onClose={() => setCreating(false)}
          onCreated={id => { setCreating(false); setSelectedId(id) }}
        />
      )}

      {passwordFor && (
        <ResetPasswordModal
          collaborator={passwordFor}
          onClose={() => setPasswordFor(null)}
        />
      )}
    </div>
  )
}

// ── Modal: novo colaborador (cria o login) ───────────────────────────────────
interface CreateModalProps {
  roleOptions: { value: string; label: string }[]
  onClose: () => void
  onCreated: (clinicUserId: string) => void
}

function CreateCollaboratorModal({ roleOptions, onClose, onCreated }: CreateModalProps) {
  const toast = useToast()
  const { mutate: create, isPending } = useCreateCollaborator()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState(roleOptions[0]?.value ?? '')
  const [error, setError] = useState('')

  function save() {
    if (!name.trim()) { setError('Informe o nome do colaborador.'); return }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError('Informe um e-mail válido.'); return }
    if (password.length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); return }
    if (!roleId) { setError('Selecione o cargo.'); return }

    create(
      { fullName: name.trim(), email: email.trim(), password, roleId },
      {
        onSuccess: () => { toast.success('Colaborador cadastrado! Ele já pode fazer login.'); onCreated('') },
        onError: e => setError(userMessage(e, 'Não foi possível criar o colaborador.')),
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Novo colaborador"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button loading={isPending} onClick={save}>Cadastrar</Button>
        </>
      }
    >
      <div className={styles.modalCorpo}>
        <Input
          label="Nome"
          placeholder="Ex: Ana Recepção"
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          autoFocus
        />
        <Input
          label="E-mail (login)"
          type="email"
          placeholder="colaborador@email.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          autoComplete="off"
        />
        <Input
          label="Senha"
          type="password"
          placeholder="Mínimo de 6 caracteres"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          autoComplete="new-password"
        />
        <Select
          label="Cargo"
          options={roleOptions}
          value={roleId}
          onChange={e => setRoleId(e.target.value)}
        />
        <p className={styles.dica}>
          O colaborador entra imediatamente com esse e-mail e senha. O acesso às
          páginas segue o cargo escolhido.
        </p>
        {error && <p className={styles.erro}>{error}</p>}
      </div>
    </Modal>
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
