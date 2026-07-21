import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Select } from '@/components/Select/Select'
import { SideList } from '@/components/SideList/SideList'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { useComissoes, useSalvarComissao } from '@/hooks/useComissoes'
import { useProfissionais } from '@/hooks/useProfissionais'
import { formatarReais, parseReais } from '@/utils/format'
import type { CommissionBase, ProfessionalCommission, CommissionPayout, CommissionType } from '@/types/domain'
import styles from './CommissionsTab.module.scss'

const OPCOES_TIPO: { value: CommissionType; label: string }[] = [
  { value: 'percentual', label: 'Percentual' },
  { value: 'valor_fixo', label: 'Valor fixo' },
]

const OPCOES_REPASSE: { value: CommissionPayout; label: string }[] = [
  { value: 'dia_fixo',       label: 'Dia fixo do mês' },
  { value: 'no_atendimento', label: 'No dia do atendimento' },
]

const OPCOES_BASE = [
  { value: 'recebido',  label: 'Sobre o recebido (o que o paciente pagou)' },
  { value: 'realizado', label: 'Sobre o realizado (produção, mesmo sem receber)' },
]

// Até o dia 28: um dia de repasse que existe em todos os meses.
const OPCOES_DIA = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: `Dia ${i + 1}`,
}))

interface ComissaoFormState {
  tipo: CommissionType
  valorTexto: string
  base: CommissionBase
  repasse: CommissionPayout
  diaRepasse: string
  ativa: boolean
  observacao: string
}

const FORM_PADRAO: ComissaoFormState = {
  tipo: 'percentual',
  valorTexto: '',
  base: 'recebido',
  repasse: 'dia_fixo',
  diaRepasse: '5',
  ativa: true,
  observacao: '',
}

function formDaComissao(c: ProfessionalCommission): ComissaoFormState {
  return {
    tipo: c.tipo,
    valorTexto: String(c.valor).replace('.', ','),
    base: c.base,
    repasse: c.repasse,
    diaRepasse: String(c.diaRepasse ?? 5),
    ativa: c.status === 'ativo',
    observacao: c.observacao ?? '',
  }
}

/** Resumo da regra para o sublabel da lista (ex.: "40% sobre o recebido · dia 5"). */
function resumoComissao(c: ProfessionalCommission) {
  const valor = c.tipo === 'percentual'
    ? `${String(c.valor).replace('.', ',')}%`
    : `${formatarReais(c.valor)}/procedimento`
  const base = c.tipo === 'percentual' ? (c.base === 'recebido' ? ' sobre o recebido' : ' sobre o realizado') : ''
  const quando = c.repasse === 'dia_fixo' ? ` · dia ${c.diaRepasse}` : ' · no atendimento'
  return `${valor}${base}${quando}${c.status === 'ativo' ? '' : ' · Inativa'}`
}

/**
 * Aba "Comissões": como e quando cada profissional recebe — percentual ou
 * valor fixo, sobre o recebido ou o realizado, em dia fixo do mês ou no dia
 * do atendimento (modelo dos softwares do ramo).
 */
