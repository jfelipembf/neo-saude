import { useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { usePagination } from '@/hooks/usePagination'
import { usePatientPrescriptions, useCreatePrescription } from '@/hooks/usePrescriptions'
import { useCurrentUser } from '@/hooks/useUser'
import { useProfessionalName } from '@/hooks/useDisplayNames'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { esc } from '@/utils/printDocument'
import { toIsoDate } from '@/utils/date'
import { IconPlus, IconPrint, IconX, IconDocument } from '@/components/icons'
import type { PrescribedMedication, Prescription, PrescriptionType } from '@/types/domain'
import styles from './PrescriptionsPanel.module.scss'

const TYPE_OPTIONS: { value: PrescriptionType; label: string }[] = [
  { value: 'prescription', label: 'Receituário' },
  { value: 'clinical_record',  label: 'Prontuário' },
  { value: 'certificate',    label: 'Atestado' },
  { value: 'document',   label: 'Documento' },
]

const FILTER_OPTIONS = [{ value: 'all', label: 'Todos os tipos' }, ...TYPE_OPTIONS]

/** Texto-modelo do atestado — os dados do paciente entram sozinhos (padrão
 *  dos softwares do ramo); o texto continua editável antes de salvar. */
function certificateText(patientName: string | undefined, days: number) {
  return `Atesto, para os devidos fins, que ${patientName ?? 'o(a) paciente'} esteve sob meus cuidados profissionais nesta data, necessitando de ${days} dia(s) de afastamento de suas atividades a partir de hoje.`
}

/** Rótulo do tipo da prescrição ("Receituário", "Atestado"…). */
function typeLabel(p: Prescription) {
  return TYPE_OPTIONS.find(t => t.value === p.type)?.label ?? p.title
}

/** CSS específico do receituário — o resto vem da base de impressão. */
const PRESCRIPTION_STYLES = `
  .meds { margin: 16px 0 0 20px; padding: 0; } .meds li { margin: 12px 0; font-size: 14px; }
  .pos { color: #334; font-size: 13px; }
  .texto { margin-top: 16px; font-size: 13.5px; line-height: 1.6; }
  .assinatura { margin-top: 72px; text-align: center; }
  .assinatura .linha { display: inline-block; border-top: 1px solid #12211C; padding-top: 6px;
                       min-width: 260px; font-size: 13px; }
`

/** Miolo da prescrição/documento — cabeçalho da clínica vem da base. */
function prescriptionBody(
  p: Prescription,
  professionalName: (id?: string) => string,
  patientName?: string,
) {
  const content = p.type === 'prescription'
    ? `<ol class="meds">${(p.medications ?? [])
        .map(m => `<li><strong>${esc(m.name)}</strong>${m.quantity ? ` — ${esc(m.quantity)}` : ''}<br><span class="pos">${esc(m.dosage)}</span></li>`)
        .join('')}</ol>`
    : `<p class="texto">${esc(p.text ?? '').replace(/\n/g, '<br>')}</p>`

  return `
    ${patientName ? `<p><strong>Paciente:</strong> ${esc(patientName)}</p>` : ''}
    <p><strong>Data:</strong> ${esc(p.date)}</p>
    ${content}
    ${p.notes ? `<p class="clausula"><strong>Observações:</strong> ${esc(p.notes)}</p>` : ''}
    <div class="assinatura"><span class="linha">${esc(professionalName(p.professionalId))}</span></div>`
}

interface PrescriptionsPanelProps {
  patientId: string
  /** Nome usado no texto do atestado e na impressão. */
  patientName?: string
}

/**
 * Aba "Prescrições": emite receituário (medicamentos + posologia), evolução
 * de prontuário, atestado com texto-modelo e documento personalizado — tudo
 * com histórico, expansão e impressão.
 */
export function PrescriptionsPanel({ patientId, patientName }: PrescriptionsPanelProps) {
  const toast = useToast()
  const { data: prescriptions, isLoading } = usePatientPrescriptions(patientId)
  const { data: user } = useCurrentUser()
  const professionalName = useProfessionalName()
  const { mutate: create, isPending: creating } = useCreatePrescription()
  const printDocument = usePrintDocument()

  const [typeFilter, setTypeFilter] = useState<'all' | PrescriptionType>('all')

  // Modal "Nova prescrição".
  const [modalOpen, setModalOpen] = useState(false)
  const [type, setType] = useState<PrescriptionType>('prescription')
  const [dateIso, setDateIso] = useState(() => toIsoDate(new Date()))
  const [medications, setMedications] = useState<PrescribedMedication[]>([])
  const [days, setDays] = useState('1')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const filtered = (prescriptions ?? []).filter(p => typeFilter === 'all' || p.type === typeFilter)
  const pagination = usePagination(filtered)

  if (isLoading) {
    return <div className={styles.carregando}><Spinner size="lg" /></div>
  }

  const list = prescriptions ?? []

  function openModal() {
    setType('prescription')
    setDateIso(toIsoDate(new Date()))
    setMedications([{ name: '', dosage: '', quantity: '' }])
    setDays('1')
    setTitle('')
    setText('')
    setNotes('')
    setError('')
    setModalOpen(true)
  }

  // Trocar o tipo prepara os campos daquele modelo (atestado já vem escrito).
  function changeType(newType: PrescriptionType) {
    setType(newType)
    setError('')
    if (newType === 'certificate') setText(certificateText(patientName, Number(days) || 1))
    else if (newType !== type) setText('')
  }

  function changeDays(value: string) {
    setDays(value)
    // O modelo re-escreve o texto — edições manuais valem após ajustar os dias.
    setText(certificateText(patientName, Number(value) || 1))
  }

  function changeMedication(index: number, field: keyof PrescribedMedication, value: string) {
    setMedications(current => current.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }

  function handleSave() {
    const dateBr = dateIso.split('-').reverse().join('/')
    const meds = medications
      .map(m => ({ name: m.name.trim(), dosage: m.dosage.trim(), quantity: m.quantity?.trim() || undefined }))
      .filter(m => m.name)

    if (type === 'prescription' && meds.length === 0) {
      setError('Adicione ao menos um medicamento.')
      return
    }
    if (type !== 'prescription' && !text.trim()) {
      setError('Escreva o conteúdo do documento.')
      return
    }
    if (type === 'document' && !title.trim()) {
      setError('Dê um título ao documento.')
      return
    }

    const titles: Record<PrescriptionType, string> = {
      prescription: 'Receituário',
      clinical_record: 'Evolução clínica',
      certificate: `Atestado — ${Number(days) || 1} dia(s)`,
      document: title.trim(),
    }

    create(
      {
        patientId,
        type,
        title: titles[type],
        date: dateBr,
        professionalId: user?.professionalId,
        medications: type === 'prescription' ? meds : undefined,
        text: type === 'prescription' ? undefined : text.trim(),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Prescrição emitida!')
          setModalOpen(false)
        },
      },
    )
  }

  const columns: TableColumn<Prescription>[] = [
    { key: 'date', label: 'Data', render: p => <span className={styles.data}>{p.date}</span> },
    { key: 'type', label: 'Tipo', render: p => <Badge status={p.type} /> },
    { key: 'title', label: 'Título', render: p => <span className={styles.titulo}>{p.title}</span> },
    { key: 'professional', label: 'Profissional', render: p => professionalName(p.professionalId) },
    {
      key: 'actions',
      label: 'Ação',
      render: p => (
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<IconPrint />}
          title="Imprimir"
          aria-label={`Imprimir ${p.title}`}
          onClick={() => printDocument({
            title: typeLabel(p),
            subtitle: p.title && p.title !== typeLabel(p) ? p.title : undefined,
            body: prescriptionBody(p, professionalName, patientName),
            styles: PRESCRIPTION_STYLES,
            width: 640,
          })}
        />
      ),
    },
  ]

  return (
    <div className={styles.painel}>
      <header className={styles.cabecalho}>
        <div>
          <h2 className={styles.cabecalhoTitulo}>Prescrições e documentos</h2>
          <p className={styles.cabecalhoHint}>Receituário, evolução de prontuário, atestado e documentos personalizados.</p>
        </div>
        <Button iconLeft={<IconPlus />} onClick={openModal}>Nova prescrição</Button>
      </header>

      {list.length === 0 ? (
        <EmptyState
          icon={<IconDocument />}
          title="Nenhuma prescrição emitida"
          description="Emita receituários, atestados e documentos — tudo fica no histórico do paciente, pronto para reimprimir."
          action={<Button iconLeft={<IconPlus />} onClick={openModal}>Nova prescrição</Button>}
        />
      ) : (
        <Table
          columns={columns}
          data={pagination.visible}
          rowKey={p => p.id}
          emptyMessage="Nenhuma prescrição para o filtro."
          renderExpanded={p => (
            <div className={styles.detalhe}>
              {p.type === 'prescription' ? (
                <ol className={styles.meds}>
                  {(p.medications ?? []).map((m, i) => (
                    <li key={`${m.name}-${i}`} className={styles.med}>
                      <span className={styles.medNome}>
                        {m.name}{m.quantity ? <span className={styles.medQtd}> — {m.quantity}</span> : null}
                      </span>
                      <span className={styles.medPosologia}>{m.dosage}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.texto}>{p.text}</p>
              )}
              {p.notes && <p className={styles.obs}>Observações: {p.notes}</p>}
            </div>
          )}
          toolbar={
            <>
              <PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />
              <Select
                size="sm"
                options={FILTER_OPTIONS}
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value as 'all' | PrescriptionType); pagination.setPage(1) }}
                aria-label="Filtrar por tipo"
                className={styles.filtroTipo}
              />
            </>
          }
          footer={
            <Pagination
              page={pagination.currentPage}
              totalPages={pagination.totalPages}
              onChange={pagination.setPage}
              totalItems={pagination.total}
              itemsPerPage={pagination.perPage}
            />
          }
        />
      )}

      {/* ── Modal: nova prescrição ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova prescrição"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={creating}>Cancelar</Button>
            <Button loading={creating} onClick={handleSave}>Emitir</Button>
          </>
        }
      >
        <div className={styles.modalCorpo}>
          <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={changeType} />

          <div className={styles.linhaData}>
            <Input
              label="Data"
              type="date"
              value={dateIso}
              onChange={e => setDateIso(e.target.value)}
            />
            {type === 'certificate' && (
              <Input
                label="Dias de afastamento"
                type="number"
                min={1}
                value={days}
                onChange={e => changeDays(e.target.value)}
              />
            )}
            {type === 'document' && (
              <Input
                label="Título do documento"
                placeholder="Ex: Orientações pós-operatórias"
                value={title}
                onChange={e => { setTitle(e.target.value); setError('') }}
              />
            )}
          </div>

          {type === 'prescription' ? (
            <div className={styles.medsEditor}>
              <span className={styles.medsRotulo}>Medicamentos</span>
              {medications.map((m, i) => (
                <div key={i} className={styles.medLinha}>
                  <Input
                    placeholder="Medicamento — ex: Amoxicilina 500 mg"
                    value={m.name}
                    onChange={e => { changeMedication(i, 'name', e.target.value); setError('') }}
                    aria-label={`Medicamento ${i + 1}`}
                  />
                  <Input
                    placeholder="Posologia — ex: 1 cápsula a cada 8h por 7 dias"
                    value={m.dosage}
                    onChange={e => changeMedication(i, 'dosage', e.target.value)}
                    aria-label={`Posologia do medicamento ${i + 1}`}
                  />
                  <Input
                    placeholder="Qtd — ex: 1 caixa"
                    value={m.quantity ?? ''}
                    onChange={e => changeMedication(i, 'quantity', e.target.value)}
                    aria-label={`Quantidade do medicamento ${i + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<IconX />}
                    onClick={() => setMedications(current => current.filter((_, j) => j !== i))}
                    title="Remover medicamento"
                    aria-label={`Remover medicamento ${i + 1}`}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                iconLeft={<IconPlus />}
                className={styles.medsAdicionar}
                onClick={() => setMedications(current => [...current, { name: '', dosage: '', quantity: '' }])}
              >
                Adicionar medicamento
              </Button>
            </div>
          ) : (
            <Textarea
              label={type === 'clinical_record' ? 'Evolução clínica' : type === 'certificate' ? 'Texto do atestado' : 'Conteúdo do documento'}
              placeholder={type === 'clinical_record' ? 'O que foi observado e realizado no atendimento...' : 'Escreva o conteúdo...'}
              rows={type === 'certificate' ? 4 : 6}
              value={text}
              onChange={e => { setText(e.target.value); setError('') }}
            />
          )}

          {type === 'prescription' && (
            <Textarea
              label="Observações"
              placeholder="Orientações gerais que saem no receituário impresso."
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          )}

          {error && <p className={styles.erro}>{error}</p>}
        </div>
      </Modal>
    </div>
  )
}
