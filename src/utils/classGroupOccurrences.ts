import { addDays, brToIsoDate, localDate, toIsoDate } from '@/utils/date'
import type { ClassGroup, ClassGroupOccurrence } from '@/types/domain'

function addMinutes(start: string, minutes: number) {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Materializa as ocorrências (dias concretos) de cada turma dentro de
 * [fromIso, toIso] — a Agenda pede só a semana visível, então isto roda por
 * no máximo 7 dias × N turmas, nunca por todo o histórico. Turma sem
 * professionalId/roomId ainda aparece (o card cai na cor padrão).
 */
export function materializeClassGroupOccurrences(
  classGroups: ClassGroup[],
  fromIso: string,
  toIso: string,
  roomNameById: Map<string, string>,
  enrolledCountByGroup: Map<string, number>,
): ClassGroupOccurrence[] {
  const occurrences: ClassGroupOccurrence[] = []
  const end = localDate(toIso)
  for (let cursor = localDate(fromIso); toIsoDate(cursor) <= toIsoDate(end); cursor = addDays(cursor, 1)) {
    const dateIso = toIsoDate(cursor)
    const weekday = cursor.getDay()
    for (const g of classGroups) {
      if (g.weekday !== weekday) continue
      const startIso = brToIsoDate(g.startDate)
      const endIso = brToIsoDate(g.endDate)
      if (startIso && dateIso < startIso) continue
      if (endIso && dateIso > endIso) continue
      occurrences.push({
        id: `${g.id}-${dateIso}`,
        classGroupId: g.id,
        name: g.name,
        date: dateIso,
        startTime: g.startTime,
        endTime: addMinutes(g.startTime, g.durationMinutes),
        professionalId: g.professionalId,
        roomName: g.roomId ? roomNameById.get(g.roomId) : undefined,
        maxCapacity: g.maxCapacity,
        enrolledCount: enrolledCountByGroup.get(g.id) ?? 0,
      })
    }
  }
  return occurrences
}
