import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Select } from '@/components/Select/Select'
import { useToast } from '@/components/Toast/Toast'
import { IconPrint, IconTrash } from '@/components/icons'
import { PaymentForm } from '@/components/SalesPointModal/PaymentForm'
import { PAY_METHOD_LABEL, type Payment } from '@/components/SalesPointModal/types'
import { useClinic } from '@/hooks/useClinic'
import { usePatients } from '@/hooks/usePatients'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { useServices } from '@/hooks/useServices'
import { useCheckoutSale, useSaleByAppointment } from '@/hooks/useSales'
import { SINGLE_ACT_MODALITIES } from '@/types/domain'
import { errorMessage } from '@/utils/errors'
import { formatBRL, formatCnpj, formatCpf } from '@/utils/format'
import { formatLongDate, isoToBrDate, toIsoDate } from '@/utils/date'
import { receiptBody, RECEIPT_STYLES } from '@/utils/receiptDocument'
import styles from './AppointmentCharge.module.scss'

interface AppointmentChargeProps {
  /** A consulta. É por ele que o pagamento fica AMARRADO ao atendimento —
   *  sem isso nada impede cobrar a mesma consulta duas vezes. */
  appointmentId: string
  patientId: string
  /** Nome do convênio do paciente — 'Particular' (ou vazio) libera a cobrança. */
  patientInsurance?: string
  /** aaaa-mm-dd — a venda conta na data do ATENDIMENTO, não na de hoje. */
  dateIso: string
}

/**
 * COBRAR A CONSULTA SEM SAIR DO AGENDAMENTO.
 *
 * Em medicina o dinheiro acontece no fim da consulta, no mesmo gesto de fechar
 * o atendimento — mandar a recepção abrir o Ponto de Venda noutra tela é onde a
 * cobrança se perde. Este painel é o PDV enxuto: um procedimento, as mesmas
 * formas de pagamento, a mesma RPC.
 *
 * ⚠️ SÓ PARA PACIENTE PARTICULAR. Consulta de convênio não é venda: quem paga é
 * a operadora, pelo valor NEGOCIADO, e isso sai por guia TISS (Financeiro →
 * Guias TISS). Cobrar aqui um paciente de plano seria cobrá-lo pelo preço de
 * balcão de um atendimento que ele não deve — e `checkout_sale` lê o preço do
 * catálogo no SERVIDOR, então nem existe como mandar outro valor.
 */
