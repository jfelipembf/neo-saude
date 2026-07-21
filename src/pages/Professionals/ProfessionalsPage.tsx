import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Button } from '@/components/Button/Button'
import { ProfessionalsTable } from '@/components/ProfessionalsTable/ProfessionalsTable'
import { useToast } from '@/components/Toast/useToast'
import { IconProfissionais } from '@/components/icons'

export function ProfessionalsPage() {
  const toast = useToast()

  return (
    <>
      <PageHeader
        title="Profissionais"
        icon={<IconProfissionais />}
        actions={<Button>Novo profissional</Button>}
      />

      {/* A tabela cuida da própria busca, paginação e loading. */}
      <ProfessionalsTable
        onView={() => toast.info('Perfil do profissional em breve.')}
      />
    </>
  )
}
