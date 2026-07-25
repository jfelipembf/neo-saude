import { describe, expect, it } from 'vitest'
import { activeGroups, categoryPath } from './financeCategoryService'
import type { FinanceCategory, FinanceCategoryNode } from '@/types/domain'

const CLINIC = 'c1'

function cat(over: Partial<FinanceCategory> & { name: string }): FinanceCategory {
  return {
    id: over.name,
    clinicId: CLINIC,
    name: over.name,
    kind: over.kind ?? 'expense',
    isSeed: over.isSeed ?? true,
    status: over.status ?? 'active',
    parentId: over.parentId,
  }
}

function node(
  over: Partial<FinanceCategory> & { name: string },
  children: FinanceCategory[] = [],
): FinanceCategoryNode {
  return { ...cat(over), children }
}

describe('activeGroups', () => {
  const tree: FinanceCategoryNode[] = [
    node({ name: 'Despesas', kind: 'expense' }, [
      cat({ name: 'Aluguel', kind: 'expense', parentId: 'Despesas' }),
      cat({ name: 'Correios', kind: 'expense', parentId: 'Despesas', status: 'inactive' }),
    ]),
    node({ name: 'Impostos', kind: 'expense', status: 'inactive' }, [
      cat({ name: 'ISS', kind: 'expense', parentId: 'Impostos' }),
    ]),
    node({ name: 'Receitas', kind: 'revenue' }, [
      cat({ name: 'Mensalidade', kind: 'revenue', parentId: 'Receitas' }),
    ]),
  ]

  it('traz só o lado pedido — conta a pagar não pode oferecer receita', () => {
    expect(activeGroups(tree, 'expense').map(g => g.name)).toEqual(['Despesas'])
    expect(activeGroups(tree, 'revenue').map(g => g.name)).toEqual(['Receitas'])
  })

  it('esconde a subcategoria inativa, mantendo as ativas', () => {
    const [despesas] = activeGroups(tree, 'expense')
    expect(despesas.children.map(c => c.name)).toEqual(['Aluguel'])
  })

  it('pai inativo leva os filhos ATIVOS junto', () => {
    // "Impostos" está inativa mas "ISS" está ativa. Oferecer ISS num formulário
    // com o grupo desligado seria uma subcategoria órfã na prática — e a pessoa
    // não teria como entender por que ela sumiu da aba mas continua no seletor.
    const nomes = activeGroups(tree, 'expense').flatMap(g => g.children.map(c => c.name))
    expect(nomes).not.toContain('ISS')
  })

  it('não altera a árvore recebida', () => {
    const antes = JSON.stringify(tree)
    activeGroups(tree, 'expense')
    expect(JSON.stringify(tree)).toBe(antes)
  })

  it('devolve lista vazia sem estourar quando ainda não carregou', () => {
    expect(activeGroups([], 'expense')).toEqual([])
  })
})

describe('categoryPath', () => {
  it('junta pai e filho no rótulo que fica congelado no lançamento', () => {
    expect(categoryPath({ name: 'Despesas' }, { name: 'Aluguel' })).toBe('Despesas › Aluguel')
  })

  it('categoria sem subcategoria usa só o próprio nome', () => {
    expect(categoryPath({ name: 'Atendimento' })).toBe('Atendimento')
  })
})
