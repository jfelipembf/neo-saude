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
  function adicionar() {
    const proxima = rows.length ? Math.max(...rows.map(r => r.parcelas)) + 1 : 2
    onChange([...rows, { parcelas: proxima, taxa: 0 }])
  }

  function remover(indice: number) {
    onChange(rows.filter((_, i) => i !== indice))
  }

  function mudar(indice: number, campo: keyof InstallmentRate, valor: number) {
    onChange(rows.map((r, i) => (i === indice ? { ...r, [campo]: valor } : r)))
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
            value={row.parcelas}
            onChange={e => mudar(i, 'parcelas', Number(e.target.value))}
            aria-label={`Número de parcelas da linha ${i + 1}`}
          />
          <Input
            type="number"
            min={0}
            step={0.01}
            value={row.taxa}
            onChange={e => mudar(i, 'taxa', Number(e.target.value))}
            aria-label={`Taxa da linha ${i + 1}`}
          />
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconX />}
            onClick={() => remover(i)}
            title="Remover parcela"
            aria-label={`Remover linha de ${row.parcelas} parcelas`}
          />
        </div>
      ))}

      {rows.length === 0 && <p className={styles.parcelaVazia}>Nenhuma parcela configurada.</p>}

      <div>
        <Button size="sm" variant="outline" onClick={adicionar}>+ Nova parcela</Button>
      </div>
    </div>
  )
}
