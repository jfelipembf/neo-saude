import { MOCK_ANAMNESES } from '@/mocks/anamneses'
import type { Anamnesis } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('anamneses')… mantendo a MESMA assinatura —
// páginas e hooks não mudam.
// Cópias ({ ...mock }) para o cache do TanStack Query não apontar para o objeto
// mutável (senão salvar não re-renderiza quem assina a query).

/** Ficha do paciente — `null` quando ele ainda não respondeu. */
export async function getAnamneseDoPaciente(pacienteId: string): Promise<Anamnesis | null> {
  const ficha = MOCK_ANAMNESES.find(a => a.pacienteId === pacienteId)
  return ficha ? { ...ficha } : null
}

/** Campos editáveis: tudo menos a chave e a data (que é carimbada ao salvar). */
export type EditAnamnesis = Omit<Anamnesis, 'pacienteId' | 'atualizadaEm'>

/** Cria ou substitui a ficha do paciente, carimbando a data de atualização. */
export async function salvarAnamnese(pacienteId: string, dados: EditAnamnesis): Promise<void> {
  const hoje = new Date().toLocaleDateString('pt-BR')
  const indice = MOCK_ANAMNESES.findIndex(a => a.pacienteId === pacienteId)
  const ficha: Anamnesis = { pacienteId, atualizadaEm: hoje, ...dados }
  if (indice >= 0) MOCK_ANAMNESES[indice] = ficha
  else MOCK_ANAMNESES.push(ficha)
}
