import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Select } from '@/components/Select/Select'
import { SideList } from '@/components/SideList/SideList'
import type { SideListItem } from '@/components/SideList/SideList'
import { useToast } from '@/components/Toast/useToast'
import { IconEdit, IconPlus, IconTasks, IconTrash } from '@/components/icons'
import { useTests } from '@/hooks/useTests'
import {
  useAddPatientTestResult, useDeletePatientTestResult, usePatientTestResults, usePatientTests,
  useSetPatientTests, useUpdatePatientTestResult,
} from '@/hooks/usePatientTests'
import { brToIsoDate, toIsoDate } from '@/utils/date'
import { GONIOMETRY_DEFAULT_POINTS } from '@/utils/goniometry'
import type { PhysioTest, PatientTestResult, GoniometryPoints } from '@/types/domain'
import { GoniometryPhoto } from '@/components/GoniometryPhoto/GoniometryPhoto'
import { TestPicker } from './TestPicker'
import styles from './PatientTestsPanel.module.scss'

const MEASURE_LABEL = 'Medição de hoje — fotografe e posicione os 3 pontos'

interface PatientTestsPanelProps {
  patientId: string
}

/** Aba "Testes" do perfil do paciente (fisioterapia): sidenav com os testes do
 *  catálogo fixados para o paciente + histórico de resultados do selecionado. */
export function PatientTestsPanel({ patientId }: PatientTestsPanelProps) {
  const toast = useToast()
  const { data: catalog = [], isLoading: loadingCatalog } = useTests()
  const { data: patientTests = [], isLoading: loadingPatientTests } = usePatientTests(patientId)
  const { mutate: saveSelection, isPending: savingSelection } = useSetPatientTests(patientId)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)

  if (loadingCatalog || loadingPatientTests) return <PageLoader />

  const assignedTests = patientTests
    .map(pt => catalog.find(t => t.id === pt.testId))
    .filter((t): t is PhysioTest => Boolean(t))

  const selectedTest = assignedTests.find(t => t.id === selectedTestId) ?? null

  const items: SideListItem[] = assignedTests.map(t => ({ id: t.id, label: t.name, sublabel: t.specialty }))

  function handleConfirmPicker(testIds: string[]) {
    saveSelection(testIds, {
      onSuccess: () => {
        toast.success('Testes do paciente atualizados!')
        setPickerOpen(false)
        if (selectedTestId && !testIds.includes(selectedTestId)) setSelectedTestId(null)
      },
    })
  }

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <SideList
          title="Testes do paciente"
          size="lg"
          items={items}
          selectedId={selectedTestId}
          onSelect={id => setSelectedTestId(String(id))}
          onAdd={() => setPickerOpen(true)}
          hideSearch
          emptyText="Nenhum teste selecionado"
        />
      </div>

      <div className={styles.content}>
        {!selectedTest ? (
          <EmptyState
            icon={<IconTasks />}
            title={assignedTests.length ? 'Nenhum teste selecionado' : 'Nenhum teste adicionado'}
            description={
              assignedTests.length
                ? 'Selecione um teste na lista ao lado para ver o histórico de resultados.'
                : 'Clique em + na lista ao lado para escolher os testes acompanhados deste paciente.'
            }
            action={
              !assignedTests.length
                ? <Button iconLeft={<IconPlus />} onClick={() => setPickerOpen(true)}>Adicionar teste</Button>
                : undefined
            }
          />
        ) : (
          // key=test.id: força o React a recriar o componente do zero ao trocar
          // de teste no sidenav — senão o estado da medição (pontos, valor,
          // formulário aberto) do teste ANTERIOR sobrevive por baixo das novas
          // props, e a ferramenta mostra dados de um teste diferente do selecionado.
          <TestResults key={selectedTest.id} patientId={patientId} test={selectedTest} />
        )}
      </div>

      <TestPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        catalog={catalog}
        selectedIds={patientTests.map(pt => pt.testId)}
        onConfirm={handleConfirmPicker}
        saving={savingSelection}
      />
    </div>
  )
}

interface TestResultsProps {
  patientId: string
  test: PhysioTest
}

