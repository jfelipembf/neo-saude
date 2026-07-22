import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Button } from '@/components/Button/Button'
import { ProfessionalsTable } from '@/components/ProfessionalsTable/ProfessionalsTable'
import { buildRoute } from '@/constants'
import { IconProfessionals } from '@/components/icons'

export function ProfessionalsPage() {
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Profissionais"
        icon={<IconProfessionals />}
        actions={<Button>Novo profissional</Button>}
      />

      {/* A tabela cuida da própria busca, paginação e loading. */}
      <ProfessionalsTable
        onView={p => navigate(buildRoute.professionalProfile(p.id))}
      />
    </>
  )
}
