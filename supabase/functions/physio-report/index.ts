// AVALIAÇÃO FINAL E RECOMENDAÇÕES do relatório de evolução da fisioterapia.
//
// ⚠️ ESTA FUNÇÃO NÃO ESCREVE O RELATÓRIO. Ela recebe os dados JÁ MEDIDOS e
// devolve APENAS os parágrafos de leitura clínica. As tabelas — escores,
// sinais vitais, datas, contagem de sessões — são montadas no cliente, direto
// do banco (src/utils/physioReportDocument.ts), e não passam por aqui de volta.
//
// O motivo é o destino do papel: ele sai impresso e assinado por um
// fisioterapeuta, e vai para o paciente ou para o convênio. Se o modelo
// escrevesse os números, um 15° que virasse 25° não teria como ser percebido
// lendo o relatório — e quem assina não foi quem digitou.
//
// Chave do Gemini/OpenAI só existe aqui (Deno.env), nunca no bundle do cliente.
// Nada é gravado: os dados vivem só na memória desta invocação.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

/** Teto de parágrafos. Relatório de evolução que vira ensaio não é lido. */
const MAX_PARAGRAFOS = 3

const REGRAS = `Você é fisioterapeuta e está redigindo a seção final de um relatório de
evolução — "Avaliação final e recomendações" — que será IMPRESSO e ASSINADO, e
entregue ao paciente, ao médico ou ao convênio.

QUEM LÊ TEM PRESSA. Escreva NO MÁXIMO ${MAX_PARAGRAFOS} parágrafos curtos (2 a 4 frases cada),
em português do Brasil, em terceira pessoa. Relatório longo não é lido, e um
relatório não lido não serve para nada.

ESTRUTURA, nesta ordem:
1. Como o paciente evoluiu, à luz do DIAGNÓSTICO e dos achados da abertura.
2. RECOMENDAÇÕES objetivas: manter, progredir, encaminhar, ou alta.

REGRAS INEGOCIÁVEIS:
- Use SOMENTE os dados fornecidos. Não invente escore, data, sessão, diagnóstico
  nem conduta que não esteja no JSON.
- NÃO REPITA AS TABELAS. Diagnóstico, achados, escores e evolução já estão
  impressos acima. Cite um valor apenas quando ele for o argumento da frase,
  nunca para listar.
- Interprete a DIREÇÃO de cada instrumento: na Escala de Berg e no TC6 o escore
  maior é melhor; no TUG, na goniometria de DÉFICIT e nas escalas de dor, o
  menor é melhor. A tabela mostra a diferença sem adjetivo porque essa leitura
  é sua.
- Instrumento aplicado uma única vez NÃO tem evolução: trate como medida inicial.
- Se os dados forem insuficientes para afirmar evolução, DIGA ISSO e recomende o
  que medir. É conclusão legítima, e melhor que afirmação inventada.
- Não afirme eficácia de conduta nem faça prognóstico numérico ("em 4 sessões
  estará curada"). Recomendar alta é permitido; decretá-la não — quem decide é
  quem assina.
- Sem saudação, sem título, sem markdown, sem lista.

Formato de saída: APENAS um JSON válido, no formato
{"paragrafos": ["...", "..."]}
Nada antes, nada depois, sem crase de bloco de código.`

/** Extrai o JSON mesmo quando o modelo embrulha em crases. */
function lerParagrafos(texto: string): string[] {
  const limpo = texto.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try {
    const obj = JSON.parse(limpo) as { paragrafos?: unknown }
    if (!Array.isArray(obj.paragrafos)) return []
    return obj.paragrafos
      .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
      .map(p => p.trim())
      .slice(0, MAX_PARAGRAFOS)
  } catch {
    return []
  }
}

/**
 * MESMO modelo e MESMA forma de chamada do transcribe-audio, que está em
 * produção com esta chave.
 *
 * A primeira versão daqui usava `gemini-2.0-flash`, a chave na query string e
 * `responseMimeType: 'application/json'` — e falhava calada, caindo para o
 * OpenAI pela rede de reserva. Divergir da chamada que sabidamente funciona,
 * num ponto onde a falha é silenciosa, foi o erro: o modelo certo é o que o
 * projeto já usa, não o que parece razoável.
 *
 * O JSON de saída é pedido no PROMPT (ver REGRAS) e desembrulhado por
 * `lerParagrafos`, em vez de exigido pela API — é como a outra função faz, e
 * não depende de um recurso que pode não existir na versão da API.
 */
const GEMINI_MODEL = 'gemini-3.6-flash'

async function viaGemini(chave: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': chave, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    },
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function viaOpenAI(chave: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chave}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não suportado.' }, 405)

  // A chamada exige o JWT do usuário: sem ele, qualquer um mandaria dados para
  // consumir a cota de IA da conta.
  if (!req.headers.get('authorization')) return json({ error: 'Não autenticado.' }, 401)

  let dados: unknown
  try {
    dados = await req.json()
  } catch {
    return json({ error: 'Corpo inválido.' }, 400)
  }

  const prompt = `${REGRAS}\n\nDados do tratamento:\n${JSON.stringify(dados)}`

  const gemini = Deno.env.get('GEMINI_API_KEY')
  const openai = Deno.env.get('OPENAI_API_KEY')
  if (!gemini && !openai) return json({ error: 'Nenhum provedor de IA configurado.' }, 500)

  /**
   * DOIS PROVEDORES, um de reserva. O relatório é gerado no meio do
   * atendimento, com o paciente esperando o papel — e uma indisponibilidade de
   * um fornecedor não pode ser o motivo de o documento não sair.
   *
   * O cliente também tem a sua própria rede: sem análise, ele imprime o
   * relatório só com as tabelas. Aqui a falha é reportada, não escondida.
   */
  const tentativas: { nome: string; run: () => Promise<string> }[] = []
  if (gemini) tentativas.push({ nome: 'gemini', run: () => viaGemini(gemini, prompt) })
  if (openai) tentativas.push({ nome: 'openai', run: () => viaOpenAI(openai, prompt) })

  if (!gemini) {
    // Sem isto a ausência da chave era indistinguível de uma falha do Gemini:
    // os dois acabavam no OpenAI, em silêncio.
    console.warn('[physio-report] GEMINI_API_KEY ausente — indo direto ao OpenAI.')
  }

  const erros: string[] = []
  for (const t of tentativas) {
    try {
      const paragrafos = lerParagrafos(await t.run())
      if (paragrafos.length > 0) return json({ paragrafos, provider: t.nome })
      erros.push(`${t.nome}: resposta sem parágrafos`)
      // LOGA CADA FALHA NA HORA, e não só quando TODAS falham. O provedor
      // preferido cair e o reserva salvar produzia log nenhum — foi assim que
      // o modelo errado passou despercebido até alguém reparar no `provider`
      // da resposta.
      console.warn('[physio-report] provedor sem parágrafos:', t.nome)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      erros.push(`${t.nome}: ${msg}`)
      console.warn(`[physio-report] provedor falhou (${t.nome}):`, msg)
    }
  }

  console.error('[physio-report] nenhuma análise gerada:', erros.join(' | '))
  return json({ error: 'Não foi possível gerar a análise.', paragrafos: [] }, 502)
})
