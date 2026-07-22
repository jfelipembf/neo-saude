import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Button } from '@/components/Button/Button'
import { ProfessionalsTable } from '@/components/ProfessionalsTable/ProfessionalsTable'
import { buildRoute } from '@/constants'
import { IconPlus, IconProfessionals } from '@/components/icons'
import { ProfessionalFormModal } from './ProfessionalFormModal'

export function ProfessionalsPage() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <PageHeader
        title="Profissionais"
        icon={<IconProfessionals />}
        actions={
          <Button iconLeft={<IconPlus />} onClick={() => setCreating(true)}>
            Novo profissional
          </Button>
        }
      />

      {/* A tabela cuida da própria busca, paginação e loading. */}
      <ProfessionalsTable
        onView={p => navigate(buildRoute.professionalProfile(p.id))}
      />

      {/* Monta só quando aberto — o rascunho nasce vazio a cada cadastro. */}
      {creating && (
        <ProfessionalFormModal
          onClose={() => setCreating(false)}
          // Abre o perfil recém-criado: é lá que entram currículo e agenda.
          onCreated={id => navigate(buildRoute.professionalProfile(id))}
        />
      )}
    </>
  )
}
