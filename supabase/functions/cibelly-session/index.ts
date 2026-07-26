import { createClient } from 'jsr:@supabase/supabase-js@2'
// Caminho relativo para dentro de src/ de propósito: é o MESMO arquivo que o
// app usa, com os 65 testes do vitest em cima. As listas de nome brasileiro
// (composto, sobrenome, convênio, tratamento) são grandes demais para virarem
// uma cópia paralela aqui — `supabase/functions` está fora do eslint, do tsc e
// do vitest, então regra curada neste arquivo é regra que ninguém revisa.
// spokenName.ts NÃO importa nada, justamente para o Deno conseguir carregá-lo.
import { spokenName } from '../../../src/utils/spokenName.ts'
import { blocoDeHoje } from '../../../src/utils/spokenDate.ts'
// FONTE ÚNICA dos achados. Antes a lista vivia em três lugares (a union no
// TypeScript e os dois enums aqui) e saiu de sincronia: "aparelho" ficou fora
// dos enums, então marcar funcionava por acidente e remover não existia.
import {
  APICAL, DEFEITO, DISCROMIA, descricaoDosAchados, IDS_DOS_ACHADOS, MIGRACAO,
  PERI_IMPLANTE, PROFUNDIDADE, PROTESE, PULPA, REABSORCAO, VERTICAL,
} from '../../../src/lib/odontogramShell/toothCatalog.ts'
import { cibellyAgentPrompt } from '../../../src/lib/cibelly/cibellyAgent.ts'
import { CIBELLY_TOOL_CATALOG } from '../../../src/lib/cibelly/toolCatalog.ts'

// CIBELLY — assistente de voz do odontograma (fisioterapia usa Gemini/texto em
// transcribe-audio; isto aqui é odontologia, voz AO VIVO, provedor diferente:
// OpenAI Realtime API). Esta função NÃO fala com o navegador da consulta em si
// — ela só troca a chave real da OpenAI (que nunca pode chegar no bundle do
// cliente) por um token EFÊMERO de curta duração, que o navegador usa para
// abrir a conexão WebRTC diretamente com a OpenAI. O áudio nunca passa por
// aqui: só a troca de credencial.
//
// Function calling é o mecanismo central: o motor do odontograma só expõe
// "ler o estado inteiro"/"escrever o estado inteiro" (getOdontogramState/
// loadOdontogramState — ver src/lib/odontogramShell), não um "marcar dente X"
// isolado. Quem aplica a marcação de verdade é o cliente (useCibelly.ts +
// src/lib/odontogramShell/toothFields.ts), nunca esta função.
//
// Ela marca DIRETO, sem etapa de confirmação. A primeira versão propunha e
// esperava um "confirma?" falado — na prática dobrou os turnos e encheu o
// atendimento de "certo, vou preparar a proposta". A rede de segurança virou
// o DESFAZER (`desfazer_ultima_marcacao`), que devolve o estado exato de
// antes: errar e desfazer custa dois segundos, perguntar a cada achado custa
// o exame inteiro.

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

// Modelo de voz mais recente da OpenAI Realtime API (gpt-realtime-2.1,
// lançado em 07/2026 — substitui o gpt-realtime original). Isolado numa
// constante: quando a OpenAI liberar o próximo, troca aqui e não precisa
// mexer no resto da função.
// O MINI é o padrão: medido, o prompt cacheado custa US$ 0,06/1M contra
// US$ 0,40/1M do modelo cheio — 6,7x menos no componente que é 97% da conta.
// Para uma assistente que reconhece número de dente e chama função, a
// diferença de capacidade não se paga. `?modelo=gpt-realtime-2.1` compara.
const REALTIME_MODEL = 'gpt-realtime-2.1-mini'

/**
 * Modelos que o cliente pode pedir por `?modelo=` — ALLOWLIST, não string livre.
 * O nome vai para a cunhagem do token e para a URL da conexão; aceitar qualquer
 * texto seria deixar o navegador escolher para onde a sessão aponta.
 *
 * Existe porque os "mini" custam uma fração do modelo cheio e, para uma
 * assistente que quase só reconhece número de dente e chama função, podem ser
 * suficientes — mas isso é decisão de OUVIDO, na cadeira, não de tabela.
 */
/**
 * Vocabulário passado ao Whisper para ele ENVIESAR a transcrição para o jargão
 * odontológico. Sem isto, "obturação com amálgama na oclusal" já foi
 * transcrito como "abduração com o amado na forrão".
 *
 * O campo `prompt` do whisper não é instrução: é um trecho de exemplo que puxa
 * o modelo para o domínio. Por isso vai como frase corrida.
 */
const TRANSCRIPTION_PROMPT = [
  'Exame odontológico. Numeração FDI: dente 11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28,',
  '31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48.',
  'Superfícies: mesial, distal, oclusal, incisal, vestibular, lingual, palatina, cervical.',
  'Achados: cárie, restauração, obturação, amálgama, resina composta, ionômero de vidro, provisório,',
  'coroa, zircônia, metalocerâmica, e-max, tratamento de canal, endodontia, implante, dente decíduo,',
  'raiz residual, fratura, mobilidade grau 1, grau 2, grau 3, cálculo, tártaro, selante,',
  'extração indicada, lesão periapical, cárie de raiz, desgaste, atrição, erosão, abrasão, abfração,',
  'ausente, extraído. Comandos: marca, anota, apaga, remove, limpa, desfaz.',
].join(' ')

/**
 * Transcrever a fala do DENTISTA é o único item de custo opcional aqui: é um
 * modelo à parte, cobrado por minuto de fala (~R$ 0,24 numa consulta de 30 min,
 * ~26% a mais). A fala DELA e as chamadas de ferramenta são de graça.
 *
 * Fica LIGADO por padrão porque, sem a fala do dentista ao lado da chamada de
 * ferramenta, não dá para saber se o erro foi ela entender errado ou executar
 * errado — que é a pergunta que se faz ao calibrar. `?transcrever=nao` desliga
 * quando a calibragem terminar.
 */
function transcreverEntrada(body: Record<string, unknown>): boolean {
  return body?.transcribe !== false
}

const MODELOS_OPENAI = new Set(['gpt-realtime-2.1', 'gpt-realtime-2.1-mini'])
const MODELOS_GEMINI = new Set(['gemini-3.1-flash-live-preview', 'gemini-2.5-flash-live-preview'])

function modeloPedido(body: Record<string, unknown>, permitidos: Set<string>, padrao: string): string {
  const m = typeof body?.model === 'string' ? body.model : ''
  return permitidos.has(m) ? m : padrao
}
const REALTIME_VOICE = 'marin'

// ── Gemini Live (provedor alternativo) ──────────────────────────────────────
// A escolha do modelo foi MEDIDA contra a API, não lida na doc, e as duas
// tentativas anteriores morreram:
//
//  1. `gemini-2.5-flash-native-audio-preview-12-2025` era o preferido por causa
//     do `enableAffectiveDialog` (tom que se adapta a quem fala — o "voz
//     sorridente"). Mas o WebSocket recusa esse campo em QUALQUER posição do
//     setup: "Unknown name enableAffectiveDialog". É recurso do SDK, não do
//     protocolo cru. E sem ele o modelo perdeu a única vantagem que tinha.
//  2. Pior: o modelo de áudio nativo não responde a turno de TEXTO — o prompt
//     entra (9.246 tokens contabilizados) e a resposta volta vazia, sem áudio e
//     sem chamada de ferramenta. Só reage a áudio de verdade, o que também
//     impede disparar a saudação por texto.
//  3. `gemini-2.5-flash-live-preview` não existe mais neste endpoint.
//
// O 3.1 Flash Live aceita texto E áudio, e numa prova ponta a ponta devolveu
// `marcar_dente {dentes:[16], achado:'carie', superficies:['oclusal']}` para
// "dente 16, cárie na oclusal" — o schema exato que applyToothProposal espera.
const GEMINI_LIVE_MODEL = 'gemini-3.1-flash-live-preview'
// Das 30 vozes do catálogo, "Sulafat" é a única descrita como Warm. Alternativas
// se soar demais: Achird (Friendly), Vindemiatrix (Gentle), Autonoe (Bright).
const GEMINI_VOICE = 'Sulafat'

/**
 * Traduz o schema das ferramentas do formato OpenAI para o do Gemini.
 *
 * As duas são JSON Schema por baixo; a diferença é o invólucro (a OpenAI usa
 * `{type:'function', name, ...}` e o Gemini agrupa tudo em
 * `tools:[{functionDeclarations:[...]}]` sem o `type`).
 *
 * A poda de chaves não é preciosismo: o Schema do Gemini aceita um SUBCONJUNTO
 * do JSON Schema, e uma chave desconhecida (`minItems`, no nosso caso) derruba
 * o setup inteiro com erro de validação — ou seja, nenhuma ferramenta funciona,
 * não só a que tinha a chave.
 */
// `minimum`/`maximum` ENTRAM na lista: foram testados contra o WebSocket e são
// aceitos. Estavam de fora por precaução e isso custava validação de verdade —
// o `dias >= 1` do atestado, por exemplo, era descartado silenciosamente.
const CHAVES_DO_SCHEMA = new Set([
  'type', 'description', 'properties', 'required', 'items', 'enum', 'nullable',
  'minimum', 'maximum',
])

function podaSchema(node: unknown): unknown {
  if (!node || typeof node !== 'object') return node
  const saida: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (!CHAVES_DO_SCHEMA.has(k)) continue
    if (k === 'properties') {
      // `properties` é um MAPA nome→schema, não um schema. Recursar nele como
      // se fosse apagava os nomes das propriedades (nenhum deles está na lista
      // de chaves permitidas) e o `required` passava a apontar para campos
      // inexistentes — o Gemini recusava o setup inteiro com
      // "required[0]: property is not defined". Aqui a chave é preservada e só
      // o VALOR é podado.
      const props: Record<string, unknown> = {}
      for (const [nome, sub] of Object.entries(v as Record<string, unknown>)) {
        props[nome] = podaSchema(sub)
      }
      saida[k] = props
    } else if (k === 'items') {
      saida[k] = podaSchema(v)
    } else {
      saida[k] = v
    }
  }

  // ENUM NUMÉRICO. No Gemini `enum` é lista de STRINGS — mandar `[1,2,3]` no
  // grau de mobilidade derruba o setup inteiro ("Invalid value ... (TYPE_STRING), 1").
  // Converter para "1","2","3" seria pior: o campo continua `integer`, e a
  // Cibelly passaria a mandar texto onde o código espera número.
  //
  // A saída é virar FAIXA: [1,2,3] → minimum 1, maximum 3. Continua sendo
  // validação de máquina, não conselho no texto. Só cai para a descrição quando
  // os valores não são contíguos (aí faixa mentiria, aceitando o que está no
  // meio e não existe).
  const valores = saida.enum
  if (Array.isArray(valores) && valores.some(x => typeof x !== 'string')) {
    delete saida.enum
    const nums = valores.filter((x): x is number => typeof x === 'number').sort((a, b) => a - b)
    const contiguo = nums.length === valores.length
      && nums.every((n, i) => Number.isInteger(n) && (i === 0 || n === nums[i - 1] + 1))
    if (contiguo && nums.length > 0) {
      saida.minimum = nums[0]
      saida.maximum = nums[nums.length - 1]
    } else {
      const lista = valores.join(', ')
      saida.description = saida.description
        ? `${saida.description} Valores aceitos: ${lista}.`
        : `Valores aceitos: ${lista}.`
    }
  }
  return saida
}

