/**
 * Traduz a proposta da Cibelly (schema da function `propor_marcacao_dente` —
 * ver supabase/functions/cibelly-session/index.ts) para o formato real de
 * estado por dente do motor (vendor/odontogram-modul/src/odontogram.ts).
 *
 * O motor só expõe SNAPSHOT inteiro (getOdontogramState/loadOdontogramState —
 * ver odontogram-shell.d.ts); não existe "marcar só o dente 16". Por isso
 * `applyToothProposal` faz read-modify-write: lê o payload inteiro, mescla só
 * o dente da proposta, e devolve o payload inteiro pra `loadOdontogramState`.
 *
 * ⚠️ O motor FALHA EM SILÊNCIO: `filterSet` descarta todo valor fora da lista
 * permitida e `validateEnum` troca valor inválido pelo default — nada é logado,
 * nada lança. Um nome de superfície ou de material errado aqui não vira erro,
 * vira "a IA disse que marcou e não apareceu nada". Daí este arquivo validar
 * ANTES de escrever e devolver `{ ok: false, erro }` em vez de gravar lixo.
 *
 * As três armadilhas que já custaram caro (confirmadas no código do motor):
 *  1. `caries` usa ids PREFIXADOS ("caries-occlusal"); `cariesSeverity`,
 *     `fillingSurfaces` e `fillingSurfaceMaterials` usam a chave NUA
 *     ("occlusal"). Misturar os dois = marcação descartada.
 *     (codesystems.ts:92-106; hydrateState em odontogram.ts:4335 e 4355)
 *  2. Restauração SEM material não desenha: hydrateState:4419 sobrescreve
 *     `fillingSurfaces` com as chaves de `fillingSurfaceMaterials`.
 *  3. Material de OBTURAÇÃO (amalgam/composite/gic/temporary) e material de
 *     COROA (emax/gold/zircon/...) são enums DIFERENTES — só "temporary"
 *     existe nos dois. Trocar um pelo outro vira "emax" silenciosamente.
 */
import { getOdontogramState, loadOdontogramState } from './odontogram-shell'
import {
  APICAL, DEFEITO, DISCROMIA, IDS_DOS_ACHADOS, MAPA_MOTOR, MIGRACAO, PERI_IMPLANTE,
  PROFUNDIDADE, PROTESE, PULPA, REABSORCAO, VERTICAL,
} from './toothCatalog'

/**
 * TRAVA DE ESCRITA — vale para todo mundo que escreve na boca.
 *
 * Existe por causa da linha do tempo: com um dia ANTIGO carregado no motor, a
 * tela mostra a boca de maio. Se uma marcação entrasse ali, ela cairia num
 * estado que ninguém vai salvar (o botão Salvar não aparece em modo histórico),
 * e sumiria calada assim que a pessoa voltasse para "Atual" — o dentista teria
 * ditado um achado que o sistema respondeu "marquei" e jogou fora.
 *
 * A trava mora AQUI, e não numa lista de ferramentas bloqueadas na camada de
 * voz, porque este módulo é a única porta de escrita programática do motor:
 * ferramenta nova nasce travada sem ninguém precisar lembrar de cadastrá-la.
 * (O clique do mouse não passa por aqui — esse é barrado por pointer-events na
 * tela, que é onde ele de fato entra.)
 */
let motivoDaTrava: string | null = null

export function travarEscritaNoOdontograma(motivo: string | null): void {
  motivoDaTrava = motivo
}

/** Resultado padrão de recusa, no mesmo formato que a Cibelly já sabe falar. */
function recusaPorTrava(): ToothProposalResult {
  return { ok: false, erro: motivoDaTrava ?? 'A ficha está bloqueada para escrita.' }
}

/**
 * Foto do estado inteiro, para desfazer. A Cibelly marca DIRETO (sem etapa de
 * confirmação), então "desfazer" é a rede de segurança que substitui o
 * "confirma?" — e ela precisa ser exata, não uma tentativa de reverter campo a
 * campo, que erraria em achado que zera outros (ausente limpa cárie e coroa).
 */
export function snapshotOdontogram(): string {
  return JSON.stringify(getOdontogramState())
}

/** Devolve false quando a escrita está travada — quem chama precisa saber, senão
 *  anuncia "desfeito" sem ter desfeito nada. */
export function restoreOdontogram(snapshot: string): boolean {
  if (motivoDaTrava) return false
  loadOdontogramState(JSON.parse(snapshot) as Record<string, unknown>)
  return true
}

/** Superfícies como o dentista fala (schema da Cibelly). */
export type ToothSurface = 'mesial' | 'distal' | 'oclusal' | 'vestibular' | 'lingual' | 'palatina'

/** Derivado do catálogo — ver toothCatalog.ts, a fonte única. */
export type ToothFinding = typeof IDS_DOS_ACHADOS[number]

export type Pulpa = typeof PULPA[number]
export type Apical = typeof APICAL[number]
export type PeriImplante = typeof PERI_IMPLANTE[number]
export type Discromia = typeof DISCROMIA[number]
export type Reabsorcao = typeof REABSORCAO[number]
export type Protese = typeof PROTESE[number]
export type Migracao = typeof MIGRACAO[number]
export type Vertical = typeof VERTICAL[number]
export type Defeito = typeof DEFEITO[number]
export type Profundidade = typeof PROFUNDIDADE[number]

