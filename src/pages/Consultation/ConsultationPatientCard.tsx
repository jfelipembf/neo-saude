import type { ReactNode } from 'react'
import { Button } from '@/components/Button/Button'
import { IconEmail, IconLogout, IconPhone } from '@/components/icons'
import { ConsultationTimer } from './ConsultationTimer'
import { formatPhone } from '@/utils/format'
import { initials } from '@/utils/text'
import { idadeDoPaciente } from '@/utils/patientAge'
import type { Patient } from '@/types/domain'
import type { PatientMedication } from '@/services/medicationsService'
import styles from './ConsultationPage.module.scss'

interface ConsultationPatientCardProps {
  paciente?: Patient
  /** Medicação EM USO. Leitura, sempre — inclusive na fisioterapia, que não
   *  prescreve mas precisa saber o que o paciente toma. */
  medicacoes: PatientMedication[]
  /** Início do atendimento nesta aba; `null` = não começou. */
  inicio: Date | null
  onSair: () => void
  /** Conteúdo próprio de cada especialidade (sessões do pacote, timeline…). */
  children?: ReactNode
}

/**
 * A COLUNA ESQUERDA: quem está na cadeira.
 *
 * Igual nas duas telas de atendimento — médico e fisioterapeuta olham para a
 * mesma pessoa, com o mesmo contato e a mesma medicação em uso. O que cada
 * especialidade acrescenta entra por `children`.
 *
 * O cronômetro e o "Sair" ficam no PÉ da coluna: sair é gesto explícito, e no
 * topo ficava colado no "Finalizar", dois botões de encerrar lado a lado — um
 * que grava e outro que descarta.
 */
export function ConsultationPatientCard({
  paciente, medicacoes, inicio, onSair, children,
}: ConsultationPatientCardProps) {
  const idade = idadeDoPaciente(paciente?.birthDate)
  const emUso = medicacoes.filter(m => !m.endedOn)

  return (
    <>
      <div className={styles.paciente}>
        <span className={styles.avatar}>
          {paciente?.photo
            ? <img src={paciente.photo} alt="" className={styles.avatarImg} />
            : initials(paciente?.name ?? '')}
        </span>
        <strong className={styles.pacienteNome}>{paciente?.name}</strong>
        {idade && <span className={styles.pacienteIdade}>{idade}</span>}
        {paciente?.phone && (
          <span className={styles.contato}><IconPhone />{formatPhone(paciente.phone)}</span>
        )}
        {paciente?.email && (
          <span className={styles.contato}><IconEmail />{paciente.email}</span>
        )}

        {/* MEDICAÇÃO EM USO à vista o tempo todo: é o que muda conduta na hora,
            e obrigar dois cliques para vê-la é o mesmo que não ter. */}
        {emUso.length > 0 && (
          <dl className={styles.resumoClinico}>
            <dt>Em uso</dt>
            {/* Só nome e posologia, uma por linha. Desde quando e histórico de
                trocas vivem no painel — aqui empurrariam o resto para fora. */}
            <dd>
              <ul className={styles.resumoMedicacoes}>
                {emUso.map(m => (
                  <li key={m.id}>
                    {m.name}
                    {m.continuous && <span className={styles.selo}>contínuo</span>}
                    {m.dosage && <span className={styles.resumoDose}> · {m.dosage}</span>}
                  </li>
                ))}
              </ul>
            </dd>
          </dl>
        )}
      </div>

      {children}

      <div className={styles.rodapeEsquerda}>
        {inicio && <ConsultationTimer startedAt={inicio} />}
        {/* Vermelho CLARO: sair não destrói nada (texto não salvo ainda passa
            pelo ConfirmDialog), então sinaliza a saída sem gritar. */}
        <Button
          variant="ghost"
          size="sm"
          className={styles.botaoSair}
          iconLeft={<IconLogout />}
          onClick={onSair}
          aria-label="Sair do atendimento"
          title="Sair do atendimento"
        >
          Sair
        </Button>
      </div>
    </>
  )
}
