import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { PatientPicker } from '@/components/PatientPicker/PatientPicker'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/Toast'
import { useInsurances } from '@/hooks/useInsurances'
import { useAddToWaitingList, useUpdateWaitingListEntry } from '@/hooks/useWaitingList'
import { errorMessage } from '@/utils/errors'
import { formatPhone } from '@/utils/format'
import type { WaitingListEntry } from '@/types/domain'
import styles from './WaitingList.module.scss'

interface WaitingListFormProps {
  /** Entrada em edição, ou null para uma nova. */
  entrada: WaitingListEntry | null
  onDone: () => void
}

/**
 * ADICIONAR À LISTA — e editar quem já está nela.
 *
 * Escolher o paciente PREENCHE o contato a partir do cadastro, e o campo
 * continua editável: quase sempre o telefone do cadastro serve, e nas vezes em
 * que não serve ("me liga nesse outro número") é justamente o dado que faz a
 * fila funcionar. Só ler por JOIN faria a recepção ligar para o número velho;
 * só digitar faria ela redigitar o que já está no sistema.
 */
export function WaitingListForm({ entrada, onDone }: WaitingListFormProps) {
  const toast = useToast()
  const { data: convenios } = useInsurances()
  const { mutate: adicionar, isPending: adicionando } = useAddToWaitingList()
  const { mutate: alterar, isPending: alterando } = useUpdateWaitingListEntry()

  const [patientId, setPatientId] = useState(entrada?.patientId ?? '')
  const [insuranceId, setInsuranceId] = useState(entrada?.insuranceId ?? '')
  const [email, setEmail] = useState(entrada?.email ?? '')
  const [celular, setCelular] = useState(formatPhone(entrada?.mobilePhone) || '')
  const [residencial, setResidencial] = useState(formatPhone(entrada?.homePhone) || '')
  const [observacao, setObservacao] = useState(entrada?.notes ?? '')

  const salvando = adicionando || alterando

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (!patientId) return

    const payload = {
      insuranceId: insuranceId || undefined,
      email,
      mobilePhone: celular,
      homePhone: residencial,
      notes: observacao,
    }
    const pronto = {
      onSuccess: () => {
        toast.success(entrada ? 'Entrada atualizada.' : 'Adicionado à lista de espera.')
        onDone()
      },
      onError: (err: unknown) => toast.error(errorMessage(err, 'Não foi possível salvar.')),
    }

    if (entrada) alterar({ id: entrada.id, ...payload }, pronto)
    else adicionar({ patientId, ...payload }, pronto)
  }

  return (
    <form className={styles.form} onSubmit={enviar}>
      <div className={styles.campo}>
        <span className={styles.rotulo}>Paciente *</span>
        <PatientPicker
          value={patientId || null}
          // Editar não troca o paciente: seria a mesma coisa que apagar esta
          // entrada e criar outra, e a data de entrada na fila (a ordem) ficaria
          // valendo para quem não a conquistou.
          disabled={entrada !== null}
          lockedReason={entrada ? 'Para outro paciente, adicione uma nova entrada.' : undefined}
          placeholder="Pesquisar paciente..."
          onChange={p => {
            setPatientId(p?.id ?? '')
            // Preenche o contato a partir do cadastro — sem sobrescrever o que
            // já foi digitado à mão.
            if (!p) return
            setCelular(atual => atual || formatPhone(p.whatsapp || p.phone))
            setResidencial(atual => atual || (p.whatsapp ? formatPhone(p.phone) : ''))
            setEmail(atual => atual || p.email || '')
          }}
        />
      </div>

      <Select
        label="Convênio"
        value={insuranceId}
        onChange={e => setInsuranceId(e.target.value)}
        options={[
          { value: '', label: 'Particular' },
          ...(convenios ?? []).map(c => ({ value: c.id, label: c.name })),
        ]}
      />

      <Input
        label="E-mail"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <div className={styles.grid2}>
        <Input
          label="Telefone celular"
          type="tel"
          placeholder="(79) 99999-0000"
          value={celular}
          onChange={e => setCelular(e.target.value)}
        />
        <Input
          label="Telefone residencial"
          type="tel"
          placeholder="(79) 3200-0000"
          value={residencial}
          onChange={e => setResidencial(e.target.value)}
        />
      </div>

      <Textarea
        label="Observação"
        rows={3}
        placeholder="Só pode de manhã, prefere a Dra. Ana, urgência…"
        value={observacao}
        onChange={e => setObservacao(e.target.value)}
      />

      <div className={styles.formAcoes}>
        <Button variant="ghost" onClick={onDone} disabled={salvando}>Cancelar</Button>
        <Button type="submit" loading={salvando} disabled={!patientId}>
          {entrada ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}