function ferramentasGemini() {
  return TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    parameters: podaSchema(t.parameters),
  }))
}

/**
 * Primeiro nome, sem o título. O nome cadastrado em `professional.name` às
 * vezes já vem como "Dra. Camila Duarte" — sem tirar o prefixo, a Cibelly
 * diria "Doutora Dra. Camila".
 *
 * Duplica src/utils/text.ts (stripTitle/firstName) de propósito: Edge Function
 * é bundle Deno separado, sem o alias "@/" e sem pasta _shared. Mantido mínimo
 * e apontando para o original — se a regra mudar lá, mude aqui também.
 */
function primeiroNome(nome: string): string {
  return nome.replace(/^Dra?\.\s*/i, '').trim().split(/\s+/)[0] ?? ''
}

/**
 * Como tratar a pessoa: "Dr." | "Dra." | null (desconhecido).
 *
 * Duas fontes, nesta ordem:
 *  1. O TÍTULO JÁ ESCRITO no nome cadastrado ("Dra. Camila Duarte") — é o que a
 *     própria clínica digitou, então ganha de qualquer inferência.
 *  2. A coluna `professional.sex`, quando preenchida.
 * Sem nenhuma das duas devolve null, e o prompt pede para a Cibelly escolher
 * pelo nome — hoje é o caso de TODO mundo, porque `sex` é opcional no cadastro
 * e está vazio para todos os profissionais.
 */
function tratamento(nomeCru: string, sexo: string | null): string | null {
  const doNome = /^dra\./i.test(nomeCru.trim()) ? 'Dra.'
    : /^dr\./i.test(nomeCru.trim()) ? 'Dr.'
    : null
  if (doNome) return doNome
  if (sexo === 'female') return 'Dra.'
  if (sexo === 'male') return 'Dr.'
  return null
}

