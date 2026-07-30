import { esc } from '@/utils/printDocument'
import { signatureBlock, placeAndDate } from '@/utils/clinicalDocument'
import type { DocumentSigner } from '@/utils/clinicalDocument'

/**
 * RELATÓRIO DE EVOLUÇÃO DA FISIOTERAPIA — o miolo do papel.
 *
 * ⚠️ A DIVISÃO DE AUTORIA É A REGRA CENTRAL DESTE ARQUIVO.
 *
 * Os NÚMEROS — escore de teste, sinais vitais, datas, contagem de sessões —
 * são montados AQUI, direto do que veio do banco. A IA não os escreve, não os
 * reescreve e não os arredonda: ela recebe os mesmos dados e devolve apenas os
 * parágrafos de ANÁLISE, que entram como texto num bloco separado.
 *
 * O motivo é o destino do papel: ele sai impresso, assinado por um
 * fisioterapeuta, e vai para o paciente ou para o convênio. Um 15° que virasse
 * 25° no caminho não teria como ser percebido lendo o relatório — e a
 * assinatura é de quem não digitou o número.
 *
 * Consequência prática do desenho: o relatório SAI mesmo quando a análise
 * falha. Sem os parágrafos ele é uma tabela de evolução; sem as tabelas não
 * seria relatório nenhum.
 *
 * O cabeçalho (logo e dados da clínica) e a folha A4 vêm de utils/printDocument,
 * como todo documento do sistema.
 */

/**
 * CSS específico deste relatório — o resto vem da base de impressão.
 *
 * ESTE DOCUMENTO É DE UMA FOLHA SÓ (ver `fitToPage` em printDocument). Duas
 * coisas cabem nessa promessa: o aperto FIXO daqui — entrelinha, margem entre
 * seções, altura da assinatura — e, quando o caso é grande demais (muitos
 * testes, análise longa), o encolhimento proporcional que o hook aplica por
 * cima. O aperto vem primeiro de propósito: o que é resolvido aqui não gasta
 * escala, e a escala é o recurso que custa legibilidade.
 *
 * Espaço de sobra que foi cortado: a assinatura ficava a 64px do texto (era o
 * padrão de receita, um documento de meia página) e cada seção abria com 20px
 * — sozinhos, os dois já empurravam a assinatura para a segunda folha em
 * qualquer tratamento com mais de dois testes.
 */
export const PHYSIO_REPORT_STYLES = `
  .secao { margin-top: 12px; }
  .secao h2 { font-size: 14px; font-weight: 700; margin: 0 0 4px;
              text-transform: uppercase; letter-spacing: 0.04em; }
  .resumo { display: flex; flex-wrap: wrap; gap: 4px 20px; margin-top: 6px; font-size: 13px; }
  .resumo span { white-space: nowrap; }
  .diagnosticos { margin: 6px 0 0 16px; padding: 0; }
  .diagnosticos li { margin: 3px 0; font-size: 13px; }
  .achados { color: #334; font-size: 12.5px; }
  .analise { margin-top: 6px; font-size: 13px; line-height: 1.45; text-align: justify; }
  .analise p { margin: 0 0 5px; }
  .ganho { font-weight: 700; }
  .lacunas { margin-top: 10px; padding: 6px 9px; border-left: 3px solid #667;
             font-size: 12.5px; color: #334; }

  /* Tabelas do relatório: a base é feita para recibo e orçamento, com folga
     entre linhas. Aqui são duas tabelas de tratamento inteiro na mesma folha. */
  table { margin-top: 6px; font-size: 12.5px; }
  th, td { padding: 3px 6px; }

  /* O fecho é o que precisa caber junto — é ele que dá validade ao papel. */
  .local-data { margin-top: 18px; font-size: 13px; text-align: right; }
  .assinatura { margin-top: 34px; text-align: center; }
  .assinatura .linha { display: inline-block; border-top: 1px solid #12211C; padding-top: 5px;
                       min-width: 300px; }
  .assinatura .nome { font-size: 14px; font-weight: 700; display: block; }
  .assinatura .registro { font-size: 12.5px; color: #334; display: block; margin-top: 2px; }
`

