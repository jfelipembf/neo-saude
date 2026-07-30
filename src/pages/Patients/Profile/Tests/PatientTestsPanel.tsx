import { useImperativeHandle, useState } from 'react'
import type { FormEvent, Ref } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Select } from '@/components/Select/Select'
import { SideList } from '@/components/SideList/SideList'
import type { SideListItem } from '@/components/SideList/SideList'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/Toast'
import { IconEdit, IconPlus, IconTasks, IconTrash } from '@/components/icons'
import { useTests } from '@/hooks/useTests'
import {
  useDeletePatientTestResult, usePatientTestResults, usePatientTests,
  useSavePatientTestResult, useSetPatientTests,
} from '@/hooks/usePatientTests'
import { hasScoreBands, isItemScored, levelForScore } from '@/services/testsService'
import type { SaveTestResultInput } from '@/services/patientTestsService'
import { userMessage } from '@/lib/errors'
import { brToIsoDate, toIsoDate } from '@/utils/date'
import { GONIOMETRY_DEFAULT_POINTS } from '@/utils/goniometry'
import type { PhysioTest, PhysioTestLevel, PatientTestResult, GoniometryPoints } from '@/types/domain'
import { GoniometryPhoto } from '@/components/GoniometryPhoto/GoniometryPhoto'
import { TestEvolutionChart } from '@/components/TestEvolutionChart/TestEvolutionChart'
import { TestApplicationModal } from './TestApplicationModal'
import { TestPicker } from './TestPicker'
import styles from './PatientTestsPanel.module.scss'

const MEASURE_LABEL = 'Medição de hoje — fotografe e posicione os 3 pontos'

/** Escore como texto de tela: grau só na goniometria (a unidade dos outros
 *  instrumentos varia — segundos, pontos, metros — e vive no nome do teste). */
function formatScore(score: number, isGoniometry: boolean): string {
  return isGoniometry ? `${score}°` : String(score)
}

/** Aceita vírgula decimal (o fisio digita "14,5") e trata campo vazio como
 *  "não medido" — `Number('')` é 0, o que gravaria um escore falso. */
