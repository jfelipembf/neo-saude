import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBolt } from '@/components/icons'
import { APP_ROUTES } from '@/constants'
import { SelectProfessionalModal } from './SelectProfessionalModal'
import pricesImage from '@/assets/images/buttons/price.png'
import agendaImage from '@/assets/images/buttons/agenda.png'
import patientsImage from '@/assets/images/buttons/pacientes.png'
import professionalImage from '@/assets/images/buttons/professional.png'
import staffImage from '@/assets/images/buttons/staff.png'
import receivableImage from '@/assets/images/buttons/receber.png'
import styles from './QuickAccessCard.module.scss'

interface QuickAccessItem {
  key: string
  label: string
  /** Imagem do botão (pasta assets/images/buttons). */
  image: string
  /** Navegação direta. Ausente quando o item usa `pickProfessional`. */
  to?: string
  /** Query a completar com o id do profissional escolhido no modal. */
  pickProfessional?: string
}

// Lista cresce conforme o dono for pedindo novos atalhos — cada item leva
// direto a uma tela específica de cadastro/configuração.
const ITEMS: QuickAccessItem[] = [
  { key: 'services-pricing', label: 'Preços', image: pricesImage, to: `${APP_ROUTES.ADMIN}?tab=services` },
  // Perfil do profissional já na aba Agenda → sub-aba Disponibilidade.
  { key: 'availability', label: 'Horário', image: agendaImage, pickProfessional: '?tab=schedule&view=availability' },
  // Lista de pacientes já com o modal de cadastro aberto.
  { key: 'new-patient', label: 'Paciente', image: patientsImage, to: `${APP_ROUTES.PATIENTS}?new=1` },
  // Lista de profissionais já com o modal de cadastro aberto.
  { key: 'new-professional', label: 'Profissional', image: professionalImage, to: `${APP_ROUTES.PROFESSIONALS}?new=1` },
  // Aba Colaboradores do Administrativo já com o formulário de cadastro aberto.
  { key: 'new-collaborator', label: 'Colaborador', image: staffImage, to: `${APP_ROUTES.ADMIN}?tab=collaborators&new=1` },
  // Financeiro, aba Contas a Receber.
  { key: 'billing', label: 'Cobrança', image: receivableImage, to: `${APP_ROUTES.FINANCE}?tab=receivables` },
]

/** Card do Dashboard com atalhos (estilo ícone de app: imagem + nome embaixo)
 *  para telas de cadastro/configuração usadas com frequência. */
export function QuickAccessCard() {
  const navigate = useNavigate()
  const [pickerQuery, setPickerQuery] = useState<string | null>(null)

  function handleItemClick(item: QuickAccessItem) {
    if (item.pickProfessional) setPickerQuery(item.pickProfessional)
    else if (item.to) navigate(item.to)
  }

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}><IconBolt /></span>
          <h2 className={styles.title}>Início rápido</h2>
        </div>
      </header>

      <div className={styles.grid}>
        {ITEMS.map(item => (
          <button key={item.key} type="button" className={styles.item} onClick={() => handleItemClick(item)}>
            <span className={styles.itemVisual}>
              <img src={item.image} alt="" className={styles.itemImg} />
            </span>
            <span className={styles.itemLabel}>{item.label}</span>
          </button>
        ))}
      </div>

      <SelectProfessionalModal
        open={pickerQuery !== null}
        onClose={() => setPickerQuery(null)}
        targetQuery={pickerQuery ?? ''}
      />
    </section>
  )
}
