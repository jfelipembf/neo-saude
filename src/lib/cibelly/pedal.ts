import { PEDAL_PADRAO } from './pedalConfig'
import type { PedalConfig } from './pedalConfig'
import type { CibellyListeningMode } from './sessionTypes'
import type { CibellyToolDomain } from './toolCatalog'

// As teclas do pedal mudaram de casa: agora vivem em `pedalConfig`, que
// aprende o código de cada pedal Bluetooth em vez de fixar J e F. Este arquivo
// ficou com o ESCOPO do pedal — o que cada modo pode e não pode fazer.

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable
    || target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
}

/**
 * O código veio do PEDAL FÍSICO aprendido, ou é a letra do teclado?
 *
 * J e F valem sempre (são o caminho de volta quando o pedal descarrega), mas
 * são letras que alguém digita — por isso não contam como pedal aqui.
 */
export function ehCodigoDePedal(code: string, config: PedalConfig): boolean {
  if (code === PEDAL_PADRAO.patientCode || code === PEDAL_PADRAO.generalCode) return false
  return code === config.patientCode || code === config.generalCode
}

/**
 * O FOCO NUM CAMPO DEVE ENGOLIR ESTA TECLA?
 *
 * Sim para J e F: quem escreve uma anotação precisa poder escrever "jejum".
 *
 * NÃO para o pedal físico. Um pisão nunca é digitação, e o código aprendido
 * (PageDown, seta, o que o modelo mandar) não é o que alguém escreve num campo.
 * A regra valia para tudo, e o alvo de um `keydown` é o elemento focado — então
 * bastava o foco parar num input em qualquer canto da tela para o pedal ficar
 * mudo até alguém tirá-lo dali. Era o "desliguei e liguei o pedal e ele não
 * aciona": abrir a configuração e fechar SEM SALVAR fazia voltar, porque o
 * modal move o foco, não porque a configuração mudasse.
 */
export function pedalEngolidoPorCampo(
  code: string,
  target: EventTarget | null,
  config: PedalConfig,
): boolean {
  if (ehCodigoDePedal(code, config)) return false
  return isEditableTarget(target)
}

export function pedalTurnInstruction(
  mode: CibellyListeningMode,
): string {
  if (mode === 'patient') {
    return '[CONTROLE DO PEDAL: PACIENTE ATUAL] O áudio a seguir trata somente do paciente que está em atendimento. Não atenda estoque, fornecedores, administração, outro paciente nem assunto geral neste turno. Se a fala pedir algo fora desse escopo, diga apenas: "Use o pedal F para essa demanda."'
  }

  return '[CONTROLE DO PEDAL: MODO GERAL] O áudio a seguir é uma demanda geral ou sobre outra pessoa. Não presuma que o dentista está falando do paciente aberto. Quando a ação depender de um paciente, use o nome ou código dito no pedido; numa resposta curta a uma pergunta sua, preserve o paciente que você acabou de perguntar. Se faltar identificação, pergunte objetivamente.'
}

export function pedalScopeError(
  mode: CibellyListeningMode | null,
  domain: CibellyToolDomain | undefined,
  toolName: string,
  args: Record<string, unknown>,
): string | null {
  const namesAnotherPatient = typeof args.paciente === 'string'
    && args.paciente.trim().length > 0
  if (mode === 'general') {
    // Só quem ESCREVE exige paciente. `consultar_agenda` é leitura, e exigir
    // paciente nela invertia a pergunta mais natural do modo geral: "quem está
    // agendado sexta às 9h?" não tem paciente para informar — descobrir quem é
    // É a pergunta. Barrada, ela respondia "preciso do nome do paciente" em
    // laço, e o dentista repetia a pergunta sem nunca conseguir a resposta.
    const patientRequired = toolName === 'agendar_consulta'
      || toolName === 'cancelar_consulta'
    if (patientRequired && !namesAnotherPatient) {
      return 'No pedal F, diga o nome ou código do paciente. Nenhuma consulta foi alterada.'
    }
    return null
  }
  if (mode !== 'patient') return null
  if (domain !== 'inventory' && domain !== 'patients' && !namesAnotherPatient) {
    return null
  }

  return 'O pedal J atende somente o paciente atual. Use o pedal F para demandas gerais, fornecedores ou outro paciente.'
}
