import { useImperativeHandle, useState } from 'react'
import type { Ref } from 'react'
import { Textarea } from '@/components/Textarea/Textarea'
import { useSetCarePlanOpeningNotes } from '@/hooks/useCarePlans'
import { errorMessage } from '@/utils/errors'
import styles from './TreatmentNotes.module.scss'

/** O que a tela de fora (o roteiro) pode pedir a este painel. */
export interface TreatmentNotesHandle {
  salvar: () => Promise<void>
}

interface TreatmentNotesProps {
  patientId: string
  planId: string
  valorInicial?: string
  ref?: Ref<TreatmentNotesHandle>
}

/**
 * ÚLTIMA ETAPA do roteiro de abertura: um campo de texto livre, sem os campos
 * estruturados das etapas anteriores. É a válvula de escape — o que não coube
 * em diagnóstico, anamnese ou teste (contexto trazido pelo paciente, combinado
 * com outro profissional, uma ressalva sobre o caso) tem para onde ir.
 *
 * OPCIONAL: campo vazio é uma resposta válida, "Concluir abertura" nunca fica
 * bloqueado por aqui — mesma doutrina da etapa de Testes (aplicar teste
 * também é opcional numa sessão).
 */
export function TreatmentNotes({ patientId, planId, valorInicial, ref }: TreatmentNotesProps) {
  const [texto, setTexto] = useState(valorInicial ?? '')
  const { mutateAsync: salvarNotas } = useSetCarePlanOpeningNotes(patientId)

  useImperativeHandle(ref, () => ({
    salvar: async () => {
      try {
        await salvarNotas({ planId, texto: texto.trim() || null })
      } catch (e) {
        throw new Error(errorMessage(e, 'Não foi possível salvar as observações.'), { cause: e })
      }
    },
  }))

  return (
    <div className={styles.raiz}>
      <Textarea
        label="Observações"
        placeholder="Alguma observação sobre o início deste tratamento? (opcional)"
        rows={10}
        value={texto}
        onChange={e => setTexto(e.target.value)}
      />
    </div>
  )
}
