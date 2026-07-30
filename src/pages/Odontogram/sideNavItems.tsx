import {
  IconDocumentsFolder, IconFinance, IconInterview, IconPill, IconTooth,
  IconTreatmentHistory,
} from '@/components/icons'
import type { NavItem } from '@/pages/Consultation/Components/Shell/navItems'

export type OdontogramNavKey =
  | 'odontograma' | 'anamnese' | 'tratamentos' | 'orcamentos' | 'prescricoes' | 'documentos'

/**
 * As seções da TELA CHEIA DO ODONTOGRAMA.
 *
 * Esta tela deixou de ser só o mapa dentário: o menu à esquerda é o mesmo da
 * fisioterapia e da medicina, e o odontograma virou a PRIMEIRA seção dele em
 * vez do quadro fixo do meio. No lugar da coluna que havia à direita — achados
 * e diário da Cibelly — entra o painel da seção escolhida.
 *
 * ODONTOGRAMA vem primeiro porque é onde o atendimento começa e onde a Cibelly
 * atua: quem abre esta tela veio marcar dente.
 *
 * O odontograma NÃO é uma porta para outra rota — esta É a rota. Houve uma
 * segunda tela de atendimento odontológico em que ele era só um botão que
 * levava para cá; ela foi removida. O motor fica montado o tempo todo,
 * apenas oculto quando outra seção está aberta (ver a página): ele é global de
 * módulo e mede o próprio grid ao montar, então desmontá-lo ao trocar de seção
 * apagaria o desenho do atendimento em curso.
 */
export const ITENS: NavItem<OdontogramNavKey>[] = [
  { chave: 'odontograma', label: 'Odontograma', icon: <IconTooth /> },
  { chave: 'anamnese', label: 'Anamnese', icon: <IconInterview /> },
  { chave: 'tratamentos', label: 'Tratamentos', icon: <IconTreatmentHistory /> },
  { chave: 'orcamentos', label: 'Orçamentos', icon: <IconFinance /> },
  // PRESCRIÇÕES emite (receituário, atestado, documento); DOCUMENTOS arquiva o
  // que o paciente traz. Um nome só para as duas coisas fazia procurar o
  // atestado a emitir no mesmo lugar do raio-X que chegou por e-mail.
  { chave: 'prescricoes', label: 'Prescrições', icon: <IconPill /> },
  { chave: 'documentos', label: 'Documentos', icon: <IconDocumentsFolder /> },
]

/**
 * Os dois atalhos da barra inferior do PWA.
 *
 * ODONTOGRAMA porque é o eixo do atendimento. ANAMNESE porque é o que se
 * consulta ANTES de encostar no paciente — alergia e anticoagulante mudam a
 * conduta, e procurá-los atrás do botão central custa o clique que faz não
 * procurar.
 */
export const ATALHOS_DA_BARRA = ['odontograma', 'anamnese'] as const satisfies readonly OdontogramNavKey[]
