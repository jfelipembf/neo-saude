/**
 * CATÁLOGO DE ACHADOS DO ODONTOGRAMA — fonte única.
 *
 * Existe porque a lista de achados vivia em TRÊS lugares: a union no
 * TypeScript, o enum de `marcar_dente` e o enum de `apagar_marcacao` (esses dois
 * na Edge Function). Sair de sincronia era questão de tempo, e saiu: o achado
 * "aparelho" foi para o TypeScript e para a prosa do prompt, mas não para os
 * enums — marcar funcionava por acidente e REMOVER não existia. O dentista pediu
 * para tirar o aparelho do 28 e ouviu "não tenho essa opção".
 *
 * Agora os três derivam daqui. Achado novo entra em UM lugar e aparece nos três.
 *
 * SEM IMPORTS de propósito: a Edge Function roda em Deno e carrega este arquivo
 * por caminho relativo, igual ao spokenName.ts.
 *
 * ⚠️ TODO valor de motor citado aqui foi verificado por ROUND-TRIP contra o
 * motor real (escrever → recarregar → conferir se sobreviveu), não por leitura
 * do bundle minificado. O motor descarta em silêncio o que não conhece, então
 * ler o código não basta — três palpites meus caíram nessa checagem
 * (`periapicalType`, `pulpLatin` e `secondaryCaries` não aceitam escrita).
 * Ver toothCatalog.test.ts, que refaz o round-trip a cada rodada de teste.
 */

/**
 * Os ids, em TUPLA LITERAL — é daqui que sai a união do TypeScript.
 *
 * Tupla e não `.map()`: com `string[]` a união vira `string`, e aí
 * `Record<ToothFinding, …>` para de exigir entrada para cada achado. Foi
 * exatamente essa exaustividade que pegou o `aparelho` faltando no mapa de
 * limpeza — perdê-la seria trocar um bug silencioso por outro.
 */
export const IDS_DOS_ACHADOS = [
  'carie',
  'restauracao',
  'coroa',
  'selante',
  'carie-de-raiz',
  'defeito-restauracao',
  'profundidade-radiografica',
  'canal',
  'diagnostico-pulpar',
  'diagnostico-apical',
  'lesao-periapical',
  'apicectomia',
  'pino-parapulpar',
  'ausente',
  'extraida',
  'extracao-indicada',
  'espaco-fechado',
  'implante',
  'ponte',
  'pilar-de-ponte',
  'protese',
  'raiz-residual',
  'mobilidade',
  'calculo',
  'inflamacao-periodontal',
  'peri-implantar',
  'fratura',
  'desgaste',
  'discromia',
  'reabsorcao',
  'contato-ausente',
  'deciduo',
  'aparelho',
  'migracao',
  'rotacao',
  'intrusao-extrusao',
  'nota',
] as const

export type IdAchado = typeof IDS_DOS_ACHADOS[number]

/** Uma linha por achado, para o modelo saber quando usar cada um. */
export const ACHADOS: Record<IdAchado, string> = {
  'carie': 'cárie (exige superfícies; gravidade 1–6 = ICDAS)',
  'restauracao': 'obturação/restauração (exige superfícies e material)',
  'coroa': 'coroa protética (exige materialCoroa)',
  'selante': 'selante de fóssulas e fissuras',
  'carie-de-raiz': 'cárie de raiz',
  'defeito-restauracao': 'defeito na restauração existente (exige superfícies e defeito)',
  'profundidade-radiografica': 'profundidade da lesão na radiografia (exige superfícies e profundidade E1/E2/D1/D2/D3)',
  'canal': 'tratamento de canal feito',
  'diagnostico-pulpar': 'diagnóstico da polpa (exige pulpa: normal, pulpite reversível/irreversível, necrose)',
  'diagnostico-apical': 'diagnóstico apical (exige apical: periodontite sintomática/assintomática, abscesso agudo/crônico, osteíte condensante)',
  'lesao-periapical': 'lesão periapical (marca inflamação apical)',
  'apicectomia': 'resecção apical / apicectomia',
  'pino-parapulpar': 'pino parapulpar',
  'ausente': 'dente ausente',
  'extraida': 'dente extraído',
  'extracao-indicada': 'extração indicada',
  'espaco-fechado': 'espaço da ausência já fechado',
  'implante': 'implante',
  'ponte': 'elemento de ponte',
  'pilar-de-ponte': 'dente que serve de pilar da ponte',
  'protese': 'prótese (exige protese: removível parcial/total, barra, locator, cicatrizador)',
  'raiz-residual': 'raiz residual',
  'mobilidade': 'mobilidade (exige grauMobilidade 1, 2 ou 3)',
  'calculo': 'cálculo/tártaro',
  'inflamacao-periodontal': 'inflamação periodontal neste dente',
  'peri-implantar': 'estado peri-implantar (exige periImplante: mucosite ou peri-implantite leve/moderada/grave)',
  'fratura': 'fratura (superfícies opcionais: mesial, incisal, distal)',
  'desgaste': 'desgaste (exige desgaste: atrição, erosão, abrasão, abfração)',
  'discromia': 'alteração de cor (exige discromia: extrínseca, fluorose, não-vital, tetraciclina, outra)',
  'reabsorcao': 'reabsorção (exige reabsorcao: interna ou cervical externa)',
  'contato-ausente': 'ponto de contato ausente (exige superfícies mesial e/ou distal)',
  'deciduo': 'dente decíduo (de leite)',
  'aparelho': 'aparelho ortodôntico (aparelho: braquete ou banda; braquete é o padrão)',
  'migracao': 'migração do dente (exige migracao: mesial ou distal)',
  'rotacao': 'dente rotacionado',
  'intrusao-extrusao': 'intrusão ou extrusão (exige vertical)',
  'nota': 'anotação em texto livre — NUNCA para substituir um achado acima',
}