export type FillingMaterial = 'amalgama' | 'resina' | 'ionomero' | 'provisorio'
export type CrownMaterial = 'emax' | 'zirconia' | 'metaloceramica' | 'metal' | 'ouro' | 'provisoria'
export type MobilityGrade = 1 | 2 | 3
export type WearKind = 'atricao' | 'erosao' | 'abrasao' | 'abfracao'
/** O motor só conhece estes dois — ver `orthoAppliance` em odontogram-shell. */
export type OrthoAppliance = 'braquete' | 'banda'

export interface ToothProposal {
  /** Um ou VÁRIOS dentes: "ausência dos dentes 16, 26 e 36" é uma frase só no
   *  exame, e ditar de um em um numa arcada inteira é inviável na cadeira. */
  dentes: number[]
  achado: ToothFinding
  superficies?: ToothSurface[]
  gravidade?: number
  material?: FillingMaterial
  materialCoroa?: CrownMaterial
  grauMobilidade?: MobilityGrade
  desgaste?: WearKind
  aparelho?: OrthoAppliance
  pulpa?: Pulpa
  apical?: Apical
  periImplante?: PeriImplante
  discromia?: Discromia
  reabsorcao?: Reabsorcao
  protese?: Protese
  migracao?: Migracao
  vertical?: Vertical
  defeito?: Defeito
  profundidade?: Profundidade
  nota?: string
}

export type ToothProposalResult =
  | { ok: true; resumo: string; recusados?: string[] }
  | { ok: false; erro: string }

/** Aceita pequenas variações que modelos de voz às vezes produzem apesar do
 * schema. O contrato interno continua sendo ToothProposal; a tolerância fica
 * somente nesta fronteira. */
export function normalizeToothProposal(input: Record<string, unknown>): ToothProposal {
  const normalized = { ...input }
  const proposta = normalized as unknown as ToothProposal
  if (proposta.achado !== 'mobilidade') return proposta

  const mobilidade = normalized.mobilidade && typeof normalized.mobilidade === 'object'
    ? normalized.mobilidade as Record<string, unknown>
    : {}
  const candidato = normalized.grauMobilidade
    ?? normalized.grau
    ?? normalized.nivel
    ?? mobilidade.grau
    ?? mobilidade.nivel
  const numero = typeof candidato === 'string' ? Number(candidato) : candidato
  if (numero === 1 || numero === 2 || numero === 3) {
    proposta.grauMobilidade = numero
  }
  delete normalized.mobilidade
  delete normalized.grau
  delete normalized.nivel
  return proposta
}

/** Superfície falada -> chave interna do motor. "palatina" é o nome da lingual
 *  no arco superior — o motor guarda as duas como "lingual" e só troca a LETRA
 *  exibida conforme o arco. */
const SURFACE_MAP: Record<ToothSurface, string> = {
  mesial: 'mesial',
  distal: 'distal',
  oclusal: 'occlusal',
  vestibular: 'buccal',
  lingual: 'lingual',
  palatina: 'lingual',
}

/** Obturação (fillingSurfaceMaterials) — NÃO confundir com CROWN_MATERIAL_MAP. */
const FILLING_MATERIAL_MAP: Record<FillingMaterial, string> = {
  amalgama: 'amalgam',
  resina: 'composite',
  ionomero: 'gic',
  provisorio: 'temporary',
}

/** Restauração fixa/coroa (restorationMaterial) — enum próprio do motor. */
const CROWN_MATERIAL_MAP: Record<CrownMaterial, string> = {
  emax: 'emax',
  zirconia: 'zircon',
  metaloceramica: 'metal-ceramic',
  metal: 'metal',
  ouro: 'gold',
  provisoria: 'temporary',
}

const MOBILITY_MAP: Record<MobilityGrade, string> = { 1: 'm1', 2: 'm2', 3: 'm3' }

/** wearEdge e wearCervical são enums DISJUNTOS: atrição só na incisal/oclusal,
 *  abrasão/abfração só na cervical; erosão vale nos dois. */
const WEAR_MAP: Record<WearKind, { campo: 'wearEdge' | 'wearCervical'; valor: string }> = {
  atricao: { campo: 'wearEdge', valor: 'attrition' },
  erosao: { campo: 'wearCervical', valor: 'erosion' },
  abrasao: { campo: 'wearCervical', valor: 'abrasion' },
  abfracao: { campo: 'wearCervical', valor: 'abfraction' },
}

const SUPERFICIE_LABEL: Record<ToothSurface, string> = {
  mesial: 'mesial',
  distal: 'distal',
  oclusal: 'oclusal',
  vestibular: 'vestibular',
  lingual: 'lingual',
  palatina: 'palatina',
}

/** FDI dos permanentes — mesma lista de ALL_TEETH no motor. Dente fora disso
 *  seria escrito no payload e simplesmente ignorado no load. */
const FDI_VALIDOS = new Set([
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
])

/** "16", "16 e 26", "16, 26 e 36" — como alguém fala, não "16, 26, 36". */
function listarDentes(dentes: number[]): string {
  if (dentes.length === 0) return '?'
  if (dentes.length === 1) return `dente ${dentes[0]}`
  return `dentes ${dentes.slice(0, -1).join(', ')} e ${dentes[dentes.length - 1]}`
}

