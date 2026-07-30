import { useState } from 'react'
import { useClinic } from '@/hooks/useClinic'
import { useCurrentUser } from '@/hooks/useUser'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { colherDadosDoTratamento, gerarAnalise } from '@/services/physioReportService'
import { CLINICAL_DOCUMENT_STYLES } from '@/utils/clinicalDocument'
import { PHYSIO_REPORT_STYLES, physioReportBody } from '@/utils/physioReportDocument'
import { formatCpf } from '@/utils/format'
import { formatLongDate, isoToBrDate, toIsoDate } from '@/utils/date'
import type { CarePlan } from '@/services/carePlansService'
import type { Patient } from '@/types/domain'

/**
 * GERAR O RELATÓRIO DE EVOLUÇÃO de um tratamento — colher, analisar, imprimir.
 *
 * A ordem importa e a espera é real: colher são três consultas ao banco e a
 * análise é uma ida à IA. Por isso o estado `gerando` é por TRATAMENTO e não
 * global — a lista tem vários cartões, e travar todos porque um está sendo
 * gerado esconderia qual deles está trabalhando.
 *
 * A ANÁLISE NÃO É PRÉ-REQUISITO. Se ela falhar, o relatório sai assim mesmo,
 * com as tabelas do que foi medido — ver o docblock de physioReportDocument.
 */
export function usePhysioReport(paciente?: Patient) {
  const { data: clinica } = useClinic()
  const { data: usuario } = useCurrentUser()
  const imprimir = usePrintDocument()
  /** Qual plano está sendo gerado — `null` quando nenhum. */
  const [gerando, setGerando] = useState<string | null>(null)

  async function gerar(plano: CarePlan) {
    if (!paciente || gerando) return
    setGerando(plano.id)
    try {
      const dados = await colherDadosDoTratamento(paciente.id, plano.id)
      const tratamento = plano.titulo?.trim() || 'Tratamento fisioterapêutico'
      const situacao = plano.status === 'active' ? 'Em andamento' as const : 'Finalizado' as const

      const analise = await gerarAnalise({
        tratamento,
        situacao,
        sessoesRealizadas: plano.sessoesRealizadas,
        sessoesPrevistas: plano.sessoesPrevistas,
        dados,
      })

      const hojeBr = isoToBrDate(toIsoDate(new Date())) ?? ''
      const html = physioReportBody({
        patientName: paciente.name,
        patientCpf: paciente.cpf ? formatCpf(paciente.cpf) : undefined,
        tratamento,
        inicio: plano.inicio,
        fim: plano.fim,
        situacao,
        sessoesRealizadas: plano.sessoesRealizadas,
        sessoesPrevistas: plano.sessoesPrevistas,
        ...dados,
        longDate: formatLongDate(hojeBr),
        city: clinica?.city,
        // Quem gera é quem assina — o relatório é leitura clínica, e leitura
        // tem autor.
        signer: {
          name: usuario?.name ?? '',
          license: usuario?.license ?? '',
          specialty: 'physiotherapy',
        },
        analise,
      })

      imprimir({
        title: 'Relatório de evolução',
        subtitle: tratamento,
        body: html,
        // UMA FOLHA, assinatura inclusa: o relatório é lido de relance por
        // quem recebe (paciente, convênio, médico que encaminhou), e a
        // assinatura sozinha na segunda página é o defeito clássico deste tipo
        // de documento. Ver ajustarParaUmaPagina em usePrintDocument.
        fitToPage: true,
        // A base clínica primeiro (assinatura, local e data) e a folha do
        // relatório depois, que acrescenta as tabelas e a análise.
        styles: `${CLINICAL_DOCUMENT_STYLES}${PHYSIO_REPORT_STYLES}`,
      })
    } finally {
      setGerando(null)
    }
  }

  return { gerar, gerando }
}
