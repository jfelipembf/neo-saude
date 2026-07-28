#!/usr/bin/env node
/**
 * IMPORTA O CATÁLOGO DE MEDICAMENTOS da Lista de Preços da CMED/ANVISA.
 *
 * É a única fonte brasileira pública e estruturada de medicamentos: 25.702
 * apresentações, das quais ~13 mil comercializadas. Traz princípio ativo,
 * marca, apresentação, laboratório, registro, EAN, tarja e classe terapêutica.
 * NÃO traz indicação, posologia nem contraindicação — isso não existe em forma
 * estruturada em nenhuma fonte pública (ver docs/bulario.md).
 *
 * POR QUE AQUI, e não numa Edge Function como o import-cid10:
 *
 *   `dados.anvisa.gov.br` serve a cadeia TLS INCOMPLETA — manda só o
 *   certificado folha, sem o intermediário Sectigo. O Deno (e o Node, e o
 *   Python) recusa: UNABLE_TO_VERIFY_LEAF_SIGNATURE. O curl no macOS passa
 *   porque o keychain busca o intermediário via AIA. Rodar isto numa Edge
 *   Function significa 100% de falha.
 *
 *   A saída NÃO é `rejectUnauthorized: false` — isso troca um problema de
 *   cadeia por um buraco de man-in-the-middle num arquivo que vira dado
 *   clínico. Este script baixa via `curl` (que resolve a cadeia) e valida o
 *   tamanho antes de parsear.
 *
 * IDEMPOTENTE: upsert por CÓDIGO GGREM. Pode rodar de novo a cada publicação
 * da CMED (mensal) sem duplicar.
 *
 * Uso — a URL sai do .env do projeto; só a chave de serviço precisa vir na
 * linha de comando (ela NÃO fica no .env de propósito: é a chave que ignora
 * toda a RLS, e .env de front acaba versionado mais cedo ou mais tarde):
 *
 *   SUPABASE_SERVICE_ROLE_KEY='eyJ...' node scripts/import-cmed.mjs
 *
 * A chave está no painel do Supabase em Project Settings → API → service_role.
 */
import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const FONTE = 'https://dados.anvisa.gov.br/dados/TA_PRECO_MEDICAMENTO.csv'
const TAMANHO_MINIMO = 5_000_000   // ~16 MB hoje; abaixo disso veio página de erro
const LOTE = 500

/** Lê uma chave do .env do projeto, para não obrigar a repetir o que já está lá. */
function doEnvArquivo(nome) {
  try {
    const linha = readFileSync(new URL('../.env', import.meta.url), 'utf8')
      .split('\n').find(l => l.trim().startsWith(`${nome}=`))
    return linha ? linha.slice(linha.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '') : null
  } catch { return null }
}

const url = process.env.SUPABASE_URL || doEnvArquivo('VITE_SUPABASE_URL')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Valida ANTES de baixar 16 MB.
 *
 * A checagem original era só `if (!url || !key)` — e a string "..." de um
 * exemplo copiado passa nela. O script rodava três minutos e só quebrava no
 * fim, com "Invalid supabaseUrl". Conferir a FORMA, e conferir cedo.
 */
function exigir(condicao, mensagem) {
  if (condicao) return
  console.error(`\n${mensagem}\n`)
  console.error('  SUPABASE_SERVICE_ROLE_KEY=\'eyJ…\' node scripts/import-cmed.mjs')
  console.error('  (a chave fica no painel do Supabase: Project Settings → API → service_role)\n')
  process.exit(1)
}

exigir(url && /^https?:\/\/[^.]+\.[^/]+/.test(url),
  url ? `URL inválida: ${url}` : 'Faltou a URL do Supabase (nem em SUPABASE_URL nem no .env).')
// A service_role é um JWT: começa com 'eyJ' e tem os três segmentos. Chave
// anon também casa com isso, mas ela é barrada depois pela própria RLS — o
// que este teste pega é o placeholder e o copiar-e-colar truncado.
exigir(key && key.startsWith('eyJ') && key.split('.').length === 3,
  key ? 'SUPABASE_SERVICE_ROLE_KEY não parece um JWT.' : 'Faltou SUPABASE_SERVICE_ROLE_KEY.')

console.log(`Destino: ${url}`)

/**
 * Parser CSV de verdade (RFC4180), e não `split(';')`.
 *
 * 3.886 das 25.702 linhas (15,1%) têm ';' DENTRO do campo SUBSTÂNCIA, entre
 * aspas: "21-ACETATO DE DEXAMETASONA;CLOTRIMAZOL". Partir a linha no ';' cru
 * corrompe 1 em cada 7 registros — e corrompe em silêncio, deslocando todas as
 * colunas seguintes.
 */
function parseCsv(texto, sep = ';') {
  const linhas = []
  let campo = '', linha = [], aspas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (aspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++ } else { aspas = false }
      } else campo += c
    } else if (c === '"') {
      aspas = true
    } else if (c === sep) {
      linha.push(campo); campo = ''
    } else if (c === '\n') {
      linha.push(campo); linhas.push(linha); linha = []; campo = ''
    } else if (c !== '\r') {
      campo += c
    }
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha) }
  return linhas
}

