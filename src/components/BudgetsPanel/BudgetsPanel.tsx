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
import { useOpcoesConvenio } from '@/hooks/useConvenios'
import { useOrcamentosDoPaciente, useCriarOrcamento, useAprovarOrcamento } from '@/hooks/useOrcamentos'
import { useProfissionais } from '@/hooks/useProfissionais'
import { useConsultorio } from '@/hooks/useConsultorio'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { esc } from '@/utils/printDocument'
import { toIsoDate } from '@/utils/date'
import { formatarReais, parseReais } from '@/utils/format'
import { IconMais, IconX, IconCheck, IconImprimir, IconDocumento } from '@/components/icons'
import type { QuoteItem, Quote, QuoteStatus } from '@/types/domain'
import styles from './BudgetsPanel.module.scss'

// Dentes FDI: permanentes em cima, decíduos embaixo (mesma ordem da ficha).
const DENTES_SUP = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28']
const DENTES_INF = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38']
const DECIDUOS_SUP = ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65']
const DECIDUOS_INF = ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75']

const FACES = ['M', 'O/I', 'D', 'V/L', 'P']

/** Subtotal e total (com desconto) de um orçamento. */
function totaisDo(orcamento: Pick<Quote, 'itens' | 'desconto'>) {
  const subtotal = orcamento.itens.reduce((soma, i) => soma + i.valor, 0)
  return { subtotal, total: Math.max(0, subtotal - (orcamento.desconto ?? 0)) }
}

/** Impressão do orçamento (aguardando) ou do CONTRATO (aprovado). */
/** Miolo do orçamento/contrato — cabeçalho da clínica vem da base de impressão.
 *  `nomeClinica` assina o documento como contratada. */
function corpoOrcamento(orcamento: Quote, nomeClinica: string, pacienteNome?: string) {
  const { subtotal, total } = totaisDo(orcamento)
  const aprovado = orcamento.status === 'aprovado'
  const linhas = orcamento.itens.map(i => `
    <tr>
      <td>${esc(i.tratamento)}${i.dentes?.length ? `<br><small>Dente(s): ${esc(i.dentes.join(', '))}${i.faces?.length ? ` · Face(s): ${esc(i.faces.join(', '))}` : ''}</small>` : ''}</td>
      <td>${esc(i.profissional ?? '—')}</td>
      <td class="num">${formatarReais(i.valor)}</td>
    </tr>`).join('')

  return `
    ${pacienteNome ? `<p><strong>Patient:</strong> ${esc(pacienteNome)}</p>` : ''}
    <p><strong>Data:</strong> ${esc(orcamento.data)}</p>
    <table>
      <thead><tr><th>Tratamento</th><th>Profissional</th><th class="num">Valor</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <div class="totais">
      Subtotal: ${formatarReais(subtotal)}<br>
      ${orcamento.desconto ? `Desconto: −${formatarReais(orcamento.desconto)}<br>` : ''}
      <strong>Total: ${formatarReais(total)}</strong><br>
      ${orcamento.parcelas && orcamento.parcelas > 1
        ? `Payment em ${orcamento.parcelas}x de ${formatarReais(total / orcamento.parcelas)}`
        : 'Pagamento à vista'}
    </div>
    ${orcamento.observacao ? `<p class="clausula"><strong>Observações:</strong> ${esc(orcamento.observacao)}</p>` : ''}
    ${aprovado ? `<p class="clausula">Pelo presente instrumento, as partes acordam a execução dos tratamentos
      relacionados acima, pelos valores e condições de pagamento descritos, obrigando-se o contratado a
      executá-los com zelo técnico e o contratante a efetuar os pagamentos nas datas combinadas.</p>
    <div class="assinaturas"><span>Contratante${pacienteNome ? ` — ${esc(pacienteNome)}` : ''}</span><span>Contratada — ${esc(nomeClinica)}</span></div>` : ''}`
}

interface BudgetsPanelProps {
  pacienteId: string
  pacienteNome?: string
}

/**
 * Aba "Orçamentos": cria planos de tratamento item a item (profissional,
 * convênio, dentes, faces, valor com multiplicação por dente), aplica
 * desconto/parcelamento e, na aprovação, gera o contrato.
 */
