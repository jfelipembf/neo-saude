import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Tabs } from '@/components/Tabs/Tabs'
import { IconAdmin } from '@/components/icons'
import { RoomsTab } from './Rooms/RoomsTab'
import { MaterialsTab } from './Materials/MaterialsTab'
import { SuppliersTab } from './Suppliers/SuppliersTab'
import { ServicesTab } from './Services/ServicesTab'
import { OdontoProceduresTab } from './OdontoProcedures/OdontoProceduresTab'
import { TestsTab } from './Tests/TestsTab'
import { EvolutionTemplatesTab } from './EvolutionTemplates/EvolutionTemplatesTab'
import { ClassesTab } from './Classes/ClassesTab'
import { CommissionsTab } from './Commissions/CommissionsTab'
import { RolesTab } from './Roles/RolesTab'
import { CollaboratorsTab } from './Collaborators/CollaboratorsTab'
import { InsurancesTab } from './Insurances/InsurancesTab'
import { GoalsTab } from './Goals/GoalsTab'
import { AuditTab } from './Audit/AuditTab'
import { useSession } from '@/context/SessionProvider'
import { appliesToSpecialty } from '@/constants'
import type { ClinicSpecialty } from '@/types/domain'
import styles from './AdminPage.module.scss'

type TabKey = 'rooms' | 'materials' | 'suppliers' | 'services' | 'odontoProcedures' | 'tests' | 'evolutionTemplates' | 'classes' | 'insurances' | 'commissions' | 'roles' | 'collaborators' | 'goals' | 'audit'

// `specialties`/`excludeSpecialties` filtram a aba por ramo (ver constants/specialty).
// Serviços/Contratos (com modalidade, duração, pacote de sessões) não se aplicam
// à odontologia, que trabalha por procedimento avulso com preço de tabela →
// `services` escondida no ramo dentistry, `odontoProcedures` no lugar dela (o
// rótulo "Serviços" é o mesmo nos dois — o que muda é a aba por trás, cada uma
// com o formulário do tamanho que o ramo pede).
const TABS: { key: TabKey; label: string; specialties?: ClinicSpecialty[]; excludeSpecialties?: ClinicSpecialty[] }[] = [
  { key: 'rooms',     label: 'Salas' },
  // Materiais (insumos/estoque) não se aplica à fisioterapia → escondido nesse ramo.
  { key: 'materials', label: 'Materiais', excludeSpecialties: ['physiotherapy'] },
  // Fornecedores dos materiais — só existe onde Materiais existe: odontologia.
  // Consultório médico que faz procedimento compra insumo como o odonto — daí
  // Materiais e Fornecedores valerem para os dois.
  { key: 'suppliers', label: 'Fornecedores', specialties: ['dentistry', 'medicine'] },
  { key: 'services',  label: 'Serviços', excludeSpecialties: ['dentistry'] },
  { key: 'odontoProcedures', label: 'Serviços', specialties: ['dentistry'] },
  // Testes/escalas de avaliação — específico de fisioterapia.
  { key: 'tests',     label: 'Testes', specialties: ['physiotherapy'] },
  // Modelos de evolução SOAP (o "usar modelo" do prontuário) — o prontuário
  // por sessão só existe em fisioterapia, a aba acompanha.
  { key: 'evolutionTemplates', label: 'Modelos de evolução', specialties: ['physiotherapy', 'medicine'] },
  // Turma é atendimento coletivo — não existe em consultório médico.
  { key: 'classes',   label: 'Turmas', excludeSpecialties: ['medicine'] },
  { key: 'insurances', label: 'Convênios' },
  { key: 'commissions', label: 'Comissões' },
  { key: 'roles',    label: 'Cargos' },
  { key: 'collaborators', label: 'Colaboradores' },
  { key: 'goals',    label: 'Metas' },
  { key: 'audit',    label: 'Auditoria' },
]

/** Página Administrativo: uma rota só, com o conteúdo organizado em abas. */
export function AdminPage() {
  // Deep-link ?tab=<key> (ex.: atalho "Início rápido" do Dashboard) — sem
  // ele (ou com chave inválida) cai na aba padrão, Salas.
  const [searchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const [tab, setTab] = useState<TabKey>(
    () => TABS.some(t => t.key === requestedTab) ? (requestedTab as TabKey) : 'rooms',
  )
  const { specialty } = useSession()
  const visibleTabs = TABS.filter(t => appliesToSpecialty(specialty, t))

  return (
    <>
      <header className={styles.topo}>
        <PageHeader title="Administrativo" icon={<IconAdmin />} />
        <Tabs tabs={visibleTabs} active={tab} onChange={key => setTab(key as TabKey)} />
      </header>

      {tab === 'rooms'     && <RoomsTab />}
      {tab === 'materials' && <MaterialsTab />}
      {tab === 'suppliers' && <SuppliersTab />}
      {tab === 'services'  && <ServicesTab />}
      {tab === 'odontoProcedures' && <OdontoProceduresTab />}
      {tab === 'tests'     && <TestsTab />}
      {tab === 'evolutionTemplates' && <EvolutionTemplatesTab />}
      {tab === 'classes'   && <ClassesTab />}
      {tab === 'insurances' && <InsurancesTab />}
      {tab === 'commissions' && <CommissionsTab />}
      {tab === 'roles'    && <RolesTab />}
      {tab === 'collaborators' && <CollaboratorsTab />}
      {tab === 'goals'    && <GoalsTab />}
      {tab === 'audit'    && <AuditTab />}
    </>
  )
}
