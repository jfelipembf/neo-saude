import {
  IconChecklist, IconClinicalRecord, IconDiagnosis, IconDocumentsFolder, IconFamilyGroup,
  IconInterview, IconMedicationJar, IconRisk, IconSurgery, IconVitalSigns,
} from '@/components/icons'
import type { NavItem } from '../Components/Shell/navItems'

export type MedNavKey =
  | 'ficha' | 'documentos' | 'exames' | 'medicacoes' | 'sinais-vitais'
  | 'diagnostico' | 'anamnese' | 'antecedentes-cirurgicos' | 'historico-familiar' | 'risco'

/**
 * As seções do atendimento MÉDICO.
 *
 * A ordem é a da consulta, não a do alfabeto: escreve-se a ficha, entrega-se o
 * documento, pede-se o exame. O que é histórico (anamnese, antecedentes,
 * família, risco) fecha a lista — consulta-se quando surge a dúvida, não a
 * cada atendimento.
 *
 * 'Sinais vitais' é GANHO da migração, não simetria com o Fisio: o
 * VitalSignsPanel já existia pronto e o médico simplesmente não tinha acesso a
 * ele por esta tela.
 *
 * 'Evoluções anteriores' NÃO é item de menu, de propósito: ela vive DENTRO da
 * Ficha, abaixo do editor. O gesto da consulta de retorno é ler o anterior
 * enquanto se escreve o de hoje — separar em duas seções obrigaria a alternar.
 */
export const ITENS: NavItem<MedNavKey>[] = [
  { chave: 'ficha', label: 'Ficha da consulta', icon: <IconClinicalRecord /> },
  { chave: 'documentos', label: 'Documentos', icon: <IconDocumentsFolder /> },
  // Botão separado de Documentos de propósito: entregar receita e pedir exame
  // são momentos diferentes da consulta.
  { chave: 'exames', label: 'Exames', icon: <IconChecklist /> },
  { chave: 'medicacoes', label: 'Medicações', icon: <IconMedicationJar /> },
  { chave: 'sinais-vitais', label: 'Sinais vitais', icon: <IconVitalSigns /> },
  { chave: 'diagnostico', label: 'Diagnóstico', icon: <IconDiagnosis /> },
  { chave: 'anamnese', label: 'Anamnese', icon: <IconInterview /> },
  { chave: 'antecedentes-cirurgicos', label: 'Antecedentes cirúrgicos', icon: <IconSurgery /> },
  { chave: 'historico-familiar', label: 'Histórico familiar', icon: <IconFamilyGroup /> },
  { chave: 'risco', label: 'Riscos', icon: <IconRisk /> },
]

/**
 * Os dois atalhos da barra inferior do PWA.
 *
 * FICHA porque é onde o médico passa a maior parte da consulta — a própria
 * tela antiga dizia isso ao justificar por que o painel lateral nascia fechado.
 * DOCUMENTOS porque receita ou atestado é o desfecho de quase toda consulta
 * ambulatorial, e é literalmente o que o paciente leva na mão.
 *
 * Sinais vitais fica FORA: no Fisio a aferição abre a sessão e por isso merece
 * o dedo; no consultório peso e pressão entram dentro do exame físico. Copiar
 * o atalho do Fisio seria copiar sem o motivo do Fisio.
 */
export const ATALHOS_DA_BARRA = ['ficha', 'documentos'] as const satisfies readonly MedNavKey[]
