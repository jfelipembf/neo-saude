import { Input } from '@/components/Input/Input'
import type { Endereco } from '@/types/domain'
import styles from './ClinicTab.module.scss'

interface AddressFieldsProps {
  value: Endereco
  onChange: (campo: keyof Endereco, valor: string) => void
}

/** Bloco de endereço compartilhado pelos formulários da página Inicial. */
export function AddressFields({ value, onChange }: AddressFieldsProps) {
  return (
    <>
      <div className={styles.grid2}>
        <Input
          label="CEP"
          placeholder="00000-000"
          value={value.cep}
          onChange={e => onChange('cep', e.target.value)}
        />
        <Input
          label="Estado"
          placeholder="UF"
          maxLength={2}
          value={value.estado}
          onChange={e => onChange('estado', e.target.value.toUpperCase())}
        />
      </div>
      <div className={styles.grid2}>
        <Input
          label="Cidade"
          placeholder="Aracaju"
          value={value.cidade}
          onChange={e => onChange('cidade', e.target.value)}
        />
        <Input
          label="Bairro"
          placeholder="Centro"
          value={value.bairro}
          onChange={e => onChange('bairro', e.target.value)}
        />
      </div>
      <div className={styles.grid2}>
        <Input
          label="Rua"
          placeholder="Av. Beira Mar"
          value={value.rua}
          onChange={e => onChange('rua', e.target.value)}
        />
        <Input
          label="Número"
          placeholder="1234"
          value={value.numero}
          onChange={e => onChange('numero', e.target.value)}
        />
      </div>
    </>
  )
}
