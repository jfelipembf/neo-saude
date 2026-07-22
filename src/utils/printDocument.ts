import type { ClinicData } from '@/types/domain'

/** Escapa texto que vai para dentro do HTML impresso (nome de paciente com
 *  "&", observação com "<"… não podem quebrar o documento). */
export function esc(text: string | number | undefined | null) {
  if (text == null) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface PrintDocumentInput {
  /** Tipo do documento: "Recibo de pagamento", "Orçamento"… Vai no <title>
   *  da janela e como título abaixo do cabeçalho da clínica. */
  title: string
  /** Linha de contexto sob o título (ex.: nome do orçamento, do paciente). */
  subtitle?: string
  /** HTML do miolo — a parte que muda de página para página. */
  body: string
  /** CSS extra do documento (o base já cobre tabelas, totais e assinaturas). */
  styles?: string
  /** Largura da janela de impressão (px). Padrão 680. */
  width?: number
}

/** Cabeçalho comum: logo + nome da clínica + linha de identificação/contato,
 *  tudo vindo de Administrativo → Dados do consultório. */
function clinicHeader(clinic?: ClinicData) {
  if (!clinic) return ''

  const identification = [
    clinic.cnpj ? `CNPJ ${esc(clinic.cnpj)}` : '',
    esc(clinic.phone),
    esc(clinic.email),
  ].filter(Boolean).join(' · ')

  const streetLine = [clinic.street, clinic.number].filter(Boolean).join(', ')
  const cityState = [clinic.city, clinic.state].filter(Boolean).join('/')
  const address = [streetLine, clinic.neighborhood, cityState, clinic.cep ? `CEP ${clinic.cep}` : '']
    .filter(Boolean).map(p => esc(p)).join(' · ')

  return `
    <header class="clinica">
      ${clinic.photo ? `<img class="clinica-logo" src="${esc(clinic.photo)}" alt="">` : ''}
      <div class="clinica-dados">
        <h1>${esc(clinic.name)}</h1>
        ${identification ? `<p>${identification}</p>` : ''}
        ${address ? `<p>${address}</p>` : ''}
      </div>
    </header>`
}

/** Estrutura base de TODO documento impresso do sistema: cabeçalho da clínica,
 *  título do documento, miolo específico da página e rodapé. */
export function buildDocument(clinic: ClinicData | undefined, doc: PrintDocumentInput) {
  const clinicName = clinic?.name ?? 'Neo Saúde'

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${esc(doc.title)} — ${esc(clinicName)}</title>
<style>
  /* Documento impresso é SEMPRE claro: sem isto, um navegador em modo escuro
     pinta o fundo de preto e o texto (escuro) some na pré-visualização. */
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; color: #12211C; background: #fff;
         margin: 32px; font-size: 14px; }

  /* ── Cabeçalho da clínica (comum a todos os documentos) ── */
  .clinica { display: flex; align-items: center; gap: 16px; padding-bottom: 12px;
             border-bottom: 2px solid #12211C; }
  .clinica-logo { width: 72px; height: 72px; object-fit: contain; flex-shrink: 0; }
  .clinica-dados h1 { font-size: 19px; margin: 0 0 3px; }
  .clinica-dados p { margin: 1px 0; font-size: 11.5px; color: #667; }

  /* ── Título do documento ── */
  .doc-titulo { font-size: 15px; margin: 18px 0 2px; text-transform: uppercase;
                letter-spacing: 0.06em; }
  .doc-sub { color: #667; margin: 0 0 16px; font-size: 12px; }

  /* ── Blocos reaproveitados pelos miolos ── */
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #D8E2DE; vertical-align: top; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #667; }
  .num, .valor { text-align: right; white-space: nowrap; }
  small { color: #667; }
  .total td { font-weight: 700; border-bottom: none; }
  .totais { margin-top: 12px; text-align: right; font-size: 13.5px; }
  .totais strong { font-size: 15px; }
  .clausula { margin-top: 18px; font-size: 12.5px; color: #334; line-height: 1.6; }
  .assinaturas { display: flex; justify-content: space-between; gap: 24px; margin-top: 72px; }
  .assinaturas span { flex: 1; border-top: 1px solid #12211C; padding-top: 6px;
                      text-align: center; font-size: 12px; }
  .rodape { margin-top: 28px; padding-top: 8px; border-top: 1px solid #D8E2DE;
            font-size: 11px; color: #889; }

  @media print {
    body { margin: 0; }
    .clinica { break-inside: avoid; }
  }
  ${doc.styles ?? ''}
</style></head><body>
${clinicHeader(clinic)}
<h2 class="doc-titulo">${esc(doc.title)}</h2>
${doc.subtitle ? `<p class="doc-sub">${esc(doc.subtitle)}</p>` : ''}
${doc.body}
<p class="rodape">Documento gerado eletronicamente por ${esc(clinicName)}.</p>
</body></html>`
}
