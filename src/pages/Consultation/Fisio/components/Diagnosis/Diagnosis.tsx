import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Input } from '@/components/Input/Input'
import { useToast } from '@/components/Toast/Toast'
import { IconEdit, IconPlus, IconTrash } from '@/components/icons'
import {
  useAddClinicalEntry, useRemoveClinicalEntry, useUpdateClinicalEntry,
} from '@/hooks/useClinicalEntries'
import { errorMessage } from '@/utils/errors'
import type { ClinicalEntry } from '@/services/clinicalEntriesService'
import styles from './Diagnosis.module.scss'

interface DiagnosisProps {
  patientId: string
  appointmentId: string
  professionalId?: string
  entradas: ClinicalEntry[]
}

/**
 * DIAGNÓSTICO — um cartão por diagnóstico (ponto verde), com os achados
 * clínicos lançados dentro dele logo abaixo, ligados por uma linha — mesma
 * linguagem visual da timeline de evolução.
 *
 * NASCE EM MODO DE VISUALIZAÇÃO: só texto, sem input nenhum na tela — é o
 * que se lê durante o atendimento. O botão "Editar" do cartão é que revela
 * os campos (editar o texto do diagnóstico, editar/excluir cada achado,
 * acrescentar achado novo); apertado de novo, o cartão volta a exibir só o
 * texto. Sem esse alterna, a tela ficava cheia de campo de formulário
 * mesmo fora de uso — o comum é olhar o que já foi registrado, não editar.
 *
 * Achado pertence a UM diagnóstico (`problems.diagnosis_id` aponta pra linha
 * `diagnosis` que o abriga). Os que já existiam ANTES desse vínculo
 * (diagnosis_id nulo) aparecem num cartão à parte, "Achados sem
 * diagnóstico", pra nenhum registro antigo sumir do prontuário.
 */
