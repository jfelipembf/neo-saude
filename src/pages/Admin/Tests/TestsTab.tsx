import { useMemo, useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Select } from '@/components/Select/Select'
import { SideList } from '@/components/SideList/SideList'
import type { SideListItem } from '@/components/SideList/SideList'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/Toast'
import { IconPlus, IconTrash, IconX } from '@/components/icons'
import { useCreateTest, useDeleteTest, useTests, useUpdateTest } from '@/hooks/useTests'
import type { EditTest } from '@/services/testsService'
import { TEST_SPECIALTY_OPTIONS, OTHER_TEST_SPECIALTY } from '@/constants'
import type { PhysioTest, PhysioTestLevel, TestKind, TestScoringKind } from '@/types/domain'
import { TestItemsEditor } from './TestItemsEditor'
import { itemToForm, itemsToPayload, validateItems } from './testItemsForm'
import type { ItemFormState } from './testItemsForm'
import styles from './TestsTab.module.scss'

// Um "teste" de fisioterapia = nome + especialização + imagem + instruções +
// uma lista ordenada de NÍVEIS (ex.: escala Oxford de força, EVA de dor). O
// catálogo é a base do menu de seleção da aba Testes do paciente. O cadastro
// é sempre CONFIGURAÇÃO (nome/instruções/níveis/foto ilustrativa) — a
// ferramenta de medição interativa (goniômetro digital) só existe na
// aplicação ao paciente (aba Testes do perfil), nunca aqui.

const SPECIALTY_SELECT_OPTIONS = [
  ...TEST_SPECIALTY_OPTIONS.map(s => ({ value: s, label: s })),
  { value: OTHER_TEST_SPECIALTY, label: 'Outra (digitar)' },
]

const KIND_OPTIONS: { value: TestKind; label: string }[] = [
  { value: 'scale', label: 'Escala' },
  { value: 'goniometry', label: 'Ângulo' },
]

/** Um nível no formulário. Os limites ficam como TEXTO enquanto se edita:
 *  guardados como número, apagar o campo para redigitar viraria 0 — e 0 é um
 *  limite legítimo em quase toda escala, então o engano passaria despercebido. */
interface LevelFormState {
  id: string
  name: string
  description: string
  minScore: string
  maxScore: string
}

let levelSeq = 0
// `id` local só para key/edição em tela — o banco sempre gera um id novo
// (replaceLevels é delete-then-insert).
const newLevel = (): LevelFormState => ({ id: `lv-${++levelSeq}`, name: '', description: '', minScore: '', maxScore: '' })

