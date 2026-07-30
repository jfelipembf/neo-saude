import { useState } from 'react'
import type { Ref } from 'react'
import { Button } from '@/components/Button/Button'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconEdit } from '@/components/icons'
import { useSession } from '@/context/SessionProvider'
import { usePatientAnamnesis } from '@/hooks/useAnamnesis'
import { AnamnesisAnswers } from '@/pages/Patients/Profile/Anamnesis/AnamnesisAnswers'
import { AnamnesisForm } from '@/pages/Patients/Profile/Anamnesis/AnamnesisForm'
import type { AnamnesisFormHandle } from '@/pages/Patients/Profile/Anamnesis/AnamnesisForm'
import { sectionsForSpecialty } from '@/pages/Patients/Profile/Anamnesis/questions'
import anamnese from '@/pages/Patients/Profile/Anamnesis/Anamnesis.module.scss'
import styles from './Anamnesis.module.scss'

interface AnamnesisProps {
  patientId: string
  /**
   * Abre já no formulário, sem passar pela leitura.
   *
   * É o caso da ETAPA de um roteiro de abertura: ali a anamnese não é algo que
   * se consulta, é o que se está preenchendo — um botão "Preencher anamnese"
   * seria um clique para chegar onde a pessoa já foi levada.
   *
   * No atendimento comum o padrão continua sendo LEITURA (ver abaixo).
   */
  sempreAberta?: boolean
  /** Com `sempreAberta`, o rodapé do formulário some e quem grava é quem
   *  segura este ref. Sem ele, o formulário mantém o próprio botão. */
  ref?: Ref<AnamnesisFormHandle>
}

/**
 * A FICHA DE ANAMNESE, dentro do atendimento.
 *
 * É a MESMA ficha do perfil do paciente — mesmas perguntas, mesmo formulário,
 * mesma RPC de gravação. Não uma cópia: um segundo questionário aqui faria a
 * clínica ter duas anamneses do mesmo paciente, e a pergunta "ele é alérgico?"
 * passaria a ter duas respostas possíveis dependendo de por onde se olha.
 *
 * O que muda é só o momento: no perfil ela é cadastro; aqui é consulta, e por
 * isso abre em LEITURA. No meio do atendimento o médico quer ver alergia e
 * gestação destacadas em vermelho, não um formulário em branco por cima da
 * resposta que ele foi conferir. Quem inverte isso é `sempreAberta`, e só ela.
 */
export function Anamnesis({ patientId, sempreAberta = false, ref }: AnamnesisProps) {
  const { specialty } = useSession()
  const { data: ficha, isLoading } = usePatientAnamnesis(patientId)
  const [editando, setEditando] = useState(false)
  const secoes = sectionsForSpecialty(specialty)

  if (isLoading) return <Spinner />

  if (sempreAberta || editando) {
    return (
      <AnamnesisForm
        patientId={patientId}
        record={ficha ?? null}
        // Aberta por padrão não tem para onde fechar: o "Cancelar" do
        // formulário voltaria para uma leitura que esta tela não mostra.
        onClose={sempreAberta ? undefined : () => setEditando(false)}
        compact
        semAcoes={sempreAberta}
        ref={ref}
      />
    )
  }

  if (!ficha) {
    return (
      <>
        <p className={styles.vazio}>
          Este paciente ainda não tem anamnese preenchida — alergias, medicamentos
          e condições que mudam a conduta.
        </p>
        <div className={styles.editorRodape}>
          <Button size="sm" iconLeft={<IconEdit />} onClick={() => setEditando(true)}>
            Preencher anamnese
          </Button>
        </div>
      </>
    )
  }

  return (
    <div className={anamnese.compacto}>
      <div className={styles.centroCabecalho}>
        <span className={styles.blocoTitulo}>Atualizada em {ficha.updatedAt}</span>
        <Button size="sm" variant="outline" iconLeft={<IconEdit />} onClick={() => setEditando(true)}>
          Editar
        </Button>
      </div>

      <AnamnesisAnswers record={ficha} sections={secoes} />
    </div>
  )
}
