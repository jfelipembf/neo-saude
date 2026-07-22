import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getAnamneseDoPaciente, salvarAnamnese } from '@/services/anamnesesService'
import type { EditAnamnesis } from '@/services/anamnesesService'

export function useAnamneseDoPaciente(pacienteId: string) {
  return useQuery({
    queryKey: queryKeys.anamneses.byPaciente(pacienteId),
    queryFn: () => getAnamneseDoPaciente(pacienteId),
  })
}

/** Salva a ficha (cria ou atualiza) e recarrega a do paciente. */
export function useSalvarAnamnese(pacienteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: EditAnamnesis) => salvarAnamnese(pacienteId, dados),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: queryKeys.anamneses.byPaciente(pacienteId),
    }),
  })
}
