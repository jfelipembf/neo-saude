import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Spinner } from '@/components/Spinner/Spinner'
import { useToast } from '@/components/Toast/useToast'
import { useUsuarioLogado } from '@/hooks/useUsuario'
import {
  IconTelefone, IconEmail, IconLocal, IconCompartilhar, IconCartao, IconCopiar,
} from '@/components/icons'
import { initials } from '@/utils/text'
import type { UserProfile } from '@/types/domain'
import styles from './ResumeProfile.module.scss'

function enderecoCompleto(u: UserProfile) {
  return `${u.endereco}, ${u.cidade}, CEP ${u.cep}`
}

// vCard 3.0 — formato aberto que Contatos (iOS/Android/desktop) importam direto.
function gerarVCard(u: UserProfile) {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${u.nome}`,
    `TITLE:${u.especialidade}`,
    'ORG:Neo Saúde',
    `TEL;TYPE=CELL:${u.telefone}`,
    `EMAIL:${u.email}`,
    `ADR;TYPE=WORK:;;${u.endereco};${u.cidade};;${u.cep};Brasil`,
    'END:VCARD',
  ].join('\r\n')
}

/**
 * Cartão-resumo do usuário logado no Dashboard: identidade, contatos e ações
 * rápidas de compartilhamento (copiar, mapa, Web Share e cartão de visita .vcf).
 */
export function ResumeProfile() {
  const toast = useToast()
  const { data: usuario, isLoading } = useUsuarioLogado()

  if (isLoading || !usuario) {
    return (
      <section className={styles.card}>
        <div className={styles.loading}><Spinner /></div>
      </section>
    )
  }

  async function copiar(texto: string, rotulo: string) {
    try {
      await navigator.clipboard.writeText(texto)
      toast.success(`${rotulo} copiado!`)
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  function abrirMapa() {
    const query = encodeURIComponent(enderecoCompleto(usuario!))
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener')
  }

  async function compartilharContato() {
    const u = usuario!
    const texto = `${u.nome} — ${u.especialidade} (${u.registro})\nTelefone: ${u.telefone}\nE-mail: ${u.email}\nEndereço: ${enderecoCompleto(u)}`
    if (navigator.share) {
      try {
        await navigator.share({ title: u.nome, text: texto })
      } catch {
        // Usuário cancelou o compartilhamento — não é erro.
      }
      return
    }
    await copiar(texto, 'Contato')
  }

  function baixarCartao() {
    const u = usuario!
    const blob = new Blob([gerarVCard(u)], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${u.nome.replace(/\s+/g, '-').toLowerCase()}.vcf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Cartão de visita salvo!')
  }

  return (
    <section className={styles.card} aria-label="Resumo do perfil">
      <header className={styles.top}>
        <span className={styles.avatar}>{initials(usuario.nome)}</span>

        <div className={styles.identity}>
          <h2 className={styles.nome}>{usuario.nome}</h2>
          <p className={styles.membro}>Membro desde {usuario.membroDesde}</p>
          <div className={styles.badges}>
            <Badge status="ativo" label={usuario.especialidade} />
            <Badge status="ativo" label={usuario.registro} />
          </div>
        </div>

        <span className={styles.codigo}>#{usuario.id}</span>
      </header>

      <div className={styles.info}>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}><IconLocal /></span>
          <div className={styles.infoText}>
            <span className={styles.infoLabel}>Endereço</span>
            <span className={styles.infoValue}>
              {usuario.endereco}<br />{usuario.cidade} — <strong>CEP {usuario.cep}</strong>
            </span>
          </div>
          <Button
            variant="ghost" size="sm" iconLeft={<IconCopiar />}
            title="Copiar endereço" aria-label="Copiar endereço"
            onClick={() => copiar(enderecoCompleto(usuario), 'Endereço')}
          />
        </div>

        <div className={styles.mapa}>
          <Button variant="primary" size="sm" iconLeft={<IconLocal />} onClick={abrirMapa}>
            Ver no mapa
          </Button>
        </div>

        <div className={styles.infoItem}>
          <span className={styles.infoIcon}><IconTelefone /></span>
          <div className={styles.infoText}>
            <span className={styles.infoLabel}>Telefone</span>
            <span className={styles.infoValue}>{usuario.telefone}</span>
          </div>
          <Button
            variant="ghost" size="sm" iconLeft={<IconCopiar />}
            title="Copiar telefone" aria-label="Copiar telefone"
            onClick={() => copiar(usuario.telefone, 'Telefone')}
          />
        </div>

        <div className={styles.infoItem}>
          <span className={styles.infoIcon}><IconEmail /></span>
          <div className={styles.infoText}>
            <span className={styles.infoLabel}>E-mail</span>
            <span className={styles.infoValue}>{usuario.email}</span>
          </div>
          <Button
            variant="ghost" size="sm" iconLeft={<IconCopiar />}
            title="Copiar e-mail" aria-label="Copiar e-mail"
            onClick={() => copiar(usuario.email, 'E-mail')}
          />
        </div>
      </div>

      <footer className={styles.actions}>
        <Button variant="primary" iconLeft={<IconCompartilhar />} onClick={() => void compartilharContato()}>
          Compartilhar contato
        </Button>
        <Button variant="outline" iconLeft={<IconCartao />} onClick={baixarCartao}>
          Cartão de visita
        </Button>
      </footer>
    </section>
  )
}
