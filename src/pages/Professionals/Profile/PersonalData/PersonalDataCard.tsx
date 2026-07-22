import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { IconEdit } from '@/components/icons'
import { SEX_LABEL } from '@/constants'
import type { Professional } from '@/types/domain'
import shared from '../shared/profile.module.scss'

interface PersonalDataCardProps {
  professional: Professional
  onEdit: () => void
}

/** Aba "Dados pessoais" em modo leitura: cadastro completo do profissional. */
export function PersonalDataCard({ professional, onEdit }: PersonalDataCardProps) {
  const sections = [
    {
      title: 'Identificação',
      items: [
        { label: 'Nome completo', value: professional.name },
        { label: 'Sexo',          value: professional.sex ? SEX_LABEL[professional.sex] : undefined },
        { label: 'Nascimento',    value: professional.birthDate },
        { label: 'Especialidade', value: professional.specialty },
        { label: 'Registro',      value: professional.license },
        { label: 'Nota média',    value: professional.rating?.toLocaleString('pt-BR') },
      ],
    },
    {
      title: 'Contato',
      items: [
        { label: 'Telefone', value: professional.phone },
        { label: 'WhatsApp', value: professional.whatsapp },
        { label: 'E-mail',   value: professional.email },
      ],
    },
    {
      title: 'Endereço',
      items: [
        { label: 'CEP',    value: professional.cep },
        { label: 'Estado', value: professional.state },
        { label: 'Cidade', value: professional.city },
        { label: 'Bairro', value: professional.neighborhood },
        { label: 'Número', value: professional.number },
      ],
    },
  ]

  return (
    <section className={shared.formCard} aria-label="Dados do profissional">
      <div className={shared.detalheHead}>
        <h2 className={shared.formTitulo}>Dados do profissional</h2>
        <div className={shared.detalheAcoes}>
          <Badge status={professional.status} />
          <Button variant="outline" size="sm" iconLeft={<IconEdit />} onClick={onEdit}>
            Editar
          </Button>
        </div>
      </div>

      {sections.map(section => (
        <section key={section.title} className={shared.formSection}>
          <h3>{section.title}</h3>
          <dl className={shared.paresLargos}>
            {section.items.map(item => (
              <div key={item.label} className={shared.par}>
                <dt>{item.label}</dt>
                <dd>{item.value || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {professional.description && (
        <section className={shared.formSection}>
          <h3>Sobre</h3>
          <p className={shared.sobre}>{professional.description}</p>
        </section>
      )}
    </section>
  )
}
