import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addDocument, listPatientDocuments, removeDocument, updateDocument } from '@/services/documentsService'
import type { NewDocument } from '@/services/documentsService'

export function usePatientDocuments(patientId: string) {
  return useQuery({
    queryKey: queryKeys.documents.byPatient(patientId),
    queryFn: () => listPatientDocuments(patientId),
  })
}

/** Envia um documento (componente DocumentsUpload) e atualiza a lista. */
export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewDocument) => addDocument(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.documents.all }),
  })
}

/** Atualiza nome/descrição de um documento e refaz a lista. */
export function useUpdateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; description?: string } }) =>
      updateDocument(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.documents.all }),
  })
}

/** Exclui um documento (após o ConfirmDialog) e refaz a lista. */
export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeDocument(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.documents.all }),
  })
}