const INSTRUCTIONS = `IDIOMA — REGRA ABSOLUTA, ACIMA DE QUALQUER OUTRA: fale e escreva SEMPRE em português do Brasil, em 100% das suas respostas, sem nenhuma exceção. NUNCA responda em inglês nem em qualquer outro idioma, mesmo que ouça uma palavra ou nome em outra língua, mesmo que o áudio venha com ruído, mesmo que você não entenda o que foi dito. Se não entender, pergunte EM PORTUGUÊS. Termos técnicos em latim ou inglês que o dentista usar podem ser repetidos como ele falou, mas a frase inteira ao redor é em português.

${cibellyAgentPrompt()}

ORDEM DAS COISAS — SEGUNDA REGRA ABSOLUTA: primeiro a ferramenta, DEPOIS a fala. Sempre nessa ordem, sem exceção.
Ao ouvir um pedido, sua PRIMEIRA ação é chamar a ferramenta — calada, sem dizer nada antes. Só quando o resultado voltar é que você fala, e o que você fala já é a RESPOSTA, nunca o aviso de que vai buscar.
Nada de "vou checar", "vou consultar", "deixa eu ver", "um instante", "certo", "beleza". Essas frases existem para preencher a espera — e não há espera: a ferramenta é instantânea.
Se você se pegar começando uma frase com "Vou…", "Certo", "Beleza", "Perfeito", "Ok" ou "Um instante": PARE. Chame a ferramenta e responda o conteúdo.
ERRADO: "Vou checar o histórico dela rapidinho." → [ferramenta] → "Foi amoxicilina."
CERTO:  [ferramenta] → "Amoxicilina 500, dia 25."

Você é a Cibelly, a assistente de voz do consultório de odontologia do Neo Saúde. Soa como gente, não como manual: linguagem falada e natural ("tá", "pra"), sem formalidade e sem locução. Mas natural aqui quer dizer ECONÔMICA — colega de trabalho concentrada no que está fazendo, não recepcionista simpática.

Você fica ouvindo o dentista narrar o exame ao vivo enquanto ele olha a boca do paciente, e vai ajudando a registrar o que ele for falando.

O ÁUDIO VEM SUJO: o microfone está longe, o paciente e o sugador fazem barulho, e palavra técnica se confunde fácil. Se o que você ouviu não fizer sentido odontológico ("abduração com o amado na forrão"), NÃO invente e NÃO chute um achado. Pergunte curto: "não peguei, repete?". Nunca marque baseada em algo que você não entendeu de verdade.

VOCABULÁRIO DO EXAME, para você ancorar o que ouve: numeração FDI (11 a 18, 21 a 28, 31 a 38, 41 a 48). Superfícies: mesial, distal, oclusal, incisal, vestibular, lingual, palatina, cervical. Achados: cárie, restauração, obturação, amálgama, resina composta, ionômero de vidro, provisório, coroa, zircônia, metalocerâmica, e-max, tratamento de canal, endodontia, implante, dente decíduo, raiz residual, fratura, mobilidade grau 1/2/3, cálculo, tártaro, selante, extração indicada, lesão periapical, cárie de raiz, desgaste, atrição, erosão, abrasão, abfração, ausente, extraído. Comandos: marca, anota, apaga, remove, limpa, desfaz.

COMO VOCÊ AJUDA:
- Presta atenção na narração do exame (tipo "dente 16, cárie oclusal, acho que grau 3" ou "36 tá com resina na mesial e na distal").
- Entendeu o achado? MARQUE NA HORA, chamando "marcar_dente". Não pergunte se pode. Não peça confirmação. Não avise que vai marcar. Só marque.
- Se ele disser que o que VOCÊ acabou de fazer ficou errado ("não", "desfaz", "não era esse dente"), chame "desfazer_ultima_marcacao".
- "REVERTA"/"DESFAZ" COM UM ACHADO NOMEADO ("reverta a mobilidade do dente 24", "desfaz a cárie do 15") é apagar_marcacao, NÃO desfazer_ultima_marcacao. "desfazer_ultima_marcacao" é só para "desfaz"/"não" SOZINHO, sem dizer o quê — aí ele está falando do que VOCÊ acabou de fazer agora. Se ele nomeia o achado, é uma marcação que já estava na ficha (de outra hora, ou de outro dia), não o seu último passo — e desfazer_ultima_marcacao SEMPRE falha nesse caso.
  (Caso real: "reverta essa mobilidade" virou desfazer_ultima_marcacao e devolveu "não há marcação recente para desfazer" — a mobilidade era antiga, não o último passo da sessão. O certo era apagar_marcacao com achado="mobilidade". Só emplacou na terceira tentativa, com "cancele a mobilidade".)
- COMANDO DIRETO NÃO PRECISA DE LEITURA PRÉVIA. Se o dentista mandou marcar, apagar ou restaurar um dente e o pedido está completo, execute a ferramenta correspondente NA MESMA RESPOSTA. Não chame ler_odontograma antes. Use ler_odontograma quando ele fizer uma PERGUNTA ("como está o 28?") ou quando o pedido estiver realmente ambíguo.
- Se ele mandar REMOVER algo que já está no odontograma ("tira essa obturação do 15, 16 e 17", "limpa o 26", "apaga tudo", "remove todas as marcações", "zera aí"), chame "apagar_marcacao". Isso vale para o que veio da ficha salva, de outro dia ou de clique manual — desfazer NÃO alcança essas, apagar sim. Nunca responda que não consegue remover: você consegue.
- "REVERTER/RETORNAR/DEVOLVER/INSERIR/RECOLOCAR/COLOCAR DE VOLTA o dente" é restaurar_dente. "reverta o dente 28", "retorne o dente 18", "insira o dente 18", "põe o 28 de volta", "esse está marcado como ausente mas está presente", "informei errado que o 48 estava ausente; ele está presente" = chame restaurar_dente DIRETO, sem ler antes. Isso remove "ausente"/"extraído" e faz o dente aparecer de novo. NUNCA use marcar_dente achado="ausente" para essas frases: isso faz exatamente o contrário.
- Se ele repetir "retorne/insira/reverta o dente 18" depois de você ter apenas lido ou falado, o pedido continua sendo restaurar_dente. A repetição não transforma o comando em "ausente".
- Só é agendamento quando ele falar em DIA, HORA ou "consulta"/"retorno DO PACIENTE".
  (Caso real: "retorne com os dentes 28 e 38" e você perguntou "qual dia e horário?" — foram três turnos até chegar no comando certo.)
- CUIDADO COM A DIREÇÃO CONTRÁRIA: "o dente 28 não existe", "esse dente já foi extraído", "remove o dente 28" (sobre o DENTE em si, não sobre um achado específico dele) é o OPOSTO de apagar_marcacao — é marcar_dente achado="ausente" (ou "extraida", se ele disser que tirou/extraiu). "Remover" um achado ("tira essa cárie", "tira a obturação do 15") é apagar_marcacao; "remover" o DENTE, dizer que ele "não existe" ou já foi extraído, é um ACHADO NOVO a marcar. Ligue "ler_odontograma" antes se não tiver certeza do que já está lá: um dente sem achado nenhum já parece igual a um dente saudável, então "apagar_marcacao" num dente vazio não muda nada na tela — e o dentista vê que "o dente ainda aparece".
  (Caso real: "o dente 28 não existe" → "remova o dente 28" foi tratado como apagar_marcacao num dente que não tinha achado nenhum marcado — não mudou nada, e o dentista teve que repetir três vezes até perguntar "por que ele ainda aparece?". O certo era marcar_dente achado="ausente".)

HISTÓRICO DO PACIENTE — "o que a gente fez da última vez?", "já passei antibiótico pra ela?", "quando foi a última consulta?" → "consultar_historico". A resposta vem com o campo "resposta" JÁ ESCRITO — leia ele, não tente resumir a lista de atendimentos por conta própria. Ela é grande e sintetizar sozinha é o jeito de travar no meio da fala.
- "o que foi feito no dente 26 na consulta de março?", "quando fizemos a última restauração no 14?" — PERGUNTA COM DENTE E/OU DATA sobre o PASSADO: chame "consultar_historico" passando "dente" e/ou "data". Sem esses campos ela só vê os atendimentos mais recentes e pode simplesmente não achar algo mais antigo. De novo: leia o campo "resposta" que voltar.

LEMBRETES — o dentista deixa recado para o PRÓXIMO atendimento do paciente:
- "me lembre no próximo atendimento da paciente de usar outro material", "anota pra próxima que eu tenho que conferir a oclusão", "da próxima vez me lembra de..." → "criar_lembrete". Vale só para o paciente em atendimento; a ferramenta nem recebe nome.
- Cuidado para não confundir com anotação de dente: "anota que ela reclamou de sensibilidade" é "marcar_dente" com o campo "nota" (é sobre HOJE, e fica junto de um dente). Lembrete é sobre a PRÓXIMA vez. Se ele falar em "próxima", "próximo atendimento", "da próxima vez", é lembrete.
- Depois de salvar, responda uma palavra: "anotado".
- Os lembretes ABERTOS vêm em "consultar_historico", no campo "lembretes". Se houver algum, diga na PRIMEIRA fala do atendimento, direto e sem preâmbulo — é para isso que ele existe. Diga uma vez só; não repita durante a consulta.
- Quando ele disser que resolveu ("já usei o outro material", "pode dar baixa nesse lembrete", "resolvido"), chame "concluir_lembrete" com o id que veio na leitura. Nunca invente id.

AGENDA — VOCÊ TEM ACESSO, SIM:
- "segunda às 13h tá livre?", "quando tenho vaga?", "tem horário na quinta?" → "consultar_agenda". Ela já desconta disponibilidade, bloqueio, férias e consultas existentes.
- PERÍODO É UMA CHAMADA SÓ: "esta semana" é data=segunda + dias=7. NUNCA percorra dia a dia — você já fez isso (sete chamadas para responder uma pergunta) e o dentista teve de repetir a pergunta de tanto que demorou.
- Os horários voltam como faixas de INÍCIO ("08:00 a 10:00" para consultas de 60 minutos). O fim da última consulta não é um horário livre para começar outra.
- A resposta traz o campo "resposta" já ESCRITO. LEIA EXATAMENTE esse campo e não monte outra resposta usando "agenda". Ele combina consulta já marcada e horários livres sem oferecer a hora de término como início.
- Se "consultasDoPaciente" trouxer consulta no período pedido, diga primeiro que o paciente JÁ está agendado. Não trate os horários livres como se a consulta existente não importasse.
- "quando é a consulta dela?", "quando ela volta?", "ela tem retorno marcado?" → também "consultar_agenda": a resposta traz "consultasDoPaciente" com o que já está marcado para o paciente em atendimento. Nunca diga que não sabe — consulte.
- SE ELE JÁ DISSE DIA E HORA ("marca segunda às 14h"), chame "agendar_consulta" DIRETO. Não consulte antes: agendar já confere o horário sozinho e, se não servir, recusa dizendo o motivo e oferecendo alternativas. Consultar primeiro é um turno de conversa a mais para chegar na mesma resposta.
- "consultar_agenda" é para quando ele PERGUNTA ("quando tenho vaga?", "quinta tá livre?", "quando é a consulta dela?") — aí a pergunta é a resposta, e não um passo antes de agendar.
- "cancela a das 15h", "desmarca a de quinta" → "cancelar_consulta". Se houver mais de uma no dia e ele não disser a hora, pergunte qual — nunca escolha por ele.
- NUNCA anuncie que ele confirmou algo que ele não disse. Já saiu de você um "beleza, vou iniciar o cancelamento conforme você confirmou" depois de um ruído transcrito como "Senhor Nando" — ninguém tinha pedido nada. Se a fala não fez sentido, PERGUNTE; nunca preencha a lacuna com uma suposição, ainda mais em ação que desmarca paciente.
- CANCELAR É EM DUAS ETAPAS, sempre. Chame "cancelar_consulta" SEM "confirmado". A resposta vem com "precisaConfirmar": leia o nome do paciente como DADO da consulta, junto com dia e hora, e pergunte ao DENTISTA se pode cancelar ("Paciente: <nome retornado>. Segunda, dia 3, às 13h. Cancelo?"). Só depois de um SIM claro chame de novo, igual, com confirmado=true. Um "sim" que você não ouviu direito não vale — pergunte outra vez.
  Por que só isto tem confirmação, se marcar dente não tem: dente errado se desfaz numa palavra; consulta cancelada some da agenda, o horário é vendido para outra pessoa e o paciente aparece na porta. Não dá para desfazer com a boca.
  Enquanto ele não confirmar, NÃO diga que cancelou. Nada foi cancelado.
- NUNCA diga que não tem acesso à agenda, nem mande conferir "com a recepção" ou "na agenda". Isso é FALSO e já aconteceu.
- Se o horário não servir, a ferramenta diz o motivo (férias, bloqueio, fora da grade, já ocupado). Fale o motivo e ofereça as vagas que ela devolveu — não insista no horário recusado.
- Data você resolve a partir do bloco "HOJE É …" que está no fim destas instruções — nunca de memória. "daqui a 15 dias", "dia 6", "amanhã" viram aaaa-mm-dd contados DALI, sem perguntar.
- Você NUNCA decide sozinha se a data é ambígua — não é seu trabalho, e mandar você "não escolher" enquanto a ferramenta exige uma data é ordem contraditória. Resolva a data como entender, mande junto a frase original em "ditoPeloDentista", e deixe a ferramenta julgar: se for ambígua, ela devolve as duas datas e AÍ você pergunta.
- Ao confirmar qualquer data em voz alta, use o que a ferramenta devolveu em "quando" (já vem escrito: "quinta-feira, 30 de julho"). NÃO recalcule dia da semana nem mês de cabeça, e não acrescente "semana que vem"/"mês que vem" por conta própria.
- Mande DURAÇÃO em minutos, nunca hora de fim.
- A consulta é SEMPRE do paciente que está na tela. Se não houver paciente selecionado, não consulte horário nem agende: diga que precisa escolher o paciente primeiro e pare por aí.
- Se o dentista falar o nome de OUTRO paciente ("marca pra Ana"), não agende: avise que só dá para agendar para quem está em atendimento, e que ele precisa trocar o paciente na tela.
- Ao confirmar o agendamento, apresente o nome como DADO, não como vocativo: "Paciente: <nome retornado>. Segunda, dia 3, às 13h". É assim que o dentista percebe se marcou para a pessoa errada.
- DATA: mande SEMPRE em "ditoPeloDentista" a expressão de data como ele falou, sem traduzir. Se ela for ambígua ("quinta que vem" pode ser a próxima quinta ou a da semana seguinte), a ferramenta devolve as DUAS datas — leia as duas, pergunte qual, e chame de novo com a escolhida e confirmaData=true. Nada foi agendado até lá.
- FIM DE SEMANA: não confira o calendário por conta própria. Chame normal; se a data cair em sábado ou domingo, a ferramenta devolve "precisaConfirmar" com o aviso pronto — leia o aviso, pergunte se pode marcar assim mesmo, e só então chame de novo com confirmaFimDeSemana=true. Nada foi agendado até esse segundo chamado.
  Existe porque "daqui a duas semanas" cai em fim de semana com frequência e quase nunca é o que ele quis — e quem descobriria seria o paciente, na porta.
- SALA: não pergunte por conta própria. Chame "agendar_consulta" SEM o campo "sala"; se a clínica tiver mais de uma, a ferramenta recusa e devolve a lista em "salas" — só então você pergunta "qual sala?" e chama de novo com o nome que ele disser. Com uma sala só, ela resolve sozinha e você não toca no assunto: perguntar o óbvio no meio do exame é o tipo de turno que sobra.
  Quando a resposta vier com "sala", inclua na confirmação: "Paciente: <nome retornado>. Segunda, dia 3, às 13h, sala 2".

MATERIAIS E ESTOQUE — você também cuida disso:
- "tem resina?", "quanto sobrou de anestésico?", "quem fornece a broca?", "me passa o contato deles" → "consultar_materiais".
- "usei duas seringas de resina", "gastei um tubete" → "registrar_material_usado". Isso dá baixa no estoque na hora.
- PEDIDO COMPOSTO ("verifique o que está acabando E solicite orçamento") → chame UMA VEZ "solicitar_orcamento_fornecedor" com emFalta=true. Essa ferramenta já lê o estoque, reúne TODOS os materiais abaixo do mínimo e agrupa TODOS os fornecedores; não precisa chamar "consultar_materiais" antes.
- NUNCA chame "solicitar_orcamento_fornecedor" uma vez por material ou por fornecedor. Uma chamada com emFalta=true prepara o lote inteiro. Repetir por par material/fornecedor cria várias confirmações concorrentes e várias mensagens separadas.
- Se a consulta ou o pedido com emFalta=true voltar sem materiais, conclua imediatamente: não há item no mínimo para cotar. NÃO consulte de novo com nomes inventados e NÃO espere outra fala para concluir.
- Depois de registrar, o retorno diz se o material ficou ACABANDO. Se ficou, chame "solicitar_orcamento_fornecedor" SEM "confirmado": a ferramenta só prepara a mensagem e devolve fornecedores + texto. Leia a prévia e pergunte se pode enviar.
- Só depois de um SIM claro chame novamente, com os mesmos dados e confirmado=true. A ferramenta confere se destinatários e texto são exatamente os da prévia. Nunca mande sem essa segunda chamada.
- Um material pode ter MAIS DE UM fornecedor. Quando houver, diga quantos são e mande para todos, a não ser que ele escolha um.
- MATERIAL ou FORNECEDOR? O pedido de orçamento aceita os dois, em campos SEPARADOS. "peça um orçamento ao Dental Cremer" é FORNECEDOR → mande em "fornecedor" e deixe "material" vazio; a ferramenta devolve o que aquele fornecedor supre e você pergunta qual. "orçamento do que está em falta" → emFalta=true, sem material nenhum.
  NUNCA ponha nome de fornecedor no campo "material", e NUNCA fique chutando nomes de material quando o retorno disser que não encontrou: se o nome for de fornecedor, a própria ferramenta avisa "é um FORNECEDOR" e lista os materiais dele. Leia esse retorno em vez de adivinhar.
  (Caso real: "peça um orçamento ao Dental Cremer" virou material="odontocol creme", depois "ortodontico", depois "dental creme" — seis turnos chutando marca, e o dentista teve que perguntar "encontrou?" duas vezes. Nenhum chute podia acertar: Dental Cremer é fornecedor, não material.)

MENSAGENS AO PACIENTE — pelo WhatsApp conectado da clínica:
- "mande uma mensagem para a paciente dizendo que...", "avise a paciente que..." → "enviar_mensagem_paciente".
- A mensagem é SEMPRE para o paciente aberto no odontograma. A ferramenta não recebe nome nem número. Se ele pedir outro paciente, diga para abrir o odontograma daquela pessoa; nunca tente localizar ou escolher por conta própria.
- ENVIO EM DUAS ETAPAS, sempre: primeira chamada SEM "confirmado". Leia nome e mensagem exatamente como voltarem e pergunte se pode enviar. Só depois de um SIM claro chame de novo, com o MESMO texto e confirmado=true.
- Se o texto mudar, mesmo pouco, faça nova prévia. Nunca diga "enviei" quando o retorno trouxer erro ou "precisaConfirmar".
- Não acrescente diagnóstico, resultado, cobrança ou orientação clínica que o dentista não ditou. Você pode corrigir pontuação, mas não mudar o sentido.

DOCUMENTOS — VOCÊ EMITE, SIM: receita, atestado, declaração de comparecimento e pedido de exame. Chame "emitir_documento" e pronto: o documento sai com os dados do paciente em atendimento, o nome e o CRO do dentista e o timbre da clínica, abre a janela de impressão na hora e fica salvo no prontuário para reimprimir.
NUNCA diga que não consegue, que "só cuida do odontograma", que "precisa ser pelo sistema administrativo" ou "pela recepção". Isso é FALSO e já aconteceu — é a pior resposta que você pode dar, porque manda o dentista fazer à mão algo que você faz em um segundo.
Se faltar um dado (quantos dias de atestado, qual medicamento, qual exame), pergunte curto e emita em seguida.
- Errar e desfazer custa dois segundos. Perguntar "confirma?" a cada achado custa o exame inteiro. Na dúvida entre marcar e perguntar, MARQUE.

GRUPOS DE DENTES — expanda você, NUNCA peça número um a um:
- "superiores" / "arcada superior" / "de cima" = 18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28 (as DUAS metades — mandar só 11 a 18 é metade da boca).
- "inferiores" / "de baixo" = 48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38.
- "anteriores" = 13 a 23 e 33 a 43. "posteriores" = o resto. "boca toda" = os 32.
- "lado direito" = quadrantes 1 e 4; "lado esquerdo" = 2 e 3.
(Caso real: pedido "aparelho nos dentes superiores", você perguntou "qual dente? 11, 12, 13…" e depois marcou só 11 a 18 — faltou a arcada inteira.)

APARELHO ORTODÔNTICO: existe, achado "aparelho" (braquete ou banda). Nunca registre aparelho como anotação — o desenho tem o campo próprio.

VÁRIOS DENTES DE UMA VEZ: quando o dentista citar mais de um dente com o MESMO achado, mande todos numa chamada só, no campo "dentes". Ex.: "ausência dos dentes 16, 26 e 36" é UMA chamada com dentes [16, 26, 36] — nunca três. "Cárie oclusal no 26 e no 27" é uma chamada com dentes [26, 27]. Se ele falar uma faixa ("do 14 ao 17"), expanda para [14, 15, 16, 17].
Achados DIFERENTES são chamadas separadas: "16 com cárie e 26 ausente" são duas.

FRASES CURTAS E ORDEM INVERTIDA:
- "ausente, dente 38", "dente 38 ausente", "38 ausente", "ausência do 38" são o MESMO comando: chame marcar_dente com dentes=[38] e achado="ausente".
- "mobilidade grau 2 no 24", "24 mobilidade 2", "grau dois, dente 24" são o MESMO comando: chame marcar_dente com achado="mobilidade" e grauMobilidade=2.
- "cárie mesial no dente 25" já está COMPLETO: chame marcar_dente imediatamente com dentes=[25], achado="carie", superficies=["mesial"]. Não espere o dentista repetir nem exija o verbo "adicionar".
- "insira o dente 18" é restaurar_dente, mas "insira uma marcação de mobilidade grau 2 no dente 16" é marcar_dente. Quando o objeto do verbo é uma MARCAÇÃO/ACHADO, registre o achado; quando é o DENTE ausente, restaure o dente.
- Se você perguntou um campo que faltava, a resposta curta do dentista completa o comando anterior. Ex.: você perguntou "qual dente?" e ele disse "38" ou "trinta e oito": use o achado pendente. Você perguntou "que achado?" e ele disse "ausente": use o dente pendente.
- DADOS MAIS RECENTES SEMPRE VENCEM: uma resposta curta completa somente o campo que faltava, mas uma frase nova e completa substitui os valores antigos. Ex.: você entendeu "obturação no 24 mesial", perguntou o material e depois ouviu "dente 44, obturação em amálgama mesial": use 44, não 24. Nunca mantenha um dente antigo quando o dentista acabou de dizer outro explicitamente.
- Mas "oito" SOZINHO não é dente FDI completo. Pode ser 18, 28, 38 ou 48. Pergunte "qual oito?" em vez de assumir 28.

CAMPOS OBRIGATÓRIOS — sem eles a marcação não aparece no desenho, então aí SIM você precisa perguntar:
- cárie: pelo menos uma superfície (a gravidade 1 a 6 é opcional — não pergunte por ela).
- restauração: superfície e material.
- mobilidade: o grau.
- desgaste: o tipo.

COMO PERGUNTAR o que falta: só a palavra que falta, em duas ou três palavras. "qual superfície?", "qual dente?", "qual material?", "que achado?".
NUNCA liste as opções disponíveis. É ERRADO dizer "Cárie, restauração, ausência, outro?" ou "mesial, distal, oclusal ou vestibular?" — o dentista sabe odontologia melhor que você; ele só não falou ainda. Pergunte e cale a boca.
NUNCA explique o que você precisa nem por quê ("e se for cárie ou restauração, precisa dizer as superfícies"). Pergunte a coisa, não a regra.

QUANDO A FERRAMENTA DEVOLVER ERRO: o resultado da função vem com "ok: false" e um texto em "erro". Isso quer dizer que NADA foi marcado. Nunca diga que marcou nesse caso — leia o motivo, fale ele pro dentista em português e peça o que faltou.

QUANDO VIER "recusados": alguns dentes do lote não aceitaram o achado (ex.: um deles já está com coroa). O resto FOI marcado. Diga as duas coisas em uma frase curta — o que entrou e o que ficou de fora, com o motivo.

ANOTAÇÕES:
- Sempre que o dentista pedir pra anotar alguma coisa — "anota aí", "escreve isso", "bota na anotação", "registra que...", "põe uma observação" — pega exatamente o que ele quis anotar (sem resumir, sem reescrever) e manda no campo "nota".
- O campo "nota" pode vir JUNTO de qualquer achado, na mesma chamada. Se ele disser "dente 16, cárie oclusal, e anota que o paciente reclamou de sensibilidade", manda tudo numa proposta só: achado "carie" + o texto no campo "nota".
- Se a anotação for solta, sem achado nenhum, use achado "nota". Se ele não disser de qual dente é, pergunte — toda anotação fica junto de um dente na coluna de Anotações.

COMO VOCÊ FALA — leve isto a sério, é o que mais importa depois do idioma:
Você está do lado de alguém trabalhando com as mãos na boca de um paciente. Cada segundo seu de fala é um segundo que ele espera. Fale como uma auxiliar experiente: pouquíssimas palavras, tom natural, zero cerimônia.

- NUNCA repita o que o dentista acabou de dizer. Ele sabe o que falou.
- NUNCA narre o que você vai fazer. Nem "deixa eu registrar isso", nem "vou olhar as vagas", nem "beleza, deixa eu conferir rapidinho" — essa última saiu de você e ATRASOU a resposta: você falou, chamou a ferramenta e o dentista ficou esperando duas vezes. A ferramenta é instantânea; chame calada e fale só o resultado.
- NUNCA confirme que ouviu ("entendi", "certo", "perfeito", "ok", "beleza"). Isso é ruído.
- NUNCA explique o que acabou de acontecer nem resuma o que já foi marcado, a não ser que ele peça.
- Nada de gentileza automática ("claro!", "com certeza!", "fico feliz em ajudar"). Nada de emoji.
- ABERTURA: você NÃO fala nada ao conectar. Um bip já avisou que você está ouvindo. Espere o primeiro comando.

DUAS SITUAÇÕES, DUAS FALAS DIFERENTES — e confundir as duas é o erro que mais atrapalhou até agora:

1. COMANDO EXECUTADO (marcar, apagar, anotar, dar baixa): UMA palavra. "marcado", "feito", "anotado". Nada além dela — sem explicar, sem resumir, sem oferecer o próximo passo.

2. PERGUNTA (agenda, histórico, estoque, documento, qualquer coisa): RESPONDA COM O CONTEÚDO, sempre, sem exceção.
   · "Sim", "não", "tem" e "ok" sozinhos NÃO são resposta. Quem pergunta se tem consulta quer o DIA e a HORA.
   · Quando a ferramenta devolver o campo "resposta" já escrito, leia ele.
   · FICAR CALADA depois de uma pergunta é o pior resultado possível: o dentista fica esperando, repete a pergunta, e perde mais tempo do que se você tivesse falado três frases. Já aconteceu — ele perguntou "essa semana tem consulta?", você respondeu só "sim", e teve de perguntar de novo.
   · Na dúvida entre falar demais e não responder, FALE. A economia de palavras vale no comando; na pergunta ela custa o dobro.

Jeito CERTO (a ferramenta roda calada; a resposta é uma palavra):
"dente 16 tem cárie na oclusal" → [marcar_dente] "marcado"
"marca o 15, 16 e 17" → "que achado?" · "cárie na mesial" → [marcar_dente nos três] "marcado"
"não, desfaz" → [desfazer_ultima_marcacao] "desfeito"
"reverta o dente 28" / "retorne o dente 28" / "insira o dente 28" → [restaurar_dente, dentes=[28]] "restaurado"
"no 15, 16 e 17 tá aparecendo uma obturação, remove aí" → [apagar_marcacao] "removido"
"prepara um atestado de um dia" → [emitir_documento] "pronto pra assinar"
"qual horário livre na terça?" → [consultar_agenda] leia "resposta": "já tem consulta às 11; para 60 minutos, os inícios livres são 08:00 a 10:00 e 14:00 a 16:00"

Jeito ERRADO — saíram de atendimentos reais. Dois padrões, e você já caiu nos dois:

1) NARRAR em vez de agir. Nunca diga nada parecido com:
"Certo, vou preparar a proposta…" · "Beleza, registrando isso agora." · "Vou confirmar essa marcação agora." · "Um instante pra eu reverter as marcações." · "Só mais um instante, ainda tem marcações pra remover." · "Deixa eu pensar no que dá pra fazer." · "Certo, entendi! Você disse que o dente 16 tem cárie na oclusal. Deixa eu registrar… Pronto, marquei!"
Todas erram igual: anunciam, repetem ou inventam progresso. A ferramenta é instantânea e silenciosa — faça e diga uma palavra.

2) INVENTAR QUE NÃO CONSEGUE. Você consegue TODAS estas coisas; dizer o contrário é mentira e já aconteceu quatro vezes:
· "não tenho como apagar restaurações já existentes" → use apagar_marcacao, em qualquer dente, a qualquer momento.
· "não consigo preparar atestado por aqui" / "precisa ser pelo sistema administrativo ou pela recepção" → use emitir_documento; sai pronto para assinar.
· "não tenho acesso à agenda; confere com a recepção" → use consultar_agenda; você vê a agenda inteira.
· perguntada o dia da consulta logo depois de VOCÊ MESMA agendar, responder que não sabe → use consultar_agenda e leia "consultasDoPaciente".
· "não tenho ferramenta pra cancelar consulta; cancele direto na agenda do sistema" → use cancelar_consulta.
· "não aparece a medicação no histórico" → o resumo TRAZ os medicamentos de cada receituário, em "documentos[].medicamentos". Leia lá antes de dizer que não tem.
Antes de dizer "não consigo", procure a ferramenta. Quase sempre existe.

3) LISTAR OPÇÕES ao perguntar. "Cárie, restauração, ausência, outro? E, se for cárie, precisa dizer as superfícies." → era só "que achado?".

REGRAS GERAIS:
- Numeração de dente é sempre FDI (11 a 48 — sem os números 19, 29, 39, 49 etc.).
- Se não entender direito o número do dente ou o achado, pergunta — curto, sem rodeio: "qual dente?".
- Ignore conversa que claramente não é sobre o exame (papo com o paciente, telefone tocando, etc.) — não proponha marcação a partir disso e não comente.`

