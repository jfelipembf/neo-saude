import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Spinner } from '@/components/Spinner/Spinner'
import { useSession } from '@/context/SessionProvider'
import { useAcquirers } from '@/hooks/useFinance'
import { PAYMENT_METHOD_LABEL } from '@/constants'
import { formatBRL } from '@/utils/format'
import { brToIsoDate, isoToBrDate } from '@/utils/date'
import type { PaymentMethod, SessionBillingChoice, SessionBillingPreview } from '@/types/domain'
import styles from './SessionBillingLine.module.scss'

/** Formas que a recepção lança na hora do procedimento. Cheque e TED não entram:
 *  não são pagamento de balcão e ninguém os escolhe com o paciente na cadeira. */
const COUNTER_METHODS: PaymentMethod[] = ['pix', 'cash', 'credit', 'debit', 'boleto']

const MODE_OPTIONS = [
  { value: 'charge', label: 'Cobrar' },
  { value: 'courtesy', label: 'Não cobrar' },
] as const

type BillingMode = (typeof MODE_OPTIONS)[number]['value']

interface SessionBillingLineProps {
  preview?: SessionBillingPreview
  loading: boolean
  error?: string
  /** Valor digitado — separa "sem valor" de "com valor e mesmo assim não cobra". */
  amount?: number
  /** Data do procedimento (dd/mm/aaaa) — o vencimento padrão do título. */
  performedOn: string
  billing: SessionBillingChoice
  onChange: (billing: SessionBillingChoice) => void
  editing: boolean
  onToggleEditing: () => void
}

/** A frase de UMA LINHA: o que vai acontecer com o dinheiro ao salvar. */
function summary(preview: SessionBillingPreview, amount?: number): string {
  switch (preview.status) {
    case 'billed': {
      const card = preview.installments
      if (card.length > 1) {
        const total = card.reduce((s, i) => s + i.netAmount, 0)
        return `Gera ${card.length}× no cartão · líquido ${formatBRL(total)}, repasses de ${card[0].dueDate} a ${card[card.length - 1].dueDate}.`
      }
      if (card.length === 1) {
        return `Gera cobrança de ${formatBRL(card[0].grossAmount)} no cartão · líquido ${formatBRL(card[0].netAmount)}, repasse em ${card[0].dueDate}.`
      }
      return `Gera cobrança${amount ? ` de ${formatBRL(amount)}` : ''}${preview.dueDate ? `, vence em ${preview.dueDate}` : ''}.`
    }
    case 'covered':
      return `Abate do contrato ${preview.quoteCode ?? 'aprovado'} — não gera cobrança nova.`
    case 'not_billable':
      return 'Cortesia: não gera cobrança, e o motivo fica registrado.'
    case 'unbilled':
      // Três ausências de cobrança MUITO diferentes: sem valor é procedimento
      // que não é dinheiro (retorno); com valor pode ser a trava do convênio ou
      // a do contrato já quitado — e essa segunda é a que evita cobrar de novo
      // o que o paciente já pagou. Todas vão para "A faturar", onde alguém
      // resolve; dizer qual é evita que o dentista prometa a coisa errada.
      if (!amount) return 'Sem valor informado: não gera cobrança.'
      return preview.pendingQuoteCode
        ? `Contrato ${preview.pendingQuoteCode} já quitado e com plano em aberto: não cobra de novo por conta própria — fica em “A faturar”.`
        : 'Paciente de convênio: não cobra o particular automaticamente — fica em “A faturar”.'
  }
}

/**
 * O reflexo financeiro do procedimento, dentro do diálogo que o profissional
 * JÁ VÊ ao salvar. Não é uma pergunta nova: é uma frase, e o caminho padrão
 * continua sendo um clique só. Trocar é escolha, não etapa.
 *
 * A frase inteira vem da RPC `preview_session_billing` — mesma escada e mesmo
 * cálculo de parcelas que o salvamento vai usar. Nada aqui é recalculado no
 * navegador, porque o dentista não tem permissão de Financeiro e uma conta
 * local sobre contratos voltaria vazia (e mentindo).
 */
