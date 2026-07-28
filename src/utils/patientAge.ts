import { parseBrDate } from '@/utils/date'

/**
 * A IDADE, como o médico a escreve.
 *
 * Não é `hoje.getFullYear() - nascimento.getFullYear()`: essa conta erra o ano
 * inteiro de quem ainda não fez aniversário, e num prontuário isso muda dose
 * de medicamento e faixa de referência de exame.
 *
 * Abaixo de 2 anos sai em MESES, que é como se registra em pediatria — "1 ano"
 * cobre desde o recém-nascido de 12 meses até o de 23, e a diferença clínica
 * entre eles é enorme.
 */
export function idadeDoPaciente(nascimentoBr: string | undefined, hoje = new Date()): string {
  if (!nascimentoBr) return ''
  const nascimento = parseBrDate(nascimentoBr)
  if (Number.isNaN(nascimento.getTime())) return ''
  if (nascimento > hoje) return ''

  let anos = hoje.getFullYear() - nascimento.getFullYear()
  let meses = hoje.getMonth() - nascimento.getMonth()
  if (hoje.getDate() < nascimento.getDate()) meses -= 1
  if (meses < 0) { anos -= 1; meses += 12 }

  if (anos === 0) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  if (anos === 1) return meses > 0 ? `1 ano e ${meses} ${meses === 1 ? 'mês' : 'meses'}` : '1 ano'
  return `${anos} anos`
}
