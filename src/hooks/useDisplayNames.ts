import { usePatients } from '@/hooks/usePatients'
import { useProfessionals } from '@/hooks/useProfessionals'

/**
 * Resolvem o NOME a partir do id, para exibição.
 *
 * O domínio referencia pessoas só por id (ver convenções em types/domain.ts):
 * o nome é resolvido na hora de mostrar, nunca guardado junto. Assim renomear
 * alguém não deixa o histórico com o nome antigo.
 *
 *   const professionalName = useProfessionalName()
 *   <span>{professionalName(sessao.profissionalId)}</span>
 */

/** Um mapa por LISTA, não por componente.
 *
 *  A grade renderiza dezenas de cards e cada um chama estes hooks; montar
 *  `new Map(...)` a cada render de cada card custaria (nº de cards × nº de
 *  pacientes) por render. Como o TanStack Query preserva a referência do array
 *  enquanto os dados não mudam (structural sharing), dá para guardar o mapa
 *  numa WeakMap indexada por essa referência: ele é montado UMA vez e é
 *  descartado sozinho quando a lista é substituída. */
const mapsByList = new WeakMap<object, Map<string, string>>()

function getNameMap(list: { id: string; name: string }[] | undefined) {
  if (!list) return undefined
  let map = mapsByList.get(list)
  if (!map) {
    map = new Map(list.map(item => [item.id, item.name]))
    mapsByList.set(list, map)
  }
  return map
}

/** Nome ainda não resolvido — aparece enquanto a lista carrega ou se o id for órfão. */
const NO_NAME = '—'

export function useProfessionalName() {
  const { data } = useProfessionals()
  const map = getNameMap(data)
  return (id?: string) => (id && map?.get(id)) || NO_NAME
}

/** Mesma técnica do mapa de nomes, para o par nome+registro. */
const signersByList = new WeakMap<object, Map<string, { name: string; license?: string }>>()

/**
 * QUEM ASSINA UM DOCUMENTO JÁ EMITIDO — nome e registro no conselho.
 *
 * Existe porque reimpressão não é emissão: a segunda via de uma receita é
 * outra cópia do MESMO papel, e tem de sair com a assinatura de quem a
 * emitiu. As telas assinavam com o usuário LOGADO, então um colega (ou a
 * recepção) reimprimindo a receita de outro profissional carimbava nela o
 * próprio nome e o próprio CRM — um documento que ninguém daquela clínica
 * chegou a emitir.
 *
 * A `specialty` do bloco de assinatura NÃO sai daqui: `Professional.specialty`
 * é texto livre de cadastro ("Ortodontia"), enquanto o cargo impresso
 * ("Cirurgião-dentista") vem da especialidade da CLÍNICA — quem chama passa.
 */
export function useDocumentSigner() {
  const { data } = useProfessionals()
  let map = data ? signersByList.get(data) : undefined
  if (data && !map) {
    map = new Map(data.map(p => [p.id, { name: p.name, license: p.license }]))
    signersByList.set(data, map)
  }
  return (id?: string) => (id ? map?.get(id) : undefined)
}

export function usePatientName() {
  const { data } = usePatients()
  const map = getNameMap(data)
  return (id?: string) => (id && map?.get(id)) || NO_NAME
}

const colorMapsByList = new WeakMap<object, Map<string, string | undefined>>()

function getColorMap(list: { id: string; color?: string }[] | undefined) {
  if (!list) return undefined
  let map = colorMapsByList.get(list)
  if (!map) {
    map = new Map(list.map(item => [item.id, item.color]))
    colorMapsByList.set(list, map)
  }
  return map
}

/** Cor cadastrada do profissional (perfil dele) — os cards da Agenda usam
 *  esta cor, não a da atividade, pra todo card daquele profissional ficar
 *  consistente com o que está configurado no perfil (e acompanhar sozinho
 *  se o dono trocar a cor depois, sem precisar re-salvar consultas antigas). */
export function useProfessionalColor() {
  const { data } = useProfessionals()
  const map = getColorMap(data)
  return (id?: string) => (id ? map?.get(id) : undefined)
}