/**
 * Instruções + a saudação personalizada. O nome vem do JWT (ver o handler),
 * NUNCA do corpo da requisição: este texto entra direto no system prompt do
 * modelo, então nome vindo do cliente seria vetor de prompt injection.
 *
 * Sem nome (login sem cadastro de profissional e sem full_name no perfil), a
 * Cibelly simplesmente não chama ninguém pelo nome — melhor do que "Oi, !".
 * Também não inventamos Dr./Dra.: o gênero é opcional no cadastro e para boa
 * parte das pessoas o dado não existe.
 */
/**
 * Data de hoje para ancorar o prompt.
 *
 * Vem do NAVEGADOR (validada por regex — três grupos de dígitos não injetam
 * nada) porque é o relógio da clínica que vale: o Brasil tem mais de um fuso, e
 * calcular no servidor em America/Sao_Paulo erraria o dia numa clínica no Acre
 * — e erraria para TODO mundo perto da meia-noite, que é quando o UTC já virou.
 * Sem data legível, devolve vazio e o bloco simplesmente não é injetado:
 * prompt sem âncora é ruim, prompt com âncora ERRADA é pior.
 */
function hojeDoCliente(body: Record<string, unknown>): string {
  const bruto = typeof body?.today === 'string' ? body.today : ''
  return /^\d{4}-\d{2}-\d{2}$/.test(bruto) ? bruto : ''
}

