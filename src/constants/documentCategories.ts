import type { PatientDocumentCategory } from '@/types/domain'

/**
 * AS DIVISÕES DA ABA DOCUMENTOS — fonte única.
 *
 * Usadas em DOIS lugares: o painel do atendimento da fisioterapia e a aba
 * Documentos do perfil do paciente. Duplicar a lista faria o documento
 * arquivado como "Exame" numa tela reaparecer sob outro rótulo na outra — e
 * quem classifica espera reencontrar do mesmo jeito.
 *
 * `other` por último: é o balde do que não foi classificado, não uma categoria
 * de verdade.
 */
export const DOCUMENT_CATEGORIES: {
  key: PatientDocumentCategory
  label: string
  vazio: string
}[] = [
  { key: 'certificate', label: 'Atestados',  vazio: 'Nenhum atestado arquivado.' },
  { key: 'exam',        label: 'Exames',     vazio: 'Nenhum exame ou laudo arquivado.' },
  { key: 'report',      label: 'Relatórios', vazio: 'Nenhum relatório arquivado.' },
  { key: 'other',       label: 'Outros',     vazio: 'Nada aqui.' },
]

/** Rótulo pt de uma divisão (para o selo na lista). */
export function documentCategoryLabel(key: PatientDocumentCategory): string {
  return DOCUMENT_CATEGORIES.find(c => c.key === key)?.label ?? 'Outros'
}
