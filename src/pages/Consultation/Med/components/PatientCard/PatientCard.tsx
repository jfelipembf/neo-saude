import { IconEmail, IconPhone } from '@/components/icons'
import { formatPhone } from '@/utils/format'
import { idadeDoPaciente } from '@/utils/patientAge'
import { initials } from '@/utils/text'
import type { ClinicalEntry } from '@/services/clinicalEntriesService'
import type { PatientMedication } from '@/services/medicationsService'
import type { Patient } from '@/types/domain'
import styles from './PatientCard.module.scss'

interface PatientCardProps {
  paciente?: Patient
  /** TODAS as medicações; o filtro de "em uso" é feito aqui dentro, para que
   *  quem chama não precise repetir a mesma regra em cada tela. */
  medicacoes: PatientMedication[]
  /** Já filtradas por quem chama: cada especialidade sabe qual `kind` é o seu
   *  diagnóstico — na medicina é `problems`, e na fisioterapia o recorte ainda
   *  passa pelo tratamento ativo. */
  diagnosticos: ClinicalEntry[]
}

/**
 * QUEM ESTÁ NA CADEIRA — a coluna da direita do atendimento.
 *
 * Existe para responder, sem clique, as duas perguntas que mudam conduta na
 * hora: o que a pessoa TOMA e o que ela TEM. Ambas viviam atrás de uma seção do
 * menu, e obrigar dois cliques para vê-las é o mesmo que não tê-las.
 *
 * Fica na altura do menu lateral, do outro lado: a navegação à esquerda, o
 * contexto à direita e o trabalho no meio. Some no celular junto com o menu —
 * lá a identidade do paciente já está no cabeçalho, e uma terceira coluna não
 * cabe.
 */
export function PatientCard({ paciente, medicacoes, diagnosticos }: PatientCardProps) {
  const idade = idadeDoPaciente(paciente?.birthDate)
  const emUso = medicacoes.filter(m => !m.endedOn)

  return (
    <aside className={styles.raiz} aria-label="Dados do paciente">
      <div className={styles.identidade}>
        <span className={styles.avatar}>
          {paciente?.photo
            ? <img src={paciente.photo} alt="" className={styles.avatarImg} />
            : initials(paciente?.name ?? '')}
        </span>
        <strong className={styles.nome}>{paciente?.name}</strong>
        {idade && <span className={styles.idade}>{idade}</span>}

        {paciente?.phone && (
          <span className={styles.contato}><IconPhone />{formatPhone(paciente.phone)}</span>
        )}
        {paciente?.email && (
          <span className={styles.contato}><IconEmail />{paciente.email}</span>
        )}
      </div>

      {/* MEDICAÇÃO EM USO: só nome, selo de contínuo e posologia. Desde quando e
          o histórico de trocas vivem na seção de Medicações — aqui empurrariam
          o diagnóstico para fora da vista. */}
      {emUso.length > 0 && (
        <section className={styles.bloco}>
          <h3 className={styles.blocoTitulo}>Em uso</h3>
          <ul className={styles.lista}>
            {emUso.map(m => (
              <li key={m.id} className={styles.item}>
                {/* Nome e selo na PRIMEIRA linha, posologia na segunda. Tudo
                    corrido numa linha só fazia "Lisdexanfetamina" colar no
                    "contínuo" e a posologia longa quebrar no meio do nome. */}
                <span className={styles.itemLinha}>
                  <span className={styles.itemNome}>{m.name}</span>
                  {m.continuous && <span className={styles.selo}>contínuo</span>}
                </span>
                {m.dosage && <span className={styles.dose}>{m.dosage}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {diagnosticos.length > 0 && (
        <section className={styles.bloco}>
          <h3 className={styles.blocoTitulo}>Diagnóstico</h3>
          <ul className={styles.lista}>
            {diagnosticos.map(d => (
              <li key={d.id} className={`${styles.item} ${styles.itemDiagnostico}`}>
                <span className={styles.itemNome}>{d.content}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  )
}
