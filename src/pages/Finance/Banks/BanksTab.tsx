import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { SideList } from '@/components/SideList/SideList'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { useContasBancarias, useSalvarContaBancaria } from '@/hooks/useFinanceiro'
import { OPCOES_TIPO_CONTA, TIPO_CONTA_LABEL } from '@/constants'
import { parseReais } from '@/utils/format'
import type { BankAccountType } from '@/types/domain'
import shared from '../shared/finance.module.scss'

interface ContaFormState {
  nome: string
  tipo: BankAccountType
  banco: string
  agencia: string
  conta: string
  titular: string
  saldoTexto: string
  ativa: boolean
  observacao: string
}

const CONTA_FORM_VAZIO: ContaFormState = {
  nome: '', tipo: 'corrente', banco: '', agencia: '', conta: '', titular: '',
  saldoTexto: '', ativa: true, observacao: '',
}

/** Aba "Contas bancárias": lista lateral + formulário de cadastro/edição. */
export function BanksTab() {
  const toast = useToast()
  const { data: contas, isLoading } = useContasBancarias()
  const { mutate: salvar, isPending: salvando } = useSalvarContaBancaria()

  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [nova, setNova] = useState(false)
  const [form, setForm] = useState<ContaFormState>(CONTA_FORM_VAZIO)
  const [erroNome, setErroNome] = useState('')

  if (isLoading) return <PageLoader />

  const lista = contas ?? []
  const formVisivel = selecionada !== null || nova
  const ehCaixaInterno = form.tipo === 'caixa'

  const items = lista.map(c => ({
    id: c.id,
    label: c.nome,
    sublabel: TIPO_CONTA_LABEL[c.tipo]
      + (c.banco ? ` · ${c.banco}` : '')
      + (c.status === 'ativo' ? '' : ' · Inativa'),
  }))

  function set<K extends keyof ContaFormState>(campo: K, valor: ContaFormState[K]) {
    setForm(atual => ({ ...atual, [campo]: valor }))
    if (campo === 'nome') setErroNome('')
  }

  function selecionar(id: string) {
    const conta = lista.find(c => c.id === id)
    if (!conta) return
    setSelecionada(id)
    setNova(false)
    setErroNome('')
    setForm({
      nome: conta.nome,
      tipo: conta.tipo,
      banco: conta.banco ?? '',
      agencia: conta.agencia ?? '',
      conta: conta.conta ?? '',
      titular: conta.titular ?? '',
      saldoTexto: conta.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      ativa: conta.status === 'ativo',
      observacao: conta.observacao ?? '',
    })
  }

  function aoNova() {
    setSelecionada(null)
    setNova(true)
    setForm(CONTA_FORM_VAZIO)
    setErroNome('')
  }

  function aoCancelar() {
    setSelecionada(null)
    setNova(false)
    setForm(CONTA_FORM_VAZIO)
    setErroNome('')
  }

  function aoSalvar() {
    if (!form.nome.trim()) {
      setErroNome('Dê um nome à conta.')
      return
    }
    const saldo = parseReais(form.saldoTexto || '0')
    salvar(
      {
        id: selecionada,
        dados: {
          nome: form.nome.trim(),
          tipo: form.tipo,
          banco: ehCaixaInterno ? undefined : form.banco.trim() || undefined,
          agencia: ehCaixaInterno ? undefined : form.agencia.trim() || undefined,
          conta: ehCaixaInterno ? undefined : form.conta.trim() || undefined,
          titular: ehCaixaInterno ? undefined : form.titular.trim() || undefined,
          saldo: Number.isFinite(saldo) ? saldo : 0,
          status: form.ativa ? 'ativo' : 'inativo',
          observacao: form.observacao.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Conta salva!')
          aoCancelar()
        },
      },
    )
  }

  return (
    <div className={shared.layout}>
      <SideList
        title="Contas"
        size="lg"
        items={items}
        selectedId={selecionada}
        onSelect={id => selecionar(String(id))}
        onAdd={aoNova}
        searchPlaceholder="Buscar conta..."
        emptyText="Nenhuma conta cadastrada"
      />

      <div className={shared.formArea}>
        {!formVisivel ? (
          <EmptyState
            title="Nenhuma conta selecionada"
            description="Selecione uma conta na lista ao lado ou crie uma nova clicando em +."
          />
        ) : (
          <>
            <div className={shared.formRoot}>
              <FormSection
                title="Dados da Conta"
                actions={<Toggle label="Status" checked={form.ativa} onChange={v => set('ativa', v)} />}
              >
                <div className={shared.fields}>
                  <div className={shared.fieldFull}>
                    <Input
                      label="Nome da conta"
                      placeholder="Ex.: Inter — Conta PJ, Caixa da recepção..."
                      value={form.nome}
                      onChange={e => set('nome', e.target.value)}
                      error={erroNome}
                    />
                  </div>
                  <Select
                    label="Tipo"
                    options={OPCOES_TIPO_CONTA}
                    value={form.tipo}
                    onChange={e => set('tipo', e.target.value as BankAccountType)}
                  />
                  <Input
                    label="Saldo inicial"
                    iconLeft={<span className={shared.prefixo}>R$</span>}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form.saldoTexto}
                    onChange={e => set('saldoTexto', e.target.value)}
                  />
                </div>
              </FormSection>

              {!ehCaixaInterno && (
                <FormSection title="Dados Bancários">
                  <div className={shared.fields}>
                    <div className={shared.fieldFull}>
                      <Input label="Banco" placeholder="Ex.: Banco Inter, Itaú..." value={form.banco} onChange={e => set('banco', e.target.value)} />
                    </div>
                    <Input label="Agência" placeholder="0000" value={form.agencia} onChange={e => set('agencia', e.target.value)} />
                    <Input label="Conta" placeholder="00000-0" value={form.conta} onChange={e => set('conta', e.target.value)} />
                    <div className={shared.fieldFull}>
                      <Input label="Titular" placeholder="Razão social" value={form.titular} onChange={e => set('titular', e.target.value)} />
                    </div>
                  </div>
                </FormSection>
              )}

              <FormSection title="Observações">
                <Input label="Observações" placeholder="Opcional" value={form.observacao} onChange={e => set('observacao', e.target.value)} />
              </FormSection>
            </div>

            {/* Ações no rodapé do formulário. */}
            <div className={shared.acoesBar}>
              <Button variant="ghost" onClick={aoCancelar} disabled={salvando}>Cancelar</Button>
              <Button loading={salvando} onClick={aoSalvar}>Salvar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
