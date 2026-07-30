import type { ReactNode } from 'react'
import {
  IconChecklist, IconClinicalRecord, IconDiagnosis, IconDocumentsFolder, IconFamilyGroup, IconInterview,
  IconMedicationJar, IconRisk, IconRulerDuotone, IconSurgery, IconTreatmentHistory, IconVitalSigns,
} from '@/components/icons'

export type SideNavKey =
  | 'sinais-vitais' | 'prontuarios' | 'testes' | 'avaliacoes'
  | 'anamnese' | 'diagnostico' | 'historico-familiar' | 'risco'
  | 'medicacoes' | 'antecedentes-cirurgicos' | 'documentos' | 'meus-tratamentos'

/** Fonte única de rótulo+ícone por seção — reaproveitada pelo SideNav
 *  (desktop) e pela grade do MobileHome (PWA mobile), pra não duplicar essa
 *  lista num segundo lugar. Fica num arquivo à parte porque um arquivo de
 *  componente só pode exportar componentes — senão o Fast Refresh quebra.
 *
 *  Os 12 ícones são do conjunto Solar Duotone (ver comentário em
 *  components/icons/index.tsx) — mesmo `icon` para os dois lugares: no
 *  SideNav do desktop saem monocromáticos em 18px (herdam `currentColor` do
 *  item), no MobileHome saem coloridos em 60px sobre fundo claro. */
export const ITENS: { chave: SideNavKey; label: string; icon: ReactNode }[] = [
  { chave: 'sinais-vitais', label: 'Sinais vitais', icon: <IconVitalSigns /> },
  { chave: 'prontuarios', label: 'Prontuários', icon: <IconClinicalRecord /> },
  { chave: 'testes', label: 'Testes', icon: <IconChecklist /> },
  { chave: 'avaliacoes', label: 'Avaliações', icon: <IconRulerDuotone /> },
  { chave: 'anamnese', label: 'Anamnese', icon: <IconInterview /> },
  { chave: 'diagnostico', label: 'Diagnóstico', icon: <IconDiagnosis /> },
  { chave: 'historico-familiar', label: 'Histórico familiar', icon: <IconFamilyGroup /> },
  { chave: 'risco', label: 'Risco', icon: <IconRisk /> },
  { chave: 'medicacoes', label: 'Medicações', icon: <IconMedicationJar /> },
  { chave: 'antecedentes-cirurgicos', label: 'Antecedentes cirúrgicos', icon: <IconSurgery /> },
  { chave: 'documentos', label: 'Documentos', icon: <IconDocumentsFolder /> },
  // Último da lista, de propósito: os itens acima são dados clínicos do
  // atendimento; este é o histórico do CASO — categoria diferente, por isso
  // fecha a lista em vez de abrir.
  { chave: 'meus-tratamentos', label: 'Meus tratamentos', icon: <IconTreatmentHistory /> },
]
