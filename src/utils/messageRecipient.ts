/**
 * QUEM recebe a mensagem — quando o dentista cita um paciente pelo nome.
 *
 * A ferramenta de mensagem nasceu SÓ para o paciente aberto no odontograma, e
 * isso não era limitação: era a trava que impedia a assistente de escolher
 * destinatário sozinha a partir de áudio mal transcrito. Mandar recado clínico
 * para a pessoa errada não se desfaz — sai do WhatsApp da clínica, chega no
 * celular de outro paciente, e é dado de saúde de um vazando para outro.
 *
 * Abrir para outros pacientes exige preservar essa garantia por outro caminho,
 * e a regra é uma só: NA DÚVIDA, NÃO ESCOLHE. Mesmo desenho de
 * `chooseRoom` (utils/roomChoice.ts) — nenhum candidato recusa, um resolve,
 * dois ou mais devolvem a lista e PERGUNTAM.
 *
 * "Ana" com uma Ana Paula e uma Ana Maria na clínica é exatamente o caso que
 * não pode ser resolvido no chute. Aqui ele vira pergunta, não aposta.
 *
 * O que sai daqui é sempre o paciente do CADASTRO (id incluído). O número
 * nunca trafega: quem resolve o telefone é o servidor, pelo id, dentro da
 * clínica (ver evolution-send).
 */

import { matchesSearch } from '@/utils/search'

export interface PacienteParaMensagem {
  id: string
  code: string
  name: string
  commonName?: string
  whatsapp?: string
}

export type ResolucaoDeDestinatario =
  | { ok: true; paciente: PacienteParaMensagem }
  | { ok: false; erro: string }

/** "Ana Paula Souza (PAC-000012)" — o que ela lê em voz alta na confirmação. */
export function descreverPaciente(p: PacienteParaMensagem): string {
  return `${p.name} (${p.code})`
}

export function resolverDestinatario(
  pacientes: PacienteParaMensagem[],
  termo: string,
): ResolucaoDeDestinatario {
  const busca = termo.trim()
  if (!busca) return { ok: false, erro: 'Diga o nome do paciente.' }

  // Nome completo bate primeiro; só depois a busca por partes. Assim "Ana
  // Paula" não fica ambígua num cadastro que também tem "Ana Paula Souza".
  const exato = pacientes.filter(
    p => p.name.trim().toLowerCase() === busca.toLowerCase()
      || p.commonName?.trim().toLowerCase() === busca.toLowerCase(),
  )
  const achados = exato.length
    ? exato
    : pacientes.filter(p => matchesSearch(p.name, busca) || (p.commonName && matchesSearch(p.commonName, busca)))

  if (achados.length === 0) {
    return { ok: false, erro: `Não encontrei paciente com o nome "${busca}".` }
  }

  // ⚠️ O CORAÇÃO DESTE ARQUIVO. Com mais de um candidato ela NÃO escolhe —
  // nem o primeiro, nem o mais parecido, nem o mais recente. Devolve a lista
  // com o código de cada um (que é o que desempata na fala) e pergunta.
  if (achados.length > 1) {
    const lista = achados.slice(0, 8).map(descreverPaciente).join('; ')
    const resto = achados.length > 8 ? ` e mais ${achados.length - 8}` : ''
    return {
      ok: false,
      erro: `Há mais de um paciente com esse nome: ${lista}${resto}. Pergunte qual, pelo nome completo ou pelo código.`,
    }
  }

  const paciente = achados[0]
  if (!paciente.whatsapp) {
    return { ok: false, erro: `${descreverPaciente(paciente)} não tem WhatsApp cadastrado.` }
  }
  return { ok: true, paciente }
}
