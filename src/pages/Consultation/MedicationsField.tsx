import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { IconPlus, IconTrash } from '@/components/icons'
import { posologiaPorExtenso } from '@/utils/prescriptionDosage'
import type { PrescribedMedication } from '@/types/domain'
import styles from './ConsultationPage.module.scss'

interface MedicationsFieldProps {
  value: PrescribedMedication[]
  onChange: (meds: PrescribedMedication[]) => void
}

const VAZIO = { nome: '', dose: '', vezes: '', dias: '' }

/**
 * OS MEDICAMENTOS DA RECEITA — vários, um a um.
 *
 * O formulário coleta os pedaços separados (dose, vezes ao dia, dias) porque é
 * assim que o médico pensa; o que vai para o papel é a frase montada por
 * posologiaPorExtenso (9 testes), porque é assim que o paciente e o
 * farmacêutico leem. A linha já adicionada mostra a frase final — o médico
 * confere o que o paciente vai ler, não o que ele digitou.
 */
export function MedicationsField({ value, onChange }: MedicationsFieldProps) {
  const [novo, setNovo] = useState(VAZIO)

  function adicionar() {
    const nome = novo.nome.trim()
    if (!nome) return
    onChange([...value, {
      name: nome,
      dosage: posologiaPorExtenso({
        dose: novo.dose,
        vezesAoDia: novo.vezes ? Number(novo.vezes) : undefined,
        dias: novo.dias ? Number(novo.dias) : undefined,
      }),
    }])
    setNovo(VAZIO)
  }

  return (
    <div className={styles.medicamentos}>
      {value.length > 0 && (
        <ol className={styles.medLista}>
          {value.map((m, i) => (
            <li key={`${m.name}-${i}`} className={styles.medItem}>
              <div className={styles.medTexto}>
                <strong>{m.name}</strong>
                {m.dosage && <span className={styles.medPosologia}>{m.dosage}</span>}
              </div>
              <Button
                variant="ghost" size="sm" iconLeft={<IconTrash />}
                aria-label={`Remover ${m.name}`}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              />
            </li>
          ))}
        </ol>
      )}

      <div className={styles.medForm}>
        <Input
          label="Medicamento"
          placeholder="Ex.: Amoxicilina 500 mg"
          value={novo.nome}
          onChange={e => setNovo(n => ({ ...n, nome: e.target.value }))}
          // Enter adiciona: prescrever é digitar em sequência, e tirar a mão do
          // teclado a cada medicamento é o que faz o médico desistir da tela.
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionar() } }}
        />
        <div className={styles.medGrid}>
          <Input
            label="Dose por vez"
            placeholder="1 comprimido"
            value={novo.dose}
            onChange={e => setNovo(n => ({ ...n, dose: e.target.value }))}
          />
          <Input
            label="Vezes ao dia"
            type="number" min={1} max={24}
            placeholder="3"
            value={novo.vezes}
            onChange={e => setNovo(n => ({ ...n, vezes: e.target.value }))}
          />
          <Input
            label="Dias"
            type="number" min={1}
            placeholder="7"
            value={novo.dias}
            onChange={e => setNovo(n => ({ ...n, dias: e.target.value }))}
          />
        </div>

        {/* Prévia da frase ANTES de adicionar: é ela que vai no papel, e ver
            "a cada 8 horas" nascer de "3 vezes ao dia" evita o médico achar
            que o campo não foi entendido. */}
        {(novo.dose || novo.vezes || novo.dias) && (
          <p className={styles.medPreviaLinha}>
            {posologiaPorExtenso({
              dose: novo.dose,
              vezesAoDia: novo.vezes ? Number(novo.vezes) : undefined,
              dias: novo.dias ? Number(novo.dias) : undefined,
            }) || '—'}
          </p>
        )}

        <Button
          size="sm" variant="outline" iconLeft={<IconPlus />}
          disabled={!novo.nome.trim()}
          onClick={adicionar}
        >
          Adicionar medicamento
        </Button>
      </div>
    </div>
  )
}
