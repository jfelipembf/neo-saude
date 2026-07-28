import type { ClinicalEntryKind } from '@/services/clinicalEntriesService'

/**
 * As seções clínicas da tela de atendimento — rótulo e chamada de cada uma.
 *
 * Arquivo próprio, e não junto do painel, porque a barra de botões e o painel
 * leem a MESMA lista: se o rótulo divergir entre os dois, o médico clica em
 * "Riscos" e abre um painel chamando outra coisa. (O eslint também cobra a
 * separação — componente e constante no mesmo arquivo quebram o fast refresh.)
 */
/** Grau de parentesco — o 1º grau é o que mais pesa no risco familiar, e por
 *  isso vem primeiro na lista. */
export const PARENTESCOS = [
  'Pai', 'Mãe', 'Irmão', 'Irmã', 'Filho', 'Filha',
  'Avô paterno', 'Avó paterna', 'Avô materno', 'Avó materna',
  'Tio', 'Tia', 'Primo', 'Prima',
]

export const CLINICAL_SECTIONS: {
  kind: ClinicalEntryKind
  label: string
  placeholder: string
  /**
   * QUAIS CAMPOS A SEÇÃO PEDE, além do texto.
   *
   * Não são todas iguais: cirurgia e diagnóstico têm data ("quando aconteceu"),
   * histórico familiar tem parentesco e NÃO tem data — a idade em que o pai
   * infartou entra no próprio achado, e a data em que alguém digitou isso não
   * diz nada.
   */
  campos?: { data?: boolean; parentesco?: boolean }
}[] = [
  // Anamnese é a ÚNICA que não abre o painel de texto livre: o botão leva ao
  // questionário do paciente (AnamnesisPanel), o mesmo do perfil. Continua na
  // lista porque é daqui que a barra de botões é montada — o `placeholder` é
  // que não tem uso nela.
  { kind: 'anamnesis', label: 'Anamnese', placeholder: '' },
  // Rótulo "Achados clínicos" por escolha do dono. O `kind` continua
  // `problems` — é o valor GRAVADO, e renomeá-lo custaria migração de enum e
  // reescrita das linhas existentes para não mudar nada que o usuário veja.
  // (O termo consagrado da literatura é "lista de problemas", do Prontuário
  // Orientado por Problemas de Weed; o escopo é o mesmo: cabe queixa sem
  // diagnóstico fechado, etilismo, baixa adesão.)
  { kind: 'problems', label: 'Achados clínicos', placeholder: 'Hipertensão (2019), dor lombar crônica, tabagismo…', campos: { data: true } },
  { kind: 'surgical_history', label: 'Antecedentes cirúrgicos', placeholder: 'Cirurgias e intercorrências…', campos: { data: true } },
  {
    kind: 'family_history',
    label: 'Histórico familiar',
    placeholder: 'Ex.: infarto aos 55 anos, diabetes tipo 2, câncer de mama',
    campos: { parentesco: true },
  },
  { kind: 'medications', label: 'Uso de medicamentos', placeholder: 'O que toma hoje, dose e há quanto tempo…' },
  { kind: 'risks', label: 'Riscos', placeholder: 'Tabagismo, álcool, alergia, exposição ocupacional…', campos: { data: true } },
]
