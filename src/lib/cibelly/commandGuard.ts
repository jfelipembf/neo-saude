const TOOTH_MUTATION_TOOLS = new Set([
  'marcar_dente',
  'restaurar_dente',
  'apagar_marcacao',
])

const ORDER_INDEPENDENT_ARRAYS = new Set(['dentes', 'superficies'])

function stableValue(value: unknown, key = ''): unknown {
  if (Array.isArray(value)) {
    const items = value.map(item => stableValue(item))
    return ORDER_INDEPENDENT_ARRAYS.has(key)
      ? items.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
      : items
  }
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([childKey, childValue]) => [childKey, stableValue(childValue, childKey)]),
  )
}

/** Mesma ação com dentes/superfícies em outra ordem recebe a mesma chave. */
export function toothCommandFingerprint(
  tool: string,
  args: Record<string, unknown>,
): string | null {
  if (!TOOTH_MUTATION_TOOLS.has(tool)) return null
  return `${tool}:${JSON.stringify(stableValue(args))}`
}

export function isToothMutationTool(tool: string): boolean {
  return TOOTH_MUTATION_TOOLS.has(tool)
}

function normalizeSpeech(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,;:!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const FDI = /\b(?:1[1-8]|2[1-8]|3[1-8]|4[1-8])\b/
const FINDING =
  /\b(?:carie|mobilidade|restauracao|obturacao|coroa|canal|endodontia|implante|ausente|ausencia|presentes?|extraido|extracao|fratura|calculo|tartaro|selante|desgaste|atricao|erosao|abrasao|abfracao|protese|ponte|aparelho|raiz residual)\b/
const MUTATION =
  /\b(?:marque|marcar|adicione|adicionar|insira|inserir|remova|remover|apague|apagar|limpe|limpar|reverta|reverter|retorne|retornar|restaure|restaurar|recoloque|recolocar|desfaca)\b/
const QUESTION =
  /^(?:como|qual|quais|o que|que|tem|existe|esta marcado|esta presente)\b/
const SURFACE = /\b(?:mesial|distal|oclusal|incisal|vestibular|lingual|palatina)\b/
const MATERIAL = /\b(?:amalgama|resina|ionomero|provisorio)\b/
const MOBILITY_GRADE = /\b(?:grau|nivel)?\s*[123]\b/

function sortedNumbers(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b)
}

function spokenTeeth(text: string): number[] {
  const found = [...text.matchAll(/\b(1[1-8]|2[1-8]|3[1-8]|4[1-8])\b/g)]
    .map(match => Number(match[1]))
  for (const range of text.matchAll(/\b(1[1-8]|2[1-8]|3[1-8]|4[1-8])\s+(?:a|ao|ate)\s+(1[1-8]|2[1-8]|3[1-8]|4[1-8])\b/g)) {
    const start = Number(range[1])
    const end = Number(range[2])
    if (Math.floor(start / 10) !== Math.floor(end / 10)) continue
    const step = start <= end ? 1 : -1
    for (let tooth = start; tooth !== end + step; tooth += step) found.push(tooth)
  }
  return sortedNumbers(found)
}