/** Histórico de UM teste: cards horizontais (mais recente à esquerda) + botão
 *  "Novo teste" — pede o nível atingido e a data. Testes de ângulo também
 *  medem ao vivo: foto do paciente + pontos, o goniômetro digital. */
function TestResults({ patientId, test }: TestResultsProps) {
  const toast = useToast()
  const { data: results = [], isLoading } = usePatientTestResults(patientId, test.id)
  const { mutate: addResult, isPending: saving } = useAddPatientTestResult(patientId)
  const { mutate: updateResult, isPending: updating } = useUpdatePatientTestResult(patientId)
  const { mutate: removeResult } = useDeletePatientTestResult(patientId)

  const isGoniometry = test.kind === 'goniometry'

  const [toDelete, setToDelete] = useState<PatientTestResult | null>(null)
  // null = "Novo teste"; id = editando o resultado existente com esse id.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [levelId, setLevelId] = useState('')
  const [dateIso, setDateIso] = useState('')
  const [levelError, setLevelError] = useState('')
  // Medição desta aplicação — foto nova a cada vez, não é a foto de
  // referência do catálogo (essa fica em Administrativo → Testes).
  // measureImage é só para EXIBIÇÃO (pode ser uma URL já assinada, ao
  // editar um resultado existente); measureImagePath é o que de fato é
  // salvo — sem essa separação, reeditar sem trocar a foto gravaria a URL
  // assinada (que expira em 1h) na coluna, corrompendo-a.
  const [measureImage, setMeasureImage] = useState<string | undefined>(undefined)
  const [measureImagePath, setMeasureImagePath] = useState<string | undefined>(undefined)
  const [measurePoints, setMeasurePoints] = useState<GoniometryPoints>(GONIOMETRY_DEFAULT_POINTS)
  const [measuredAngle, setMeasuredAngle] = useState<number | null>(null)

  const levelOptions = test.levels.map(l => ({ value: l.id, label: l.name }))
  const submitting = saving || updating

  function handleImagePick(path: string | undefined) {
    setMeasureImage(path)
    setMeasureImagePath(path)
  }

  function openForm() {
    setEditingId(null)
    setLevelId('')
    setDateIso(toIsoDate(new Date()))
    setLevelError('')
    setMeasureImage(undefined)
    setMeasureImagePath(undefined)
    setMeasurePoints(GONIOMETRY_DEFAULT_POINTS)
    setMeasuredAngle(null)
    setFormOpen(true)
  }

  function openEditForm(r: PatientTestResult) {
    setEditingId(r.id)
    setLevelId(r.levelId ?? '')
    setDateIso(brToIsoDate(r.performedAt) ?? toIsoDate(new Date()))
    setLevelError('')
    setMeasureImage(r.imageUrl)
    setMeasureImagePath(r.imagePath)
    setMeasurePoints(r.measuredPoints ?? GONIOMETRY_DEFAULT_POINTS)
    setMeasuredAngle(r.measuredAngle ?? null)
    setFormOpen(true)
  }

  function handleConfirmDelete() {
    if (!toDelete) return
    removeResult(
      { id: toDelete.id, testId: test.id },
      { onSuccess: () => { toast.success('Resultado excluído!'); setToDelete(null) } },
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!levelId) { setLevelError('Selecione o nível atingido.'); return }
    const measurement = {
      measuredAngle: isGoniometry ? (measuredAngle ?? undefined) : undefined,
      imageUrl: isGoniometry ? measureImagePath : undefined,
      measuredPoints: isGoniometry ? measurePoints : undefined,
    }
    if (editingId) {
      updateResult(
        { id: editingId, testId: test.id, levelId, performedOnIso: dateIso, ...measurement },
        { onSuccess: () => { toast.success('Resultado atualizado!'); setFormOpen(false) } },
      )
    } else {
      addResult(
        { testId: test.id, levelId, performedOnIso: dateIso, ...measurement },
        { onSuccess: () => { toast.success('Resultado registrado!'); setFormOpen(false) } },
      )
    }
  }

  return (
    <div className={styles.detail}>
      <div className={styles.detailHead}>
        <div>
          <h2 className={styles.detailTitle}>{test.name}</h2>
          <span className={styles.detailSpecialty}>{test.specialty}</span>
        </div>
        {!formOpen && (
          <Button size="sm" iconLeft={<IconPlus />} onClick={openForm} disabled={test.levels.length === 0}>
            Novo teste
          </Button>
        )}
      </div>

      {test.levels.length === 0 && (
        <p className={styles.semNiveis}>Este teste não tem níveis cadastrados no catálogo (Administrativo → Testes).</p>
      )}

      {formOpen && (
        <form className={styles.novoForm} onSubmit={handleSubmit}>
          <span className={styles.novoFormTitulo}>{editingId ? 'Editar resultado' : 'Novo resultado'}</span>
          {isGoniometry && (
            <div className={styles.goniometriaCampo}>
              <span className={styles.goniometriaLabel}>{MEASURE_LABEL}</span>
              <GoniometryPhoto
                image={measureImage}
                points={measurePoints}
                onImage={handleImagePick}
                onPointsChange={setMeasurePoints}
                onValueChange={setMeasuredAngle}
                folder="patient-tests"
              />
            </div>
          )}

          <Select
            label="Nível atingido"
            options={levelOptions}
            value={levelId}
            onChange={e => { setLevelId(e.target.value); setLevelError('') }}
            placeholder="Selecione o nível"
            error={levelError}
          />
          <Input
            label="Data"
            type="date"
            value={dateIso}
            onChange={e => setDateIso(e.target.value)}
          />
          <div className={styles.novoFormAcoes}>
            <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              {editingId ? 'Salvar alterações' : 'Salvar'}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <PageLoader />
      ) : results.length === 0 ? (
        <EmptyState
          title="Nenhum resultado registrado"
          description="Clique em Novo teste para registrar a primeira aplicação."
        />
      ) : (
        <div className={styles.resultsRow}>
          {results.map(r => (
            <div key={r.id} className={styles.resultCard}>
              <div className={styles.resultAcoes}>
                <button
                  type="button"
                  className={styles.resultIconBtn}
                  title="Editar resultado"
                  aria-label="Editar resultado"
                  onClick={() => openEditForm(r)}
                >
                  <IconEdit />
                </button>
                <button
                  type="button"
                  className={`${styles.resultIconBtn} ${styles['resultIconBtn--perigo']}`}
                  title="Excluir resultado"
                  aria-label="Excluir resultado"
                  onClick={() => setToDelete(r)}
                >
                  <IconTrash />
                </button>
              </div>
              {r.imageUrl && (
                <div className={styles.resultImageWrap}>
                  <img src={r.imageUrl} alt={`Medição de ${r.performedAt}`} className={styles.resultImage} />
                  {r.measuredPoints && (
                    <svg className={styles.resultRegua} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                      <line x1={r.measuredPoints[0].x} y1={r.measuredPoints[0].y} x2={r.measuredPoints[1].x} y2={r.measuredPoints[1].y} />
                      <line x1={r.measuredPoints[1].x} y1={r.measuredPoints[1].y} x2={r.measuredPoints[2].x} y2={r.measuredPoints[2].y} />
                      {r.measuredPoints.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r={i === 1 ? 2.2 : 1.8} className={i === 1 ? styles.resultReguaVertice : styles.resultReguaPonto} />
                      ))}
                    </svg>
                  )}
                  {r.measuredAngle != null && <span className={styles.resultAngleBadge}>{r.measuredAngle}°</span>}
                </div>
              )}
              <div className={styles.resultBody}>
                {!r.imageUrl && r.measuredAngle != null && <span className={styles.resultAngle}>{r.measuredAngle}°</span>}
                <span className={styles.resultLevel}>{r.levelName}</span>
                <span className={styles.resultDescription}>{r.levelDescription}</span>
                <span className={styles.resultDate}>{r.performedAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir resultado"
        message={toDelete ? `Deseja excluir o resultado de ${toDelete.performedAt}? Essa ação não pode ser desfeita.` : ''}
        variant="danger"
      />
    </div>
  )
}
