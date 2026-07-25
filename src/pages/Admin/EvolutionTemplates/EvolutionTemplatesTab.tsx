import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { SideList } from '@/components/SideList/SideList'
import type { SideListItem } from '@/components/SideList/SideList'
import { SoapEditor } from '@/components/SoapEditor/SoapEditor'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/Toast'
import { IconTrash } from '@/components/icons'
import {
  useCreateEvolutionTemplate, useDeleteEvolutionTemplate, useEvolutionTemplates, useUpdateEvolutionTemplate,
} from '@/hooks/useEvolutionTemplates'
import { isBlankSoap, normalizeSoapNote } from '@/utils/soap'
import type { EvolutionTemplate, SoapNote } from '@/types/domain'
import styles from './EvolutionTemplatesTab.module.scss'

// Um "modelo de evolução" = nome + quando usar + uma nota SOAP pré-escrita. É
// o catálogo do botão "usar modelo" do prontuário (Agenda e chamada de turma):
// fisioterapeuta atende de 30 em 30 minutos, e digitar os mesmos cabeçalhos de
// "Avaliação inicial" a cada primeira consulta é o atrito que faz a evolução
// não ser escrita.
//
// O modelo guarda a nota no MESMO formato do prontuário (o banco valida os dois
// com a mesma private.is_soap_note), então aqui embaixo é literalmente o mesmo
// SoapEditor da Agenda — o que se cadastra é o que se vai ver ao aplicar.

interface TemplateFormState {
  name: string
  description: string
  note: SoapNote
  active: boolean
}

const EMPTY_FORM: TemplateFormState = { name: '', description: '', note: {}, active: true }

const formFromTemplate = (template: EvolutionTemplate): TemplateFormState => ({
  name: template.name,
  description: template.description ?? '',
  note: template.note,
  active: template.status === 'active',
})

/** Aba "Modelos de evolução" (fisioterapia): catálogo de prontuários SOAP
 *  prontos. Lista lateral + formulário ao lado, mesmo desenho de Testes. */