/** Frase curta em pt-BR — usada pela UI de proposta pendente e pela fala da Cibelly. */
export function describeProposal(p: ToothProposal): string {
  const dente = listarDentes(p.dentes ?? [])
  const sup = (p.superficies ?? []).map(s => SUPERFICIE_LABEL[s]).join(', ')
  switch (p.achado) {
    case 'carie':
      return `${dente}: cárie em ${sup || '?'}${p.gravidade ? ` (grau ${p.gravidade})` : ''}`
    case 'restauracao':
      return `${dente}: restauração de ${p.material ?? '?'} em ${sup || '?'}`
    case 'coroa':
      return `${dente}: coroa de ${p.materialCoroa ?? '?'}`
    case 'canal':
      return `${dente}: tratamento de canal`
    case 'ausente':
      return `${dente}: ausente`
    case 'extraida':
      return `${dente}: extraído`
    case 'implante':
      return `${dente}: implante`
    case 'deciduo':
      return `${dente}: decíduo (de leite)`
    case 'raiz-residual':
      return `${dente}: raiz residual`
    case 'fratura':
      return `${dente}: fratura${sup ? ` (${sup})` : ''}`
    case 'mobilidade':
      return `${dente}: mobilidade grau ${p.grauMobilidade ?? '?'}`
    case 'calculo':
      return `${dente}: cálculo`
    case 'selante':
      return `${dente}: selante`
    case 'extracao-indicada':
      return `${dente}: extração indicada`
    case 'lesao-periapical':
      return `${dente}: lesão periapical`
    case 'carie-de-raiz':
      return `${dente}: cárie de raiz`
    case 'desgaste':
      return `${dente}: desgaste (${p.desgaste ?? '?'})`
    case 'aparelho':
      return `${dente}: ${p.aparelho === 'banda' ? 'banda ortodôntica' : 'braquete'}`
    case 'defeito-restauracao':
      return `${dente}: defeito ${p.defeito ?? '?'} na restauração${sup ? ` (${sup})` : ''}`
    case 'profundidade-radiografica':
      return `${dente}: lesão ${p.profundidade ?? '?'}${sup ? ` (${sup})` : ''}`
    case 'diagnostico-pulpar':
      return `${dente}: polpa — ${p.pulpa ?? '?'}`
    case 'diagnostico-apical':
      return `${dente}: apical — ${p.apical ?? '?'}`
    case 'apicectomia':
      return `${dente}: apicectomia`
    case 'pino-parapulpar':
      return `${dente}: pino parapulpar`
    case 'espaco-fechado':
      return `${dente}: espaço fechado`
    case 'ponte':
      return `${dente}: elemento de ponte`
    case 'pilar-de-ponte':
      return `${dente}: pilar de ponte`
    case 'protese':
      return `${dente}: prótese ${p.protese ?? '?'}`
    case 'inflamacao-periodontal':
      return `${dente}: inflamação periodontal`
    case 'peri-implantar':
      return `${dente}: peri-implantar — ${p.periImplante ?? '?'}`
    case 'discromia':
      return `${dente}: discromia ${p.discromia ?? '?'}`
    case 'reabsorcao':
      return `${dente}: reabsorção ${p.reabsorcao ?? '?'}`
    case 'contato-ausente':
      return `${dente}: contato ausente${sup ? ` (${sup})` : ''}`
    case 'migracao':
      return `${dente}: migração ${p.migracao ?? '?'}`
    case 'rotacao':
      return `${dente}: rotacionado`
    case 'intrusao-extrusao':
      return `${dente}: ${p.vertical ?? '?'}`
    case 'nota':
      return `${dente}: anotação — "${p.nota ?? ''}"`
  }
}

/** Estado serializado de um dente (shape do payload, não do motor em memória). */
type ToothRaw = Record<string, unknown>

function lerArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function lerMapa(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? { ...(v as Record<string, unknown>) } : {}
}

/**
 * Valida o que NÃO depende de dente específico (campos que faltaram na fala).
 * Separado do resto porque vale para a proposta inteira: faltando o material
 * da restauração, nenhum dos dentes pode ser marcado.
 */
