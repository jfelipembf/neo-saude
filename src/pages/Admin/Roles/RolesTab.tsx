import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { SideList } from '@/components/SideList/SideList'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { PAGINAS_APP } from '@/constants'
import { useCargos, useSalvarCargo } from '@/hooks/useCargos'
import type { Role, AppPage } from '@/types/domain'
import styles from './RolesTab.module.scss'

interface CargoFormState {
  nome: string
  paginas: AppPage[]
}

const FORM_VAZIO: CargoFormState = { nome: '', paginas: ['dashboard'] }

/** Resumo do acesso para o sublabel da lista (ex.: "Acesso a 3 páginas"). */
function resumoCargo(c: Role) {
  const n = c.paginas.length
  return n === 0 ? 'Sem acesso a nenhuma página' : `Acesso a ${n} página${n === 1 ? '' : 's'}`
}

/**
 * Aba "Cargos": cada cargo (Recepcionista, Especialista…) tem um switch por
 * página do app dizendo o que ele pode acessar.
 */
export function RolesTab() {
  const toast = useToast()
  const { data: cargos, isLoading } = useCargos()
  const { mutate: salvar, isPending: salvando } = useSalvarCargo()

  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [novo, setNovo] = useState(false)
  const [form, setForm] = useState<CargoFormState>(FORM_VAZIO)
  const [erroNome, setErroNome] = useState('')

  if (isLoading) return <PageLoader />

  const lista = cargos ?? []
  const formVisivel = selecionado !== null || novo

  const items = lista.map(c => ({ id: c.id, label: c.nome, sublabel: resumoCargo(c) }))

  function selecionar(id: string) {
    const cargo = lista.find(c => c.id === id)
    if (!cargo) return
    setForm({ nome: cargo.nome, paginas: [...cargo.paginas] })
    setErroNome('')
    setNovo(false)
    setSelecionado(id)
  }

  function aoNovo() {
    setForm(FORM_VAZIO)
    setErroNome('')
    setSelecionado(null)
    setNovo(true)
  }

  function aoCancelar() {
    setSelecionado(null)
    setNovo(false)
    setForm(FORM_VAZIO)
    setErroNome('')
  }

  function alternarPagina(pagina: AppPage, ligada: boolean) {
    setForm(atual => ({
      ...atual,
      paginas: ligada
        ? [...atual.paginas, pagina]
        : atual.paginas.filter(p => p !== pagina),
    }))
  }

  function aoSalvar() {
    if (!form.nome.trim()) {
      setErroNome('Dê um nome ao cargo.')
      return
    }
    salvar(
      { id: selecionado, dados: { nome: form.nome.trim(), paginas: form.paginas } },
      {
        onSuccess: () => {
          toast.success('Cargo salvo!')
          aoCancelar()
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
        selectedId={selecionado}
        onSelect={id => selecionar(String(id))}
        onAdd={aoNovo}
        searchPlaceholder="Buscar cargo..."
        emptyText="Nenhum cargo cadastrado"
      />

      <div className={styles.formArea}>
        {!formVisivel ? (
          <EmptyState
            title="Nenhum cargo selecionado"
            description="Selecione um cargo na lista ao lado ou crie um novo clicando em + para definir o acesso às páginas."
          />
        ) : (
          <>
            <div className={styles.formRoot}>
              <FormSection title={novo ? 'Novo cargo' : 'Dados do cargo'}>
                <Input
                  label="Nome do cargo"
                  placeholder="Ex: Recepcionista"
                  value={form.nome}
                  onChange={e => { setForm(atual => ({ ...atual, nome: e.target.value })); setErroNome('') }}
                  error={erroNome}
                  autoFocus={novo}
                />
              </FormSection>

              <FormSection title="Acesso às páginas">
                <p className={styles.dica}>
                  Ligue as páginas que este cargo pode acessar — as desligadas somem do menu
                  e ficam bloqueadas para quem tiver o cargo.
                </p>
                <div className={styles.permissoes}>
                  {PAGINAS_APP.map(p => (
                    <div key={p.value} className={styles.permissao}>
                      <Toggle
                        label={p.label}
                        checked={form.paginas.includes(p.value)}
                        onChange={ligada => alternarPagina(p.value, ligada)}
                      />
                    </div>
                  ))}
                </div>
              </FormSection>
            </div>

            <div className={styles.acoesBar}>
              <Button variant="ghost" onClick={aoCancelar} disabled={salvando}>Cancelar</Button>
              <Button loading={salvando} onClick={aoSalvar}>Salvar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
