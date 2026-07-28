import { STATUS_MAP } from '@/components/Badge/statusMap'
import { isoToBrDate } from '@/utils/date'

/**
 * COMO UM VALOR DA AUDITORIA VIRA TEXTO LEGÍVEL.
 *
 * A trilha guarda o registro CRU do banco — é isso que a torna confiável, e não
 * se mexe nisso. O problema é só de leitura: sem tradução, quem abre a
 * auditoria vê
 *
 *     Situação            active
 *     user_id             bcf17f74-ef65-41b3-8d7c-962bcc612156
 *     joined_at           2026-07-27T14:12:36.175865+00:00
 *     Cargo               5fed8a14-fe00-4852-b079-d476a0286240
 *
 * Três defeitos diferentes num bloco só: enum em inglês, chave técnica no lugar
 * de um nome, e carimbo de tempo do Postgres. Este arquivo é puro e testado
 * porque auditoria é o que se lê quando algo deu errado — e um valor exibido
 * errado ali manda a investigação para o lado oposto.
 */

/**
 * CHAVES TÉCNICAS: não se mostram.
 *
 * Um UUID não responde nenhuma pergunta que alguém faça na auditoria. A trilha
 * já diz QUAL entidade e QUAL registro foi tocado; repetir a chave estrangeira
 * dele só empurra para fora da tela o que interessa.
 *
 * As exceções estão em `REFERENCIAS_COM_NOME`: são as que a tela consegue
 * resolver para um nome de gente.
 */
export function ehChaveTecnica(campo: string): boolean {
  if (REFERENCIAS_COM_NOME.has(campo)) return false
  return /(^|_)id$/.test(campo)
    || /_by$/.test(campo)
    || campo === 'client_token'
    || campo === 'storage_path'
}

/**
 * Referências que a tela sabe transformar em nome — e por isso ficam.
 *
 * Fora daqui, `*_id` é ruído: ninguém reconhece um paciente pelo UUID, mas
 * "Paciente: José Felipe" responde a pergunta na hora.
 */
export const REFERENCIAS_COM_NOME = new Set(['patient_id', 'professional_id'])

/** Campos de DATA pura (aaaa-mm-dd). */
const ISO_DATA = /^\d{4}-\d{2}-\d{2}$/
/** Campos de CARIMBO (aaaa-mm-ddThh:mm:ss…), com ou sem fuso. */
const ISO_CARIMBO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

/**
 * Valores de enum que a auditoria mostra e o STATUS_MAP não cobre.
 *
 * O STATUS_MAP existe para os selos de situação e resolve a maioria
 * (`active`, `paid`, `scheduled`…). O que sobra aqui são enums de OUTRAS
 * colunas — forma de pagamento, sexo, tipo de categoria — que nunca viraram
 * selo e por isso não estavam mapeados em lugar nenhum.
 */
const VALORES: Record<string, string> = {
  // Financeiro
  revenue: 'Receita',
  expense: 'Despesa',
  payer: 'Paciente',
  acquirer: 'Adquirente',
  fixed_day: 'Dia fixo',
  performed: 'Por execução',
  received: 'Por recebimento',
  unbilled: 'Não faturado',
  // Formas de pagamento
  cash: 'Dinheiro',
  pix: 'Pix',
  credit: 'Crédito',
  debit: 'Débito',
  transfer: 'Transferência',
  boleto: 'Boleto',
  // Pessoas
  male: 'Masculino',
  female: 'Feminino',
  other: 'Outro',
  patient: 'Paciente',
  supplier: 'Fornecedor',
  // Serviços e documentos
  common: 'Comum',
  consultation: 'Consulta',
  procedure: 'Procedimento',
  certificate: 'Atestado',
  document: 'Documento',
  prescription: 'Receita',
  report: 'Relatório',
  exam: 'Exame',
  // Medicação
  suspended: 'Suspensa',
  dose_changed: 'Dosagem alterada',
  replaced: 'Substituída',
  continuous: 'Contínuo',
  // Duração
  days: 'Dias',
  months: 'Meses',
  years: 'Anos',
  // Origem
  manual: 'Manual',
  cibelly: 'Cibelly',
  appointment_automation: 'Automação de agenda',
}

/**
 * O valor pronto para a tela.
 *
 * `null` quando o campo é chave técnica — quem chama decide se some com a
 * linha inteira. Devolver "—" faria a auditoria listar dez linhas de travessão.
 */
export function auditValorLegivel(campo: string, valor: unknown): string | null {
  if (ehChaveTecnica(campo)) return null
  if (valor === null || valor === undefined || valor === '') return '—'
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
  if (typeof valor === 'number') return String(valor)

  if (typeof valor === 'object') {
    // JSON cru (nota SOAP, ficha médica) é ilegível numa linha. Dizer o que é
    // vale mais que despejar 2 KB de chaves.
    const chaves = Object.keys(valor as object)
    return chaves.length ? `{ ${chaves.length} campos }` : '—'
  }

  const texto = String(valor)

  // Carimbo do Postgres: vira dia + hora. A hora importa na auditoria — duas
  // ações no mesmo dia se distinguem por ela.
  if (ISO_CARIMBO.test(texto)) {
    const dia = isoToBrDate(texto)
    const hora = texto.slice(11, 16)
    return dia ? `${dia} ${hora}` : texto
  }
  if (ISO_DATA.test(texto)) return isoToBrDate(texto) ?? texto

  // Enum: STATUS_MAP primeiro (é a fonte dos selos do app), depois o mapa
  // daqui. Sem tradução, devolve como veio — inventar rótulo seria pior.
  const doStatus = STATUS_MAP[texto.toLowerCase()]?.label
  return doStatus ?? VALORES[texto] ?? texto
}
