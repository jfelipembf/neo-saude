import { useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useToast } from '@/components/Toast/Toast'
import { IconFinance, IconPlus, IconTrash } from '@/components/icons'
import { useClinic } from '@/hooks/useClinic'
import { useInsurances } from '@/hooks/useInsurances'
import { usePatients } from '@/hooks/usePatients'
import { useProfessionals } from '@/hooks/useProfessionals'
import {
  useCancelTissGuide, useDeleteTissGuideDraft, useIssueTissGuide, useTissGuides,
} from '@/hooks/useTissGuides'
import { pendenciasDaGuia, resumoDasPendencias, type CadastroDaGuia } from '@/utils/tissReadiness'
import { errorMessage } from '@/utils/errors'
import { formatBRL } from '@/utils/format'
import type { TissGuide } from '@/types/domain'
import { NewTissGuideModal } from './NewTissGuideModal'
import shared from '../shared/finance.module.scss'
import styles from './TissGuidesTab.module.scss'

/**
 * Aba "Guias TISS" — camada 2 do faturamento de convênio.
 *
 * O que a tela resolve, e é o motivo dela existir: dizer O QUE FALTA antes de a
 * operadora recusar. A recusa chega semanas depois, em lote, sem apontar o
 * campo — aqui a pendência aparece na linha, nomeando o cadastro e onde
 * resolver (ver utils/tissReadiness.ts, 14 testes).
 *
 * Guia RASCUNHO lê o cadastro ao vivo, então completar um campo faz a pendência
 * sumir sozinha. Guia EMITIDA mostra a cópia congelada dentro dela — é o
 * documento que a operadora recebeu, e ele não muda quando o cadastro muda.
 */
