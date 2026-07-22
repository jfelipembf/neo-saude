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
import {
  usePatientTreatments, useCreateTreatment, useAddTreatmentSession, useSessionBillingPreview,
} from '@/hooks/useTreatments'
import { SessionBillingLine } from './SessionBillingLine'
import { useTheme } from '@/context/ThemeProvider'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { esc } from '@/utils/printDocument'
import { toIsoDate } from '@/utils/date'
import { useProfessionalName } from '@/hooks/useDisplayNames'
import { formatBRL, parseBRL } from '@/utils/format'
import { IconPlus, IconPrint, IconTasks, IconChevronRight, IconX } from '@/components/icons'
import type { OdontogramThemeConfig } from '@/lib/odontogramShell/odontogram-shell'
import type { SessionBillingChoice, UsedMaterial, TreatmentSession, Treatment } from '@/types/domain'
import styles from './TreatmentsPanel.module.scss'

interface TreatmentsPanelProps {
  patientId: string
  /** Nome exibido no relatório impresso. */
  patientName?: string
}

/** Linha do relatório ao vivo: o que foi sinalizado num dente do odontograma. */
interface ReportRow {
  tooth: string
  text: string
}

/** CSS específico do relatório — o resto vem da base de impressão. */
const PROCEDURE_STYLES = `
  h2 { font-size: 14px; margin: 16px 0 6px; }
  ul { margin: 0 0 0 18px; padding: 0; font-size: 13px; } li { margin: 3px 0; }
`

/** Miolo do relatório do PROCEDIMENTO em edição — cabeçalho da clínica vem da base. */
function procedureBody(
  treatment: string, procedure: string, dateBr: string,
  report: ReportRow[], materials: UsedMaterial[], notes: string,
  patientName?: string, amount?: number,
) {
  const lines = report
    .map(l => `<li><strong>Dente ${esc(l.tooth)}</strong> — ${esc(l.text)}</li>`)
    .join('')

  return `
    ${patientName ? `<p><strong>Patient:</strong> ${esc(patientName)}</p>` : ''}
    <p><strong>Tratamento:</strong> ${esc(treatment)}<br>
       <strong>Procedimento:</strong> ${esc(procedure) || '—'}<br>
       <strong>Data:</strong> ${esc(dateBr)}${amount != null ? `<br><strong>Valor:</strong> ${formatBRL(amount)}` : ''}</p>
    <h2>O que foi feito</h2>
    ${lines ? `<ul>${lines}</ul>` : '<p>Nada sinalizado no odontograma.</p>'}
    ${materials.length ? `<h2>Materiais utilizados</h2><ul>${materials.map(m => `<li>${esc(m.name)}${m.quantity ? ` — ${esc(m.quantity)}` : ''}</li>`).join('')}</ul>` : ''}
    ${notes ? `<p class="clausula"><strong>Observações:</strong> ${esc(notes)}</p>` : ''}
    <p class="clausula">Sem valor de prontuário oficial.</p>`
}

/**
 * Carrega um snapshot na ficha JÁ MONTADA, com retry: o motor monta async e o
 * StrictMode do React desmonta/remonta o shell zerando o estado do motor.
 * Reaplica até o motor confirmar (resumo do dente marcado escrito no `title`
 * do tile) ou até o timeout; devolve o cleanup.
 */
function loadChart(
  root: HTMLElement | null,
  payload: Record<string, unknown> | null,
): (() => void) | undefined {
  if (!root) return undefined
  const teeth = Object.keys((payload?.teeth as Record<string, unknown> | undefined) ?? {})
  const start = Date.now()
  const timer = setInterval(() => {
    loadOdontogramState(payload)
    const confirmed =
      teeth.length === 0 ||
      teeth.some(d => root.querySelector(`.tooth-tile[data-tooth="${d}"]`)?.getAttribute('title'))
    if (confirmed || Date.now() - start > 3000) clearInterval(timer)
  }, 150)
  return () => clearInterval(timer)
}

/**
 * Desliga por padrão as camadas de osso e polpa (os botões seguem disponíveis
 * para religar). Retry até o motor montar os botões; devolve o cleanup.
 */
