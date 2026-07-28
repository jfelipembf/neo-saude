import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Select } from '@/components/Select/Select'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { SideList } from '@/components/SideList/SideList'
import type { SideListItem } from '@/components/SideList/SideList'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/Toast'
import { useSession } from '@/context/SessionProvider'
import {
  useServices, useCreateService, useUpdateService,
  useServiceInsurancePrices, useSaveServiceInsurancePrices,
} from '@/hooks/useServices'
import { useInsurances } from '@/hooks/useInsurances'
import { formatBRL } from '@/utils/format'
import type { EditService } from '@/services/servicesService'
import { SINGLE_ACT_MODALITIES } from '@/types/domain'
import type { ClinicSpecialty, Service, ServiceModality, DurationUnit } from '@/types/domain'
import styles from './ServicesTab.module.scss'

/**
 * O QUE A CLÍNICA VENDE muda com o ramo, e não é rótulo diferente para a mesma
 * coisa: contrato e pacote têm vigência e sessões; consulta e procedimento são
 * ato único, cobrado na hora. Oferecer os quatro juntos convidaria o médico a
 * cadastrar uma consulta com "duração de 12 meses".
 */
const CONTRACT_MODALITIES: { value: ServiceModality; label: string }[] = [
  { value: 'common',  label: 'Contrato Comum' },
  { value: 'package', label: 'Pacote de sessões' },
]
const ACT_MODALITIES: { value: ServiceModality; label: string }[] = [
  { value: 'consultation', label: 'Consulta' },
  { value: 'procedure',    label: 'Procedimento' },
]

function modalityOptions(specialty: ClinicSpecialty | undefined) {
  return specialty === 'medicine' ? ACT_MODALITIES : CONTRACT_MODALITIES
}

const MODALITY_LABEL: Record<ServiceModality, string> = {
  common: 'Contrato',
  package: 'Pacote',
  consultation: 'Consulta',
  procedure: 'Procedimento',
}
const PERIOD_OPTIONS: { value: DurationUnit; label: string }[] = [
  { value: 'days',   label: 'Dias' },
  { value: 'weeks',  label: 'Semanas' },
  { value: 'months', label: 'Meses' },
]
const periodLabel = (u: DurationUnit) => PERIOD_OPTIONS.find(o => o.value === u)?.label.toLowerCase() ?? ''

function serviceSub(s: Service): string {
  // Ato único não tem o que descrever além do preço — e escrever "0 meses"
  // aqui faria a lista parecer um cadastro pela metade.
  if (SINGLE_ACT_MODALITIES.includes(s.modality)) {
    return `${MODALITY_LABEL[s.modality]} · ${formatBRL(s.price)}`
  }
  return s.modality === 'package'
    ? `Pacote · ${s.sessions ?? 0} sessões · ${formatBRL(s.price)}`
    : `Contrato · ${s.durationQty} ${periodLabel(s.durationUnit)} · ${formatBRL(s.price)}`
}

interface ServiceFormState {
  name: string
  modality: ServiceModality
  price: string
  durationQty: string
  durationUnit: DurationUnit
  sessions: string
  weeklyLimit: string
  maxInstallments: string
  description: string
  active: boolean
  tussCode: string
  tussTable: string
}

const EMPTY_FORM: ServiceFormState = {
  name: '', modality: 'common', price: '', durationQty: '', durationUnit: 'months',
  sessions: '', weeklyLimit: '', maxInstallments: '1', description: '', active: true,
  tussCode: '', tussTable: '',
}

function formFromService(s: Service): ServiceFormState {
  return {
    name: s.name,
    modality: s.modality,
    price: String(s.price),
    durationQty: String(s.durationQty),
    durationUnit: s.durationUnit,
    sessions: s.sessions != null ? String(s.sessions) : '',
    weeklyLimit: s.weeklyLimit != null ? String(s.weeklyLimit) : '',
    maxInstallments: String(s.maxInstallments),
    description: s.description ?? '',
    active: s.status === 'active',
    tussCode: s.tussCode ?? '',
    tussTable: s.tussTable ?? '',
  }
}