export function TissGuidesTab() {
  const toast = useToast()
  const { data: guias, isLoading } = useTissGuides()
  const { data: clinica } = useClinic()
  const { data: convenios } = useInsurances()
  const { data: pacientes } = usePatients()
  const { data: profissionais } = useProfessionals()
  const { mutate: emitir, isPending: emitindo } = useIssueTissGuide()
  const { mutate: cancelar } = useCancelTissGuide()
  const { mutate: apagarRascunho } = useDeleteTissGuideDraft()

  const [novaAberta, setNovaAberta] = useState(false)
  const [aCancelar, setACancelar] = useState<TissGuide | null>(null)

  if (isLoading) return <PageLoader />

  const lista = guias ?? []

  /** Monta o cadastro que a checagem de pendências consome — SEMPRE ao vivo:
   *  é isso que faz a pendência sumir quando alguém completa o campo. */
  function cadastroDa(g: TissGuide): CadastroDaGuia | null {
    const convenio = (convenios ?? []).find(c => c.id === g.insuranceId)
    const paciente = (pacientes ?? []).find(p => p.id === g.patientId)
    const profissional = (profissionais ?? []).find(p => p.id === g.professionalId)
    if (!convenio || !paciente || !profissional) return null
    return {
      clinica: { cnes: clinica?.cnes },
      convenio: { nome: convenio.name, ans: convenio.ans, providerCode: convenio.providerCode },
      profissional: {
        nome: profissional.name,
        license: profissional.license,
        council: profissional.council,
        councilState: profissional.councilState,
        cbo: profissional.cbo,
      },
      paciente: {
        nome: paciente.name,
        insuranceCard: paciente.insuranceCard,
        insuranceCardValidUntil: paciente.insuranceCardValidUntil,
      },
      procedimentos: g.procedimentos.map(p => ({
        descricao: p.description, tussCode: p.tussCode, tussTable: p.tussTable, valor: p.unitPrice,
      })),
      atendimentoIso: g.servedOnIso,
    }
  }

  function pendenciasDe(g: TissGuide) {
    const cadastro = cadastroDa(g)
    // Cadastro incompleto de leitura (ainda carregando) não vira "tudo certo":
    // anunciar guia pronta sem ter conferido é pior que não anunciar nada.
    if (!cadastro) return null
    return pendenciasDaGuia(cadastro)
  }

  function handleEmitir(g: TissGuide) {
    const cadastro = cadastroDa(g)
    if (!cadastro) return
    const faltas = pendenciasDaGuia(cadastro)
    if (faltas.length) {
      toast.error(resumoDasPendencias(faltas))
      return
    }
    const paciente = (pacientes ?? []).find(p => p.id === g.patientId)!
    const profissional = (profissionais ?? []).find(p => p.id === g.professionalId)!
    const convenio = (convenios ?? []).find(c => c.id === g.insuranceId)!
    emitir({
      id: g.id,
      dados: {
        providerCode: convenio.providerCode,
        cnes: clinica?.cnes,
        insuranceAns: convenio.ans,
        patientName: paciente.name,
        patientCard: paciente.insuranceCard ?? '',
        patientCns: paciente.cns,
        professionalName: profissional.name,
        council: profissional.council,
        councilNumber: profissional.license,
        councilState: profissional.councilState,
        cbo: profissional.cbo,
      },
    }, {
      onSuccess: () => toast.success(`Guia ${g.code} emitida.`),
      onError: e => toast.error(errorMessage(e, 'Não foi possível emitir a guia.')),
    })
  }

  const nomeDoPaciente = (id: string) => (pacientes ?? []).find(p => p.id === id)?.name ?? '—'
  const nomeDoConvenio = (id: string) => (convenios ?? []).find(c => c.id === id)?.name ?? '—'

  const columns: TableColumn<TissGuide>[] = [
    { key: 'code', label: 'Guia', render: g => <span className={shared.celulaForte}>{g.code}</span> },
    { key: 'patient', label: 'Paciente', render: g => nomeDoPaciente(g.patientId) },
    { key: 'insurance', label: 'Convênio', hideOnMobile: true, render: g => nomeDoConvenio(g.insuranceId) },
    { key: 'servedOn', label: 'Atendimento', render: g => g.servedOn },
    { key: 'total', label: 'Valor', render: g => <span className={shared.valor}>{formatBRL(g.total)}</span> },
    {
      key: 'status',
      label: 'Situação',
      render: g => {
        const faltas = g.status === 'draft' ? pendenciasDe(g) : null
        if (faltas && faltas.length > 0) {
          return (
            <Badge
              status="pending"
              label={`${faltas.length} pendência${faltas.length > 1 ? 's' : ''}`}
            />
          )
        }
        return <Badge status={g.status} />
      },
    },
    {
      key: 'actions',
      label: 'Ação',
      render: g => {
        if (g.status !== 'draft') {
          return g.status === 'issued'
            ? (
              <Button size="sm" variant="ghost" onClick={() => setACancelar(g)}>
                Cancelar
              </Button>
            )
            : <span className={shared.traco}>—</span>
        }
        const faltas = pendenciasDe(g)
        const pronta = faltas !== null && faltas.length === 0
        return (
          <div className={shared.acoes}>
            <Button
              size="sm"
              variant="secondary"
              loading={emitindo}
              disabled={!pronta}
              title={pronta ? undefined : 'Resolva as pendências antes de emitir'}
              onClick={() => handleEmitir(g)}
            >
              Emitir
            </Button>
            <Button
              size="sm"
              variant="ghost"
              iconLeft={<IconTrash />}
              aria-label={`Apagar rascunho da guia ${g.code}`}
              onClick={() => apagarRascunho(g.id, {
                onSuccess: () => toast.success('Rascunho apagado.'),
                onError: e => toast.error(errorMessage(e, 'Não foi possível apagar.')),
              })}
            />
          </div>
        )
      },
    },
  ]

  return (
    <>
      <div className={styles.barra}>
        <Button iconLeft={<IconPlus />} onClick={() => setNovaAberta(true)}>Nova guia</Button>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={<IconFinance />}
          title="Nenhuma guia emitida"
          description="Crie a guia de um atendimento de convênio. Antes de emitir, a tela mostra o que ainda falta no cadastro."
        />
      ) : (
        <Table
          columns={columns}
          data={lista}
          rowKey={g => g.id}
          emptyMessage="Nenhuma guia."
          /* A pendência aberta diz O QUE falta e ONDE resolver — a lista só
             conta quantas são. Guia emitida mostra a cópia congelada, que é o
             que a operadora recebeu. */
          renderExpanded={g => {
            if (g.status === 'issued') {
              return (
                <ul className={shared.detalheLista}>
                  <li className={shared.detalheItem}>
                    <span>Emitida em {g.issuedOn}</span>
                    <span className={shared.contagem}>Carteirinha {g.frozen.patientCard}</span>
                    <span className={shared.contagem}>
                      {g.frozen.council}/{g.frozen.councilState} {g.frozen.councilNumber}
                    </span>
                  </li>
                  {g.procedimentos.map(p => (
                    <li key={p.id} className={shared.detalheItem}>
                      <span>{p.description}</span>
                      <span className={shared.contagem}>TUSS {p.tussCode} (tab. {p.tussTable})</span>
                      <span className={shared.valor}>{formatBRL(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )
            }
            const faltas = pendenciasDe(g)
            if (faltas === null) return <p className={styles.aviso}>Carregando o cadastro…</p>
            if (faltas.length === 0) {
              return <p className={styles.pronta}>Pronta para faturar.</p>
            }
            return (
              <ul className={shared.detalheLista}>
                {faltas.map((f, i) => (
                  <li key={`${f.origem}-${i}`} className={shared.detalheItem}>
                    <span className={styles.pendencia}>{f.texto}</span>
                  </li>
                ))}
              </ul>
            )
          }}
        />
      )}

      <NewTissGuideModal open={novaAberta} onClose={() => setNovaAberta(false)} />

      {/* Guia emitida se CANCELA, não some: o rastro do que foi enviado à
          operadora é o que sustenta uma contestação de glosa. */}
      <ConfirmDialog
        open={aCancelar !== null}
        onClose={() => setACancelar(null)}
        onConfirm={() => {
          if (!aCancelar) return
          const codigo = aCancelar.code
          cancelar(aCancelar.id, {
            onSuccess: () => toast.success(`Guia ${codigo} cancelada.`),
            onError: e => toast.error(errorMessage(e, 'Não foi possível cancelar.')),
          })
          setACancelar(null)
        }}
        title="Cancelar guia?"
        message={`A guia ${aCancelar?.code ?? ''} fica no histórico como cancelada — ela não é apagada, porque o registro do que foi enviado à operadora é o que sustenta uma contestação de glosa.`}
        variant="danger"
        confirmLabel="Cancelar guia"
      />
    </>
  )
}
