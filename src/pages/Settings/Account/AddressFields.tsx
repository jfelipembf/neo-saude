import { Input } from '@/components/Input/Input'
import { useCep } from '@/hooks/useCep'
import type { Address } from '@/types/domain'
import styles from './AccountTab.module.scss'

interface AddressFieldsProps {
  value: Address
  onChange: (campo: keyof Address, valor: string) => void
}

/** Bloco de endereço dos cadastros. Ao completar o CEP, estado/cidade/bairro/rua
 *  se preenchem sozinhos (ViaCEP). */
export function AddressFields({ value, onChange }: AddressFieldsProps) {
  const { buscarCep, buscando, erro } = useCep()

  /** Guarda o CEP digitado e, quando completo, traz o endereço. */
  async function aoMudarCep(cep: string) {
    onChange('cep', cep)

    const endereco = await buscarCep(cep)
    if (!endereco) return   // incompleto, inexistente ou serviço fora do ar

    // O `set` do formulário usa update funcional — pode encadear em sequência.
    onChange('estado', endereco.estado)
    onChange('cidade', endereco.cidade)
    onChange('bairro', endereco.bairro)
    onChange('rua', endereco.rua)
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
          onChange={e => aoMudarCep(e.target.value)}
          hint={buscando ? 'Buscando endereço...' : undefined}
          error={erro}
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
