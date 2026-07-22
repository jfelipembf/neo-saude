import { useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { usePagination } from '@/hooks/usePagination'
import { useInsuranceOptions } from '@/hooks/useInsurances'
import { usePatientQuotes, useCreateQuote, useApproveQuote } from '@/hooks/useQuotes'
import type { NewQuote } from '@/services/quotesService'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useProfessionalName } from '@/hooks/useDisplayNames'
import { useClinic } from '@/hooks/useClinic'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { esc } from '@/utils/printDocument'
import { toIsoDate } from '@/utils/date'
import { formatBRL, parseBRL } from '@/utils/format'
import { IconPlus, IconX, IconCheck, IconPrint, IconDocument } from '@/components/icons'
import type { QuoteItem, Quote, QuoteStatus } from '@/types/domain'
import styles from './BudgetsPanel.module.scss'

// Dentes FDI: permanentes em cima, decíduos embaixo (mesma ordem da ficha).
const UPPER_TEETH = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28']
const LOWER_TEETH = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38']
const UPPER_DECIDUOUS = ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65']
const LOWER_DECIDUOUS = ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75']

const FACES = ['M', 'O/I', 'D', 'V/L', 'P']

/** Subtotal e total (com desconto) de um orçamento. */
function totalsOf(quote: Pick<Quote, 'items' | 'discount'>) {
  const subtotal = quote.items.reduce((sum, i) => sum + i.amount, 0)
  return { subtotal, total: Math.max(0, subtotal - (quote.discount ?? 0)) }
}

/** Impressão do orçamento (aguardando) ou do CONTRATO (aprovado). */
/** Miolo do orçamento/contrato — cabeçalho da clínica vem da base de impressão.
 *  `clinicName` assina o documento como contratada. */
function quoteBody(
  quote: NewQuote,
  clinicName: string,
  professionalName: (id?: string) => string,
  patientName?: string,
) {
  const { subtotal, total } = totalsOf(quote)
  const approved = quote.status === 'approved'
  const rows = quote.items.map(i => `
    <tr>
      <td>${esc(i.treatment)}${i.teeth?.length ? `<br><small>Dente(s): ${esc(i.teeth.join(', '))}${i.faces?.length ? ` · Face(s): ${esc(i.faces.join(', '))}` : ''}</small>` : ''}</td>
      <td>${esc(professionalName(i.professionalId))}</td>
      <td class="num">${formatBRL(i.amount)}</td>
    </tr>`).join('')

  return `
    ${patientName ? `<p><strong>Paciente:</strong> ${esc(patientName)}</p>` : ''}
    <p><strong>Data:</strong> ${esc(quote.date)}</p>
    <table>
      <thead><tr><th>Tratamento</th><th>Profissional</th><th class="num">Valor</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totais">
      Subtotal: ${formatBRL(subtotal)}<br>
      ${quote.discount ? `Desconto: −${formatBRL(quote.discount)}<br>` : ''}
      <strong>Total: ${formatBRL(total)}</strong><br>
      ${quote.installments && quote.installments > 1
        ? `Pagamento em ${quote.installments}x de ${formatBRL(total / quote.installments)}`
        : 'Pagamento à vista'}
    </div>
    ${quote.notes ? `<p class="clausula"><strong>Observações:</strong> ${esc(quote.notes)}</p>` : ''}
    ${approved ? `<p class="clausula">Pelo presente instrumento, as partes acordam a execução dos tratamentos
      relacionados acima, pelos valores e condições de pagamento descritos, obrigando-se o contratado a
      executá-los com zelo técnico e o contratante a efetuar os pagamentos nas datas combinadas.</p>
    <div class="assinaturas"><span>Contratante${patientName ? ` — ${esc(patientName)}` : ''}</span><span>Contratada — ${esc(clinicName)}</span></div>` : ''}`
}

interface BudgetsPanelProps {
  patientId: string
  patientName?: string
}

/**
 * Aba "Orçamentos": cria planos de tratamento item a item (profissional,
 * convênio, dentes, faces, valor com multiplicação por dente), aplica
 * desconto/parcelamento e, na aprovação, gera o contrato.
 */
