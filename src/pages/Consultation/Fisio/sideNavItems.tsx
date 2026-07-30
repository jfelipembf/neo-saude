import type { NavItem } from '../Components/Shell/navItems'
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
export const ITENS: NavItem<SideNavKey>[] = [
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

/**
 * As seções que SÓ existem dentro de um tratamento — sem plano ativo elas não
 * têm onde gravar, e a tela mostra "Nenhum tratamento ativo" com o botão de
 * abrir um no lugar do painel.
 *
 * O critério é o do DADO, não o da tela: são exatamente as que já recebem
 * `carePlanId` (prontuário da sessão, aferição, teste, avaliação e
 * diagnóstico) — o registro nasce amarrado ao episódio, e escrever com o
 * campo vazio deixaria a anotação órfã, fora do relatório de evolução e fora
 * do recorte que toda essas telas fazem por tratamento.
 *
 * O resto do menu é do PACIENTE e atravessa tratamentos (histórico familiar,
 * risco, medicações, antecedentes cirúrgicos, documentos, anamnese) ou é a
 * própria porta de entrada ('meus-tratamentos', onde o tratamento se cria) —
 * travar essas seções só esconderia informação de quem ainda está decidindo
 * se abre um tratamento.
 */
export const SECOES_COM_TRATAMENTO = [
  'prontuarios', 'sinais-vitais', 'testes', 'avaliacoes', 'diagnostico',
] as const satisfies readonly SideNavKey[]

/** A seção depende de um tratamento ativo? */
export function exigeTratamento(chave: string): boolean {
  return (SECOES_COM_TRATAMENTO as readonly string[]).includes(chave)
}

/** Os DOIS atalhos fixos da barra inferior do PWA (ver Shell/MobileNav). Ficam
 *  aqui, ao lado da lista, porque são escolha de PRODUTO desta especialidade:
 *  no Fisio a aferição abre a sessão e a evolução fecha, então são essas duas
 *  que merecem o dedo. A mesma tupla alimenta a barra e some da grade. */
export const ATALHOS_DA_BARRA = ['prontuarios', 'sinais-vitais'] as const satisfies readonly SideNavKey[]
