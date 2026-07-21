import { useState } from 'react'
import { somenteDigitos } from '@/utils/text'

/** Endereço devolvido pela consulta de CEP (só o que os formulários usam). */
export interface AddressFromCep {
  estado: string
  cidade: string
  bairro: string
  rua: string
}

/** Resposta crua do ViaCEP (campos que interessam). */
interface RespostaViaCep {
  uf?: string
  localidade?: string
  bairro?: string
  logradouro?: string
  erro?: boolean | string
}

/**
 * Consulta de CEP (ViaCEP) para autopreencher estado/cidade/bairro/rua.
 *
 * const { buscarCep, buscando, erro } = useCep()
 * const endereco = await buscarCep(cep)   // null se o CEP não existir
 *
 * O componente decide o que fazer com o resultado — normalmente preencher os
 * campos vazios do formulário e deixar o número para o usuário.
 */
export function useCep() {
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState('')

  async function buscarCep(cep: string): Promise<AddressFromCep | null> {
    const digitos = somenteDigitos(cep)
    // CEP incompleto não é erro: o usuário ainda está digitando.
    if (digitos.length !== 8) return null

    setBuscando(true)
    setErro('')
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
      if (!resposta.ok) throw new Error('falha na consulta')

      const dados: RespostaViaCep = await resposta.json()
      if (dados.erro) {
        setErro('CEP não encontrado.')
        return null
      }

      return {
        estado: dados.uf ?? '',
        cidade: dados.localidade ?? '',
        bairro: dados.bairro ?? '',
        rua: dados.logradouro ?? '',
      }
    } catch {
      // Sem internet ou serviço fora: o usuário preenche à mão, sem travar.
      setErro('Não foi possível consultar o CEP.')
      return null
    } finally {
      setBuscando(false)
    }
  }

  return { buscarCep, buscando, erro }
}
