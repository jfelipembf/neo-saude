import type { ReactNode } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { StatsCard } from '@/components/StatsCard/StatsCard'
import { IconToday, IconSchedule, IconCheck, IconUser, IconX } from '@/components/icons'
import { useScheduleAppointments } from '@/hooks/useSchedule'
import { useCurrentProfessionalId } from '@/hooks/useProfessionals'
import { toIsoDate } from '@/utils/date'
import type { AppointmentStatus } from '@/types/domain'
import { TodayAppointmentsList } from './TodayAppointmentsList'
import styles from './TodayPage.module.scss'

// Mapeamento direto de status → quadrado: agendado/confirmado/presente
// (compareceu)/ausente (faltou). 'in_service' (em atendimento) e 'canceled'
// não entram em nenhum dos 4 — não fazem parte do que foi pedido. Ícone e
// valor dos 4 na mesma cor (verde, tom do card Presentes) — uniforme de
// propósito, não é mais um código de cor por status.
const TILES: { status: AppointmentStatus; label: string; icon: ReactNode }[] = [
  { status: 'scheduled', label: 'Agendados', icon: <IconSchedule /> },
  { status: 'confirmed', label: 'Confirmados', icon: <IconCheck /> },
  { status: 'completed', label: 'Presentes', icon: <IconUser /> },
  { status: 'no_show', label: 'Ausentes', icon: <IconX /> },
]

/** "Hoje": 4 quadrados com a contagem de consultas do dia por status — pensada
 *  pra colaboradores sem acesso ao Dashboard (ex.: recepção), que precisam de
 *  uma visão rápida do movimento do dia sem os indicadores gerenciais. */
export function TodayPage() {
  const todayIso = toIsoDate(new Date())
  const { data: appointments, isLoading } = useScheduleAppointments(todayIso, todayIso)
  // null = login sem vínculo de profissional (recepção, dono sem cadastro
  // clínico) — ver getCurrentProfessionalId. A lista pessoal abaixo dos
  // quadrados só faz sentido para quem TEM uma agenda própria.
  const { data: currentProfessionalId, isLoading: loadingProfessional } = useCurrentProfessionalId()

  if (isLoading || loadingProfessional) return <PageLoader />

  const counts = (appointments ?? []).reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {} as Partial<Record<AppointmentStatus, number>>)

  const myAppointments = currentProfessionalId
    ? (appointments ?? []).filter(a => a.professionalId === currentProfessionalId)
    : []

  return (
    <>
      <PageHeader title="Hoje" icon={<IconToday />} />
      <div className={styles.grid}>
        {TILES.map(tile => (
          <StatsCard
            key={tile.status}
            label={tile.label}
            value={counts[tile.status] ?? 0}
            icon={tile.icon}
            iconTone="success"
            valueTone="success"
            size="lg"
          />
        ))}
      </div>

      {currentProfessionalId && <TodayAppointmentsList appointments={myAppointments} />}
    </>
  )
}
