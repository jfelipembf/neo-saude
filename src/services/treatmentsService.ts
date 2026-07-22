import { MOCK_TREATMENTS } from '@/mocks/treatments'
import type { UsedMaterial, ToothStatus, Treatment } from '@/types/domain'
import { CURRENT_CLINIC } from '@/lib/tenant'

/**
 * O tratamento nasce VAZIO (sem odontograma) e recebe PROCEDIMENTOS (sessões)
 * ao longo dos dias — cada procedimento traz descrição, data, o que foi
 * sinalizado no odontograma e os dentes envolvidos.
 */
export interface NewTreatment {
  patientId: string
  procedure: string   // descrição do tratamento
  date: string           // dd/mm/aaaa (início)
}

/** Dados de UM procedimento registrado pelo editor com odontograma. */
export interface NewTreatmentSession {
  description?: string     // nome do procedimento
  date: string           // dd/mm/aaaa
  actions: string[]
  teeth?: string[]      // dentes sinalizados (mesclados no tratamento)
  materials?: UsedMaterial[]
  notes?: string
  /** Valor cobrado pelo procedimento. */
  amount?: number
  /** Snapshot do odontograma (payload do motor) — reabre a ficha marcada. */
  odontogram?: Record<string, unknown>
  /** Situação do tratamento APÓS este procedimento. */
  statusAfter: ToothStatus
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// viram as tabelas `treatments` 1—N `tratamento_sessoes` (mesmas assinaturas).
export async function listPatientTreatments(patientId: string): Promise<Treatment[]> {
  return MOCK_TREATMENTS.filter(t => t.patientId === patientId)
}

// Contadores de id do mock — no Supabase os ids virão do banco.
let nextId = 100
let nextSessionId = 100

/** Cria o tratamento (guarda-chuva) vazio — os procedimentos vêm depois. */
export async function addTreatment(payload: NewTreatment): Promise<void> {
  MOCK_TREATMENTS.unshift({
    id: `t${nextId++}`, clinicId: CURRENT_CLINIC,
    patientId: payload.patientId,
    procedure: payload.procedure,
    status: 'open',
    startedAt: payload.date,
    sessions: [],
  })
}

/** Adiciona um procedimento ao tratamento (dias diferentes, mesmo tratamento). */
export async function addTreatmentSession(treatmentId: string, session: NewTreatmentSession): Promise<void> {
  const treatment = MOCK_TREATMENTS.find(t => t.id === treatmentId)
  if (!treatment) return

  const { statusAfter, ...sessionPayload } = session
  treatment.sessions.push({ id: `s${nextSessionId++}`, ...sessionPayload })
  treatment.status = statusAfter
  treatment.completedAt = statusAfter !== 'open' ? session.date : undefined

  // Mescla os dentes trabalhados neste procedimento aos do tratamento.
  if (session.teeth?.length) {
    const current = treatment.tooth ? treatment.tooth.split(', ') : []
    treatment.tooth = [...new Set([...current, ...session.teeth])].join(', ')
  }
}
