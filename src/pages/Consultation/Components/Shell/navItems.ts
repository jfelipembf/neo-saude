import type { ReactNode } from 'react'

/**
 * Um item do menu de seções do atendimento.
 *
 * Genérico na CHAVE porque cada especialidade tem o seu conjunto: fisioterapia
 * tem 'testes' e 'avaliacoes', odontologia tem 'odontograma', medicina tem
 * 'exames'. O tipo da chave vem de fora (`SideNavKey` de cada pasta), então o
 * TypeScript recusa passar para a tela médica uma chave que só existe em fisio.
 */
export interface NavItem<K extends string> {
  chave: K
  label: string
  /** Mesmo ícone nos três lugares onde a seção aparece — menu lateral (18px,
   *  monocromático), grade do PWA (60px, colorido) e barra inferior. Um ícone
   *  diferente por lugar ensinaria três associações para a mesma coisa. */
  icon: ReactNode
}

/** A chave do botão central da barra inferior. Não é seção: é o "voltar para a
 *  grade de ícones", e por isso vive fora do conjunto de cada especialidade. */
export const CHAVE_INICIO = 'inicio' as const
export type ChaveInicio = typeof CHAVE_INICIO
