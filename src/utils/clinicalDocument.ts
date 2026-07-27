import { esc } from '@/utils/printDocument'
import { PROFESSIONAL_SIGNATURE_LABEL } from '@/constants/specialty'
import type { ClinicSpecialty, PrescribedMedication } from '@/types/domain'

/**
 * Miolo dos documentos clínicos que o profissional imprime e assina: receita,
 * atestado, declaração de comparecimento e solicitação de exame.
 *
 * Fonte ÚNICA entre as duas superfícies que emitem documento — a aba
 * Prescrições do perfil e o odontograma em tela cheia (ditado por voz). Emitir
 * o mesmo atestado com layout diferente dependendo de onde foi pedido é como
 * os dois divergem em um mês.
 *
 * O cabeçalho (logo + dados da clínica) e a folha A4 NÃO estão aqui: vêm de
 * utils/printDocument.ts, que todo documento do sistema já usa.
 */

/** CSS específico destes documentos — o resto vem da base de impressão. */
export const CLINICAL_DOCUMENT_STYLES = `
  .meds { margin: 16px 0 0 20px; padding: 0; } .meds li { margin: 12px 0; font-size: 14px; }
  .pos { color: #334; font-size: 14px; }
  .itens { margin: 16px 0 0 20px; padding: 0; } .itens li { margin: 8px 0; font-size: 14px; }
  .texto { margin-top: 16px; font-size: 14px; line-height: 1.7; text-align: justify; }
  .assinatura { margin-top: 72px; text-align: center; }
  .assinatura .linha { display: inline-block; border-top: 1px solid #12211C; padding-top: 6px;
                       min-width: 300px; }
  .assinatura .nome { font-size: 16px; font-weight: 700; display: block; }
  .assinatura .registro { font-size: 14px; color: #334; display: block; margin-top: 2px; }
  .local-data { margin-top: 40px; font-size: 14px; text-align: right; }
`

export interface DocumentSigner {
  name: string
  /** Conselho + número (CRO-SE 12345). Sem isto, receita e atestado não valem. */
  license?: string
  specialty?: ClinicSpecialty
}

/**
 * Bloco de assinatura. Sai com NOME e REGISTRO NO CONSELHO — o painel de
 * prescrições imprimia só o nome, o que invalida receita e atestado na
 * prática. O dado sempre existiu (professional.license é obrigatório no
 * cadastro); só não estava sendo impresso.
 */
export function signatureBlock(signer: DocumentSigner) {
  const cargo = signer.specialty ? PROFESSIONAL_SIGNATURE_LABEL[signer.specialty] : undefined
  const registro = [cargo, signer.license].filter(Boolean).join(' — ')

  return `
    <div class="assinatura">
      <span class="linha">
        <span class="nome">${esc(signer.name)}</span>
        ${registro ? `<span class="registro">${esc(registro)}</span>` : ''}
      </span>
    </div>`
}

/** "Aracaju, 26 de julho de 2026" — fecho padrão de documento assinado. */
export function placeAndDate(city: string | undefined, longDate: string) {
  return `<p class="local-data">${city ? `${esc(city)}, ` : ''}${esc(longDate)}</p>`
}

function patientLine(patientName: string, patientCpf?: string) {
  return `<p><strong>Paciente:</strong> ${esc(patientName)}${patientCpf ? ` — CPF ${esc(patientCpf)}` : ''}</p>`
}

interface BaseDoc {
  patientName: string
  patientCpf?: string
  /** Data por extenso do fecho. */
  longDate: string
  city?: string
  signer: DocumentSigner
  /** Número do documento (REC-000001) — é o que o paciente cita ao voltar. */
  code?: string
  notes?: string
}