export function EvolutionTemplatesTab() {
  const toast = useToast()
  const { data: templates = [] } = useEvolutionTemplates()
  const { mutate: create, isPending: creating } = useCreateEvolutionTemplate()
  const { mutate: update, isPending: updating } = useUpdateEvolutionTemplate()
  const { mutate: remove, isPending: deleting } = useDeleteEvolutionTemplate()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<TemplateFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')
  const [noteError, setNoteError] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const isFormVisible = selectedId !== null || isNew
  const selectedTemplate = selectedId ? (templates.find(t => t.id === selectedId) ?? null) : null

  // Inativo continua na LISTA (é onde se reativa), só sai do menu do
  // prontuário — é como a clínica "remove" um modelo padrão, que a policy de
  // delete proíbe apagar.
  const items: SideListItem[] = templates.map(template => ({
    id: template.id,
    label: template.name,
    sublabel: [
      template.status === 'inactive' ? 'Inativo' : null,
      template.isSeed ? 'Modelo padrão' : null,
      template.description,
    ].filter(Boolean).join(' · ') || undefined,
  }))

  function handleSelect(id: string | number) {
    const template = templates.find(t => t.id === String(id))
    if (!template) return
    setSelectedId(String(id)); setIsNew(false); setForm(formFromTemplate(template))
    setNameError(''); setNoteError('')
  }
  function handleNew() {
    setSelectedId(null); setIsNew(true); setForm(EMPTY_FORM); setNameError(''); setNoteError('')
  }
  function handleCancel() {
    setSelectedId(null); setIsNew(false); setForm(EMPTY_FORM); setNameError(''); setNoteError('')
  }

  function handleSave() {
    if (!form.name.trim()) { setNameError('Informe o nome do modelo.'); return }
    // O banco recusa modelo sem nenhuma seção (note é NOT NULL e o CHECK
    // rejeita '{}') — a tela diz o porquê antes de levar o erro de constraint.
    const note = normalizeSoapNote(form.note)
    if (!note) { setNoteError('Preencha ao menos uma das quatro seções do modelo.'); return }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      note,
      status: (form.active ? 'active' : 'inactive') as EvolutionTemplate['status'],
    }
    const onError = (err: unknown) =>
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o modelo.')

    if (selectedId) {
      update({ id: selectedId, payload }, {
        onSuccess: () => { toast.success('Modelo atualizado!'); setIsNew(false) },
        onError,
      })
    } else {
      create(payload, {
        onSuccess: newId => { toast.success('Modelo criado!'); setSelectedId(newId); setIsNew(false) },
        onError,
      })
    }
  }

  function handleConfirmDelete() {
    if (!selectedId) return
    remove(selectedId, {
      onSuccess: () => { toast.success('Modelo excluído!'); handleCancel() },
      onError: err => toast.error(err instanceof Error ? err.message : 'Não foi possível excluir o modelo.'),
    })
  }

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <SideList
          title="Modelos"
          size="lg"
          items={items}
          selectedId={selectedId}
          onSelect={handleSelect}
          onAdd={handleNew}
          searchPlaceholder="Buscar modelo..."
          emptyText="Nenhum modelo cadastrado"
        />
      </div>

      <div className={styles.formArea}>
        {!isFormVisible ? (
          <EmptyState
            title="Nenhum modelo selecionado"
            description="Selecione um modelo na lista ao lado ou crie um novo clicando em +."
          />
        ) : (
          <>
            <div className={styles.formRoot}>
              <FormSection
                title={isNew ? 'Novo modelo' : (form.name || 'Modelo')}
                actions={
                  <Toggle
                    label="Ativo"
                    checked={form.active}
                    onChange={active => setForm(f => ({ ...f, active }))}
                  />
                }
                description="Modelo inativo some do menu “Usar modelo” do prontuário sem sair deste catálogo."
              >
                <Input
                  label="Nome do modelo"
                  placeholder="Ex: Avaliação inicial, Sessão de cinesioterapia..."
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setNameError('') }}
                  error={nameError}
                />
                <Textarea
                  label="Quando usar"
                  placeholder="Uma linha dizendo em que atendimento este modelo se aplica — aparece ao lado do nome no menu."
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </FormSection>

              <FormSection
                title="Conteúdo do modelo"
                description="O que vai aparecer no prontuário quando alguém aplicar este modelo. Escreva ESTRUTURA (os cabeçalhos que o profissional completa), não conduta pronta: modelo com texto clínico fechado ou vira ruído que ninguém lê, ou vira evolução falsa que alguém salva sem editar. Seção deixada em branco não é tocada ao aplicar."
              >
                <SoapEditor
                  value={form.note}
                  onChange={note => { setForm(f => ({ ...f, note })); setNoteError('') }}
                />
                {noteError && <p className={styles.noteErro}>{noteError}</p>}
              </FormSection>
            </div>

            <div className={styles.acoesBar}>
              {!isNew && selectedTemplate && (
                selectedTemplate.isSeed ? (
                  // A trava real é a policy de delete (exige is_seed = false);
                  // aqui a tela só evita o clique que voltaria com erro.
                  <span className={styles.seedAviso}>
                    Modelo padrão do sistema — não pode ser excluído. Desligue “Ativo” para tirá-lo do menu.
                  </span>
                ) : (
                  <Button variant="danger" iconLeft={<IconTrash />} onClick={() => setConfirmDeleteOpen(true)}>
                    Excluir
                  </Button>
                )
              )}
              <div className={styles.acoesBarDireita}>
                <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
                <Button onClick={handleSave} loading={creating || updating} disabled={isBlankSoap(form.note) && !form.name}>
                  {isNew ? 'Cadastrar' : 'Salvar'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir modelo"
        message={selectedTemplate
          ? `Deseja excluir "${selectedTemplate.name}" do catálogo? As evoluções já escritas com ele não mudam — o modelo é copiado para o prontuário, nunca referenciado.`
          : ''}
        variant="danger"
        confirmDisabled={deleting}
      />
    </div>
  )
}