export function Diagnosis({
  patientId, appointmentId, professionalId, entradas,
}: DiagnosisProps) {
  const toast = useToast()
  const { mutate: anotarDiagnostico, isPending: criandoDiagnostico } = useAddClinicalEntry()
  const { mutate: excluir } = useRemoveClinicalEntry()
  const [novoDiagnostico, setNovoDiagnostico] = useState('')
  // Diagnóstico recém-criado: o cartão dele nasce ABERTO, com o campo de achado
  // à vista. Registrar o diagnóstico e ter de clicar em "Editar" para lançar o
  // achado é um passo a mais no meio do raciocínio clínico — os dois vêm juntos
  // na cabeça de quem avalia.
  const [recemCriado, setRecemCriado] = useState<string | null>(null)
  const [aExcluir, setAExcluir] = useState<ClinicalEntry | null>(null)

  const diagnosticos = entradas.filter(e => e.kind === 'diagnosis')
  const achadosSemDiagnostico = entradas.filter(e => e.kind === 'problems' && !e.diagnosisId)

  function criarDiagnostico(e: FormEvent) {
    e.preventDefault()
    if (!novoDiagnostico.trim()) return
    anotarDiagnostico(
      { patientId, appointmentId, kind: 'diagnosis', content: novoDiagnostico, professionalId },
      {
        onSuccess: (id: string) => {
          setNovoDiagnostico('')
          setRecemCriado(id)
          toast.success('Diagnóstico registrado.')
        },
        onError: err => toast.error(errorMessage(err, 'Não foi possível registrar.')),
      },
    )
  }

  return (
    <>
      {/* Novo diagnóstico primeiro: é o ponto de entrada — os achados entram
          DEPOIS, dentro do cartão que este formulário cria. Sempre visível
          (não faz parte do alterna visualização/edição de cada cartão). */}
      <form className={styles.achadoForm} onSubmit={criarDiagnostico}>
        <Input
          placeholder="Ex.: lombalgia mecânica crônica"
          value={novoDiagnostico}
          onChange={e => setNovoDiagnostico(e.target.value)}
          aria-label="Novo diagnóstico"
        />
        <Button
          type="submit" size="sm" iconLeft={<IconPlus />}
          loading={criandoDiagnostico} disabled={!novoDiagnostico.trim()}
        >
          Novo diagnóstico
        </Button>
      </form>

      {diagnosticos.length === 0 ? (
        <p className={styles.vazio}>Nenhum diagnóstico registrado para este paciente.</p>
      ) : (
        <div className={styles.diagnosticoLista}>
          {diagnosticos.map(d => (
            <DiagnosticoCard
              key={d.id}
              diagnostico={d}
              achados={entradas.filter(e => e.kind === 'problems' && e.diagnosisId === d.id)}
              patientId={patientId}
              appointmentId={appointmentId}
              professionalId={professionalId}
              onExcluirDiagnostico={() => setAExcluir(d)}
              onExcluirAchado={setAExcluir}
              abrirEmEdicao={d.id === recemCriado}
            />
          ))}
        </div>
      )}

      {/* Só aparece se houver achado lançado ANTES do vínculo com diagnóstico
          existir — não há como criar um novo achado aqui, de propósito: todo
          achado novo nasce dentro de um diagnóstico. */}
      {achadosSemDiagnostico.length > 0 && (
        <div className={styles.bloco}>
          <span className={styles.blocoTitulo}>Achados sem diagnóstico</span>
          <ul className={styles.achados}>
            {achadosSemDiagnostico.map(a => (
              <li key={a.id} className={styles.achado}>
                <span className={styles.achadoTexto}>{a.content}</span>
                <span className={styles.achadoData}>{a.eventDate ?? a.date}</span>
                <Button
                  variant="ghost" size="sm" iconLeft={<IconTrash />}
                  aria-label={`Excluir ${a.content}`}
                  onClick={() => setAExcluir(a)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={aExcluir !== null}
        onClose={() => setAExcluir(null)}
        onConfirm={() => {
          if (!aExcluir) return
          excluir({ id: aExcluir.id, patientId }, {
            onSuccess: () => toast.success(
              aExcluir.kind === 'diagnosis' ? 'Diagnóstico excluído.' : 'Achado excluído.',
            ),
            onError: e => toast.error(errorMessage(e, 'Não foi possível excluir.')),
          })
          setAExcluir(null)
        }}
        title={aExcluir?.kind === 'diagnosis' ? 'Excluir diagnóstico?' : 'Excluir achado?'}
        message={
          aExcluir?.kind === 'diagnosis'
            ? `"${aExcluir.content}" e os achados clínicos lançados dentro dele saem juntos do prontuário. Se o quadro mudou, prefira registrar um diagnóstico novo.`
            : `"${aExcluir?.content ?? ''}" sai do prontuário deste paciente. Se o quadro mudou, prefira registrar um achado novo — o anterior é o que explica a conduta daquela época.`
        }
        variant="danger"
        confirmLabel="Excluir"
      />
    </>
  )
}

interface DiagnosticoCardProps {
  diagnostico: ClinicalEntry
  achados: ClinicalEntry[]
  patientId: string
  appointmentId: string
  professionalId?: string
  onExcluirDiagnostico: () => void
  onExcluirAchado: (achado: ClinicalEntry) => void
  /** Cartão nasce aberto (diagnóstico recém-criado) — campo de achado à vista. */
  abrirEmEdicao?: boolean
}

/**
 * Um diagnóstico (ponto verde) + os achados clínicos DELE, ligados por uma
 * linha. Alterna entre visualização (padrão) e edição no botão do cabeçalho.
 */
function DiagnosticoCard({
  diagnostico, achados, patientId, appointmentId, professionalId, onExcluirDiagnostico,
  onExcluirAchado, abrirEmEdicao = false,
}: DiagnosticoCardProps) {
  const toast = useToast()
  const { mutate: anotar, isPending: adicionando } = useAddClinicalEntry()
  const { mutate: alterar, isPending: salvando } = useUpdateClinicalEntry()

  // Só o valor INICIAL: depois de montado, quem manda é o botão do cabeçalho.
  // O cartão recém-criado monta com a prop já `true`, porque a lista só
  // rerrenderiza depois que a query invalidada volta com ele.
  const [editando, setEditando] = useState(abrirEmEdicao)
  const [textoDiagnostico, setTextoDiagnostico] = useState(diagnostico.content)
  const [novoAchado, setNovoAchado] = useState('')

  function alternarEdicao() {
    // Reabrir sempre parte do texto GRAVADO, não do que ficou digitado e
    // descartado na última vez que o cartão foi fechado sem salvar.
    if (!editando) setTextoDiagnostico(diagnostico.content)
    setEditando(v => !v)
  }

  function salvarDiagnostico() {
    if (!textoDiagnostico.trim() || textoDiagnostico === diagnostico.content) return
    alterar({ id: diagnostico.id, patientId, content: textoDiagnostico }, {
      onSuccess: () => toast.success('Diagnóstico atualizado.'),
      onError: e => toast.error(errorMessage(e, 'Não foi possível alterar.')),
    })
  }

  function adicionarAchado(e: FormEvent) {
    e.preventDefault()
    if (!novoAchado.trim()) return
    anotar(
      {
        patientId, appointmentId, kind: 'problems', content: novoAchado, professionalId,
        diagnosisId: diagnostico.id,
      },
      {
        onSuccess: () => {
          setNovoAchado('')
          toast.success('Achado registrado.')
        },
        onError: err => toast.error(errorMessage(err, 'Não foi possível registrar.')),
      },
    )
  }

  return (
    <div className={styles.diagnosticoCard}>
      <header className={styles.diagnosticoCabecalho}>
        <span className={styles.diagnosticoPonto} aria-hidden="true" />

        {editando ? (
          <Input
            className={styles.diagnosticoInput}
            size="sm"
            value={textoDiagnostico}
            onChange={e => setTextoDiagnostico(e.target.value)}
            aria-label="Editar diagnóstico"
          />
        ) : (
          <span className={styles.diagnosticoTexto}>{diagnostico.content}</span>
        )}

        <div className={styles.diagnosticoAcoes}>
          {editando && (
            <Button
              size="sm" loading={salvando}
              disabled={!textoDiagnostico.trim() || textoDiagnostico === diagnostico.content}
              onClick={salvarDiagnostico}
            >
              Salvar
            </Button>
          )}
          <Button
            variant="ghost" size="sm" iconLeft={<IconEdit />}
            aria-pressed={editando}
            aria-label={editando ? 'Fechar edição' : 'Editar diagnóstico e achados'}
            onClick={alternarEdicao}
          />
          <Button
            variant="ghost" size="sm" iconLeft={<IconTrash />}
            aria-label={`Excluir diagnóstico ${diagnostico.content}`}
            onClick={onExcluirDiagnostico}
          />
        </div>
      </header>

      {achados.length > 0 && (
        <ul className={styles.achadosConectados}>
          {achados.map(a => (
            <AchadoLinha
              key={a.id}
              achado={a}
              patientId={patientId}
              editavel={editando}
              onExcluir={() => onExcluirAchado(a)}
            />
          ))}
        </ul>
      )}

      {/* O formulário de acrescentar só aparece em edição — em visualização,
          a lista acima é tudo que a tela mostra. */}
      {editando && (
        <form className={styles.achadoForm} onSubmit={adicionarAchado}>
          <Input
            size="sm"
            /* O título do diagnóstico no placeholder: com vários cartões
               abertos, é o que diz A QUAL deles este campo pertence sem obrigar
               a subir os olhos até o cabeçalho. */
            placeholder={`Achado clínico de ${diagnostico.content}`}
            value={novoAchado}
            onChange={e => setNovoAchado(e.target.value)}
            aria-label={`Novo achado de ${diagnostico.content}`}
          />
          <Button type="submit" size="sm" iconLeft={<IconPlus />} loading={adicionando} disabled={!novoAchado.trim()}>
            Adicionar
          </Button>
        </form>
      )}
    </div>
  )
}

interface AchadoLinhaProps {
  achado: ClinicalEntry
  patientId: string
  /** Herdado do cartão: só entra em edição junto com o diagnóstico — não faz
   *  sentido editar o achado com o diagnóstico ainda em modo leitura. */
  editavel: boolean
  onExcluir: () => void
}

/** Um achado, na lista ligada ao diagnóstico — texto em visualização,
 *  campo próprio quando o cartão está em edição. */
function AchadoLinha({ achado, patientId, editavel, onExcluir }: AchadoLinhaProps) {
  const toast = useToast()
  const { mutate: alterar, isPending } = useUpdateClinicalEntry()
  const [texto, setTexto] = useState(achado.content)

  function salvar() {
    if (!texto.trim() || texto === achado.content) return
    alterar({ id: achado.id, patientId, content: texto }, {
      onSuccess: () => toast.success('Achado atualizado.'),
      onError: e => toast.error(errorMessage(e, 'Não foi possível alterar.')),
    })
  }

  return (
    <li className={styles.achadoConectado}>
      {editavel ? (
        <>
          <Input
            size="sm"
            className={styles.achadoInput}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            aria-label="Editar achado"
          />
          <Button size="sm" loading={isPending} disabled={!texto.trim() || texto === achado.content} onClick={salvar}>
            Salvar
          </Button>
          <Button
            variant="ghost" size="sm" iconLeft={<IconTrash />}
            aria-label={`Excluir ${achado.content}`}
            onClick={onExcluir}
          />
        </>
      ) : (
        <span className={styles.achadoTexto}>{achado.content}</span>
      )}
    </li>
  )
}