function buildInstructions(nome: string | null, titulo: string | null, paciente: string, hojeIso: string): string {
  const sobrePaciente = paciente
    ? `\n\nPACIENTE DO PRONTUÁRIO: ${paciente}. Este nome identifica a ficha aberta; NÃO é o nome de quem está falando com você. Nunca use ${paciente} como vocativo ao pedir confirmação ao dentista. Só diga o nome do paciente como dado quando a ação for sobre agenda, mensagem ou documento desse paciente. Não mencione o paciente em estoque, compras ou fornecedores.`
    : ''

  // O bloco de HOJE vai no FIM, depois de tudo: é a informação mais factual do
  // prompt e a que ela precisa consultar a cada cálculo de data.
  const hoje = blocoDeHoje(hojeIso)
  const ancora = hoje ? `\n\n${hoje}` : ''

  if (!nome) {
    return `${INSTRUCTIONS}

INTERLOCUTOR: o nome do dentista não está disponível. Quem fala continua sendo o dentista. Não use o nome do paciente nem qualquer outro nome como vocativo.${sobrePaciente}${ancora}`
  }

  // Com título conhecido é ordem direta; sem ele, a escolha vai para o modelo,
  // que acerta bem em nome brasileiro ("Camila" → Dra., "Marcus" → Dr.). Em
  // qualquer um dos casos, correção falada da pessoa manda mais que tudo.
  const regra = titulo
    ? `Trate sempre por "${titulo} ${nome}".`
    : `Trate sempre por "Dr. ${nome}" ou "Dra. ${nome}", escolhendo conforme o nome. Na dúvida entre os dois, use o que soar natural para o nome e siga com ele.`

  return `${INSTRUCTIONS}

INTERLOCUTOR: quem fala com você é o dentista ${nome}. ${regra} Somente este nome pode ser usado como vocativo. Nunca chame só pelo primeiro nome sem o título, e nunca invente sobrenome. Se a pessoa corrigir o tratamento, passe a usar o que ela pediu pelo resto da conversa.${sobrePaciente}${ancora}`
}

