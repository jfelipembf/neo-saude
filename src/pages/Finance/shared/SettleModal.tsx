import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useContasBancarias } from '@/hooks/useFinanceiro'
import { OPCOES_FORMA_PAGAMENTO } from '@/constants'
import { parseReais } from '@/utils/format'
import { toIsoDate } from '@/utils/date'
import type { SettlementInput } from '@/services/financeiroService'
import type { PaymentMethod } from '@/types/domain'
import styles from './finance.module.scss'

interface SettleModalProps {
  titulo: string
  confirmLabel: string
  dataLabel: string
  valorLabel: string
  hintValor?: string
  valorInicial: number
  confirmando: boolean
  onClose: () => void
  onConfirm: (baixa: SettlementInput) => void
}

/** Modal de baixa (Confirmar Pagamento / Recebimento) — usado pelas abas
 *  Contas a Pagar e Contas a Receber: data, forma, conta, valor e observação. */
export function SettleModal({
  titulo, confirmLabel, dataLabel, valorLabel, hintValor,
  valorInicial, confirmando, onClose, onConfirm,
}: SettleModalProps) {
  const { data: contas } = useContasBancarias()

  const [dataIso, setDataIso] = useState(() => toIsoDate(new Date()))
  const [forma, setForma] = useState('')
  const [contaId, setContaId] = useState('')
  const [valorTexto, setValorTexto] = useState(() =>
    valorInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  )
  const [observacao, setObservacao] = useState('')
  const [erroValor, setErroValor] = useState('')

  const opcoesConta = (contas ?? []).map(c => ({ value: c.id, label: c.nome }))

  function confirmar() {
    const valor = parseReais(valorTexto)
    if (!Number.isFinite(valor) || valor <= 0) {
      setErroValor('Informe um valor válido.')
      return
    }
    onConfirm({
      data: dataIso.split('-').reverse().join('/'),
      forma: (forma || undefined) as PaymentMethod | undefined,
      contaBancariaId: contaId || undefined,
      valor,
      observacao: observacao.trim() || undefined,
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={titulo}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={confirmando}>Cancelar</Button>
          <Button loading={confirmando} onClick={confirmar}>{confirmLabel}</Button>
        </>
      }
    >
      <div className={styles.fields}>
        <Input label={dataLabel} type="date" value={dataIso} onChange={e => setDataIso(e.target.value)} />
        <Select
          label="Forma de pagamento"
          placeholder="Selecione..."
          options={OPCOES_FORMA_PAGAMENTO}
          value={forma}
          onChange={e => setForma(e.target.value)}
        />
        <Select
          label="Conta bancária"
          placeholder="Selecione a conta..."
          options={opcoesConta}
          value={contaId}
          onChange={e => setContaId(e.target.value)}
        />
        <Input
          label={valorLabel}
          iconLeft={<span className={styles.prefixo}>R$</span>}
          inputMode="decimal"
          value={valorTexto}
          onChange={e => { setValorTexto(e.target.value); setErroValor('') }}
          error={erroValor}
          hint={hintValor}
        />
        <div className={styles.fieldFull}>
          <Textarea
            label="Observação"
            rows={2}
            placeholder="Nota interna sobre esta baixa (opcional)"
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