/** Linha pronta para a descrição do enum, sem inchar o prompt à toa. */
export function descricaoDosAchados(): string {
  return IDS_DOS_ACHADOS.map(id => `${id} = ${ACHADOS[id]}`).join('; ')
}

// ── Valores de PARÂMETRO, todos verificados por round-trip ───────────────────

export const PULPA = ['normal', 'pulpite-reversivel', 'pulpite-irreversivel', 'necrose'] as const
export const APICAL = [
  'periodontite-sintomatica', 'periodontite-assintomatica',
  'abscesso-agudo', 'abscesso-cronico', 'osteite-condensante',
] as const
export const PERI_IMPLANTE = ['mucosite', 'leve', 'moderada', 'grave'] as const
export const DISCROMIA = ['extrinseca', 'fluorose', 'nao-vital', 'tetraciclina', 'outra'] as const
export const REABSORCAO = ['interna', 'cervical-externa'] as const
export const PROTESE = [
  'removivel-parcial', 'removivel-total', 'barra', 'protese-sobre-barra',
  'locator', 'protese-sobre-locator', 'cicatrizador',
] as const
export const MIGRACAO = ['mesial', 'distal'] as const
export const VERTICAL = ['intrusao', 'extrusao'] as const
export const DEFEITO = ['marginal', 'fratura', 'desgaste'] as const
export const PROFUNDIDADE = ['E1', 'E2', 'D1', 'D2', 'D3'] as const

/** Português falado → valor que o motor aceita. Sempre nesta direção. */
export const MAPA_MOTOR = {
  pulpa: {
    normal: 'normal',
    'pulpite-reversivel': 'reversible-pulpitis',
    'pulpite-irreversivel': 'irreversible-pulpitis',
    necrose: 'necrosis',
  },
  apical: {
    'periodontite-sintomatica': 'symptomatic-apical-periodontitis',
    'periodontite-assintomatica': 'asymptomatic-apical-periodontitis',
    'abscesso-agudo': 'acute-apical-abscess',
    'abscesso-cronico': 'chronic-apical-abscess',
    'osteite-condensante': 'condensing-osteitis',
  },
  periImplante: {
    mucosite: 'mucositis',
    leve: 'peri-implantitis-mild',
    moderada: 'peri-implantitis-moderate',
    grave: 'peri-implantitis-severe',
  },
  discromia: {
    extrinseca: 'extrinsic',
    fluorose: 'fluorosis',
    'nao-vital': 'nonvital',
    tetraciclina: 'tetracycline',
    outra: 'other',
  },
  reabsorcao: { interna: 'internal', 'cervical-externa': 'external-cervical' },
  protese: {
    'removivel-parcial': 'removable-partial',
    'removivel-total': 'removable-full',
    barra: 'bar',
    'protese-sobre-barra': 'bar-denture',
    locator: 'locator',
    'protese-sobre-locator': 'locator-denture',
    cicatrizador: 'healing-abutment',
  },
  migracao: { mesial: 'mesial', distal: 'distal' },
  vertical: { intrusao: 'intrusion', extrusao: 'extrusion' },
  defeito: { marginal: 'marginal', fratura: 'fracture', desgaste: 'wear' },
} as const
