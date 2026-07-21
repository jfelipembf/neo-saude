import { useEffect, useRef, useState } from 'react'
import OdontogramShell, { getOdontogramState, loadOdontogramState } from '@/lib/odontogramShell/odontogram-shell'
import '@/lib/odontogramShell/odontogram-shell.css'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Spinner } from '@/components/Spinner/Spinner'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { useTratamentosDoPaciente, useCriarTratamento, useAdicionarSessao } from '@/hooks/useTratamentos'
import { useTheme } from '@/context/ThemeProvider'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { esc } from '@/utils/printDocument'
import { toIsoDate } from '@/utils/date'
import { formatarReais, parseReais } from '@/utils/format'
import { IconMais, IconImprimir, IconTarefas, IconChevronDireita, IconX } from '@/components/icons'
import type { OdontogramThemeConfig } from '@/lib/odontogramShell/odontogram-shell'
import type { UsedMaterial, TreatmentSession, Treatment } from '@/types/domain'
import styles from './TreatmentsPanel.module.scss'

interface TreatmentsPanelProps {
  pacienteId: string
  /** Nome exibido no relatório impresso. */
  pacienteNome?: string
}

/** Linha do relatório ao vivo: o que foi sinalizado num dente do odontograma. */
interface LinhaRelatorio {
  dente: string
  texto: string
}

/** CSS específico do relatório — o resto vem da base de impressão. */
const ESTILOS_PROCEDIMENTO = `
  h2 { font-size: 14px; margin: 16px 0 6px; }
  ul { margin: 0 0 0 18px; padding: 0; font-size: 13px; } li { margin: 3px 0; }
`

/** Miolo do relatório do PROCEDIMENTO em edição — cabeçalho da clínica vem da base. */
function corpoProcedimento(
  tratamento: string, procedimento: string, dataBr: string,
  relatorio: LinhaRelatorio[], materiais: UsedMaterial[], observacao: string,
  pacienteNome?: string, valor?: number,
) {
  const linhas = relatorio
    .map(l => `<li><strong>Dente ${esc(l.dente)}</strong> — ${esc(l.texto)}</li>`)
    .join('')

  return `
    ${pacienteNome ? `<p><strong>Patient:</strong> ${esc(pacienteNome)}</p>` : ''}
    <p><strong>Tratamento:</strong> ${esc(tratamento)}<br>
       <strong>Procedimento:</strong> ${esc(procedimento) || '—'}<br>
       <strong>Data:</strong> ${esc(dataBr)}${valor != null ? `<br><strong>Valor:</strong> ${formatarReais(valor)}` : ''}</p>
    <h2>O que foi feito</h2>
    ${linhas ? `<ul>${linhas}</ul>` : '<p>Nada sinalizado no odontograma.</p>'}
    ${materiais.length ? `<h2>Materiais utilizados</h2><ul>${materiais.map(m => `<li>${esc(m.nome)}${m.quantidade ? ` — ${esc(m.quantidade)}` : ''}</li>`).join('')}</ul>` : ''}
    ${observacao ? `<p class="clausula"><strong>Observações:</strong> ${esc(observacao)}</p>` : ''}
    <p class="clausula">Sem valor de prontuário oficial.</p>`
}

/**
 * Carrega um snapshot na ficha JÁ MONTADA, com retry: o motor monta async e o
 * StrictMode do React desmonta/remonta o shell zerando o estado do motor.
 * Reaplica até o motor confirmar (resumo do dente marcado escrito no `title`
 * do tile) ou até o timeout; devolve o cleanup.
 */
function carregarFicha(
  raiz: HTMLElement | null,
  payload: Record<string, unknown> | null,
): (() => void) | undefined {
  if (!raiz) return undefined
  const dentes = Object.keys((payload?.teeth as Record<string, unknown> | undefined) ?? {})
  const inicio = Date.now()
  const timer = setInterval(() => {
    loadOdontogramState(payload)
    const confirmado =
      dentes.length === 0 ||
      dentes.some(d => raiz.querySelector(`.tooth-tile[data-tooth="${d}"]`)?.getAttribute('title'))
    if (confirmado || Date.now() - inicio > 3000) clearInterval(timer)
  }, 150)
  return () => clearInterval(timer)
}

/**
 * Desliga por padrão as camadas de osso e polpa (os botões seguem disponíveis
 * para religar). Retry até o motor montar os botões; devolve o cleanup.
 */