export function AppointmentCharge({ appointmentId, patientId, patientInsurance, dateIso }: AppointmentChargeProps) {
  const toast = useToast()
  const { data: servicos } = useServices()
  const { data: clinica } = useClinic()
  const { data: pacientes } = usePatients()
  const paciente = (pacientes ?? []).find(p => p.id === patientId)
  const imprimir = usePrintDocument()
  const { data: vendaExistente, isLoading: conferindoPagamento } = useSaleByAppointment(appointmentId)
  const { mutate: fecharVenda, isPending } = useCheckoutSale()

  const [serviceId, setServiceId] = useState('')
  const [pagamentos, setPagamentos] = useState<Payment[]>([])

  const temConvenio = Boolean(patientInsurance) && patientInsurance !== 'Particular'
  if (temConvenio) {
    return (
      <p className={styles.avisoConvenio}>
        {patientInsurance} é convênio — esta consulta se fatura por guia TISS, não por venda.
        Financeiro → Guias TISS.
      </p>
    )
  }

  // Consulta e procedimento primeiro: em medicina é o que se cobra no balcão.
  // Contrato e pacote continuam disponíveis, mas embaixo.
  const disponiveis = (servicos ?? []).filter(s => s.status === 'active')
  const atos = disponiveis.filter(s => SINGLE_ACT_MODALITIES.includes(s.modality))
  const demais = disponiveis.filter(s => !SINGLE_ACT_MODALITIES.includes(s.modality))
  const servico = disponiveis.find(s => s.id === serviceId)

  const total = servico?.price ?? 0
  const pago = pagamentos.reduce((s, p) => s + p.amount, 0)
  const saldo = Math.max(0, Math.round((total - pago) * 100) / 100)

  /**
   * RECIBO — o comprovante que o paciente leva.
   *
   * Vale o BRUTO da venda: a taxa da maquininha é custo da clínica com a
   * adquirente, não desconto do paciente (docs/modelo-contabil.md). Imprimir o
   * líquido daria a ele um papel de valor menor do que pagou.
   *
   * Reimprimir é normal — por isso a data é a da VENDA, não a de hoje.
   */
  function imprimirRecibo() {
    if (!vendaExistente) return
    const hojeBr = isoToBrDate(toIsoDate(new Date())) ?? ''
    imprimir({
      title: 'Recibo de pagamento',
      body: receiptBody({
        patientName: paciente?.name ?? '',
        patientCpf: paciente?.cpf ? formatCpf(paciente.cpf) : undefined,
        description: vendaExistente.description,
        amount: vendaExistente.total,
        paymentMethods: vendaExistente.paymentMethods || undefined,
        paidOn: vendaExistente.saleDate,
        longDate: formatLongDate(hojeBr),
        city: clinica?.city,
        clinicName: clinica?.name ?? '',
        clinicCnpj: clinica?.cnpj ? formatCnpj(clinica.cnpj) : undefined,
      }),
      styles: RECEIPT_STYLES,
    })
  }

  function cobrar() {
    if (!servico) return
    fecharVenda({
      patientId,
      saleDateIso: dateIso,
      discount: 0,
      appointmentId,
      items: [{ serviceId: servico.id, quantity: 1 }],
      plan: pagamentos.map(p => ({
        method: p.method,
        amount: p.amount,
        installments: p.installments,
        acquirerId: p.acquirerId,
        cardBrand: p.cardBrand,
        authorizationCode: p.authorizationCode,
      })),
    }, {
      onSuccess: () => {
        toast.success('Venda finalizada.')
        setServiceId('')
        setPagamentos([])
      },
      onError: e => toast.error(errorMessage(e, 'Não foi possível registrar a cobrança.')),
    })
  }

  /**
   * JÁ PAGA — o estado que impede cobrar de novo.
   *
   * A verdade é o banco, não um estado local: a recepção pode ter cobrado
   * noutra aba com este modal aberto, e é exatamente esse caso que a trava
   * precisa pegar. Aqui não há botão de "pagar de novo" — e, se alguém chegar
   * lá por outro caminho, o índice único `sale_appointment_uk` recusa.
   */
  if (conferindoPagamento) {
    return <p className={styles.avisoConvenio}>Conferindo se esta consulta já foi paga…</p>
  }

  if (vendaExistente) {
    return (
      <div className={styles.painel}>
        <div className={styles.finalizada} role="status">
          <strong className={styles.finalizadaTitulo}>Consulta paga</strong>
          <span className={styles.finalizadaValor}>{formatBRL(vendaExistente.total)}</span>
          <span className={styles.finalizadaFormas}>
            {vendaExistente.paymentMethods
              ? `${vendaExistente.paymentMethods} · ${vendaExistente.saleDate}`
              : `Venda registrada em ${vendaExistente.saleDate}`}
          </span>
        </div>
        <div className={styles.rodape}>
          <Button variant="secondary" iconLeft={<IconPrint />} onClick={imprimirRecibo}>
            Imprimir recibo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.painel}>
      <Select
        label="Procedimento"
        options={[
          { value: '', label: 'Selecione…' },
          ...atos.map(s => ({ value: s.id, label: `${s.name} — ${formatBRL(s.price)}` })),
          ...demais.map(s => ({ value: s.id, label: `${s.name} — ${formatBRL(s.price)}` })),
        ]}
        value={serviceId}
        onChange={e => { setServiceId(e.target.value); setPagamentos([]) }}
      />

      {servico && (
        <>
          <div className={styles.totais}>
            <span>Total</span>
            <strong className={styles.total}>{formatBRL(total)}</strong>
          </div>

          {pagamentos.length > 0 && (
            <ul className={styles.pagamentos}>
              {pagamentos.map(p => (
                <li key={p.uid} className={styles.pagamento}>
                  <span>
                    {PAY_METHOD_LABEL[p.method]}
                    {p.installments > 1 ? ` ${p.installments}x` : ''}
                    {p.cardBrand ? ` · ${p.cardBrand}` : ''}
                  </span>
                  <span className={styles.valor}>{formatBRL(p.amount)}</span>
                  <Button
                    variant="ghost" size="sm" iconLeft={<IconTrash />}
                    aria-label="Remover pagamento"
                    onClick={() => setPagamentos(lista => lista.filter(x => x.uid !== p.uid))}
                  />
                </li>
              ))}
            </ul>
          )}

          {saldo > 0 && (
            <PaymentForm
              balance={saldo}
              maxInstallments={servico.maxInstallments}
              onAdd={p => setPagamentos(lista => [...lista, p])}
            />
          )}

          <div className={styles.rodape}>
            {/* Saldo aberto NÃO bloqueia: paciente que pagou metade hoje e deve o
                resto é caso normal, e o recebível pendente nasce do próprio
                checkout_sale. O que não pode é cobrar sem nenhuma forma. */}
            {saldo > 0 && pagamentos.length > 0 && (
              <span className={styles.saldo}>Fica {formatBRL(saldo)} em aberto.</span>
            )}
            <Button
              loading={isPending}
              disabled={pagamentos.length === 0}
              title={pagamentos.length === 0 ? 'Adicione ao menos uma forma de pagamento' : undefined}
              onClick={cobrar}
            >
              Finalizar
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
