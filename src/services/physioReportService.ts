import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { listSessionNotes } from '@/services/patientClinicalNotesService'
import { isoToBrDate } from '@/utils/date'
import type {
  DiagnosticoDoTratamento, EvolucaoDeTeste, EvolucaoNoProntuario,
} from '@/utils/physioReportDocument'
import type { SoapNote } from '@/types/domain'

/**
 * O QUE ENTRA NO RELATÓRIO DE EVOLUÇÃO — colhido do banco, não do modelo.
 *
 * Este arquivo só LÊ e ORGANIZA. Ele não escreve frase nenhuma: os números vão
 * para as tabelas (utils/physioReportDocument) exatamente como estão gravados,
 * e a leitura clínica é pedida à parte (`gerarAnalise`). A separação é o ponto
 * do desenho — ver o docblock de physioReportDocument.
 *
 * TUDO ESCOPADO PELO TRATAMENTO. Teste, sinal vital e evolução carregam
 * `care_plan_id` carimbado pelo banco; sem esse filtro o relatório de uma
 * reabilitação de joelho traria a medida feita durante o tratamento de ombro do
 * ano passado, e a "evolução" seria a diferença entre dois casos diferentes.
 */

/** A unidade só quando o tipo do instrumento a determina sem ambiguidade —
 *  fora desses, o número sai cru em vez de ganhar um sufixo chutado. */
function unidadeDoKind(kind?: string | null): string | undefined {
  if (kind === 'goniometry') return '°'
  return undefined
}

interface LinhaDeResultado {
  test_id: string
  score: number | null
  level_name: string | null
  performed_at: string
  physio_test: { name: string; kind: string | null } | null
}

/**
 * Aplicações de teste do tratamento, agrupadas por instrumento.
 *
 * Uma consulta só para todos os testes — a leitura por teste que já existia
 * (`listPatientTestResults`) obrigaria uma ida por instrumento, e um paciente
 * com seis escalas viraria seis viagens para montar um papel.
 */
async function evolucaoDosTestes(
  patientId: string, carePlanId: string,
): Promise<EvolucaoDeTeste[]> {
  const { data, error } = await supabase
    .from('patient_test_result')
    // `physio_test(...)` pelo NOME DA TABELA — a sintaxe do PostgREST é
    // `alias:ALVO(colunas)`, e escrever a coluna da FK ali devolve 400 na
    // requisição inteira (aconteceu no carrinho e na lista de espera).
    .select('test_id, score, level_name, performed_at, physio_test ( name, kind )')
    .eq('patient_id', patientId)
    .eq('care_plan_id', carePlanId)
    .eq('clinic_id', getCurrentClinicId())
    .order('performed_at', { ascending: true })
  if (error) throw error

  const porTeste = new Map<string, LinhaDeResultado[]>()
  for (const linha of (data ?? []) as unknown as LinhaDeResultado[]) {
    const atual = porTeste.get(linha.test_id) ?? []
    atual.push(linha)
    porTeste.set(linha.test_id, atual)
  }

  return [...porTeste.values()].map(aplicacoes => {
    const primeira = aplicacoes[0]
    const ultima = aplicacoes[aplicacoes.length - 1]
    const ponto = (l: LinhaDeResultado) => ({
      em: isoToBrDate(l.performed_at.slice(0, 10)) ?? l.performed_at,
      score: l.score ?? undefined,
      nivel: l.level_name ?? undefined,
    })
    return {
      teste: primeira.physio_test?.name ?? 'Teste',
      // O catálogo (`physio_test`) não guarda unidade — o `kind` diz que
      // instrumento é, e a unidade está no nome ("TC6 (metros)"). Sem inventar:
      // a tabela imprime o número cru, que é o que foi medido.
      unidade: unidadeDoKind(primeira.physio_test?.kind),
      primeiro: ponto(primeira),
      ultimo: ponto(ultima),
      aplicacoes: aplicacoes.length,
    }
  }).sort((a, b) => a.teste.localeCompare(b.teste, 'pt-BR'))
}

/** O SOAP vira um parágrafo por seção presente — seção vazia não vira linha em
 *  branco no papel. */
function soapEmTexto(note: SoapNote | null): string {
  if (!note) return ''
  const rotulos: [keyof SoapNote, string][] = [
    ['subjective', 'S'], ['objective', 'O'], ['assessment', 'A'], ['plan', 'P'],
  ]
  return rotulos
    .map(([chave, rotulo]) => {
      const valor = note[chave]?.trim()
      return valor ? `${rotulo}: ${valor}` : ''
    })
    .filter(Boolean)
    .join('\n')
}

