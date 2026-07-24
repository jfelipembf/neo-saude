import { parseBrDate } from '@/utils/date'
import type { PatientServiceEntitlement } from '@/types/domain'

/** Mesma derivação de "ativo" documentada na tabela patient_service_entitlement:
 *  saldo > 0 e (sem validade ou ainda dentro dela). Usado pra decidir se um
 *  pacote/plano pode justificar uma NOVA matrícula em turma (ver Matricular
 *  no perfil do paciente e o "adicionar paciente" do ClassAttendanceModal). */
export function isEntitlementActive(e: PatientServiceEntitlement): boolean {
  if (e.remaining <= 0) return false
  if (!e.expiresAt) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return parseBrDate(e.expiresAt) >= today
}
