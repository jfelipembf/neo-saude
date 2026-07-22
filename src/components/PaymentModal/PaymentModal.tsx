import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { TIPO_PAGAMENTO_LABEL } from '@/constants'
import type { BilledTreatment, PaymentMethod } from '@/types/domain'
import styles from './PaymentModal.module.scss'

const FORMAS = Object.keys(TIPO_PAGAMENTO_LABEL) as PaymentMethod[]

const OPCOES_BANDEIRA = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard'].map(b => ({ value: b, label: b }))

function formatarReais(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** '100,00' | '1.250,50' → número (NaN se inválido). */
function parseValor(texto: string) {
  return Number(texto.replace(/\./g, '').replace(',', '.'))
}

/** Date → 'aaaa-mm-dd' local, para o input de data. */
function hojeIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** O que o modal devolve ao confirmar — quem chama decide onde persistir. */
export interface PaymentModalResult {
  tipo: PaymentMethod
  valor: number
  data: string           // dd/mm/aaaa
  bandeira?: string
  autorizacao?: string
  nsu?: string
  parcelas?: number      // só crédito
  contaBancariaId?: string
}

export interface PaymentModalProps {
  /** Cobrança em aberto; null mantém o modal fechado. */
  cobranca: {
    /** Remonta o formulário a cada cobrança diferente. */
    id: string
    descricao: string
    valor: number
    /** Detalhamento; sem ele a própria cobrança vira o único item. */
    tratamentos?: BilledTreatment[]
  } | null
  paciente?: { nome: string; cpf?: string }
  /** Contas bancárias para escolher onde o dinheiro entra (opcional). */
  contas?: { value: string; label: string }[]
  confirmando?: boolean
  onConfirm: (dados: PaymentModalResult) => void
  onClose: () => void
}

/** Modal "Realizar pagamento": itens cobrados, forma, valor e data.
 *  É APRESENTACIONAL — não persiste nada; devolve os dados em `onConfirm`. */
export function PaymentModal({ cobranca, ...resto }: PaymentModalProps) {
  if (!cobranca) return null
  // key remonta o formulário a cada cobrança — o estado nasce pronto
  // (valor cheio + data de hoje) sem precisar de reset via efeito.
  return <PaymentForm key={cobranca.id} cobranca={cobranca} {...resto} />
}

type PaymentFormProps = Omit<PaymentModalProps, 'cobranca'> & {
  cobranca: NonNullable<PaymentModalProps['cobranca']>
}

function PaymentForm({ cobranca, paciente, contas, confirmando, onConfirm, onClose }: PaymentFormProps) {

  const [forma, setForma] = useState<PaymentMethod>('dinheiro')
  const [valorTexto, setValorTexto] = useState(() =>
    cobranca.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  )
  const [dataIso, setDataIso] = useState(hojeIso())
  const [erroValor, setErroValor] = useState('')
  const [contaId, setContaId] = useState('')
  // Campos exclusivos de cartão (crédito/débito).
  const [bandeira, setBandeira] = useState('')
  const [parcelas, setParcelas] = useState(1)
  const [autorizacao, setAutorizacao] = useState('')
  const [nsu, setNsu] = useState('')
  const [erroBandeira, setErroBandeira] = useState('')

  const ehCartao = forma === 'credito' || forma === 'debito'

  // "3× de R$ 50,00" calculado sobre o valor digitado.
  const valorAtual = parseValor(valorTexto)
  const opcoesParcelas = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    const porParcela = Number.isFinite(valorAtual) && valorAtual > 0
      ? ` de ${formatarReais(valorAtual / n)}`
      : ''
    return { value: String(n), label: n === 1 ? 'À vista' : `${n}×${porParcela}` }
  })

  // Sem detalhamento cadastrado, a própria cobrança vira o único item da lista.
  const tratamentos = cobranca.tratamentos?.length
    ? cobranca.tratamentos
    : [{ nome: cobranca.descricao, profissional: '', valor: cobranca.valor }]

  function confirmar() {
    const valor = parseValor(valorTexto)
    if (!Number.isFinite(valor) || valor <= 0) {
      setErroValor('Informe um valor válido.')
      return
    }
    if (ehCartao && !bandeira) {
      setErroBandeira('Selecione a bandeira do cartão.')
      return
    }
    onConfirm({
      tipo: forma,
      valor,
      data: dataIso.split('-').reverse().join('/'),
      ...(ehCartao && {
        bandeira,
        autorizacao: autorizacao.trim() || undefined,
        nsu: nsu.trim() || undefined,
      }),
      ...(forma === 'credito' && { parcelas }),
      ...(contaId && { contaBancariaId: contaId }),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Realizar pagamento"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={confirmando}>Cancelar</Button>
          <Button onClick={confirmar} loading={confirmando}>Confirmar pagamento</Button>
        </>
      }
    >
      <div className={styles.corpo}>
        {paciente && (
          <div className={styles.paciente}>
            <strong>{paciente.nome}</strong>
            {paciente.cpf && <span>{paciente.cpf}</span>}
          </div>
        )}

        <section className={styles.secao}>
          <h3>Tratamentos</h3>
          <ul className={styles.tratamentos}>
            {tratamentos.map((t, indice) => (
              <li key={indice} className={styles.tratamento}>
                <div className={styles.tratamentoInfo}>
                  <span className={styles.tratamentoNome}>{t.nome}</span>
                  {t.profissional && <span className={styles.tratamentoProf}>Dr(a) {t.profissional.replace(/^Dra?\.\s*/i, '')}</span>}
                </div>
                <span className={styles.tratamentoValor}>{formatarReais(t.valor)}</span>
              </li>
            ))}
          </ul>
          <p className={styles.total}>
            Total a ser pago <strong>{formatarReais(cobranca.valor)}</strong>
          </p>
        </section>

        <p className={styles.novidade}>
          <strong>Novidade!</strong> Aproveite para configurar as maquininhas de cartão,
          taxas e o período de recebimento de cada uma.
        </p>

        <section className={styles.secao}>
          <h3>Forma de pagamento</h3>
          <div className={styles.formas} role="group" aria-label="Forma de pagamento">
            {FORMAS.map(tipo => (
              <button
                key={tipo}
                type="button"
                className={`${styles.formaBtn} ${forma === tipo ? styles['formaBtn--ativa'] : ''}`}
                aria-pressed={forma === tipo}
                onClick={() => { setForma(tipo); setErroBandeira('') }}
              >
                {TIPO_PAGAMENTO_LABEL[tipo]}
              </button>
            ))}
          </div>

          {/* Dados da maquininha — só para cartão de crédito/débito. */}
          {ehCartao && (
            <div className={styles.cartao}>
              <div className={styles.campos}>
                <Select
                  label="Bandeira"
                  options={OPCOES_BANDEIRA}
                  placeholder="Selecione..."
                  value={bandeira}
                  onChange={e => { setBandeira(e.target.value); setErroBandeira('') }}
                  error={erroBandeira}
                />
                {forma === 'credito' && (
                  <Select
                    label="Parcelas"
                    options={opcoesParcelas}
                    value={String(parcelas)}
                    onChange={e => setParcelas(Number(e.target.value))}
                  />
                )}
              </div>
              <div className={styles.campos}>
                <Input
                  label="Código de autorização"
                  placeholder="Ex.: A73H21"
                  value={autorizacao}
                  onChange={e => setAutorizacao(e.target.value)}
                />
                <Input
                  label="NSU"
                  placeholder="Ex.: 004512"
                  inputMode="numeric"
                  value={nsu}
                  onChange={e => setNsu(e.target.value)}
                />
              </div>
            </div>
          )}
        </section>

        <div className={styles.campos}>
          <Input
            label="Valor pago"
            iconLeft={<span className={styles.prefixo}>R$</span>}
            inputMode="decimal"
            value={valorTexto}
            onChange={e => { setValorTexto(e.target.value); setErroValor('') }}
            error={erroValor}
          />
          <Input
            label="Data do pagamento"
            type="date"
            value={dataIso}
            onChange={e => setDataIso(e.target.value)}
          />
        </div>

        {/* Só aparece quando o chamador informa as contas (baixa do financeiro). */}
        {contas && contas.length > 0 && (
          <Select
            label="Conta bancária"
            placeholder="Selecione a conta..."
            options={contas}
            value={contaId}
            onChange={e => setContaId(e.target.value)}
          />
        )}
      </div>
    </Modal>
  )
}
