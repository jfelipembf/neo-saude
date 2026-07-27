import { matchesSearch } from './search'

/**
 * QUAL SALA USAR NUM AGENDAMENTO — ou o que perguntar, quando não dá para saber.
 *
 * A regra vem do consultório, não do código: com UMA sala não existe escolha a
 * fazer, e perguntar seria só um turno de conversa a mais no meio do exame. Com
 * duas ou mais, chutar é pior que perguntar — sala errada colide com a agenda de
 * outro profissional, e o banco tem trava de sobreposição por sala
 * (`appointment_room_overlap_ex`), então o chute vira erro na cara do dentista.
 *
 * Função pura e fora da página porque é decisão com casos de borda de verdade
 * (nome falado, acento, ambiguidade) — e caso de borda sem teste é caso de borda
 * que ninguém conferiu.
 */
export type RoomChoice =
  | { ok: true; room?: string }
  | { ok: false; reason: string; rooms: string[] }

/** Sem acento e em minúsculas: "sala 2" acha "Sala 2". */
function key(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/**
 * @param rooms Nomes das salas cadastradas na clínica.
 * @param said  O que o dentista falou ("sala 2", "a da frente"), se falou.
 */
export function chooseRoom(rooms: string[], said?: string): RoomChoice {
  // Clínica sem sala cadastrada: o campo simplesmente não se aplica.
  if (rooms.length === 0) return { ok: true }
  if (rooms.length === 1) return { ok: true, room: rooms[0] }

  if (!said?.trim()) {
    return { ok: false, reason: 'A clínica tem mais de uma sala. Em qual delas?', rooms }
  }

  // Nome exato primeiro. "Sala 1" e "Sala 10" convivem no mesmo cadastro, e a
  // busca por aproximação sozinha casaria as duas com "sala 1".
  const exact = rooms.find(r => key(r) === key(said))
  if (exact) return { ok: true, room: exact }

  const similar = rooms.filter(r => matchesSearch(r, said))
  if (similar.length === 1) return { ok: true, room: similar[0] }

  return {
    ok: false,
    reason: similar.length > 1
      ? `Mais de uma sala combina com "${said}". Qual exatamente?`
      : `Não achei a sala "${said}".`,
    rooms,
  }
}
