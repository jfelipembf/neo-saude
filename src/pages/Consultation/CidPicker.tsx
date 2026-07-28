import { useState } from 'react'
import { Input } from '@/components/Input/Input'
import { Button } from '@/components/Button/Button'
import { IconX } from '@/components/icons'
import { useCid10Search } from '@/hooks/useCid10'
import type { Cid10 } from '@/services/cid10Service'
import styles from './ConsultationPage.module.scss'

interface CidPickerProps {
  value?: Cid10
  onChange: (cid?: Cid10) => void
}

/**
 * BUSCA DO CID-10 para o atestado.
 *
 * Aceita as duas formas de procurar porque são as duas que acontecem: o médico
 * que já sabe digita "J18" e o que não sabe digita "pneumonia". A busca roda no
 * SERVIDOR — são 12 mil códigos, e trazer a tabela para o navegador seria 1,3 MB
 * para preencher um campo.
 *
 * Escolhido, o campo vira o código selecionado com um X: deixar a caixa de busca
 * aberta com o texto digitado faria parecer que ainda não foi escolhido.
 */
export function CidPicker({ value, onChange }: CidPickerProps) {
  const [termo, setTermo] = useState('')
  const { data: resultados, isFetching } = useCid10Search(termo)

  if (value) {
    return (
      <div className={styles.cidEscolhido}>
        <div>
          <strong>{value.display}</strong>
          <span className={styles.cidDescricao}>{value.description}</span>
        </div>
        <Button
          variant="ghost" size="sm" iconLeft={<IconX />}
          aria-label="Trocar CID"
          onClick={() => { onChange(undefined); setTermo('') }}
        />
      </div>
    )
  }

  return (
    <div className={styles.cidBusca}>
      <Input
        label="CID-10 (opcional)"
        placeholder="Código ou doença — ex.: J18 ou pneumonia"
        value={termo}
        onChange={e => setTermo(e.target.value)}
      />

      {termo.trim().length >= 2 && (
        <ul className={styles.cidLista}>
          {isFetching && <li className={styles.cidVazio}>Procurando…</li>}
          {!isFetching && (resultados ?? []).length === 0 && (
            <li className={styles.cidVazio}>Nenhum código encontrado.</li>
          )}
          {(resultados ?? []).map(c => (
            <li key={c.code}>
              <button type="button" className={styles.cidItem} onClick={() => onChange(c)}>
                <strong>{c.display}</strong>
                <span className={styles.cidDescricao}>{c.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