function hideDefaultLayers(root: HTMLElement): () => void {
  const hiddenByDefault = ['btnBoneVisible', 'btnPulpVisible']
  const start = Date.now()
  const timer = setInterval(() => {
    const pending = hiddenByDefault.filter(id => {
      const btn = root.querySelector<HTMLButtonElement>(`#${id}`)
      if (!btn) return true
      if (btn.getAttribute('aria-pressed') === 'true') btn.click()
      return btn.getAttribute('aria-pressed') === 'true'
    })
    if (pending.length === 0 || Date.now() - start > 3000) clearInterval(timer)
  }, 120)
  return () => clearInterval(timer)
}

// Paleta do odontograma = tokens do app (styles/_themes.scss), por tema.
const LIGHT_THEME: OdontogramThemeConfig = {
  background: '#F3F7F5', panel: '#FFFFFF', card: '#FFFFFF',
  text: '#12211C', muted: '#5E6E68', line: '#D8E2DE',
  accent: '#10B981', accent2: '#8B5CF6',
}

const DARK_THEME: OdontogramThemeConfig = {
  background: '#0D1512', panel: '#121D18', card: '#121D18',
  text: '#EDF7F2', muted: '#95A69F', line: '#26332D',
  accent: '#34D399', accent2: '#A78BFA',
}

/**
 * Aba "Tratamento": o tratamento nasce leve (descrição + data, SEM odontograma)
 * e vira um nó da TIMELINE; cada "Novo procedimento" abre o editor com
 * odontograma e entra conectado como sub-rota do tratamento.
 */