function validarProposta(p: ToothProposal, superficies: string[]): string | null {
  const exigeSuperficie = p.achado === 'carie' || p.achado === 'restauracao'
  if (exigeSuperficie && superficies.length === 0) {
    return 'Faltou a superfície (mesial, distal, oclusal, vestibular, lingual ou palatina). Pergunte qual é.'
  }
  if (p.achado === 'restauracao' && !p.material) {
    return 'Faltou o material da restauração (amálgama, resina, ionômero ou provisório). Pergunte qual é.'
  }
  if (p.achado === 'mobilidade' && !p.grauMobilidade) {
    return 'Faltou o grau da mobilidade (1, 2 ou 3). Pergunte qual é.'
  }
  if (p.achado === 'desgaste' && !p.desgaste) {
    return 'Faltou o tipo de desgaste (atrição, erosão, abrasão ou abfração). Pergunte qual é.'
  }
  if (p.achado === 'nota' && !p.nota?.trim()) {
    return 'A anotação veio vazia. Pergunte o que anotar.'
  }
  // Achados novos com campo obrigatório. Sem isto o motor grava `undefined` e
  // o achado some sem erro — o mesmo silêncio que já custou caro aqui.
  const obrigatorios: Partial<Record<ToothFinding, [unknown, string]>> = {
    'diagnostico-pulpar': [p.pulpa, 'Qual o diagnóstico da polpa: normal, pulpite reversível, pulpite irreversível ou necrose?'],
    'diagnostico-apical': [p.apical, 'Qual o diagnóstico apical? (periodontite sintomática/assintomática, abscesso agudo/crônico, osteíte condensante)'],
    'peri-implantar': [p.periImplante, 'Qual o estado peri-implantar: mucosite, ou peri-implantite leve, moderada ou grave?'],
    discromia: [p.discromia, 'Que tipo de discromia: extrínseca, fluorose, não-vital, tetraciclina ou outra?'],
    reabsorcao: [p.reabsorcao, 'A reabsorção é interna ou cervical externa?'],
    protese: [p.protese, 'Qual prótese: removível parcial, removível total, barra, locator ou cicatrizador?'],
    migracao: [p.migracao, 'A migração é mesial ou distal?'],
    'intrusao-extrusao': [p.vertical, 'É intrusão ou extrusão?'],
    'defeito-restauracao': [p.defeito, 'Que defeito: marginal, fratura ou desgaste?'],
    'profundidade-radiografica': [p.profundidade, 'Qual a profundidade: E1, E2, D1, D2 ou D3?'],
  }
  const falta = obrigatorios[p.achado]
  if (falta && !falta[0]) return falta[1]

  // Estes dois escrevem POR SUPERFÍCIE — sem ela não há onde gravar.
  if ((p.achado === 'defeito-restauracao' || p.achado === 'profundidade-radiografica') && superficies.length === 0) {
    return 'Faltou a superfície. Pergunte qual é.'
  }

  const disfarce = achadoDisfarcadoDeNota(p)
  if (disfarce) return disfarce
  return null
}

/**
 * Achados que a assistente já tentou registrar como TEXTO em vez de marcar.
 * Cada um é um caminho estruturado que existe — e que ela contornou.
 */
const ACHADO_EM_TEXTO =
  // O prefixo opcional "dente 23 com" é como ela fraseia a paráfrase — sem ele,
  // "Dente ausente" passava batido.
  /^\s*(dente\s*\d{0,2}\s*(com|tem|está|esta|:)?\s*)?(mobilidade|c[áa]rie|restaura|obtura|coroa|canal|endodontia|implante|ausen|extra[íi]|extra[çc]|fratura|desgaste|atri[çc]|eros|abras|abfra|selante|c[áa]lculo|t[áa]rtaro|raiz residual)/i

/**
 * A ANOTAÇÃO NÃO PODE SUBSTITUIR O ACHADO.
 *
 * Caso real: o dentista falou "mobilidade no dente 23", a marcação foi recusada
 * por faltar o grau, e em vez de perguntar ela gravou a frase como anotação —
 * "📝 Mobilidade no dente 23, nível 2." O dente ficou SEM mobilidade no desenho,
 * com um texto ao lado que ninguém somaria num relatório. Fez isso duas vezes.
 *
 * O campo `nota` é aberto de propósito (serve para "paciente reclamou de
 * sensibilidade"), e é justamente por ser aberto que vira saída de emergência
 * quando o caminho estruturado recusa. Fechar essa porta é do CÓDIGO: pedir no
 * prompt para ela não fazer isso é a classe de regra que já falhou aqui.
 *
 * O gatilho é a nota COMEÇAR com nome de achado — é a assinatura da paráfrase
 * do comando. Observação legítima ("paciente reclamou de dor na cárie do 16")
 * começa pelo sujeito, não pelo achado, e continua passando.
 */
function achadoDisfarcadoDeNota(p: ToothProposal): string | null {
  const nota = p.nota?.trim()
  if (!nota || !ACHADO_EM_TEXTO.test(nota)) return null
  // Com um achado clínico junto, a nota é complemento, não substituto.
  if (p.achado && p.achado !== 'nota') return null
  return 'Isso é um ACHADO, não uma anotação — marque no dente com o achado certo '
    + '(mobilidade, cárie, restauração…) e os campos que ele exige. '
    + 'Se faltar algum dado, PERGUNTE em vez de escrever a frase como nota.'
}

/**
 * Aplica o achado num ÚNICO dente, mutando `atual` (o estado serializado dele).
 * Devolve o motivo quando aquele dente específico não aceita o achado — o que
 * é por dente, não por proposta: marcar ausência em 16, 26 e 36 pode falhar só
 * no 36, se ele estiver com coroa.
 */
