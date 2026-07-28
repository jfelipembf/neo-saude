import { esc } from '@/utils/printDocument'
import { placeAndDate } from '@/utils/clinicalDocument'
import { valorPorExtenso } from '@/utils/amountInWords'
import { formatBRL } from '@/utils/format'

/**
 * RECIBO DE PAGAMENTO — o comprovante que o paciente leva.
 *
 * ⚠️ O VALOR É O BRUTO. É o que o paciente pagou; a taxa da adquirente é custo
 * da clínica com a maquininha, não desconto dele (docs/modelo-contabil.md,
 * "Bruto × Líquido"). Imprimir o líquido daria ao paciente um recibo de valor
 * menor do que ele efetivamente pagou — e é o papel dele que vale numa
 * discussão.
 *
 * Segue o mesmo esqueleto dos outros documentos do projeto (buildDocument monta
 * cabeçalho da clínica, A4 e margem; aqui vai só o miolo), então herda logo,
 * identificação e comportamento de impressão sem duplicar nada.
 */

export interface ReceiptDoc {
  /** Quem pagou. */
  patientName: string
  patientCpf?: string
  /** O que foi pago — descrição do serviço/procedimento. */
  description: string
  /** BRUTO, em reais. */
  amount: number
  /** Formas usadas, já escritas ("Dinheiro", "Crédito 3x + Pix"). */
  paymentMethods?: string
  /** dd/mm/aaaa — data da VENDA, não a de hoje: o recibo pode ser reimpresso. */
  paidOn: string
  /** Data por extenso do fecho ("26 de julho de 2026"). */
  longDate: string
  city?: string
  /** Nome da clínica — quem RECEBEU. Assina o recibo. */
  clinicName: string
  clinicCnpj?: string
}

export const RECEIPT_STYLES = `
  .recibo-valor { font-size: 16px; font-weight: 700; margin: 16px 0 4px; }
  .recibo-extenso { font-size: 14px; color: #334; margin: 0 0 16px; font-style: italic; }
  .recibo-declaracao { font-size: 14px; line-height: 1.7; margin: 0 0 8px; }
  .recibo-dados { margin: 16px 0; }
  .recibo-dados p { margin: 3px 0; }
  .recibo-assina { display: flex; justify-content: center; margin-top: 64px; }
  .recibo-assina span { border-top: 1px solid #12211C; padding-top: 6px;
                        text-align: center; min-width: 280px; font-size: 14px; }
`

/**
 * Miolo do recibo.
 *
 * A declaração vem em primeira pessoa da CLÍNICA ("recebemos de..."), que é a
 * forma do recibo brasileiro: quem assina é quem recebeu, e o documento é a
 * prova do paciente. Por isso a assinatura não leva conselho profissional — o
 * ato aqui é comercial, não clínico, diferente de receita e atestado.
 */
export function receiptBody(doc: ReceiptDoc): string {
  const valor = formatBRL(doc.amount)

  return `
    <p class="recibo-valor">${esc(valor)}</p>
    <p class="recibo-extenso">(${esc(valorPorExtenso(doc.amount))})</p>

    <p class="recibo-declaracao">
      Recebemos de <strong>${esc(doc.patientName)}</strong>${
        doc.patientCpf ? `, CPF ${esc(doc.patientCpf)},` : ','
      } a importância de <strong>${esc(valor)}</strong>
      referente a <strong>${esc(doc.description)}</strong>, dando plena
      quitação do valor acima.
    </p>

    <div class="recibo-dados">
      <p><strong>Data do pagamento:</strong> ${esc(doc.paidOn)}</p>
      ${doc.paymentMethods ? `<p><strong>Forma de pagamento:</strong> ${esc(doc.paymentMethods)}</p>` : ''}
    </div>

    ${placeAndDate(doc.city, doc.longDate)}

    <div class="recibo-assina">
      <span>
        ${esc(doc.clinicName)}
        ${doc.clinicCnpj ? `<br>CNPJ ${esc(doc.clinicCnpj)}` : ''}
      </span>
    </div>`
}
