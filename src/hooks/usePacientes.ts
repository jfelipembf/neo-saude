import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addPaciente, listPacientes, updatePaciente } from '@/services/pacientesService'
import type { EditPatient, NewPatient } from '@/services/pacientesService'

export function usePacientes() {
  return useQuery({ queryKey: queryKeys.pacientes.all, queryFn: listPacientes })
}

/** Cadastra um paciente (modal "Novo paciente") e atualiza a lista. */
export function useCriarPaciente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NewPatient) => addPaciente(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.all }),
  })
}

/** Salva a edição do cadastro (perfil do paciente); lista e detalhe atualizam juntos. */
export function useAtualizarPaciente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: EditPatient }) => updatePaciente(id, dados),
    // A key de detalhe é prefixada por ['pacientes'] — uma invalidação cobre as duas.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.all }),
  })
}
