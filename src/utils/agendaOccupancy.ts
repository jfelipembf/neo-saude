/**
 * QUEM está na agenda — a pergunta que a consulta de agenda não sabia responder.
 *
 * `consultar_agenda` respondia só "esse horário está livre?" e, quando não
 * estava, o MOTIVO ("já ocupado") — nunca QUEM ocupa. Perguntada "quem está
 * agendado sexta às 9h?", a resposta possível era, na melhor das hipóteses,
 * "não está livre". Não é o que foi perguntado.
 *
 * O caso que erra fácil, e que motiva estas funções serem testadas: a consulta
 * das 8h30 com uma hora de duração AINDA OCUPA as 9h. Comparar só o horário de
 * início ("startTime === '09:00'") acharia a agenda vazia com o paciente na
 * cadeira.
 *
 * Canceladas e faltas não ocupam — mesmo recorte que o resto do sistema usa
 * para liberar o horário.
 */

export interface ConsultaNaAgenda {
  id: string
  patientId: string
  date: string        // aaaa-mm-dd
  startTime: string   // 'HH:MM'
  endTime: string     // 'HH:MM'
  activity: string
  status: string
}

/** 'HH:MM' → minutos desde a meia-noite. Ordenar e comparar como texto
 *  funcionaria aqui, mas somar duração não — e é disso que a sobreposição
 *  precisa. */
function emMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** Cancelada e falta liberam o horário; o resto ocupa. */
function ocupa(consulta: ConsultaNaAgenda): boolean {
  return consulta.status !== 'canceled' && consulta.status !== 'no_show'
}

/**
 * As consultas que atravessam um INSTANTE do dia.
 *
 * Intervalo semiaberto [início, fim): a consulta que termina às 9h NÃO ocupa
 * as 9h — esse horário está livre para a próxima, e dizer o contrário faria a
 * agenda parecer mais cheia do que está.
 */
export function consultasNoHorario(
  consultas: ConsultaNaAgenda[],
  dataIso: string,
  hora: string,
): ConsultaNaAgenda[] {
  const instante = emMinutos(hora)
  return consultas
    .filter(c => c.date === dataIso && ocupa(c))
    .filter(c => emMinutos(c.startTime) <= instante && instante < emMinutos(c.endTime))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

/** Tudo que está marcado no dia, na ordem em que acontece. */
export function consultasDoDia(
  consultas: ConsultaNaAgenda[],
  dataIso: string,
): ConsultaNaAgenda[] {
  return consultas
    .filter(c => c.date === dataIso && ocupa(c))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

/**
 * Frase pronta para ela ler — mesmo princípio do resto das ferramentas: o
 * código escreve, o modelo lê. Sintetizar lista em tempo real foi o que já
 * travou a fala dela no histórico (ver clinicalHistorySpeech.ts).
 */
export function textoDaOcupacao(
  consultas: ConsultaNaAgenda[],
  nomeDoPaciente: (id: string) => string,
): string {
  if (consultas.length === 0) return ''
  return consultas
    .map(c => `${c.startTime} ${nomeDoPaciente(c.patientId)}${c.activity ? ` (${c.activity})` : ''}`)
    .join('; ')
}

/** O que a pergunta sobre a agenda quer ver. */
export type FocoDaAgenda = 'agendamentos' | 'vagas'

/**
 * A PERGUNTA ABERTA NÃO VIRA LOCUÇÃO.
 *
 * "Como está minha agenda?" devolvia, para cada dia do período, quem está
 * marcado E todas as faixas livres — meio minuto de leitura em voz alta para
 * uma pergunta de dois segundos. E o dentista não pediu nada disso: ele ainda
 * nem sabe o que quer olhar.
 *
 * A regra é de RECORTE, não de tamanho: sem um dia definido, sem um paciente e
 * sem dizer o que quer ver, não existe resposta curta possível — então a
 * ferramenta devolve a pergunta em vez de despejar a agenda. Um dia específico
 * já é recorte suficiente e passa direto.
 *
 * Fica no código, e não no prompt, pelo mesmo motivo das outras: regra de
 * "seja mais breve" é a classe que falha; ferramenta que não tem o que
 * despejar nunca despeja.
 */
export function perguntaAmplaDemais(pedido: {
  data?: string
  dias?: number
  temPacienteAlvo: boolean
  foco?: FocoDaAgenda
}): boolean {
  if (pedido.temPacienteAlvo || pedido.foco) return false
  // Um único dia nomeado é recorte bastante: "quem está agendado sexta?"
  // responde em uma frase.
  if (pedido.data && (pedido.dias ?? 1) === 1) return false
  return true
}

/** As três saídas que o dentista tem — ditas como quem oferece, não como menu. */
export const PERGUNTA_DO_RECORTE =
  'Quer ver os agendamentos, os horários livres, ou de um dia específico?'
