import { createClient } from 'jsr:@supabase/supabase-js@2'
import { encodeBase64 } from 'jsr:@std/encoding/base64'

// FORMATAÇÃO do prontuário de fisioterapia com IA (RichTextEditor: botão de
// microfone E botão "Aprimorar com IA"). Aceita DUAS entradas — nunca as
// duas juntas:
//   · campo `audio` (multipart) — ditado: transcreve a fala e já devolve
//     estruturado (Gemini entende áudio nativamente, uma chamada só).
//   · campo `text` (multipart) — "Aprimorar com IA": pega o que o usuário já
//     digitou e reorganiza no formato SOAP, sem inventar conteúdo novo.
// Nos dois casos a saída é a MESMA: HTML no formato SOAP (Subjetivo/
// Objetivo/Avaliação/Plano), conforme a Resolução COFFITO nº 414/2012.
//
// Chave do Gemini só existe aqui (Deno.env) — nunca chega no bundle do
// cliente. Sem gravação de áudio em disco/storage: o Blob vive só na memória
// desta invocação, descartado ao responder.

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

const SOAP_RULES = `Formato de saída: APENAS HTML simples (sem markdown, sem comentário fora do
HTML, sem crase de bloco de código), um parágrafo por seção presente:
<p><strong>Subjetivo:</strong> o que o paciente relatou sobre a condição.</p>
<p><strong>Objetivo:</strong> o que o fisioterapeuta observou/mediu (amplitude de movimento, força, dor, testes).</p>
<p><strong>Avaliação:</strong> raciocínio clínico sobre o que foi relatado e observado.</p>
<p><strong>Plano:</strong> conduta e progressão para a próxima sessão.</p>

Regras:
- Se não houver informação para alguma seção, OMITA essa seção — não invente conteúdo clínico.
- Não adicione título, saudação ou qualquer texto fora dos parágrafos SOAP.
- Mantenha a terminologia e os números (graus, escalas 0-10, repetições) exatamente como foram informados — não invente dado novo.`

const AUDIO_PROMPT = `Transcreva o áudio em anexo (fala de um fisioterapeuta narrando um atendimento) e
organize o conteúdo em uma nota de evolução clínica no formato SOAP, conforme a
Resolução COFFITO nº 414/2012 (prontuário fisioterapêutico).

${SOAP_RULES}`

const TEXT_PROMPT = `Reorganize a nota de evolução abaixo, escrita por um fisioterapeuta, no formato SOAP,
conforme a Resolução COFFITO nº 414/2012 (prontuário fisioterapêutico). O texto pode já
estar em HTML — trate como o conteúdo em si, não copie tags soltas.

${SOAP_RULES}

Nota original:
"""
{{NOTE}}
"""`

const GEMINI_MODEL = 'gemini-3.6-flash'

async function callGemini(geminiKey: string, parts: Record<string, unknown>[]) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': geminiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0 },
      }),
    },
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiKey) return json({ error: 'Formatação por IA não configurada (GEMINI_API_KEY ausente).' }, 500)

  // Só confere que existe uma sessão válida — a função não lê nem grava nada
  // no banco, é um proxy sem estado, então não há feature/clínica pra checar.
  const authHeader = req.headers.get('Authorization') ?? ''
  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user }, error: userErr } = await caller.auth.getUser()
  if (userErr || !user) return json({ error: 'Sessão inválida.' }, 401)

  let form: FormData
  try { form = await req.formData() } catch { return json({ error: 'Corpo inválido (esperado multipart/form-data).' }, 400) }

  const audio = form.get('audio')
  const text = form.get('text')

  let geminiRes: Response
  if (audio instanceof File) {
    const bytes = new Uint8Array(await audio.arrayBuffer())
    const base64Audio = encodeBase64(bytes)
    const mimeType = audio.type || 'audio/webm'
    geminiRes = await callGemini(geminiKey, [
      { text: AUDIO_PROMPT },
      { inlineData: { mimeType, data: base64Audio } },
    ])
  } else if (typeof text === 'string' && text.trim()) {
    geminiRes = await callGemini(geminiKey, [
      { text: TEXT_PROMPT.replace('{{NOTE}}', text) },
    ])
  } else {
    return json({ error: 'Envie um áudio (campo "audio") ou um texto (campo "text").' }, 400)
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text()
    return json({ error: `Falha ao formatar o prontuário: ${detail}` }, 502)
  }
  const geminiData = await geminiRes.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const html = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!html) return json({ error: 'A IA não devolveu um prontuário estruturado.' }, 422)

  return json({ html })
})
