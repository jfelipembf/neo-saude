import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { useToast } from '@/components/Toast/Toast'
import { useInsurances } from '@/hooks/useInsurances'
import { usePatients } from '@/hooks/usePatients'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useServices, useServiceInsurancePrices } from '@/hooks/useServices'
import { useCreateTissGuide } from '@/hooks/useTissGuides'
import { errorMessage } from '@/utils/errors'
import { formatBRL } from '@/utils/format'
import { toIsoDate } from '@/utils/date'
import styles from './TissGuidesTab.module.scss'

interface NewTissGuideModalProps {
  open: boolean
  onClose: () => void
}

/** Tipo de consulta — tabela 50 do padrão TISS. */
const CONSULTATION_TYPES = [
  { value: '1', label: 'Primeira consulta' },
  { value: '2', label: 'Seguimento' },
  { value: '3', label: 'Pré-natal' },
  { value: '4', label: 'Por encaminhamento' },
]

/**
 * Nova guia — nasce como RASCUNHO.
 *
 * O modal não valida cadastro nem cobra campo: quem faz isso é a lista, com a
 * checagem de pendências (utils/tissReadiness.ts). Barrar a criação aqui só
 * esconderia o problema — o rascunho existir É o que permite ver o que falta.
 */
export function NewTissGuideModal({ open, onClose }: NewTissGuideModalProps) {
  const toast = useToast()
  const { data: pacientes } = usePatients()
  const { data: convenios } = useInsurances()
  const { data: profissionais } = useProfessionals()
  const { data: servicos } = useServices()
  const { mutate: criar, isPending } = useCreateTissGuide()

  const [patientId, setPatientId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [servedOnIso, setServedOnIso] = useState(() => toIsoDate(new Date()))
  const [consultationType, setConsultationType] = useState('1')
  const [erro, setErro] = useState('')

  // O convênio NÃO é escolhido à mão: vem do cadastro do paciente. Deixar
  // escolher abriria a porta para faturar o atendimento de alguém na operadora
  // errada, que é glosa e constrangimento na mesma conta.
  const paciente = (pacientes ?? []).find(p => p.id === patientId)
  const convenio = (convenios ?? []).find(c => c.name === paciente?.insurance)

  const { data: precos } = useServiceInsurancePrices(serviceId || null)
  const servico = (servicos ?? []).find(s => s.id === serviceId)
  const precoDoConvenio = convenio
    ? precos?.find(p => p.insuranceId === convenio.id)?.price
    : undefined

  // Só pacientes COM convênio: guia TISS de paciente particular não existe.
  const opcoesDePaciente = (pacientes ?? [])
    .filter(p => p.insurance && p.insurance !== 'Particular')
    .map(p => ({ value: p.id, label: `${p.name} — ${p.insurance}` }))

  function handleCriar() {
    if (!patientId || !professionalId || !serviceId) {
      setErro('Escolha paciente, profissional e procedimento.')
      return
    }
    if (!convenio) {
      setErro('Este paciente não tem convênio cadastrado.')
      return
    }
    criar({
      insuranceId: convenio.id,
      patientId,
      professionalId,
      servedOnIso,
      consultationType: Number(consultationType),
      procedimentos: [{
        serviceId,
        // Vazio quando o serviço ainda não tem TUSS — a guia nasce mesmo assim,
        // e a pendência na lista diz exatamente qual serviço completar.
        tussTable: servico?.tussTable ?? '',
        tussCode: servico?.tussCode ?? '',
        description: servico?.name ?? 'Procedimento',
        quantity: 1,
        // Sem preço negociado o valor nasce ZERO, e a pendência aponta a
        // operadora com quem falta contrato. Cair no preço particular seria
        // faturar o plano pelo valor de balcão.
        unitPrice: precoDoConvenio ?? 0,
      }],
    }, {
      onSuccess: () => {
        toast.success('Rascunho de guia criado.')
        setPatientId(''); setProfessionalId(''); setServiceId(''); setErro('')
        onClose()
      },
      onError: e => setErro(errorMessage(e, 'Não foi possível criar a guia.')),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova guia TISS"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button loading={isPending} onClick={handleCriar}>Criar rascunho</Button>
        </>
      }
    >
      <div className={styles.formNova}>
        <Select
          label="Paciente"
          options={[{ value: '', label: 'Selecione…' }, ...opcoesDePaciente]}
          value={patientId}
          onChange={e => { setPatientId(e.target.value); setErro('') }}
        />
        {patientId && !convenio && (
          <p className={styles.pendencia}>
            Este paciente está como particular. Escolha o convênio na ficha dele antes de emitir guia.
          </p>
        )}

        <Select
          label="Profissional executante"
          options={[
            { value: '', label: 'Selecione…' },
            ...(profissionais ?? []).map(p => ({ value: p.id, label: p.name })),
          ]}
          value={professionalId}
          onChange={e => { setProfessionalId(e.target.value); setErro('') }}
        />

        <Select
          label="Procedimento"
          options={[
            { value: '', label: 'Selecione…' },
            ...(servicos ?? []).filter(s => s.status === 'active').map(s => ({ value: s.id, label: s.name })),
          ]}
          value={serviceId}
          onChange={e => { setServiceId(e.target.value); setErro('') }}
        />
        {serviceId && convenio && (
          <p className={precoDoConvenio ? styles.pronta : styles.pendencia}>
            {precoDoConvenio
              ? `${convenio.name} paga ${formatBRL(precoDoConvenio)} por este procedimento.`
              : `Sem valor negociado com ${convenio.name} — a guia nasce com R$ 0,00 e não poderá ser emitida até você cadastrar o valor em Administrativo → Serviços.`}
          </p>
        )}

        <Input
          label="Data do atendimento"
          type="date"
          value={servedOnIso}
          onChange={e => setServedOnIso(e.target.value)}
        />

        <Select
          label="Tipo de consulta"
          options={CONSULTATION_TYPES}
          value={consultationType}
          onChange={e => setConsultationType(e.target.value)}
        />

        {erro && <p className={styles.pendencia}>{erro}</p>}
      </div>
    </Modal>
  )
}