/** Uma medida do MESMO instrumento em dois momentos do tratamento. */
export interface EvolucaoDeTeste {
  teste: string
  /** Unidade do instrumento ("s", "pontos", "°", "m") — o que dá sentido ao número. */
  unidade?: string
  primeiro?: { em: string; score?: number; nivel?: string }
  ultimo?: { em: string; score?: number; nivel?: string }
  /** Quantas aplicações houve — duas medidas não contam a mesma história que oito. */
  aplicacoes: number
}

/** O diagnóstico do tratamento e os achados clínicos registrados sob ele — o
 *  que foi definido na abertura, e por isso abre o relatório. */
export interface DiagnosticoDoTratamento {
  diagnostico: string
  achados: string[]
}

export interface EvolucaoNoProntuario {
  em: string
  texto: string
}

export interface DadosDoRelatorio {
  patientName: string
  patientCpf?: string
  /** Como a equipe chama o caso. */
  tratamento: string
  inicio: string
  fim?: string
  situacao: 'Em andamento' | 'Finalizado'
  sessoesRealizadas: number
  sessoesPrevistas?: number
  diagnosticos: DiagnosticoDoTratamento[]
  testes: EvolucaoDeTeste[]
  /**
   * SÓ A PRIMEIRA E A ÚLTIMA evolução — quem monta já recorta.
   *
   * Dez registros de sessão viravam duas páginas que ninguém lê. O relatório
   * responde "de onde saiu e onde chegou"; o histórico completo continua no
   * prontuário, que é onde se procura sessão por sessão.
   */
  prontuario: EvolucaoNoProntuario[]
  /** Data por extenso do fecho. */
  longDate: string
  city?: string
  signer: DocumentSigner
  /**
   * Os parágrafos escritos pela IA, já separados. Vazio quando a análise não
   * pôde ser gerada — e aí o relatório sai só com o que foi medido, o que é
   * melhor que não sair.
   */
  analise: string[]
}

function linhaDoPaciente(nome: string, cpf?: string) {
  return `<p><strong>Paciente:</strong> ${esc(nome)}${cpf ? ` — CPF ${esc(cpf)}` : ''}</p>`
}

/** "12 → 21 pontos" com o ganho, ou só o valor quando houve uma medida só. */
function variacao(t: EvolucaoDeTeste): string {
  const de = t.primeiro?.score
  const para = t.ultimo?.score
  const un = t.unidade ? ` ${t.unidade}` : ''

  if (de == null && para == null) return t.ultimo?.nivel ?? t.primeiro?.nivel ?? '—'
  if (de == null || para == null || t.aplicacoes < 2) return `${para ?? de}${un}`

  /**
   * O SINAL DO GANHO NÃO É DEDUZIDO AQUI.
   *
   * Em Berg subir é melhorar; no TUG, subir é piorar (leva mais tempo). Chamar
   * de "ganho" ou "perda" exigiria saber a direção de cada instrumento, e errar
   * isso escreveria a conclusão oposta num documento assinado. A tabela mostra
   * a DIFERENÇA, sem adjetivo; quem interpreta é a análise, que recebe o nome
   * do teste e sabe do que se trata.
   */
  const delta = para - de
  const sinal = delta > 0 ? '+' : ''
  return `${de}${un} → ${para}${un} <span class="ganho">(${sinal}${Number(delta.toFixed(2))}${un})</span>`
}

/**
 * DIAGNÓSTICO E ACHADOS — a primeira coisa do papel.
 *
 * É o que foi definido na abertura do tratamento, e é o que dá sentido a todo
 * número que vem depois: um ganho de 15° só significa alguma coisa quando se
 * sabe de qual quadro se partiu.
 */
function blocoDoDiagnostico(ds: DiagnosticoDoTratamento[]): string {
  if (ds.length === 0) return ''
  const itens = ds.map(d => `
    <li>
      <strong>${esc(d.diagnostico)}</strong>
      ${d.achados.length ? `<br><span class="achados">${esc(d.achados.join(' · '))}</span>` : ''}
    </li>`).join('')

  return `
    <div class="secao">
      <h2>Diagnóstico e achados clínicos</h2>
      <ul class="diagnosticos">${itens}</ul>
    </div>`
}

