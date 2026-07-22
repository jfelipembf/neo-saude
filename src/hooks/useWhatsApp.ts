import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  conectarWhatsApp, desconectarWhatsApp, getConexaoWhatsApp, listAutomacoes,
  renovarQrWhatsApp, salvarAutomacao,
} from '@/services/whatsappService'
import type { EditAutomation } from '@/services/whatsappService'
import type { AutomationTrigger } from '@/types/domain'

export function useConexaoWhatsApp() {
  return useQuery({ queryKey: queryKeys.whatsapp.conexao, queryFn: getConexaoWhatsApp })
}

/** Parear (mock), encerrar a sessão e renovar o QR — todas recarregam a conexão. */
export function useConectarWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: conectarWhatsApp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.conexao }),
  })
}

export function useDesconectarWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: desconectarWhatsApp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.conexao }),
  })
}

export function useRenovarQrWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: renovarQrWhatsApp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.conexao }),
  })
}

export function useAutomacoes() {
  return useQuery({ queryKey: queryKeys.whatsapp.automacoes, queryFn: listAutomacoes })
}

/** Salva uma automação (liga/desliga, texto, horário) e recarrega a lista. */
export function useSalvarAutomacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ gatilho, dados }: { gatilho: AutomationTrigger; dados: EditAutomation }) =>
      salvarAutomacao(gatilho, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.automacoes }),
  })
}
