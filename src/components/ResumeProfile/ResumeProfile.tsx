import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Spinner } from '@/components/Spinner/Spinner'
import { useToast } from '@/components/Toast/useToast'
import { useCurrentUser } from '@/hooks/useUser'
import {
  IconPhone, IconEmail, IconLocation, IconShare, IconCard, IconCopy,
} from '@/components/icons'
import { initials } from '@/utils/text'
import type { UserProfile } from '@/types/domain'
import styles from './ResumeProfile.module.scss'

function fullAddress(u: UserProfile) {
  return `${u.address}, ${u.city}, CEP ${u.cep}`
}

// vCard 3.0 — formato aberto que Contatos (iOS/Android/desktop) importam direto.
function generateVCard(u: UserProfile) {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${u.name}`,
    `TITLE:${u.specialty}`,
    'ORG:Neo Saúde',
    `TEL;TYPE=CELL:${u.phone}`,
    `EMAIL:${u.email}`,
    `ADR;TYPE=WORK:;;${u.address};${u.city};;${u.cep};Brasil`,
    'END:VCARD',
  ].join('\r\n')
}

/**
 * Cartão-resumo do usuário logado no Dashboard: identidade, contatos e ações
 * rápidas de compartilhamento (copiar, mapa, Web Share e cartão de visita .vcf).
 */
export function ResumeProfile() {
  const toast = useToast()
  const { data: user, isLoading } = useCurrentUser()

  if (isLoading || !user) {
    return (
      <section className={styles.card}>
        <div className={styles.loading}><Spinner /></div>
      </section>
    )
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copiado!`)
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  function openMap() {
    const query = encodeURIComponent(fullAddress(user!))
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener')
  }

  async function shareContact() {
    const u = user!
    const text = `${u.name} — ${u.specialty} (${u.license})\nTelefone: ${u.phone}\nE-mail: ${u.email}\nEndereço: ${fullAddress(u)}`
    if (navigator.share) {
      try {
        await navigator.share({ title: u.name, text: text })
      } catch {
        // Usuário cancelou o compartilhamento — não é erro.
      }
      return
    }
    await copy(text, 'Contato')
  }

  function downloadCard() {
    const u = user!
    const blob = new Blob([generateVCard(u)], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${u.name.replace(/\s+/g, '-').toLowerCase()}.vcf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Cartão de visita salvo!')
  }

  return (
    <section className={styles.card} aria-label="Resumo do perfil">
      <header className={styles.top}>
        <span className={styles.avatar}>
          {user.photo ? <img src={user.photo} alt="" className={styles.avatarImg} /> : initials(user.name)}
        </span>

        <div className={styles.identity}>
          <h2 className={styles.nome}>{user.name}</h2>
          <p className={styles.membro}>Membro desde {user.memberSince}</p>
          <div className={styles.badges}>
            <Badge status="active" label={user.specialty} />
            <Badge status="active" label={user.license} />
          </div>
        </div>

        <span className={styles.codigo}>#{user.code}</span>
      </header>

      <div className={styles.info}>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}><IconLocation /></span>
          <div className={styles.infoText}>
            <span className={styles.infoLabel}>Endereço</span>
            <span className={styles.infoValue}>
              {user.address}<br />{user.city} — <strong>CEP {user.cep}</strong>
            </span>
          </div>
          <Button
            variant="ghost" size="sm" iconLeft={<IconCopy />}
            title="Copiar endereço" aria-label="Copiar endereço"
            onClick={() => copy(fullAddress(user), 'Endereço')}
          />
        </div>

        <div className={styles.mapa}>
          <Button variant="primary" size="sm" iconLeft={<IconLocation />} onClick={openMap}>
            Ver no mapa
          </Button>
        </div>

        <div className={styles.infoItem}>
          <span className={styles.infoIcon}><IconPhone /></span>
          <div className={styles.infoText}>
            <span className={styles.infoLabel}>Telefone</span>
            <span className={styles.infoValue}>{user.phone}</span>
          </div>
          <Button
            variant="ghost" size="sm" iconLeft={<IconCopy />}
            title="Copiar telefone" aria-label="Copiar telefone"
            onClick={() => copy(user.phone, 'Telefone')}
          />
        </div>

        <div className={styles.infoItem}>
          <span className={styles.infoIcon}><IconEmail /></span>
          <div className={styles.infoText}>
            <span className={styles.infoLabel}>E-mail</span>
            <span className={styles.infoValue}>{user.email}</span>
          </div>
          <Button
            variant="ghost" size="sm" iconLeft={<IconCopy />}
            title="Copiar e-mail" aria-label="Copiar e-mail"
            onClick={() => copy(user.email, 'E-mail')}
          />
        </div>
      </div>

      <footer className={styles.actions}>
        <Button variant="primary" iconLeft={<IconShare />} onClick={() => void shareContact()}>
          Compartilhar contato
        </Button>
        <Button variant="outline" iconLeft={<IconCard />} onClick={downloadCard}>
          Cartão de visita
        </Button>
      </footer>
    </section>
  )
}
