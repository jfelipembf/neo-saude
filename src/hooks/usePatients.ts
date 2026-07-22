import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addPatient, listPatients, updatePatient } from '@/services/patientsService'
import type { EditPatient, NewPatient } from '@/services/patientsService'

export function usePatients() {
  return useQuery({ queryKey: queryKeys.patients.all, queryFn: listPatients })
}

/** Cadastra um paciente (modal "Novo paciente") e atualiza a lista. */
export function useCreatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewPatient) => addPatient(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
  })
}

/** Salva a edição do cadastro (perfil do paciente); lista e detalhe atualizam juntos. */
export function useUpdatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditPatient }) => updatePatient(id, payload),
    // A key de detalhe é prefixada por ['patients'] — uma invalidação cobre as duas.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
  })
}
