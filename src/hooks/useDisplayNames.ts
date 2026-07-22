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

export function usePatientName() {
  const { data } = usePatients()
  const map = getNameMap(data)
  return (id?: string) => (id && map?.get(id)) || NO_NAME
}