function parseScore(text: string): number | undefined {
  const raw = text.trim().replace(',', '.')
  if (!raw) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

/**
 * O nível gravado contradiz a faixa que o escore indica? É o que sobrou de
 * "houve override": não existe coluna de flag, então a divergência é
 * RECONSTITUÍDA do par (escore, nível congelado).
 *
 * Isso também acusa faixa que MUDOU no catálogo depois da aplicação — e é
 * exatamente por isso que o rótulo diz "não é a faixa deste escore hoje", e
 * não "o profissional errou".
 */
function divergesFromBand(result: PatientTestResult, levels: PhysioTestLevel[]): boolean {
  if (result.score == null) return false
  const auto = levelForScore(levels, result.score)
  return auto != null && auto.name !== result.levelName
}

/** O que a tela de fora pode pedir ao painel. */
export interface PatientTestsHandle {
  /** Grava o formulário de resultado que estiver aberto. Fechado, não há nada
   *  pendente e a chamada resolve sem gravar — aplicar teste é opcional numa
   *  sessão. */
  salvar: () => Promise<void>
}

interface PatientTestsPanelProps {
  patientId: string
  /**
   * Esconde o "Salvar" do formulário de resultado. Quem grava passa a ser a
   * tela de fora, pelo `ref` — é o caso da etapa de um roteiro, que já tem o
   * próprio Salvar. Dois botões de salvar na mesma tela é a receita para
   * gravar metade e achar que gravou tudo.
   */
  semAcoes?: boolean
  /** Repassado a `TestResults` — ver o comentário lá. */
  carePlanId?: string
  ref?: Ref<PatientTestsHandle>
}

/** Aba "Testes" do perfil do paciente (fisioterapia): sidenav com os testes do
 *  catálogo fixados para o paciente + histórico de resultados do selecionado. */
export function PatientTestsPanel({ patientId, semAcoes = false, carePlanId, ref }: PatientTestsPanelProps) {
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
          <TestResults
            key={selectedTest.id}
            patientId={patientId}
            test={selectedTest}
            semAcoes={semAcoes}
            carePlanId={carePlanId}
            ref={ref}
          />
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
  semAcoes?: boolean
  /** Restringe o histórico exibido a UM tratamento. Ausente = perfil do
   *  paciente e tela do médico continuam mostrando a vida inteira — só a
   *  etapa do roteiro de fisioterapia passa isto. */
  carePlanId?: string
  ref?: Ref<PatientTestsHandle>
}

/** Histórico de UM teste: cards horizontais (mais recente à esquerda) + botão
 *  "Novo teste" — pede o RESULTADO medido (o nível sai da faixa do escore) e a
 *  data. Testes de ângulo medem ao vivo: foto do paciente + pontos, o
 *  goniômetro digital, e o ângulo é o escore. */
function TestResults({ patientId, test, semAcoes = false, carePlanId, ref }: TestResultsProps) {
  const toast = useToast()
  const { data: todosOsResultados = [], isLoading } = usePatientTestResults(patientId, test.id)
  // Recortado por TRATAMENTO só quando `carePlanId` chega — o mesmo padrão do
  // Diagnóstico e da anamnese: filtrar na LEITURA, sem duplicar a tabela.
  const results = carePlanId
    ? todosOsResultados.filter(r => r.carePlanId === carePlanId)
    : todosOsResultados
  const {
    mutate: saveResult, mutateAsync: saveResultAsync, isPending: saving,
  } = useSavePatientTestResult(patientId)
  const { mutate: removeResult } = useDeletePatientTestResult(patientId)

  const isGoniometry = test.kind === 'goniometry'
  // Catálogo sem NENHUM limite (GMFCS, PEDI, PERFECT, Ritchie): não há o que
  // derivar, então a tela volta ao fluxo antigo — escolher o nível a dedo.
  const isScored = hasScoreBands(test.levels)
  // Instrumento respondido ITEM A ITEM (Berg, Roland-Morris, SPPB...): a
  // aplicação não é um campo de escore, é um questionário — e vai num modal
  // próprio, porque 24 itens em linha empurrariam o histórico para fora da tela.
  const itemScored = isItemScored(test)

  const [toDelete, setToDelete] = useState<PatientTestResult | null>(null)
  // null = "Novo teste"; id = editando o resultado existente com esse id.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [levelId, setLevelId] = useState('')
  const [dateIso, setDateIso] = useState('')
  const [levelError, setLevelError] = useState('')
  const [scoreError, setScoreError] = useState('')
  // Escore como TEXTO enquanto se digita: guardado como número, apagar o campo
  // para redigitar viraria 0 e "14," ficaria impossível de completar.
  const [scoreText, setScoreText] = useState('')
  // true = o profissional assumiu o nível na mão. Existe porque várias escalas
  // têm ponto de corte por idade/sexo que o banco não calcula — o próprio seed
  // registra isso por escrito.
  const [manualLevel, setManualLevel] = useState(false)
  // Medição desta aplicação — foto nova a cada vez, não é a foto de
  // referência do catálogo (essa fica em Administrativo → Testes).
  // measureImage é só para EXIBIÇÃO (pode ser uma URL já assinada, ao
  // editar um resultado existente); measureImagePath é o que de fato é
  // salvo — sem essa separação, reeditar sem trocar a foto gravaria a URL
  // assinada (que expira em 1h) na coluna, corrompendo-a.
  const [measureImage, setMeasureImage] = useState<string | undefined>(undefined)
  const [measureImagePath, setMeasureImagePath] = useState<string | undefined>(undefined)
  const [measurePoints, setMeasurePoints] = useState<GoniometryPoints>(GONIOMETRY_DEFAULT_POINTS)

  const levelOptions = test.levels.map(l => ({ value: l.id, label: l.name }))
  const submitting = saving
  // A aplicação sendo corrigida (o formulário guarda só o id): o modal de itens
  // precisa das respostas gravadas para se pré-preencher.
  const editingResult = editingId ? (results.find(r => r.id === editingId) ?? null) : null

  const score = parseScore(scoreText)
  const autoLevel = score != null ? levelForScore(test.levels, score) : undefined
  // Nível efetivo do formulário: o escolhido a dedo vence o derivado.
  const pickedLevel = manualLevel ? test.levels.find(l => l.id === levelId) : autoLevel
  // Faixa e escolha manual estão em desacordo → é override, e o aviso ao lado
  // do Select deixa isso explícito antes de salvar.
  const overriding = manualLevel && autoLevel != null && pickedLevel != null && pickedLevel.id !== autoLevel.id

  function handleImagePick(path: string | undefined) {
    setMeasureImage(path)
    setMeasureImagePath(path)
  }

  /** O goniômetro devolve o ângulo medido — e o ângulo É o escore do teste. */
  function handleAngleChange(value: number | null) {
    setScoreText(value == null ? '' : String(value))
    setScoreError('')
  }

  function openForm() {
    setEditingId(null)
    setLevelId('')
    setDateIso(toIsoDate(new Date()))
    setLevelError('')
    setScoreError('')
    setScoreText('')
    // Sem escore ainda não há faixa a aceitar: catálogo qualitativo já entra no
    // modo manual, o resto começa confiando no banco.
    setManualLevel(!isScored)
    setMeasureImage(undefined)
    setMeasureImagePath(undefined)
    setMeasurePoints(GONIOMETRY_DEFAULT_POINTS)
    setFormOpen(true)
  }

  function openEditForm(r: PatientTestResult) {
    setEditingId(r.id)
    setLevelId(r.levelId ?? '')
    setDateIso(brToIsoDate(r.performedAt) ?? toIsoDate(new Date()))
    setLevelError('')
    setScoreError('')
    setScoreText(r.score != null ? String(r.score) : '')
    // Reabrir um resultado não pode desfazer silenciosamente o override: se o
    // nível gravado não é o da faixa, o formulário volta em modo manual. Idem
    // para aplicação antiga (sem escore), que só tem o nível.
    setManualLevel(!isScored || r.score == null || divergesFromBand(r, test.levels))
    setMeasureImage(r.imageUrl)
    setMeasureImagePath(r.imagePath)
    setMeasurePoints(r.measuredPoints ?? GONIOMETRY_DEFAULT_POINTS)
    setFormOpen(true)
  }

  function handleConfirmDelete() {
    if (!toDelete) return
    removeResult(
      { id: toDelete.id, testId: test.id },
      { onSuccess: () => { toast.success('Resultado excluído!'); setToDelete(null) } },
    )
  }

  /**
   * Confere o formulário e devolve o que gravar — ou a mensagem do que falta.
   *
   * Separado do `handleSubmit` porque agora existem DOIS caminhos de gravação:
   * o botão do próprio formulário e o "Salvar" do roteiro, por `ref`. Duplicar
   * estas regras nos dois é como um dos caminhos passa a aceitar o que o outro
   * recusa.
   */
  function conferir(): { erro: string } | { payload: Omit<SaveTestResultInput, 'patientId' | 'testId' | 'resultId'> } {
    if (isScored && score == null && !manualLevel) {
      const erro = isGoniometry ? 'Meça o ângulo na foto acima.' : 'Informe o resultado medido.'
      setScoreError(erro)
      return { erro }
    }
    if (manualLevel && !levelId) {
      const erro = 'Selecione o nível atingido.'
      setLevelError(erro)
      return { erro }
    }
    if (!manualLevel && !pickedLevel) {
      // Escore fora de qualquer faixa cadastrada (ex.: Fugl-Meyer 100, cuja
      // última faixa semeada para em 99). Não inventa nível: manda ajustar.
      const erro = 'Nenhuma faixa cadastrada cobre este resultado — ajuste o nível manualmente.'
      setScoreError(erro)
      return { erro }
    }
    if (!pickedLevel) {
      const erro = 'Selecione o nível atingido.'
      setLevelError(erro)
      return { erro }
    }

    return {
      payload: {
        levelId: pickedLevel.id,
        performedOnIso: dateIso,
        score,
        imageUrl: isGoniometry ? measureImagePath : undefined,
        measuredPoints: isGoniometry ? measurePoints : undefined,
      },
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const r = conferir()
    if ('erro' in r) return
    save(r.payload)
  }

  // A gravação exposta para fora. Formulário FECHADO resolve sem gravar: numa
  // sessão sem teste aplicado não há nada pendente, e exigir abrir o formulário
  // só para poder avançar obrigaria a inventar um resultado.
  useImperativeHandle(ref, () => ({
    salvar: async () => {
      if (!formOpen) return
      const r = conferir()
      if ('erro' in r) throw new Error(r.erro)
      await saveResultAsync({ resultId: editingId ?? undefined, testId: test.id, ...r.payload })
      toast.success(editingId ? 'Resultado atualizado!' : 'Resultado registrado!')
      setFormOpen(false)
    },
  }))

  /**
   * Único caminho de gravação da aba — inserir e corrigir são a MESMA chamada
   * (a RPC decide pelo `resultId`). O erro é mostrado como veio do banco quando
   * ele o escreveu para o usuário (item faltando, opção que não é do item):
   * "não foi possível salvar" esconderia justamente o que precisa ser corrigido.
   */
  function save(payload: Omit<SaveTestResultInput, 'patientId' | 'testId' | 'resultId'>) {
    saveResult(
      { resultId: editingId ?? undefined, testId: test.id, ...payload },
      {
        onSuccess: () => {
          toast.success(editingId ? 'Resultado atualizado!' : 'Resultado registrado!')
          setFormOpen(false)
        },
        onError: err => toast.error(userMessage(err, 'Não foi possível salvar o resultado.')),
      },
    )
  }

  // Montados aqui (e não no JSX) porque os dois entram em arranjos diferentes
  // conforme o teste: sozinhos, lado a lado, ou nenhum dos dois.
  const scoreField = isGoniometry ? null : (
    <Input
      label="Resultado"
      type="number"
      step="any"
      inputMode="decimal"
      placeholder="Valor medido"
      value={scoreText}
      onChange={e => { setScoreText(e.target.value); setScoreError('') }}
      error={scoreError}
      hint={
        scoreError ? undefined
          : isScored ? 'Na unidade do teste: segundos, pontos, metros...'
          : 'Opcional — este teste não tem faixas de resultado cadastradas.'
      }
    />
  )

  const faixaBox = (
    <div className={styles.faixaBox}>
      <span className={styles.faixaLabel}>Faixa do resultado</span>
      {score == null ? (
        <span className={styles.faixaVazia}>
          {isGoniometry ? 'Posicione os pontos na foto para medir o ângulo.' : 'Informe o resultado ao lado.'}
        </span>
      ) : autoLevel ? (
        <>
          <span className={styles.faixaNome}>{autoLevel.name}</span>
          <span className={styles.faixaDesc}>{autoLevel.description}</span>
        </>
      ) : (
        <span className={styles.faixaVazia}>
          Nenhuma faixa cadastrada cobre {formatScore(score, isGoniometry)} — escolha o nível manualmente.
        </span>
      )}
      {/* Sem campo numérico na goniometria, o erro do escore não tem onde
          aparecer (o Input carrega o seu) — cai aqui. */}
      {isGoniometry && scoreError && <span className={styles.faixaErro}>{scoreError}</span>}
    </div>
  )

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

      {/* Instrumento com itens: a aplicação é o questionário inteiro, num modal
          com guarda de fechamento. Sem itens, segue o formulário embutido de
          sempre — escore direto (ou nível a dedo, no catálogo qualitativo). */}
      {itemScored ? (
        <TestApplicationModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          test={test}
          result={editingResult}
          saving={submitting}
          onSubmit={({ answers, dateIso: day, levelId: bandId }) =>
            save({ performedOnIso: day, levelId: bandId, items: answers })}
        />
      ) : formOpen && (
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
                onValueChange={handleAngleChange}
                folder="patient-tests"
              />
            </div>
          )}

          {/* Escore + faixa lado a lado: o número é o que se digita, a faixa é
              a leitura do catálogo sobre ele — ver uma mudando a outra ao vivo
              é o ponto todo de trocar o Select pelo campo de resultado.
              Na goniometria o número não é digitável (sai do goniômetro acima)
              e num catálogo sem faixas não há o que ler, mas o CAMPO continua:
              o Índice de Ritchie é numérico (0–78) mesmo sem corte publicado, e
              é esse número que alimenta o gráfico de evolução. */}
          {isGoniometry ? isScored && faixaBox : isScored
            ? <div className={styles.scoreLinha}>{scoreField}{faixaBox}</div>
            : scoreField}

          {/* O banco classifica pela faixa, mas várias escalas têm ponto de
              corte por idade/sexo que ele não calcula — quem decide continua
              sendo o profissional. Catálogo qualitativo nem oferece a opção:
              lá o nível SEMPRE é escolhido a dedo. */}
          {isScored && (
            <Toggle
              label="Ajustar o nível manualmente"
              checked={manualLevel}
              onChange={checked => { setManualLevel(checked); setLevelError('') }}
            />
          )}

          {manualLevel && (
            <Select
              label="Nível atingido"
              options={levelOptions}
              value={levelId}
              onChange={e => { setLevelId(e.target.value); setLevelError('') }}
              placeholder="Selecione o nível"
              error={levelError}
              hint={overriding ? `A faixa deste resultado é "${autoLevel?.name}" — será gravado o nível escolhido aqui, no lugar dela.` : undefined}
            />
          )}

          {/* A DATA some quando o roteiro assume: ali o teste é aplicado agora,
              e `openForm` já preenche com hoje — o campo só pediria confirmação
              de algo que ninguém vai mudar.
              Continua visível ao EDITAR um resultado antigo: escondê-la lá
              tiraria a única forma de corrigir uma data errada. */}
          {(!semAcoes || editingId) && (
            <Input
              label="Data"
              type="date"
              value={dateIso}
              onChange={e => setDateIso(e.target.value)}
            />
          )}
          <div className={styles.novoFormAcoes}>
            <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            {!semAcoes && (
              <Button type="submit" size="sm" loading={submitting}>Salvar</Button>
            )}
          </div>
        </form>
      )}

      {isLoading ? (
        <PageLoader />
      ) : results.length === 0 ? (
        /* O vazio some quando o roteiro assume: ali a etapa JÁ é "aplique o
           teste", e um cartão dizendo que não há resultado só repete o que a
           tela inteira está pedindo. No perfil ele fica, porque lá a ausência
           de resultado é informação — o teste está atribuído e nunca foi
           aplicado. */
        semAcoes ? null : (
          <EmptyState
            title="Nenhum resultado registrado"
            description="Clique em Novo teste para registrar a primeira aplicação."
          />
        )
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
                  {r.score != null && <span className={styles.resultAngleBadge}>{formatScore(r.score, isGoniometry)}</span>}
                </div>
              )}
              <div className={styles.resultBody}>
                {!r.imageUrl && r.score != null && (
                  <span className={styles.resultAngle}>{formatScore(r.score, isGoniometry)}</span>
                )}
                <span className={styles.resultLevel}>{r.levelName}</span>
                {/* Sem coluna de flag no banco: o aviso é reconstituído do par
                    (escore, nível congelado) — ver divergesFromBand. */}
                {divergesFromBand(r, test.levels) && (
                  <span className={styles.resultOverride} title="O nível gravado não é o que a faixa deste resultado indica hoje.">
                    Nível ajustado
                  </span>
                )}
                <span className={styles.resultDescription}>{r.levelDescription}</span>
                <span className={styles.resultDate}>{r.performedAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evolução no tempo, abaixo do histórico: os cards acima dão o valor de
          CADA aplicação, o gráfico dá a trajetória entre elas. */}
      {!isLoading && results.length > 0 && (
        <TestEvolutionChart test={test} results={results} />
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