function sameNumbers(a: number[], b: number[]): boolean {
  const left = sortedNumbers(a)
  const right = sortedNumbers(b)
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function explicitFinding(text: string): string | null {
  if (/\bcarie\b/.test(text)) return 'carie'
  if (/\bmobilidade\b/.test(text)) return 'mobilidade'
  if (/\b(?:restauracao|obturacao|amalgama|resina|ionomero|provisorio)\b/.test(text)) return 'restauracao'
  if (/\b(?:ausente|ausencia)\b/.test(text)) return 'ausente'
  if (/\bextraido\b/.test(text)) return 'extraida'
  if (/\bfratura\b/.test(text)) return 'fratura'
  if (/\b(?:calculo|tartaro)\b/.test(text)) return 'calculo'
  if (/\bselante\b/.test(text)) return 'selante'
  if (/\b(?:canal|endodontia)\b/.test(text)) return 'canal'
  return null
}

function restoresToothPresence(text: string): boolean {
  const finding = explicitFinding(text)
  if (finding && finding !== 'ausente') return false
  return /\bcomo\s+presentes?\b/.test(text)
    || /\b(?:esta|estao)\s+presentes?\b/.test(text)
    || (/\b(?:insira|inserir)\b/.test(text) && !/\bmarcacao\b/.test(text))
    || /\b(?:reverta|reverter|retorne|retornar|restaure|restaurar|recoloque|recolocar)\b/.test(text)
}

export interface DeterministicToothCommand {
  tool: 'restaurar_dente'
  args: { dentes: number[] }
}

/**
 * Interpreta somente restaurações de presença inequívocas. É usado pelo
 * watchdog quando o modelo encerra o turno sem executar uma ferramenta.
 */
export function parseDeterministicToothCommand(
  text: string,
): DeterministicToothCommand | null {
  if (text.trim().endsWith('?')) return null
  const normalized = normalizeSpeech(text)
  const dentes = spokenTeeth(normalized)
  if (dentes.length === 0 || QUESTION.test(normalized)
      || !restoresToothPresence(normalized)) return null
  return { tool: 'restaurar_dente', args: { dentes } }
}

/**
 * Detector deliberadamente conservador para o watchdog. Ele não interpreta o
 * comando nem altera o odontograma; apenas decide se vale pedir ao modelo uma
 * segunda passagem quando o primeiro turno terminou sem ferramenta.
 */
export function looksLikeUnservedToothCommand(text: string): boolean {
  if (text.trim().endsWith('?')) return false
  const normalized = normalizeSpeech(text)
  if (!FDI.test(normalized) || QUESTION.test(normalized)) return false
  if (/\bmobilidade\b/.test(normalized) && !MOBILITY_GRADE.test(normalized)) return false
  if (/\bcarie\b/.test(normalized) && !SURFACE.test(normalized)) return false
  if (/\b(?:restauracao|obturacao)\b/.test(normalized)
      && (!SURFACE.test(normalized) || !MATERIAL.test(normalized))) return false
  if (MUTATION.test(normalized)) return true
  return FINDING.test(normalized)
}

/** Confere somente a DIREÇÃO da ferramenta escolhida contra a fala. A
 * pós-condição clínica é verificada separadamente no estado do odontograma. */
export function mutationToolMatchesSpeech(
  text: string,
  tool: string,
  args: Record<string, unknown>,
): boolean {
  const normalized = normalizeSpeech(text)
  const teeth = spokenTeeth(normalized)
  const calledTeeth = Array.isArray(args.dentes)
    ? args.dentes.filter((value): value is number => typeof value === 'number')
    : []
  if (teeth.length > 0 && !sameNumbers(teeth, calledTeeth)) return false

  if (restoresToothPresence(normalized)) {
    return tool === 'restaurar_dente'
      || (tool === 'apagar_marcacao' && args.achado === 'ausente')
  }

  const removesFinding =
    /\b(?:remova|apague|limpe)\b/.test(normalized)
    && (/\bmarcacao\b/.test(normalized) || FINDING.test(normalized))
  if (removesFinding) {
    if (tool !== 'apagar_marcacao') return false
    const finding = explicitFinding(normalized)
    return !finding || args.achado === finding
  }

  if (FINDING.test(normalized) || /\b(?:marque|adicione)\b/.test(normalized)) {
    if (tool !== 'marcar_dente') return false
    const finding = explicitFinding(normalized)
    if (finding && args.achado !== finding) return false

    const surfaces = [...normalized.matchAll(
      /\b(mesial|distal|oclusal|incisal|vestibular|lingual|palatina)\b/g,
    )].map(match => match[1] === 'incisal' ? 'oclusal' : match[1])
    const calledSurfaces = Array.isArray(args.superficies)
      ? args.superficies.filter((value): value is string => typeof value === 'string')
      : []
    if (surfaces.length > 0 && !sameNumbers(
      surfaces.map(surface => ['mesial', 'distal', 'oclusal', 'vestibular', 'lingual', 'palatina'].indexOf(surface)),
      calledSurfaces.map(surface => ['mesial', 'distal', 'oclusal', 'vestibular', 'lingual', 'palatina'].indexOf(surface)),
    )) return false

    const material = (['amalgama', 'resina', 'ionomero', 'provisorio'] as const)
      .find(value => normalized.includes(value))
    if (material && args.material !== material) return false

    if (finding === 'mobilidade') {
      const grade = normalized.match(/\b(?:grau|nivel)?\s*([123])\b/)?.[1]
      const nested = args.mobilidade && typeof args.mobilidade === 'object'
        ? args.mobilidade as Record<string, unknown>
        : {}
      const calledGrade = args.grauMobilidade ?? args.grau ?? args.nivel ?? nested.grau ?? nested.nivel
      if (grade && Number(calledGrade) !== Number(grade)) return false
    }
    return true
  }
  return isToothMutationTool(tool)
}
