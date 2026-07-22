import { useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { Button } from '@/components/Button/Button'
import { useToast } from '@/components/Toast/useToast'
import { useUpdateProfessional } from '@/hooks/useProfessionals'
import { uploadImage } from '@/lib/storage'
import { COLOR_PALETTE } from '@/constants'
import { IconEdit, IconStar, IconPhone, IconMessage, IconEmail, IconCamera } from '@/components/icons'
import { initials } from '@/utils/text'
import type { Professional } from '@/types/domain'
import shared from './shared/profile.module.scss'
import styles from './ProfileSummary.module.scss'

interface ProfileSummaryProps {
  professional: Professional
  onEdit: () => void
  /** Em edição: mostra o botão de câmera no canto do avatar para trocar a foto. */
  editing?: boolean
  /** Foto escolhida ainda não salva (preview no avatar até clicar em Salvar). */
  pendingPhoto?: string | null
  /** Avisa o pai que uma nova foto foi escolhida (sobe pro Storage aqui). */
  onPhotoChange?: (url: string) => void
}

/** Card-resumo da lateral esquerda: identidade, contato, dados profissionais,
 *  especializações e "sobre" — visível em todas as abas. */
export function ProfileSummary({ professional, onEdit, editing = false, pendingPhoto, onPhotoChange }: ProfileSummaryProps) {
  const toast = useToast()
  const { mutate: atualizar } = useUpdateProfessional()
  const [uploadingFoto, setUploadingFoto] = useState(false)

  const cor = professional.color ?? COLOR_PALETTE[0]

  function escolherCor(color: string) {
    if (color === professional.color) return
    atualizar(
      { id: professional.id, payload: { color } },
      { onSuccess: () => toast.success('Cor atualizada!') },
    )
  }

  /** Foto escolhida: sobe pro Storage (para o preview) mas só PERSISTE no
   *  cadastro quando o formulário for salvo — avisa o pai com a URL. */
  async function escolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''   // permite reescolher o mesmo arquivo
    if (!file) return

    setUploadingFoto(true)
    try {
      const url = await uploadImage(file, 'professionals')
      onPhotoChange?.(url)
    } catch {
      toast.error('Não foi possível enviar a foto.')
    } finally {
      setUploadingFoto(false)
    }
  }

  // No avatar: a foto pendente (recém-escolhida) tem prioridade sobre a salva.
  const fotoExibida = pendingPhoto ?? professional.photo
  const contacts = [
    { label: 'Telefone', value: professional.phone, icon: <IconPhone /> },
    { label: 'WhatsApp', value: professional.whatsapp, icon: <IconMessage /> },
    { label: 'E-mail',   value: professional.email,    icon: <IconEmail /> },
  ]

  const pairs: { label: string; amount?: string }[] = [
    { label: 'Especialidade', amount: professional.specialty },
    { label: 'Registro',      amount: professional.license },
    { label: 'Nota média',    amount: professional.rating?.toLocaleString('pt-BR') },
    { label: 'Situação',      amount: professional.status === 'active' ? 'Ativo' : 'Inativo' },
  ]

  return (
    <section className={styles.resumo} aria-label="Resumo do profissional">
      <Button
        variant="ghost"
        size="sm"
        iconLeft={<IconEdit />}
        className={styles.editBtn}
        onClick={onEdit}
        title="Editar cadastro"
        aria-label="Editar cadastro do profissional"
      />

      <div className={styles.identidade}>
        <div className={styles.avatarWrap}>
          <span
            className={styles.avatar}
            style={{ '--avatar-ring': cor } as CSSProperties}
          >
            {fotoExibida ? (
              <img src={fotoExibida} alt={professional.name} className={styles.avatarImg} />
            ) : (
              initials(professional.name)
            )}
          </span>

          {/* Só em edição: círculo de câmera no canto para trocar a foto. */}
          {editing && (
            <label className={`${styles.fotoBtn} ${uploadingFoto ? styles.fotoBtnLoading : ''}`} title="Trocar foto">
              <IconCamera />
              <input
                type="file"
                accept="image/*"
                className={styles.fotoInput}
                onChange={escolherFoto}
                disabled={uploadingFoto}
              />
            </label>
          )}
        </div>
        <h2 className={styles.nome}>{professional.name}</h2>
        <p className={styles.subtitulo}>
          {[professional.specialty, professional.license].filter(Boolean).join(' · ')}
        </p>
        {professional.rating != null && (
          <span className={styles.nota}>
            <IconStar />
            {professional.rating.toLocaleString('pt-BR')}
          </span>
        )}
      </div>

      <div className={styles.bloco}>
        <h3 className={styles.blocoTitulo}>Cor na agenda</h3>
        <div className={styles.corLinha}>
          {/* Círculo único: clicar abre o color picker nativo. */}
          <label className={styles.corPicker} style={{ background: cor }} title="Escolher cor">
            <input
              type="color"
              value={cor}
              onChange={e => escolherCor(e.target.value)}
              aria-label="Escolher cor na agenda"
              className={styles.corInput}
            />
          </label>
        </div>
      </div>

      <div className={styles.bloco}>
        <h3 className={styles.blocoTitulo}>Contato</h3>
        <ul className={styles.contatos}>
          {contacts.map(c => (
            <li key={c.label} className={styles.contato}>
              <span className={styles.contatoIcone}>{c.icon}</span>
              <span className={styles.contatoTexto}>
                <span className={styles.contatoLabel}>{c.label}</span>
                <span className={styles.contatoValor}>{c.value || '—'}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.bloco}>
        <h3 className={styles.blocoTitulo}>Dados profissionais</h3>
        <dl className={styles.pares}>
          {pairs.map(d => (
            <div key={d.label} className={shared.par}>
              <dt>{d.label}</dt>
              <dd>{d.amount || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      {(professional.specializations?.length ?? 0) > 0 && (
        <div className={styles.bloco}>
          <h3 className={styles.blocoTitulo}>Especializações</h3>
          <div className={shared.chips}>
            {professional.specializations!.map(e => (
              <span key={e} className={shared.chip}>{e}</span>
            ))}
          </div>
        </div>
      )}

      {professional.description && (
        <div className={styles.bloco}>
          <h3 className={styles.blocoTitulo}>Sobre</h3>
          <p className={shared.sobre}>{professional.description}</p>
        </div>
      )}
    </section>
  )
}
