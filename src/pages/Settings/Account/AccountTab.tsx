import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { useClinic, useSaveClinic } from '@/hooks/useClinic'
import { IconEdit } from '@/components/icons'
import { ClinicFormModal } from './ClinicForm'
import styles from './AccountTab.module.scss'

// UI only por enquanto — sem persistência (nem service, nem coluna no banco).
const PRACTICE_AREAS = [
  { key: 'medicine',       label: 'Medicina' },
  { key: 'physiotherapy',  label: 'Fisioterapia' },
  { key: 'dentistry',      label: 'Odontologia' },
  { key: 'psychology',     label: 'Psicologia' },
  { key: 'nutrition',      label: 'Nutrição' },
]

/** Aba "Conta": cadastro e logo da clínica (o que vai no cabeçalho dos
 *  documentos impressos). Tema e sair ficam no Header; o cadastro profissional
 *  fica no perfil em Profissionais. */
export function AccountTab() {
  const toast = useToast()
  const { data: clinic, isLoading } = useClinic()
  const { mutate: saveClinic } = useSaveClinic()

  const [editingClinic, setEditingClinic] = useState(false)
  const [practiceAreas, setPracticeAreas] = useState<Set<string>>(new Set())

  function togglePracticeArea(key: string, enabled: boolean) {
    setPracticeAreas(current => {
      const next = new Set(current)
      if (enabled) next.add(key)
      else next.delete(key)
      return next
    })
  }

  if (isLoading) return <PageLoader />

  // Endereço numa linha só: é assim que sai no cabeçalho do documento impresso,
  // e ver aqui do mesmo jeito facilita conferir antes de imprimir.
  const clinicAddress = clinic
    ? [
        [clinic.street, clinic.number].filter(Boolean).join(', '),
        clinic.neighborhood,
        [clinic.city, clinic.state].filter(Boolean).join('/'),
        clinic.cep,
      ].filter(Boolean).join(' · ')
    : ''

  const clinicRows: { label: string; amount?: string }[] = clinic
    ? [
        { label: 'Nome',     amount: clinic.name },
        { label: 'CNPJ',     amount: clinic.cnpj },
        { label: 'E-mail',   amount: clinic.email },
        { label: 'Telefone', amount: clinic.phone },
        { label: 'Endereço', amount: clinicAddress },
      ]
    : []

  /** Troca só a logo, preservando o resto do cadastro da clínica. */
  function changeLogo(url: string | undefined) {
    if (!clinic) return
    saveClinic({ ...clinic, photo: url }, {
      onSuccess: () => toast.success(url ? 'Logo atualizada!' : 'Logo removida.'),
    })
  }

  return (
    <div className={styles.coluna}>
      <FormSection
        title="Dados da clínica"
        description="Identificação e endereço que vão no cabeçalho dos documentos impressos."
        actions={
          clinic && (
            <Button
              variant="outline"
              size="sm"
              iconLeft={<IconEdit />}
              onClick={() => setEditingClinic(true)}
            >
              Editar
            </Button>
          )
        }
      >
        {clinic ? (
          <dl className={styles.pares}>
            {clinicRows.map(row => (
              <div key={row.label} className={styles.par}>
                <dt>{row.label}</dt>
                <dd>{row.amount || '—'}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState
            title="Clínica não encontrada"
            description="Seu usuário não está vinculado a nenhuma clínica."
          />
        )}
      </FormSection>

      <FormSection
        title="Logo da clínica"
        description="Aparece no topo de todos os documentos impressos (recibos, orçamentos, receituários)."
      >
        <PhotoInput label="Logo" value={clinic?.photo} onChange={changeLogo} folder="clinic" />
      </FormSection>

      <FormSection
        title="Ramos de atuação"
        description="Marque as áreas que a clínica atende."
      >
        <div className={styles.ramos}>
          {PRACTICE_AREAS.map(area => (
            <div key={area.key} className={styles.ramo}>
              <Toggle
                label={area.label}
                checked={practiceAreas.has(area.key)}
                onChange={enabled => togglePracticeArea(area.key, enabled)}
              />
            </div>
          ))}
        </div>
      </FormSection>

      {/* Monta só quando aberto — o formulário nasce do cadastro salvo. */}
      {editingClinic && clinic && (
        <ClinicFormModal
          clinic={clinic}
          onClose={() => setEditingClinic(false)}
        />
      )}
    </div>
  )
}
