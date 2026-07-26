import { lazy, Suspense, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { AddressFields } from '@/components/AddressFields/AddressFields'
import { Select } from '@/components/Select/Select'
import { Tabs } from '@/components/Tabs/Tabs'
import { PaymentsTable } from '@/components/PaymentsTable/PaymentsTable'

// Chunk próprio: o odontograma embutido (~940 KB) só baixa ao abrir a aba Tratamento.
const TreatmentsPanel = lazy(() =>
  import('@/components/TreatmentsPanel/TreatmentsPanel').then(m => ({ default: m.TreatmentsPanel })),
)
import { DocumentsUpload } from '@/components/DocumentsUpload/DocumentsUpload'
import { AnamnesisTab } from './Anamnesis/AnamnesisTab'
import { PatientTestsPanel } from './Tests/PatientTestsPanel'
import { PatientClinicalNotesPanel } from './ClinicalNotes/PatientClinicalNotesPanel'
import { PatientEnrollmentsPanel } from './Enrollments/PatientEnrollmentsPanel'
import { SalesPointModal } from '@/components/SalesPointModal/SalesPointModal'
import { BudgetsPanel } from '@/components/BudgetsPanel/BudgetsPanel'
import { PrescriptionsPanel } from '@/components/PrescriptionsPanel/PrescriptionsPanel'
import { EntitlementPickerModal } from '@/components/EntitlementPickerModal/EntitlementPickerModal'
import { useToast } from '@/components/Toast/Toast'
import { SEX_OPTIONS, SEX_LABEL, APP_ROUTES } from '@/constants'
import { useInsuranceOptions } from '@/hooks/useInsurances'
import { usePatientEntitlements } from '@/hooks/usePatientEntitlements'
import { usePatient, useUpdatePatient, useUpdatePatientPhoto } from '@/hooks/usePatients'
import { uploadImage } from '@/lib/storage'
import { IconUser, IconEdit, IconPhone, IconMessage, IconEmail, IconCamera, IconCart, IconPlus } from '@/components/icons'
import { initials, digitsOnly } from '@/utils/text'
import { isEntitlementActive } from '@/utils/entitlements'
import { useSession } from '@/context/SessionProvider'
import { appliesToSpecialty } from '@/constants'
import type { Patient, Gender, ClinicSpecialty, PatientServiceEntitlement } from '@/types/domain'
import styles from './PatientProfilePage.module.scss'

type TabKey =
  | 'personal' | 'anamnesis' | 'treatment' | 'quotes' | 'tests' | 'clinicalNotes' | 'enrollments'
  | 'prescriptions' | 'payments' | 'documents'

// `specialties`/`excludeSpecialties` restringem a aba a certos ramos (ver
// constants/specialty). Ausente = núcleo (todo ramo). Tratamento hoje é o
// odontograma → só odontologia. Orçamentos não faz sentido em fisioterapia
// (vira a aba Testes, com os testes/escalas de avaliação do paciente), e
// Prescrições também não: o fisioterapeuta prescreve conduta no prontuário
// da sessão, não receituário.
const TABS: { key: TabKey; label: string; specialties?: ClinicSpecialty[]; excludeSpecialties?: ClinicSpecialty[] }[] = [
  { key: 'personal',      label: 'Dados pessoais' },
  { key: 'anamnesis',     label: 'Anamnese' },
  { key: 'treatment',     label: 'Tratamento',  specialties: ['dentistry'] },
  { key: 'quotes',        label: 'Orçamentos',  excludeSpecialties: ['physiotherapy'] },
  { key: 'tests',         label: 'Testes',      specialties: ['physiotherapy'] },
  { key: 'clinicalNotes', label: 'Prontuários', specialties: ['physiotherapy'] },
  { key: 'enrollments',   label: 'Matrículas',  specialties: ['physiotherapy'] },
  { key: 'prescriptions', label: 'Prescrições', excludeSpecialties: ['physiotherapy'] },
  { key: 'payments',      label: 'Pagamentos' },
  { key: 'documents',     label: 'Documentos' },
]

interface PatientFormState {
  firstName: string
  lastName: string
  commonName: string
  sex: Gender | ''
  birthDateIso: string   // aaaa-mm-dd (input date)
  email: string
  phone: string
  whatsapp: string
  insurance: string
  cep: string
  state: string
  city: string
  neighborhood: string
  street: string
  number: string
}

/** Monta o formulário a partir do cadastro atual (nome completo → nome + sobrenome). */
function formFromPatient(p: Patient): PatientFormState {
  const [firstName, ...lastNameParts] = p.name.split(' ')
  return {
    firstName,
    lastName: lastNameParts.join(' '),
    commonName: p.commonName ?? '',
    sex: p.sex ?? '',
    birthDateIso: p.birthDate ? p.birthDate.split('/').reverse().join('-') : '',
    email: p.email ?? '',
    phone: p.phone,
    whatsapp: p.whatsapp ?? '',
    insurance: p.insurance,
    cep: p.cep ?? '',
    state: p.state ?? '',
    city: p.city ?? '',
    neighborhood: p.neighborhood ?? '',
    street: p.street ?? '',
    number: p.number ?? '',
  }
}

export function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: patient, isLoading } = usePatient(id)
  const { mutate: save, isPending: saving } = useUpdatePatient()
  const { mutate: savePhoto } = useUpdatePatientPhoto()
  const insuranceOptions = useInsuranceOptions()
  const { specialty } = useSession()
  // Abas visíveis para o ramo da clínica (Tratamento/odontograma só em odontologia).
  const visibleTabs = TABS.filter(t => appliesToSpecialty(specialty, t))
  // Carrinho de compras: só fisioterapia (pacotes de sessão) — ver Ponto de Venda.
  const showCart = appliesToSpecialty(specialty, { specialties: ['physiotherapy'] })
  const { data: entitlements } = usePatientEntitlements(showCart ? (id ?? '') : '')
  // Matricular exige pelo menos um pacote/plano ativo — é ele que justifica a
  // matrícula e define até quando ela vale (ver classGroupRosterService.ts).
  const activeEntitlements = (entitlements ?? []).filter(isEntitlementActive)

  const [tab, setTab] = useState<TabKey>('personal')
  // Aba ATIVA é derivada, não o estado cru: enquanto a sessão carrega, `specialty`
  // é undefined e appliesToSpecialty libera TODAS as abas. Quem clicasse numa aba
  // restrita nessa janela continuaria vendo o conteúdo dela depois que o ramo
  // resolvesse e a aba sumisse da barra. Derivar mata a incoerência sem efeito.
  const activeTab: TabKey = visibleTabs.some(t => t.key === tab) ? tab : 'personal'
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<PatientFormState | null>(null)
  const [nameError, setNameError] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [salesOpen, setSalesOpen] = useState(false)
  const [entitlementPickerOpen, setEntitlementPickerOpen] = useState(false)

  function goEnrollWithEntitlement(entitlement: PatientServiceEntitlement) {
    setEntitlementPickerOpen(false)
    navigate(`${APP_ROUTES.SCHEDULE}?enroll=${id}&entitlement=${entitlement.id}`)
  }

  function handleMatricular() {
    if (activeEntitlements.length === 0) return
    if (activeEntitlements.length === 1) { goEnrollWithEntitlement(activeEntitlements[0]); return }
    setEntitlementPickerOpen(true)
  }

  // Zona de cabeçalho compartilhada: fica no lugar em QUALQUER estado da página
  // (carregando, não encontrado, conteúdo) — o breadcrumb nunca pula.
  const header = (
    <header className={styles.topo}>
      <PageHeader title="Perfil do paciente" icon={<IconUser />} />
      <Tabs tabs={visibleTabs} active={activeTab} onChange={changeTab} />
    </header>
  )

  if (isLoading) {
    return <>{header}<PageLoader /></>
  }

  if (!patient) {
    return (
      <>
        {header}
        <EmptyState title="Paciente não encontrado" description="Verifique se o link está correto." />
      </>
    )
  }

  const set = (field: keyof PatientFormState) => (value: string) => {
    setForm(current => (current ? { ...current, [field]: value } : current))
    if (field === 'firstName') setNameError('')
  }

  function openEdit() {
    setForm(formFromPatient(patient!))
    setNameError('')
    setEditing(true)
    setTab('personal')   // a edição vive na aba de dados pessoais
  }

  function closeEdit() {
    setEditing(false)
    setForm(null)
    setNameError('')
  }

  /** Foto escolhida: sobe pro Storage (persiste) e salva no cadastro. */
  async function escolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !patient) return

    setUploadingPhoto(true)
    try {
      const photo = await uploadImage(file, 'patients')
      savePhoto({ id: patient.id, photo }, { onSuccess: () => toast.success('Foto atualizada!') })
    } catch {
      toast.error('Não foi possível enviar a foto.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Trocar de aba no meio de uma edição descarta o rascunho.
  function changeTab(key: string) {
    setTab(key as TabKey)
    if (key !== 'personal') closeEdit()
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    if (!form.firstName.trim()) {
      setNameError('Informe o nome do paciente.')
      return
    }
    save(
      {
        id: patient!.id,
        payload: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          commonName: form.commonName.trim() || undefined,
          sex: form.sex || undefined,
          birthDate: form.birthDateIso ? form.birthDateIso.split('-').reverse().join('/') : undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim() || undefined,
          insurance: form.insurance,
          cep: form.cep.trim() || undefined,
          state: form.state.trim().toUpperCase() || undefined,
          city: form.city.trim() || undefined,
          neighborhood: form.neighborhood.trim() || undefined,
          street: form.street.trim() || undefined,
          number: form.number.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Dados atualizados!')
          closeEdit()
        },
      },
    )
  }

  const address = [patient.city, patient.state].filter(Boolean).join('/')

  const contacts = [
    { label: 'Telefone', value: patient.phone, icon: <IconPhone /> },
    { label: 'WhatsApp', value: patient.whatsapp, icon: <IconMessage /> },
    { label: 'E-mail',   value: patient.email,    icon: <IconEmail /> },
  ]

  const pairs: { label: string; amount?: string }[] = [
    { label: 'Sexo',          amount: patient.sex ? SEX_LABEL[patient.sex] : undefined },
    { label: 'Nascimento',    amount: patient.birthDate },
    { label: 'Última visita', amount: patient.lastVisit },
    { label: 'CEP',           amount: patient.cep },
  ]

  // Cadastro completo, exibido na aba "Dados pessoais" (modo leitura).
  const detailSections = [
    {
      title: 'Identificação',
      items: [
        { label: 'Nome completo', value: patient.name },
        { label: 'Nome comum',    value: patient.commonName },
        { label: 'Sexo',          value: patient.sex ? SEX_LABEL[patient.sex] : undefined },
        { label: 'Nascimento',    value: patient.birthDate },
        { label: 'Convênio',      value: patient.insurance },
        { label: 'Última visita', value: patient.lastVisit },
      ],
    },
    {
      title: 'Contato',
      items: [
        { label: 'Telefone', value: patient.phone },
        { label: 'WhatsApp', value: patient.whatsapp },
        { label: 'E-mail',   value: patient.email },
      ],
    },
    {
      title: 'Endereço',
      items: [
        { label: 'CEP',    value: patient.cep },
        { label: 'Estado', value: patient.state },
        { label: 'Cidade', value: patient.city },
        { label: 'Bairro', value: patient.neighborhood },
        { label: 'Rua',    value: patient.street },
        { label: 'Número', value: patient.number },
      ],
    },
  ]

  return (
    <>
      {header}

      <div className={styles.grid}>
        {/* ── Card-resumo (lateral esquerda) ── */}
        <section className={styles.resumo} aria-label="Resumo do paciente">
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconEdit />}
            className={styles.editBtn}
            onClick={openEdit}
            title="Editar cadastro"
            aria-label="Editar cadastro do paciente"
          />

          <div className={styles.identidade}>
            <div className={styles.avatarWrap}>
              <span className={styles.avatar}>
                {patient.photo ? (
                  <img src={patient.photo} alt={patient.name} className={styles.avatarImg} />
                ) : (
                  initials(patient.name)
                )}
              </span>

              {/* Em edição: círculo de câmera no canto para trocar a foto. */}
              {editing && (
                <label className={`${styles.fotoBtn} ${uploadingPhoto ? styles.fotoBtnLoading : ''}`} title="Trocar foto">
                  <IconCamera />
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.fotoInput}
                    onChange={escolherFoto}
                    disabled={uploadingPhoto}
                  />
                </label>
              )}
            </div>
            <h2 className={styles.nome}>{patient.name}</h2>
            <p className={styles.subtitulo}>
              {[patient.insurance, address].filter(Boolean).join(' · ')}
            </p>
          </div>

          {/* Ações rápidas: ligar e chamar no WhatsApp (+ carrinho, só fisioterapia). */}
          <div className={styles.acoesContato}>
            <Button
              variant="outline"
              iconLeft={<IconPhone />}
              disabled={!patient.phone}
              title="Ligar"
              aria-label="Ligar para o paciente"
              onClick={() => { window.location.href = `tel:+55${digitsOnly(patient.phone)}` }}
            />
            <Button
              iconLeft={<IconMessage />}
              disabled={!(patient.whatsapp ?? patient.phone)}
              title="WhatsApp"
              aria-label="Abrir WhatsApp do paciente"
              onClick={() =>
                // WhatsApp cadastrado ou o próprio celular.
                window.open(`https://wa.me/55${digitsOnly(patient.whatsapp ?? patient.phone)}`, '_blank')
              }
            />
            {showCart && (
              <Button
                variant="outline"
                iconLeft={<IconCart />}
                title="Comprar"
                aria-label="Abrir Ponto de Venda"
                onClick={() => setSalesOpen(true)}
              />
            )}
            {showCart && (
              <Button
                variant="outline"
                iconLeft={<IconPlus />}
                disabled={activeEntitlements.length === 0}
                title={activeEntitlements.length === 0 ? 'O paciente precisa de um pacote ou plano ativo' : 'Matricular numa turma'}
                onClick={handleMatricular}
              >
                Matricular
              </Button>
            )}
          </div>

          {showCart && entitlements && entitlements.length > 0 && (
            <div className={styles.bloco}>
              {/* "Pacotes e contratos": a lista deixou de ser só de pacotes —
                  contrato comum (mensalidade) também gera direito e cai aqui. */}
              <h3 className={styles.blocoTitulo}>Pacotes e contratos</h3>
              <ul className={styles.contatos}>
                {entitlements.map(e => (
                  <li key={e.id} className={styles.contato}>
                    <span className={styles.contatoTexto}>
                      <span className={styles.contatoLabel}>{e.serviceName}</span>
                      <span className={styles.contatoValor}>
                        {/* Contrato não esgota nem tem saldo: quem o encerra é a
                            validade — mostrar "0 de null restantes" seria falso. */}
                        {e.kind === 'recurring'
                          ? 'Contrato'
                          : (e.remaining ?? 0) > 0
                            ? `${e.remaining} de ${e.totalSessions} restantes`
                            : 'Esgotado'}
                        {e.expiresAt ? ` · válido até ${e.expiresAt}` : ''}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
            <h3 className={styles.blocoTitulo}>Dados pessoais</h3>
            <dl className={styles.pares}>
              {pairs.map(d => (
                <div key={d.label} className={styles.par}>
                  <dt>{d.label}</dt>
                  <dd>{d.amount || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Painel da direita: conteúdo da aba ativa ── */}
        <div className={styles.painel}>
          {activeTab === 'personal' && (editing && form ? (
          <section className={styles.formCard} aria-label="Editar cadastro">
            <h2 className={styles.formTitulo}>Editar cadastro</h2>

            <form className={styles.form} onSubmit={handleSave}>
              <section className={styles.formSection}>
                <h3>Dados pessoais</h3>
                <div className={styles.grid2}>
                  <Input label="Nome" value={form.firstName} onChange={e => set('firstName')(e.target.value)} error={nameError} autoFocus />
                  <Input label="Sobrenome" value={form.lastName} onChange={e => set('lastName')(e.target.value)} />
                </div>
                <Input
                  label="Nome comum / nome social"
                  placeholder="Felipe"
                  hint="Como a pessoa é chamada no dia a dia, e o nome que a assistente de voz fala em voz alta no atendimento. Vazio, ela deduz do nome completo."
                  value={form.commonName}
                  onChange={e => set('commonName')(e.target.value)}
                />
                <div className={styles.grid2}>
                  <Select
                    label="Sexo"
                    options={SEX_OPTIONS}
                    placeholder="Selecione..."
                    value={form.sex}
                    onChange={e => set('sex')(e.target.value)}
                  />
                  <Input
                    label="Data de nascimento"
                    type="date"
                    value={form.birthDateIso}
                    onChange={e => set('birthDateIso')(e.target.value)}
                  />
                </div>
                <Select
                  label="Convênio"
                  options={insuranceOptions}
                  value={form.insurance}
                  onChange={e => set('insurance')(e.target.value)}
                />
              </section>

              <section className={styles.formSection}>
                <h3>Contato</h3>
                <Input label="E-mail" type="email" value={form.email} onChange={e => set('email')(e.target.value)} />
                <div className={styles.grid2}>
                  <Input label="Telefone" type="tel" value={form.phone} onChange={e => set('phone')(e.target.value)} />
                  <Input label="WhatsApp" type="tel" value={form.whatsapp} onChange={e => set('whatsapp')(e.target.value)} />
                </div>
              </section>

              <section className={styles.formSection}>
                <h3>Endereço</h3>
                {/* CEP autopreenche estado/cidade/bairro/rua (ViaCEP); a rua é
                    exigida em documento impresso e na NFS-e. */}
                <AddressFields
                  value={form}
                  onChange={(field, value) => set(field as keyof PatientFormState)(value)}
                />
              </section>

              <div className={styles.formAcoes}>
                <Button variant="ghost" onClick={closeEdit} disabled={saving}>Cancelar</Button>
                <Button type="submit" loading={saving}>Salvar</Button>
              </div>
            </form>
          </section>
          ) : (
          <section className={styles.formCard} aria-label="Dados do paciente">
            <div className={styles.detalheHead}>
              <h2 className={styles.formTitulo}>Dados do paciente</h2>
              <Button variant="outline" size="sm" iconLeft={<IconEdit />} onClick={openEdit}>
                Editar
              </Button>
            </div>

            {detailSections.map(section => (
              <section key={section.title} className={styles.formSection}>
                <h3>{section.title}</h3>
                <dl className={styles.paresLargos}>
                  {section.items.map(item => (
                    <div key={item.label} className={styles.par}>
                      <dt>{item.label}</dt>
                      <dd>{item.value || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </section>
          ))}

          {activeTab === 'anamnesis' && (
            <AnamnesisTab patientId={patient.id} patientName={patient.name} />
          )}

          {activeTab === 'treatment' && (
            <Suspense fallback={<PageLoader />}>
              <TreatmentsPanel patientId={patient.id} patientName={patient.name} />
            </Suspense>
          )}
          {activeTab === 'quotes' && (
            <BudgetsPanel patientId={patient.id} patientName={patient.name} />
          )}
          {activeTab === 'tests' && (
            <PatientTestsPanel patientId={patient.id} />
          )}
          {activeTab === 'clinicalNotes' && (
            <PatientClinicalNotesPanel patientId={patient.id} />
          )}
          {activeTab === 'enrollments' && (
            <PatientEnrollmentsPanel patientId={patient.id} />
          )}
          {activeTab === 'prescriptions' && (
            <PrescriptionsPanel patientId={patient.id} patientName={patient.name} />
          )}
          {activeTab === 'payments' && (
            <PaymentsTable patientId={patient.id} patientName={patient.name} patientCpf={patient.cpf} />
          )}
          {activeTab === 'documents' && <DocumentsUpload patientId={patient.id} />}
        </div>
      </div>

      {showCart && (
        <SalesPointModal open={salesOpen} onClose={() => setSalesOpen(false)} patientId={patient.id} />
      )}

      {showCart && (
        <EntitlementPickerModal
          open={entitlementPickerOpen}
          patientId={patient.id}
          onClose={() => setEntitlementPickerOpen(false)}
          onPick={goEnrollWithEntitlement}
        />
      )}
    </>
  )
}