export function BudgetsPanel({ pacienteId, pacienteNome }: BudgetsPanelProps) {
  const toast = useToast()
  const { data: orcamentos, isLoading } = useOrcamentosDoPaciente(pacienteId)
  const { data: profissionais } = useProfissionais()
  const { mutate: criar, isPending: criando } = useCriarOrcamento()
  const { mutate: aprovar } = useAprovarOrcamento()
  const { data: clinica } = useConsultorio()
  const imprimir = usePrintDocument()
  const opcoesConvenio = useOpcoesConvenio()

  /** Orçamento aprovado vira contrato — muda título e adiciona as assinaturas. */
  function imprimirOrcamento(o: Quote) {
    const aprovado = o.status === 'aprovado'
    imprimir({
      titulo: aprovado ? 'Contrato de prestação de serviços' : 'Orçamento',
      subtitulo: o.nome,
      corpo: corpoOrcamento(o, clinica?.nome ?? 'a contratada', pacienteNome),
      largura: 680,
    })
  }

  const [modo, setModo] = useState<'lista' | 'novo'>('lista')

  // Cabeçalho do orçamento.
  const [nome, setNome] = useState('')
  const [dataIso, setDataIso] = useState(() => toIsoDate(new Date()))
  const [erroNome, setErroNome] = useState('')

  // Rascunho do ITEM sendo montado.
  const [profissional, setProfissional] = useState('')
  const [convenio, setConvenio] = useState('Particular')
  const [tratamento, setTratamento] = useState('')
  const [valorTexto, setValorTexto] = useState('')
  const [dentesSel, setDentesSel] = useState<string[]>([])
  const [facesSel, setFacesSel] = useState<string[]>([])
  const [multiplicar, setMultiplicar] = useState(false)
  const [erroItem, setErroItem] = useState('')

  // Itens já adicionados + fechamento.
  const [itens, setItens] = useState<QuoteItem[]>([])
  const [descontoTexto, setDescontoTexto] = useState('')
  const [parcelas, setParcelas] = useState('1')
  const [observacao, setObservacao] = useState('')

  const pag = usePagination(orcamentos ?? [])

  if (isLoading) {
    return <div className={styles.carregando}><Spinner size="lg" /></div>
  }

  const lista = orcamentos ?? []

  // ── Editor ─────────────────────────────────────────────────────────────────
  function abrirNovo() {
    setNome(`Plano de tratamento de ${pacienteNome ?? ''}`.trim())
    setDataIso(toIsoDate(new Date()))
    setErroNome('')
    setProfissional('')
    setConvenio('Particular')
    limparItemRascunho()
    setItens([])
    setDescontoTexto('')
    setParcelas('1')
    setObservacao('')
    setModo('novo')
  }

  function limparItemRascunho() {
    setTratamento('')
    setValorTexto('')
    setDentesSel([])
    setFacesSel([])
    setMultiplicar(false)
    setErroItem('')
  }

  function alternarDente(d: string) {
    setDentesSel(atual => (atual.includes(d) ? atual.filter(x => x !== d) : [...atual, d]))
  }

  function alternarFace(f: string) {
    setFacesSel(atual => (atual.includes(f) ? atual.filter(x => x !== f) : [...atual, f]))
  }

  // Arcada inteira: se já está toda marcada, desmarca; senão completa.
  function alternarArcada(dentes: string[]) {
    setDentesSel(atual => {
      const todos = dentes.every(d => atual.includes(d))
      if (todos) return atual.filter(d => !dentes.includes(d))
      return [...new Set([...atual, ...dentes])]
    })
  }

  function adicionarItem() {
    if (!tratamento.trim()) {
      setErroItem('Informe o tratamento.')
      return
    }
    const valorUnitario = parseReais(valorTexto || '')
    if (!valorTexto.trim() || Number.isNaN(valorUnitario) || valorUnitario <= 0) {
      setErroItem('Informe o valor do tratamento.')
      return
    }
    const nDentes = dentesSel.length
    const valor = multiplicar && nDentes > 0 ? valorUnitario * nDentes : valorUnitario
    setItens(atual => [
      ...atual,
      {
        tratamento: tratamento.trim(),
        profissional: profissional || undefined,
        convenio: convenio || undefined,
        dentes: nDentes ? [...dentesSel].sort() : undefined,
        faces: facesSel.length ? [...facesSel] : undefined,
        valorUnitario,
        multiplicaPorDente: multiplicar || undefined,
        valor,
      },
    ])
    limparItemRascunho()
  }

  function salvar(status: QuoteStatus) {
    if (!nome.trim()) {
      setErroNome('Dê um nome ao orçamento.')
      return
    }
    if (itens.length === 0) {
      setErroItem('Adicione ao menos um tratamento ao orçamento.')
      return
    }
    const desconto = parseReais(descontoTexto || '0')
    const dados = {
      pacienteId,
      nome: nome.trim(),
      data: dataIso.split('-').reverse().join('/'),
      status,
      itens,
      desconto: Number.isFinite(desconto) && desconto > 0 ? desconto : undefined,
      parcelas: Number(parcelas) || 1,
      observacao: observacao.trim() || undefined,
    }
    criar(dados, {
      onSuccess: () => {
        toast.success(status === 'aprovado' ? 'Orçamento aprovado — contrato gerado!' : 'Orçamento salvo!')
        if (status === 'aprovado') {
          imprimirOrcamento({ id: '', ...dados })
        }
        setModo('lista')
      },
    })
  }

  const opcoesProfissional = (profissionais ?? []).map(p => ({ value: p.nome, label: p.nome }))
  const { subtotal, total } = totaisDo({ itens, desconto: parseReais(descontoTexto || '0') || 0 })
  const opcoesParcelas = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    return {
      value: String(n),
      label: n === 1 ? 'À vista' : `${n}x de ${formatarReais(total / n)}`,
    }
  })

  // ── Modo LISTA ─────────────────────────────────────────────────────────────
  if (modo === 'lista') {
    const columns: TableColumn<Quote>[] = [
      { key: 'data', label: 'Data', render: o => <span className={styles.data}>{o.data}</span> },
      { key: 'nome', label: 'Orçamento', render: o => <span className={styles.nomeCell}>{o.nome}</span> },
      {
        key: 'itens',
        label: 'Tratamentos',
        render: o => `${o.itens.length} ${o.itens.length === 1 ? 'tratamento' : 'tratamentos'}`,
      },
      { key: 'total', label: 'Total', render: o => <span className={styles.valor}>{formatarReais(totaisDo(o).total)}</span> },
      { key: 'status', label: 'Status', render: o => <Badge status={o.status} /> },
      {
        key: 'acoes',
        label: 'Ação',
        render: o => (
          <span className={styles.acoesLinha}>
            {o.status === 'aguardando' && (
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconCheck />}
                title="Aprovar orçamento"
                aria-label={`Aprovar ${o.nome}`}
                onClick={() => aprovar(o.id, { onSuccess: () => toast.success('Orçamento aprovado!') })}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<IconImprimir />}
              title={o.status === 'aprovado' ? 'Imprimir contrato' : 'Imprimir orçamento'}
              aria-label={`Imprimir ${o.nome}`}
              onClick={() => imprimirOrcamento(o)}
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
          <Button iconLeft={<IconMais />} onClick={abrirNovo}>Novo orçamento</Button>
        </header>

        {lista.length === 0 ? (
          <EmptyState
            icon={<IconDocumento />}
            title="Nenhum orçamento criado"
            description="Monte o plano de tratamento com valores por dente, desconto e parcelamento."
            action={<Button iconLeft={<IconMais />} onClick={abrirNovo}>Novo orçamento</Button>}
          />
        ) : (
          <Table
            columns={columns}
            data={pag.visiveis}
            rowKey={o => o.id}
            emptyMessage="Nenhum orçamento."
            renderExpanded={o => {
              const t = totaisDo(o)
              return (
                <div className={styles.detalhe}>
                  <ul className={styles.detalheItens}>
                    {o.itens.map((i, idx) => (
                      <li key={idx} className={styles.detalheItem}>
                        <span className={styles.detalheInfo}>
                          <span className={styles.detalheTratamento}>{i.tratamento}</span>
                          <span className={styles.detalheMeta}>
                            {[
                              i.profissional,
                              i.convenio,
                              i.dentes?.length ? `Dente(s): ${i.dentes.join(', ')}` : null,
                              i.faces?.length ? `Face(s): ${i.faces.join(', ')}` : null,
                            ].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <span className={styles.valor}>{formatarReais(i.valor)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.detalheTotais}>
                    <span>Subtotal {formatarReais(t.subtotal)}</span>
                    {o.desconto ? <span>Desconto −{formatarReais(o.desconto)}</span> : null}
                    <span className={styles.detalheTotal}>Total {formatarReais(t.total)}</span>
                    <span>
                      {o.parcelas && o.parcelas > 1
                        ? `${o.parcelas}x de ${formatarReais(t.total / o.parcelas)}`
                        : 'À vista'}
                    </span>
                  </div>
                  {o.observacao && <p className={styles.detalheObs}>{o.observacao}</p>}
                </div>
              )
            }}
            toolbar={<PerPageSelect porPagina={pag.porPagina} onChange={pag.mudarPorPagina} />}
            footer={
              <Pagination
                page={pag.paginaAtual}
                totalPages={pag.totalPaginas}
                onChange={pag.setPagina}
                totalItems={pag.total}
                itemsPerPage={pag.porPagina}
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
            <Button variant="ghost" onClick={() => setModo('lista')} disabled={criando}>Cancelar</Button>
            <Button variant="outline" onClick={() => salvar('aguardando')} loading={criando}>Salvar</Button>
            <Button onClick={() => salvar('aprovado')} loading={criando}>Aprovar orçamento</Button>
          </div>
        </header>

        <div className={styles.gridCabecalho}>
          <Input label="Data" type="date" value={dataIso} onChange={e => setDataIso(e.target.value)} />
          <Input
            label="Nome do orçamento"
            value={nome}
            onChange={e => { setNome(e.target.value); setErroNome('') }}
            error={erroNome}
          />
        </div>
      </section>

      {/* ── Adicionar tratamentos ── */}
      <section className={styles.card}>
        <h3 className={styles.cardTitulo}>Adicionar tratamentos</h3>

        <div className={styles.gridCampos}>
          <Select
            label="Profissional"
            options={opcoesProfissional}
            placeholder="Selecione..."
            value={profissional}
            onChange={e => setProfissional(e.target.value)}
          />
          <Select
            label="Convênio"
            options={opcoesConvenio}
            value={convenio}
            onChange={e => setConvenio(e.target.value)}
          />
          <Input
            label="Tratamento"
            placeholder="Digite o nome de um tratamento"
            value={tratamento}
            onChange={e => { setTratamento(e.target.value); setErroItem('') }}
          />
          <Input
            label="Valor"
            iconLeft={<span className={styles.prefixo}>R$</span>}
            inputMode="decimal"
            placeholder="0,00"
            value={valorTexto}
            onChange={e => { setValorTexto(e.target.value); setErroItem('') }}
          />
        </div>

        <div className={styles.selecao}>
          <span className={styles.selecaoRotulo}>Dente(s)</span>
          {[DENTES_SUP, DENTES_INF, DECIDUOS_SUP, DECIDUOS_INF].map((linha, i) => (
            <div key={i} className={styles.dentesLinha}>
              {linha.map(d => (
                <button
                  key={d}
                  type="button"
                  className={`${styles.dente} ${dentesSel.includes(d) ? styles.denteAtivo : ''}`}
                  aria-pressed={dentesSel.includes(d)}
                  onClick={() => alternarDente(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          ))}
          <div className={styles.arcadas}>
            <Button variant="outline" size="sm" onClick={() => alternarArcada(DENTES_SUP)}>Arcada Superior</Button>
            <Button variant="outline" size="sm" onClick={() => alternarArcada(DENTES_INF)}>Arcada Inferior</Button>
          </div>
        </div>

        <div className={styles.selecao}>
          <span className={styles.selecaoRotulo}>Face(s)</span>
          <div className={styles.dentesLinha}>
            {FACES.map(f => (
              <button
                key={f}
                type="button"
                className={`${styles.face} ${facesSel.includes(f) ? styles.denteAtivo : ''}`}
                aria-pressed={facesSel.includes(f)}
                onClick={() => alternarFace(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.rodapeItem}>
          <Toggle
            label={`Multiplicar valor por dente${dentesSel.length > 1 && multiplicar ? ` (${dentesSel.length}×)` : ''}`}
            checked={multiplicar}
            onChange={setMultiplicar}
          />
          <Button variant="outline" iconLeft={<IconMais />} onClick={adicionarItem}>
            Adicionar ao orçamento
          </Button>
        </div>
        {erroItem && <p className={styles.erro}>{erroItem}</p>}
      </section>

      {/* ── Itens + fechamento ── */}
      <section className={styles.card}>
        <h3 className={styles.cardTitulo}>Tratamentos adicionados ({itens.length})</h3>

        {itens.length === 0 ? (
          <p className={styles.vazio}>Ainda não há tratamentos neste orçamento.</p>
        ) : (
          <ul className={styles.detalheItens}>
            {itens.map((i, idx) => (
              <li key={idx} className={styles.detalheItem}>
                <span className={styles.detalheInfo}>
                  <span className={styles.detalheTratamento}>{i.tratamento}</span>
                  <span className={styles.detalheMeta}>
                    {[
                      i.profissional,
                      i.dentes?.length ? `Dente(s): ${i.dentes.join(', ')}` : null,
                      i.faces?.length ? `Face(s): ${i.faces.join(', ')}` : null,
                      i.multiplicaPorDente ? `${formatarReais(i.valorUnitario)} × ${i.dentes?.length ?? 1}` : null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className={styles.valor}>{formatarReais(i.valor)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<IconX />}
                  title="Remover tratamento"
                  aria-label={`Remover ${i.tratamento}`}
                  onClick={() => setItens(atual => atual.filter((_, j) => j !== idx))}
                />
              </li>
            ))}
          </ul>
        )}

        <div className={styles.fechamento}>
          <div className={styles.fechamentoLinha}>
            <span>Subtotal</span>
            <span className={styles.valor}>{formatarReais(subtotal)}</span>
          </div>
          <div className={styles.fechamentoLinha}>
            <span>Desconto</span>
            <Input
              iconLeft={<span className={styles.prefixo}>R$</span>}
              inputMode="decimal"
              placeholder="0,00"
              value={descontoTexto}
              onChange={e => setDescontoTexto(e.target.value)}
              aria-label="Desconto"
              className={styles.descontoCampo}
            />
          </div>
          <div className={`${styles.fechamentoLinha} ${styles.fechamentoTotal}`}>
            <span>TOTAL</span>
            <span className={styles.valorTotal}>{formatarReais(total)}</span>
          </div>
          <div className={styles.fechamentoLinha}>
            <span>Parcelar</span>
            <Select
              size="sm"
              options={opcoesParcelas}
              value={parcelas}
              onChange={e => setParcelas(e.target.value)}
              aria-label="Parcelamento"
              className={styles.parcelasCampo}
            />
          </div>
        </div>

        <Textarea
          label="Observações"
          placeholder="Escreva uma observação..."
          rows={3}
          value={observacao}
          onChange={e => setObservacao(e.target.value)}
        />

        <div className={styles.contratoBox}>
          <span className={styles.contratoTitulo}>Gerar contrato</span>
          <p className={styles.contratoTexto}>
            Ao aprovar esse orçamento, um contrato será gerado com os tratamentos, valores e condições
            de pagamento — pronto para imprimir e assinar.
          </p>
        </div>

        <div className={styles.acoesRodape}>
          <Button variant="ghost" onClick={() => setModo('lista')} disabled={criando}>Cancelar</Button>
          <Button variant="outline" onClick={() => salvar('aguardando')} loading={criando}>Salvar</Button>
          <Button onClick={() => salvar('aprovado')} loading={criando}>Aprovar orçamento</Button>
        </div>
      </section>
    </div>
  )
}
