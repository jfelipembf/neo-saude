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
import { useToast } from '@/components/Toast/useToast'
import { useServices, useCreateService, useUpdateService } from '@/hooks/useServices'
import { formatBRL } from '@/utils/format'
import type { EditService } from '@/services/servicesService'
import type { Service, ServiceModality, DurationUnit } from '@/types/domain'
import styles from './ServicesTab.module.scss'

const MODALITY_OPTIONS: { value: ServiceModality; label: string }[] = [
  { value: 'common',  label: 'Contrato Comum' },
  { value: 'package', label: 'Pacote de sessões' },
]
const PERIOD_OPTIONS: { value: DurationUnit; label: string }[] = [
  { value: 'days',   label: 'Dias' },
  { value: 'weeks',  label: 'Semanas' },
  { value: 'months', label: 'Meses' },
]
const periodLabel = (u: DurationUnit) => PERIOD_OPTIONS.find(o => o.value === u)?.label.toLowerCase() ?? ''

function serviceSub(s: Service): string {
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
}

const EMPTY_FORM: ServiceFormState = {
  name: '', modality: 'common', price: '', durationQty: '', durationUnit: 'months',
  sessions: '', weeklyLimit: '', maxInstallments: '1', description: '', active: true,
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
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')

  if (isLoading) return <PageLoader />

  const list = services ?? []
  const isFormVisible = selectedId !== null || isNew
  const isPackage = form.modality === 'package'

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
    setForm(EMPTY_FORM)
    setNameError('')
  }

  function handleCancel() {
    setSelectedId(null)
    setIsNew(false)
    setForm(EMPTY_FORM)
    setNameError('')
  }

  function handleSave() {
    if (!form.name.trim()) { setNameError('Informe o nome do serviço.'); return }

    const num = (v: string) => Math.max(0, Number(v) || 0)
    const payload: EditService = {
      name: form.name.trim(),
      modality: form.modality,
      price: num(form.price),
      durationQty: num(form.durationQty),
      durationUnit: form.durationUnit,
      sessions: form.modality === 'package' ? num(form.sessions) : undefined,
      weeklyLimit: form.modality === 'common' && form.weeklyLimit.trim() !== '' ? num(form.weeklyLimit) : undefined,
      maxInstallments: Math.max(1, num(form.maxInstallments) || 1),
      description: form.description.trim() || undefined,
      status: form.active ? 'active' : 'inactive',
    }
    const opts = {
      onSuccess: () => {
        toast.success(selectedId ? 'Serviço atualizado!' : 'Serviço cadastrado!')
        handleCancel()
      },
    }
    if (selectedId) update({ id: selectedId, payload }, opts)
    else create(payload, opts)
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
                    label="Valor Base (R$)"
                    type="number" min={0} step="0.01"
                    placeholder="Ex: 2268,00"
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                  />

                  <div className={styles.fieldFull}>
                    <span className={styles.subLabel}>Modalidade</span>
                    <SegmentedControl options={MODALITY_OPTIONS} value={form.modality} onChange={v => set('modality', v)} />
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

              {/* ── Duração & Período ── */}
              <FormSection title="Duração & Período">
                <div className={styles.fields}>
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

                  {isPackage && (
                    <Input
                      label="Quantidade de sessões"
                      type="number" min={0}
                      value={form.sessions}
                      onChange={e => set('sessions', e.target.value)}
                    />
                  )}

                  {!isPackage && (
                    <Input
                      label="Limite semanal"
                      type="number" min={0}
                      placeholder="Ex: 2 (2x por semana)"
                      value={form.weeklyLimit}
                      onChange={e => set('weeklyLimit', e.target.value)}
                    />
                  )}

                  <Input
                    label="Máx. Parcelamentos"
                    type="number" min={1}
                    value={form.maxInstallments}
                    onChange={e => set('maxInstallments', e.target.value)}
                  />

                  <p className={`${styles.dica} ${styles.fieldFull}`}>
                    {isPackage
                      ? 'Pacote de sessões: um número fixo de sessões com validade de uso (ex.: 10 sessões válidas por 90 dias).'
                      : 'Contrato comum: vigência por duração e período (ex.: 12 meses), com o Valor Base parcelável.'}
                  </p>
                </div>
              </FormSection>
            </div>

            <div className={styles.acoesBar}>
              <Button variant="ghost" onClick={handleCancel} disabled={creating || saving}>Cancelar</Button>
              <Button loading={creating || saving} onClick={handleSave}>
                {isNew ? 'Cadastrar' : 'Salvar alterações'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
