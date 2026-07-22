import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { useBillTreatmentSession } from '@/hooks/useFinance'
import { formatBRL } from '@/utils/format'
import { brToIsoDate, isoToBrDate } from '@/utils/date'
import type { UnbilledSession } from '@/types/domain'
import styles from './UnbilledTab.module.scss'
import shared from '../shared/finance.module.scss'

const MODE_OPTIONS = [
  { value: 'charge', label: 'Gerar cobrança' },
  { value: 'courtesy', label: 'Não cobrar' },
] as const

type Mode = (typeof MODE_OPTIONS)[number]['value']

interface BillSessionModalProps {
  session: UnbilledSession
  onClose: () => void
}

/**
 * Resolve UM procedimento parado em "A faturar": vira título ou vira cortesia
 * registrada. Os dois desfechos tiram a linha da lista — que é o ponto: rede de
 * segurança que nunca esvazia deixa de ser lida em duas semanas.
 *
 * Quem decide de verdade continua sendo o banco (a RPC delega para a mesma
 * escada do salvamento). Se o paciente ganhou um contrato aprovado enquanto o
 * procedimento esperava aqui, o resultado volta 'covered' e NÃO nasce título —
 * e a tela diz isso em vez de fingir que cobrou.
 */
export function BillSessionModal({ session, onClose }: BillSessionModalProps) {
  const toast = useToast()
  const { mutate: bill, isPending } = useBillTreatmentSession()

  const [mode, setMode] = useState<Mode>('charge')
  const [dueDateIso, setDueDateIso] = useState(() => brToIsoDate(session.date) ?? '')
  const [reason, setReason] = useState('')
  // As duas travas do banco (convênio e contrato JÁ QUITADO) impedem cobrar
  // sozinho. Aqui elas só caem com um "sim" explícito — e o texto diz o que
  // está em jogo em cada uma.
  const [chargeAnyway, setChargeAnyway] = useState(false)
  const [error, setError] = useState('')

  const needsConfirmation = session.hasInsurance || !!session.pendingQuoteCode
  const blockedByGuard = mode === 'charge' && needsConfirmation && !chargeAnyway

  function confirm() {
    if (mode === 'courtesy' && !reason.trim()) {
      setError('Escreva o motivo — “não cobrei” sem motivo é rombo sem autor.')
      return
    }
    bill(
      {
        sessionId: session.id,
        input: mode === 'courtesy'
          ? { notBillableReason: reason.trim() }
          : { dueDate: isoToBrDate(dueDateIso), chargeAnyway },
      },
      {
        onSuccess: status => {
          if (status === 'billed') toast.success(`Cobrança de ${formatBRL(session.amount)} gerada.`)
          else if (status === 'not_billable') toast.success('Registrado como cortesia — não gera cobrança.')
          else if (status === 'covered') toast.success('Abatido de um contrato aprovado — nenhuma cobrança nova foi criada.')
          else toast.success('Procedimento continua em “A faturar”: a trava do banco não deixou cobrar automaticamente.')
          onClose()
        },
        onError: e => setError(e instanceof Error ? e.message : 'Não foi possível faturar agora.'),
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Faturar procedimento"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button loading={isPending} disabled={blockedByGuard} onClick={confirm}>
            {mode === 'courtesy' ? 'Registrar cortesia' : 'Gerar cobrança'}
          </Button>
        </>
      }
    >
      <div className={shared.formCorpo}>
        <p className={styles.resumoModal}>
          <strong>{session.description}</strong> · {session.patientName} · executado em {session.date} ·{' '}
          <span className={shared.valor}>{formatBRL(session.amount)}</span>
        </p>

        <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={setMode} />

        {mode === 'courtesy' ? (
          <Input
            label="Motivo"
            placeholder="Ex: Garantia de 90 dias do procedimento anterior"
            value={reason}
            onChange={e => { setReason(e.target.value); setError('') }}
            autoFocus
          />
        ) : (
          <>
            <Input
              label="Vencimento"
              type="date"
              hint="Padrão: o dia em que o procedimento foi executado."
              value={dueDateIso}
              onChange={e => setDueDateIso(e.target.value)}
            />
            {needsConfirmation && (
              <div className={styles.convenio}>
                <p className={styles.convenioTexto}>
                  {session.pendingQuoteCode ? (
                    <>
                      Este paciente tem o contrato <strong>{session.pendingQuoteCode}</strong> aprovado
                      e <strong>já quitado</strong>, com valor de plano ainda não consumido. Se este
                      procedimento fizer parte daquele plano, cobrar agora é cobrar duas vezes o que
                      ele já pagou. Confira o contrato antes de dizer que sim.
                    </>
                  ) : (
                    <>
                      Paciente de <strong>convênio</strong>. O valor cheio do particular não é,
                      automaticamente, a conta dele — por isso este procedimento parou aqui. Cobrar o
                      paciente é uma decisão da clínica, e precisa ser dita.
                    </>
                  )}
                </p>
                <Toggle label="Cobrar do paciente mesmo assim" checked={chargeAnyway} onChange={setChargeAnyway} />
              </div>
            )}
          </>
        )}

        {error && <p className={shared.erro}>{error}</p>}
      </div>
    </Modal>
  )
}
