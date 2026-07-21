import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Button } from '@/components/Button/Button'
import { GradeBoard } from '@/components/GradeBoard/GradeBoard'
import { AppointmentModal } from '@/components/AppointmentModal/AppointmentModal'
import { IconAgenda, IconMais } from '@/components/icons'
import type { ScheduleSlot } from '@/types/domain'

export function AgendaPage() {
  // Modal de agendamento: null = fechado; { sessao } = edição; {} = novo.
  const [modal, setModal] = useState<{ sessao?: ScheduleSlot } | null>(null)

  return (
    <>
      <PageHeader
        title="Agenda"
        icon={<IconAgenda />}
        actions={
          <Button iconLeft={<IconMais />} onClick={() => setModal({})}>
            Nova consulta
          </Button>
        }
      />

      {/* Grade semanal de horários — clicar num card abre a edição. */}
      <GradeBoard onSelect={sessao => setModal({ sessao })} />

      <AppointmentModal
        open={modal !== null}
        onClose={() => setModal(null)}
        sessao={modal?.sessao ?? null}
      />
    </>
  )
}
