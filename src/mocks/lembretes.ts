import { toShortDate } from '@/utils/date'
import type { Lembrete } from '@/types/domain'

/** Data relativa a hoje (dd/mm) — mantém o mock sempre com os 3 estados de urgência. */
function diasAPartirDeHoje(dias: number) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return toShortDate(d)
}

export const MOCK_LEMBRETES: Lembrete[] = [
  { id: 'l1', texto: 'Ligar para confirmar consulta de Carlos Pereira', data: diasAPartirDeHoje(0),  concluido: false },
  { id: 'l2', texto: 'Pedir reposição de luvas de procedimento M',      data: diasAPartirDeHoje(-3), concluido: false },
  { id: 'l3', texto: 'Enviar relatório mensal para a contabilidade',    data: diasAPartirDeHoje(4),  concluido: false },
  { id: 'l4', texto: 'Reagendar retorno da Sra. Maria Oliveira',                                     concluido: false },
  { id: 'l5', texto: 'Renovar alvará sanitário',                        data: diasAPartirDeHoje(9),  concluido: true },
]
