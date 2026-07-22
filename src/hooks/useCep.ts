import { useState } from 'react'
import { digitsOnly } from '@/utils/text'

/** Endereço devolvido pela consulta de CEP (só o que os formulários usam). */
export interface AddressFromCep {
  state: string
  city: string
  neighborhood: string
  street: string
}

/** Resposta crua do ViaCEP (campos que interessam). */
interface ViaCepResponse {
  uf?: string
  localidade?: string
  bairro?: string
  logradouro?: string
  erro?: boolean | string
}

/**
 * Consulta de CEP (ViaCEP) para autopreencher estado/cidade/bairro/rua.
 *
 * const { searchCep, searching, error } = useCep()
 * const address = await searchCep(cep)   // null se o CEP não existir
 *
 * O componente decide o que fazer com o resultado — normalmente preencher os
 * campos vazios do formulário e deixar o número para o usuário.
 */
export function useCep() {
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  async function searchCep(cep: string): Promise<AddressFromCep | null> {
    const digits = digitsOnly(cep)
    // CEP incompleto não é erro: o usuário ainda está digitando.
    if (digits.length !== 8) return null

    setSearching(true)
    setError('')
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      if (!response.ok) throw new Error('falha na consulta')

      const data: ViaCepResponse = await response.json()
      if (data.erro) {
        setError('CEP não encontrado.')
        return null
      }

      return {
        state: data.uf ?? '',
        city: data.localidade ?? '',
        neighborhood: data.bairro ?? '',
        street: data.logradouro ?? '',
      }
    } catch {
      // Sem internet ou serviço fora: o usuário preenche à mão, sem travar.
      setError('Não foi possível consultar o CEP.')
      return null
    } finally {
      setSearching(false)
    }
  }

  return { searchCep, searching, error }
}
