import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { ScheduleBoard } from '@/components/ScheduleBoard/ScheduleBoard'
import { AppointmentModal } from '@/components/AppointmentModal/AppointmentModal'
import { IconSchedule } from '@/components/icons'
import type { AgendaAppointment } from '@/types/domain'

interface ModalState {
  slot?: AgendaAppointment
  /** Pré-preenchimento vindo do "+" da grade (profissional/dia/hora já
   *  escolhidos) — só faz sentido numa consulta NOVA (sem `slot`). */
  initial?: { professionalId?: string; dateIso?: string; time?: string }
}

// Sem botão "Nova consulta": o agendamento nasce SÓ do "+" na grade (célula
// vazia dentro da disponibilidade do profissional) — decisão do dono para
// impedir marcar fora do horário dele por um caminho que não passa pela grade.
export function AgendaPage() {
  // Modal de agendamento: null = fechado; { slot } = edição; { initial } =
  // novo, pré-preenchido pelo "+" da grade.
  const [modal, setModal] = useState<ModalState | null>(null)

  return (
    <>
      <PageHeader title="Agenda" icon={<IconSchedule />} />

      {/* Grade semanal de horários — clicar num card abre a edição; o "+" de
          uma célula disponível abre uma consulta nova já pré-preenchida. */}
      <ScheduleBoard
        onSelect={slot => setModal({ slot })}
        onQuickAdd={(professionalId, dateIso, time) => setModal({ initial: { professionalId, dateIso, time } })}
      />

      <AppointmentModal
        open={modal !== null}
        onClose={() => setModal(null)}
        slot={modal?.slot ?? null}
        initial={modal?.initial}
      />
    </>
  )
}
