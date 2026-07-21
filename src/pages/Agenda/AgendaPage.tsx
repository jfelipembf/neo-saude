import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Button } from '@/components/Button/Button'
import { GradeBoard } from '@/components/GradeBoard/GradeBoard'
import { IconAgenda } from '@/components/icons'

export function AgendaPage() {
  return (
    <>
      <PageHeader
        title="Agenda"
        icon={<IconAgenda />}
        actions={<Button>Nova consulta</Button>}
      />

      {/* Grade semanal de horários (o GradeBoard cuida do próprio loading). */}
      <GradeBoard />
    </>
  )
}
