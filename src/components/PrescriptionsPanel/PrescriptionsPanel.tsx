import { useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { usePagination } from '@/hooks/usePagination'
import { usePrescricoesDoPaciente, useCriarPrescricao } from '@/hooks/usePrescricoes'
import { useUsuarioLogado } from '@/hooks/useUsuario'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { esc } from '@/utils/printDocument'
import { toIsoDate } from '@/utils/date'
import { IconMais, IconImprimir, IconX, IconDocumento } from '@/components/icons'
import type { PrescribedMedication, Prescription, PrescriptionType } from '@/types/domain'
import styles from './PrescriptionsPanel.module.scss'

const OPCOES_TIPO: { value: PrescriptionType; label: string }[] = [
  { value: 'receituario', label: 'Receituário' },
  { value: 'prontuario',  label: 'Prontuário' },
  { value: 'atestado',    label: 'Atestado' },
  { value: 'documento',   label: 'Documento' },
]

const OPCOES_FILTRO = [{ value: 'todos', label: 'Todos os tipos' }, ...OPCOES_TIPO]

/** Texto-modelo do atestado — os dados do paciente entram sozinhos (padrão
 *  dos softwares do ramo); o texto continua editável antes de salvar. */
function textoAtestado(pacienteNome: string | undefined, dias: number) {
  return `Atesto, para os devidos fins, que ${pacienteNome ?? 'o(a) paciente'} esteve sob meus cuidados profissionais nesta data, necessitando de ${dias} dia(s) de afastamento de suas atividades a partir de hoje.`
}

/** Rótulo do tipo da prescrição ("Receituário", "Atestado"…). */
function rotuloTipo(p: Prescription) {
  return OPCOES_TIPO.find(t => t.value === p.tipo)?.label ?? p.titulo
}

/** CSS específico do receituário — o resto vem da base de impressão. */
const ESTILOS_PRESCRICAO = `
  .meds { margin: 16px 0 0 20px; padding: 0; } .meds li { margin: 12px 0; font-size: 14px; }
  .pos { color: #334; font-size: 13px; }
  .texto { margin-top: 16px; font-size: 13.5px; line-height: 1.6; }
  .assinatura { margin-top: 72px; text-align: center; }
  .assinatura .linha { display: inline-block; border-top: 1px solid #12211C; padding-top: 6px;
                       min-width: 260px; font-size: 13px; }
`

/** Miolo da prescrição/documento — cabeçalho da clínica vem da base. */
function corpoPrescricao(p: Prescription, pacienteNome?: string) {
  const conteudo = p.tipo === 'receituario'
    ? `<ol class="meds">${(p.medicamentos ?? [])
        .map(m => `<li><strong>${esc(m.nome)}</strong>${m.quantidade ? ` — ${esc(m.quantidade)}` : ''}<br><span class="pos">${esc(m.posologia)}</span></li>`)
        .join('')}</ol>`
    : `<p class="texto">${esc(p.texto ?? '').replace(/\n/g, '<br>')}</p>`

  return `
    ${pacienteNome ? `<p><strong>Patient:</strong> ${esc(pacienteNome)}</p>` : ''}
    <p><strong>Data:</strong> ${esc(p.data)}</p>
    ${conteudo}
    ${p.observacao ? `<p class="clausula"><strong>Observações:</strong> ${esc(p.observacao)}</p>` : ''}
    <div class="assinatura"><span class="linha">${esc(p.profissional ?? 'Profissional responsável')}</span></div>`
}

interface PrescriptionsPanelProps {
  pacienteId: string
  /** Nome usado no texto do atestado e na impressão. */
  pacienteNome?: string
}

/**
 * Aba "Prescrições": emite receituário (medicamentos + posologia), evolução
 * de prontuário, atestado com texto-modelo e documento personalizado — tudo
 * com histórico, expansão e impressão.
 */
export function PrescriptionsPanel({ pacienteId, pacienteNome }: PrescriptionsPanelProps) {
  const toast = useToast()
  const { data: prescricoes, isLoading } = usePrescricoesDoPaciente(pacienteId)
  const { data: usuario } = useUsuarioLogado()
  const { mutate: criar, isPending: criando } = useCriarPrescricao()
  const imprimir = usePrintDocument()

  const [filtroTipo, setFiltroTipo] = useState<'todos' | PrescriptionType>('todos')

  // Modal "Nova prescrição".
  const [modalAberto, setModalAberto] = useState(false)
  const [tipo, setTipo] = useState<PrescriptionType>('receituario')
  const [dataIso, setDataIso] = useState(() => toIsoDate(new Date()))
  const [medicamentos, setMedicamentos] = useState<PrescribedMedication[]>([])
  const [dias, setDias] = useState('1')
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState('')

  const filtradas = (prescricoes ?? []).filter(p => filtroTipo === 'todos' || p.tipo === filtroTipo)
  const pag = usePagination(filtradas)

  if (isLoading) {
    return <div className={styles.carregando}><Spinner size="lg" /></div>
  }

  const lista = prescricoes ?? []

  function abrirModal() {
    setTipo('receituario')
    setDataIso(toIsoDate(new Date()))
    setMedicamentos([{ nome: '', posologia: '', quantidade: '' }])
    setDias('1')
    setTitulo('')
    setTexto('')
    setObservacao('')
    setErro('')
    setModalAberto(true)
  }

  // Trocar o tipo prepara os campos daquele modelo (atestado já vem escrito).
  function mudarTipo(novo: PrescriptionType) {
    setTipo(novo)
    setErro('')
    if (novo === 'atestado') setTexto(textoAtestado(pacienteNome, Number(dias) || 1))
    else if (novo !== tipo) setTexto('')
  }

  function mudarDias(valor: string) {
    setDias(valor)
    // O modelo re-escreve o texto — edições manuais valem após ajustar os dias.
    setTexto(textoAtestado(pacienteNome, Number(valor) || 1))
  }

  function mudarMedicamento(indice: number, campo: keyof PrescribedMedication, valor: string) {
    setMedicamentos(atual => atual.map((m, i) => (i === indice ? { ...m, [campo]: valor } : m)))
  }

  function aoSalvar() {
    const dataBr = dataIso.split('-').reverse().join('/')
    const meds = medicamentos
      .map(m => ({ nome: m.nome.trim(), posologia: m.posologia.trim(), quantidade: m.quantidade?.trim() || undefined }))
      .filter(m => m.nome)

    if (tipo === 'receituario' && meds.length === 0) {
      setErro('Adicione ao menos um medicamento.')
      return
    }
    if (tipo !== 'receituario' && !texto.trim()) {
      setErro('Escreva o conteúdo do documento.')
      return
    }
    if (tipo === 'documento' && !titulo.trim()) {
      setErro('Dê um título ao documento.')
      return
    }

    const titulos: Record<PrescriptionType, string> = {
      receituario: 'Receituário',
      prontuario: 'Evolução clínica',
      atestado: `Atestado — ${Number(dias) || 1} dia(s)`,
      documento: titulo.trim(),
    }

    criar(
      {
        pacienteId,
        tipo,
        titulo: titulos[tipo],
        data: dataBr,
        profissional: usuario?.nome,
        medicamentos: tipo === 'receituario' ? meds : undefined,
        texto: tipo === 'receituario' ? undefined : texto.trim(),
        observacao: observacao.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Prescrição emitida!')
          setModalAberto(false)
        },
      },
    )
  }

  const columns: TableColumn<Prescription>[] = [
    { key: 'data', label: 'Data', render: p => <span className={styles.data}>{p.data}</span> },
    { key: 'tipo', label: 'Tipo', render: p => <Badge status={p.tipo} /> },
    { key: 'titulo', label: 'Título', render: p => <span className={styles.titulo}>{p.titulo}</span> },
    { key: 'profissional', label: 'Profissional', render: p => p.profissional ?? '—' },
    {
      key: 'acoes',
      label: 'Ação',
      render: p => (
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<IconImprimir />}
          title="Imprimir"
          aria-label={`Imprimir ${p.titulo}`}
          onClick={() => imprimir({
            titulo: rotuloTipo(p),
            subtitulo: p.titulo && p.titulo !== rotuloTipo(p) ? p.titulo : undefined,
            corpo: corpoPrescricao(p, pacienteNome),
            estilos: ESTILOS_PRESCRICAO,
            largura: 640,
          })}
        />
      ),
    },
  ]

  return (
    <div className={styles.painel}>
      <header className={styles.cabecalho}>
        <div>
          <h2 className={styles.cabecalhoTitulo}>Prescrições e documentos</h2>
          <p className={styles.cabecalhoHint}>Receituário, evolução de prontuário, atestado e documentos personalizados.</p>
        </div>
        <Button iconLeft={<IconMais />} onClick={abrirModal}>Nova prescrição</Button>
      </header>

      {lista.length === 0 ? (
        <EmptyState
          icon={<IconDocumento />}
          title="Nenhuma prescrição emitida"
          description="Emita receituários, atestados e documentos — tudo fica no histórico do paciente, pronto para reimprimir."
          action={<Button iconLeft={<IconMais />} onClick={abrirModal}>Nova prescrição</Button>}
        />
      ) : (
        <Table
          columns={columns}
          data={pag.visiveis}
          rowKey={p => p.id}
          emptyMessage="Nenhuma prescrição para o filtro."
          renderExpanded={p => (
            <div className={styles.detalhe}>
              {p.tipo === 'receituario' ? (
                <ol className={styles.meds}>
                  {(p.medicamentos ?? []).map((m, i) => (
                    <li key={`${m.nome}-${i}`} className={styles.med}>
                      <span className={styles.medNome}>
                        {m.nome}{m.quantidade ? <span className={styles.medQtd}> — {m.quantidade}</span> : null}
                      </span>
                      <span className={styles.medPosologia}>{m.posologia}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.texto}>{p.texto}</p>
              )}
              {p.observacao && <p className={styles.obs}>Observações: {p.observacao}</p>}
            </div>
          )}
          toolbar={
            <>
              <PerPageSelect porPagina={pag.porPagina} onChange={pag.mudarPorPagina} />
              <Select
                size="sm"
                options={OPCOES_FILTRO}
                value={filtroTipo}
                onChange={e => { setFiltroTipo(e.target.value as 'todos' | PrescriptionType); pag.setPagina(1) }}
                aria-label="Filtrar por tipo"
                className={styles.filtroTipo}
              />
            </>
          }
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

      {/* ── Modal: nova prescrição ── */}
      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Nova prescrição"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalAberto(false)} disabled={criando}>Cancelar</Button>
            <Button loading={criando} onClick={aoSalvar}>Emitir</Button>
          </>
        }
      >
        <div className={styles.modalCorpo}>
          <SegmentedControl options={OPCOES_TIPO} value={tipo} onChange={mudarTipo} />

          <div className={styles.linhaData}>
            <Input
              label="Data"
              type="date"
              value={dataIso}
              onChange={e => setDataIso(e.target.value)}
            />
            {tipo === 'atestado' && (
              <Input
                label="Dias de afastamento"
                type="number"
                min={1}
                value={dias}
                onChange={e => mudarDias(e.target.value)}
              />
            )}
            {tipo === 'documento' && (
              <Input
                label="Título do documento"
                placeholder="Ex: Orientações pós-operatórias"
                value={titulo}
                onChange={e => { setTitulo(e.target.value); setErro('') }}
              />
            )}
          </div>

          {tipo === 'receituario' ? (
            <div className={styles.medsEditor}>
              <span className={styles.medsRotulo}>Medicamentos</span>
              {medicamentos.map((m, i) => (
                <div key={i} className={styles.medLinha}>
                  <Input
                    placeholder="Medicamento — ex: Amoxicilina 500 mg"
                    value={m.nome}
                    onChange={e => { mudarMedicamento(i, 'nome', e.target.value); setErro('') }}
                    aria-label={`Medicamento ${i + 1}`}
                  />
                  <Input
                    placeholder="Posologia — ex: 1 cápsula a cada 8h por 7 dias"
                    value={m.posologia}
                    onChange={e => mudarMedicamento(i, 'posologia', e.target.value)}
                    aria-label={`Posologia do medicamento ${i + 1}`}
                  />
                  <Input
                    placeholder="Qtd — ex: 1 caixa"
                    value={m.quantidade ?? ''}
                    onChange={e => mudarMedicamento(i, 'quantidade', e.target.value)}
                    aria-label={`Quantidade do medicamento ${i + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<IconX />}
                    onClick={() => setMedicamentos(atual => atual.filter((_, j) => j !== i))}
                    title="Remover medicamento"
                    aria-label={`Remover medicamento ${i + 1}`}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                iconLeft={<IconMais />}
                className={styles.medsAdicionar}
                onClick={() => setMedicamentos(atual => [...atual, { nome: '', posologia: '', quantidade: '' }])}
              >
                Adicionar medicamento
              </Button>
            </div>
          ) : (
            <Textarea
              label={tipo === 'prontuario' ? 'Evolução clínica' : tipo === 'atestado' ? 'Texto do atestado' : 'Conteúdo do documento'}
              placeholder={tipo === 'prontuario' ? 'O que foi observado e realizado no atendimento...' : 'Escreva o conteúdo...'}
              rows={tipo === 'atestado' ? 4 : 6}
              value={texto}
              onChange={e => { setTexto(e.target.value); setErro('') }}
            />
          )}

          {tipo === 'receituario' && (
            <Textarea
              label="Observações"
              placeholder="Orientações gerais que saem no receituário impresso."
              rows={2}
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
            />
          )}

          {erro && <p className={styles.erro}>{erro}</p>}
        </div>
      </Modal>
    </div>
  )
}