function rodape(doc: BaseDoc) {
  return `
    ${doc.notes ? `<p class="texto"><strong>Observações:</strong> ${esc(doc.notes).replace(/\n/g, '<br>')}</p>` : ''}
    ${placeAndDate(doc.city, doc.longDate)}
    ${signatureBlock(doc.signer)}
    ${doc.code ? `<p class="clausula">Documento nº ${esc(doc.code)}</p>` : ''}`
}

/**
 * RECEITA — medicamento, concentração e posologia, um por linha.
 *
 * Aceita os dois formatos, e os dois JUNTOS: a lista numerada de medicamentos e
 * um texto de orientações ditado pelo dentista ("bochechar com clorexidina por
 * 7 dias", "não fazer esforço nas primeiras 24 horas"). Receita de verdade
 * costuma ter as duas coisas, e antes só a lista cabia aqui — quem só ditasse
 * orientação ficava sem documento.
 */
export function prescriptionBody(doc: BaseDoc & {
  medications?: PrescribedMedication[]
  text?: string
}) {
  const meds = doc.medications ?? []
  const lista = meds.length
    ? `<ol class="meds">
        ${meds.map(m => `
          <li>
            <strong>${esc(m.name)}</strong>${m.quantity ? ` — ${esc(m.quantity)}` : ''}
            <br><span class="pos">${esc(m.dosage)}</span>
          </li>`).join('')}
      </ol>`
    : ''

  // Com lista, o texto vira "Orientações" abaixo dela; sozinho, é a receita
  // inteira e não leva rótulo nenhum.
  const orientacoes = doc.text?.trim()
    ? `<p class="texto">${meds.length ? '<strong>Orientações:</strong> ' : ''}${esc(doc.text).replace(/\n/g, '<br>')}</p>`
    : ''

  return `
    ${patientLine(doc.patientName, doc.patientCpf)}
    ${lista}
    ${orientacoes}
    ${rodape(doc)}`
}

/** ATESTADO — texto livre ditado/escrito pelo profissional. */
export function certificateBody(doc: BaseDoc & { text: string }) {
  return `
    ${patientLine(doc.patientName, doc.patientCpf)}
    <p class="texto">${esc(doc.text).replace(/\n/g, '<br>')}</p>
    ${rodape(doc)}`
}

/** SOLICITAÇÃO DE EXAME — o que se pede, em que região, e por quê. */
export function examRequestBody(doc: BaseDoc & {
  exams: string[]
  teeth?: number[]
  justification?: string
}) {
  const regiao = doc.teeth?.length
    ? `<p><strong>Região:</strong> ${doc.teeth.map(t => `dente ${t}`).join(', ')}</p>`
    : ''

  return `
    ${patientLine(doc.patientName, doc.patientCpf)}
    <p><strong>Solicito:</strong></p>
    <ul class="itens">${doc.exams.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
    ${regiao}
    ${doc.justification ? `<p class="texto"><strong>Hipótese diagnóstica:</strong> ${esc(doc.justification)}</p>` : ''}
    ${rodape(doc)}`
}

// ── Textos-modelo ────────────────────────────────────────────────────────────

/** Atestado de AFASTAMENTO (o modelo que já existia no painel de prescrições). */
export function leaveCertificateText(patientName: string, days: number) {
  return `Atesto, para os devidos fins, que ${patientName} esteve sob meus cuidados profissionais nesta data, necessitando de ${days} dia(s) de afastamento de suas atividades a partir de hoje.`
}

/**
 * Declaração de COMPARECIMENTO — coisa diferente de afastamento, e a que o
 * paciente mais pede (para justificar a ausência no trabalho naquelas horas).
 * Sem horário informado, sai só a data.
 */
export function attendanceCertificateText(
  patientName: string, longDate: string, from?: string, to?: string,
) {
  const periodo = from && to
    ? `, das ${from} às ${to}`
    : from ? `, a partir das ${from}` : ''

  return `Declaro, para os devidos fins, que ${patientName} compareceu a esta clínica para atendimento odontológico em ${longDate}${periodo}.`
}
