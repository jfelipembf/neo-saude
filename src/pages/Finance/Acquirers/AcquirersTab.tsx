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
import { useAdquirentes, useContasBancarias, useSalvarAdquirente } from '@/hooks/useFinanceiro'
import { BANDEIRAS_DISPONIVEIS } from '@/constants'
import { parsePercentual } from '@/utils/format'
import type { InstallmentRate } from '@/types/domain'
import { InstallmentsEditor } from './InstallmentsEditor'
import shared from '../shared/finance.module.scss'
import styles from './AcquirersTab.module.scss'

interface AdquirenteFormState {
  nome: string
  ativa: boolean
  bandeiras: string[]
  taxaCreditoTexto: string
  taxaDebitoTexto: string
  taxasParcelas: InstallmentRate[]
  prazoTexto: string
  contaRepasseId: string
  observacao: string
}

const ADQUIRENTE_FORM_VAZIO: AdquirenteFormState = {
  nome: '', ativa: true, bandeiras: [], taxaCreditoTexto: '', taxaDebitoTexto: '',
  taxasParcelas: [], prazoTexto: '1', contaRepasseId: '', observacao: '',
}

/** Aba "Adquirentes": lista lateral + formulário de bandeiras, taxas e repasse. */
export function AcquirersTab() {
  const toast = useToast()
  const { data: adquirentes, isLoading } = useAdquirentes()
  const { data: contas } = useContasBancarias()
  const { mutate: salvar, isPending: salvando } = useSalvarAdquirente()

  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [nova, setNova] = useState(false)
  const [form, setForm] = useState<AdquirenteFormState>(ADQUIRENTE_FORM_VAZIO)
  const [erroNome, setErroNome] = useState('')
  const [novaBandeira, setNovaBandeira] = useState('')

  if (isLoading) return <PageLoader />

  const lista = adquirentes ?? []
  const formVisivel = selecionada !== null || nova

  // Chips exibidos: as bandeiras conhecidas + qualquer custom já selecionada.
  const bandeirasExibidas = [
    ...BANDEIRAS_DISPONIVEIS,
    ...form.bandeiras.filter(b => !BANDEIRAS_DISPONIVEIS.includes(b)),
  ]

  const items = lista.map(a => ({
    id: a.id,
    label: a.nome,
    sublabel: `${a.bandeiras.length} bandeira(s) · D+${a.prazoRecebimento}`
      + (a.status === 'ativo' ? '' : ' · Inativa'),
  }))

  const opcoesConta = (contas ?? []).map(c => ({ value: c.id, label: c.nome }))

  function set<K extends keyof AdquirenteFormState>(campo: K, valor: AdquirenteFormState[K]) {
    setForm(atual => ({ ...atual, [campo]: valor }))
    if (campo === 'nome') setErroNome('')
  }

  function alternarBandeira(bandeira: string) {
    setForm(atual => ({
      ...atual,
      bandeiras: atual.bandeiras.includes(bandeira)
        ? atual.bandeiras.filter(b => b !== bandeira)
        : [...atual.bandeiras, bandeira],
    }))
  }

  /** Adiciona uma bandeira fora da lista padrão (já entra selecionada). */
  function adicionarBandeira() {
    const nome = novaBandeira.trim()
    if (!nome) return
    const existente = bandeirasExibidas.find(b => b.toLowerCase() === nome.toLowerCase())
    if (existente) {
      // Já conhecida: só garante a seleção, sem duplicar o chip.
      if (!form.bandeiras.includes(existente)) alternarBandeira(existente)
    } else {
      setForm(atual => ({ ...atual, bandeiras: [...atual.bandeiras, nome] }))
    }
    setNovaBandeira('')
  }

  function selecionar(id: string) {
    const adquirente = lista.find(a => a.id === id)
    if (!adquirente) return
    setSelecionada(id)
    setNova(false)
    setErroNome('')
    setNovaBandeira('')
    setForm({
      nome: adquirente.nome,
      ativa: adquirente.status === 'ativo',
      bandeiras: [...adquirente.bandeiras],
      taxaCreditoTexto: String(adquirente.taxaCredito).replace('.', ','),
      taxaDebitoTexto: String(adquirente.taxaDebito).replace('.', ','),
      taxasParcelas: (adquirente.taxasParcelas ?? []).map(t => ({ ...t })),
      prazoTexto: String(adquirente.prazoRecebimento),
      contaRepasseId: adquirente.contaRepasseId ?? '',
      observacao: adquirente.observacao ?? '',
    })
  }

  function aoNova() {
    setSelecionada(null)
    setNova(true)
    setForm(ADQUIRENTE_FORM_VAZIO)
    setErroNome('')
    setNovaBandeira('')
  }

  function aoCancelar() {
    setSelecionada(null)
    setNova(false)
    setForm(ADQUIRENTE_FORM_VAZIO)
    setErroNome('')
    setNovaBandeira('')
  }

  function aoSalvar() {
    if (!form.nome.trim()) {
      setErroNome('Dê um nome à adquirente.')
      return
    }
    const taxaCredito = parsePercentual(form.taxaCreditoTexto || '0')
    const taxaDebito  = parsePercentual(form.taxaDebitoTexto || '0')
    const prazo       = Number(form.prazoTexto || '1')
    salvar(
      {
        id: selecionada,
        dados: {
          nome: form.nome.trim(),
          bandeiras: form.bandeiras,
          taxaCredito: Number.isFinite(taxaCredito) ? taxaCredito : 0,
          taxaDebito: Number.isFinite(taxaDebito) ? taxaDebito : 0,
          // Só linhas válidas entram (parcelas ≥ 2 e taxa ≥ 0), ordenadas.
          taxasParcelas: form.taxasParcelas
            .filter(t => t.parcelas >= 2 && t.taxa >= 0)
            .sort((a, b) => a.parcelas - b.parcelas),
          prazoRecebimento: Number.isFinite(prazo) && prazo > 0 ? prazo : 1,
          contaRepasseId: form.contaRepasseId || undefined,
          status: form.ativa ? 'ativo' : 'inativo',
          observacao: form.observacao.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Adquirente salva!')
          aoCancelar()
        },
      },
    )
  }

  return (
    <div className={shared.layout}>
      <SideList
        title="Adquirentes"
        size="lg"
        items={items}
        selectedId={selecionada}
        onSelect={id => selecionar(String(id))}
        onAdd={aoNova}
        searchPlaceholder="Buscar adquirente..."
        emptyText="Nenhuma adquirente cadastrada"
      />

      <div className={shared.formArea}>
        {!formVisivel ? (
          <EmptyState
            title="Nenhuma adquirente selecionada"
            description="Selecione uma adquirente na lista ao lado ou crie uma nova clicando em +."
          />
        ) : (
          <>
            <div className={shared.formRoot}>
              <FormSection
                title="Dados da Adquirente"
                actions={<Toggle label="Status" checked={form.ativa} onChange={v => set('ativa', v)} />}
              >
                <div className={shared.fields}>
                  <div className={shared.fieldFull}>
                    <Input
                      label="Nome da adquirente / maquininha"
                      placeholder="Ex.: Stone, Cielo, PagBank..."
                      value={form.nome}
                      onChange={e => set('nome', e.target.value)}
                      error={erroNome}
                    />
                  </div>
                  <Select
                    label="Conta de repasse"
                    placeholder="Selecione a conta..."
                    options={opcoesConta}
                    value={form.contaRepasseId}
                    onChange={e => set('contaRepasseId', e.target.value)}
                  />
                  <Input
                    label="Prazo de repasse (D+N)"
                    type="number"
                    min={1}
                    hint="Dias até o dinheiro cair (1 = D+1)."
                    value={form.prazoTexto}
                    onChange={e => set('prazoTexto', e.target.value)}
                  />
                </div>
              </FormSection>

              <FormSection title="Bandeiras e Taxas">
                <div className={shared.fields}>
                  <div className={shared.fieldFull}>
                    <span className={styles.subLabel}>Bandeiras aceitas</span>
                    <div className={styles.chips} role="group" aria-label="Bandeiras aceitas">
                      {bandeirasExibidas.map(b => (
                        <button
                          key={b}
                          type="button"
                          className={`${styles.chip} ${form.bandeiras.includes(b) ? styles['chip--ativa'] : ''}`}
                          aria-pressed={form.bandeiras.includes(b)}
                          onClick={() => alternarBandeira(b)}
                        >
                          {b}
                        </button>
                      ))}
                    </div>

                    {/* Bandeira fora da lista: digitar e adicionar (entra selecionada). */}
                    <div className={styles.novaBandeira}>
                      <Input
                        size="sm"
                        placeholder="Outra bandeira..."
                        value={novaBandeira}
                        onChange={e => setNovaBandeira(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarBandeira() } }}
                        aria-label="Nova bandeira"
                      />
                      <Button size="sm" variant="outline" onClick={adicionarBandeira} disabled={!novaBandeira.trim()}>
                        + Adicionar
                      </Button>
                    </div>
                  </div>
                  <Input
                    label="Taxa crédito à vista (%)"
                    inputMode="decimal"
                    placeholder="3,19"
                    value={form.taxaCreditoTexto}
                    onChange={e => set('taxaCreditoTexto', e.target.value)}
                  />
                  <Input
                    label="Taxa débito (%)"
                    inputMode="decimal"
                    placeholder="1,45"
                    value={form.taxaDebitoTexto}
                    onChange={e => set('taxaDebitoTexto', e.target.value)}
                  />

                  <div className={shared.fieldFull}>
                    <span className={styles.subLabel}>Crédito parcelado — taxa (%) por nº de parcelas</span>
                    <InstallmentsEditor
                      rows={form.taxasParcelas}
                      onChange={rows => set('taxasParcelas', rows)}
                    />
                  </div>
                </div>
              </FormSection>

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
