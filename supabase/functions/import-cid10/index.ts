import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * IMPORTA A TABELA CID-10 do DATASUS.
 *
 * Roda aqui, e não numa migration, por duas razões concretas:
 *
 *  1. O CSV oficial vem em ISO-8859-1. O `http` do Postgres tenta decodificar a
 *     resposta como UTF-8 e aborta ("invalid byte sequence") antes de qualquer
 *     conversão ser possível. O `TextDecoder` do Deno lê latin1 nativamente.
 *  2. São 12 mil linhas — mandar isso como SQL literal seria uma migration de
 *     mais de 1 MB, ilegível e impossível de revisar.
 *
 * É IDEMPOTENTE (`upsert` na chave `code`): pode rodar de novo quando o DATASUS
 * publicar revisão, sem duplicar nem apagar nada.
 *
 * Invocar:
 *   supabase functions invoke import-cid10
 */

const FONTE = 'https://raw.githubusercontent.com/cleytonferrari/CidDataSus'
  + '/master/CIDImport/Repositorio/Resources/CID-10-SUBCATEGORIAS.CSV'

Deno.serve(async () => {
  const url = Deno.env.get('SUPABASE_URL')
  // A chave de serviço é injetada pelo runtime — nunca sai daqui, e é o que
  // permite escrever numa tabela sem policy de INSERT (o CID é semeado, não
  // editado por usuário).
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ erro: 'Ambiente sem SUPABASE_URL/SERVICE_ROLE_KEY.' }), { status: 500 })
  }

  const resposta = await fetch(FONTE)
  if (!resposta.ok) {
    return new Response(JSON.stringify({ erro: `Fonte respondeu ${resposta.status}.` }), { status: 502 })
  }

  const bytes = new Uint8Array(await resposta.arrayBuffer())
  const texto = new TextDecoder('iso-8859-1').decode(bytes)

  const linhas = texto.split('\n')
  const registros: { code: string; description: string }[] = []
  for (const linha of linhas) {
    const campos = linha.split(';')
    const code = (campos[0] ?? '').trim()
    const description = (campos[4] ?? '').trim()
    // Cabeçalho e linhas truncadas caem fora: código sem descrição no atestado
    // seria um CID que ninguém consegue conferir.
    if (!code || code === 'SUBCAT' || !description) continue
    registros.push({ code, description })
  }

  if (registros.length === 0) {
    return new Response(JSON.stringify({ erro: 'Nenhum código lido — o formato da fonte mudou?' }), { status: 502 })
  }

  const supabase = createClient(url, serviceKey)

  // Em lotes: um upsert de 12 mil linhas estoura o limite de payload do
  // PostgREST, e falhar no meio deixaria a tabela pela metade sem aviso.
  const TAMANHO = 1000
  let gravados = 0
  for (let i = 0; i < registros.length; i += TAMANHO) {
    const lote = registros.slice(i, i + TAMANHO)
    const { error } = await supabase.from('cid10').upsert(lote, { onConflict: 'code' })
    if (error) {
      return new Response(JSON.stringify({
        erro: `Falhou no lote a partir de ${i}: ${error.message}`,
        gravados,
      }), { status: 500 })
    }
    gravados += lote.length
  }

  return new Response(JSON.stringify({ ok: true, lidos: registros.length, gravados }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
