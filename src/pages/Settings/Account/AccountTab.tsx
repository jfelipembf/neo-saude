import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { useToast } from '@/components/Toast/useToast'
import { useCurrentUser } from '@/hooks/useUser'
import { useClinic, useSaveClinic, useTechnicalManager } from '@/hooks/useClinic'
import { IconEdit, IconUser } from '@/components/icons'
import { CLINIC_SPECIALTY_LABEL, SEX_LABEL } from '@/constants'
import { ResponsibleFormModal } from './ResponsibleForm'
import styles from './AccountTab.module.scss'

/** Aba "Conta": dados do usuário logado, logo da clínica e responsável técnico.
 *  O tema e o sair ficam no Header — aqui não se repetem. */
export function AccountTab() {
  const toast = useToast()
  const { data: user, isLoading: loadingUser } = useCurrentUser()
  const { data: clinic, isLoading: loadingClinic } = useClinic()
  const { data: manager, isLoading: loadingManager } = useTechnicalManager()
  const { mutate: saveClinic } = useSaveClinic()

  const [editingManager, setEditingManager] = useState(false)

  if (loadingUser || loadingClinic || loadingManager) return <PageLoader />

  if (!user) {
    return (
      <EmptyState
        title="Conta não encontrada"
        description="Não foi possível carregar os dados do usuário logado."
      />
    )
  }

  const rows: { label: string; amount?: string }[] = [
    { label: 'Nome',          amount: user.name },
    { label: 'Código',        amount: user.code },
    { label: 'Especialidade', amount: user.specialty },
    { label: 'Registro',      amount: user.license },
    { label: 'E-mail',        amount: user.email },
    { label: 'Telefone',      amount: user.phone },
    { label: 'Membro desde',  amount: user.memberSince },
  ]

  /** Troca só a logo, preservando o resto do cadastro da clínica. */
  function changeLogo(url: string | undefined) {
    if (!clinic) return
    saveClinic({ ...clinic, photo: url }, {
      onSuccess: () => toast.success(url ? 'Logo atualizada!' : 'Logo removida.'),
    })
  }

  const managerName = manager
    ? `${manager.firstName} ${manager.lastName}`.trim()
    : ''

  const managerSub = manager
    ? [
        manager.sex ? SEX_LABEL[manager.sex] : '',
        manager.birthDate ? `nasc. ${manager.birthDate}` : '',
      ].filter(Boolean).join(' · ')
    : ''

  return (
    <div className={styles.coluna}>
      <FormSection
        title="Dados da conta"
        description="Para alterar o cadastro profissional, use o seu perfil em Profissionais."
      >
        <dl className={styles.pares}>
          {rows.map(row => (
            <div key={row.label} className={styles.par}>
              <dt>{row.label}</dt>
              <dd>{row.amount || '—'}</dd>
            </div>
          ))}
        </dl>
      </FormSection>

      <FormSection
        title="Logo da clínica"
        description="Aparece no topo de todos os documentos impressos (recibos, orçamentos, receituários)."
      >
        <PhotoInput label="Logo" value={clinic?.photo} onChange={changeLogo} />
      </FormSection>

      <FormSection
        title="Ramo de atuação"
        description="Define as telas específicas do prontuário do paciente. Contratado no seu plano — para alterar, fale com o suporte."
      >
        <dl className={styles.pares}>
          <div className={styles.par}>
            <dt>Especialidade</dt>
            <dd>{clinic ? CLINIC_SPECIALTY_LABEL[clinic.specialty] : '—'}</dd>
          </div>
        </dl>
      </FormSection>

      <FormSection
        title="Responsável técnico"
        description="Profissional responsável pela clínica perante o conselho."
        actions={
          manager && (
            <Button
              variant="outline"
              size="sm"
              iconLeft={<IconEdit />}
              onClick={() => setEditingManager(true)}
            >
              Editar
            </Button>
          )
        }
      >
        {manager ? (
          <div className={styles.responsavel}>
            <span className={styles.foto}>
              {manager.photo
                ? <img src={manager.photo} alt="" className={styles.fotoImg} />
                : <IconUser />}
            </span>

            <div className={styles.responsavelInfo}>
              <span className={styles.responsavelNome}>{managerName}</span>
              {managerSub && <span className={styles.responsavelSub}>{managerSub}</span>}
              <span className={styles.responsavelSub}>{manager.phone} · {manager.email}</span>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Responsável não cadastrado"
            description="Cadastre o profissional responsável pela clínica."
          />
        )}
      </FormSection>

      {/* Monta só quando aberto — o formulário nasce do cadastro salvo. */}
      {editingManager && manager && (
        <ResponsibleFormModal
          manager={manager}
          onClose={() => setEditingManager(false)}
        />
      )}
    </div>
  )
}
