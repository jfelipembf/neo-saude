import { Modal } from '@/components/Modal/Modal'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { usePatientEntitlements } from '@/hooks/usePatientEntitlements'
import { isEntitlementActive } from '@/utils/entitlements'
import type { PatientServiceEntitlement } from '@/types/domain'
import styles from './EntitlementPickerModal.module.scss'

interface EntitlementPickerModalProps {
  open: boolean
  patientId: string
  onClose: () => void
  onPick: (entitlement: PatientServiceEntitlement) => void
}

/**
 * Escolha de qual pacote/plano ATIVO justifica uma matrícula em turma — usado
 * tanto pelo botão "Matricular" do perfil do paciente quanto pela busca de
 * "adicionar paciente" dentro do ClassAttendanceModal. Só entitlements ativas
 * aparecem (ver utils/entitlements.isEntitlementActive); vencidas/esgotadas
 * ficam de fora — não fazem sentido pra INICIAR uma matrícula nova (a
 * tolerância de 5 dias só vale pra manter uma matrícula JÁ existente).
 */
export function EntitlementPickerModal({ open, patientId, onClose, onPick }: EntitlementPickerModalProps) {
  const { data: entitlements = [] } = usePatientEntitlements(open ? patientId : '')
  const active = entitlements.filter(isEntitlementActive)

  return (
    <Modal open={open} onClose={onClose} title="Escolha o pacote ou plano" size="sm">
      {active.length === 0 ? (
        <EmptyState
          title="Nenhum pacote/plano ativo"
          description="O paciente precisa de um pacote de sessões ou plano ativo para ser matriculado numa turma."
        />
      ) : (
        <ul className={styles.list}>
          {active.map(e => (
            <li key={e.id}>
              <button type="button" className={styles.item} onClick={() => onPick(e)}>
                <span className={styles.itemName}>{e.serviceName}</span>
                <span className={styles.itemMeta}>
                  {/* Contrato (mensalidade) não tem saldo pra mostrar — o que
                      diz até quando ele vale é a validade, e ela já vem
                      formatada em dd/mm/aaaa do service. */}
                  {e.kind === 'recurring' ? 'Contrato' : `${e.remaining} de ${e.totalSessions} restantes`}
                  {e.expiresAt ? ` · válido até ${e.expiresAt}` : ' · sem validade'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
