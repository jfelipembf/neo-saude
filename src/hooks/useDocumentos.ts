import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addDocumento, listDocumentosDoPaciente, removeDocumento, updateDocumento } from '@/services/documentosService'
import type { NewDocument } from '@/services/documentosService'

export function useDocumentosDoPaciente(pacienteId: string) {
  return useQuery({
    queryKey: queryKeys.documentos.byPaciente(pacienteId),
    queryFn: () => listDocumentosDoPaciente(pacienteId),
  })
}

/** Envia um documento (componente DocumentsUpload) e atualiza a lista. */
export function useEnviarDocumento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NewDocument) => addDocumento(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.documentos.all }),
  })
}

/** Atualiza nome/descrição de um documento e refaz a lista. */
export function useAtualizarDocumento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: { nome: string; descricao?: string } }) =>
      updateDocumento(id, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.documentos.all }),
  })
}

/** Exclui um documento (após o ConfirmDialog) e refaz a lista. */
export function useExcluirDocumento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeDocumento(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.documentos.all }),
  })
}
