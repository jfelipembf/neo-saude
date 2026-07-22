import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { IconX } from '@/components/icons'
import type { InstallmentRate } from '@/types/domain'
import styles from './AcquirersTab.module.scss'

interface InstallmentsEditorProps {
  rows: InstallmentRate[]
  onChange: (rows: InstallmentRate[]) => void
}

/** Editor de taxas por nº de parcelas (usado no formulário da adquirente). */
export function InstallmentsEditor({ rows, onChange }: InstallmentsEditorProps) {
  function addRow() {
    const next = rows.length ? Math.max(...rows.map(r => r.installments)) + 1 : 2
    onChange([...rows, { installments: next, fee: 0 }])
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index))
  }

  function updateRow(index: number, field: keyof InstallmentRate, value: number) {
    onChange(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  return (
    <div className={styles.parcelas}>
      {rows.length > 0 && (
        <div className={styles.parcelaCabecalho}>
          <span>Parcelas</span>
          <span>Taxa (%)</span>
          <span />
        </div>
      )}

      {rows.map((row, i) => (
        <div key={i} className={styles.parcelaLinha}>
          <Input
            type="number"
            min={1}
            value={row.installments}
            onChange={e => updateRow(i, 'installments', Number(e.target.value))}
            aria-label={`Número de parcelas da linha ${i + 1}`}
          />
          <Input
            type="number"
            min={0}
            step={0.01}
            value={row.fee}
            onChange={e => updateRow(i, 'fee', Number(e.target.value))}
            aria-label={`Taxa da linha ${i + 1}`}
          />
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconX />}
            onClick={() => removeRow(i)}
            title="Remover parcela"
            aria-label={`Remover linha de ${row.installments} parcelas`}
          />
        </div>
      ))}

      {rows.length === 0 && <p className={styles.parcelaVazia}>Nenhuma parcela configurada.</p>}

      <div>
        <Button size="sm" variant="outline" onClick={addRow}>+ Nova parcela</Button>
      </div>
    </div>
  )
}
