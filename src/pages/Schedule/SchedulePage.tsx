import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { ScheduleBoard } from '@/components/ScheduleBoard/ScheduleBoard'
import { AppointmentModal } from '@/components/AppointmentModal/AppointmentModal'
import { Button } from '@/components/Button/Button'
import { WaitingListDrawer } from '@/components/WaitingList/WaitingListDrawer'
import { useWaitingList } from '@/hooks/useWaitingList'
import { usePatientName } from '@/hooks/useDisplayNames'
import { IconClock, IconSchedule } from '@/components/icons'
import type { ScheduledAppointment } from '@/types/domain'

interface ModalState {
  slot?: ScheduledAppointment
  /** Pré-preenchimento vindo do "+" da grade (profissional/dia/hora já
   *  escolhidos) — só faz sentido numa consulta NOVA (sem `slot`). */
  initial?: { professionalId?: string; dateIso?: string; time?: string }
}

// Sem botão "Nova consulta": o agendamento nasce SÓ do "+" na grade (célula
// vazia dentro da disponibilidade do profissional) — decisão do dono para
// impedir marcar fora do horário dele por um caminho que não passa pela grade.
export function SchedulePage() {
  // Modal de agendamento: null = fechado; { slot } = edição; { initial } =
  // novo, pré-preenchido pelo "+" da grade.
  const [modal, setModal] = useState<ModalState | null>(null)

  // Lista de espera: painel lateral, não rota — a fila só serve ao lado da
  // grade (alguém desmarca, procura-se quem chamar, volta-se para o horário).
  const [filaAberta, setFilaAberta] = useState(false)
  const { data: fila } = useWaitingList()

  // Modo "Matricular": chega aqui pelo botão do perfil do paciente
  // (?enroll=<patientId>&entitlement=<entitlementId>) — ScheduleBoard troca
  // o clique numa turma por matricular esse paciente ali, direto.
  const [searchParams, setSearchParams] = useSearchParams()
  const patientName = usePatientName()
  const enrollPatientId = searchParams.get('enroll')
  const enrollEntitlementId = searchParams.get('entitlement')
  const enrollTarget = enrollPatientId && enrollEntitlementId
    ? { patientId: enrollPatientId, entitlementId: enrollEntitlementId, patientName: patientName(enrollPatientId) }
    : undefined

  function exitEnrollMode() {
    setSearchParams(params => {
      params.delete('enroll')
      params.delete('entitlement')
      return params
    }, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        icon={<IconSchedule />}
        actions={
          <Button variant="outline" iconLeft={<IconClock />} onClick={() => setFilaAberta(true)}>
            {/* A CONTAGEM no próprio botão: uma fila que ninguém vê é uma fila
                que ninguém percorre, e o número é o que faz a recepção abrir. */}
            Lista de espera{fila?.length ? ` (${fila.length})` : ''}
          </Button>
        }
      />

      {/* Grade semanal de horários — clicar num card abre a edição; o "+" de
          uma célula disponível abre uma consulta nova já pré-preenchida. */}
      <ScheduleBoard
        onSelect={slot => setModal({ slot })}
        onQuickAdd={(professionalId, dateIso, time) => setModal({ initial: { professionalId, dateIso, time } })}
        enrollTarget={enrollTarget}
        onEnrollDone={exitEnrollMode}
      />

      <WaitingListDrawer open={filaAberta} onClose={() => setFilaAberta(false)} />

      <AppointmentModal
        open={modal !== null}
        onClose={() => setModal(null)}
        slot={modal?.slot ?? null}
        initial={modal?.initial}
      />
    </>
  )
}
