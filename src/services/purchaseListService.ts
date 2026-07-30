import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'

/**
 * CARRINHO DE COMPRAS DE MATERIAIS.
 *
 * O dentista lembra do que falta no meio do atendimento, não na hora de
 * comprar. O carrinho guarda essa lembrança até o dia do pedido — e o pedido
 * SE PARTE por fornecedor, porque `material_supplier` é N:N.
 *
 * Material vendido por vários distribuidores vai para TODOS eles: o pedido é
 * de COTAÇÃO, e comparar preço exige mais de uma resposta. Mandar para um só
 * faria a clínica comprar do primeiro da ordem alfabética pelo preço que ele
 * quisesse.
 */

export interface PurchaseItem {
  id: string
  materialId?: string
  /** Nome do material do catálogo, ou o que foi dito quando não existe. */
  nome: string
  /** `true` quando veio de fala e não do catálogo — a tela avisa. */
  foraDoCatalogo: boolean
  quantidade?: number
  unidade?: string
  observacao?: string
  criadoEm: string
}

type Row = {
  id: string
  material_id: string | null
  label: string | null
  quantity: number | null
  unit: string | null
  notes: string | null
  created_at: string
  material: { name: string } | null
}

// EMBED PELO NOME DA TABELA, não pela coluna da FK.
//
// A sintaxe do PostgREST é `apelido:ALVO(colunas)`, e o alvo é a TABELA. Escrito
// como `patient:patient_id(name)`, ele procurava uma relação chamada
// "patient_id" — que não existe — e devolvia 400 (PGRST200) na requisição
// inteira, derrubando a lista junto. O apelido ainda por cima era redundante:
// já era igual ao nome da tabela, então tirá-lo não muda a chave do JSON.
const COLUNAS = 'id, material_id, label, quantity, unit, notes, created_at, material ( name )'

function toItem(r: Row): PurchaseItem {
  return {
    id: r.id,
    materialId: r.material_id ?? undefined,
    nome: r.material?.name ?? r.label ?? '—',
    foraDoCatalogo: !r.material_id,
    quantidade: r.quantity != null ? Number(r.quantity) : undefined,
    unidade: r.unit ?? undefined,
    observacao: r.notes ?? undefined,
    criadoEm: isoToBrDate(r.created_at) ?? '',
  }
}

/** O que ainda não foi cotado, na ordem em que entrou. */
export async function listPurchaseList(): Promise<PurchaseItem[]> {
  const { data, error } = await supabase
    .from('purchase_list_item')
    .select(COLUNAS)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as unknown as Row[]).map(toItem)
}

export interface NewPurchaseItem {
  /** Do catálogo. Sem ele, `label` é obrigatório. */
  materialId?: string
  label?: string
  quantidade?: number
  unidade?: string
  observacao?: string
}

/**
 * Põe no carrinho.
 *
 * O índice parcial recusa o mesmo material duas vezes enquanto ele estiver
 * pendente — é o erro que acontece: o dentista pede na segunda e esquece que
 * já pediu na terça.
 */
export async function addToPurchaseList(item: NewPurchaseItem): Promise<void> {
  const { error } = await supabase.from('purchase_list_item').insert({
    clinic_id: getCurrentClinicId(),
    material_id: item.materialId ?? null,
    label: item.materialId ? null : (item.label?.trim() || null),
    quantity: item.quantidade ?? null,
    unit: item.unidade?.trim() || null,
    notes: item.observacao?.trim() || null,
  })
  if (error) {
    if (error.code === '23505') throw new Error('Esse material já está no carrinho.')
    throw error
  }
}

export async function removeFromPurchaseList(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('purchase_list_item').delete().eq('id', id).select('id')
  if (error) throw error
  // Zero linhas = a RLS recusou. Sem isto a tela diria "removido" sobre uma
  // exclusão que não aconteceu.
  if (!data?.length) throw new Error('Sem permissão para remover este item.')
}

// ── O pedido de orçamento ────────────────────────────────────────────────────

export interface CartSupplierGroup {
  supplierId: string
  fornecedor: string
  itens: { id: string; nome: string; quantidade?: number; unidade?: string; observacao?: string }[]
}

export interface CartBySupplier {
  fornecedores: CartSupplierGroup[]
  /** Itens que NÃO têm fornecedor cadastrado — ninguém vai cotá-los. */
  semFornecedor: { id: string; nome: string; quantidade?: number; unidade?: string }[]
  totalItens: number
}

/** Agrupa o carrinho por fornecedor (RPC `carrinho_por_fornecedor`). */
export async function getCartBySupplier(): Promise<CartBySupplier> {
  const { data, error } = await supabase.rpc('carrinho_por_fornecedor')
  if (error) throw error
  const c = data as unknown as {
    fornecedores: { supplier_id: string; fornecedor: string; itens: CartSupplierGroup['itens'] }[]
    sem_fornecedor: CartBySupplier['semFornecedor']
    total_itens: number
  }
  return {
    fornecedores: (c.fornecedores ?? []).map(f => ({
      supplierId: f.supplier_id,
      fornecedor: f.fornecedor,
      itens: f.itens ?? [],
    })),
    semFornecedor: c.sem_fornecedor ?? [],
    totalItens: Number(c.total_itens ?? 0),
  }
}

/** A mensagem que vai para o fornecedor — a mesma que fica gravada no pedido. */
export function mensagemDoOrcamento(grupo: CartSupplierGroup, clinica: string): string {
  const linhas = grupo.itens.map(i => {
    const qtd = i.quantidade ? `${i.quantidade}${i.unidade ? ` ${i.unidade}` : ''} — ` : ''
    return `• ${qtd}${i.nome}${i.observacao ? ` (${i.observacao})` : ''}`
  })
  return [
    `Olá! Aqui é da ${clinica}.`,
    'Gostaríamos de um orçamento para os itens abaixo:',
    '',
    ...linhas,
    '',
    'Pode nos enviar preço e prazo de entrega? Obrigado!',
  ].join('\n')
}

/**
 * Grava o pedido e marca os itens como cotados.
 *
 * O ENVIO não acontece aqui: quem envia é a Edge Function de WhatsApp, e a
 * gravação vem antes de propósito. Se o envio falhar, o pedido fica com o
 * motivo registrado em vez de desaparecer — e o dentista descobre olhando,
 * não quando o material não chega.
 */
export async function registrarOrcamento(
  supplierId: string,
  mensagem: string,
  itemIds: string[],
): Promise<string> {
  const clinicId = getCurrentClinicId()
  const { data: quote, error } = await supabase
    .from('purchase_quote')
    .insert({ clinic_id: clinicId, supplier_id: supplierId, message: mensagem, status: 'draft' })
    .select('id')
    .single()
  if (error) throw error

  const { error: linkError } = await supabase.from('purchase_quote_item').insert(
    itemIds.map(id => ({ clinic_id: clinicId, quote_id: quote.id, list_item_id: id })),
  )
  if (linkError) throw linkError

  const { error: statusError } = await supabase
    .from('purchase_list_item').update({ status: 'quoted' }).in('id', itemIds)
  if (statusError) throw statusError

  return quote.id as string
}

/** Registra o desfecho do envio — sucesso ou o motivo da falha. */
export async function marcarEnvioDoOrcamento(
  quoteId: string, ok: boolean, erro?: string,
): Promise<void> {
  await supabase.from('purchase_quote').update({
    status: ok ? 'sent' : 'failed',
    sent_at: ok ? new Date().toISOString() : null,
    error: ok ? null : (erro ?? 'Falha no envio'),
  }).eq('id', quoteId)
}
