import { Input } from '@/components/Input/Input'
import { useCep } from '@/hooks/useCep'
import type { Address } from '@/types/domain'
import styles from './AccountTab.module.scss'

interface AddressFieldsProps {
  value: Address
  onChange: (field: keyof Address, value: string) => void
}

/** Bloco de endereço dos cadastros. Ao completar o CEP, estado/cidade/bairro/rua
 *  se preenchem sozinhos (ViaCEP). */
export function AddressFields({ value, onChange }: AddressFieldsProps) {
  const { searchCep, searching, error } = useCep()

  /** Guarda o CEP digitado e, quando completo, traz o endereço. */
  async function handleCepChange(cep: string) {
    onChange('cep', cep)

    const address = await searchCep(cep)
    if (!address) return   // incompleto, inexistente ou serviço fora do ar

    // O `set` do formulário usa update funcional — pode encadear em sequência.
    onChange('state', address.state)
    onChange('city', address.city)
    onChange('neighborhood', address.neighborhood)
    onChange('street', address.street)
    // O número não vem do CEP: continua com o usuário.
  }

  return (
    <>
      <div className={styles.grid2}>
        <Input
          label="CEP"
          placeholder="00000-000"
          inputMode="numeric"
          value={value.cep}
          onChange={e => handleCepChange(e.target.value)}
          hint={searching ? 'Buscando endereço...' : undefined}
          error={error}
        />
        <Input
          label="Estado"
          placeholder="UF"
          maxLength={2}
          value={value.state}
          onChange={e => onChange('state', e.target.value.toUpperCase())}
        />
      </div>
      <div className={styles.grid2}>
        <Input
          label="Cidade"
          placeholder="Aracaju"
          value={value.city}
          onChange={e => onChange('city', e.target.value)}
        />
        <Input
          label="Bairro"
          placeholder="Centro"
          value={value.neighborhood}
          onChange={e => onChange('neighborhood', e.target.value)}
        />
      </div>
      <div className={styles.grid2}>
        <Input
          label="Rua"
          placeholder="Av. Beira Mar"
          value={value.street}
          onChange={e => onChange('street', e.target.value)}
        />
        <Input
          label="Número"
          placeholder="1234"
          value={value.number}
          onChange={e => onChange('number', e.target.value)}
        />
      </div>
    </>
  )
}
