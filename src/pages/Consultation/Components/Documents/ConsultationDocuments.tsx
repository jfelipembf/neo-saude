import { useRef, useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/Toast'
import { IconDocument, IconEdit, IconEye, IconPlus, IconPrint, IconTrash } from '@/components/icons'
import { useClinic } from '@/hooks/useClinic'
import { useCurrentUser } from '@/hooks/useUser'
import {
  useCreatePrescription, useDeletePrescription, useSetPrescriptionDelivered,
  useUpdatePrescription,
} from '@/hooks/usePrescriptions'
import {
  useAppointmentAttachments, useDeleteDocument, useUpdateDocument, useUploadDocument,
} from '@/hooks/useDocuments'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { useDocumentSigner } from '@/hooks/useDisplayNames'
import {
  CLINICAL_DOCUMENT_STYLES, EXAM_REQUEST_TITLE, attendanceCertificateText,
  certificateBody, examRequestBody, examRequestText, isExamRequest,
  leaveCertificateText, parseExamRequestText, prescriptionBody,
} from '@/utils/clinicalDocument'
import { errorMessage } from '@/utils/errors'
import { formatCpf } from '@/utils/format'
import { formatLongDate, isoToBrDate, toIsoDate } from '@/utils/date'
import type { ClinicSpecialty, PatientDocument, Prescription } from '@/types/domain'
import type { Cid10 } from '@/services/cid10Service'
import { CidPicker } from './CidPicker'
import { ExamsField } from './ExamsField'
import styles from './Documents.module.scss'

// SEM 'receita': a medicação do paciente tem aba própria (MedicationsPanel),
// onde ela é PRESCRITA COM HISTÓRICO — período de uso, troca e suspensão. Um
// segundo lugar para digitar remédio aqui produzia a mesma medicação em duas
// listas que não conversam: a receita impressa dizia uma coisa e a aba de
// Medicações, outra. Receitas já emitidas continuam listadas e reimprimíveis
// abaixo; o que saiu é a EMISSÃO de novas por este painel.
type Tipo = 'atestado' | 'exame' | 'relatorio'

const TIPOS_DOCUMENTO = [
  { value: 'atestado'  as const, label: 'Atestado' },
  { value: 'relatorio' as const, label: 'Relatório' },
]
const TIPOS_EXAME = [{ value: 'exame' as const, label: 'Solicitação de exame' }]

/** Com que tipo o formulário abre em cada foco. */
function tipoInicial(foco: FocoDoPainel): Tipo {
  return foco === 'exames' ? 'exame' : 'atestado'
}

/**
 * O QUE O PAINEL MOSTRA.
 *
 * Separado porque são dois momentos da consulta: `documentos` é o que a clínica
 * ENTREGA ao paciente (receita, atestado, relatório); `exames` é o ciclo do
 * exame — o pedido que sai e o resultado que volta anexado. Juntar os dois numa
 * lista só fazia o resultado do hemograma aparecer entre dois atestados.
 */
export type FocoDoPainel = 'documentos' | 'exames'

interface ConsultationDocumentsProps {
  foco: FocoDoPainel
  /** A consulta — o anexo pendura NELA, não solto no paciente: assim o exame
   *  trazido hoje fica ligado ao atendimento em que foi visto. */
  appointmentId: string
  patientId: string
  patientName: string
  patientCpf?: string
  specialty?: ClinicSpecialty
  documentos: Prescription[]
}

/**
 * O QUE SAI DESTA CONSULTA EM PAPEL.
 *
 * Lista o que o paciente já tem e emite o que falta. Os corpos dos documentos
 * vêm de utils/clinicalDocument — os MESMOS que a Cibelly usa por voz e que o
 * perfil do paciente usa pelo botão. Uma segunda redação de receita aqui seria
 * a receita divergindo por onde foi emitida.
 */
export function ConsultationDocuments({
  foco, appointmentId, patientId, patientName, patientCpf, specialty, documentos,
}: ConsultationDocumentsProps) {
  const toast = useToast()
  const { data: clinica } = useClinic()
  const { data: usuario } = useCurrentUser()
  const { mutate: criar, isPending } = useCreatePrescription()
  const { mutate: alterar, isPending: alterando } = useUpdatePrescription()
  const { mutate: excluirDocumento } = useDeletePrescription()
  const { mutate: marcarEntrega } = useSetPrescriptionDelivered()
  /** Pedido cujo resultado está sendo anexado — o input precisa saber a qual. */
  const pedidoDoAnexo = useRef<string | null>(null)
  const imprimir = usePrintDocument()
  const assinanteDe = useDocumentSigner()

  const arquivoRef = useRef<HTMLInputElement>(null)
  const { data: anexos } = useAppointmentAttachments(appointmentId)
  const { mutate: anexar, isPending: anexando } = useUploadDocument()
  const { mutate: apagarAnexo } = useDeleteDocument()
  const { mutate: salvarAnexo, isPending: salvandoAnexo } = useUpdateDocument()

  /** Anexo aberto no visor e o texto das observações em curso. */
  const [vendo, setVendo] = useState<PatientDocument | null>(null)
  const [observacoes, setObservacoes] = useState('')

  const [aberto, setAberto] = useState(false)
  const [tipo, setTipo] = useState<Tipo>(tipoInicial(foco))
  const [texto, setTexto] = useState('')
  const [dias, setDias] = useState('1')
  const [cid, setCid] = useState<Cid10 | undefined>()
  const [exames, setExames] = useState<string[]>([])

  /**
   * TROCAR DE ABA PRECISA ZERAR O FORMULÁRIO — e não é o que acontecia.
   *
   * Documentos e Exames são o MESMO componente na mesma posição da árvore (ver
   * o `case 'documentos': case 'exames':` das páginas de atendimento): o React
   * reconcilia como o mesmo elemento e PRESERVA o estado. Só a prop `foco`
   * mudava — `tipo` continuava no que estava.
   *
   * O estrago era em cascata: entrando por Documentos e indo para Exames, o
   * `tipo` ficava em atestado; como o foco de exames tem um tipo só, o seletor
   * fica escondido e não havia como perceber nem corrigir. O formulário do
   * atestado aparecia dentro de "Solicitação de exame", o Emitir gravava um
   * Atestado — que a lista de exames filtra fora, então ele sumia da tela — e o
   * papel impresso saía sendo o documento errado.
   *
   * Ajuste de estado DURANTE o render (padrão do React, e o que a regra
   * `react-hooks/set-state-in-effect` do projeto exige): reagir a isto num
   * `useEffect` renderizaria um quadro com o formulário errado antes de trocar.
   */
  const [focoAnterior, setFocoAnterior] = useState(foco)
  if (foco !== focoAnterior) {
    setFocoAnterior(foco)
    setTipo(tipoInicial(foco))
    // Junto com o tipo vai o que foi digitado: uma hipótese diagnóstica meio
    // escrita não deve reaparecer como texto de um relatório.
    setTexto('')
    setDias('1')
    setCid(undefined)
    setExames([])
  }
  /** Documento em edição (título e observações) — null = ninguém editando. */
  const [editando, setEditando] = useState<Prescription | null>(null)
  const [tituloEditado, setTituloEditado] = useState('')
  const [notasEditadas, setNotasEditadas] = useState('')
  /**
   * O que está na mira da exclusão. Um estado só para os DOIS tipos: documento
   * emitido e anexo passam pelo mesmo diálogo, com mensagem própria — dois
   * diálogos separados seria a mesma pergunta escrita duas vezes.
   */
  const [aExcluir, setAExcluir] = useState<
    { tipo: 'documento' | 'anexo'; id: string; nome: string } | null
  >(null)

  // Pedido de exame fica no painel de Exames; o resto, no de Documentos.
  const daLista = documentos.filter(d => (foco === 'exames' ? isExamRequest(d) : !isExamRequest(d)))
  const tiposDisponiveis = foco === 'exames' ? TIPOS_EXAME : TIPOS_DOCUMENTO

  /**
   * O RESULTADO QUE VOLTOU, embaixo do pedido que o gerou.
   *
   * A lista separada de "resultados anexados" saiu: com o arquivo nascendo
   * amarrado ao pedido (`prescription_id`), repetir tudo num segundo bloco
   * obrigava o médico a casar hemograma com hemograma de olho.
   */
  const anexosDoPedido = (pedidoId: string) => (anexos ?? []).filter(a => a.prescriptionId === pedidoId)

  /**
   * Anexos sem pedido — os que vieram do modal da sessão ou de antes desta
   * ligação existir. Só aparecem quando existem: sem eles, nada é desenhado.
   */
  const anexosSoltos = (anexos ?? []).filter(a => !a.prescriptionId)

  function abrirVisor(a: PatientDocument) {
    setVendo(a)
    setObservacoes(a.description ?? '')
  }

  const hojeBr = isoToBrDate(toIsoDate(new Date())) ?? ''
  // Sem registro no conselho o documento não vale — melhor recusar aqui do que
  // imprimir um papel que o paciente descobre inválido no balcão da farmácia.
  const semRegistro = !usuario?.license || !/\d/.test(usuario.license)

  function corpoDoDocumento() {
    const base = {
      patientName,
      patientCpf: patientCpf ? formatCpf(patientCpf) : undefined,
      longDate: formatLongDate(hojeBr),
      city: clinica?.city,
      signer: { name: usuario?.name ?? '', license: usuario?.license ?? '', specialty },
    }
    switch (tipo) {
      case 'atestado': {
        const diasAfastado = Math.max(1, Number(dias) || 1)
        /**
         * SÓ O CÓDIGO, sem a doença por extenso.
         *
         * O atestado vai para o empregador. "J11.0" cumpre a exigência legal;
         * "Influenza com pneumonia" entrega o diagnóstico escrito a quem não
         * precisa dele — e o código existe justamente para isso, para informar
         * sem expor. Quem tem de traduzir (perícia, medicina do trabalho) tem
         * a tabela.
         *
         * A descrição continua na tela, no campo de busca, para o médico
         * conferir que escolheu o código certo.
         */
        const corpo = cid
          ? `${leaveCertificateText(patientName, diasAfastado)} CID-10: ${cid.display}.`
          : leaveCertificateText(patientName, diasAfastado)
        return { titulo: 'Atestado', tipo: 'certificate' as const, html: certificateBody({ ...base, text: corpo }) }
      }
      case 'exame':
        return {
          titulo: EXAM_REQUEST_TITLE, tipo: 'document' as const,
          // `texto` aqui é a HIPÓTESE DIAGNÓSTICA, não a lista: é ela que o
          // laboratório e o convênio pedem para autorizar o exame.
          html: examRequestBody({ ...base, exams: exames, justification: texto || undefined }),
        }
      case 'relatorio':
        return {
          titulo: 'Relatório', tipo: 'document' as const,
          // `base.longDate` e não `hojeBr`: o modelo escreve "compareceu … em
          // {data}", e ali cabe a data por extenso do fecho, não "30/07/2026".
          html: certificateBody({ ...base, text: texto || attendanceCertificateText(patientName, base.longDate) }),
        }
    }
  }

  /**
   * SEGUNDA VIA de um documento já emitido.
   *
   * Reconstrói o papel a partir do que foi GRAVADO, não do formulário — e usa a
   * data de emissão original, não a de hoje: reimpressão é outra cópia do mesmo
   * documento, não um documento novo. Carimbar a data de hoje daria ao paciente
   * um atestado com data diferente do que ele já entregou.
   */
  function reimprimir(d: Prescription) {
    // Assina quem EMITIU, não quem está reimprimindo (ver useDocumentSigner).
    // Só cai no usuário logado quando o documento é antigo e não guardou o
    // profissional — aí não há de quem herdar.
    const quemAssinou = assinanteDe(d.professionalId)
    const base = {
      patientName,
      patientCpf: patientCpf ? formatCpf(patientCpf) : undefined,
      longDate: formatLongDate(d.date),
      city: clinica?.city,
      signer: {
        name: quemAssinou?.name ?? usuario?.name ?? '',
        license: quemAssinou?.license ?? usuario?.license ?? '',
        specialty,
      },
      code: d.code,
      notes: d.notes,
    }
    /**
     * O PEDIDO DE EXAME tem corpo próprio, e caía no `else` genérico.
     *
     * Ele é gravado como `type: 'document'` — igual ao relatório —, então a
     * segunda via saía por `certificateBody`: a lista de exames virava uma
     * frase corrida ("Hemograma completo; TSH — suspeita de hipotireoidismo"),
     * sem os itens enumerados que o laboratório confere um a um. O papel da
     * emissão e o da reimpressão eram documentos diferentes.
     *
     * Desfaz o mesmo par de junções que `emitir` faz — `exames.join('; ')` e
     * depois `' — '` com a hipótese. O `slice(1).join` devolve a hipótese
     * inteira caso ela própria contenha um travessão.
     */
    let html: string
    if (isExamRequest(d)) {
      html = examRequestBody({ ...base, ...parseExamRequestText(d.text) })
    } else if (d.type === 'prescription') {
      // Receitas antigas: este painel não emite mais (a medicação tem aba
      // própria), mas as já emitidas continuam aqui e precisam reimprimir
      // como receita — com a posologia em lista, não como parágrafo.
      html = prescriptionBody({ ...base, medications: d.medications, text: d.text })
    } else {
      html = certificateBody({ ...base, text: d.text ?? d.title })
    }

    // SEM `subtitle`: o corpo já abre com "Paciente: nome — CPF" (patientLine
    // em utils/clinicalDocument). Passar o nome aqui o imprimia duas vezes
    // seguidas, e a de cima ainda vinha sem o CPF.
    imprimir({ title: d.title, body: html, styles: CLINICAL_DOCUMENT_STYLES })
  }

  /** Exame, laudo, resultado — o que o paciente traz e vira parte do prontuário. */
  function anexarArquivo(file: File) {
    anexar({
      patientId,
      appointmentId,
      // Quando veio do botão de um pedido, o arquivo nasce amarrado a ele —
      // é o que responde "o que eu pedi já voltou?".
      prescriptionId: pedidoDoAnexo.current ?? undefined,
      // Nome sem a extensão: ela já aparece na coluna do tipo, e repetir
      // ".pdf" no título polui a lista.
      name: file.name.replace(/\.[^.]+$/, ''),
      file,
    }, {
      onSuccess: () => {
        // Anexar o resultado JÁ marca a entrega: exigir os dois cliques
        // deixaria pedidos com laudo anexado ainda listados como "aguardando".
        const pedido = pedidoDoAnexo.current
        if (pedido) marcarEntrega({ id: pedido, entregue: true })
        pedidoDoAnexo.current = null
        toast.success('Resultado anexado.')
      },
      onError: e => {
        pedidoDoAnexo.current = null
        toast.error(errorMessage(e, 'Não foi possível enviar o anexo.'))
      },
    })
  }

  function emitir() {
    const doc = corpoDoDocumento()
    criar({
      patientId,
      type: doc.tipo,
      title: doc.titulo,
      date: hojeBr,
      text: tipo === 'exame' ? examRequestText(exames, texto) : (texto || doc.titulo),
    }, {
      onSuccess: () => {
        imprimir({ title: doc.titulo, body: doc.html, styles: CLINICAL_DOCUMENT_STYLES })
        toast.success(`${doc.titulo} emitido.`)
        setAberto(false)
        setTexto('')
        setCid(undefined)
        setExames([])
      },
      onError: e => toast.error(errorMessage(e, 'Não foi possível emitir o documento.')),
    })
  }

  return (
    <>
      <div className={styles.centroCabecalho}>
        {/* Sem <h2> aqui: o título do painel vem do cabeçalho, em
            ConsultationPage. Este rótulo diz o que a LISTA abaixo é. */}
        <span className={styles.blocoTitulo}>{foco === 'exames' ? 'Solicitados' : 'Emitidos'}</span>
        <Button
          size="sm" iconLeft={<IconPlus />}
          disabled={semRegistro}
          title={semRegistro ? 'Complete o registro no conselho (CRM/CRO) no seu cadastro' : undefined}
          onClick={() => setAberto(true)}
        >
          Emitir
        </Button>
      </div>

      {semRegistro && (
        <p className={styles.vazio}>
          Seu cadastro está sem o número do registro no conselho. Complete em
          Administrativo → Profissionais para poder emitir documentos.
        </p>
      )}

      {daLista.length === 0 ? (
        <p className={styles.vazio}>
          {foco === 'exames'
            ? 'Nenhum exame solicitado para este paciente.'
            : 'Nenhum documento emitido para este paciente.'}
        </p>
      ) : (
        <ul className={styles.documentos}>
          {daLista.map(d => {
          const resultados = anexosDoPedido(d.id)
          return (
            <li key={d.id} className={styles.documento}>
              {/* DUAS LINHAS: identificação em cima, ações embaixo. Numa coluna
                  de 400px, nome + selo + data + cinco botões na mesma linha se
                  espremiam até sobrepor — e o nome do documento, que é o que
                  identifica a linha, era o primeiro a sumir. */}
              <div className={styles.documentoLinha}>
              <IconDocument />
              <span className={styles.documentoNome}>{d.title}</span>
              {foco === 'exames' ? (
                /* O estado do PEDIDO no lugar do tipo: num painel só de exames,
                   o selo "Documento" em toda linha não informa nada, e o que
                   falta saber é se o resultado voltou. */
                <span className={d.deliveredOn ? styles.seloEntregue : styles.seloAguardando}>
                  {d.deliveredOn ? `Entregue ${d.deliveredOn}` : 'Aguardando'}
                </span>
              ) : (
                <Badge status={d.type} />
              )}
              <span className={styles.documentoData}>{d.date}</span>
              </div>

              {/* O RESULTADO, embaixo do pedido. Cada arquivo abre o visor —
                  é onde o exame se lê e onde a leitura fica escrita. */}
              {resultados.length > 0 && (
                <ul className={styles.resultados}>
                  {resultados.map(a => (
                    <li key={a.id} className={styles.resultado}>
                      <IconDocument />
                      <span className={styles.resultadoNome}>{a.name}</span>
                      {a.description && <span className={styles.resultadoObs}>anotado</span>}
                      <Button
                        size="sm" variant="outline" iconLeft={<IconEye />}
                        onClick={() => abrirVisor(a)}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="ghost" size="sm" iconLeft={<IconTrash />}
                        aria-label={`Excluir ${a.name}`}
                        onClick={() => setAExcluir({ tipo: 'anexo', id: a.id, nome: a.name })}
                      />
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.documentoAcoes}>
              {foco === 'exames' && (
                <>
                  {/* Com TEXTO: "anexar resultado" é a ação que o médico
                      procura nesta lista, e um clipe solto entre outros quatro
                      ícones não se acha. Com resultado já anexado o rótulo
                      muda — o pedido aceita mais de um arquivo (laudo e
                      imagem chegam separados). */}
                  <Button
                    size="sm" variant="outline"
                    loading={anexando}
                    onClick={() => { pedidoDoAnexo.current = d.id; arquivoRef.current?.click() }}
                  >
                    {resultados.length > 0 ? 'Anexar outro' : 'Anexar resultado'}
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => marcarEntrega({ id: d.id, entregue: !d.deliveredOn }, {
                      onSuccess: () => toast.success(d.deliveredOn ? 'Entrega desmarcada.' : 'Marcado como entregue.'),
                      onError: e => toast.error(errorMessage(e, 'Não foi possível atualizar.')),
                    })}
                  >
                    {d.deliveredOn ? 'Desmarcar' : 'Entregue'}
                  </Button>
                </>
              )}
              <Button
                variant="ghost" size="sm" iconLeft={<IconPrint />}
                aria-label={`Imprimir ${d.title}`}
                onClick={() => reimprimir(d)}
              />
              <Button
                variant="ghost" size="sm" iconLeft={<IconEdit />}
                aria-label={`Editar ${d.title}`}
                onClick={() => {
                  setEditando(d)
                  setTituloEditado(d.title)
                  setNotasEditadas(d.notes ?? '')
                }}
              />
              <Button
                variant="ghost" size="sm" iconLeft={<IconTrash />}
                aria-label={`Excluir ${d.title}`}
                onClick={() => setAExcluir({ tipo: 'documento', id: d.id, nome: d.title })}
              />
              </div>
            </li>
          )})}
        </ul>
      )}

      {/* O input fica FORA de qualquer bloco condicional: quem o dispara são os
          botões de cada pedido, e escondê-lo junto com uma lista tiraria o
          alvo do `click()` do ar. */}
      <input
        ref={arquivoRef}
        type="file"
        accept="image/*,application/pdf"
        className={styles.arquivoInput}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) anexarArquivo(file)
          // Zera para o mesmo arquivo poder ser escolhido de novo depois de
          // um erro — sem isto o `change` não dispara na segunda tentativa.
          e.target.value = ''
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Anexos SEM pedido — só existem se vieram de outro caminho (o modal da
          sessão, ou de antes desta ligação). Sem eles a seção nem aparece: um
          cartão dizendo "nada anexado" ocupava espaço para não informar nada,
          já que o resultado de cada exame agora mora embaixo do seu pedido. */}
      {foco === 'exames' && anexosSoltos.length > 0 && (
        <>
          <div className={styles.centroCabecalho}>
            <h2 className={styles.blocoTitulo}>Outros anexos</h2>
          </div>
          <ul className={styles.documentos}>
            {anexosSoltos.map(a => (
              <li key={a.id} className={styles.documento}>
                <div className={styles.documentoLinha}>
                  <IconDocument />
                  <span className={styles.documentoNome}>{a.name}</span>
                  <span className={styles.documentoData}>{a.type}</span>
                </div>
                <div className={styles.documentoAcoes}>
                  <Button size="sm" variant="outline" iconLeft={<IconEye />} onClick={() => abrirVisor(a)}>
                    Ver
                  </Button>
                  <Button
                    variant="ghost" size="sm" iconLeft={<IconTrash />}
                    aria-label={`Excluir ${a.name}`}
                    onClick={() => setAExcluir({ tipo: 'anexo', id: a.id, nome: a.name })}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ── O VISOR ── exame de um lado, o que o médico leu nele do outro.
          Lado a lado de propósito: a observação sobre um laudo se escreve
          OLHANDO o laudo, e um campo em outra tela vira "depois eu anoto". */}
      <Modal
        open={vendo !== null}
        size="xl"
        onClose={() => setVendo(null)}
        title={vendo?.name ?? ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setVendo(null)} disabled={salvandoAnexo}>Fechar</Button>
            <Button
              loading={salvandoAnexo}
              onClick={() => {
                if (!vendo) return
                salvarAnexo({ id: vendo.id, payload: { name: vendo.name, description: observacoes } }, {
                  onSuccess: () => { toast.success('Observações salvas.'); setVendo(null) },
                  onError: e => toast.error(errorMessage(e, 'Não foi possível salvar.')),
                })
              }}
            >
              Salvar observações
            </Button>
          </>
        }
      >
        <div className={styles.visor}>
          <div className={styles.visorArquivo}>
            {vendo && <PreviaDoAnexo anexo={vendo} />}
          </div>
          <div className={styles.visorLado}>
            <Textarea
              label="Observações"
              rows={14}
              placeholder="O que este exame mostra e o que muda na conduta."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
            />
            {/* Junta só o que existe: sem data, o rótulo "anexado em" sozinho
                fica pendurado no fim da linha. */}
            <p className={styles.visorMeta}>
              {[vendo?.type, vendo?.size, vendo?.uploadedAt && `anexado em ${vendo.uploadedAt}`]
                .filter(Boolean).join(' · ')}
            </p>
            {vendo?.url && (
              <a className={styles.visorLink} href={vendo.url} target="_blank" rel="noreferrer">
                Abrir em nova aba
              </a>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title={foco === 'exames' ? 'Solicitar exame' : 'Emitir documento'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAberto(false)} disabled={isPending}>Cancelar</Button>
            <Button loading={isPending} iconLeft={<IconPrint />} onClick={emitir}>Emitir e imprimir</Button>
          </>
        }
      >
        <div className={styles.formDocumento}>
          {/* Um tipo só no foco de exames: o controle vira ruído quando não há
              escolha a fazer. */}
          {tiposDisponiveis.length > 1 && (
            <SegmentedControl options={tiposDisponiveis} value={tipo} onChange={setTipo} />
          )}

          {tipo === 'atestado' && (
            <>
              <Input
                label="Dias de afastamento"
                type="number" min={1}
                value={dias}
                onChange={e => setDias(e.target.value)}
              />
              <CidPicker value={cid} onChange={setCid} />
            </>
          )}

          {tipo === 'exame' && (
            <>
              <ExamsField value={exames} onChange={setExames} />
              <Textarea
                label="Hipótese diagnóstica (opcional)"
                rows={3}
                placeholder="O motivo do pedido — é o que o convênio olha para autorizar."
                value={texto}
                onChange={e => setTexto(e.target.value)}
              />
            </>
          )}

          {tipo === 'relatorio' && (
            <Textarea
              label="Texto do relatório"
              rows={8}
              value={texto}
              onChange={e => setTexto(e.target.value)}
            />
          )}
        </div>
      </Modal>

      {/* Edição do que já foi emitido: título e observações. O CORPO clínico
          não entra — o papel já está com o paciente, e reescrever a receita
          depois faria o registro divergir do que ele tem na mão. Para mudar o
          conteúdo, emite-se outro e apaga-se este. */}
      <Modal
        open={editando !== null}
        onClose={() => setEditando(null)}
        title="Editar documento"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditando(null)} disabled={alterando}>Cancelar</Button>
            <Button
              loading={alterando}
              disabled={!tituloEditado.trim()}
              onClick={() => {
                if (!editando) return
                alterar({
                  id: editando.id,
                  payload: { title: tituloEditado.trim(), text: editando.text, notes: notasEditadas },
                }, {
                  onSuccess: () => { toast.success('Documento atualizado.'); setEditando(null) },
                  onError: e => toast.error(errorMessage(e, 'Não foi possível alterar.')),
                })
              }}
            >
              Salvar
            </Button>
          </>
        }
      >
        <div className={styles.formDocumento}>
          <Input
            label="Título"
            value={tituloEditado}
            onChange={e => setTituloEditado(e.target.value)}
          />
          <Textarea
            label="Observações"
            rows={4}
            value={notasEditadas}
            onChange={e => setNotasEditadas(e.target.value)}
          />
        </div>
      </Modal>

      {/* UM diálogo para os dois tipos — a pergunta é a mesma, muda o texto. */}
      <ConfirmDialog
        open={aExcluir !== null}
        onClose={() => setAExcluir(null)}
        onConfirm={() => {
          if (!aExcluir) return
          const { tipo, id, nome } = aExcluir
          const opcoes = {
            onSuccess: () => toast.success(`${tipo === 'anexo' ? 'Anexo' : 'Documento'} "${nome}" excluído.`),
            onError: (e: unknown) => toast.error(errorMessage(e, 'Não foi possível excluir.')),
          }
          if (tipo === 'anexo') apagarAnexo(id, opcoes)
          else excluirDocumento(id, opcoes)
          setAExcluir(null)
        }}
        title={aExcluir?.tipo === 'anexo' ? 'Excluir anexo?' : 'Excluir documento?'}
        message={
          aExcluir?.tipo === 'anexo'
            ? `"${aExcluir?.nome}" sai do prontuário deste paciente. O arquivo não volta — se for o único exemplar do exame, peça outro antes.`
            : `"${aExcluir?.nome}" sai do prontuário. A via que o paciente levou continua com ele, mas o registro na clínica desaparece — e é ele que responde numa fiscalização.`
        }
        variant="danger"
        confirmLabel="Excluir"
      />
    </>
  )
}

/** Extensões que o navegador desenha sozinho — o resto vira link. */
const IMAGENS = ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'BMP', 'AVIF']

/**
 * O EXAME NA TELA.
 *
 * Imagem e PDF cobrem quase tudo que chega de laboratório. HEIC do iPhone e
 * formatos de imagem médica (DICOM) o navegador não abre — nesses casos o
 * visor diz isso e oferece o arquivo, em vez de mostrar um quadro branco que
 * o médico não sabe se é erro ou exame vazio.
 */
function PreviaDoAnexo({ anexo }: { anexo: PatientDocument }) {
  if (!anexo.url) {
    return <p className={styles.vazio}>Não foi possível carregar o arquivo. Recarregue a página e tente de novo.</p>
  }
  if (IMAGENS.includes(anexo.type)) {
    return <img className={styles.visorImagem} src={anexo.url} alt={anexo.name} />
  }
  if (anexo.type === 'PDF') {
    return <iframe className={styles.visorPdf} src={anexo.url} title={anexo.name} />
  }
  return (
    <p className={styles.vazio}>
      Arquivo {anexo.type} — o navegador não exibe este formato aqui.{' '}
      <a href={anexo.url} target="_blank" rel="noreferrer">Baixar para abrir</a>.
    </p>
  )
}
