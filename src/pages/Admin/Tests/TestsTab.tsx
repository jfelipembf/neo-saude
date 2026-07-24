import { useMemo, useState } from 'react'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { SideList } from '@/components/SideList/SideList'
import type { SideListItem } from '@/components/SideList/SideList'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { IconPlus, IconX, IconCamera } from '@/components/icons'
import { MOCK_PHYSIO_TESTS } from '@/mocks/physioTests'
import type { PhysioTest, TestLevel } from '@/mocks/physioTests'
import { TEST_SPECIALTY_OPTIONS, OTHER_TEST_SPECIALTY } from '@/constants/testSpecialty'
import styles from './TestsTab.module.scss'

// UI de demonstração (estado LOCAL, ainda sem banco). Um "teste" de fisioterapia
// = nome + especialização + imagem ilustrativa + instruções + uma lista ordenada
// de NÍVEIS (ex.: escala Oxford de força, EVA de dor). O catálogo inicial (Berg,
// TUG, TC6, Barthel, Roland-Morris, Fugl-Meyer…) vive em mocks/physioTests.ts.
// Depois isto vira tabela no Supabase.

const SPECIALTY_SELECT_OPTIONS = [
  ...TEST_SPECIALTY_OPTIONS.map(s => ({ value: s, label: s })),
  { value: OTHER_TEST_SPECIALTY, label: 'Outra (digitar)' },
]

let seq = 0
let levelSeq = 0
const newLevel = (name = '', description = ''): TestLevel => ({ id: `lv-${++levelSeq}`, name, description })

interface TestFormState {
  name: string
  image: string       // URL de preview (mock)
  /** Valor do Select: uma das TEST_SPECIALTY_OPTIONS ou o sentinela "outra". */
  specialty: string
  /** Texto digitado quando specialty === OTHER_TEST_SPECIALTY. */
  customSpecialty: string
  instructions: string
  levels: TestLevel[]
}

const EMPTY_FORM: TestFormState = {
  name: '', image: '', specialty: '', customSpecialty: '', instructions: '', levels: [newLevel()],
}

/** A especialização já é uma das opções fixas, ou entra como "outra" digitada. */
function formFromTest(t: PhysioTest): TestFormState {
  const known = (TEST_SPECIALTY_OPTIONS as readonly string[]).includes(t.specialty)
  return {
    name: t.name,
    image: t.image ?? '',
    specialty: known ? t.specialty : OTHER_TEST_SPECIALTY,
    customSpecialty: known ? '' : t.specialty,
    instructions: t.instructions ?? '',
    levels: t.levels.length ? t.levels.map(l => ({ ...l })) : [newLevel()],
  }
}

/** Aba "Testes" (fisioterapia): catálogo de testes/escalas de avaliação. Lista
 *  lateral + formulário ao lado. UI de demonstração — CRUD em estado local. */
export function TestsTab() {
  const toast = useToast()
  const [tests, setTests] = useState<PhysioTest[]>(MOCK_PHYSIO_TESTS)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<TestFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')
  const [specialtyError, setSpecialtyError] = useState('')
  // Filtro do menu suspenso da lista lateral ('' = todas as especialidades).
  const [specialtyFilter, setSpecialtyFilter] = useState('')

  const isFormVisible = selectedId !== null || isNew
  const isOtherSpecialty = form.specialty === OTHER_TEST_SPECIALTY

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

  const items: SideListItem[] = filteredTests.map(t => ({
    id: t.id,
    label: t.name,
    sublabel: `${t.specialty} · ${t.levels.length} ${t.levels.length === 1 ? 'nível' : 'níveis'}`,
    avatarUrl: t.image || undefined,
    avatar: true,
  }))

  function handleSelect(id: string | number) {
    const t = tests.find(x => x.id === String(id))
    if (!t) return
    setSelectedId(String(id)); setIsNew(false); setForm(formFromTest(t)); setNameError(''); setSpecialtyError('')
  }
  function handleNew() {
    setSelectedId(null); setIsNew(true)
    setForm({ name: '', image: '', specialty: '', customSpecialty: '', instructions: '', levels: [newLevel()] })
    setNameError(''); setSpecialtyError('')
  }
  function handleCancel() { setSelectedId(null); setIsNew(false); setForm(EMPTY_FORM); setNameError(''); setSpecialtyError('') }

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setForm(f => ({ ...f, image: URL.createObjectURL(file) }))
  }

  // ── Níveis (lista dinâmica) ──
  const addLevel = () => setForm(f => ({ ...f, levels: [...f.levels, newLevel()] }))
  const removeLevel = (id: string) =>
    setForm(f => ({ ...f, levels: f.levels.length > 1 ? f.levels.filter(l => l.id !== id) : f.levels }))
  const updateLevel = (id: string, field: 'name' | 'description', value: string) =>
    setForm(f => ({ ...f, levels: f.levels.map(l => (l.id === id ? { ...l, [field]: value } : l)) }))

  function handleSave() {
    if (!form.name.trim()) { setNameError('Informe o nome do teste.'); return }
    if (!form.specialty) { setSpecialtyError('Selecione a especialização.'); return }
    if (isOtherSpecialty && !form.customSpecialty.trim()) {
      setSpecialtyError('Digite a especialização.'); return
    }
    const specialty = isOtherSpecialty ? form.customSpecialty.trim() : form.specialty
    const draft: PhysioTest = {
      id: selectedId ?? `local-${++seq}`,
      name: form.name.trim(),
      image: form.image || undefined,
      specialty,
      instructions: form.instructions.trim() || undefined,
      levels: form.levels
        .filter(l => l.name.trim() || l.description.trim())
        .map(l => ({ ...l, name: l.name.trim(), description: l.description.trim() })),
    }
    if (selectedId) {
      setTests(prev => prev.map(t => (t.id === draft.id ? draft : t)))
      toast.success('Teste atualizado (demonstração).')
    } else {
      setTests(prev => [draft, ...prev])
      toast.success('Teste criado (demonstração).')
    }
    setSelectedId(draft.id); setIsNew(false)
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
                <div className={styles.dados}>
                  {/* Imagem ilustrativa do teste */}
                  <label className={styles.imagem}>
                    {form.image
                      ? <img src={form.image} alt="" className={styles.imagemPreview} />
                      : <span className={styles.imagemVazia}><IconCamera /><span>Adicionar imagem</span></span>}
                    <input type="file" accept="image/*" onChange={pickImage} className={styles.imagemInput} />
                  </label>

                  <div className={styles.campoNome}>
                    <Input
                      label="Nome do teste"
                      placeholder="Ex: Força Muscular (Oxford), EVA de dor..."
                      value={form.name}
                      onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setNameError('') }}
                      error={nameError}
                    />
                  </div>
                </div>

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
            </div>

            <div className={styles.acoesBar}>
              <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
              <Button onClick={handleSave}>{isNew ? 'Cadastrar' : 'Salvar alterações'}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