const TOOLS = [
  {
    type: 'function',
    name: 'marcar_dente',
    description:
      'Marca JÁ um achado clínico num ou mais dentes do odontograma, a partir do que o dentista narrou. Aplica na hora, sem pedir confirmação. Se o dentista disser depois que ficou errado, use desfazer_ultima_marcacao.',
    parameters: {
      type: 'object',
      properties: {
        dentes: {
          type: 'array',
          items: { type: 'integer' },
          minItems: 1,
          description:
            'Um OU VÁRIOS dentes, em numeração FDI (11-18, 21-28, 31-38, 41-48). ' +
            'Se o dentista citar vários dentes com o MESMO achado ("ausência dos dentes 16, 26 e 36", ' +
            '"cárie oclusal no 26 e no 27"), mande TODOS de uma vez nesta lista — nunca uma chamada por dente. ' +
            'Se ele citar uma faixa ("do 14 ao 17"), expanda para os números individuais.',
        },
        achado: {
          type: 'string',
          enum: [...IDS_DOS_ACHADOS],
          description: 'O que marcar. ' + descricaoDosAchados(),
        },
        superficies: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['mesial', 'distal', 'oclusal', 'vestibular', 'lingual', 'palatina'],
          },
          description:
            'Faces do dente afetadas. OBRIGATÓRIO para carie e restauracao (sem isso nada é marcado). ' +
            'Use "oclusal" também quando o dentista disser "incisal" nos dentes da frente. ' +
            '"palatina" é a lingual dos dentes de cima. Pode ter mais de uma face.',
        },
        gravidade: {
          type: 'integer',
          minimum: 1,
          maximum: 6,
          description: 'Só para carie: profundidade/severidade de 1 (bem inicial) a 6 (extensa, profunda). Opcional — se o dentista não disser, não invente.',
        },
        material: {
          type: 'string',
          enum: ['amalgama', 'resina', 'ionomero', 'provisorio'],
          description: 'OBRIGATÓRIO para restauracao. Material da obturação. Se o dentista não disser, pergunte.',
        },
        materialCoroa: {
          type: 'string',
          enum: ['emax', 'zirconia', 'metaloceramica', 'metal', 'ouro', 'provisoria'],
          description: 'Só para coroa: material da coroa/prótese fixa. Se não disser, assume zircônia.',
        },
        grauMobilidade: {
          type: 'integer',
          enum: [1, 2, 3],
          description:
            'OBRIGATÓRIO para mobilidade: grau ou nível 1, 2 ou 3 (I, II ou III). ' +
            'Envie o número DIRETAMENTE neste campo grauMobilidade. NUNCA envie mobilidade:{grau:2}, grau ou nivel. ' +
            'Se o dentista não disser, pergunte.',
        },
        desgaste: {
          type: 'string',
          enum: ['atricao', 'erosao', 'abrasao', 'abfracao'],
          description: 'OBRIGATÓRIO para desgaste: atrição (desgaste da borda por atrito entre dentes), erosão (ácido), abrasão (escovação) ou abfração (flexão cervical).',
        },
        aparelho: {
          type: 'string',
          enum: ['braquete', 'banda'],
          description: 'Para o achado "aparelho". Use braquete quando ele só disser "aparelho ortodôntico".',
        },
        pulpa: { type: 'string', enum: [...PULPA], description: 'Para diagnostico-pulpar.' },
        apical: { type: 'string', enum: [...APICAL], description: 'Para diagnostico-apical.' },
        periImplante: { type: 'string', enum: [...PERI_IMPLANTE], description: 'Para peri-implantar.' },
        discromia: { type: 'string', enum: [...DISCROMIA], description: 'Para discromia.' },
        reabsorcao: { type: 'string', enum: [...REABSORCAO], description: 'Para reabsorcao.' },
        protese: { type: 'string', enum: [...PROTESE], description: 'Para protese.' },
        migracao: { type: 'string', enum: [...MIGRACAO], description: 'Para migracao.' },
        vertical: { type: 'string', enum: [...VERTICAL], description: 'Para intrusao-extrusao.' },
        defeito: { type: 'string', enum: [...DEFEITO], description: 'Para defeito-restauracao.' },
        profundidade: { type: 'string', enum: [...PROFUNDIDADE], description: 'Para profundidade-radiografica.' },
        nota: {
          type: 'string',
          description:
            'Observação em texto livre, exatamente como o dentista pediu para anotar. ' +
            'Pode e deve vir JUNTO de qualquer achado na mesma chamada (ex.: cárie + "paciente relatou sensibilidade"). ' +
            'Aparece na coluna de Anotações ao lado do odontograma.',
        },
      },
      required: ['dentes', 'achado'],
    },
  },
  {
    type: 'function',
    name: 'restaurar_dente',
    description:
      'FAZ O DENTE APARECER DE NOVO removendo a condição de ausente/extraído. ' +
      'Use DIRETAMENTE, sem ler antes, quando o dentista disser "reverta o dente 28", "retorne o dente 18", ' +
      '"insira o dente 18", "recoloque o dente", "volte o dente", "põe o dente de volta" ou disser que um dente ' +
      'marcado como ausente está presente, inclusive "informei errado que estava ausente; ele está presente". ' +
      'Esta ferramenta é o OPOSTO de marcar_dente com achado="ausente".',
    parameters: {
      type: 'object',
      properties: {
        dentes: {
          type: 'array',
          items: { type: 'integer' },
          minItems: 1,
          description: 'Um ou vários dentes a restaurar como presentes, em numeração FDI.',
        },
      },
      required: ['dentes'],
    },
  },
  {
    type: 'function',
    name: 'apagar_marcacao',
    description:
      'APAGA marcações que já estão no odontograma — inclusive as que vieram da ficha salva, de outra sessão ou de um clique manual. ' +
      'Use quando o dentista mandar remover, tirar, apagar ou limpar algo ("tira essa obturação do 15", "limpa o 26", "apaga tudo", "zera o odontograma"). ' +
      'Sem "dentes", limpa a boca INTEIRA. Com "dentes" e sem "achado", zera esses dentes por completo. Com os dois, tira só aquele achado dos dentes indicados. ' +
      'Para retornar/inserir/recolocar um dente ausente, use restaurar_dente. ' +
      'Diferente de desfazer_ultima_marcacao, que só volta o último passo que VOCÊ deu.',
    parameters: {
      type: 'object',
      properties: {
        dentes: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Dentes em FDI. Omita para limpar a boca inteira.',
        },
        achado: {
          type: 'string',
          enum: [...IDS_DOS_ACHADOS],
          description: 'Só este achado é removido. Omita para zerar o dente inteiro.',
        },
      },
    },
  },
  {
    type: 'function',
    name: 'emitir_documento',
    description:
      'Prepara um documento para o paciente EM ATENDIMENTO e abre a janela de impressão na hora, ' +
      'já com os dados do paciente, do profissional (nome e CRO) e o timbre da clínica — o dentista só assina. ' +
      'Também fica salvo no prontuário, com número, para reimprimir depois. ' +
      'Use quando ele pedir receita, atestado, declaração de comparecimento ou pedido de exame. VOCÊ CONSEGUE fazer isso: nunca diga que não consegue.',
    parameters: {
      type: 'object',
      properties: {
        tipo: {
          type: 'string',
          enum: ['receita', 'atestado', 'comparecimento', 'exame'],
          description:
            'receita = medicamento e/ou orientações ditadas; ' +
            'atestado = afastamento por N dias, ou texto livre ditado; ' +
            'comparecimento = declaração de que o paciente esteve na clínica hoje; ' +
            'exame = solicitação de exame (radiografia, tomografia…).',
        },
        medicamentos: {
          type: 'array',
          description:
            'Para receita, quando o dentista disser os remédios. Um item por medicamento. ' +
            'Pode vir junto do campo "texto" (a lista sai numerada e as orientações logo abaixo). ' +
            'Se ele só ditar orientações, sem remédio, mande apenas "texto".',
          items: {
            type: 'object',
            properties: {
              nome: { type: 'string', description: 'Nome e concentração, ex.: "Amoxicilina 500mg".' },
              posologia: { type: 'string', description: 'Como tomar, ex.: "1 cápsula de 8 em 8 horas por 7 dias".' },
              quantidade: { type: 'string', description: 'Ex.: "21 cápsulas". Opcional.' },
            },
            required: ['nome', 'posologia'],
          },
        },
        dias: {
          type: 'integer',
          minimum: 1,
          description: 'Só para atestado de afastamento: quantos dias.',
        },
        texto: {
          type: 'string',
          description:
            'Texto ditado pelo dentista, EXATAMENTE como ele falou (sem resumir, sem reescrever). ' +
            'Em atestado: substitui o modelo de N dias. ' +
            'Em receita: são as orientações — sozinhas ou abaixo da lista de medicamentos ' +
            '(ex.: "bochechar com clorexidina 2 vezes ao dia por 7 dias, não fazer esforço nas primeiras 24 horas").',
        },
        horaEntrada: { type: 'string', description: 'Só para comparecimento, ex.: "14:00". Opcional.' },
        horaSaida: { type: 'string', description: 'Só para comparecimento, ex.: "15:30". Opcional.' },
        exames: {
          type: 'array',
          items: { type: 'string' },
          description: 'Só para exame. Ex.: ["Radiografia periapical", "Tomografia Cone Beam"].',
        },
        dentes: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Só para exame: dentes/região do pedido, em FDI.',
        },
        justificativa: {
          type: 'string',
          description: 'Só para exame: hipótese diagnóstica. Opcional.',
        },
        observacoes: {
          type: 'string',
          description: 'Orientações extras impressas no rodapé do documento. Opcional.',
        },
      },
      required: ['tipo'],
    },
  },
  {
    type: 'function',
    name: 'consultar_materiais',
    description:
      'Consulta o estoque da clínica: quanto tem de cada material, quais estão acabando, e quem são os fornecedores de cada um (com e-mail e WhatsApp). ' +
      'Um mesmo material pode ter MAIS DE UM fornecedor. ' +
      'Use quando o dentista perguntar se tem algum material, quanto resta, quem fornece, ou pedir o contato de um fornecedor. ' +
      'Consulte também ANTES de registrar um material usado, se não souber o nome exato do cadastro.',
    parameters: {
      type: 'object',
      properties: {
        busca: {
          type: 'string',
          description: 'Filtra pelo nome do material (ex.: "resina"). Omita para trazer o estoque inteiro.',
        },
        somenteAcabando: {
          type: 'boolean',
          description: 'true traz só o que está no mínimo ou abaixo.',
        },
      },
    },
  },
  {
    type: 'function',
    name: 'registrar_material_usado',
    description:
      'Registra o que foi consumido no atendimento e DÁ BAIXA no estoque. ' +
      'Use quando o dentista disser o que usou ("usei duas seringas de resina", "gastei um tubete de anestésico"). ' +
      'Depois de registrar, confira o retorno: se vier "acabando", avise o dentista quantas unidades restam e ' +
      'chame solicitar_orcamento_fornecedor sem confirmado para preparar a prévia e então pedir confirmação.',
    parameters: {
      type: 'object',
      properties: {
        materiais: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              nome: { type: 'string', description: 'Nome do material como está no cadastro.' },
              quantidade: {
                type: 'string',
                description: 'Quanto foi usado. Comece pelo número: "2", "2 seringas", "1 caixa". Sem número no início, o estoque não baixa.',
              },
            },
            required: ['nome', 'quantidade'],
          },
        },
      },
      required: ['materiais'],
    },
  },
  {
    type: 'function',
    name: 'solicitar_orcamento_fornecedor',
    description:
      'Prepara e, depois da confirmação, envia por WhatsApp um pedido de orçamento aos fornecedores. ' +
      'TRÊS JEITOS de pedir, e você escolhe pelo que o dentista falou: ' +
      '(a) por MATERIAL ("orçamento de resina") → campo "material"; ' +
      '(b) por FORNECEDOR ("peça um orçamento ao Dental Cremer") → campo "fornecedor", SEM inventar material; ' +
      '(c) pelo que está acabando ("orçamento do que está em falta") → emFalta=true. ' +
      'Uma única chamada com emFalta=true reúne todos os materiais abaixo do mínimo e todos os fornecedores; nunca repita por material ou fornecedor. ' +
      'Pode combinar: fornecedor + emFalta pede só o que aquele fornecedor supre e está abaixo do mínimo. ' +
      'NUNCA ponha nome de fornecedor no campo "material" — se não souber se o nome é material ou fornecedor, ' +
      'chame assim mesmo que a ferramenta diz qual dos dois é. ' +
      'DUAS ETAPAS: primeiro chame sem confirmado; leia destinatários e mensagem e pergunte se pode enviar. ' +
      'Só repita com confirmado=true depois de um sim claro.',
    parameters: {
      type: 'object',
      properties: {
        material: {
          type: 'string',
          description: 'Nome do MATERIAL a cotar. Omita quando o dentista citar só o fornecedor ou pedir o que está em falta.',
        },
        quantidade: { type: 'string', description: 'Quanto pedir no orçamento. Opcional.' },
        fornecedor: {
          type: 'string',
          description: 'Nome do FORNECEDOR. Use este campo (e não "material") quando o dentista disser "peça orçamento ao Fulano".',
        },
        emFalta: {
          type: 'boolean',
          description: 'true quando ele pedir orçamento do que está acabando/em falta, sem nomear material.',
        },
        confirmado: {
          type: 'boolean',
          description:
            'Só true na SEGUNDA chamada, depois de ler fornecedores + mensagem e receber um sim claro. Nunca na primeira.',
        },
      },
    },
  },
  {
    type: 'function',
    name: 'enviar_mensagem_paciente',
    description:
      'Prepara e envia uma mensagem pelo WhatsApp para o paciente que está aberto no odontograma. ' +
      'Não recebe paciente nem número: nunca use para outra pessoa. DUAS ETAPAS: primeira chamada sem confirmado; ' +
      'leia o nome e o texto devolvidos e pergunte se pode enviar. Só repita o MESMO texto com confirmado=true depois de um sim claro.',
    parameters: {
      type: 'object',
      properties: {
        mensagem: {
          type: 'string',
          description:
            'Texto que será enviado. Preserve o sentido exato do que o dentista ditou; não acrescente informação clínica.',
        },
        confirmado: {
          type: 'boolean',
          description:
            'Só true na SEGUNDA chamada, depois de ler destinatário + mensagem e receber um sim claro. Nunca na primeira.',
        },
      },
      required: ['mensagem'],
    },
  },
  {
    type: 'function',
    name: 'ler_odontograma',
    description:
      'Lê o que está marcado no odontograma AGORA. Use para responder perguntas como ' +
      '"como está o 28?" / "o que ela tem marcado?" ou para resolver um pedido realmente ambíguo. ' +
      'NÃO use antes de um comando direto e completo de marcar, apagar ou restaurar; execute esse comando imediatamente. ' +
      'VOCÊ ENXERGA o odontograma por esta ferramenta: nunca diga que não tem como ver.',
    parameters: {
      type: 'object',
      properties: {
        dentes: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Dentes a consultar, em FDI. Omita para ler a boca inteira.',
        },
      },
    },
  },
  {
    type: 'function',
    name: 'consultar_historico',
    description:
      'Histórico clínico do paciente em atendimento: os últimos atendimentos (data, o que foi feito, ' +
      'dentes tocados, materiais usados) e os documentos já emitidos (receitas, atestados, pedidos de exame). ' +
      'Use para "o que a gente fez nos últimos atendimentos?", "já passei antibiótico pra ela?", "quando foi a última vez?". ' +
      'SEM "data" nem "dente": traz só os atendimentos MAIS RECENTES (pode não alcançar algo de meses atrás). ' +
      'Para "o que foi feito no dente 26 na consulta de março?" ou "quando fizemos a última restauração no 14?", ' +
      'passe "data" e/ou "dente" — aí a busca vale para o histórico INTEIRO, não só os mais recentes. ' +
      'VOCÊ TEM esse histórico: nunca diga que não tem acesso.',
    parameters: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'Dia específico do atendimento a buscar, em aaaa-mm-dd. Omita para não filtrar por data.',
        },
        dente: {
          type: 'integer',
          description: 'Dente específico (numeração FDI) a buscar no histórico. Omita para não filtrar por dente.',
        },
      },
    },
  },
  {
    type: 'function',
    name: 'consultar_agenda',
    description:
      'Consulta a agenda: os horários LIVRES do dentista (já descontando disponibilidade cadastrada, ' +
      'bloqueios, férias/ausências e consultas existentes) E as consultas JÁ MARCADAS do paciente em atendimento, ' +
      'que voltam sempre no campo "consultasDoPaciente". ' +
      'Use tanto para "segunda às 13h tá livre?" quanto para "quando é a consulta dela?" / "quando ela volta?". ' +
      'O campo "resposta" já combina consultas existentes e faixas de horários de INÍCIO; leia-o sem reinterpretar os blocos de agenda. ' +
      'Use quando ele PERGUNTA sobre horário. Se ele já disse dia e hora, NÃO consulte antes — chame agendar_consulta direto, que já confere sozinho. ' +
      'VOCÊ TEM acesso à agenda: nunca mande conferir com a recepção.',
    parameters: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'Dia específico, em aaaa-mm-dd. Omita para trazer as próximas vagas a partir de hoje.',
        },
        hora: {
          type: 'string',
          description: 'Horário específico a checar, em HH:MM. Com data e hora, a resposta diz se AQUELE horário serve e, se não, por quê.',
        },
        duracao: {
          type: 'integer',
          description: 'Duração da consulta em minutos. Padrão 60.',
        },
        dias: {
          type: 'integer',
          minimum: 1,
          maximum: 14,
          description:
            'Quantos dias a partir de "data". Use 7 para "esta semana", 2 para "amanhã e depois". ' +
            'UMA chamada cobre o período inteiro — NUNCA chame a ferramenta um dia por vez.',
        },
      },
    },
  },
  {
    type: 'function',
    name: 'agendar_consulta',
    description:
      'Agenda a próxima consulta do paciente EM ATENDIMENTO com o dentista logado. ' +
      'A consulta é SEMPRE para o paciente que está na tela — não existe parâmetro de paciente e você NÃO pode agendar para outra pessoa. ' +
      'Sem paciente selecionado, nem consulte horário: peça para escolher o paciente primeiro. ' +
      'Chame DIRETO quando ele disser dia e hora: esta ferramenta já confere disponibilidade, bloqueio, férias e agenda cheia, e recusa dizendo o motivo e oferecendo alternativas. Consultar antes é round trip perdido. ' +
      'Ao confirmar que agendou, DIGA O NOME do paciente — é como o dentista percebe se está marcando para a pessoa errada.',
    parameters: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'Dia da consulta, em aaaa-mm-dd.' },
        hora: { type: 'string', description: 'Horário de início, em HH:MM.' },
        duracao: { type: 'integer', description: 'Duração em minutos. Padrão 60. NUNCA mande hora de fim, só duração.' },
        servico: { type: 'string', description: 'O que será feito (ex.: "Restauração 16", "Retorno"). Padrão "Consulta".' },
        encaixe: {
          type: 'boolean',
          description: 'true sobrepõe outra consulta do mesmo dentista de propósito. Só use se ele pedir encaixe explicitamente.',
        },
        ditoPeloDentista: {
          type: 'string',
          description:
            'OBRIGATÓRIO. A expressão de DATA exatamente como o dentista falou ("quinta que vem", "dia 6", "daqui a duas semanas"). ' +
            'Não interprete nem normalize: copie a fala. É com isto que a ferramenta detecta expressão ambígua — se você mandar a data já resolvida sem a frase, ela não tem como conferir.',
        },
        confirmaData: {
          type: 'boolean',
          description:
            'Só true na SEGUNDA chamada, depois de a ferramenta ter devolvido duas datas possíveis e o dentista ter escolhido uma. Nunca na primeira.',
        },
        confirmaFimDeSemana: {
          type: 'boolean',
          description:
            'Só true na SEGUNDA chamada, depois de você avisar que a data cai em sábado ou domingo e o dentista confirmar. ' +
            'Nunca mande true na primeira tentativa: é o aviso que existe para ele perceber que o cálculo caiu no fim de semana.',
        },
        sala: {
          type: 'string',
          description:
            'Nome da sala, como o dentista falou ("sala 2", "consultório da frente"). ' +
            'NÃO mande na primeira tentativa: se a clínica tiver mais de uma sala, a ferramenta recusa e devolve a lista em "salas" — aí você pergunta e chama de novo com este campo. ' +
            'Com uma sala só (ou nenhuma cadastrada) ela resolve sozinha e este campo é ignorado.',
        },
      },
      required: ['data', 'hora', 'ditoPeloDentista'],
    },
  },
  {
    type: 'function',
    name: 'cancelar_consulta',
    description:
      'Cancela uma consulta já marcada do paciente em atendimento ("cancela a das 15h", "desmarca a de quinta"). ' +
      'Consulte a agenda antes para saber o dia e a hora. Se houver mais de uma no mesmo dia e ele não disser a hora, ' +
      'a ferramenta recusa e devolve os horários — pergunte qual, não escolha por ele. ' +
      'DUAS ETAPAS: chame primeiro SEM "confirmado"; a resposta vem com "precisaConfirmar" e os dados da consulta. ' +
      'Leia paciente, dia e hora em voz alta, pergunte se pode cancelar e só chame de novo com confirmado=true depois de um SIM claro. ' +
      'Enquanto isso NADA foi cancelado — não diga que cancelou. ' +
      'VOCÊ CONSEGUE cancelar: nunca mande cancelar direto na agenda do sistema.',
    parameters: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'Dia da consulta a cancelar, em aaaa-mm-dd.' },
        hora: { type: 'string', description: 'Horário de início, em HH:MM. Necessário quando há mais de uma no dia.' },
        confirmado: {
          type: 'boolean',
          description:
            'Só true na SEGUNDA chamada, depois de o dentista confirmar em voz o cancelamento que você leu para ele. ' +
            'Nunca mande true na primeira chamada, nem por dedução do que ele quis dizer.',
        },
        ditoPeloDentista: {
          type: 'string',
          description:
            'OBRIGATÓRIO. A frase dele que pediu o cancelamento, copiada como ele falou. ' +
            'A ferramenta confere se houve pedido de verdade — sem verbo de cancelar, ela recusa. ' +
            'Não invente nem parafraseie: se você não consegue apontar a frase, é porque ele não pediu.',
        },
      },
      required: ['data', 'ditoPeloDentista'],
    },
  },
  {
    type: 'function',
    name: 'criar_lembrete',
    description:
      'Deixa um lembrete para o PRÓXIMO atendimento do paciente em atendimento ' +
      '("me lembre na próxima da paciente de usar outro material"). Aparece quando o paciente for aberto de novo. ' +
      'É sempre do paciente que está na tela — não existe parâmetro de paciente. ' +
      'NÃO confunda com anotação de dente: anotação é sobre HOJE e vai no campo "nota" de marcar_dente; lembrete é sobre a PRÓXIMA vez.',
    parameters: {
      type: 'object',
      properties: {
        texto: {
          type: 'string',
          description: 'O recado, como o dentista falou, em uma frase. Ex.: "usar outro material na restauração do 26".',
        },
      },
      required: ['texto'],
    },
  },
  {
    type: 'function',
    name: 'concluir_lembrete',
    description:
      'Marca um lembrete como resolvido, para ele parar de aparecer ("já usei o outro material", "pode dar baixa nesse lembrete"). ' +
      'O id vem do campo "lembretes" de consultar_historico — nunca invente um id.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Id do lembrete, exatamente como veio em consultar_historico.' },
      },
      required: ['id'],
    },
  },
  {
    type: 'function',
    name: 'desfazer_ultima_marcacao',
    description:
      'Reverte a última marcação feita, voltando o odontograma exatamente ao estado anterior. ' +
      'Use quando o dentista disser que ficou errado ("não", "desfaz", "cancela isso", "apaga", "não era esse dente"). ' +
      'Pode ser chamada várias vezes seguidas para voltar mais de um passo.',
    parameters: { type: 'object', properties: {} },
  },
]

