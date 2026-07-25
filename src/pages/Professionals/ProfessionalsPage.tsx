import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Button } from '@/components/Button/Button'
import { ProfessionalsTable } from '@/components/ProfessionalsTable/ProfessionalsTable'
import { buildRoute } from '@/constants'
import { IconPlus, IconProfessionals } from '@/components/icons'
import { ProfessionalFormModal } from './ProfessionalFormModal'

export function ProfessionalsPage() {
  const navigate = useNavigate()
  // Deep-link ?new=1 (ex.: atalho "Início rápido" do Dashboard) — abre o
  // modal de cadastro já na entrada, sem precisar do clique em "Novo profissional".
  const [searchParams] = useSearchParams()
  const [creating, setCreating] = useState(() => searchParams.get('new') === '1')

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
