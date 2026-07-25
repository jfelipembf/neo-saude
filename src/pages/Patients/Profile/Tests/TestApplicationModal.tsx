import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { levelForScore } from '@/services/testsService'
import { brToIsoDate, toIsoDate } from '@/utils/date'
import type {
  PhysioTest, PhysioTestItem, PatientTestResult, TestItemAnswer, TestItemAnswers,
} from '@/types/domain'
import styles from './TestApplicationModal.module.scss'

/**
 * Rascunho da aplicação: `code` do item → resposta em TEXTO.
 *
 * Um mapa só para os dois tipos de item (em 'options' o texto é o id da
 * alternativa; em 'number' é o que está sendo digitado, com vírgula e tudo).
 * Guardar o número já convertido faria "1," ficar impossível de completar e
 * apagar o campo viraria zero — que é resposta legítima em quase todo item.
 */
type Draft = Record<string, string>

/** Aceita vírgula decimal e trata campo vazio como NÃO respondido — `Number('')`
 *  é 0, e 0 é uma pontuação válida: o engano passaria batido. */
function parsePoints(text: string): number | undefined {
  const raw = text.trim().replace(',', '.')
  if (!raw) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

/** A resposta do item no formato de ENVIO, ou undefined se ainda não respondido
 *  (inclui a opção que sumiu do catálogo entre abrir e salvar). */
function answerFor(item: PhysioTestItem, raw: string | undefined): TestItemAnswer | undefined {
  if (!raw) return undefined
  if (item.inputKind === 'options') {
    return item.options.some(o => o.id === raw) ? { optionId: raw } : undefined
  }
  const points = parsePoints(raw)
  return points == null ? undefined : { points }
}

/** Quanto a resposta vale. Em 'options' sai do CATÁLOGO, nunca do rascunho — é
 *  a mesma leitura que o banco faz ao gravar, então o total da tela e o escore
 *  gravado não podem divergir. */
function pointsFor(item: PhysioTestItem, raw: string | undefined): number | undefined {
  const answer = answerFor(item, raw)
  if (!answer) return undefined
  if (!('optionId' in answer)) return answer.points
  return item.options.find(o => o.id === answer.optionId)?.points
}

/**
 * Rascunho a partir de uma aplicação já registrada (correção).
 *
 * Casa pelo `code` do item, não pelo id: o code é a chave estável, e o id vira
 * nulo quando o item sai do catálogo. Na alternativa a ordem é ponteiro vivo →
 * texto congelado: repontuar uma opção no catálogo troca o id, e sem o
 * segundo caminho reabrir um Berg antigo mostraria 14 itens em branco.
 */
function draftFromResult(test: PhysioTest, result: PatientTestResult | null): Draft {
  const draft: Draft = {}
  if (!result) return draft
  for (const answered of result.items) {
    const item = test.items.find(i => i.code === answered.itemCode)
    if (!item) continue
    if (item.inputKind !== 'options') {
      draft[item.code] = String(answered.points)
      continue
    }
    const option = item.options.find(o => o.id === answered.optionId)
      ?? item.options.find(o => o.label === answered.optionLabel)
    if (option) draft[item.code] = option.id
  }
  return draft
}

interface TestApplicationModalProps {
  open: boolean
  onClose: () => void
  test: PhysioTest
  /** Aplicação sendo corrigida; null = nova. */
  result: PatientTestResult | null
  saving: boolean
  onSubmit: (payload: { answers: TestItemAnswers; dateIso: string; levelId?: string }) => void
}

/**
 * Aplicação ITEM A ITEM de um instrumento pontuado por somatório (Berg,
 * Roland-Morris, SPPB...). Some ao vivo e mostra a faixa que o total atinge —
 * mas quem soma e classifica DE VERDADE é o banco, na gravação: aqui é
 * conferência, não cálculo com valor jurídico.
 *
 * É um Modal, e não o formulário embutido do painel, porque o Roland-Morris tem
 * 24 itens: em linha ele empurraria o histórico para fora da tela e não teria
 * onde travar o fechamento acidental.
 */
export function TestApplicationModal({
  open, onClose, test, result, saving, onSubmit,
}: TestApplicationModalProps) {
  const [draft, setDraft] = useState<Draft>({})
  const [initialDraft, setInitialDraft] = useState<Draft>({})
  const [dateIso, setDateIso] = useState('')
  const [initialDateIso, setInitialDateIso] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  // Ressincroniza com a aplicação recebida a cada ABERTURA — ajuste de estado
  // durante o render (sem useEffect), mesmo padrão do TestPicker.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      const next = draftFromResult(test, result)
      const day = (result && brToIsoDate(result.performedAt)) || toIsoDate(new Date())
      setDraft(next)
      setInitialDraft(next)
      setDateIso(day)
      setInitialDateIso(day)
      setShowErrors(false)
    }
  }

  const answered = test.items.filter(i => answerFor(i, draft[i.code]) != null)
  const complete = answered.length === test.items.length && test.items.length > 0
  const total = test.items.reduce((sum, i) => sum + (pointsFor(i, draft[i.code]) ?? 0), 0)
  // Faixa só depois do último item: 13 dos 14 do Berg somam menos e cairiam
  // numa faixa de risco PIOR que a real — mostrar isso no meio do preenchimento
  // é dar um diagnóstico errado de graça. O banco recusa parcial pelo mesmo
  // motivo, então a tela não promete o que ele não aceita.
  const band = complete ? levelForScore(test.levels, total) : undefined
  const progressPct = test.items.length ? (answered.length / test.items.length) * 100 : 0
  const dirty =
    dateIso !== initialDateIso || JSON.stringify(draft) !== JSON.stringify(initialDraft)

  function setAnswer(code: string, value: string) {
    setDraft(current => ({ ...current, [code]: value }))
  }

  function handleSubmit() {
    if (!complete) { setShowErrors(true); return }
    const answers: TestItemAnswers = {}
    for (const item of test.items) {
      const answer = answerFor(item, draft[item.code])
      if (answer) answers[item.code] = answer
    }
    onSubmit({ answers, dateIso, levelId: band?.id })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={result ? `Corrigir aplicação — ${test.name}` : test.name}
      size="lg"
      // 24 respostas não podem ir embora num ESC ou num clique fora do modal.
      confirmOnClose={dirty && !saving}
      confirmOnCloseTitle="Descartar esta aplicação?"
      confirmOnCloseMessage="As respostas preenchidas ainda não foram salvas. Se fechar agora, elas se perdem."
      footer={requestClose => (
        <>
          <Button variant="ghost" onClick={requestClose} disabled={saving}>Cancelar</Button>
          {/* Habilitado mesmo incompleto DE PROPÓSITO: a gravação é barrada no
              handleSubmit, e o clique é o que marca em vermelho os itens que
              faltam. Num formulário de 24 itens, um botão morto não diz QUAIS
              ficaram para trás — obrigaria a conferir os 24 a olho. */}
          <Button onClick={handleSubmit} loading={saving}>
            {result ? 'Salvar alterações' : 'Salvar aplicação'}
          </Button>
        </>
      )}
    >
      <div className={styles.wrap}>
        {test.instructions && <p className={styles.instrucoes}>{test.instructions}</p>}

        {/* Placar da aplicação: progresso + total + faixa. Fica GRUDADO no topo
            porque o Roland-Morris tem 24 itens — sem isso, conferir o total
            exigiria rolar de volta a cada resposta. */}
        <div className={styles.placar}>
          <div className={styles.placarProgresso}>
            <span className={styles.placarRotulo}>
              {answered.length} de {test.items.length} respondidos
            </span>
            {/* Largura vem do DADO (quantos itens foram respondidos), não é
                variante visual — mesma custom property do CommissionsCard. */}
            <span
              className={styles.barra}
              style={{ '--answered-progress': `${progressPct}%` } as CSSProperties}
            >
              <span className={styles.barraPreenchida} />
            </span>
          </div>

          <div className={styles.placarTotal}>
            <span className={styles.placarRotulo}>Total</span>
            <span className={styles.totalValor}>{total}</span>
          </div>

          <div className={styles.placarFaixa}>
            <span className={styles.placarRotulo}>Faixa do resultado</span>
            {band ? (
              <>
                <span className={styles.faixaNome}>{band.name}</span>
                <span className={styles.faixaDesc}>{band.description}</span>
              </>
            ) : complete ? (
              <span className={styles.faixaVazia}>
                Nenhuma faixa cadastrada cobre o total {total} — revise as faixas em Administrativo → Testes.
              </span>
            ) : (
              <span className={styles.faixaVazia}>
                Responda todos os itens: um total parcial cairia numa faixa que não é a do paciente.
              </span>
            )}
          </div>
        </div>

        <ol className={styles.itens}>
          {test.items.map((item, index) => {
            const raw = draft[item.code]
            const points = pointsFor(item, raw)
            const faltando = showErrors && points == null
            return (
              <li
                key={item.id}
                className={`${styles.item} ${faltando ? styles['item--faltando'] : ''}`}
              >
                <div className={styles.itemCabecalho}>
                  <span className={styles.itemNum}>{index + 1}</span>
                  <div className={styles.itemTexto}>
                    <span className={styles.itemLabel}>{item.label}</span>
                    {item.help && <span className={styles.itemHelp}>{item.help}</span>}
                  </div>
                  <span className={styles.itemPontos}>
                    {points == null ? '—' : points}
                  </span>
                </div>

                {item.inputKind === 'options' ? (
                  <div className={styles.opcoes} role="radiogroup" aria-label={item.label}>
                    {item.options.map(option => (
                      <label
                        key={option.id}
                        className={`${styles.opcao} ${raw === option.id ? styles['opcao--marcada'] : ''}`}
                      >
                        <input
                          type="radio"
                          className={styles.radio}
                          name={`item-${item.code}`}
                          value={option.id}
                          checked={raw === option.id}
                          onChange={() => setAnswer(item.code, option.id)}
                        />
                        <span className={styles.opcaoLabel}>{option.label}</span>
                        <span className={styles.opcaoPontos}>{option.points}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <Input
                    size="sm"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    aria-label={`Pontuação do item ${index + 1}`}
                    placeholder="Pontuação"
                    value={raw ?? ''}
                    onChange={e => setAnswer(item.code, e.target.value)}
                    className={styles.campoNumero}
                  />
                )}
              </li>
            )
          })}
        </ol>

        {showErrors && !complete && (
          <p className={styles.avisoIncompleto}>
            Faltam {test.items.length - answered.length}{' '}
            {test.items.length - answered.length === 1 ? 'item' : 'itens'}. A aplicação só é
            registrada completa — um total parcial classificaria o paciente numa faixa errada.
          </p>
        )}

        <Input
          label="Data da aplicação"
          type="date"
          value={dateIso}
          onChange={e => setDateIso(e.target.value)}
          className={styles.campoData}
        />
      </div>
    </Modal>
  )
}
