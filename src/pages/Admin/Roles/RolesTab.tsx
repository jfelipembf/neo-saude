import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { SideList } from '@/components/SideList/SideList'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { APP_PAGES } from '@/constants'
import { useRoles, useSaveRole } from '@/hooks/useRoles'
import type { Role, AppPage } from '@/types/domain'
import styles from './RolesTab.module.scss'

interface RoleFormState {
  name: string
  pages: AppPage[]
}

const EMPTY_FORM: RoleFormState = { name: '', pages: ['dashboard'] }

/** Resumo do acesso para o sublabel da lista (ex.: "Acesso a 3 páginas"). */
function roleSummary(role: Role) {
  const n = role.pages.length
  return n === 0 ? 'Sem acesso a nenhuma página' : `Acesso a ${n} página${n === 1 ? '' : 's'}`
}

/**
 * Aba "Cargos": cada cargo (Recepcionista, Especialista…) tem um switch por
 * página do app dizendo o que ele pode acessar.
 */
export function RolesTab() {
  const toast = useToast()
  const { data: roles, isLoading } = useRoles()
  const { mutate: save, isPending: saving } = useSaveRole()

  const [selected, setSelected] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')

  if (isLoading) return <PageLoader />

  const list = roles ?? []
  const formVisible = selected !== null || isNew

  const items = list.map(c => ({ id: c.id, label: c.name, sublabel: roleSummary(c) }))

  function selectRole(id: string) {
    const role = list.find(c => c.id === id)
    if (!role) return
    setForm({ name: role.name, pages: [...role.pages] })
    setNameError('')
    setIsNew(false)
    setSelected(id)
  }

  function handleNew() {
    setForm(EMPTY_FORM)
    setNameError('')
    setSelected(null)
    setIsNew(true)
  }

  function handleCancel() {
    setSelected(null)
    setIsNew(false)
    setForm(EMPTY_FORM)
    setNameError('')
  }

  function togglePage(page: AppPage, enabled: boolean) {
    setForm(current => ({
      ...current,
      pages: enabled
        ? [...current.pages, page]
        : current.pages.filter(p => p !== page),
    }))
  }

  function handleSave() {
    if (!form.name.trim()) {
      setNameError('Dê um nome ao cargo.')
      return
    }
    save(
      { id: selected, payload: { name: form.name.trim(), pages: form.pages } },
      {
        onSuccess: () => {
          toast.success('Cargo salvo!')
          handleCancel()
        },
      },
    )
  }

  return (
    <div className={styles.layout}>
      <SideList
        title="Cargos"
        size="lg"
        items={items}
        selectedId={selected}
        onSelect={id => selectRole(String(id))}
        onAdd={handleNew}
        searchPlaceholder="Buscar cargo..."
        emptyText="Nenhum cargo cadastrado"
      />

      <div className={styles.formArea}>
        {!formVisible ? (
          <EmptyState
            title="Nenhum cargo selecionado"
            description="Selecione um cargo na lista ao lado ou crie um novo clicando em + para definir o acesso às páginas."
          />
        ) : (
          <>
            <div className={styles.formRoot}>
              <FormSection title={isNew ? 'Novo cargo' : 'Dados do cargo'}>
                <Input
                  label="Nome do cargo"
                  placeholder="Ex: Recepcionista"
                  value={form.name}
                  onChange={e => { setForm(current => ({ ...current, name: e.target.value })); setNameError('') }}
                  error={nameError}
                  autoFocus={isNew}
                />
              </FormSection>

              <FormSection title="Acesso às páginas">
                <p className={styles.dica}>
                  Ligue as páginas que este cargo pode acessar — as desligadas somem do menu
                  e ficam bloqueadas para quem tiver o cargo.
                </p>
                <div className={styles.permissoes}>
                  {APP_PAGES.map(p => (
                    <div key={p.value} className={styles.permissao}>
                      <Toggle
                        label={p.label}
                        checked={form.pages.includes(p.value)}
                        onChange={enabled => togglePage(p.value, enabled)}
                      />
                    </div>
                  ))}
                </div>
              </FormSection>
            </div>

            <div className={styles.acoesBar}>
              <Button variant="ghost" onClick={handleCancel} disabled={saving}>Cancelar</Button>
              <Button loading={saving} onClick={handleSave}>Salvar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
