import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Input } from '@/components/Input/Input'
import { useToast } from '@/components/Toast/Toast'
import { IconPlus, IconTrash } from '@/components/icons'
import { useAddClinicalEntry, useRemoveClinicalEntry } from '@/hooks/useClinicalEntries'
import { errorMessage } from '@/utils/errors'
import type { ClinicalEntry } from '@/services/clinicalEntriesService'
import styles from './ConsultationPage.module.scss'

interface ClinicalFindingsPanelProps {
  patientId: string
  appointmentId: string
  professionalId?: string
  entradas: ClinicalEntry[]
}

/**
 * ACHADOS CLÍNICOS — o que foi encontrado, um por linha.
 *
 * Campo único e botão de adicionar, com a lista logo abaixo. É uma LISTA de
 * problemas, não um texto: "dor lombar", "limitação de flexão de ombro D",
 * "encurtamento de isquiotibiais" são itens que se acumulam e se conferem de
 * relance — e um textarea os transformaria num parágrafo que ninguém relê.
 *
 * Grava no mesmo `patient_clinical_entry` (kind `problems`) que o painel
 * completo em Hoje: mesma informação, duas formas de mexer nela. Aqui é
 * anotação rápida no meio do atendimento; lá é o registro com data do fato,
 * edição e histórico em timeline.
 */
export function ClinicalFindingsPanel({
  patientId, appointmentId, professionalId, entradas,
}: ClinicalFindingsPanelProps) {
  const toast = useToast()
  const { mutate: anotar, isPending } = useAddClinicalEntry()
  const { mutate: excluir } = useRemoveClinicalEntry()

  const [texto, setTexto] = useState('')
  const [aExcluir, setAExcluir] = useState<ClinicalEntry | null>(null)

  const achados = entradas.filter(e => e.kind === 'problems')

  function adicionar(e: FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    anotar({ patientId, appointmentId, kind: 'problems', content: texto, professionalId }, {
      onSuccess: () => {
        setTexto('')
        toast.success('Achado registrado.')
      },
      onError: err => toast.error(errorMessage(err, 'Não foi possível registrar.')),
    })
  }

  return (
    <>
      {/* <form> e não um par solto de campo e botão: Enter adiciona, que é o
          gesto de quem está lançando vários itens seguidos. */}
      <form className={styles.achadoForm} onSubmit={adicionar}>
        <Input
          placeholder="Ex.: limitação de flexão de ombro direito"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          aria-label="Achado clínico"
        />
        <Button type="submit" size="sm" iconLeft={<IconPlus />} loading={isPending} disabled={!texto.trim()}>
          Adicionar
        </Button>
      </form>

      {achados.length === 0 ? (
        <p className={styles.vazio}>Nenhum achado registrado para este paciente.</p>
      ) : (
        <ul className={styles.achados}>
          {achados.map(a => (
            <li key={a.id} className={styles.achado}>
              <span className={styles.achadoTexto}>{a.content}</span>
              <span className={styles.achadoData}>{a.eventDate ?? a.date}</span>
              <Button
                variant="ghost" size="sm" iconLeft={<IconTrash />}
                aria-label={`Excluir ${a.content}`}
                onClick={() => setAExcluir(a)}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={aExcluir !== null}
        onClose={() => setAExcluir(null)}
        onConfirm={() => {
          if (!aExcluir) return
          excluir({ id: aExcluir.id, patientId }, {
            onSuccess: () => toast.success('Achado excluído.'),
            onError: e => toast.error(errorMessage(e, 'Não foi possível excluir.')),
          })
          setAExcluir(null)
        }}
        title="Excluir achado?"
        message={`"${aExcluir?.content ?? ''}" sai do prontuário deste paciente. Se o quadro mudou, prefira registrar um achado novo — o anterior é o que explica a conduta daquela época.`}
        variant="danger"
        confirmLabel="Excluir"
      />
    </>
  )
}
