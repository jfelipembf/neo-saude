import type { CarePlan, CarePlanSnapshot } from '@/services/carePlansService'
import styles from './CarePlanProgress.module.scss'

/**
 * ⚠️ PARQUEADO em 29/07/2026 — este arquivo NÃO está ligado a nenhuma tela.
 *
 * O plano de tratamento tem o banco pronto e testado (`care_plan`,
 * `appointment.care_plan_id`, e as RPCs `create_care_plan`,
 * `finish_care_plan`, `patient_care_plans`), mas a página de criação e o
 * vínculo da consulta não foram construídos — faltava decidir o formato da
 * página (tela única × assistente) e onde ela vive.
 *
 * ATENÇÃO à regra do projeto: arquivo sem nenhuma referência é exatamente o
 * que a auditoria de código morto (docs/arquitetura-e-seguranca.md §1.2)
 * manda apagar. Este comentário é o que impede que a próxima varredura o
 * remova por engano. Se a decisão demorar, apagar é legítimo — o banco
 * continua de pé e a tela se reescreve.
 */

interface Linha {
  rotulo: string
  unidade?: string
  inicio?: number
  fim?: number
  /** Para onde o número deve ir para ser melhora. */
  melhorQuando: 'menor' | 'maior' | 'neutro'
  casas?: number
}

/** Monta as linhas comparáveis a partir dos dois retratos. */
function linhas(b?: CarePlanSnapshot, d?: CarePlanSnapshot): Linha[] {
  const base: Linha[] = [
    { rotulo: 'Peso', unidade: 'kg', inicio: b?.medidas.peso, fim: d?.medidas.peso, melhorQuando: 'neutro', casas: 1 },
    { rotulo: 'IMC', inicio: b?.medidas.imc, fim: d?.medidas.imc, melhorQuando: 'neutro', casas: 2 },
    { rotulo: 'Pressão sistólica', unidade: 'mmHg', inicio: b?.vitais?.sistolica, fim: d?.vitais?.sistolica, melhorQuando: 'menor' },
    { rotulo: 'Pressão diastólica', unidade: 'mmHg', inicio: b?.vitais?.diastolica, fim: d?.vitais?.diastolica, melhorQuando: 'menor' },
    { rotulo: 'Freq. cardíaca', unidade: 'bpm', inicio: b?.vitais?.fc, fim: d?.vitais?.fc, melhorQuando: 'menor' },
    { rotulo: 'Saturação', unidade: '%', inicio: b?.vitais?.spo2, fim: d?.vitais?.spo2, melhorQuando: 'maior' },
  ]

  // Testes: casados por ID, nunca por posição — a ordem dos dois retratos pode
  // diferir, e comparar "o primeiro com o primeiro" trocaria os testes de par.
  const porId = new Map((d?.testes ?? []).map(t => [t.testeId, t]))
  const testes: Linha[] = (b?.testes ?? []).map(t => ({
    rotulo: t.teste,
    inicio: t.score,
    fim: porId.get(t.testeId)?.score,
    // Escala de teste de fisioterapia é quase sempre "quanto maior, melhor"
    // (Berg, MIF); as de tempo (TUG) são o contrário. Sem saber qual é qual,
    // fica NEUTRO: rotular melhora errada é pior que não rotular.
    melhorQuando: 'neutro',
    casas: 1,
  }))

  return [...base, ...testes].filter(l => l.inicio != null || l.fim != null)
}

function fmt(v: number | undefined, casas = 0): string {
  return v == null ? '—' : v.toFixed(casas).replace('.', ',')
}

/**
 * COMO COMEÇOU × COMO TERMINOU.
 *
 * Compara os dois retratos congelados, nunca os registros vivos: é o que
 * garante que a alta de hoje continue dizendo o mesmo daqui a um ano, mesmo que
 * alguém corrija um teste antigo.
 *
 * A seta de melhora só aparece onde a direção é conhecida (pressão e frequência
 * caem, saturação sobe). Peso, IMC e escore de teste ficam NEUTROS: sem saber a
 * meta do caso, "ganhou 3 kg" pode ser exatamente o objetivo — rotular melhora
 * errada é pior do que não rotular.
 */
export function CarePlanProgress({ plano }: { plano: CarePlan }) {
  const dados = linhas(plano.baseline, plano.discharge)

  if (!plano.discharge) {
    return (
      <p className={styles.aviso}>
        A comparação aparece quando o tratamento for finalizado — é nesse momento
        que o retrato final é registrado.
      </p>
    )
  }

  if (dados.length === 0) {
    return <p className={styles.aviso}>Nenhuma medida registrada para comparar.</p>
  }

  return (
    <table className={styles.tabela}>
      <thead>
        <tr>
          <th scope="col">Medida</th>
          <th scope="col">Início</th>
          <th scope="col">Alta</th>
          <th scope="col">Variação</th>
        </tr>
      </thead>
      <tbody>
        {dados.map(l => {
          const delta = l.inicio != null && l.fim != null ? l.fim - l.inicio : undefined
          const melhorou = delta == null || delta === 0 || l.melhorQuando === 'neutro'
            ? null
            : (l.melhorQuando === 'menor' ? delta < 0 : delta > 0)
          return (
            <tr key={l.rotulo}>
              <th scope="row" className={styles.rotulo}>{l.rotulo}</th>
              <td className={styles.num}>{fmt(l.inicio, l.casas)}{l.unidade && <small> {l.unidade}</small>}</td>
              <td className={styles.num}>{fmt(l.fim, l.casas)}{l.unidade && <small> {l.unidade}</small>}</td>
              <td className={styles.num}>
                {delta == null ? '—' : (
                  // Sinal + palavra, nunca só cor: "−12 melhorou" se lê em
                  // impressão preto e branco e por quem não distingue as cores.
                  <span className={melhorou === null ? '' : melhorou ? styles.melhor : styles.pior}>
                    {delta > 0 ? '+' : ''}{fmt(delta, l.casas)}
                    {melhorou !== null && <small> {melhorou ? 'melhorou' : 'piorou'}</small>}
                  </span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
