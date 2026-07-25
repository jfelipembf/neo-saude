import type { EditTestItem } from '@/services/testsService'
import type { PhysioTestItem, TestItemInputKind, TestScoringKind } from '@/types/domain'

// Estado e regras do editor de ITENS do catálogo de testes (TestItemsEditor).
// Fora do .tsx porque nada aqui é componente — e misturar os dois quebra o
// fast refresh do Vite (react-refresh/only-export-components).

/**
 * Uma alternativa no formulário. `points` fica como TEXTO enquanto se edita
 * (mesmo motivo dos limites de nível): guardado como número, apagar o campo
 * para redigitar viraria 0 — e 0 é pontuação legítima em quase todo item.
 */
export interface OptionFormState {
  /** Chave de render. O `id` do banco não serve: alternativa nova ainda não tem. */
  key: string
  /** Presente = alternativa que já existe no catálogo (é atualizada no lugar). */
  id?: string
  label: string
  points: string
}

export interface ItemFormState {
  key: string
  id?: string
  label: string
  help: string
  inputKind: TestItemInputKind
  options: OptionFormState[]
}

let seq = 0
const nextKey = (prefix: string) => `${prefix}-${++seq}`

export const newOption = (): OptionFormState => ({ key: nextKey('op'), label: '', points: '' })

export const newItem = (): ItemFormState => ({
  key: nextKey('it'), label: '', help: '', inputKind: 'options', options: [newOption()],
})

/** Item do catálogo → linha do formulário, MANTENDO o id: é ele que faz o
 *  syncItems atualizar a linha no lugar em vez de recriá-la, preservando o
 *  ponteiro das respostas já gravadas nos prontuários. */
export const itemToForm = (i: PhysioTestItem): ItemFormState => ({
  key: nextKey('it'),
  id: i.id,
  label: i.label,
  help: i.help ?? '',
  inputKind: i.inputKind,
  options: i.options.map(o => ({ key: nextKey('op'), id: o.id, label: o.label, points: String(o.points) })),
})

function parsePoints(text: string): number | undefined {
  const raw = text.trim().replace(',', '.')
  if (!raw) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

/** Linha que o usuário adicionou e deixou totalmente em branco — some no
 *  salvamento em vez de virar erro. Só vale para linha NOVA: apagar o texto de
 *  um item que já existe é engano, não "remoção", e a validação acusa. */
const isBlankNewOption = (o: OptionFormState) => !o.id && !o.label.trim() && !o.points.trim()
const isBlankNewItem = (i: ItemFormState) =>
  !i.id && !i.label.trim() && !i.help.trim() && i.options.every(isBlankNewOption)

/** O que de fato vai para o banco (descartadas as linhas em branco novas). */
export function itemsToPayload(items: ItemFormState[]): EditTestItem[] {
  return items.filter(i => !isBlankNewItem(i)).map(i => ({
    id: i.id,
    label: i.label.trim(),
    help: i.help.trim() || undefined,
    inputKind: i.inputKind,
    // Item numérico não tem alternativa a escolher — o profissional digita.
    options: i.inputKind === 'number'
      ? []
      : i.options.filter(o => !isBlankNewOption(o)).map(o => ({
          id: o.id,
          label: o.label.trim(),
          points: parsePoints(o.points) ?? 0,
        })),
  }))
}

/** Primeiro problema do cadastro de itens, ou undefined se está tudo certo. */
export function validateItems(scoringKind: TestScoringKind, items: ItemFormState[]): string | undefined {
  const kept = items.filter(i => !isBlankNewItem(i))

  if (scoringKind === 'sum_items' && kept.length === 0) {
    return 'Um teste somado por itens precisa de pelo menos um item — cadastre os itens ou volte a pontuação para "Valor medido".'
  }
  for (const item of kept) {
    if (!item.label.trim()) return 'Todo item precisa de um enunciado.'
    if (item.inputKind === 'number') continue
    const options = item.options.filter(o => !isBlankNewOption(o))
    if (options.length === 0) {
      return `O item "${item.label.trim()}" é de alternativas: cadastre ao menos uma (ou mude para "Número").`
    }
    for (const option of options) {
      if (!option.label.trim()) return `Toda alternativa do item "${item.label.trim()}" precisa de texto.`
      if (parsePoints(option.points) == null) {
        return `A alternativa "${option.label.trim()}" precisa de uma pontuação numérica.`
      }
    }
  }
  return undefined
}
