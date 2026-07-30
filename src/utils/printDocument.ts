import type { ClinicData } from '@/types/domain'
import neoLogo from '@/assets/images/logo/logo.svg'

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
  /**
   * CABE EM UMA FOLHA — encolhe o documento até o fim dele (inclusive a
   * assinatura) entrar numa página só. Ver `ajustarParaUmaPagina` em
   * usePrintDocument: a folha na tela passa a ter a largura ÚTIL do A4, para
   * a medida bater com o que sai na impressora, e o zoom é calculado a partir
   * da altura real do conteúdo.
   *
   * Para documentos em que a segunda página é aceitável (receita longa,
   * orçamento com trinta itens) isto fica desligado: espremer um documento que
   * naturalmente ocupa duas folhas só o deixaria ilegível.
   */
  fitToPage?: boolean
}

/** Papel A4 e a margem do `@page` abaixo — a área útil que sobra é o alvo do
 *  "cabe em uma folha". Exportados porque quem faz a conta é o hook. */
export const A4_LARGURA_UTIL_MM = 210 - 15 * 2
export const A4_ALTURA_UTIL_MM = 297 - 15 * 2

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
  /* Página real (A4) com margem física de verdade — sem isto, o tamanho do
     papel e a margem ficavam 100% por conta do driver de impressão do SO,
     então o mesmo documento imprimia diferente em cada máquina. */
  @page { size: A4; margin: 15mm; }

  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  /* Escala tipográfica de só DOIS tamanhos — 14px (texto) e 16px (destaque).
     Ênfase vem de negrito/maiúsculas, nunca de um terceiro tamanho maior. */
  body { font-family: system-ui, sans-serif; color: #12211C; background: #fff;
         margin: 32px; font-size: 14px; }

  /* ── Cabeçalho da clínica (comum a todos os documentos) ── */
  .clinica { display: flex; align-items: center; gap: 14px; padding-bottom: 10px;
             border-bottom: 2px solid #12211C; }
  /* Tamanho final vem de ajustarLogoImpressa() (ver usePrintDocument.ts) —
     este é só o valor antes da imagem carregar/JS rodar. */
  .clinica-logo { height: 56px; width: auto; max-width: 160px; object-fit: contain; flex-shrink: 0; }
  .clinica-dados h1 { font-size: 16px; font-weight: 700; margin: 0 0 3px; }
  .clinica-dados p { margin: 1px 0; font-size: 14px; color: #667; }

  /* ── Título do documento ── */
  .doc-titulo { font-size: 16px; font-weight: 700; margin: 16px 0 2px; text-transform: uppercase;
                letter-spacing: 0.06em; }
  .doc-sub { color: #667; margin: 0 0 14px; font-size: 14px; }

  /* ── Blocos reaproveitados pelos miolos ── */
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #D8E2DE; vertical-align: top; }
  th { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #667; }
  .num, .valor { text-align: right; white-space: nowrap; }
  small { color: #667; }
  .total td { font-weight: 700; border-bottom: none; }
  .totais { margin-top: 10px; text-align: right; font-size: 14px; }
  .totais strong { font-size: 16px; }
  .clausula { margin-top: 16px; font-size: 14px; color: #334; line-height: 1.6; }
  .assinaturas { display: flex; justify-content: space-between; gap: 24px; margin-top: 64px; }
  .assinaturas span { flex: 1; border-top: 1px solid #12211C; padding-top: 6px;
                      text-align: center; font-size: 14px; }

  /* "Powered by" fixo no rodapé de TODO documento impresso, discreto no
     canto inferior direito — mesmo lugar do Footer.tsx do app; a logo (que
     é azul-marinho por padrão) vira cinza aqui via grayscale + opacity. */
  .powered-by { display: flex; align-items: center; justify-content: flex-end;
                gap: 6px; margin-top: 6px; }
  .powered-by span { font-size: 14px; color: #889; }
  .powered-by img { height: 12px; width: auto; filter: grayscale(1); opacity: 0.55; }

  /* ── "Cabe em uma folha" (doc.fitToPage) ──
     A folha na tela passa a ter a LARGURA ÚTIL do A4: sem isso a medida da
     altura seria feita numa largura diferente da impressa, o texto quebraria
     em outros pontos e a conta do zoom sairia errada. A largura final é
     reescrita por ajustarParaUmaPagina() junto com o zoom. */
  body.uma-pagina { width: ${A4_LARGURA_UTIL_MM}mm; margin: 0 auto; }

  @media print {
    body { margin: 0; }
    body.uma-pagina { margin: 0; }
    .clinica { break-inside: avoid; }
    /* Numa folha só não há quebra a evitar — e o break-inside: avoid dos
       blocos empurraria uma seção inteira para a página seguinte justamente
       no caso que estamos tentando eliminar. */
    body.uma-pagina * { break-inside: auto; }
  }
  ${doc.styles ?? ''}
</style></head><body${doc.fitToPage ? ' class="uma-pagina"' : ''}>
${clinicHeader(clinic)}
<h2 class="doc-titulo">${esc(doc.title)}</h2>
${doc.subtitle ? `<p class="doc-sub">${esc(doc.subtitle)}</p>` : ''}
${doc.body}
<footer class="powered-by">
  <span>powered by</span>
  <img src="${neoLogo}" alt="Neo">
</footer>
</body></html>`
}