/** Vazio na CMED vem como '-', '- (*)' ou uma sequência de espaços e traços. */
function limpo(v) {
  const t = (v ?? '').trim()
  if (!t) return null
  return [...t].every(ch => '- *()'.includes(ch)) ? null : t
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), 'cmed-'))
  const arquivo = join(dir, 'cmed.csv')

  console.log('Baixando a lista da CMED…')
  // curl, não fetch: ver o comentário de cadeia TLS no topo.
  execFileSync('curl', ['-sSL', '--max-time', '300', '-o', arquivo, FONTE], { stdio: 'inherit' })
  if (!existsSync(arquivo)) throw new Error('Download não produziu arquivo.')

  const texto = readFileSync(arquivo, 'utf8').replace(/^﻿/, '')  // UTF-8 com BOM
  if (texto.length < TAMANHO_MINIMO) {
    throw new Error(`Arquivo com ${texto.length} bytes — esperado > ${TAMANHO_MINIMO}. Provável página de erro.`)
  }

  const linhas = parseCsv(texto)

  // O cabeçalho NÃO é a primeira linha: vêm ~41 registros de notas e glossário
  // antes, e as notas contêm quebras de linha dentro de campos entre aspas —
  // por isso a posição é procurada, nunca fixa.
  const iCab = linhas.findIndex(l => (l[0] ?? '').trim() === 'SUBSTÂNCIA')
  if (iCab < 0) throw new Error('Cabeçalho não encontrado — o layout da CMED mudou.')
  const cab = linhas[iCab].map(c => c.trim())
  const col = Object.fromEntries(cab.map((c, i) => [c, i]))
  const g = (l, k) => (col[k] != null && col[k] < l.length ? (l[col[k]] ?? '').trim() : '')

  // Data de publicação, das notas do topo: é a proveniência da linha.
  const cabecalhoTexto = linhas.slice(0, iCab).flat().join(' ')
  const m = cabecalhoTexto.match(/Publicada em (\d{2})\/(\d{2})\/(\d{4})/)
  const publicadaEm = m ? `${m[3]}-${m[2]}-${m[1]}` : null
  console.log(`Cabeçalho no registro ${iCab}. Lista publicada em ${publicadaEm ?? 'data não identificada'}.`)

  const vistos = new Set()
  const produtos = []
  for (const l of linhas.slice(iCab + 1)) {
    const nome = g(l, 'PRODUTO')
    if (!nome) continue
    const ggrem = limpo(g(l, 'CÓDIGO GGREM'))
    if (ggrem && vistos.has(ggrem)) continue
    if (ggrem) vistos.add(ggrem)

    const ean = limpo(g(l, 'EAN 1'))
    produtos.push({
      ggrem,
      anvisa_registro: limpo(g(l, 'REGISTRO')),
      ean: ean && /^\d{8,14}$/.test(ean) ? ean : null,
      name: nome,
      presentation: limpo(g(l, 'APRESENTAÇÃO')),
      manufacturer: limpo(g(l, 'LABORATÓRIO')),
      // O split(';') acontece SÓ AQUI — depois de o parser CSV ter resolvido as
      // aspas. É o que separa "componentes de uma associação" de "coluna
      // corrompida".
      substances: g(l, 'SUBSTÂNCIA').split(';').map(s => s.trim()).filter(Boolean),
      therapeutic_class: limpo(g(l, 'CLASSE TERAPÊUTICA')),
      product_type: limpo(g(l, 'TIPO DE PRODUTO (STATUS DO PRODUTO)')),
      tarja: limpo(g(l, 'TARJA')),
      hospital_only: /^sim/i.test(g(l, 'RESTRIÇÃO HOSPITALAR')),
      commercialized: /^sim/i.test(g(l, 'COMERCIALIZAÇÃO 2025')),
      source_published_on: publicadaEm,
    })
  }
  console.log(`${produtos.length} apresentações lidas.`)

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  for (let i = 0; i < produtos.length; i += LOTE) {
    const lote = produtos.slice(i, i + LOTE)
    const { error } = await supabase.from('drug_product').upsert(lote, { onConflict: 'ggrem' })
    if (error) throw new Error(`Lote ${i / LOTE}: ${error.message}`)
    process.stdout.write(`\r  ${Math.min(i + LOTE, produtos.length)}/${produtos.length}`)
  }
  console.log('\nProdutos gravados.')

  // Princípios ativos distintos, para a busca por substância.
  const substancias = [...new Set(produtos.flatMap(p => p.substances))].sort()
  const linhasSub = substancias.map(nome => ({
    slug: nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
              .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120),
    name_pt: nome,
  }))
  // Slug pode colidir depois de normalizar; a primeira ocorrência vence.
  const porSlug = new Map()
  for (const s of linhasSub) if (s.slug && !porSlug.has(s.slug)) porSlug.set(s.slug, s)

  for (let i = 0; i < porSlug.size; i += LOTE) {
    const lote = [...porSlug.values()].slice(i, i + LOTE)
    const { error } = await supabase.from('drug_substance').upsert(lote, { onConflict: 'slug' })
    if (error) throw new Error(`Substâncias lote ${i / LOTE}: ${error.message}`)
  }
  console.log(`${porSlug.size} princípios ativos gravados.`)
}

main().catch(e => { console.error('\nFalhou:', e.message); process.exit(1) })