export function TreatmentsPanel({ patientId, patientName }: TreatmentsPanelProps) {
  const toast = useToast()
  const professionalName = useProfessionalName()
  const { data: treatments, isLoading } = usePatientTreatments(patientId)
  const { mutate: create, isPending: creating } = useCreateTreatment()
  const { mutate: addSession, isPending: adding } = useAddTreatmentSession()
  const print = usePrintDocument()
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [mode, setMode] = useState<'list' | 'procedure'>('list')
  const [activeTreatment, setActiveTreatment] = useState<Treatment | null>(null)

  // Modal "Novo tratamento" (leve: descrição + data — sem odontograma).
  const [treatmentModal, setTreatmentModal] = useState(false)
  const [treatmentName, setTreatmentName] = useState('')
  const [treatmentDateIso, setTreatmentDateIso] = useState(() => toIsoDate(new Date()))
  const [treatmentNameError, setTreatmentNameError] = useState('')

  // Editor de procedimento.
  const [description, setDescription] = useState('')
  const [dateIso, setDateIso] = useState(() => toIsoDate(new Date()))
  const [amountText, setAmountText] = useState('')
  const [amountError, setAmountError] = useState('')
  const [materials, setMaterials] = useState<UsedMaterial[]>([])
  const [notes, setNotes] = useState('')
  const [report, setReport] = useState<ReportRow[]>([])
  const [descriptionError, setDescriptionError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [finished, setFinished] = useState(false)

  // Reflexo financeiro do procedimento. Vazio = caminho padrão (um clique só):
  // o banco decide pela escada. `billingOpen` é só a gaveta do "Trocar".
  const [billing, setBilling] = useState<SessionBillingChoice>({})
  const [billingOpen, setBillingOpen] = useState(false)
  /** Chave de idempotência do procedimento em edição (ver openProcedure). */
  const [clientToken, setClientToken] = useState('')

  // Procedimento expandido na timeline (um por vez: o motor do odontograma é
  // global de módulo — dois shells montados disputariam o mesmo DOM).
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(null)

  const shellRef = useRef<HTMLDivElement>(null)
  const readOnlyRef = useRef<HTMLDivElement>(null)

  // Visões padrão da ficha no EDITOR: osso e polpa ocultos.
  useEffect(() => {
    if (mode !== 'procedure') return
    const root = shellRef.current
    if (!root) return
    return hideDefaultLayers(root)
  }, [mode])

  // Mesmas visões padrão no shell de LEITURA (procedimento expandido).
  useEffect(() => {
    if (!expandedProcedure) return
    const root = readOnlyRef.current
    if (!root) return
    return hideDefaultLayers(root)
  }, [expandedProcedure])

  // Ficha inicial do EDITOR — carregada APÓS o mount do shell (o destroy do
  // shell anterior limpa o estado do motor): continua do snapshot do último
  // procedimento, ou limpa a ficha no primeiro.
  useEffect(() => {
    if (mode !== 'procedure' || !activeTreatment) return
    const last = [...activeTreatment.sessions].reverse().find(s => s.odontogram)
    return loadChart(shellRef.current, last?.odontogram ?? null)
  }, [mode, activeTreatment])

  // Snapshot do procedimento expandido na timeline — idem, após o mount do
  // shell de leitura, que então mostra os dentes como ficaram naquele dia.
  useEffect(() => {
    if (!expandedProcedure) return
    const session = (treatments ?? []).flatMap(t => t.sessions).find(s => s.id === expandedProcedure)
    if (!session?.odontogram) return
    return loadChart(readOnlyRef.current, session.odontogram)
  }, [expandedProcedure, treatments])

  // Relatório AO VIVO: o motor grava o resumo de cada dente no `title` do tile
  // (data-tooth) a cada mudança — um MutationObserver colhe e vira texto.
  useEffect(() => {
    if (mode !== 'procedure') return
    const root = shellRef.current
    if (!root) return

    let scheduled = 0
    function collect() {
      scheduled = 0
      const byTooth = new Map<number, string>()
      root!.querySelectorAll<HTMLElement>('.tooth-tile[data-tooth][title]').forEach(tile => {
        const num = Number(tile.dataset.tooth)
        const text = (tile.getAttribute('title') ?? '').replace(/\n/g, ' · ').trim()
        if (num && text && !byTooth.has(num)) byTooth.set(num, text)
      })
      setReport(
        [...byTooth.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([tooth, text]) => ({ tooth: String(tooth), text })),
      )
    }

    const observer = new MutationObserver(() => {
      if (scheduled) return
      scheduled = window.setTimeout(collect, 300)   // debounce das rajadas do motor
    })
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['title'] })
    collect()

    return () => {
      observer.disconnect()
      if (scheduled) window.clearTimeout(scheduled)
    }
  }, [mode])

  const list = treatments ?? []

  // Valor digitado, já em número. Vazio ou inválido ⇒ sem valor: o banco trata
  // como procedimento que não vira dinheiro (retorno, acompanhamento).
  const amountValue = amountText.trim() && !Number.isNaN(parseBRL(amountText)) ? parseBRL(amountText) : undefined
  const performedOnBr = dateIso.split('-').reverse().join('/')

  // A prévia só é perguntada quando o diálogo de salvamento abre — antes disso
  // o profissional ainda está desenhando no odontograma, e cada tecla no campo
  // de valor viraria uma ida ao servidor.
  const {
    data: billingPreview,
    isFetching: loadingPreview,
    error: previewError,
  } = useSessionBillingPreview(patientId, amountValue, performedOnBr, billing, confirming)

  // Duas escolhas pela metade que salvariam o CONTRÁRIO do que o usuário quis:
  //  1. cortesia sem motivo escrito — a escada do banco só entende motivo
  //     preenchido, então geraria a cobrança que ele acabou de recusar;
  //  2. cartão sem adquirente — o título nasceria com `debtor = 'payer'`, isto
  //     é, como dívida do PACIENTE por uma venda que a maquininha já garantiu,
  //     e chegaria a ser cobrado na aba Inadimplência.
  const courtesyWithoutReason =
    billing.notBillableReason !== undefined && !billing.notBillableReason.trim()
  const cardWithoutAcquirer =
    (billing.method === 'credit' || billing.method === 'debit') && !billing.acquirerId
  const billingIncomplete = courtesyWithoutReason || cardWithoutAcquirer

  // ── Novo tratamento (modal leve) ───────────────────────────────────────────
  function openTreatmentModal() {
    setTreatmentName('')
    setTreatmentDateIso(toIsoDate(new Date()))
    setTreatmentNameError('')
    setTreatmentModal(true)
  }

  function createTreatment() {
    if (!treatmentName.trim()) {
      setTreatmentNameError('Descreva o tratamento.')
      return
    }
    create(
      {
        patientId,
        procedure: treatmentName.trim(),
        date: treatmentDateIso.split('-').reverse().join('/'),
      },
      {
        onSuccess: () => {
          toast.success('Tratamento criado! Adicione o primeiro procedimento.')
          setTreatmentModal(false)
        },
        // Falha silenciosa aqui deixava o modal aberto sem explicação nenhuma:
        // o usuário clicava de novo achando que o botão não pegou.
        onError: e => toast.error(
          `Não foi possível criar o tratamento: ${e instanceof Error ? e.message : 'erro inesperado'}.`,
        ),
      },
    )
  }

  // Expande/recolhe um procedimento da timeline — o snapshot é carregado pelo
  // efeito acima, depois que o shell de leitura monta.
  function toggleProcedure(session: TreatmentSession) {
    setExpandedProcedure(current => (current === session.id ? null : session.id))
  }

  // ── Novo procedimento (editor com odontograma) ─────────────────────────────
  function openProcedure(treatment: Treatment) {
    setExpandedProcedure(null)
    setActiveTreatment(treatment)
    setDescription('')
    setDateIso(toIsoDate(new Date()))
    setAmountText('')
    setAmountError('')
    setMaterials([])
    setNotes('')
    setReport([])
    setDescriptionError('')
    setFinished(false)
    setBilling({})
    setBillingOpen(false)
    // Chave de idempotência DESTE procedimento. Nasce ao abrir o editor e vive
    // até ele fechar: se a primeira tentativa salvar no banco mas a resposta se
    // perder na rede, o clique seguinte manda o MESMO token e o banco devolve o
    // procedimento já gravado, em vez de criar outro com outra cobrança.
    setClientToken(crypto.randomUUID())
    setMode('procedure')
  }

  // Materiais utilizados — lista dinâmica opcional (nenhum, um ou vários).
  function addMaterial() {
    setMaterials(current => [...current, { name: '', quantity: '' }])
  }

  function changeMaterial(index: number, field: keyof UsedMaterial, value: string) {
    setMaterials(current => current.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }

  function removeMaterial(index: number) {
    setMaterials(current => current.filter((_, i) => i !== index))
  }

  /** Linhas preenchidas (nome obrigatório) — o que vai para o registro. */
  function filledMaterials() {
    return materials
      .map(m => ({ name: m.name.trim(), quantity: m.quantity.trim() }))
      .filter(m => m.name)
  }

  function closeEditor() {
    setMode('list')
    setActiveTreatment(null)
    setConfirming(false)
  }

  function requestConfirmation() {
    if (!description.trim()) {
      setDescriptionError('Descreva o procedimento.')
      return
    }
    if (amountText.trim() && Number.isNaN(parseBRL(amountText))) {
      setAmountError('Valor inválido.')
      return
    }
    setConfirming(true)
  }

  function saveProcedure() {
    if (!activeTreatment) return
    const usedMaterials = filledMaterials()
    addSession(
      {
        treatmentId: activeTreatment.id,
        patientId,
        slot: {
          description: description.trim(),
          date: performedOnBr,
          actions: report.map(l => `Dente ${l.tooth}: ${l.text}`),
          teeth: report.map(l => l.tooth),
          materials: usedMaterials.length ? usedMaterials : undefined,
          notes: notes.trim() || undefined,
          amount: amountValue,
          odontogram: getOdontogramState(),
          statusAfter: finished ? 'finished' : 'open',
          billing,
          // A MESMA chave em toda retentativa deste procedimento: é ela que
          // impede o segundo clique (depois de um erro de rede) de virar um
          // segundo procedimento com uma segunda cobrança.
          clientToken,
        },
      },
      {
        // O toast diz o que ACONTECEU com o dinheiro, e o desfecho vem do
        // BANCO (`status`), não da prévia: entre abrir o diálogo e salvar, um
        // orçamento aprovado em outra tela muda a decisão, e repetir a prévia
        // aqui anunciaria uma cobrança que não nasceu — ou calaria uma que
        // nasceu.
        onSuccess: status => {
          toast.success(
            status === 'billed' ? 'Procedimento registrado e cobrança gerada!'
            : status === 'covered' ? 'Procedimento registrado — abatido do contrato aprovado, sem cobrança nova.'
            : status === 'not_billable' ? 'Procedimento registrado como cortesia — não gera cobrança.'
            : status === 'unbilled' && amountValue ? 'Procedimento registrado — ficou em “A faturar” no Financeiro.'
            : 'Procedimento registrado!',
          )
          closeEditor()
        },
        // Sem isto o diálogo fechava (ConfirmDialog fecha logo após confirmar),
        // nenhum aviso aparecia e o editor continuava aberto: o profissional
        // não tinha como saber se o procedimento foi salvo — e clicar de novo
        // era a aposta natural.
        onError: e => {
          // NÃO prometer "nada foi gravado": o erro mais perigoso é justamente
          // aquele em que o banco gravou e a resposta se perdeu no caminho.
          // Quem garante que tentar de novo não cobra duas vezes é o
          // clientToken, não esta frase — e é isso que a frase diz.
          toast.error(
            `Não foi possível confirmar o salvamento: ${e instanceof Error ? e.message : 'erro inesperado'}. `
            + 'Pode tentar de novo — a nova tentativa reaproveita o mesmo procedimento e não gera cobrança dobrada.',
          )
        },
      },
    )
  }

  if (isLoading) {
    return <div className={styles.carregando}><Spinner size="lg" /></div>
  }

  // ── Modo LISTA: timeline de tratamentos com procedimentos conectados ───────
  if (mode === 'list') {
    return (
      <div className={styles.painel}>
        <header className={styles.chartHeader}>
          <div>
            <h2 className={styles.chartTitle}>Tratamentos</h2>
            <p className={styles.chartHint}>Cada tratamento agrupa os procedimentos feitos ao longo dos dias.</p>
          </div>
          <Button iconLeft={<IconPlus />} onClick={openTreatmentModal}>
            Novo tratamento
          </Button>
        </header>

        {list.length === 0 ? (
          <EmptyState
            icon={<IconTasks />}
            title="Nenhum tratamento registrado"
            description="Crie um tratamento e adicione os procedimentos de cada dia — o odontograma abre na hora do procedimento."
            action={
              <Button iconLeft={<IconPlus />} onClick={openTreatmentModal}>
                Novo tratamento
              </Button>
            }
          />
        ) : (
          <div className={styles.tratamentos}>
            {list.map(t => (
              <section key={t.id} className={styles.trat}>
                <header className={styles.tratCabecalho}>
                  <div className={styles.tratInfo}>
                    <span className={styles.tratTitulo}>{t.procedure}</span>
                    <span className={styles.tratMeta}>
                      {t.tooth ? `Dente ${t.tooth} · ` : ''}iniciado em {t.startedAt}
                      {t.completedAt ? ` · concluído em ${t.completedAt}` : ''}
                    </span>
                  </div>
                  <div className={styles.tratAcoes}>
                    {t.sessions.some(s => s.amount != null) && (
                      <div className={styles.tratTotal}>
                        <span className={styles.tratTotalRotulo}>Total</span>
                        <span className={styles.tratTotalValor}>
                          {formatBRL(t.sessions.reduce((sum, s) => sum + (s.amount ?? 0), 0))}
                        </span>
                      </div>
                    )}
                    <Badge status={t.status} />
                    {t.status === 'open' && (
                      <Button
                        variant="outline"
                        size="sm"
                        iconLeft={<IconPlus />}
                        onClick={() => openProcedure(t)}
                      >
                        Novo procedimento
                      </Button>
                    )}
                  </div>
                </header>

                {/* Sub-rotas: os procedimentos conectados pelo trilho. */}
                {t.sessions.length === 0 ? (
                  <p className={styles.tratVazio}>
                    Nenhum procedimento ainda — clique em “Novo procedimento” para abrir o odontograma.
                  </p>
                ) : (
                  <ol className={styles.procedimentos}>
                    {t.sessions.map(s => (
                      <li key={s.id} className={styles.procItem}>
                        <span className={styles.procPonto} aria-hidden="true" />
                        <div className={styles.procCorpo}>
                          <button
                            type="button"
                            className={styles.procExpandir}
                            aria-expanded={expandedProcedure === s.id}
                            onClick={() => toggleProcedure(s)}
                          >
                            <span
                              className={`${styles.procSeta} ${expandedProcedure === s.id ? styles.procSetaAberta : ''}`}
                              aria-hidden="true"
                            >
                              <IconChevronRight />
                            </span>
                            <span className={styles.procTitulo}>{s.description ?? 'Procedimento'}</span>
                            <span className={styles.procMeta}>
                              {s.date}{s.professionalId ? ` · ${professionalName(s.professionalId)}` : ''}
                            </span>
                            {s.amount != null && (
                              <span className={styles.procValor}>{formatBRL(s.amount)}</span>
                            )}
                          </button>

                          {expandedProcedure === s.id && (
                            <div className={styles.procDetalhes}>
                              {/* Odontograma daquele dia, marcado como ficou. */}
                              {s.odontogram ? (
                                <div
                                  ref={readOnlyRef}
                                  className={`${styles.shell} ${styles.shellLeitura} ${dark ? 'dark' : ''}`}
                                >
                                  <OdontogramShell
                                    language="pt-br"
                                    darkMode={dark}
                                    readOnly
                                    themeConfig={dark ? DARK_THEME : LIGHT_THEME}
                                  />
                                </div>
                              ) : (
                                <p className={styles.procSemFicha}>
                                  Procedimento sem registro do odontograma.
                                </p>
                              )}
                              {s.actions.length > 0 && (
                                <ul className={styles.procAcoes}>
                                  {s.actions.map((a, i) => <li key={`${a}-${i}`}>{a}</li>)}
                                </ul>
                              )}
                              {s.materials && s.materials.length > 0 && (
                                <p className={styles.procMateriais}>
                                  Materiais: {s.materials.map(m => `${m.name} (${m.quantity})`).join(' · ')}
                                </p>
                              )}
                              {s.notes && <p className={styles.procObs}>{s.notes}</p>}
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
          open={treatmentModal}
          onClose={() => setTreatmentModal(false)}
          title="Novo tratamento"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setTreatmentModal(false)} disabled={creating}>Cancelar</Button>
              <Button loading={creating} onClick={createTreatment}>Criar tratamento</Button>
            </>
          }
        >
          <div className={styles.modalTratamento}>
            <Input
              label="Descrição do tratamento"
              placeholder="Ex: Tratamento de canal"
              value={treatmentName}
              onChange={e => { setTreatmentName(e.target.value); setTreatmentNameError('') }}
              error={treatmentNameError}
              autoFocus
            />
            <Input
              label="Data de início"
              type="date"
              value={treatmentDateIso}
              onChange={e => setTreatmentDateIso(e.target.value)}
            />
          </div>
        </Modal>
      </div>
    )
  }

  // ── Modo PROCEDIMENTO: descrição + data → odontograma → relatório ao vivo ──
  return (
    <div className={styles.painel}>
      {/* Topo: descrição do procedimento + data. */}
      <section className={styles.editorCard}>
        <header className={styles.chartHeader}>
          <div>
            <h2 className={styles.chartTitle}>Novo procedimento — {activeTreatment?.procedure}</h2>
            <p className={styles.chartHint}>
              {activeTreatment?.sessions.length
                ? `${activeTreatment.sessions.length} procedimento(s) já registrados neste tratamento.`
                : 'Primeiro procedimento deste tratamento.'}
            </p>
          </div>
          <div className={styles.editorAcoes}>
            <Button variant="ghost" onClick={closeEditor} disabled={adding}>Cancelar</Button>
            <Button onClick={requestConfirmation} loading={adding}>Salvar</Button>
          </div>
        </header>

        <div className={styles.editorCampos}>
          <Input
            label="Descrição do procedimento"
            placeholder="Ex: Abertura e instrumentação"
            value={description}
            onChange={e => { setDescription(e.target.value); setDescriptionError('') }}
            error={descriptionError}
            autoFocus
          />
          <Input
            label="Data"
            type="date"
            value={dateIso}
            onChange={e => setDateIso(e.target.value)}
          />
          <Input
            label="Valor"
            iconLeft={<span className={styles.prefixo}>R$</span>}
            inputMode="decimal"
            placeholder="0,00"
            value={amountText}
            onChange={e => { setAmountText(e.target.value); setAmountError('') }}
            error={amountError}
          />
        </div>
      </section>

      {/* Odontograma interativo. */}
      <section className={styles.chartCard}>
        <div ref={shellRef} className={`${styles.shell} ${dark ? 'dark' : ''}`}>
          <OdontogramShell
            language="pt-br"
            darkMode={dark}
            enableNotes
            themeConfig={dark ? DARK_THEME : LIGHT_THEME}
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
            iconLeft={<IconPrint />}
            onClick={() => print({
              title: 'Relatório de procedimento',
              subtitle: activeTreatment?.procedure ?? undefined,
              body: procedureBody(
                activeTreatment?.procedure ?? '—', description, performedOnBr,
                report, filledMaterials(), notes.trim(), patientName, amountValue,
              ),
              styles: PROCEDURE_STYLES,
              width: 640,
            })}
          >
            Imprimir
          </Button>
        </header>

        {report.length === 0 ? (
          <p className={styles.relatorioVazio}>Nada sinalizado ainda — marque os dentes no odontograma acima.</p>
        ) : (
          <ul className={styles.relatorioLista}>
            {report.map(l => (
              <li key={l.tooth} className={styles.relatorioLinha}>
                <span className={styles.dentePill}>Dente {l.tooth}</span>
                <span className={styles.relatorioTexto}>{l.text}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Materiais utilizados: nenhum, um ou vários — como o profissional quiser. */}
        <div className={styles.materiais}>
          <div className={styles.materiaisCabecalho}>
            <span className={styles.materiaisTitulo}>Materiais utilizados</span>
            <Button variant="outline" size="sm" iconLeft={<IconPlus />} onClick={addMaterial}>
              Adicionar material
            </Button>
          </div>

          {materials.length === 0 ? (
            <p className={styles.materiaisVazio}>Nenhum material lançado (opcional).</p>
          ) : (
            materials.map((m, i) => (
              <div key={i} className={styles.materialLinha}>
                <Input
                  placeholder="Material — ex: Resina fotopolimerizável A2"
                  value={m.name}
                  onChange={e => changeMaterial(i, 'name', e.target.value)}
                  aria-label={`Nome do material ${i + 1}`}
                />
                <Input
                  placeholder="Qtd — ex: 2 tubetes"
                  value={m.quantity}
                  onChange={e => changeMaterial(i, 'quantity', e.target.value)}
                  aria-label={`Quantidade do material ${i + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<IconX />}
                  onClick={() => removeMaterial(i)}
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
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </section>

      {/* Confirmação de salvamento: o que acontece com o tratamento E com o
          dinheiro. A linha financeira entra AQUI, no diálogo que o profissional
          já vê — não é uma etapa nova: o caminho padrão continua um clique. */}
      <ConfirmDialog
        open={confirming}
        onClose={() => { setConfirming(false); setBillingOpen(false) }}
        onConfirm={saveProcedure}
        title="Salvar procedimento?"
        message={
          finished
            ? 'O tratamento será marcado como finalizado.'
            : 'O tratamento fica em aberto — dá para adicionar novos procedimentos depois.'
        }
        confirmLabel="Salvar"
        confirmDisabled={billingIncomplete}
      >
        <SessionBillingLine
          preview={billingPreview}
          loading={loadingPreview}
          error={previewError ? previewError.message : undefined}
          amount={amountValue}
          performedOn={performedOnBr}
          billing={billing}
          onChange={setBilling}
          editing={billingOpen}
          onToggleEditing={() => setBillingOpen(open => !open)}
        />
        <Toggle label="Tratamento finalizado" checked={finished} onChange={setFinished} />
      </ConfirmDialog>
    </div>
  )
}
