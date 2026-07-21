import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { IconEditar } from '@/components/icons'
import { SEXO_LABEL } from '@/constants'
import type { Professional } from '@/types/domain'
import shared from '../shared/profile.module.scss'

interface PersonalDataCardProps {
  profissional: Professional
  onEditar: () => void
}

/** Aba "Dados pessoais" em modo leitura: cadastro completo do profissional. */
export function PersonalDataCard({ profissional, onEditar }: PersonalDataCardProps) {
  const secoes = [
    {
      titulo: 'Identificação',
      itens: [
        { label: 'Nome completo', valor: profissional.nome },
        { label: 'Sexo',          valor: profissional.sexo ? SEXO_LABEL[profissional.sexo] : undefined },
        { label: 'Nascimento',    valor: profissional.nascimento },
        { label: 'Especialidade', valor: profissional.especialidade },
        { label: 'Registro',      valor: profissional.registro },
        { label: 'Nota média',    valor: profissional.nota?.toLocaleString('pt-BR') },
      ],
    },
    {
      titulo: 'Contato',
      itens: [
        { label: 'Telefone', valor: profissional.telefone },
        { label: 'WhatsApp', valor: profissional.whatsapp },
        { label: 'E-mail',   valor: profissional.email },
      ],
    },
    {
      titulo: 'Endereço',
      itens: [
        { label: 'CEP',    valor: profissional.cep },
        { label: 'Estado', valor: profissional.estado },
        { label: 'Cidade', valor: profissional.cidade },
        { label: 'Bairro', valor: profissional.bairro },
        { label: 'Número', valor: profissional.numero },
      ],
    },
  ]

  return (
    <section className={shared.formCard} aria-label="Dados do profissional">
      <div className={shared.detalheHead}>
        <h2 className={shared.formTitulo}>Dados do profissional</h2>
        <div className={shared.detalheAcoes}>
          <Badge status={profissional.status} />
          <Button variant="outline" size="sm" iconLeft={<IconEditar />} onClick={onEditar}>
            Editar
          </Button>
        </div>
      </div>

      {secoes.map(secao => (
        <section key={secao.titulo} className={shared.formSection}>
          <h3>{secao.titulo}</h3>
          <dl className={shared.paresLargos}>
            {secao.itens.map(item => (
              <div key={item.label} className={shared.par}>
                <dt>{item.label}</dt>
                <dd>{item.valor || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {profissional.descricao && (
        <section className={shared.formSection}>
          <h3>Sobre</h3>
          <p className={shared.sobre}>{profissional.descricao}</p>
        </section>
      )}
    </section>
  )
}