function aplicarNoDente(
  atual: ToothRaw, p: ToothProposal, superficies: string[], dente: number,
): string | null {
  const exigeSuperficie = p.achado === 'carie' || p.achado === 'restauracao'

  // Coroa/ponte esconde cárie e restauração de superfície no desenho
  // (odontogram.ts:1887 e 1923) — gravar seria guardar dado invisível.
  const temCoroa = typeof atual.restorationType === 'string' && atual.restorationType !== 'none'
  if (exigeSuperficie && temCoroa) {
    return `${dente} está com coroa/prótese — cárie ou restauração de face não aparecem nele`
  }
  if (exigeSuperficie && atual.toothSelection === 'none') {
    return `${dente} está marcado como ausente`
  }

  switch (p.achado) {
    case 'carie': {
      // `caries` = ids PREFIXADOS; `cariesSeverity` = chave NUA. Ver o bloco
      // de armadilhas no topo do arquivo.
      const existentes = new Set(lerArray(atual.caries))
      superficies.forEach(s => existentes.add(`caries-${s}`))
      atual.caries = [...existentes]

      const severidade = lerMapa(atual.cariesSeverity)
      // Sem gravidade dita, 2 = "superficial" (representante do ICDAS no
      // motor). Zero apagaria a cárie no gate de coerência (odontogram.ts:4471).
      const grau = p.gravidade && p.gravidade >= 1 && p.gravidade <= 6 ? p.gravidade : 2
      superficies.forEach(s => { severidade[s] = grau })
      atual.cariesSeverity = severidade
      break
    }

    case 'restauracao': {
      // Só `fillingSurfaceMaterials` conta: hydrateState:4419 regenera
      // `fillingSurfaces` a partir das chaves dele.
      const materiais = lerMapa(atual.fillingSurfaceMaterials)
      superficies.forEach(s => { materiais[s] = FILLING_MATERIAL_MAP[p.material!] })
      atual.fillingSurfaceMaterials = materiais
      atual.fillingSurfaces = Object.keys(materiais)
      // O tooltip do dente lê `fillingMaterial` (odontogram.ts:2209) — sem
      // isso a restauração desenha mas não vira texto na coluna de Anotações.
      atual.fillingMaterial = FILLING_MATERIAL_MAP[p.material!]
      break
    }

    case 'coroa': {
      atual.toothSelection = 'tooth-base'
      atual.toothSubstrate = 'crownprep'
      atual.restorationType = 'crown'
      atual.restorationMaterial = CROWN_MATERIAL_MAP[p.materialCoroa ?? 'zirconia']
      break
    }

    case 'canal':
      atual.toothSelection = 'tooth-base'
      atual.endo = 'endo-filling'
      break

    case 'ausente':
    case 'extraida': {
      // Não basta setar "none": coroa/restauração antigas continuariam
      // desenhadas e o resumo continuaria listando cárie de um dente que não
      // existe mais. Zerar é parte de marcar como ausente.
      atual.toothSelection = 'none'
      atual.extractionWound = p.achado === 'extraida'
      atual.caries = []
      atual.cariesSeverity = {}
      atual.fillingSurfaces = []
      atual.fillingSurfaceMaterials = {}
      atual.fillingMaterial = 'none'
      atual.restorationType = 'none'
      atual.restorationMaterial = 'none'
      atual.prosthesis = 'none'
      atual.mobility = 'none'
      break
    }

    case 'implante':
      atual.toothSelection = 'implant'
      break

    case 'deciduo':
      atual.toothSelection = 'milktooth'
      break

    case 'raiz-residual':
      atual.toothSelection = 'tooth-base'
      atual.toothSubstrate = 'radix'
      break

    case 'fratura': {
      atual.toothSelection = 'tooth-base'
      atual.toothSubstrate = 'broken'
      // As flags broken* só pintam com toothSubstrate === 'broken'; sem
      // superfície dita, marca a incisal (a fratura mais comum de se narrar).
      if (superficies.includes('mesial')) atual.brokenMesial = true
      if (superficies.includes('distal')) atual.brokenDistal = true
      if (superficies.length === 0 || superficies.includes('occlusal')) atual.brokenIncisal = true
      break
    }

    case 'mobilidade': {
      if (atual.toothSelection === 'none' || atual.toothSelection === 'implant') {
        return `${dente} está marcado como ausente/implante — mobilidade não se aplica`
      }
      atual.mobility = MOBILITY_MAP[p.grauMobilidade!]
      break
    }

    case 'calculo':
      atual.calculus = true
      break

    case 'selante':
      atual.fissureSealing = true
      break

    case 'extracao-indicada':
      atual.extractionPlan = true
      break

    case 'lesao-periapical':
      atual.apicalDx = 'asymptomatic-apical-periodontitis'
      break

    case 'carie-de-raiz':
      atual.rootCaries = 'active'
      break

    case 'desgaste': {
      const { campo, valor } = WEAR_MAP[p.desgaste!]
      atual[campo] = valor
      break
    }

    case 'aparelho':
      // O motor tem um bloco de ortodontia próprio (orthoAppliance/orthoDrift/
      // orthoRotation) que nunca tinha sido mapeado aqui. Faltando, ela caía na
      // anotação: "aparelho ortodontico neles" virava texto em oito dentes e o
      // desenho não mostrava aparelho nenhum.
      atual.orthoAppliance = p.aparelho === 'banda' ? 'band' : 'bracket'
      break

    // ── Restaurador ────────────────────────────────────────────────────────
    case 'defeito-restauracao': {
      // Objeto por SUPERFÍCIE, como fillingSurfaceMaterials — verificado por
      // round-trip: `fillingDefect: { occlusal: 'marginal' }` sobrevive.
      const mapa = lerMapa(atual.fillingDefect)
      superficies.forEach(sup => { mapa[sup] = MAPA_MOTOR.defeito[p.defeito!] })
      atual.fillingDefect = mapa
      break
    }
    case 'profundidade-radiografica': {
      // MAIÚSCULA — 'd1' é descartado em silêncio, 'D1' entra.
      const mapa = lerMapa(atual.radiographicDepth)
      superficies.forEach(sup => { mapa[sup] = p.profundidade! })
      atual.radiographicDepth = mapa
      break
    }

    // ── Endodontia ─────────────────────────────────────────────────────────
    case 'diagnostico-pulpar':
      atual.pulpDx = MAPA_MOTOR.pulpa[p.pulpa!]
      break
    case 'diagnostico-apical':
      atual.apicalDx = MAPA_MOTOR.apical[p.apical!]
      break
    case 'apicectomia':
      atual.endoResection = true
      break
    case 'pino-parapulpar':
      atual.parapulpalPin = true
      break

    // ── Perda e substituição ───────────────────────────────────────────────
    case 'espaco-fechado':
      atual.missingClosed = true
      break
    case 'ponte':
      atual.restorationType = 'bridge'
      break
    case 'pilar-de-ponte':
      atual.bridgePillar = true
      break
    case 'protese':
      atual.prosthesis = MAPA_MOTOR.protese[p.protese!]
      break

    // ── Periodontal e peri-implantar ───────────────────────────────────────
    case 'inflamacao-periodontal': {
      // `mods` é ARRAY de marcadores; só 'parodontal' sobreviveu ao round-trip.
      const mods = new Set(lerArray(atual.mods))
      mods.add('parodontal')
      atual.mods = [...mods]
      break
    }
    case 'peri-implantar':
      atual.periImplant = MAPA_MOTOR.periImplante[p.periImplante!]
      break

    // ── Estrutura e alterações ─────────────────────────────────────────────
    case 'discromia':
      atual.discoloration = MAPA_MOTOR.discromia[p.discromia!]
      break
    case 'reabsorcao':
      atual.resorptionType = MAPA_MOTOR.reabsorcao[p.reabsorcao!]
      break
    case 'contato-ausente':
      // Sem superfície dita, marca os dois lados — "contato ausente" sem
      // qualificar costuma ser o dente inteiro solto no arco.
      if (superficies.length === 0) { atual.contactMesial = true; atual.contactDistal = true }
      if (superficies.includes('mesial')) atual.contactMesial = true
      if (superficies.includes('distal')) atual.contactDistal = true
      break

    // ── Ortodontia ─────────────────────────────────────────────────────────
    case 'migracao':
      atual.orthoDrift = MAPA_MOTOR.migracao[p.migracao!]
      break
    case 'rotacao':
      atual.orthoRotation = true
      break
    case 'intrusao-extrusao':
      atual.orthoVertical = MAPA_MOTOR.vertical[p.vertical!]
      break

    case 'nota':
      // O texto em si é aplicado fora do switch (vale para qualquer achado).
      break

    default:
      return `achado "${String(p.achado)}" não é suportado`
  }

  // A anotação vale para QUALQUER achado, não só para achado="nota" — o
  // dentista dita "cárie na oclusal, anota que o paciente reclamou de
  // sensibilidade" numa frase só. Por isso fica FORA do switch.
  if (p.nota?.trim()) {
    const anterior = typeof atual.note === 'string' ? atual.note : ''
    const texto = p.nota.trim()
    atual.note = anterior ? `${anterior}\n${texto}` : texto
  }

  return null
}

