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

import {
  resolvePatientReference,
  type PatientDirectoryEntry,
} from '@/lib/cibelly/patientDirectory'

export interface PacienteParaMensagem extends PatientDirectoryEntry {
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
  if (!termo.trim()) return { ok: false, erro: 'Diga o nome do paciente.' }
  const resolution = resolvePatientReference(pacientes, termo)
  if (!resolution.ok) {
    return {
      ok: false,
      erro: resolution.error
        .replace('Não encontrei paciente com nome ou código "', 'Não encontrei paciente com o nome "')
        .replace('Há mais de um paciente:', 'Há mais de um paciente com esse nome:'),
    }
  }

  const paciente = resolution.patient
  if (!paciente.whatsapp) {
    return { ok: false, erro: `${descreverPaciente(paciente)} não tem WhatsApp cadastrado.` }
  }
  return { ok: true, paciente }
}
