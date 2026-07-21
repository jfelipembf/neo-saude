import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { useCriarTratamento } from '@/hooks/useTratamentos'
import { toIsoDate } from '@/utils/date'
import type { StatusDente } from '@/types/domain'
import styles from './TreatmentsPanel.module.scss'

const OPCOES_SITUACAO = [
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'em_aberto',  label: 'Em aberto' },
  { value: 'extraido',   label: 'Extraído' },
]

// Todos os dentes em notação FDI: permanentes (11–48) + decíduos (51–85).
const DENTES_FDI = [
  '18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28',
  '48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38',
  '55', '54', '53', '52', '51', '61', '62', '63', '64', '65',
  '85', '84', '83', '82', '81', '71', '72', '73', '74', '75',
]

const OPCOES_DENTE = DENTES_FDI.map(n => ({ value: n, label: `Dente ${n}` }))

interface TreatmentFormModalProps {
  pacienteId: string
  /** Dente pré-selecionado (notação FDI) — sem ele, o modal mostra o seletor. */
  dente?: string
  onClose: () => void
}

/** Modal de tratamento: registra o que foi feito num dente naquele dia. */
export function TreatmentFormModal({ pacienteId, dente: dentePreset, onClose }: TreatmentFormModalProps) {
  const toast = useToast()
  const { mutate: criar, isPending: criando } = useCriarTratamento()

  const [dente, setDente] = useState(dentePreset ?? '')
  const [procedimento, setProcedimento] = useState('')
  const [dataIso, setDataIso] = useState(() => toIsoDate(new Date()))
  const [status, setStatus] = useState<StatusDente>('finalizado')
  const [observacao, setObservacao] = useState('')
  const [erroDente, setErroDente] = useState('')
  const [erroProcedimento, setErroProcedimento] = useState('')

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    if (!dente) {
      setErroDente('Selecione o dente.')
      return
    }
    if (!procedimento.trim()) {
      setErroProcedimento('Informe o procedimento realizado.')
      return
    }
    criar(
      {
        pacienteId,
        dente,
        procedimento: procedimento.trim(),
        data: dataIso.split('-').reverse().join('/'),
        status,
        observacao: observacao.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Tratamento registrado!')
          onClose()
        },
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={dentePreset ? `Dente ${dentePreset} — novo tratamento` : 'Novo tratamento'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-tratamento" loading={criando}>
            Salvar
          </Button>
        </>
      }
    >
      <form id="form-tratamento" className={styles.form} onSubmit={aoSalvar}>
        {!dentePreset && (
          <Select
            label="Dente"
            options={OPCOES_DENTE}
            placeholder="Selecione o dente..."
            value={dente}
            onChange={e => { setDente(e.target.value); setErroDente('') }}
            error={erroDente}
          />
        )}
        <Input
          label="Procedimento"
          placeholder="Ex: Restauração em resina composta"
          value={procedimento}
          onChange={e => { setProcedimento(e.target.value); setErroProcedimento('') }}
          error={erroProcedimento}
          autoFocus
        />
        <Input
          label="Data"
          type="date"
          value={dataIso}
          onChange={e => setDataIso(e.target.value)}
        />
        <Select
          label="Situação"
          options={OPCOES_SITUACAO}
          value={status}
          onChange={e => setStatus(e.target.value as StatusDente)}
        />
        <Textarea
          label="Observação (opcional)"
          placeholder="Ex: Cárie oclusal — resina A2"
          rows={3}
          value={observacao}
          onChange={e => setObservacao(e.target.value)}
        />
      </form>
    </Modal>
  )
}