function tabelaDeTestes(testes: EvolucaoDeTeste[]): string {
  if (testes.length === 0) return ''
  const linhas = testes.map(t => `
    <tr>
      <td>${esc(t.teste)}</td>
      <td>${esc(t.primeiro?.em ?? '—')}</td>
      <td>${esc(t.ultimo?.em ?? '—')}</td>
      <td class="num">${variacao(t)}</td>
      <td>${esc(t.ultimo?.nivel ?? t.primeiro?.nivel ?? '—')}</td>
    </tr>`).join('')

  return `
    <div class="secao">
      <h2>Testes e escalas</h2>
      <table>
        <thead><tr>
          <th>Instrumento</th><th>1ª aplicação</th><th>Última</th>
          <th class="num">Resultado</th><th>Classificação</th>
        </tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`
}

function blocoDoProntuario(notas: EvolucaoNoProntuario[]): string {
  if (notas.length === 0) return ''
  const linhas = notas.map(n => `
    <tr>
      <td style="white-space: nowrap">${esc(n.em)}</td>
      <td>${esc(n.texto).replace(/\n/g, '<br>')}</td>
    </tr>`).join('')

  return `
    <div class="secao">
      <h2>Evolução registrada</h2>
      <table>
        <thead><tr><th>Data</th><th>Registro</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`
}

/**
 * O QUE NÃO FOI MEDIDO, dito com todas as letras.
 *
 * Uma seção que simplesmente some deixa quem lê sem saber se o paciente não
 * melhorou ou se ninguém mediu — e as duas coisas levam a condutas opostas.
 */
function blocoDeLacunas(d: DadosDoRelatorio): string {
  const faltando: string[] = []
  if (d.diagnosticos.length === 0) faltando.push('diagnóstico não registrado')
  if (d.testes.length === 0) faltando.push('nenhum teste ou escala aplicado')
  if (d.prontuario.length === 0) faltando.push('nenhuma evolução registrada')

  const semSegundaMedida = d.testes.filter(t => t.aplicacoes < 2).map(t => t.teste)
  if (semSegundaMedida.length) {
    faltando.push(`aplicados uma única vez: ${semSegundaMedida.join(', ')}`)
  }

  if (faltando.length === 0) return ''
  return `<p class="lacunas"><strong>Sem registro neste tratamento:</strong> ${esc(faltando.join('; '))}.</p>`
}

function blocoDaAnalise(paragrafos: string[]): string {
  if (paragrafos.length === 0) return ''
  return `
    <div class="secao">
      <h2>Avaliação final e recomendações</h2>
      <div class="analise">
        ${paragrafos.map(p => `<p>${esc(p)}</p>`).join('')}
      </div>
    </div>`
}

/** O miolo do relatório — o cabeçalho da clínica vem da base de impressão. */
export function physioReportBody(d: DadosDoRelatorio): string {
  const previstas = d.sessoesPrevistas ? ` de ${d.sessoesPrevistas}` : ''
  const periodo = d.fim ? `${d.inicio} a ${d.fim}` : `desde ${d.inicio}`

  return `
    ${linhaDoPaciente(d.patientName, d.patientCpf)}
    <p><strong>Tratamento:</strong> ${esc(d.tratamento)}</p>
    <div class="resumo">
      <span><strong>Período:</strong> ${esc(periodo)}</span>
      <span><strong>Situação:</strong> ${esc(d.situacao)}</span>
      <span><strong>Sessões realizadas:</strong> ${d.sessoesRealizadas}${esc(previstas)}</span>
    </div>

    ${blocoDoDiagnostico(d.diagnosticos)}
    ${tabelaDeTestes(d.testes)}
    ${blocoDoProntuario(d.prontuario)}
    ${blocoDaAnalise(d.analise)}
    ${blocoDeLacunas(d)}

    ${placeAndDate(d.city, d.longDate)}
    ${signatureBlock(d.signer)}`
}