/**
 * Aplica a proposta no motor, em UM ou VÁRIOS dentes.
 *
 * Tudo numa única leitura + escrita do estado: `getOdontogramState` serializa
 * os 32 dentes e `loadOdontogramState` re-hidrata e repinta os 32 — fazer isso
 * por dente numa arcada inteira seria 16 ciclos completos, com a boca piscando
 * a cada um.
 *
 * Falha por dente NÃO derruba a proposta inteira: marcar ausência em 16, 26 e
 * 36 aplica nos que aceitam e devolve em `recusados` os que não — a Cibelly lê
 * isso em voz alta, então o dentista fica sabendo exatamente o que não entrou.
 * O que derruba tudo é o que falta na FALA (superfície, material, grau), porque
 * aí nenhum dente poderia ser marcado.
 */
export function applyToothProposal(p: ToothProposal): ToothProposalResult {
  if (motivoDaTrava) return recusaPorTrava()
  const dentes = (p.dentes ?? []).filter(d => FDI_VALIDOS.has(d))
  const invalidos = (p.dentes ?? []).filter(d => !FDI_VALIDOS.has(d))

  if (dentes.length === 0) {
    return {
      ok: false,
      erro: invalidos.length
        ? `${invalidos.join(', ')} não existe(m) na numeração FDI (11-18, 21-28, 31-38, 41-48). Peça os números de novo.`
        : 'Nenhum dente foi informado. Pergunte de qual dente é o achado.',
    }
  }

  const superficies = (p.superficies ?? []).map(s => SURFACE_MAP[s]).filter(Boolean)
  const faltou = validarProposta(p, superficies)
  if (faltou) return { ok: false, erro: faltou }

  const payload = getOdontogramState() as {
    version?: string
    globals?: Record<string, unknown>
    teeth?: Record<string, ToothRaw>
  }
  const teeth = { ...(payload.teeth ?? {}) }

  const aplicados: number[] = []
  const recusados: string[] = []

  for (const dente of dentes) {
    const atual: ToothRaw = { ...(teeth[String(dente)] ?? {}) }
    const motivo = aplicarNoDente(atual, p, superficies, dente)
    if (motivo) {
      recusados.push(motivo)
      continue
    }
    teeth[String(dente)] = atual
    aplicados.push(dente)
  }

  if (aplicados.length === 0) {
    return { ok: false, erro: `Nada foi marcado: ${recusados.join('; ')}.` }
  }

  loadOdontogramState({ ...payload, teeth })

  if (invalidos.length) recusados.push(`${invalidos.join(', ')} não existe(m) na numeração FDI`)

  return {
    ok: true,
    resumo: describeProposal({ ...p, dentes: aplicados }),
    ...(recusados.length ? { recusados } : {}),
  }
}

