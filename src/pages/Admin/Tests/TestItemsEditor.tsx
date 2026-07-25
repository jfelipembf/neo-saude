import { Button } from '@/components/Button/Button'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { IconPlus, IconX } from '@/components/icons'
import type { TestItemInputKind, TestScoringKind } from '@/types/domain'
import { newItem, newOption } from './testItemsForm'
import type { ItemFormState, OptionFormState } from './testItemsForm'
import styles from './TestItemsEditor.module.scss'

const SCORING_OPTIONS: { value: TestScoringKind; label: string }[] = [
  { value: 'manual', label: 'Valor medido' },
  { value: 'sum_items', label: 'Soma dos itens' },
]

const INPUT_KIND_OPTIONS: { value: TestItemInputKind; label: string }[] = [
  { value: 'options', label: 'Alternativas' },
  { value: 'number', label: 'Número' },
]

interface TestItemsEditorProps {
  scoringKind: TestScoringKind
  onScoringKindChange: (kind: TestScoringKind) => void
  items: ItemFormState[]
  onChange: (items: ItemFormState[]) => void
  /**
   * Teste de referência do sistema. A RLS deixa CORRIGIR item e alternativa
   * (update) e ACRESCENTAR (insert), mas nunca APAGAR — as policies de delete
   * de physio_test_item/_option excluem o que é seed. Sem essa trava a tela
   * mentiria: o item sumiria do formulário, o delete voltaria 0 linhas sem
   * erro nenhum, e ele reapareceria no próximo carregamento.
   */
  isSeed: boolean
  error?: string
}

/**
 * Cadastro dos ITENS do instrumento e da pontuação de cada alternativa — é o
 * que transforma um teste em questionário pontuado (Berg, Roland-Morris) em vez
 * de um campo de escore digitado.
 */
