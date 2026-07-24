import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listPatientEntitlements } from '@/services/patientEntitlementsService'

export function usePatientEntitlements(patientId: string) {
  return useQuery({
    queryKey: queryKeys.entitlements.byPatient(patientId),
    queryFn: () => listPatientEntitlements(patientId),
    enabled: Boolean(patientId),
  })
}