/**
 * Campos que cada achado escreve — usado para APAGAR só aquele achado, sem
 * derrubar o resto do dente. Os valores aqui são os padrões do motor
 * (defaultState em odontogram.ts): "apagar cárie" é devolver `caries` e
 * `cariesSeverity` ao vazio, não remover a chave (chave ausente é aceita, mas
 * ser explícito deixa o payload legível e evita depender do fallback).
 */
const LIMPEZA_POR_ACHADO: Record<ToothFinding, ToothRaw> = {
  carie: { caries: [], cariesSeverity: {} },
  restauracao: { fillingSurfaces: [], fillingSurfaceMaterials: {}, fillingMaterial: 'none' },
  coroa: { restorationType: 'none', restorationMaterial: 'none', toothSubstrate: 'natural' },
  canal: { endo: 'none' },
  ausente: { toothSelection: 'tooth-base', extractionWound: false },
  extraida: { toothSelection: 'tooth-base', extractionWound: false },
  implante: { toothSelection: 'tooth-base' },
  deciduo: { toothSelection: 'tooth-base' },
  'raiz-residual': { toothSubstrate: 'natural' },
  aparelho: { orthoAppliance: 'none' },
  'defeito-restauracao': { fillingDefect: {} },
  'profundidade-radiografica': { radiographicDepth: {} },
  'diagnostico-pulpar': { pulpDx: 'normal' },
  'diagnostico-apical': { apicalDx: 'normal' },
  apicectomia: { endoResection: false },
  'pino-parapulpar': { parapulpalPin: false },
  'espaco-fechado': { missingClosed: false },
  ponte: { restorationType: 'none' },
  'pilar-de-ponte': { bridgePillar: false },
  protese: { prosthesis: 'none' },
  'inflamacao-periodontal': { mods: [] },
  'peri-implantar': { periImplant: 'none' },
  discromia: { discoloration: 'none' },
  reabsorcao: { resorptionType: 'none' },
  'contato-ausente': { contactMesial: false, contactDistal: false },
  migracao: { orthoDrift: 'none' },
  rotacao: { orthoRotation: false },
  'intrusao-extrusao': { orthoVertical: 'none' },
  fratura: { toothSubstrate: 'natural', brokenMesial: false, brokenIncisal: false, brokenDistal: false },
  mobilidade: { mobility: 'none' },
  calculo: { calculus: false },
  selante: { fissureSealing: false },
  'extracao-indicada': { extractionPlan: false },
  'lesao-periapical': { apicalDx: 'normal' },
  'carie-de-raiz': { rootCaries: 'none' },
  desgaste: { wearEdge: 'none', wearCervical: 'none' },
  nota: { note: '' },
}

export type ToothStateVerification =
  | { ok: true; dentes: number[] }
  | { ok: false; erro: string; dentes: number[] }