export function BudgetsPanel({ patientId, patientName }: BudgetsPanelProps) {
  const toast = useToast()
  const { data: quotes, isLoading } = usePatientQuotes(patientId)
  const { data: professionals } = useProfessionals()
  const professionalName = useProfessionalName()
  const { mutate: create, isPending: creating } = useCreateQuote()
  const { mutate: approve } = useApproveQuote()
  const { data: clinic } = useClinic()
  const print = usePrintDocument()
  const insuranceOptions = useInsuranceOptions()

  /** Orçamento aprovado vira contrato — muda título e adiciona as assinaturas. */
  function printQuote(o: NewQuote) {
    const approved = o.status === 'approved'
    print({
      title: approved ? 'Contrato de prestação de serviços' : 'Orçamento',
      subtitle: o.name,
      body: quoteBody(o, clinic?.name ?? 'a contratada', professionalName, patientName),
      width: 680,
    })
  }

  const [mode, setMode] = useState<'list' | 'new'>('list')

  // Cabeçalho do orçamento.
  const [name, setName] = useState('')
  const [dateIso, setDateIso] = useState(() => toIsoDate(new Date()))
  const [nameError, setNameError] = useState('')

  // Rascunho do ITEM sendo montado.
  const [professionalId, setProfessionalId] = useState('')
  const [insurance, setInsurance] = useState('Particular')
  const [treatment, setTreatment] = useState('')
  const [valueText, setValueText] = useState('')
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([])
  const [selectedFaces, setSelectedFaces] = useState<string[]>([])
  const [multiply, setMultiply] = useState(false)
  const [itemError, setItemError] = useState('')

  // Itens já adicionados + fechamento.
  const [items, setItems] = useState<QuoteItem[]>([])
  const [discountText, setDiscountText] = useState('')
  const [installments, setInstallments] = useState('1')
  const [notes, setNotes] = useState('')

  const pagination = usePagination(quotes ?? [])

  if (isLoading) {
    return <div className={styles.carregando}><Spinner size="lg" /></div>
  }

  const list = quotes ?? []

  // ── Editor ─────────────────────────────────────────────────────────────────
  function openNew() {
    setName(`Plano de tratamento de ${patientName ?? ''}`.trim())
    setDateIso(toIsoDate(new Date()))
    setNameError('')
    setProfessionalId('')
    setInsurance('Particular')
    clearDraftItem()
    setItems([])
    setDiscountText('')
    setInstallments('1')
    setNotes('')
    setMode('new')
  }

  function clearDraftItem() {
    setTreatment('')
    setValueText('')
    setSelectedTeeth([])
    setSelectedFaces([])
    setMultiply(false)
    setItemError('')
  }

  function toggleTooth(d: string) {
    setSelectedTeeth(current => (current.includes(d) ? current.filter(x => x !== d) : [...current, d]))
  }

  function toggleFace(f: string) {
    setSelectedFaces(current => (current.includes(f) ? current.filter(x => x !== f) : [...current, f]))
  }

  // Arcada inteira: se já está toda marcada, desmarca; senão completa.
  function toggleArch(teeth: string[]) {
    setSelectedTeeth(current => {
      const all = teeth.every(d => current.includes(d))
      if (all) return current.filter(d => !teeth.includes(d))
      return [...new Set([...current, ...teeth])]
    })
  }

  function addItem() {
    if (!treatment.trim()) {
      setItemError('Informe o tratamento.')
      return
    }
    const unitPrice = parseBRL(valueText || '')
    if (!valueText.trim() || Number.isNaN(unitPrice) || unitPrice <= 0) {
      setItemError('Informe o valor do tratamento.')
      return
    }
    const teethCount = selectedTeeth.length
    const amount = multiply && teethCount > 0 ? unitPrice * teethCount : unitPrice
    setItems(current => [
      ...current,
      {
        treatment: treatment.trim(),
        professionalId: professionalId || undefined,
        insurance: insurance || undefined,
        teeth: teethCount ? [...selectedTeeth].sort() : undefined,
        faces: selectedFaces.length ? [...selectedFaces] : undefined,
        unitPrice,
        multiplyPerTooth: multiply || undefined,
        amount,
      },
    ])
    clearDraftItem()
  }

  function save(status: QuoteStatus) {
    if (!name.trim()) {
      setNameError('Dê um nome ao orçamento.')
      return
    }
    if (items.length === 0) {
      setItemError('Adicione ao menos um tratamento ao orçamento.')
      return
    }
    const discount = parseBRL(discountText || '0')
    const payload = {
      patientId,
      name: name.trim(),
      date: dateIso.split('-').reverse().join('/'),
      status,
      items,
      discount: Number.isFinite(discount) && discount > 0 ? discount : undefined,
      installments: Number(installments) || 1,
      notes: notes.trim() || undefined,
    }
    create(payload, {
      onSuccess: () => {
        toast.success(status === 'approved' ? 'Orçamento aprovado — contrato gerado!' : 'Orçamento salvo!')
        if (status === 'approved') {
          printQuote(payload)
        }
        setMode('list')
      },
    })
  }

  const professionalOptions = (professionals ?? []).map(p => ({ value: p.id, label: p.name }))
  const { subtotal, total } = totalsOf({ items, discount: parseBRL(discountText || '0') || 0 })
  const installmentOptions = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    return {
      value: String(n),
      label: n === 1 ? 'À vista' : `${n}x de ${formatBRL(total / n)}`,
    }
  })

  // ── Modo LISTA ─────────────────────────────────────────────────────────────
  if (mode === 'list') {
    const columns: TableColumn<Quote>[] = [
      { key: 'date', label: 'Data', render: o => <span className={styles.data}>{o.date}</span> },
      { key: 'name', label: 'Orçamento', render: o => <span className={styles.nomeCell}>{o.name}</span> },
      {
        key: 'items',
        label: 'Tratamentos',
        render: o => `${o.items.length} ${o.items.length === 1 ? 'tratamento' : 'tratamentos'}`,
      },
      { key: 'total', label: 'Total', render: o => <span className={styles.valor}>{formatBRL(totalsOf(o).total)}</span> },
      { key: 'status', label: 'Status', render: o => <Badge status={o.status} /> },
      {
        key: 'actions',
        label: 'Ação',
        render: o => (
          <span className={styles.acoesLinha}>
            {o.status === 'pending' && (
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconCheck />}
                title="Aprovar orçamento"
                aria-label={`Aprovar ${o.name}`}
                onClick={() => approve(o.id, { onSuccess: () => toast.success('Orçamento aprovado!') })}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<IconPrint />}
              title={o.status === 'approved' ? 'Imprimir contrato' : 'Imprimir orçamento'}
              aria-label={`Imprimir ${o.name}`}
              onClick={() => printQuote(o)}
            />
          </span>
        ),
      },
    ]

    return (
      <div className={styles.painel}>
        <header className={styles.cabecalho}>
          <div>
            <h2 className={styles.cabecalhoTitulo}>Orçamentos</h2>
            <p className={styles.cabecalhoHint}>Planos de tratamento com valores — aprovado, vira contrato.</p>
          </div>
          <Button iconLeft={<IconPlus />} onClick={openNew}>Novo orçamento</Button>
        </header>

        {list.length === 0 ? (
          <EmptyState
            icon={<IconDocument />}
            title="Nenhum orçamento criado"
            description="Monte o plano de tratamento com valores por dente, desconto e parcelamento."
            action={<Button iconLeft={<IconPlus />} onClick={openNew}>Novo orçamento</Button>}
          />
        ) : (
          <Table
            columns={columns}
            data={pagination.visible}
            rowKey={o => o.id}
            emptyMessage="Nenhum orçamento."
            renderExpanded={o => {
              const t = totalsOf(o)
              return (
                <div className={styles.detalhe}>
                  <ul className={styles.detalheItens}>
                    {o.items.map((i, idx) => (
                      <li key={idx} className={styles.detalheItem}>
                        <span className={styles.detalheInfo}>
                          <span className={styles.detalheTratamento}>{i.treatment}</span>
                          <span className={styles.detalheMeta}>
                            {[
                              professionalName(i.professionalId),
                              i.insurance,
                              i.teeth?.length ? `Dente(s): ${i.teeth.join(', ')}` : null,
                              i.faces?.length ? `Face(s): ${i.faces.join(', ')}` : null,
                            ].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <span className={styles.valor}>{formatBRL(i.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.detalheTotais}>
                    <span>Subtotal {formatBRL(t.subtotal)}</span>
                    {o.discount ? <span>Desconto −{formatBRL(o.discount)}</span> : null}
                    <span className={styles.detalheTotal}>Total {formatBRL(t.total)}</span>
                    <span>
                      {o.installments && o.installments > 1
                        ? `${o.installments}x de ${formatBRL(t.total / o.installments)}`
                        : 'À vista'}
                    </span>
                  </div>
                  {o.notes && <p className={styles.detalheObs}>{o.notes}</p>}
                </div>
              )
            }}
            toolbar={<PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />}
            footer={
              <Pagination
                page={pagination.currentPage}
                totalPages={pagination.totalPages}
                onChange={pagination.setPage}
                totalItems={pagination.total}
                itemsPerPage={pagination.perPage}
              />
            }
          />
        )}
      </div>
    )
  }

  // ── Modo NOVO: o editor do orçamento ───────────────────────────────────────
  return (
    <div className={styles.painel}>
      <section className={styles.card}>
        <header className={styles.cabecalho}>
          <h2 className={styles.cabecalhoTitulo}>Criar orçamento</h2>
          <div className={styles.acoesTopo}>
            <Button variant="ghost" onClick={() => setMode('list')} disabled={creating}>Cancelar</Button>
            <Button variant="outline" onClick={() => save('pending')} loading={creating}>Salvar</Button>
            <Button onClick={() => save('approved')} loading={creating}>Aprovar orçamento</Button>
          </div>
        </header>

        <div className={styles.gridCabecalho}>
          <Input label="Data" type="date" value={dateIso} onChange={e => setDateIso(e.target.value)} />
          <Input
            label="Nome do orçamento"
            value={name}
            onChange={e => { setName(e.target.value); setNameError('') }}
            error={nameError}
          />
        </div>
      </section>

      {/* ── Adicionar tratamentos ── */}
      <section className={styles.card}>
        <h3 className={styles.cardTitulo}>Adicionar tratamentos</h3>

        <div className={styles.gridCampos}>
          <Select
            label="Profissional"
            options={professionalOptions}
            placeholder="Selecione..."
            value={professionalId}
            onChange={e => setProfessionalId(e.target.value)}
          />
          <Select
            label="Convênio"
            options={insuranceOptions}
            value={insurance}
            onChange={e => setInsurance(e.target.value)}
          />
          <Input
            label="Tratamento"
            placeholder="Digite o nome de um tratamento"
            value={treatment}
            onChange={e => { setTreatment(e.target.value); setItemError('') }}
          />
          <Input
            label="Valor"
            iconLeft={<span className={styles.prefixo}>R$</span>}
            inputMode="decimal"
            placeholder="0,00"
            value={valueText}
            onChange={e => { setValueText(e.target.value); setItemError('') }}
          />
        </div>

        <div className={styles.selecao}>
          <span className={styles.selecaoRotulo}>Dente(s)</span>
          {[UPPER_TEETH, LOWER_TEETH, UPPER_DECIDUOUS, LOWER_DECIDUOUS].map((row, i) => (
            <div key={i} className={styles.dentesLinha}>
              {row.map(d => (
                <button
                  key={d}
                  type="button"
                  className={`${styles.dente} ${selectedTeeth.includes(d) ? styles.denteAtivo : ''}`}
                  aria-pressed={selectedTeeth.includes(d)}
                  onClick={() => toggleTooth(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          ))}
          <div className={styles.arcadas}>
            <Button variant="outline" size="sm" onClick={() => toggleArch(UPPER_TEETH)}>Arcada Superior</Button>
            <Button variant="outline" size="sm" onClick={() => toggleArch(LOWER_TEETH)}>Arcada Inferior</Button>
          </div>
        </div>

        <div className={styles.selecao}>
          <span className={styles.selecaoRotulo}>Face(s)</span>
          <div className={styles.dentesLinha}>
            {FACES.map(f => (
              <button
                key={f}
                type="button"
                className={`${styles.face} ${selectedFaces.includes(f) ? styles.denteAtivo : ''}`}
                aria-pressed={selectedFaces.includes(f)}
                onClick={() => toggleFace(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.rodapeItem}>
          <Toggle
            label={`Multiplicar valor por dente${selectedTeeth.length > 1 && multiply ? ` (${selectedTeeth.length}×)` : ''}`}
            checked={multiply}
            onChange={setMultiply}
          />
          <Button variant="outline" iconLeft={<IconPlus />} onClick={addItem}>
            Adicionar ao orçamento
          </Button>
        </div>
        {itemError && <p className={styles.erro}>{itemError}</p>}
      </section>

      {/* ── Itens + fechamento ── */}
      <section className={styles.card}>
        <h3 className={styles.cardTitulo}>Tratamentos adicionados ({items.length})</h3>

        {items.length === 0 ? (
          <p className={styles.vazio}>Ainda não há tratamentos neste orçamento.</p>
        ) : (
          <ul className={styles.detalheItens}>
            {items.map((i, idx) => (
              <li key={idx} className={styles.detalheItem}>
                <span className={styles.detalheInfo}>
                  <span className={styles.detalheTratamento}>{i.treatment}</span>
                  <span className={styles.detalheMeta}>
                    {[
                      professionalName(i.professionalId),
                      i.teeth?.length ? `Dente(s): ${i.teeth.join(', ')}` : null,
                      i.faces?.length ? `Face(s): ${i.faces.join(', ')}` : null,
                      i.multiplyPerTooth ? `${formatBRL(i.unitPrice)} × ${i.teeth?.length ?? 1}` : null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className={styles.valor}>{formatBRL(i.amount)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<IconX />}
                  title="Remover tratamento"
                  aria-label={`Remover ${i.treatment}`}
                  onClick={() => setItems(current => current.filter((_, j) => j !== idx))}
                />
              </li>
            ))}
          </ul>
        )}

        <div className={styles.fechamento}>
          <div className={styles.fechamentoLinha}>
            <span>Subtotal</span>
            <span className={styles.valor}>{formatBRL(subtotal)}</span>
          </div>
          <div className={styles.fechamentoLinha}>
            <span>Desconto</span>
            <Input
              iconLeft={<span className={styles.prefixo}>R$</span>}
              inputMode="decimal"
              placeholder="0,00"
              value={discountText}
              onChange={e => setDiscountText(e.target.value)}
              aria-label="Desconto"
              className={styles.descontoCampo}
            />
          </div>
          <div className={`${styles.fechamentoLinha} ${styles.fechamentoTotal}`}>
            <span>TOTAL</span>
            <span className={styles.valorTotal}>{formatBRL(total)}</span>
          </div>
          <div className={styles.fechamentoLinha}>
            <span>Parcelar</span>
            <Select
              size="sm"
              options={installmentOptions}
              value={installments}
              onChange={e => setInstallments(e.target.value)}
              aria-label="Parcelamento"
              className={styles.parcelasCampo}
            />
          </div>
        </div>

        <Textarea
          label="Observações"
          placeholder="Escreva uma observação..."
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <div className={styles.contratoBox}>
          <span className={styles.contratoTitulo}>Gerar contrato</span>
          <p className={styles.contratoTexto}>
            Ao aprovar esse orçamento, um contrato será gerado com os tratamentos, valores e condições
            de pagamento — pronto para imprimir e assinar.
          </p>
        </div>

        <div className={styles.acoesRodape}>
          <Button variant="ghost" onClick={() => setMode('list')} disabled={creating}>Cancelar</Button>
          <Button variant="outline" onClick={() => save('pending')} loading={creating}>Salvar</Button>
          <Button onClick={() => save('approved')} loading={creating}>Aprovar orçamento</Button>
        </div>
      </section>
    </div>
  )
}