function assertToolSchemasMatchCatalog() {
  const catalogNames = Object.keys(CIBELLY_TOOL_CATALOG)
  const schemaNames = TOOLS.map(tool => tool.name)
  const missingSchemas = catalogNames.filter(name => !schemaNames.includes(name))
  const missingCatalog = schemaNames.filter(name => !catalogNames.includes(name))
  const duplicatedSchemas = schemaNames.filter((name, index) => schemaNames.indexOf(name) !== index)

  if (missingSchemas.length || missingCatalog.length || duplicatedSchemas.length) {
    throw new Error(JSON.stringify({
      error: 'Catálogo e schemas da Cibelly estão divergentes.',
      missingSchemas,
      missingCatalog,
      duplicatedSchemas,
    }))
  }
}

assertToolSchemasMatchCatalog()

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) return json({ error: 'Cibelly não configurada (OPENAI_API_KEY ausente).' }, 500)

  // Mesmo padrão de transcribe-audio: só confere sessão válida. Sem
  // clinic_id/feature pra checar aqui — quem já abriu a rota já passou pelo
  // FeatureGuard (feature 'patients') e pelo gate de especialidade da própria
  // página; esta função só troca credencial, não lê nem grava nada no banco.
  const authHeader = req.headers.get('Authorization') ?? ''
  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user }, error: userErr } = await caller.auth.getUser()
  if (userErr || !user) return json({ error: 'Sessão inválida.' }, 401)

  // NOME DO DENTISTA — descoberto aqui, pelo JWT, e não recebido do cliente:
  // ele vai direto para dentro do `instructions` do modelo, então string vinda
  // do navegador seria prompt injection. As duas leituras passam pela RLS
  // (professional_select libera a própria linha; profile_select libera
  // id = auth.uid()), e a precedência é a mesma que o app já usa em
  // src/services/userService.ts: professional.name → profile.full_name →
  // user_metadata (que é escrito só na criação da conta e envelhece).
  // `.limit(1)` porque professional é único por (id, clinic_id), não por
  // user_id — um login com perfil em duas clínicas quebraria o maybeSingle().
  let nomeDentista: string | null = null
  let tituloDentista: string | null = null
  try {
    const { data: prof } = await caller
      .from('professional').select('name, sex').eq('user_id', user.id).limit(1).maybeSingle()
    let nome = (prof?.name as string | undefined) ?? ''
    const sexo = (prof?.sex as string | undefined) ?? null
    if (!nome) {
      const { data: perfil } = await caller
        .from('profile').select('full_name').eq('id', user.id).maybeSingle()
      nome = (perfil?.full_name as string | undefined) ?? ''
    }
    if (!nome) nome = (user.user_metadata?.full_name as string | undefined) ?? ''
    nomeDentista = primeiroNome(nome) || null
    tituloDentista = nome ? tratamento(nome, sexo) : null
  } catch {
    // Saudação personalizada é enfeite: se a leitura falhar, a Cibelly abre a
    // sessão do mesmo jeito, só não chama ninguém pelo nome.
    nomeDentista = null
    tituloDentista = null
  }

  // NOME DO PACIENTE — mesma doutrina do dentista: o cliente manda só o ID, e
  // QUEM LÊ o nome é o servidor. Aceitar a string pronta do navegador seria pôr
  // texto de fora dentro do `instructions`, que é o prompt de maior autoridade
  // de uma sessão com ferramentas que emitem receituário e apagam odontograma.
  //
  // E ler com `caller` (o client do chamador, linha ~663), NUNCA com
  // service_role: a policy `patient_select` — clinic_id em auth_clinic_ids() +
  // can_access_feature(clinic_id,'patients') — é o que impede a Cibelly de
  // falar de paciente que este dentista não poderia abrir. Fora da clínica
  // dele, o select volta vazio sem erro.
  //
  // Só `name, common_name`: cpf/nascimento/telefone estão na mesma linha e não
  // têm por que chegar perto de um texto que vira prompt.
  // Corpo lido UMA vez: `req.json()` consome o stream, e antes de haver dois
  // campos isto era invisível.
  const body = await req.json().catch(() => ({})) as Record<string, unknown>

  let nomePaciente = ''
  try {
    const bruto = typeof body?.patientId === 'string' ? body.patientId : null
    // Valida o FORMATO antes de consultar. Id inválido é tratado como "sem
    // paciente", nunca como 400 — o cliente antigo manda `{}` e não pode
    // quebrar por causa disso.
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (bruto && uuid.test(bruto)) {
      const { data } = await caller
        .from('patient').select('name, common_name').eq('id', bruto).maybeSingle()
      if (data) {
        nomePaciente = spokenName(
          data.common_name as string | null,
          data.name as string | null,
        )
      }
    }
  } catch {
    // Idem: degrada para saudação sem paciente, nunca vira 500.
    nomePaciente = ''
  }

  const hojeIso = hojeDoCliente(body)
  const instrucoes = buildInstructions(nomeDentista, tituloDentista, nomePaciente, hojeIso)

  // ── GEMINI LIVE ───────────────────────────────────────────────────────────
  if (body?.provider === 'gemini') {
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) return json({ error: 'Cibelly não configurada (GEMINI_API_KEY ausente).' }, 500)

    // O `setup` volta montado para o navegador repassar pelo WebSocket, e NÃO
    // trancado dentro do token via `liveConnectConstraints`.
    //
    // Foi uma tentativa: trancar no token seria melhor, porque o navegador não
    // poderia reescrever o prompt. Mas `liveConnectConstraints` não existe em
    // v1alpha (a API respondeu `Unknown name "liveConnectConstraints"`) e o
    // `enableAffectiveDialog` — o tom caloroso, que é a razão de estarmos aqui —
    // SÓ existe em v1alpha. Não dá para ter os dois hoje, e o que o dentista
    // pediu foi a voz.
    //
    // O que se perde é pequeno: o navegador é o do próprio dentista e já tem a
    // credencial na mão. A ameaça real continua barrada onde importa — o nome do
    // paciente é lido pela RLS aqui no servidor e passa pelo saneador
    // (src/utils/spokenName.ts), então não há texto de fora entrando no prompt.
    const config = {
      // `responseModalities` e `speechConfig` moram DENTRO de generationConfig —
      // na raiz do setup o WebSocket responde `Unknown name "responseModalities"`.
      generationConfig: {
        responseModalities: ['AUDIO'],
        // O modelo de áudio nativo ESCOLHE o idioma sozinho (não aceita
        // languageCode). A regra "sempre pt-BR" continua valendo só pelo prompt —
        // é o primeiro item do INSTRUCTIONS de propósito.
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_VOICE } } },
      },
      systemInstruction: { parts: [{ text: instrucoes }] },
      tools: [{ functionDeclarations: ferramentasGemini() }],
      // Os dois lados da conversa no painel de Atividade. O de SAÍDA é de graça
      // (vem do próprio áudio gerado); o de ENTRADA é o que custa.
      outputAudioTranscription: {},
      ...(transcreverEntrada(body) ? { inputAudioTranscription: {} } : {}),
      realtimeInputConfig: {
        automaticActivityDetection: {
          // Equivalente do threshold alto que pusemos na OpenAI: sensibilidade
          // BAIXA para o início de fala, porque sugador e aspirador disparariam
          // o detector o exame inteiro.
          startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',
          prefixPaddingMs: 300,
          silenceDurationMs: 700,
        },
        // Equivalente do `interrupt_response: false`: ruído da sala não corta a
        // Cibelly no meio da frase. Barge-in não vale nada em quem responde uma
        // palavra.
        activityHandling: 'NO_INTERRUPTION',
      },
    }

    const modeloGemini = modeloPedido(body, MODELOS_GEMINI, GEMINI_LIVE_MODEL)
    const agora = Date.now()
    const tokenRes = await fetch('https://generativelanguage.googleapis.com/v1alpha/auth_tokens', {
      method: 'POST',
      headers: { 'x-goog-api-key': geminiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uses: 1,
        // Janela da SESSÃO (o atendimento inteiro roda dentro dela).
        expireTime: new Date(agora + 60 * 60 * 1000).toISOString(),
        // Janela para o navegador ABRIR a conexão — curta, como o client_secret
        // da OpenAI: o token só serve para o clique que acabou de acontecer.
        newSessionExpireTime: new Date(agora + 2 * 60 * 1000).toISOString(),
      }),
    })

    if (!tokenRes.ok) {
      const detail = await tokenRes.text()
      return json({ error: `Falha ao iniciar a Cibelly (Gemini): ${detail}` }, 502)
    }
    const tokenJson = await tokenRes.json() as { name?: string }
    const token = tokenJson.name
    if (!token) return json({ error: 'O Gemini não devolveu um token de sessão.' }, 502)

    return json({
      provider: 'gemini',
      token,
      setup: { model: `models/${modeloGemini}`, ...config },
    })
  }

  // A OpenAI trocou /v1/realtime/sessions por /v1/realtime/client_secrets
  // (7/2026): o corpo agora vem todo dentro de "session" (com session.type
  // obrigatório = "realtime"), e voz/transcrição/detecção de fala migraram
  // de campos soltos pra dentro de session.audio.{input,output}.
  // "expires_after" é só o prazo pro NAVEGADOR usar este client_secret pra
  // abrir a chamada (não o tempo de duração da sessão de voz em si).
  const openaiRes = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      expires_after: { anchor: 'created_at', seconds: 120 },
      session: {
        type: 'realtime',
        model: modeloPedido(body, MODELOS_OPENAI, REALTIME_MODEL),
        instructions: instrucoes,
        tools: TOOLS,
        tool_choice: 'auto',
        audio: {
          input: {
            // Transcrição da fala do DENTISTA — para o painel de Atividade
            // conseguir mostrar o comando ao lado do que ela executou.
            ...(transcreverEntrada(body)
              ? { transcription: { model: 'whisper-1', language: 'pt', prompt: TRANSCRIPTION_PROMPT } }
              : {}),
            // Detecção de fala automática (VAD do lado da OpenAI) — "sempre
            // ouvindo" enquanto a sessão estiver aberta é decisão de produto
            // (ver OdontogramFullscreenPage.tsx), não algo que a Cibelly
            // escolhe sozinha.
            // `interrupt_response: false` é o ponto: no default (true),
            // QUALQUER ruído que dispare o VAD trunca a Cibelly no meio da
            // frase — e o ambiente aqui é sugador, aspirador, a voz do paciente
            // e a própria voz dela vazando pelo alto-falante em tela cheia.
            // Corte por VAD e hesitação do modelo soam idênticos, e parte da
            // "travada" relatada pode ser isto. Barge-in não vale nada numa
            // assistente que responde uma palavra; o custo de desligar é zero.
            // `threshold` acima do default (0.5) pela mesma razão.
            turn_detection: {
              type: 'server_vad',
              threshold: 0.65,
              interrupt_response: false,
            },
          },
          output: { voice: REALTIME_VOICE },
        },
      },
    }),
  })

  if (!openaiRes.ok) {
    const detail = await openaiRes.text()
    return json({ error: `Falha ao iniciar a Cibelly: ${detail}` }, 502)
  }

  // A resposta NÃO tem um wrapper "client_secret" (apesar da doc sugerir isso
  // — conferido na prática): o token vem direto em "value", top-level, e
  // "expires_at" já é timestamp Unix (segundos), não string ISO.
  const result = await openaiRes.json() as { value?: string; expires_at?: number }
  const token = result.value
  if (!token) return json({ error: 'A OpenAI não devolveu um token de sessão.' }, 502)

  // A saudação vai junto do token, pronta. O navegador não a INVENTA — ele
  // repete esta string numa `response.create` assim que o canal abre (ver
  // useCibelly.ts). Duas coisas se ganham com isso: a saudação é gerada sob uma
  // instrução de ~30 tokens em vez dos ~10 mil de INSTRUCTIONS+TOOLS, e ela sai
  // no instante da conexão em vez de esperar o dentista dizer "oi".
  return json({ provider: 'openai', token, expiresAt: result.expires_at, model: modeloPedido(body, MODELOS_OPENAI, REALTIME_MODEL) })
})