/** Aba "Serviços": cadastro unificado do que a clínica vende — Contrato Comum
 *  (vigência) ou Pacote de sessões. Lista lateral + formulário ao lado. */
export function ServicesTab() {
  const toast = useToast()
  const { data: services, isLoading } = useServices()
  const { mutate: create, isPending: creating } = useCreateService()
  const { mutate: update, isPending: saving } = useUpdateService()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const { specialty } = useSession()
  const opcoesDeModalidade = modalityOptions(specialty)
  const { data: convenios } = useInsurances()
  const conveniosAtivos = (convenios ?? []).filter(c => c.status === 'active')
  const [form, setForm] = useState<ServiceFormState>(
    () => ({ ...EMPTY_FORM, modality: opcoesDeModalidade[0].value }),
  )
  const [nameError, setNameError] = useState('')
  /**
   * Preço por convênio, em rascunho: chave = id do convênio, valor = o texto do
   * input. String vazia significa "não tenho contrato com esta operadora" e
   * apaga a linha no banco — diferente de zero, que seria "esta operadora paga
   * R$ 0,00". Ver saveServiceInsurancePrices.
   */
  const [precos, setPrecos] = useState<Record<string, string>>({})
  const { data: precosSalvos } = useServiceInsurancePrices(selectedId)
  const { mutate: salvarPrecos } = useSaveServiceInsurancePrices()
  // Deriva em render, não em efeito: o rascunho nasce do que está gravado e uma
  // revalidação em segundo plano não pode apagar o que está sendo digitado.
  const [precosDe, setPrecosDe] = useState<string | null>(null)
  if (precosSalvos && selectedId && precosDe !== selectedId) {
    setPrecosDe(selectedId)
    setPrecos(Object.fromEntries(precosSalvos.map(p => [p.insuranceId, String(p.price)])))
  }

  if (isLoading) return <PageLoader />

  const list = services ?? []
  const isFormVisible = selectedId !== null || isNew
  const isPackage = form.modality === 'package'
  // Ato único (consulta/procedimento): sem vigência, sem sessões, sem limite
  // semanal — só nome, preço e parcelamento.
  const isAtoUnico = SINGLE_ACT_MODALITIES.includes(form.modality)

  const items: SideListItem[] = list.map(s => ({
    id: s.id,
    label: s.name,
    sublabel: serviceSub(s),
  }))

  function set<K extends keyof ServiceFormState>(field: K, value: ServiceFormState[K]) {
    setForm(f => ({ ...f, [field]: value }))
    if (field === 'name') setNameError('')
  }

  function handleSelect(id: string | number) {
    const s = list.find(x => x.id === String(id))
    if (!s) return
    setSelectedId(String(id))
    setIsNew(false)
    setForm(formFromService(s))
    setNameError('')
  }

  function handleNew() {
    setSelectedId(null)
    setIsNew(true)
    setForm({ ...EMPTY_FORM, modality: opcoesDeModalidade[0].value })
    setNameError('')
  }

  function handleCancel() {
    setSelectedId(null)
    setIsNew(false)
    setForm({ ...EMPTY_FORM, modality: opcoesDeModalidade[0].value })
    setNameError('')
  }

  function handleSave() {
    if (!form.name.trim()) { setNameError('Informe o nome do serviço.'); return }

    const num = (v: string) => Math.max(0, Number(v) || 0)
    const payload: EditService = {
      name: form.name.trim(),
      modality: form.modality,
      price: num(form.price),
      // Ato único não tem vigência: grava 0 em vez de carregar o que sobrou de
      // um rascunho de contrato editado antes na mesma tela.
      durationQty: isAtoUnico ? 0 : num(form.durationQty),
      durationUnit: form.durationUnit,
      sessions: form.modality === 'package' ? num(form.sessions) : undefined,
      weeklyLimit: form.modality === 'common' && form.weeklyLimit.trim() !== '' ? num(form.weeklyLimit) : undefined,
      maxInstallments: Math.max(1, num(form.maxInstallments) || 1),
      description: form.description.trim() || undefined,
      status: form.active ? 'active' : 'inactive',
      tussCode: form.tussCode.trim() || undefined,
      tussTable: form.tussTable.trim() || undefined,
    }
    const opts = {
      onSuccess: () => {
        toast.success(selectedId ? 'Serviço atualizado!' : 'Serviço cadastrado!')
        handleCancel()
      },
    }
    if (selectedId) {
      salvarPrecos({
        serviceId: selectedId,
        precos: conveniosAtivos.map(c => ({
          insuranceId: c.id,
          price: precos[c.id]?.trim() ? num(precos[c.id]) : null,
        })),
      })
      update({ id: selectedId, payload }, opts)
    } else {
      // Serviço novo ainda não tem id — os valores por convênio entram na
      // primeira edição, e a tela diz isso em vez de perder o que foi digitado.
      create(payload, opts)
    }
  }

  return (
    <div className={styles.layout}>
      <SideList
        title="Serviços"
        size="lg"
        items={items}
        selectedId={selectedId}
        onSelect={handleSelect}
        onAdd={handleNew}
        searchPlaceholder="Buscar serviço..."
        emptyText="Nenhum serviço cadastrado"
      />

      <div className={styles.formArea}>
        {!isFormVisible ? (
          <EmptyState
            title="Nenhum serviço selecionado"
            description="Selecione um serviço na lista ao lado ou crie um novo clicando em +."
          />
        ) : (
          <>
            <div className={styles.formRoot}>
              {/* ── Dados do serviço ── */}
              <FormSection
                title={isNew ? 'Novo serviço' : (form.name || 'Serviço')}
                actions={<Toggle label="Serviço ativo" checked={form.active} onChange={v => set('active', v)} />}
              >
                <div className={styles.fields}>
                  <div className={styles.fieldFull}>
                    <Input
                      label="Nome do serviço / título"
                      placeholder="Ex: Hidroginástica 2x - Anual, Pacote 10 Sessões..."
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      error={nameError}
                    />
                  </div>

                  <Input
                    label={isAtoUnico ? 'Preço (R$)' : 'Valor Base (R$)'}
                    type="number" min={0} step="0.01"
                    placeholder={isAtoUnico ? 'Ex: 250,00' : 'Ex: 2268,00'}
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                  />

                  <div className={styles.fieldFull}>
                    <span className={styles.subLabel}>Modalidade</span>
                    <SegmentedControl options={opcoesDeModalidade} value={form.modality} onChange={v => set('modality', v)} />
                  </div>

                  <div className={styles.fieldFull}>
                    <Textarea
                      label="Descrição do serviço (pública)"
                      placeholder="O que o serviço/contrato cobre, regras, frequência..."
                      rows={3}
                      value={form.description}
                      onChange={e => set('description', e.target.value)}
                    />
                  </div>
                </div>
              </FormSection>

              {/* ── Cobrança ──
                  ATO ÚNICO some com duração, período, sessões e limite semanal:
                  não existe "consulta de 12 meses", e deixar os campos na tela
                  (mesmo vazios) é o convite para alguém preenchê-los. */}
              <FormSection title={isAtoUnico ? 'Cobrança' : 'Duração & Período'}>
                <div className={styles.fields}>
                  {!isAtoUnico && (
                    <>
                      <Input
                        label={isPackage ? 'Validade (uso)' : 'Duração'}
                        type="number" min={0}
                        value={form.durationQty}
                        onChange={e => set('durationQty', e.target.value)}
                      />
                      <Select
                        label="Período"
                        options={PERIOD_OPTIONS}
                        value={form.durationUnit}
                        onChange={e => set('durationUnit', e.target.value as DurationUnit)}
                      />

                      {isPackage ? (
                        <Input
                          label="Quantidade de sessões"
                          type="number" min={0}
                          value={form.sessions}
                          onChange={e => set('sessions', e.target.value)}
                        />
                      ) : (
                        <Input
                          label="Limite semanal"
                          type="number" min={0}
                          placeholder="Ex: 2 (2x por semana)"
                          value={form.weeklyLimit}
                          onChange={e => set('weeklyLimit', e.target.value)}
                        />
                      )}
                    </>
                  )}

                  <Input
                    label="Máx. Parcelamentos"
                    type="number" min={1}
                    value={form.maxInstallments}
                    onChange={e => set('maxInstallments', e.target.value)}
                  />

                  <p className={`${styles.dica} ${styles.fieldFull}`}>
                    {isAtoUnico
                      ? `${MODALITY_LABEL[form.modality]}: cobrada por atendimento, com o Valor Base como preço de tabela. Sem vigência e sem pacote de sessões.`
                      : isPackage
                        ? 'Pacote de sessões: um número fixo de sessões com validade de uso (ex.: 10 sessões válidas por 90 dias).'
                        : 'Contrato comum: vigência por duração e período (ex.: 12 meses), com o Valor Base parcelável.'}
                  </p>
                </div>
              </FormSection>

              {/* ── TISS ──
                  Só existe quando há convênio cadastrado: clínica que não
                  fatura plano nunca vê estes campos, e mostrá-los "por via das
                  dúvidas" é pedir para alguém preencher código TUSS à toa. */}
              {conveniosAtivos.length > 0 && (
                <FormSection title="Convênio (TISS)">
                  <div className={styles.fields}>
                    <Input
                      label="Código TUSS"
                      placeholder="Ex: 10101012"
                      inputMode="numeric"
                      value={form.tussCode}
                      onChange={e => set('tussCode', e.target.value)}
                    />
                    <Input
                      label="Tabela de origem"
                      placeholder="Ex: 22"
                      inputMode="numeric"
                      value={form.tussTable}
                      onChange={e => set('tussTable', e.target.value)}
                    />

                    <p className={`${styles.dica} ${styles.fieldFull}`}>
                      O código TUSS é o que diz à operadora o que foi feito. A tabela
                      de origem importa junto: 22 é procedimentos e eventos em saúde,
                      18/19/20 são materiais, medicamentos e taxas, 00 é tabela
                      própria da operadora. O mesmo número em tabelas diferentes é
                      procedimento diferente.
                    </p>

                    {selectedId ? (
                      <div className={styles.fieldFull}>
                        <span className={styles.subLabel}>Valor por convênio</span>
                        <p className={styles.dica}>
                          Em branco = sem contrato com aquela operadora. Zero seria
                          "paga R$ 0,00", que é outra coisa.
                        </p>
                        {conveniosAtivos.map(c => (
                          <Input
                            key={c.id}
                            label={c.name}
                            type="number" min={0} step="0.01"
                            placeholder={`Particular: ${formatBRL(Number(form.price) || 0)}`}
                            value={precos[c.id] ?? ''}
                            onChange={e => setPrecos(p => ({ ...p, [c.id]: e.target.value }))}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className={`${styles.dica} ${styles.fieldFull}`}>
                        Cadastre o serviço primeiro — os valores por convênio entram
                        na edição, quando ele já tem registro.
                      </p>
                    )}
                  </div>
                </FormSection>
              )}
            </div>

            <div className={styles.acoesBar}>
              <Button variant="ghost" onClick={handleCancel} disabled={creating || saving}>Cancelar</Button>
              <Button loading={creating || saving} onClick={handleSave}>
                {isNew ? 'Cadastrar' : 'Salvar'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
