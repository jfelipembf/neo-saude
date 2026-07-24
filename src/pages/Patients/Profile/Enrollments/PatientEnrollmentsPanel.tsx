import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useToast } from '@/components/Toast/useToast'
import { IconSchedule, IconTrash } from '@/components/icons'
import { usePatientClassGroupEnrollments, useUnenrollPatientGlobal } from '@/hooks/useClassGroupRoster'
import { DAY_OF_WEEK_SHORT } from '@/constants/dates'
import type { PatientClassGroupEnrollment } from '@/services/classGroupRosterService'
import styles from './PatientEnrollmentsPanel.module.scss'

interface PatientEnrollmentsPanelProps {
  patientId: string
}

/** Aba "Matrículas" do perfil do paciente (fisioterapia): turmas coletivas em
 *  que ele está matriculado hoje, com o pacote/plano que justifica cada uma —
 *  único lugar do sistema onde a matrícula pode ser removida (ver
 *  classGroupRosterService.ts para a lógica de cobertura/tolerância). */
export function PatientEnrollmentsPanel({ patientId }: PatientEnrollmentsPanelProps) {
  const toast = useToast()
  const { data: enrollments, isLoading } = usePatientClassGroupEnrollments(patientId)
  const { mutate: unenroll, isPending: removing } = useUnenrollPatientGlobal()
  const [toRemove, setToRemove] = useState<PatientClassGroupEnrollment | null>(null)

  function confirmRemove() {
    if (!toRemove) return
    unenroll(
      { enrollmentId: toRemove.enrollmentId, patientId },
      {
        onSuccess: () => toast.success('Matrícula removida.'),
        onError: () => toast.error('Não foi possível remover a matrícula.'),
      },
    )
  }

  if (isLoading) return <PageLoader />

  const list = enrollments ?? []

  return (
    <div className={styles.painel}>
      {list.length === 0 ? (
        <EmptyState
          title="Nenhuma matrícula"
          description="Matricule o paciente numa turma pelo botão 'Matricular' no topo do perfil."
        />
      ) : (
        <ul className={styles.lista}>
          {list.map(e => (
            <li key={e.enrollmentId} className={styles.turma}>
              <span className={styles.turmaIcone}><IconSchedule /></span>

              <div className={styles.turmaInfo}>
                <span className={styles.turmaNome}>{e.classGroupName}</span>
                <span className={styles.turmaMeta}>
                  {DAY_OF_WEEK_SHORT[e.weekday]} · {e.startTime}
                  {e.entitlementServiceName ? ` · ${e.entitlementServiceName}` : ''}
                </span>
              </div>

              <Button
                variant="ghost" size="sm" iconLeft={<IconTrash />}
                className={styles.removerBtn}
                title="Remover matrícula" aria-label={`Remover matrícula de ${e.classGroupName}`}
                onClick={() => setToRemove(e)}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toRemove !== null}
        onClose={() => setToRemove(null)}
        onConfirm={confirmRemove}
        variant="danger"
        title="Remover matrícula"
        message={toRemove ? `Remover o paciente da turma "${toRemove.classGroupName}"? O histórico de presença já registrado não é apagado.` : ''}
        confirmLabel="Remover"
        confirmDisabled={removing}
      />
    </div>
  )
}
