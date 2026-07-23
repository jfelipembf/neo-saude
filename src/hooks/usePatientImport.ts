import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { importPatients } from '@/services/patientImportService'
import type { PatientImportRow } from '@/services/patientImportService'

/** Importa os pacientes válidos da planilha e recarrega a lista de pacientes. */
export function useImportPatients() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rows: PatientImportRow[]) => importPatients(rows),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
  })
}