/** Campo de limite vazio = faixa ABERTA daquele lado, não zero. */
function parseLimit(text: string): number | undefined {
  const raw = text.trim().replace(',', '.')
  if (!raw) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

const limitToText = (value?: number) => (value == null ? '' : String(value))

interface TestFormState {
  name: string
  kind: TestKind
  // image é só para EXIBIÇÃO no PhotoInput (pode ser uma URL já assinada, ao
  // editar um teste existente); imagePath é o que de fato é salvo — sem essa
  // separação, salvar sem trocar a foto gravaria a URL assinada (que expira
  // em 1h) na coluna, corrompendo-a na próxima leitura.
  image?: string
  imagePath?: string
  /** Valor do Select: uma das TEST_SPECIALTY_OPTIONS ou o sentinela "outra". */
  specialty: string
  /** Texto digitado quando specialty === OTHER_TEST_SPECIALTY. */
  customSpecialty: string
  instructions: string
  levels: LevelFormState[]
  /**
   * Motor de escore e itens do instrumento (ver TestItemsEditor). Os itens
   * viajam SEMPRE no formulário, mesmo com a pontuação em 'manual': o syncItems
   * trata o payload como a lista inteira, então salvar um Berg para corrigir o
   * nome com `items: []` apagaria os 14 itens semeados.
   */
  scoringKind: TestScoringKind
  items: ItemFormState[]
}

const EMPTY_FORM: TestFormState = {
  name: '', kind: 'scale', image: undefined, imagePath: undefined, specialty: '', customSpecialty: '', instructions: '',
  levels: [newLevel()],
  // Teste novo nasce com escore digitado à mão: sem item cadastrado, 'sum_items'
  // abriria um formulário sem nada a responder (ver isItemScored).
  scoringKind: 'manual', items: [],
}

/** Um nível do catálogo vira linha do formulário. Carregar min/max aqui não é
 *  detalhe: replaceLevels é delete-then-insert, então o que NÃO estiver no
 *  formulário na hora de salvar deixa de existir — editar só um nome apagaria
 *  as faixas semeadas dos outros níveis. */
const levelToForm = (l: PhysioTestLevel): LevelFormState => ({
  id: l.id,
  name: l.name,
  description: l.description,
  minScore: limitToText(l.minScore),
  maxScore: limitToText(l.maxScore),
})

/** A especialização já é uma das opções fixas, ou entra como "outra" digitada. */
function formFromTest(t: PhysioTest): TestFormState {
  const known = (TEST_SPECIALTY_OPTIONS as readonly string[]).includes(t.specialty)
  return {
    name: t.name,
    kind: t.kind,
    image: t.imageUrl,
    imagePath: t.imagePath,
    specialty: known ? t.specialty : OTHER_TEST_SPECIALTY,
    customSpecialty: known ? '' : t.specialty,
    instructions: t.instructions ?? '',
    levels: t.levels.length ? t.levels.map(levelToForm) : [newLevel()],
    scoringKind: t.scoringKind,
    items: t.items.map(itemToForm),
  }
}

/** Aba "Testes" (fisioterapia): catálogo de testes/escalas de avaliação. Lista
 *  lateral + formulário ao lado. */
export function TestsTab() {
  const toast = useToast()
  const { data: tests = [] } = useTests()
  const { mutate: create, isPending: creating } = useCreateTest()
  const { mutate: update, isPending: updating } = useUpdateTest()
  const { mutate: remove, isPending: deleting } = useDeleteTest()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<TestFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')
  const [specialtyError, setSpecialtyError] = useState('')
  const [itemsError, setItemsError] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  // Filtro do menu suspenso da lista lateral ('' = todas as especialidades).
  const [specialtyFilter, setSpecialtyFilter] = useState('')

  const isFormVisible = selectedId !== null || isNew
  const isOtherSpecialty = form.specialty === OTHER_TEST_SPECIALTY
  const selectedTest = selectedId ? (tests.find(t => t.id === selectedId) ?? null) : null

  // Opções do filtro: a lista fixa ∪ especializações "outras" já cadastradas —
  // um teste com especialização digitada continua filtrável.
  const filterOptions = useMemo(() => {
    const extra = tests
      .map(t => t.specialty)
      .filter(s => !(TEST_SPECIALTY_OPTIONS as readonly string[]).includes(s))
    const all = [...TEST_SPECIALTY_OPTIONS, ...new Set(extra)]
    return [{ value: '', label: 'Todas as especialidades' }, ...all.map(s => ({ value: s, label: s }))]
  }, [tests])

  const filteredTests = specialtyFilter ? tests.filter(t => t.specialty === specialtyFilter) : tests

  // Sem avatar aqui de propósito: a foto do teste aparece no FORMULÁRIO
  // (preview de imagem), não faz sentido repetir/recortar no sidemenu.
  const items: SideListItem[] = filteredTests.map(t => {
    // O que o teste É, em uma linha: o instrumento somado por itens se anuncia
    // pelos ITENS (é o que o profissional vai responder), não pelas faixas.
    const detail = t.kind === 'goniometry'
      ? 'Ângulo'
      : t.scoringKind === 'sum_items'
        ? `${t.items.length} ${t.items.length === 1 ? 'item' : 'itens'}`
        : `${t.levels.length} ${t.levels.length === 1 ? 'nível' : 'níveis'}`
    return { id: t.id, label: t.name, sublabel: `${t.specialty} · ${detail}` }
  })

  function clearErrors() { setNameError(''); setSpecialtyError(''); setItemsError('') }

  function handleSelect(id: string | number) {
    const t = tests.find(x => x.id === String(id))
    if (!t) return
    setSelectedId(String(id)); setIsNew(false); setForm(formFromTest(t)); clearErrors()
  }
  function handleNew() {
    setSelectedId(null); setIsNew(true)
    setForm({ ...EMPTY_FORM, levels: [newLevel()] })
    clearErrors()
  }
  function handleCancel() { setSelectedId(null); setIsNew(false); setForm(EMPTY_FORM); clearErrors() }

  // ── Níveis (lista dinâmica) ──
  const addLevel = () => setForm(f => ({ ...f, levels: [...f.levels, newLevel()] }))
  const removeLevel = (id: string) =>
    setForm(f => ({ ...f, levels: f.levels.length > 1 ? f.levels.filter(l => l.id !== id) : f.levels }))
  const updateLevel = (id: string, field: 'name' | 'description' | 'minScore' | 'maxScore', value: string) =>
    setForm(f => ({ ...f, levels: f.levels.map(l => (l.id === id ? { ...l, [field]: value } : l)) }))

  function handleSave() {
    if (!form.name.trim()) { setNameError('Informe o nome do teste.'); return }
    if (!form.specialty) { setSpecialtyError('Selecione a especialização.'); return }
    if (isOtherSpecialty && !form.customSpecialty.trim()) {
      setSpecialtyError('Digite a especialização.'); return
    }
    const itemsProblem = validateItems(form.scoringKind, form.items)
    if (itemsProblem) { setItemsError(itemsProblem); return }
    const specialty = isOtherSpecialty ? form.customSpecialty.trim() : form.specialty
    const payload: EditTest = {
      name: form.name.trim(),
      kind: form.kind,
      imageUrl: form.imagePath,
      specialty,
      instructions: form.instructions.trim() || undefined,
      levels: form.levels
        .filter(l => l.name.trim() || l.description.trim())
        .map(l => ({
          name: l.name.trim(),
          description: l.description.trim(),
          minScore: parseLimit(l.minScore),
          maxScore: parseLimit(l.maxScore),
        })),
      scoringKind: form.scoringKind,
      items: itemsToPayload(form.items),
    }
    // O syncItems recusa apagar item JÁ RESPONDIDO em alguma aplicação, e a
    // mensagem dele diz QUAL item e o que fazer. Só `Error` de verdade é
    // repassado (mesmo critério do excluir, abaixo): o erro cru do Postgres é
    // um objeto simples, e o texto dele é técnico e expõe o schema.
    const onError = (err: unknown) =>
      setItemsError(err instanceof Error ? err.message : 'Não foi possível salvar o teste.')
    if (selectedId) {
      update({ id: selectedId, payload }, {
        onSuccess: () => { toast.success('Teste atualizado!'); setIsNew(false); setItemsError('') },
        onError,
      })
    } else {
      create(payload, {
        onSuccess: newId => { toast.success('Teste criado!'); setSelectedId(newId); setIsNew(false); setItemsError('') },
        onError,
      })
    }
  }

  function handleConfirmDelete() {
    if (!selectedId) return
    remove(selectedId, {
      onSuccess: () => { toast.success('Teste excluído!'); handleCancel() },
      onError: err => toast.error(err instanceof Error ? err.message : 'Não foi possível excluir o teste.'),
    })
  }

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <Select
          size="sm"
          options={filterOptions}
          value={specialtyFilter}
          onChange={e => setSpecialtyFilter(e.target.value)}
          aria-label="Filtrar por especialidade"
        />
        <SideList
          title="Testes"
          size="lg"
          items={items}
          selectedId={selectedId}
          onSelect={handleSelect}
          onAdd={handleNew}
          hideSearch
          emptyText={specialtyFilter ? 'Nenhum teste nesta especialidade' : 'Nenhum teste cadastrado'}
        />
      </div>

      <div className={styles.formArea}>
        {!isFormVisible ? (
          <EmptyState
            title="Nenhum teste selecionado"
            description="Selecione um teste na lista ao lado ou crie um novo clicando em +."
          />
        ) : (
          <>
            <div className={styles.formRoot}>
              <FormSection title={isNew ? 'Novo teste' : (form.name || 'Teste')}>
                <Input
                  label="Nome do teste"
                  placeholder="Ex: Força Muscular (Oxford), EVA de dor..."
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setNameError('') }}
                  error={nameError}
                />

                <div className={styles.tipoLinha}>
                  <span className={styles.tipoLabel}>Tipo de teste</span>
                  <SegmentedControl
                    options={KIND_OPTIONS}
                    value={form.kind}
                    // Ângulo NÃO se responde item a item: o escore é o que o
                    // goniômetro mede na foto. Virar para 'goniometry' devolve a
                    // pontuação a 'manual' — os itens ficam guardados no
                    // formulário e voltam se o tipo voltar a Escala.
                    onChange={v => setForm(f => ({
                      ...f, kind: v, scoringKind: v === 'goniometry' ? 'manual' : f.scoringKind,
                    }))}
                  />
                </div>

                <PhotoInput
                  label="Imagem ilustrativa"
                  value={form.image}
                  onChange={url => setForm(f => ({ ...f, image: url, imagePath: url }))}
                  folder="tests"
                />

                <div className={styles.especializacaoLinha}>
                  <Select
                    label="Especialização"
                    options={SPECIALTY_SELECT_OPTIONS}
                    value={form.specialty}
                    onChange={e => { setForm(f => ({ ...f, specialty: e.target.value })); setSpecialtyError('') }}
                    placeholder="Selecione a especialização"
                    error={!isOtherSpecialty ? specialtyError : undefined}
                  />
                  {isOtherSpecialty && (
                    <Input
                      label="Especialização (digitar)"
                      placeholder="Ex: Uroginecológica, Oncofuncional..."
                      value={form.customSpecialty}
                      onChange={e => { setForm(f => ({ ...f, customSpecialty: e.target.value })); setSpecialtyError('') }}
                      error={isOtherSpecialty ? specialtyError : undefined}
                    />
                  )}
                </div>

                <div className={styles.instrucoes}>
                  <Textarea
                    label="Instruções"
                    placeholder="Como o teste é realizado: preparo, comando dado ao paciente, o que o examinador observa/mede..."
                    rows={4}
                    value={form.instructions}
                    onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  />
                </div>
              </FormSection>

              {/* ── Níveis ── */}
              <FormSection
                title="Níveis"
                description={
                  form.kind === 'goniometry'
                    ? 'A interpretação da faixa de graus (ex.: "0° – 90°" → "Amplitude limitada"). Mín./Máx. classificam o ângulo medido automaticamente.'
                    : 'Mín./Máx. são a faixa de resultado do nível — é por eles que o resultado medido no paciente cai sozinho no nível certo. Deixe em branco o lado ABERTO ("< 10 segundos" só tem Máx.) e os dois em branco quando o nível não tiver corte numérico.'
                }
                actions={<Button size="sm" variant="ghost" iconLeft={<IconPlus />} onClick={addLevel}>Adicionar nível</Button>}
              >
                <ol className={styles.niveis}>
                  {form.levels.map((lv, i) => (
                    <li key={lv.id} className={styles.nivel}>
                      <span className={styles.nivelNum}>{i + 1}</span>
                      <Input
                        aria-label={`Nome do nível ${i + 1}`}
                        placeholder="Nível (ex: Grau 3)"
                        value={lv.name}
                        onChange={e => updateLevel(lv.id, 'name', e.target.value)}
                        className={styles.nivelNome}
                      />
                      <Input
                        aria-label={`Descrição do nível ${i + 1}`}
                        placeholder="Descrição do que o nível representa"
                        value={lv.description}
                        onChange={e => updateLevel(lv.id, 'description', e.target.value)}
                        className={styles.nivelDesc}
                      />
                      {/* Mín. e Máx. numa célula só do grid — assim o par não
                          se separa quando o layout empilha no celular. */}
                      <div className={styles.nivelFaixa}>
                        <Input
                          aria-label={`Resultado mínimo do nível ${i + 1}`}
                          type="number"
                          step="any"
                          inputMode="decimal"
                          placeholder="Mín."
                          value={lv.minScore}
                          onChange={e => updateLevel(lv.id, 'minScore', e.target.value)}
                        />
                        <Input
                          aria-label={`Resultado máximo do nível ${i + 1}`}
                          type="number"
                          step="any"
                          inputMode="decimal"
                          placeholder="Máx."
                          value={lv.maxScore}
                          onChange={e => updateLevel(lv.id, 'maxScore', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.nivelRemover}
                        title="Remover nível"
                        aria-label={`Remover nível ${i + 1}`}
                        onClick={() => removeLevel(lv.id)}
                        disabled={form.levels.length <= 1}
                      >
                        <IconX />
                      </button>
                    </li>
                  ))}
                </ol>
              </FormSection>

              {/* ── Itens e pontuação ── */}
              {/* Só na Escala: no Ângulo o escore é o que o goniômetro mede. */}
              {form.kind === 'scale' && (
                <TestItemsEditor
                  scoringKind={form.scoringKind}
                  onScoringKindChange={kind => { setForm(f => ({ ...f, scoringKind: kind })); setItemsError('') }}
                  items={form.items}
                  onChange={items => { setForm(f => ({ ...f, items })); setItemsError('') }}
                  isSeed={Boolean(selectedTest?.isSeed)}
                  error={itemsError || undefined}
                />
              )}
            </div>

            <div className={styles.acoesBar}>
              {!isNew && selectedTest && (
                selectedTest.isSeed ? (
                  <span className={styles.seedAviso}>Teste padrão do sistema — não pode ser excluído.</span>
                ) : (
                  <Button variant="danger" iconLeft={<IconTrash />} onClick={() => setConfirmDeleteOpen(true)}>
                    Excluir
                  </Button>
                )
              )}
              <div className={styles.acoesBarDireita}>
                <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
                <Button onClick={handleSave} loading={creating || updating}>
                  {isNew ? 'Cadastrar' : 'Salvar alterações'}
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
        title="Excluir teste"
        message={selectedTest ? `Deseja excluir "${selectedTest.name}" do catálogo? Essa ação não pode ser desfeita.` : ''}
        variant="danger"
        confirmDisabled={deleting}
      />
    </div>
  )
}
