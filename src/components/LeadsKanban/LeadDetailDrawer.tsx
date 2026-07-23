import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { Drawer } from '@/components/Drawer/Drawer'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { useLeadHistory, useUpdateLeadDetails } from '@/hooks/useLeads'
import { AUDIT_HIDDEN_FIELDS, LEAD_STATUS_LABEL, LEAD_STATUS_OPTIONS, auditFieldLabel, buildRoute } from '@/constants'
import { IconClock, IconEmail, IconPhone } from '@/components/icons'
import type { Lead, LeadHistoryEntry, LeadStatus } from '@/types/domain'
import styles from './LeadDetailDrawer.module.scss'

interface LeadDetailDrawerProps {
  lead: Lead
  onClose: () => void
}

/** dd/mm/aaaa HH:MM — mesmo formato da trilha de Auditoria. */
function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/** Uma entrada do histórico vira 1+ frases: o que mudou, em português, sem
 *  jargão de coluna de banco. Reaproveita os rótulos da Auditoria para campos
 *  que não são status/observação (ex.: telefone editado por outro caminho). */
function describeEntry(entry: LeadHistoryEntry): string[] {
  if (entry.action === 'insert') return ['Contato cadastrado.']
  if (entry.action === 'delete') return ['Contato excluído.']

  const changed = entry.changedFields.filter(f => !AUDIT_HIDDEN_FIELDS.has(f))
  const lines = changed.map(field => {
    if (field === 'status') {
      const to = entry.newData?.status as LeadStatus | undefined
      return `Status alterado para "${to ? LEAD_STATUS_LABEL[to] : '—'}".`
    }
    if (field === 'notes') {
      const text = (entry.newData?.notes as string | null | undefined)?.trim()
      return text ? `Observação: "${text}"` : 'Observação removida.'
    }
    return `${auditFieldLabel(field)} atualizado.`
  })
  return lines.length ? lines : ['Atualizado.']
}

/**
 * Painel "Detalhes do contato": abre ao clicar num card do Kanban. No topo, os
 * dados do lead (não editáveis aqui — é o cadastro, não este fluxo); depois o
 * Select "O que aconteceu" (a etapa do funil) e a Observação, salvos juntos;
 * embaixo, o histórico de mudanças com data, autor e o que foi informado ou
 * selecionado — vem de list_lead_history (audit_log por trás).
 */
export function LeadDetailDrawer({ lead, onClose }: LeadDetailDrawerProps) {
  const toast = useToast()
  const navigate = useNavigate()
  const { data: history, isLoading: loadingHistory } = useLeadHistory(lead.id)
  const { mutate: updateDetails, isPending: saving } = useUpdateLeadDetails()

  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [notes, setNotes] = useState(lead.notes ?? '')

  function save() {
    updateDetails(
      { id: lead.id, status, notes: notes.trim() || null },
      { onSuccess: () => toast.success('Contato atualizado!') },
    )
  }

  /** Vai para o perfil completo do lead (onde fica "Converter em paciente"). */
  function verPerfil() {
    onClose()
    navigate(buildRoute.leadProfile(lead.id))
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Detalhes do contato"
      footer={
        <>
          <Button variant="outline" className={styles.converter} onClick={verPerfil}>Ver perfil</Button>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button loading={saving} onClick={save}>Salvar</Button>
        </>
      }
    >
      <div className={styles.corpo}>
        <section className={styles.dados}>
          <h3 className={styles.nome}>{lead.name}</h3>
          <span className={styles.linhaDado}><IconPhone /> {lead.phone}</span>
          {lead.email && <span className={styles.linhaDado}><IconEmail /> {lead.email}</span>}
          <span className={styles.interesse}>{lead.interest}</span>
          <span className={styles.linhaDado}><IconClock /> Cadastrado em {lead.createdAt}</span>
          {lead.patientId && <span className={styles.convertido}>✓ Convertido em paciente</span>}
        </section>

        <section className={styles.formSection}>
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
        </section>

        <section className={styles.historico}>
          <h3 className={styles.historicoTitulo}>Histórico</h3>

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
        </section>
      </div>
    </Drawer>
  )
}
