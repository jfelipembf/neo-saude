import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Button } from '@/components/Button/Button'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { useLeads, useLeadHistory, useUpdateLeadDetails, useConvertLead } from '@/hooks/useLeads'
import {
  AUDIT_HIDDEN_FIELDS, LEAD_STATUS_LABEL, LEAD_STATUS_OPTIONS, auditFieldLabel, buildRoute,
} from '@/constants'
import { userMessage } from '@/lib/errors'
import { IconUser, IconPhone, IconMessage, IconEmail } from '@/components/icons'
import { initials, digitsOnly } from '@/utils/text'
import type { Lead, LeadHistoryEntry, LeadStatus } from '@/types/domain'
import styles from './LeadProfilePage.module.scss'

/** dd/mm/aaaa HH:MM — mesmo formato da Auditoria. */
function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/** Uma entrada do histórico vira 1+ frases em pt (mudança de etapa/observação). */
function describeEntry(entry: LeadHistoryEntry): string[] {
  if (entry.action === 'insert') return ['Contato cadastrado.']
  if (entry.action === 'delete') return ['Contato excluído.']
  const changed = entry.changedFields.filter(f => !AUDIT_HIDDEN_FIELDS.has(f))
  const lines = changed.map(field => {
    if (field === 'status') {
      const to = entry.newData?.status as LeadStatus | undefined
      return `Etapa alterada para "${to ? LEAD_STATUS_LABEL[to] : '—'}".`
    }
    if (field === 'notes') {
      const text = (entry.newData?.notes as string | null | undefined)?.trim()
      return text ? `Observação: "${text}"` : 'Observação removida.'
    }
    if (field === 'patient_id') return 'Convertido em paciente.'
    return `${auditFieldLabel(field)} atualizado.`
  })
  return lines.length ? lines : ['Atualizado.']
}

/**
 * Perfil do LEAD: mesmo desenho do perfil do paciente (card lateral + conteúdo),
 * porém SEM as abas clínicas e com o botão "Converter em paciente". Chega-se aqui
 * pelo "Ver" na lista de leads e pelo card do Kanban.
 */
export function LeadProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data: leads, isLoading } = useLeads()
  const lead = (leads ?? []).find(l => l.id === id) ?? null

  return (
    <>
      <header className={styles.topo}>
        <PageHeader title="Perfil do contato" icon={<IconUser />} />
      </header>

      {isLoading ? (
        <PageLoader />
      ) : !lead ? (
        <EmptyState title="Contato não encontrado" description="Este lead pode ter sido removido." />
      ) : (
        <LeadBody lead={lead} />
      )}
    </>
  )
}

function LeadBody({ lead }: { lead: Lead }) {
  const toast = useToast()
  const navigate = useNavigate()
  const { data: history, isLoading: loadingHistory } = useLeadHistory(lead.id)
  const { mutate: updateDetails, isPending: saving } = useUpdateLeadDetails()
  const { mutate: convert, isPending: converting } = useConvertLead()

  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [notes, setNotes] = useState(lead.notes ?? '')

  function save() {
    updateDetails(
      { id: lead.id, status, notes: notes.trim() || null },
      { onSuccess: () => toast.success('Contato atualizado!') },
    )
  }

  function converter() {
    convert(lead.id, {
      onSuccess: ({ patientId, created }) => {
        toast.success(created ? 'Paciente criado a partir do lead!' : 'Lead vinculado ao paciente existente.')
        navigate(buildRoute.patientProfile(patientId))
      },
      onError: e => toast.error(userMessage(e, 'Não foi possível converter o lead em paciente.')),
    })
  }

  const contacts = [
    { label: 'Telefone', value: lead.phone,  icon: <IconPhone /> },
    { label: 'E-mail',   value: lead.email,   icon: <IconEmail /> },
  ]

  return (
    <div className={styles.grid}>
      {/* ── Card-resumo (lateral) — mesmo desenho do perfil do paciente ── */}
      <section className={styles.resumo} aria-label="Resumo do contato">
        <div className={styles.identidade}>
          <span className={styles.avatar}>{initials(lead.name)}</span>
          <h2 className={styles.nome}>{lead.name}</h2>
          <p className={styles.subtitulo}>{[lead.interest, lead.source].filter(Boolean).join(' · ')}</p>
          {lead.patientId && <span className={styles.convertido}>✓ Convertido em paciente</span>}
        </div>

        <div className={styles.acoesContato}>
          <Button
            variant="outline" iconLeft={<IconPhone />} disabled={!lead.phone}
            onClick={() => { window.location.href = `tel:+55${digitsOnly(lead.phone)}` }}
          >
            Ligar
          </Button>
          <Button
            iconLeft={<IconMessage />} disabled={!lead.phone}
            onClick={() => window.open(`https://wa.me/55${digitsOnly(lead.phone)}`, '_blank')}
          >
            WhatsApp
          </Button>
        </div>

        {lead.patientId ? (
          <Button variant="primary" className={styles.converter} onClick={() => navigate(buildRoute.patientProfile(lead.patientId!))}>
            Abrir paciente
          </Button>
        ) : (
          <Button variant="primary" className={styles.converter} loading={converting} onClick={converter}>
            Converter em paciente
          </Button>
        )}

        <div className={styles.bloco}>
          <h3 className={styles.blocoTitulo}>Contato</h3>
          <ul className={styles.contatos}>
            {contacts.map(c => (
              <li key={c.label} className={styles.contato}>
                <span className={styles.contatoIcone}>{c.icon}</span>
                <span className={styles.contatoTexto}>
                  <span className={styles.contatoLabel}>{c.label}</span>
                  <span className={styles.contatoValor}>{c.value || '—'}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Conteúdo: funil + histórico (no lugar das abas clínicas) ── */}
      <section className={styles.principal}>
        <div className={styles.card}>
          <h3 className={styles.cardTitulo}>Funil</h3>
          <Select
            label="O que aconteceu"
            options={LEAD_STATUS_OPTIONS}
            value={status}
            onChange={e => setStatus(e.target.value as LeadStatus)}
          />
          <Textarea
            label="Observação"
            placeholder="O que foi combinado, dúvidas, motivo da etapa…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <div className={styles.acoesSalvar}>
            <Button loading={saving} onClick={save}>Salvar</Button>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitulo}>Histórico</h3>
          {loadingHistory ? (
            <div className={styles.historicoCarregando}><Spinner size="sm" /></div>
          ) : !history || history.length === 0 ? (
            <p className={styles.historicoVazio}>Nenhuma mudança registrada ainda.</p>
          ) : (
            <ul className={styles.historicoLista}>
              {history.map(entry => (
                <li key={entry.id} className={styles.historicoItem}>
                  <span className={styles.historicoData}>
                    {fmtWhen(entry.createdAt)}{entry.actorName ? ` · ${entry.actorName}` : ''}
                  </span>
                  {describeEntry(entry).map((line, i) => (
                    <span key={i} className={styles.historicoLinha}>{line}</span>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
