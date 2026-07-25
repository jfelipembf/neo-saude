import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { useToast } from '@/components/Toast/Toast'
import { useClinic, useSaveClinic } from '@/hooks/useClinic'
import { IconEdit } from '@/components/icons'
import { ClinicFormModal } from './ClinicFormModal'
import styles from './AccountTab.module.scss'

/** Aba "Conta": cadastro e logo da clínica (o que vai no cabeçalho dos
 *  documentos impressos). Tema e sair ficam no Header; o cadastro profissional
 *  fica no perfil em Profissionais. */
export function AccountTab() {
  const toast = useToast()
  const { data: clinic, isLoading } = useClinic()
  const { mutate: saveClinic, isPending: savingLogo } = useSaveClinic()

  const [editingClinic, setEditingClinic] = useState(false)
  // Logo só é editável depois de clicar "Editar" — o upload fica num rascunho
  // (pendingLogo) até "Salvar" confirmar, em vez de trocar a logo da clínica
  // no instante em que um arquivo é escolhido.
  const [editingLogo, setEditingLogo] = useState(false)
  const [pendingLogo, setPendingLogo] = useState<string | undefined>(undefined)

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

  function startEditLogo() {
    setPendingLogo(clinic?.photo)
    setEditingLogo(true)
  }

  function cancelEditLogo() {
    setEditingLogo(false)
    setPendingLogo(undefined)
  }

  /** Confirma o rascunho: só agora a logo troca de fato na clínica. */
  function saveLogo() {
    if (!clinic) return
    saveClinic({ ...clinic, photo: pendingLogo }, {
      onSuccess: () => {
        toast.success(pendingLogo ? 'Logo atualizada!' : 'Logo removida.')
        setEditingLogo(false)
      },
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
        actions={
          clinic && (
            editingLogo ? (
              <div className={styles.acoesLogo}>
                <Button variant="ghost" size="sm" onClick={cancelEditLogo} disabled={savingLogo}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={saveLogo} loading={savingLogo}>
                  Salvar
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" iconLeft={<IconEdit />} onClick={startEditLogo}>
                Editar
              </Button>
            )
          )
        }
      >
        {editingLogo ? (
          <PhotoInput label="Logo" value={pendingLogo} onChange={setPendingLogo} folder="clinic" size="lg" />
        ) : clinic?.photo ? (
          <div className={styles.logoPreview}>
            <img src={clinic.photo} alt="Logo da clínica" className={styles.logoPreviewImg} />
          </div>
        ) : (
          <div className={`${styles.logoPreview} ${styles.logoPreviewEmpty}`}>Nenhuma logo cadastrada.</div>
        )}
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