export function CommissionsTab() {
  const toast = useToast()
  const { data: profissionais, isLoading: carregandoProfissionais } = useProfissionais()
  const { data: comissoes, isLoading: carregandoComissoes } = useComissoes()
  const { mutate: salvar, isPending: salvando } = useSalvarComissao()

  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [form, setForm] = useState<ComissaoFormState>(FORM_PADRAO)
  const [erroValor, setErroValor] = useState('')

  if (carregandoProfissionais || carregandoComissoes) return <PageLoader />

  const lista = profissionais ?? []
  const regraDe = new Map((comissoes ?? []).map(c => [c.profissionalId, c]))

  const items = lista.map(p => {
    const regra = regraDe.get(p.id)
    return {
      id: p.id,
      label: p.nome,
      sublabel: regra ? resumoComissao(regra) : `${p.especialidade} · Sem comissão configurada`,
    }
  })

  function set<K extends keyof ComissaoFormState>(campo: K, valor: ComissaoFormState[K]) {
    setForm(atual => ({ ...atual, [campo]: valor }))
    if (campo === 'valorTexto' || campo === 'tipo') setErroValor('')
  }

  function selecionar(id: string) {
    const regra = regraDe.get(id)
    setForm(regra ? formDaComissao(regra) : FORM_PADRAO)
    setErroValor('')
    setSelecionado(id)
  }

  function aoCancelar() {
    setSelecionado(null)
    setForm(FORM_PADRAO)
    setErroValor('')
  }

  function aoSalvar() {
    const valor = parseReais(form.valorTexto || '')
    if (!form.valorTexto.trim() || Number.isNaN(valor) || valor <= 0) {
      setErroValor(form.tipo === 'percentual' ? 'Informe o percentual.' : 'Informe o valor.')
      return
    }
    if (form.tipo === 'percentual' && valor > 100) {
      setErroValor('Percentual não pode passar de 100%.')
      return
    }
    salvar(
      {
        profissionalId: selecionado!,
        dados: {
          tipo: form.tipo,
          valor,
          base: form.base,
          repasse: form.repasse,
          diaRepasse: form.repasse === 'dia_fixo' ? Number(form.diaRepasse) : undefined,
          status: form.ativa ? 'ativo' : 'inativo',
          observacao: form.observacao.trim() || undefined,
        },
      },
      { onSuccess: () => toast.success('Comissão salva!') },
    )
  }

  const ehPercentual = form.tipo === 'percentual'
  const profissional = lista.find(p => p.id === selecionado)

  return (
    <div className={styles.layout}>
      <SideList
        title="Profissionais"
        size="lg"
        items={items}
        selectedId={selecionado}
        onSelect={id => selecionar(String(id))}
        searchPlaceholder="Buscar profissional..."
        emptyText="Nenhum profissional cadastrado"
      />

      <div className={styles.formArea}>
        {!selecionado ? (
          <EmptyState
            title="Nenhum profissional selecionado"
            description="Selecione um profissional na lista ao lado para configurar como e quando ele recebe a comissão."
          />
        ) : (
          <>
            <div className={styles.formRoot}>
              <FormSection
                title={`Regra de comissão — ${profissional?.nome ?? ''}`}
                actions={<Toggle label="Comissão ativa" checked={form.ativa} onChange={v => set('ativa', v)} />}
              >
                <div className={styles.fields}>
                  <div className={styles.fieldFull}>
                    <span className={styles.subLabel}>Tipo de comissão</span>
                    <SegmentedControl
                      options={OPCOES_TIPO}
                      value={form.tipo}
                      onChange={v => set('tipo', v)}
                    />
                  </div>

                  <Input
                    label={ehPercentual ? 'Percentual (%)' : 'Valor por procedimento'}
                    iconLeft={ehPercentual ? undefined : <span className={styles.prefixo}>R$</span>}
                    inputMode="decimal"
                    placeholder={ehPercentual ? 'Ex: 40' : 'Ex: 80,00'}
                    value={form.valorTexto}
                    onChange={e => set('valorTexto', e.target.value)}
                    error={erroValor}
                  />

                  {ehPercentual && (
                    <Select
                      label="Base de cálculo"
                      options={OPCOES_BASE}
                      value={form.base}
                      onChange={e => set('base', e.target.value as CommissionBase)}
                    />
                  )}

                  <p className={`${styles.dica} ${styles.fieldFull}`}>
                    {ehPercentual
                      ? form.base === 'recebido'
                        ? 'Sobre o recebido: a comissão só é gerada quando o paciente paga — protege o fluxo de caixa em tratamentos parcelados.'
                        : 'Sobre o realizado: a comissão é gerada pela produção, mesmo que o paciente ainda não tenha pago.'
                      : 'Valor fixo: o profissional recebe o mesmo valor por procedimento realizado, independente do preço cobrado.'}
                  </p>
                </div>
              </FormSection>

              <FormSection title="Repasse — quando o profissional recebe">
                <div className={styles.fields}>
                  <div className={styles.fieldFull}>
                    <SegmentedControl
                      options={OPCOES_REPASSE}
                      value={form.repasse}
                      onChange={v => set('repasse', v)}
                    />
                  </div>

                  {form.repasse === 'dia_fixo' && (
                    <Select
                      label="Dia do repasse"
                      options={OPCOES_DIA}
                      value={form.diaRepasse}
                      onChange={e => set('diaRepasse', e.target.value)}
                    />
                  )}

                  <p className={`${styles.dica} ${styles.fieldFull}`}>
                    {form.repasse === 'dia_fixo'
                      ? 'As comissões do período acumulam e são pagas todo mês nesse dia (até o dia 28, que existe em todos os meses).'
                      : 'A comissão entra a pagar no dia de cada atendimento — repasse imediato, sem acúmulo mensal.'}
                  </p>
                </div>
              </FormSection>

              <FormSection title="Observações">
                <Textarea
                  placeholder="Regras combinadas, exceções por procedimento, descontos de materiais..."
                  rows={3}
                  value={form.observacao}
                  onChange={e => set('observacao', e.target.value)}
                />
              </FormSection>
            </div>

            <div className={styles.acoesBar}>
              <Button variant="ghost" onClick={aoCancelar} disabled={salvando}>Cancelar</Button>
              <Button loading={salvando} onClick={aoSalvar}>Salvar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