/** Tira as tags do texto corrido do editor — o relatório imprime texto, e o
 *  HTML do prontuário sairia como marcação crua dentro de uma célula. */
function semTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * O DIAGNÓSTICO DO TRATAMENTO e os achados pendurados nele.
 *
 * `diagnosis` é o diagnóstico; `problems` são os achados clínicos, ligados ao
 * diagnóstico por `diagnosis_id` (é assim que a abertura do tratamento os
 * grava, ver Fisio/components/Diagnosis). Achado sem diagnóstico-pai entra
 * numa entrada própria em vez de sumir — foi registrado, tem de aparecer.
 */
async function diagnosticosDoTratamento(
  patientId: string, carePlanId: string,
): Promise<DiagnosticoDoTratamento[]> {
  const { data, error } = await supabase
    .from('patient_clinical_entry')
    .select('id, kind, content, diagnosis_id')
    .eq('patient_id', patientId)
    .eq('care_plan_id', carePlanId)
    .eq('clinic_id', getCurrentClinicId())
    .in('kind', ['diagnosis', 'problems'])
    .order('created_at', { ascending: true })
  if (error) throw error

  const linhas = (data ?? []) as { id: string; kind: string; content: string; diagnosis_id: string | null }[]
  const diagnosticos = linhas.filter(l => l.kind === 'diagnosis')
  const achados = linhas.filter(l => l.kind === 'problems')

  const lista: DiagnosticoDoTratamento[] = diagnosticos.map(d => ({
    diagnostico: d.content,
    achados: achados.filter(a => a.diagnosis_id === d.id).map(a => a.content),
  }))

  const orfaos = achados.filter(a => !a.diagnosis_id || !diagnosticos.some(d => d.id === a.diagnosis_id))
  if (orfaos.length) lista.push({ diagnostico: 'Achados clínicos', achados: orfaos.map(a => a.content) })
  return lista
}

async function evolucaoNoProntuario(
  patientId: string, carePlanId: string,
): Promise<EvolucaoNoProntuario[]> {
  const notas = await listSessionNotes(patientId, { carePlanId })
  return notas
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .map(n => ({
      em: isoToBrDate(n.date) ?? n.date,
      texto: soapEmTexto(n.note) || semTags(n.evolution ?? ''),
    }))
    .filter(n => n.texto.length > 0)
    /**
     * PRIMEIRA E ÚLTIMA, e nada no meio.
     *
     * Dez sessões viravam duas páginas de tabela que ninguém lê num relatório.
     * O papel responde "de onde saiu e onde chegou"; o caminho inteiro continua
     * no prontuário, que é onde se procura sessão por sessão.
     */
    .filter((_, i, todas) => i === 0 || i === todas.length - 1)
}

export interface DadosColhidos {
  diagnosticos: DiagnosticoDoTratamento[]
  testes: EvolucaoDeTeste[]
  prontuario: EvolucaoNoProntuario[]
}

/** Colhe as três frentes de uma vez — elas são independentes e a espera em
 *  série apareceria como lentidão na frente do paciente. */
export async function colherDadosDoTratamento(
  patientId: string, carePlanId: string,
): Promise<DadosColhidos> {
  const [diagnosticos, testes, prontuario] = await Promise.all([
    diagnosticosDoTratamento(patientId, carePlanId),
    evolucaoDosTestes(patientId, carePlanId),
    evolucaoNoProntuario(patientId, carePlanId),
  ])
  return { diagnosticos, testes, prontuario }
}

/**
 * A LEITURA CLÍNICA — e só ela.
 *
 * Devolve `[]` em qualquer falha, de propósito: o relatório sai com as tabelas
 * mesmo sem análise, e é melhor um papel sem os parágrafos de leitura do que
 * nenhum papel com o paciente esperando. O erro vai para o console, não para a
 * tela — quem clicou pediu um relatório, não um diagnóstico de infraestrutura.
 */
export async function gerarAnalise(entrada: {
  tratamento: string
  situacao: string
  sessoesRealizadas: number
  sessoesPrevistas?: number
  dados: DadosColhidos
}): Promise<string[]> {
  try {
    const { data, error } = await supabase.functions.invoke<{ paragrafos?: string[] }>(
      'physio-report',
      { body: entrada },
    )
    if (error) throw error
    return data?.paragrafos ?? []
  } catch (e) {
    console.error('[relatório de evolução] análise não gerada:', e)
    return []
  }
}