function stableState(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableState).join(',')}]`
  if (!value || typeof value !== 'object') return JSON.stringify(value)
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableState(child)}`)
    .join(',')}}`
}

function cloneTooth(tooth: ToothRaw): ToothRaw {
  return JSON.parse(JSON.stringify(tooth)) as ToothRaw
}

/**
 * Confere a pós-condição usando a mesma regra pura que aplica cada achado. Se
 * aplicar a proposta outra vez seria um no-op, o estado atual já a satisfaz.
 */
export function verifyToothProposalState(p: ToothProposal): ToothStateVerification {
  const dentes = (p.dentes ?? []).filter(d => FDI_VALIDOS.has(d))
  const superficies = (p.superficies ?? []).map(s => SURFACE_MAP[s]).filter(Boolean)
  const faltou = validarProposta(p, superficies)
  if (faltou || dentes.length === 0) {
    return { ok: false, erro: faltou ?? 'Nenhum dente válido para conferir.', dentes: [] }
  }

  const payload = getOdontogramState() as { teeth?: Record<string, ToothRaw> }
  const pendentes: number[] = []
  const avaliados: number[] = []

  for (const dente of dentes) {
    const atual = cloneTooth(payload.teeth?.[String(dente)] ?? {})
    const nota = p.nota?.trim()
    const notaPresente = !nota
      || (typeof atual.note === 'string' && atual.note.split('\n').includes(nota))

    if (p.achado === 'nota') {
      avaliados.push(dente)
      if (!notaPresente) pendentes.push(dente)
      continue
    }

    const esperado = cloneTooth(atual)
    const motivo = aplicarNoDente(esperado, { ...p, nota: undefined }, superficies, dente)
    // Uma recusa por dente já é comunicada por applyToothProposal e não é uma
    // gravação perdida. A conferência cobre somente os que podem receber.
    if (motivo) continue
    avaliados.push(dente)
    if (!notaPresente || stableState(atual) !== stableState(esperado)) {
      pendentes.push(dente)
    }
  }

  if (avaliados.length === 0 || pendentes.length > 0) {
    const falhos = pendentes.length ? pendentes : dentes
    return {
      ok: false,
      erro: `O estado do odontograma não confirmou o comando nos dentes ${falhos.join(', ')}.`,
      dentes: falhos,
    }
  }
  return { ok: true, dentes: avaliados }
}

const LIMPEZA_COMPLETA: ToothRaw = Object.assign({}, ...Object.values(LIMPEZA_POR_ACHADO))

/** Confere remoção específica, restauração de dente ou limpeza completa. */
export function verifyToothClearState(
  dentes?: number[],
  achado?: ToothFinding,
): ToothStateVerification {
  const validos = (dentes?.length ? dentes : [...FDI_VALIDOS]).filter(d => FDI_VALIDOS.has(d))
  const patch = achado ? LIMPEZA_POR_ACHADO[achado] : LIMPEZA_COMPLETA
  if (!patch || validos.length === 0) {
    return { ok: false, erro: 'Não há uma remoção válida para conferir.', dentes: [] }
  }

  const payload = getOdontogramState() as { teeth?: Record<string, ToothRaw> }
  const pendentes = validos.filter(dente => {
    const atual = payload.teeth?.[String(dente)] ?? {}
    return Object.entries(patch).some(([campo, esperado]) => (
      // Campo ausente hidrata com o padrão do motor e equivale a estar limpo.
      atual[campo] !== undefined && stableState(atual[campo]) !== stableState(esperado)
    ))
  })

  return pendentes.length
    ? {
        ok: false,
        erro: `A remoção não foi confirmada nos dentes ${pendentes.join(', ')}.`,
        dentes: pendentes,
      }
    : { ok: true, dentes: validos }
}

/**
 * Apaga marcações. Com `achado`, tira só aquele achado dos dentes indicados;
 * sem ele, devolve os dentes inteiros ao estado limpo.
 *
 * Existe porque "desfazer" só alcança o que a Cibelly acabou de fazer — e num
 * exame real o dentista pede "tira essa obturação do 15, 16 e 17" sobre coisa
 * que veio da ficha salva, de outra sessão ou de um clique manual. Sem isto ela
 * respondia que não tinha como, e a única saída era editar na mão.
 */
export function clearTeeth(dentes: number[], achado?: ToothFinding): ToothProposalResult {
  if (motivoDaTrava) return recusaPorTrava()
  const validos = (dentes ?? []).filter(d => FDI_VALIDOS.has(d))
  if (validos.length === 0) {
    return { ok: false, erro: 'Nenhum dente válido informado. Peça os números de novo.' }
  }
  if (achado && !LIMPEZA_POR_ACHADO[achado]) {
    return { ok: false, erro: `Não sei apagar "${achado}".` }
  }

  const payload = getOdontogramState() as {
    version?: string
    globals?: Record<string, unknown>
    teeth?: Record<string, ToothRaw>
  }
  const teeth = { ...(payload.teeth ?? {}) }

  for (const dente of validos) {
    teeth[String(dente)] = achado
      // Mescla por cima: preserva os outros achados do mesmo dente.
      ? { ...(teeth[String(dente)] ?? {}), ...LIMPEZA_POR_ACHADO[achado] }
      // Objeto vazio hidrata como dente padrão — é o "zerar" do motor.
      : {}
  }

  loadOdontogramState({ ...payload, teeth })

  const alvo = listarDentes(validos)
  return {
    ok: true,
    resumo: achado ? `${alvo}: ${achado} removido` : `${alvo}: marcações apagadas`,
  }
}

/** Zera a boca inteira. `null` é o caminho documentado do motor para isso. */
export function clearAllTeeth(): ToothProposalResult {
  if (motivoDaTrava) return recusaPorTrava()
  loadOdontogramState(null)
  return { ok: true, resumo: 'odontograma inteiro limpo' }
}

/**
 * LER O ODONTOGRAMA — o que está marcado agora, em português.
 *
 * A ferramenta que faltava, e a ausência dela explicava uma família inteira de
 * falhas: ela não conferia o próprio trabalho, não respondia "como está o 28?",
 * não sabia se já tinha marcado (escreveu a mesma nota no 23 duas vezes) e não
 * removia o que não enxergava. Quando o áudio falhava, preenchia a lacuna com
 * suposição porque não tinha contra o que verificar.
 *
 * Lê o TOOLTIP que o próprio motor monta, e não o estado cru: o tooltip já vem
 * traduzido e resumido pelo motor, então acompanha qualquer achado novo sem a
 * gente espelhar texto — inclusive os que este arquivo nem mapeia.
 */
export interface DenteMarcado {
  dente: number
  achados: string
  nota?: string
}

const MARCADOR_NOTA = '📝 '

export function readOdontogram(dentes?: number[]): DenteMarcado[] {
  const filtro = dentes?.length ? new Set(dentes) : null
  const tiles = document.querySelectorAll<HTMLElement>('.tooth-tile[data-tooth][title]')
  const saida: DenteMarcado[] = []
  const vistos = new Set<number>()

  tiles.forEach(tile => {
    const numero = Number(tile.dataset.tooth)
    if (!numero || vistos.has(numero)) return
    if (filtro && !filtro.has(numero)) return
    const title = (tile.getAttribute('title') ?? '').trim()
    if (!title) return
    vistos.add(numero)

    const i = title.indexOf(MARCADOR_NOTA)
    const achados = (i === -1 ? title : title.slice(0, i)).trim()
    const nota = i === -1 ? '' : title.slice(i + MARCADOR_NOTA.length).trim()
    // Dente só com nota não tem achado clínico — e é justamente o sintoma do
    // comando parafraseado, então vale aparecer explicitamente.
    saida.push({ dente: numero, achados: achados || '(só anotação)', ...(nota ? { nota } : {}) })
  })

  return saida.sort((a, b) => a.dente - b.dente)
}