export function SessionBillingLine({
  preview, loading, error, amount, performedOn, billing, onChange, editing, onToggleEditing,
}: SessionBillingLineProps) {
  const { canView } = useSession()
  // Forma de pagamento é da RECEPÇÃO, não do dentista — e a leitura das
  // adquirentes exige a feature 'finance' de qualquer jeito. Quem não tem
  // Financeiro vê só "cobrar × não cobrar" e o vencimento.
  const showsSettlement = canView('finance')
  const { data: acquirers } = useAcquirers()
  const activeAcquirers = (acquirers ?? []).filter(a => a.status === 'active')

  const mode: BillingMode = billing.notBillableReason !== undefined ? 'courtesy' : 'charge'
  const isCard = billing.method === 'credit' || billing.method === 'debit'
  // Cortesia escolhida e motivo ainda em branco: a prévia do banco (que só
  // entende motivo ESCRITO) responderia "gera cobrança", contradizendo o que o
  // usuário acabou de marcar na tela. Dizer o que falta é melhor que mentir.
  const awaitingReason = mode === 'courtesy' && !billing.notBillableReason?.trim()

  function changeMode(next: BillingMode) {
    // Trocar de modo LIMPA o que era do outro modo: cortesia com forma de
    // pagamento pendurada seria contradição salva no banco.
    onChange(next === 'courtesy' ? { notBillableReason: '' } : {})
  }

  if (loading) {
    return (
      <p className={styles.linha}>
        <Spinner size="sm" />
        <span className={styles.texto}>Conferindo o que acontece com o valor…</span>
      </p>
    )
  }

  if (error || !preview) {
    return (
      <p className={`${styles.linha} ${styles.linhaErro}`}>
        <span className={styles.texto}>
          Não deu para conferir o reflexo financeiro agora. O procedimento salva mesmo assim, e o
          Financeiro decide pela regra da clínica.
        </span>
      </p>
    )
  }

  return (
    <div className={styles.bloco}>
      <p className={styles.linha}>
        <span
          className={`${styles.marcador} ${styles[`marcador--${awaitingReason ? 'not_billable' : preview.status}`]}`}
          aria-hidden="true"
        />
        <span className={styles.texto}>
          {awaitingReason ? 'Escreva o motivo para não cobrar.' : summary(preview, amount)}
        </span>
        {/* 'covered' não tem o que trocar: a dívida já nasceu no contrato, e
            oferecer "cobrar mesmo assim" aqui seria oferecer cobrança dupla. */}
        {preview.status !== 'covered' && (
          <Button variant="ghost" size="sm" onClick={onToggleEditing}>
            {editing ? 'Fechar' : 'Trocar'}
          </Button>
        )}
      </p>

      {editing && (
        <div className={styles.editor}>
          <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={changeMode} />

          {mode === 'courtesy' ? (
            <Input
              label="Motivo"
              placeholder="Ex: Garantia de 90 dias do procedimento anterior"
              hint="Obrigatório: “não cobrei” sem motivo escrito é rombo sem autor."
              value={billing.notBillableReason ?? ''}
              onChange={e => onChange({ notBillableReason: e.target.value })}
              autoFocus
            />
          ) : (
            <>
              <Input
                label="Vencimento"
                type="date"
                hint="Padrão: o dia do procedimento."
                value={brToIsoDate(billing.dueDate ?? performedOn) ?? ''}
                onChange={e => onChange({ ...billing, dueDate: isoToBrDate(e.target.value) })}
              />

              {showsSettlement && (
                <div className={styles.pagamento}>
                  <Select
                    label="Forma de pagamento (opcional)"
                    options={[
                      { value: '', label: 'Definir depois, no Financeiro' },
                      ...COUNTER_METHODS.map(m => ({ value: m, label: PAYMENT_METHOD_LABEL[m] })),
                    ]}
                    value={billing.method ?? ''}
                    onChange={e => {
                      const method = (e.target.value || undefined) as PaymentMethod | undefined
                      const card = method === 'credit' || method === 'debit'
                      onChange({
                        ...billing,
                        method,
                        // Adquirente e parcelas só existem no cartão.
                        acquirerId: card ? billing.acquirerId ?? activeAcquirers[0]?.id : undefined,
                        installments: method === 'credit' ? billing.installments ?? 1 : 1,
                      })
                    }}
                  />

                  {isCard && (
                    activeAcquirers.length === 0 ? (
                      <p className={styles.aviso}>
                        Nenhuma adquirente ativa cadastrada — sem ela não há taxa nem data de
                        repasse, e o título nasceria como dívida DO PACIENTE por uma venda que a
                        maquininha já garantiu (chegaria a cobrá-lo na Inadimplência). Cadastre em
                        Financeiro → Adquirentes, ou escolha outra forma para salvar.
                      </p>
                    ) : (
                      <div className={styles.cartao}>
                        <Select
                          label="Adquirente"
                          options={activeAcquirers.map(a => ({ value: a.id, label: a.name }))}
                          value={billing.acquirerId ?? ''}
                          onChange={e => onChange({ ...billing, acquirerId: e.target.value })}
                        />
                        {billing.method === 'credit' && (
                          <Select
                            label="Parcelas"
                            options={Array.from({ length: 12 }, (_, i) => ({
                              value: String(i + 1),
                              label: i === 0 ? 'À vista' : `${i + 1}×`,
                            }))}
                            value={String(billing.installments ?? 1)}
                            onChange={e => onChange({ ...billing, installments: Number(e.target.value) })}
                          />
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}

          {/* Parcelas do cartão: bruto, taxa e LÍQUIDO por linha — é o líquido
              que entra na conta, e é ele que a clínica confere no extrato. */}
          {preview.installments.length > 0 && (
            <ul className={styles.parcelas}>
              {preview.installments.map(i => (
                <li key={i.number} className={styles.parcela}>
                  <span className={styles.parcelaNum}>{i.number}/{i.count}</span>
                  <span className={styles.parcelaData}>repasse {i.dueDate}</span>
                  <span className={styles.parcelaTaxa}>taxa {formatBRL(i.fee)}</span>
                  <span className={styles.parcelaValor}>{formatBRL(i.netAmount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