function ocultarCamadasPadrao(raiz: HTMLElement): () => void {
  const ocultarPorPadrao = ['btnBoneVisible', 'btnPulpVisible']
  const inicio = Date.now()
  const timer = setInterval(() => {
    const pendentes = ocultarPorPadrao.filter(id => {
      const btn = raiz.querySelector<HTMLButtonElement>(`#${id}`)
      if (!btn) return true
      if (btn.getAttribute('aria-pressed') === 'true') btn.click()
      return btn.getAttribute('aria-pressed') === 'true'
    })
    if (pendentes.length === 0 || Date.now() - inicio > 3000) clearInterval(timer)
  }, 120)
  return () => clearInterval(timer)
}

// Paleta do odontograma = tokens do app (styles/_themes.scss), por tema.
const TEMA_CLARO: OdontogramThemeConfig = {
  background: '#F3F7F5', panel: '#FFFFFF', card: '#FFFFFF',
  text: '#12211C', muted: '#5E6E68', line: '#D8E2DE',
  accent: '#10B981', accent2: '#8B5CF6',
}

const TEMA_ESCURO: OdontogramThemeConfig = {
  background: '#0D1512', panel: '#121D18', card: '#121D18',
  text: '#EDF7F2', muted: '#95A69F', line: '#26332D',
  accent: '#34D399', accent2: '#A78BFA',
}

/**
 * Aba "Tratamento": o tratamento nasce leve (descrição + data, SEM odontograma)
 * e vira um nó da TIMELINE; cada "Novo procedimento" abre o editor com
 * odontograma e entra conectado como sub-rota do tratamento.
 */
