/**
 * OS MARCOS DA FICHA — de snapshots soltos para uma linha do tempo legível.
 *
 * Cada procedimento gravado congela um snapshot do odontograma
 * (treatment_session_odontogram, imutável). Isso NÃO dá uma linha do tempo de
 * cara: no banco desta clínica há 26 snapshots do mesmo dia para a mesma
 * paciente, porque cada "Encerrar atendimento" grava um. Uma marca por snapshot
 * seriam 26 pontos idênticos e a linha do tempo não diria nada.
 *
 * A regra é UMA MARCA POR DIA, e a marca é o ÚLTIMO snapshot daquele dia —
 * o estado em que a boca FICOU quando o dia terminou. É essa a pergunta que o
 * dentista faz ("como ela estava quando saiu daqui em maio?"), não "como estava
 * no meio da terceira gravação".
 *
 * O desempate é por `createdAt` (quando gravou), e não por `date` (quando o
 * procedimento foi feito): dois snapshots do mesmo dia têm o mesmo `date` por
 * definição, então `date` não desempata nada.
 */

import { localDate, toShortDate } from '@/utils/date'

export interface SnapshotBruto {
  sessionId: string
  /** 'aaaa-mm-dd' — quando o procedimento foi FEITO. */
  date: string
  /** ISO completo — quando o snapshot foi GRAVADO. Só serve para desempatar. */
  createdAt: string
  description?: string
}

export interface MarcoDaFicha {
  /** A sessão cujo payload representa o dia (o último snapshot dele). */
  sessionId: string
  date: string
  description?: string
  /** Quantos snapshots o dia teve. 1 é o normal; mais que isso vira legenda. */
  registros: number
}

/**
 * Agrupa por dia e devolve do MAIS ANTIGO para o mais recente — a linha do
 * tempo se lê da esquerda para a direita, e o presente fica na ponta direita,
 * encostado no marco "Atual".
 */
export function marcosPorDia(brutos: SnapshotBruto[]): MarcoDaFicha[] {
  const porDia = new Map<string, SnapshotBruto[]>()

  for (const s of brutos) {
    // Snapshot sem data não tem lugar numa linha do tempo. Descartar é melhor
    // que inventar uma data e mostrar a boca de um dia no lugar de outro.
    if (!s.date) continue
    const lista = porDia.get(s.date) ?? []
    lista.push(s)
    porDia.set(s.date, lista)
  }

  return [...porDia.entries()]
    .map(([date, lista]) => {
      // Empate em createdAt desempata por sessionId — só para a escolha ser
      // sempre a mesma entre duas leituras, e não depender da ordem que o
      // banco devolveu.
      const ultimo = [...lista].sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt) || a.sessionId.localeCompare(b.sessionId),
      ).at(-1)!
      return {
        sessionId: ultimo.sessionId,
        date,
        description: ultimo.description,
        registros: lista.length,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Rótulo curto do marco: 'dd/mm' — e 'dd/mm/aa' quando o ano não é o corrente.
 *
 * Uma ficha antiga pode ter dois "14/03" de anos diferentes, e sem o ano os
 * dois marcos ficam idênticos na tela. O ano só aparece quando muda alguma
 * coisa, para a régua não virar uma parede de números.
 */
export function rotuloDoMarco(iso: string, hoje: Date): string {
  const d = localDate(iso)
  const curto = toShortDate(d)
  return d.getFullYear() === hoje.getFullYear()
    ? curto
    : `${curto}/${String(d.getFullYear()).slice(-2)}`
}
