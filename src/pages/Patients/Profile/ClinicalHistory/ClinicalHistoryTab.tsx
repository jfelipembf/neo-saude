import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { IconDocument } from '@/components/icons'
import { useClinicalEntries } from '@/hooks/useClinicalEntries'
import { usePatientMedications } from '@/hooks/useMedications'
import { CLINICAL_SECTIONS } from '@/pages/Consultation/clinicalSections'
import styles from './ClinicalHistoryTab.module.scss'

/**
 * O HISTÓRICO CLÍNICO do paciente, fora do atendimento.
 *
 * Problemas de saúde, antecedentes cirúrgicos, histórico familiar, riscos e
 * medicação em uso são anotados na tela cheia de Atendimento — e ficavam
 * alcançáveis SÓ de dentro de uma consulta aberta. Quem atende ao telefone, ou
 * o médico revendo o caso entre consultas, não tinha como ver se o paciente é
 * alérgico ou o que ele toma.
 *
 * Aqui é LEITURA. Anotar continua sendo no atendimento, onde a entrada nasce
 * ligada à consulta em que foi dita — o que responde "quando ele contou isso?".
 */
export function ClinicalHistoryTab({ patientId }: { patientId: string }) {
  const { data: entradas, isLoading } = useClinicalEntries(patientId)
  const { data: medicacoes, isLoading: carregandoMed } = usePatientMedications(patientId)

  if (isLoading || carregandoMed) return <PageLoader />

  // Anamnese tem aba própria (é questionário, não anotação) — as outras seções
  // saem todas da mesma lista que a tela de atendimento usa, para os rótulos
  // não divergirem entre as duas telas.
  const secoes = CLINICAL_SECTIONS.filter(s => s.kind !== 'anamnesis' && s.kind !== 'medications')

  const emUso = (medicacoes ?? []).filter(m => !m.endedOn)
  const encerradas = (medicacoes ?? []).filter(m => m.endedOn)
  const temAlgo = (entradas ?? []).length > 0 || (medicacoes ?? []).length > 0

  if (!temAlgo) {
    return (
      <EmptyState
        icon={<IconDocument />}
        title="Nada registrado ainda"
        description="Problemas de saúde, antecedentes, histórico familiar e medicação são anotados durante o atendimento — e aparecem aqui."
      />
    )
  }

  return (
    <div className={styles.wrap}>
      {/* MEDICAÇÃO PRIMEIRO: é o que muda a conduta de quem abre esta aba com o
          paciente na linha. */}
      {(emUso.length > 0 || encerradas.length > 0) && (
        <section className={styles.bloco}>
          <h3 className={styles.titulo}>Medicação em uso</h3>

          {emUso.length === 0 ? (
            <p className={styles.vazio}>Nenhuma medicação em uso.</p>
          ) : (
            <ul className={styles.lista}>
              {emUso.map(m => (
                <li key={m.id} className={styles.item}>
                  <strong className={styles.itemTitulo}>
                    {m.name}
                    {m.continuous && <span className={styles.selo}>contínuo</span>}
                  </strong>
                  {m.dosage && <span className={styles.itemTexto}>{m.dosage}</span>}
                  <span className={styles.itemData}>desde {m.startedOn}</span>
                </li>
              ))}
            </ul>
          )}

          {encerradas.length > 0 && (
            <>
              <h4 className={styles.subtitulo}>Encerradas</h4>
              <ul className={styles.lista}>
                {encerradas.map(m => (
                  <li key={m.id} className={`${styles.item} ${styles.itemFraco}`}>
                    <strong className={styles.itemTitulo}>{m.name}</strong>
                    {m.dosage && <span className={styles.itemTexto}>{m.dosage}</span>}
                    <span className={styles.itemData}>{m.startedOn} — {m.endedOn}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {secoes.map(secao => {
        const desta = (entradas ?? []).filter(e => e.kind === secao.kind)
        if (desta.length === 0) return null

        return (
          <section key={secao.kind} className={styles.bloco}>
            <h3 className={styles.titulo}>{secao.label}</h3>
            <ul className={styles.lista}>
              {desta.map(e => (
                <li key={e.id} className={styles.item}>
                  {/* Parentesco no lugar da data no histórico familiar — mesma
                      regra da tela de atendimento (a idade em que o pai
                      infartou entra no próprio achado). */}
                  {secao.campos?.parentesco
                    ? e.relation && <span className={styles.itemData}>{e.relation}</span>
                    : <span className={styles.itemData}>{e.eventDate ?? e.date}</span>}
                  <span className={styles.itemTexto}>{e.content}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
