import { Button } from '@/components/Button/Button'
import { IconEditar, IconEstrela, IconTelefone, IconMensagem, IconEmail } from '@/components/icons'
import { initials } from '@/utils/text'
import type { Professional } from '@/types/domain'
import shared from './shared/profile.module.scss'
import styles from './ProfileSummary.module.scss'

interface ProfileSummaryProps {
  profissional: Professional
  onEditar: () => void
}

/** Card-resumo da lateral esquerda: identidade, contato, dados profissionais,
 *  especializações e "sobre" — visível em todas as abas. */
export function ProfileSummary({ profissional, onEditar }: ProfileSummaryProps) {
  const contatos = [
    { label: 'Telefone', valor: profissional.telefone, icone: <IconTelefone /> },
    { label: 'WhatsApp', valor: profissional.whatsapp, icone: <IconMensagem /> },
    { label: 'E-mail',   valor: profissional.email,    icone: <IconEmail /> },
  ]

  const pares: { label: string; valor?: string }[] = [
    { label: 'Especialidade', valor: profissional.especialidade },
    { label: 'Registro',      valor: profissional.registro },
    { label: 'Nota média',    valor: profissional.nota?.toLocaleString('pt-BR') },
    { label: 'Situação',      valor: profissional.status === 'ativo' ? 'Ativo' : 'Inativo' },
  ]

  return (
    <section className={styles.resumo} aria-label="Resumo do profissional">
      <Button
        variant="ghost"
        size="sm"
        iconLeft={<IconEditar />}
        className={styles.editBtn}
        onClick={onEditar}
        title="Editar cadastro"
        aria-label="Editar cadastro do profissional"
      />

      <div className={styles.identidade}>
        <span className={styles.avatar}>{initials(profissional.nome)}</span>
        <h2 className={styles.nome}>{profissional.nome}</h2>
        <p className={styles.subtitulo}>
          {[profissional.especialidade, profissional.registro].filter(Boolean).join(' · ')}
        </p>
        {profissional.nota != null && (
          <span className={styles.nota}>
            <IconEstrela />
            {profissional.nota.toLocaleString('pt-BR')}
          </span>
        )}
      </div>

      <div className={styles.bloco}>
        <h3 className={styles.blocoTitulo}>Contato</h3>
        <ul className={styles.contatos}>
          {contatos.map(c => (
            <li key={c.label} className={styles.contato}>
              <span className={styles.contatoIcone}>{c.icone}</span>
              <span className={styles.contatoTexto}>
                <span className={styles.contatoLabel}>{c.label}</span>
                <span className={styles.contatoValor}>{c.valor || '—'}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.bloco}>
        <h3 className={styles.blocoTitulo}>Dados profissionais</h3>
        <dl className={styles.pares}>
          {pares.map(d => (
            <div key={d.label} className={shared.par}>
              <dt>{d.label}</dt>
              <dd>{d.valor || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      {(profissional.especializacoes?.length ?? 0) > 0 && (
        <div className={styles.bloco}>
          <h3 className={styles.blocoTitulo}>Especializações</h3>
          <div className={shared.chips}>
            {profissional.especializacoes!.map(e => (
              <span key={e} className={shared.chip}>{e}</span>
            ))}
          </div>
        </div>
      )}

      {profissional.descricao && (
        <div className={styles.bloco}>
          <h3 className={styles.blocoTitulo}>Sobre</h3>
          <p className={shared.sobre}>{profissional.descricao}</p>
        </div>
      )}
    </section>
  )
}