export function TestItemsEditor({
  scoringKind, onScoringKindChange, items, onChange, isSeed, error,
}: TestItemsEditorProps) {
  const addItem = () => onChange([...items, newItem()])
  const removeItem = (key: string) => onChange(items.filter(i => i.key !== key))
  const patchItem = (key: string, patch: Partial<ItemFormState>) =>
    onChange(items.map(i => (i.key === key ? { ...i, ...patch } : i)))

  const addOption = (itemKey: string) => {
    const item = items.find(i => i.key === itemKey)
    if (item) patchItem(itemKey, { options: [...item.options, newOption()] })
  }
  const removeOption = (itemKey: string, optionKey: string) => {
    const item = items.find(i => i.key === itemKey)
    if (item) patchItem(itemKey, { options: item.options.filter(o => o.key !== optionKey) })
  }
  const patchOption = (itemKey: string, optionKey: string, patch: Partial<OptionFormState>) => {
    const item = items.find(i => i.key === itemKey)
    if (!item) return
    patchItem(itemKey, { options: item.options.map(o => (o.key === optionKey ? { ...o, ...patch } : o)) })
  }

  // A lista some quando não há item E a pontuação é por valor medido; com itens
  // cadastrados ela continua visível mesmo em 'manual', senão voltar a
  // pontuação daria a impressão de que os itens foram apagados.
  const showItems = scoringKind === 'sum_items' || items.length > 0

  return (
    <FormSection
      title="Itens e pontuação"
      description={
        scoringKind === 'sum_items'
          ? 'O escore da aplicação é a SOMA dos itens, calculada pelo banco: o profissional responde item a item e não digita o total. A aplicação só é aceita completa.'
          : 'O escore é o valor medido, digitado na aplicação (segundos no TUG, metros no TC6). Troque para "Soma dos itens" nos instrumentos respondidos item a item, como o Berg.'
      }
      actions={
        showItems
          ? <Button size="sm" variant="ghost" iconLeft={<IconPlus />} onClick={addItem}>Adicionar item</Button>
          : undefined
      }
    >
      <div className={styles.motorLinha}>
        <span className={styles.motorLabel}>Como o escore é obtido</span>
        <SegmentedControl options={SCORING_OPTIONS} value={scoringKind} onChange={onScoringKindChange} />
      </div>

      {isSeed && showItems && (
        <p className={styles.seedNota}>
          Teste padrão do sistema: os enunciados e as alternativas podem ser corrigidos e novos itens
          podem ser acrescentados, mas o que já veio no catálogo não pode ser removido.
        </p>
      )}

      {error && <p className={styles.erro}>{error}</p>}

      {showItems && (
        items.length === 0 ? (
          <p className={styles.vazio}>
            Nenhum item cadastrado. Clique em "Adicionar item" para montar o questionário.
          </p>
        ) : (
          <ol className={styles.itens}>
            {items.map((item, i) => (
              <li key={item.key} className={styles.item}>
                <div className={styles.itemCabecalho}>
                  <span className={styles.itemNum}>{i + 1}</span>
                  <Input
                    aria-label={`Enunciado do item ${i + 1}`}
                    placeholder="Enunciado do item (ex: Passar de sentado para de pé)"
                    value={item.label}
                    onChange={e => patchItem(item.key, { label: e.target.value })}
                    className={styles.itemLabel}
                  />
                  <SegmentedControl
                    options={INPUT_KIND_OPTIONS}
                    value={item.inputKind}
                    onChange={kind => patchItem(item.key, { inputKind: kind })}
                  />
                  <button
                    type="button"
                    className={styles.remover}
                    title={isSeed && item.id ? 'Item do catálogo padrão — não pode ser removido' : 'Remover item'}
                    aria-label={`Remover item ${i + 1}`}
                    onClick={() => removeItem(item.key)}
                    disabled={isSeed && Boolean(item.id)}
                  >
                    <IconX />
                  </button>
                </div>

                <Input
                  size="sm"
                  aria-label={`Instrução do item ${i + 1}`}
                  placeholder="Instrução de aplicação (opcional): como cronometrar, que distância usar..."
                  value={item.help}
                  onChange={e => patchItem(item.key, { help: e.target.value })}
                  className={styles.itemHelp}
                />

                {item.inputKind === 'number' ? (
                  <p className={styles.itemNumeroNota}>
                    Item numérico: na aplicação o profissional digita a pontuação deste item.
                  </p>
                ) : (
                  <div className={styles.opcoesBloco}>
                    <ol className={styles.opcoes}>
                      {item.options.map((option, j) => (
                        <li key={option.key} className={styles.opcao}>
                          <Input
                            size="sm"
                            aria-label={`Alternativa ${j + 1} do item ${i + 1}`}
                            placeholder="Alternativa (ex: Capaz de levantar sem usar as mãos)"
                            value={option.label}
                            onChange={e => patchOption(item.key, option.key, { label: e.target.value })}
                            className={styles.opcaoLabel}
                          />
                          <Input
                            size="sm"
                            type="number"
                            step="any"
                            inputMode="decimal"
                            aria-label={`Pontos da alternativa ${j + 1} do item ${i + 1}`}
                            placeholder="Pontos"
                            value={option.points}
                            onChange={e => patchOption(item.key, option.key, { points: e.target.value })}
                            className={styles.opcaoPontos}
                          />
                          <button
                            type="button"
                            className={styles.remover}
                            title={
                              isSeed && option.id
                                ? 'Alternativa do catálogo padrão — não pode ser removida'
                                : 'Remover alternativa'
                            }
                            aria-label={`Remover alternativa ${j + 1} do item ${i + 1}`}
                            onClick={() => removeOption(item.key, option.key)}
                            disabled={isSeed && Boolean(option.id)}
                          >
                            <IconX />
                          </button>
                        </li>
                      ))}
                    </ol>
                    <Button
                      size="sm"
                      variant="ghost"
                      iconLeft={<IconPlus />}
                      onClick={() => addOption(item.key)}
                    >
                      Adicionar alternativa
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )
      )}
    </FormSection>
  )
}
