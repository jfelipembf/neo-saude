import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { useToast } from '@/components/Toast/useToast'
import { useUsuarioLogado } from '@/hooks/useUsuario'
import { useConsultorio, useSalvarConsultorio, useResponsavel } from '@/hooks/useConsultorio'
import { IconEditar, IconUsuario } from '@/components/icons'
import { SEXO_LABEL } from '@/constants'
import { ResponsibleFormModal } from './ResponsibleForm'
import styles from './AccountTab.module.scss'

/** Aba "Conta": dados do usuário logado, logo da clínica e responsável técnico.
 *  O tema e o sair ficam no Header — aqui não se repetem. */
export function AccountTab() {
  const toast = useToast()
  const { data: usuario, isLoading: carregandoUsuario } = useUsuarioLogado()
  const { data: clinica, isLoading: carregandoClinica } = useConsultorio()
  const { data: responsavel, isLoading: carregandoResponsavel } = useResponsavel()
  const { mutate: salvarClinica } = useSalvarConsultorio()

  const [editandoResponsavel, setEditandoResponsavel] = useState(false)

  if (carregandoUsuario || carregandoClinica || carregandoResponsavel) return <PageLoader />

  if (!usuario) {
    return (
      <EmptyState
        title="Conta não encontrada"
        description="Não foi possível carregar os dados do usuário logado."
      />
    )
  }

  const dados: { label: string; valor?: string }[] = [
    { label: 'Nome',          valor: usuario.nome },
    { label: 'Código',        valor: usuario.id },
    { label: 'Especialidade', valor: usuario.especialidade },
    { label: 'Registro',      valor: usuario.registro },
    { label: 'E-mail',        valor: usuario.email },
    { label: 'Telefone',      valor: usuario.telefone },
    { label: 'Membro desde',  valor: usuario.membroDesde },
  ]

  /** Troca só a logo, preservando o resto do cadastro da clínica. */
  function trocarLogo(url: string | undefined) {
    if (!clinica) return
    salvarClinica({ ...clinica, logo: url }, {
      onSuccess: () => toast.success(url ? 'Logo atualizada!' : 'Logo removida.'),
    })
  }

  const nomeResponsavel = responsavel
    ? `${responsavel.nome} ${responsavel.sobrenome}`.trim()
    : ''

  const subResponsavel = responsavel
    ? [
        responsavel.sexo ? SEXO_LABEL[responsavel.sexo] : '',
        responsavel.nascimento ? `nasc. ${responsavel.nascimento}` : '',
      ].filter(Boolean).join(' · ')
    : ''

  return (
    <div className={styles.coluna}>
      <FormSection
        title="Dados da conta"
        description="Para alterar o cadastro profissional, use o seu perfil em Profissionais."
      >
        <dl className={styles.pares}>
          {dados.map(d => (
            <div key={d.label} className={styles.par}>
              <dt>{d.label}</dt>
              <dd>{d.valor || '—'}</dd>
            </div>
          ))}
        </dl>
      </FormSection>

      <FormSection
        title="Logo da clínica"
        description="Aparece no topo de todos os documentos impressos (recibos, orçamentos, receituários)."
      >
        <PhotoInput label="Logo" value={clinica?.logo} onChange={trocarLogo} />
      </FormSection>

      <FormSection
        title="Responsável técnico"
        description="Profissional responsável pela clínica perante o conselho."
        actions={
          responsavel && (
            <Button
              variant="outline"
              size="sm"
              iconLeft={<IconEditar />}
              onClick={() => setEditandoResponsavel(true)}
            >
              Editar
            </Button>
          )
        }
      >
        {responsavel ? (
          <div className={styles.responsavel}>
            <span className={styles.foto}>
              {responsavel.foto
                ? <img src={responsavel.foto} alt="" className={styles.fotoImg} />
                : <IconUsuario />}
            </span>

            <div className={styles.responsavelInfo}>
              <span className={styles.responsavelNome}>{nomeResponsavel}</span>
              {subResponsavel && <span className={styles.responsavelSub}>{subResponsavel}</span>}
              <span className={styles.responsavelSub}>{responsavel.telefone} · {responsavel.email}</span>
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
      {editandoResponsavel && responsavel && (
        <ResponsibleFormModal
          responsavel={responsavel}
          onClose={() => setEditandoResponsavel(false)}
        />
      )}
    </div>
  )
}