export function TreatmentsPanel({ pacienteId, pacienteNome }: TreatmentsPanelProps) {
  const toast = useToast()
  const { data: tratamentos, isLoading } = useTratamentosDoPaciente(pacienteId)
  const { mutate: criar, isPending: criando } = useCriarTratamento()
  const { mutate: adicionarSessao, isPending: adicionando } = useAdicionarSessao()
  const imprimir = usePrintDocument()
  const { theme } = useTheme()
  const escuro = theme === 'dark'

  const [modo, setModo] = useState<'lista' | 'procedimento'>('lista')
  const [tratamentoAtivo, setTratamentoAtivo] = useState<Treatment | null>(null)

  // Modal "Novo tratamento" (leve: descrição + data — sem odontograma).
  const [modalTratamento, setModalTratamento] = useState(false)
  const [nomeTratamento, setNomeTratamento] = useState('')
  const [dataTratamentoIso, setDataTratamentoIso] = useState(() => toIsoDate(new Date()))
  const [erroNomeTratamento, setErroNomeTratamento] = useState('')

  // Editor de procedimento.
  const [descricao, setDescricao] = useState('')
  const [dataIso, setDataIso] = useState(() => toIsoDate(new Date()))
  const [valorTexto, setValorTexto] = useState('')
  const [erroValor, setErroValor] = useState('')
  const [materiais, setMateriais] = useState<UsedMaterial[]>([])
  const [observacao, setObservacao] = useState('')
  const [relatorio, setRelatorio] = useState<LinhaRelatorio[]>([])
  const [erroDescricao, setErroDescricao] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [finalizado, setFinalizado] = useState(false)

  // Procedimento expandido na timeline (um por vez: o motor do odontograma é
  // global de módulo — dois shells montados disputariam o mesmo DOM).
  const [procAberto, setProcAberto] = useState<string | null>(null)

  const shellRef = useRef<HTMLDivElement>(null)
  const leituraRef = useRef<HTMLDivElement>(null)

  // Visões padrão da ficha no EDITOR: osso e polpa ocultos.
  useEffect(() => {
    if (modo !== 'procedimento') return
    const raiz = shellRef.current
    if (!raiz) return
    return ocultarCamadasPadrao(raiz)
  }, [modo])

  // Mesmas visões padrão no shell de LEITURA (procedimento expandido).
  useEffect(() => {
    if (!procAberto) return
    const raiz = leituraRef.current
    if (!raiz) return
    return ocultarCamadasPadrao(raiz)
  }, [procAberto])

  // Ficha inicial do EDITOR — carregada APÓS o mount do shell (o destroy do
  // shell anterior limpa o estado do motor): continua do snapshot do último
  // procedimento, ou limpa a ficha no primeiro.
  useEffect(() => {
    if (modo !== 'procedimento' || !tratamentoAtivo) return
    const ultimo = [...tratamentoAtivo.sessoes].reverse().find(s => s.odontograma)
    return carregarFicha(shellRef.current, ultimo?.odontograma ?? null)
  }, [modo, tratamentoAtivo])

  // Snapshot do procedimento expandido na timeline — idem, após o mount do
  // shell de leitura, que então mostra os dentes como ficaram naquele dia.
  useEffect(() => {
    if (!procAberto) return
    const sessao = (tratamentos ?? []).flatMap(t => t.sessoes).find(s => s.id === procAberto)
    if (!sessao?.odontograma) return
    return carregarFicha(leituraRef.current, sessao.odontograma)
  }, [procAberto, tratamentos])

  // Relatório AO VIVO: o motor grava o resumo de cada dente no `title` do tile
  // (data-tooth) a cada mudança — um MutationObserver colhe e vira texto.
  useEffect(() => {
    if (modo !== 'procedimento') return
    const raiz = shellRef.current
    if (!raiz) return

    let agendado = 0
    function coletar() {
      agendado = 0
      const porDente = new Map<number, string>()
      raiz!.querySelectorAll<HTMLElement>('.tooth-tile[data-tooth][title]').forEach(tile => {
        const numero = Number(tile.dataset.tooth)
        const texto = (tile.getAttribute('title') ?? '').replace(/\n/g, ' · ').trim()
        if (numero && texto && !porDente.has(numero)) porDente.set(numero, texto)
      })
      setRelatorio(
        [...porDente.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([dente, texto]) => ({ dente: String(dente), texto })),
      )
    }

    const observador = new MutationObserver(() => {
      if (agendado) return
      agendado = window.setTimeout(coletar, 300)   // debounce das rajadas do motor
    })
    observador.observe(raiz, { subtree: true, childList: true, attributes: true, attributeFilter: ['title'] })
    coletar()

    return () => {
      observador.disconnect()
      if (agendado) window.clearTimeout(agendado)
    }
  }, [modo])

  const lista = tratamentos ?? []

  // ── Novo tratamento (modal leve) ───────────────────────────────────────────
  function abrirModalTratamento() {
    setNomeTratamento('')
    setDataTratamentoIso(toIsoDate(new Date()))
    setErroNomeTratamento('')
    setModalTratamento(true)
  }

  function criarTratamento() {
    if (!nomeTratamento.trim()) {
      setErroNomeTratamento('Descreva o tratamento.')
      return
    }
    criar(
      {
        pacienteId,
        procedimento: nomeTratamento.trim(),
        data: dataTratamentoIso.split('-').reverse().join('/'),
      },
      {
        onSuccess: () => {
          toast.success('Tratamento criado! Adicione o primeiro procedimento.')
          setModalTratamento(false)
        },
      },
    )
  }

  // Expande/recolhe um procedimento da timeline — o snapshot é carregado pelo
  // efeito acima, depois que o shell de leitura monta.
  function alternarProcedimento(sessao: TreatmentSession) {
    setProcAberto(atual => (atual === sessao.id ? null : sessao.id))
  }

  // ── Novo procedimento (editor com odontograma) ─────────────────────────────
  function abrirProcedimento(tratamento: Treatment) {
    setProcAberto(null)
    setTratamentoAtivo(tratamento)
    setDescricao('')
    setDataIso(toIsoDate(new Date()))
    setValorTexto('')
    setErroValor('')
    setMateriais([])
    setObservacao('')
    setRelatorio([])
    setErroDescricao('')
    setFinalizado(false)
    setModo('procedimento')
  }

  // Materiais utilizados — lista dinâmica opcional (nenhum, um ou vários).
  function adicionarMaterial() {
    setMateriais(atual => [...atual, { nome: '', quantidade: '' }])
  }

  function mudarMaterial(indice: number, campo: keyof UsedMaterial, valor: string) {
    setMateriais(atual => atual.map((m, i) => (i === indice ? { ...m, [campo]: valor } : m)))
  }

  function removerMaterial(indice: number) {
    setMateriais(atual => atual.filter((_, i) => i !== indice))
  }

  /** Linhas preenchidas (nome obrigatório) — o que vai para o registro. */
  function materiaisPreenchidos() {
    return materiais
      .map(m => ({ nome: m.nome.trim(), quantidade: m.quantidade.trim() }))
      .filter(m => m.nome)
  }

  function fecharEditor() {
    setModo('lista')
    setTratamentoAtivo(null)
    setConfirmando(false)
  }

  function pedirConfirmacao() {
    if (!descricao.trim()) {
      setErroDescricao('Descreva o procedimento.')
      return
    }
    if (valorTexto.trim() && Number.isNaN(parseReais(valorTexto))) {
      setErroValor('Valor inválido.')
      return
    }
    setConfirmando(true)
  }

  function salvarProcedimento() {
    if (!tratamentoAtivo) return
    const dataBr = dataIso.split('-').reverse().join('/')
    const materiaisUsados = materiaisPreenchidos()
    adicionarSessao(
      {
        tratamentoId: tratamentoAtivo.id,
        pacienteId,
        sessao: {
          descricao: descricao.trim(),
          data: dataBr,
          acoes: relatorio.map(l => `Dente ${l.dente}: ${l.texto}`),
          dentes: relatorio.map(l => l.dente),
          materiais: materiaisUsados.length ? materiaisUsados : undefined,
          observacao: observacao.trim() || undefined,
          valor: valorTexto.trim() ? parseReais(valorTexto) : undefined,
          odontograma: getOdontogramState(),
          statusApos: finalizado ? 'finalizado' : 'em_aberto',
        },
      },
      { onSuccess: () => { toast.success('Procedimento registrado!'); fecharEditor() } },
    )
  }

  if (isLoading) {
    return <div className={styles.carregando}><Spinner size="lg" /></div>
  }

  // ── Modo LISTA: timeline de tratamentos com procedimentos conectados ───────
  if (modo === 'lista') {
    return (
      <div className={styles.painel}>
        <header className={styles.chartHeader}>
          <div>
            <h2 className={styles.chartTitle}>Tratamentos</h2>
            <p className={styles.chartHint}>Cada tratamento agrupa os procedimentos feitos ao longo dos dias.</p>
          </div>
          <Button iconLeft={<IconMais />} onClick={abrirModalTratamento}>
            Novo tratamento
          </Button>
        </header>

        {lista.length === 0 ? (
          <EmptyState
            icon={<IconTarefas />}
            title="Nenhum tratamento registrado"
            description="Crie um tratamento e adicione os procedimentos de cada dia — o odontograma abre na hora do procedimento."
            action={
              <Button iconLeft={<IconMais />} onClick={abrirModalTratamento}>
                Novo tratamento
              </Button>
            }
          />
        ) : (
          <div className={styles.tratamentos}>
            {lista.map(t => (
              <section key={t.id} className={styles.trat}>
                <header className={styles.tratCabecalho}>
                  <div className={styles.tratInfo}>
                    <span className={styles.tratTitulo}>{t.procedimento}</span>
                    <span className={styles.tratMeta}>
                      {t.dente ? `Dente ${t.dente} · ` : ''}iniciado em {t.iniciadoEm}
                      {t.concluidoEm ? ` · concluído em ${t.concluidoEm}` : ''}
                    </span>
                  </div>
                  <div className={styles.tratAcoes}>
                    {t.sessoes.some(s => s.valor != null) && (
                      <div className={styles.tratTotal}>
                        <span className={styles.tratTotalRotulo}>Total</span>
                        <span className={styles.tratTotalValor}>
                          {formatarReais(t.sessoes.reduce((soma, s) => soma + (s.valor ?? 0), 0))}
                        </span>
                      </div>
                    )}
                    <Badge status={t.status} />
                    {t.status === 'em_aberto' && (
                      <Button
                        variant="outline"
                        size="sm"
                        iconLeft={<IconMais />}
                        onClick={() => abrirProcedimento(t)}
                      >
                        Novo procedimento
                      </Button>
                    )}
                  </div>
                </header>

                {/* Sub-rotas: os procedimentos conectados pelo trilho. */}
                {t.sessoes.length === 0 ? (
                  <p className={styles.tratVazio}>
                    Nenhum procedimento ainda — clique em “Novo procedimento” para abrir o odontograma.
                  </p>
                ) : (
                  <ol className={styles.procedimentos}>
                    {t.sessoes.map(s => (
                      <li key={s.id} className={styles.procItem}>
                        <span className={styles.procPonto} aria-hidden="true" />
                        <div className={styles.procCorpo}>
                          <button
                            type="button"
                            className={styles.procExpandir}
                            aria-expanded={procAberto === s.id}
                            onClick={() => alternarProcedimento(s)}
                          >
                            <span
                              className={`${styles.procSeta} ${procAberto === s.id ? styles.procSetaAberta : ''}`}
                              aria-hidden="true"
                            >
                              <IconChevronDireita />
                            </span>
                            <span className={styles.procTitulo}>{s.descricao ?? 'Procedimento'}</span>
                            <span className={styles.procMeta}>
                              {s.data}{s.profissional ? ` · ${s.profissional}` : ''}
                            </span>
                            {s.valor != null && (
                              <span className={styles.procValor}>{formatarReais(s.valor)}</span>
                            )}
                          </button>

                          {procAberto === s.id && (
                            <div className={styles.procDetalhes}>
                              {/* Odontograma daquele dia, marcado como ficou. */}
                              {s.odontograma ? (
                                <div
                                  ref={leituraRef}
                                  className={`${styles.shell} ${styles.shellLeitura} ${escuro ? 'dark' : ''}`}
                                >
                                  <OdontogramShell
                                    language="pt-br"
                                    darkMode={escuro}
                                    readOnly
                                    themeConfig={escuro ? TEMA_ESCURO : TEMA_CLARO}
                                  />
                                </div>
                              ) : (
                                <p className={styles.procSemFicha}>
                                  Procedimento sem registro do odontograma.
                                </p>
                              )}
                              {s.acoes.length > 0 && (
                                <ul className={styles.procAcoes}>
                                  {s.acoes.map((a, i) => <li key={`${a}-${i}`}>{a}</li>)}
                                </ul>
                              )}
                              {s.materiais && s.materiais.length > 0 && (
                                <p className={styles.procMateriais}>
                                  Materiais: {s.materiais.map(m => `${m.nome} (${m.quantidade})`).join(' · ')}
                                </p>
                              )}
                              {s.observacao && <p className={styles.procObs}>{s.observacao}</p>}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ))}
          </div>
        )}

        {/* ── Modal: novo tratamento (leve, sem odontograma) ── */}
        <Modal
          open={modalTratamento}
          onClose={() => setModalTratamento(false)}
          title="Novo tratamento"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalTratamento(false)} disabled={criando}>Cancelar</Button>
              <Button loading={criando} onClick={criarTratamento}>Criar tratamento</Button>
            </>
          }
        >
          <div className={styles.modalTratamento}>
            <Input
              label="Descrição do tratamento"
              placeholder="Ex: Tratamento de canal"
              value={nomeTratamento}
              onChange={e => { setNomeTratamento(e.target.value); setErroNomeTratamento('') }}
              error={erroNomeTratamento}
              autoFocus
            />
            <Input
              label="Data de início"
              type="date"
              value={dataTratamentoIso}
              onChange={e => setDataTratamentoIso(e.target.value)}
            />
          </div>
        </Modal>
      </div>
    )
  }

  // ── Modo PROCEDIMENTO: descrição + data → odontograma → relatório ao vivo ──
  const dataBr = dataIso.split('-').reverse().join('/')

  return (
    <div className={styles.painel}>
      {/* Topo: descrição do procedimento + data. */}
      <section className={styles.editorCard}>
        <header className={styles.chartHeader}>
          <div>
            <h2 className={styles.chartTitle}>Novo procedimento — {tratamentoAtivo?.procedimento}</h2>
            <p className={styles.chartHint}>
              {tratamentoAtivo?.sessoes.length
                ? `${tratamentoAtivo.sessoes.length} procedimento(s) já registrados neste tratamento.`
                : 'Primeiro procedimento deste tratamento.'}
            </p>
          </div>
          <div className={styles.editorAcoes}>
            <Button variant="ghost" onClick={fecharEditor} disabled={adicionando}>Cancelar</Button>
            <Button onClick={pedirConfirmacao} loading={adicionando}>Salvar</Button>
          </div>
        </header>

        <div className={styles.editorCampos}>
          <Input
            label="Descrição do procedimento"
            placeholder="Ex: Abertura e instrumentação"
            value={descricao}
            onChange={e => { setDescricao(e.target.value); setErroDescricao('') }}
            error={erroDescricao}
            autoFocus
          />
          <Input
            label="Data"
            type="date"
            value={dataIso}
            onChange={e => setDataIso(e.target.value)}
          />
          <Input
            label="Valor"
            iconLeft={<span className={styles.prefixo}>R$</span>}
            inputMode="decimal"
            placeholder="0,00"
            value={valorTexto}
            onChange={e => { setValorTexto(e.target.value); setErroValor('') }}
            error={erroValor}
          />
        </div>
      </section>

      {/* Odontograma interativo. */}
      <section className={styles.chartCard}>
        <div ref={shellRef} className={`${styles.shell} ${escuro ? 'dark' : ''}`}>
          <OdontogramShell
            language="pt-br"
            darkMode={escuro}
            enableNotes
            themeConfig={escuro ? TEMA_ESCURO : TEMA_CLARO}
          />
        </div>
      </section>

      {/* Relatório escrito ao vivo + observações + imprimir. */}
      <section className={styles.editorCard}>
        <header className={styles.chartHeader}>
          <div>
            <h2 className={styles.chartTitle}>Relatório do procedimento</h2>
            <p className={styles.chartHint}>Atualiza conforme você sinaliza os dentes.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            iconLeft={<IconImprimir />}
            onClick={() => imprimir({
              titulo: 'Relatório de procedimento',
              subtitulo: tratamentoAtivo?.procedimento ?? undefined,
              corpo: corpoProcedimento(
                tratamentoAtivo?.procedimento ?? '—', descricao, dataBr,
                relatorio, materiaisPreenchidos(), observacao.trim(), pacienteNome,
                valorTexto.trim() && !Number.isNaN(parseReais(valorTexto)) ? parseReais(valorTexto) : undefined,
              ),
              estilos: ESTILOS_PROCEDIMENTO,
              largura: 640,
            })}
          >
            Imprimir
          </Button>
        </header>

        {relatorio.length === 0 ? (
          <p className={styles.relatorioVazio}>Nada sinalizado ainda — marque os dentes no odontograma acima.</p>
        ) : (
          <ul className={styles.relatorioLista}>
            {relatorio.map(l => (
              <li key={l.dente} className={styles.relatorioLinha}>
                <span className={styles.dentePill}>Dente {l.dente}</span>
                <span className={styles.relatorioTexto}>{l.texto}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Materiais utilizados: nenhum, um ou vários — como o profissional quiser. */}
        <div className={styles.materiais}>
          <div className={styles.materiaisCabecalho}>
            <span className={styles.materiaisTitulo}>Materiais utilizados</span>
            <Button variant="outline" size="sm" iconLeft={<IconMais />} onClick={adicionarMaterial}>
              Adicionar material
            </Button>
          </div>

          {materiais.length === 0 ? (
            <p className={styles.materiaisVazio}>Nenhum material lançado (opcional).</p>
          ) : (
            materiais.map((m, i) => (
              <div key={i} className={styles.materialLinha}>
                <Input
                  placeholder="Material — ex: Resina fotopolimerizável A2"
                  value={m.nome}
                  onChange={e => mudarMaterial(i, 'nome', e.target.value)}
                  aria-label={`Nome do material ${i + 1}`}
                />
                <Input
                  placeholder="Qtd — ex: 2 tubetes"
                  value={m.quantidade}
                  onChange={e => mudarMaterial(i, 'quantidade', e.target.value)}
                  aria-label={`Quantidade do material ${i + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<IconX />}
                  onClick={() => removerMaterial(i)}
                  title="Remover material"
                  aria-label={`Remover material ${i + 1}`}
                />
              </div>
            ))
          )}
        </div>

        <Textarea
          label="Observações"
          placeholder="Anotações do procedimento — também entram no relatório impresso."
          rows={3}
          value={observacao}
          onChange={e => setObservacao(e.target.value)}
        />
      </section>

      {/* Confirmação de salvamento: finalizado agora ou continua depois. */}
      <ConfirmDialog
        open={confirmando}
        onClose={() => setConfirmando(false)}
        onConfirm={salvarProcedimento}
        title="Salvar procedimento?"
        message={
          finalizado
            ? 'O tratamento será marcado como finalizado.'
            : 'O tratamento fica em aberto — dá para adicionar novos procedimentos depois.'
        }
        confirmLabel="Salvar"
      >
        <Toggle label="Tratamento finalizado" checked={finalizado} onChange={setFinalizado} />
      </ConfirmDialog>
    </div>
  )
}
