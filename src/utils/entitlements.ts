import { parseBrDate } from '@/utils/date'
import type { PatientServiceEntitlement } from '@/types/domain'

/** Mesma derivação de "ativo" documentada na tabela patient_service_entitlement,
 *  e o que limita muda com o tipo (mesma escada do trigger tg_debit_entitlement):
 *    · package   — saldo > 0 E dentro da validade. Zerou, acabou.
 *    · recurring — SÓ a validade. A mensalidade não tem saldo (remaining é null):
 *                  o teto dela é o weekly_limit aplicado na matrícula em turma,
 *                  então checar saldo aqui mataria todo contrato em dia.
 *  Usado pra decidir se um pacote/contrato pode justificar uma NOVA matrícula em
 *  turma (ver Matricular no perfil do paciente e o "adicionar paciente" do
 *  ClassAttendanceModal) e uma consulta nova (AppointmentModal). */
export function isEntitlementActive(e: PatientServiceEntitlement): boolean {
  if (e.kind === 'package' && (e.remaining ?? 0) <= 0) return false
  if (!e.expiresAt) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return parseBrDate(e.expiresAt) >= today
}
