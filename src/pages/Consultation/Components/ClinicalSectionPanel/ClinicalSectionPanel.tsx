import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/Toast'
import { IconEdit, IconTrash } from '@/components/icons'
import {
  useAddClinicalEntry, useRemoveClinicalEntry, useUpdateClinicalEntry,
} from '@/hooks/useClinicalEntries'
import { errorMessage } from '@/utils/errors'
import type { ClinicalEntry, ClinicalEntryKind } from '@/services/clinicalEntriesService'
import { toIsoDate } from '@/utils/date'
import { CLINICAL_SECTIONS, PARENTESCOS } from '@/constants/clinicalSections'
import styles from './ClinicalSectionPanel.module.scss'


/** Hoje em ISO — a data que todo campo de "quando aconteceu" já traz. */
const HOJE_ISO = toIsoDate(new Date())

interface ClinicalSectionPanelProps {
  kind: ClinicalEntryKind
  patientId: string
  appointmentId: string
  professionalId?: string
  entradas: ClinicalEntry[]
  /**
   * Qual metade renderizar.
   *
   * `tudo` (padrão) mantém o comportamento de sempre: formulário e registros
   * juntos. As duas metades existem para a aba Hoje da fisioterapia, que
   * intercala o prontuário SOAP entre elas — o profissional lança o achado,
   * escreve a evolução, e o histórico fica no fim, que é onde se consulta e
   * não onde se digita.
   */
  parte?: 'tudo' | 'formulario' | 'registros'
}

/**
 * UMA SEÇÃO CLÍNICA: o que se anota agora, e o que já foi anotado antes.
 *
 * Anotar cria uma LINHA NOVA — nunca sobrescreve. O paciente que disse "não
 * fumo" em março e "parei há 2 meses" em julho tem as duas coisas no
 * prontuário, e a segunda só faz sentido ao lado da primeira. Prontuário
 * editado por cima perde justamente o que explica a conduta anterior.
 */
export function ClinicalSectionPanel({
  kind, patientId, appointmentId, professionalId, entradas, parte = 'tudo',
}: ClinicalSectionPanelProps) {
  const toast = useToast()
  const { mutate: anotar, isPending: anotando } = useAddClinicalEntry()
  const { mutate: excluir } = useRemoveClinicalEntry()
  const { mutate: alterar, isPending: alterando } = useUpdateClinicalEntry()

  const [texto, setTexto] = useState('')
  /**
   * Nasce em HOJE, não em branco.
   *
   * A esmagadora maioria do que se anota aconteceu agora — deixar vazio fazia
   * o profissional preencher a data toda vez para registrar o óbvio. Continua
   * editável: a cirurgia de 2019 anotada hoje é digitada por cima.
   */
  const [dataIso, setDataIso] = useState(HOJE_ISO)
  const [parentesco, setParentesco] = useState('')
  const [aExcluir, setAExcluir] = useState<ClinicalEntry | null>(null)
  /** Anotação em edição e o texto em curso — null = ninguém editando. */
  const [editando, setEditando] = useState<ClinicalEntry | null>(null)
  const [textoEditado, setTextoEditado] = useState('')
  const [dataEditadaIso, setDataEditadaIso] = useState('')
  const [parentescoEditado, setParentescoEditado] = useState('')

  const secao = CLINICAL_SECTIONS.find(s => s.kind === kind)!
  const desta = entradas.filter(e => e.kind === kind)

  function salvar() {
    if (!texto.trim()) return
    anotar({
      patientId, appointmentId, kind, content: texto,
      eventDateIso: dataIso, relation: parentesco, professionalId,
    }, {
      onSuccess: () => {
        setTexto('')
        // Volta para HOJE, não para vazio: quem lança dois achados seguidos
        // está quase sempre no mesmo dia.
        setDataIso(HOJE_ISO)
        // O parentesco NÃO limpa: quem registra o histórico familiar costuma
        // lançar duas ou três coisas do mesmo parente em sequência.
        toast.success('Anotação registrada.')
      },
      onError: e => toast.error(errorMessage(e, 'Não foi possível registrar.')),
    })
  }

  const mostraFormulario = parte !== 'registros'
  const mostraRegistros = parte !== 'formulario'

  return (
    <>
      {mostraFormulario && (
      <>
      {/* A DATA no canto superior direito, na mesma linha do rótulo do campo.
          É a data do FATO, não a do registro: a cirurgia de 2019 anotada hoje
          tem as duas separadas por seis anos, e é a de 2019 que interessa.
          Fica no alto porque se confere antes de escrever — embaixo do
          textarea, quem digitava e clicava em Registrar nunca a via. */}
      <div className={styles.linhaAnotar}>
        <span className={styles.rotuloAnotar}>Anotar agora</span>
        {secao.campos?.data && (
          <Input
            type="date"
            size="sm"
            className={styles.campoData}
            value={dataIso}
            onChange={e => setDataIso(e.target.value)}
            aria-label="Quando aconteceu"
            title="Quando aconteceu — vem preenchido com hoje"
          />
        )}
      </div>
      <Textarea
        rows={5}
        placeholder={secao.placeholder}
        value={texto}
        onChange={e => setTexto(e.target.value)}
        aria-label="Anotar agora"
      />

      {/* Histórico familiar não tem data: a idade em que o pai infartou entra
          no próprio achado. O que ele tem é PARENTESCO — e o grau muda o peso
          do risco, por isso é campo e não texto solto. */}
      {secao.campos?.parentesco && (
        <Select
          label="Parentesco"
          options={[
            { value: '', label: 'Selecione…' },
            ...PARENTESCOS.map(p => ({ value: p, label: p })),
          ]}
          value={parentesco}
          onChange={e => setParentesco(e.target.value)}
        />
      )}
      <div className={styles.editorRodape}>
        <Button size="sm" loading={anotando} disabled={!texto.trim()} onClick={salvar}>
          Registrar
        </Button>
      </div>
      </>
      )}

      {mostraRegistros && (
      <>
      <div className={styles.centroCabecalho}>
        <h2 className={styles.blocoTitulo}>Registros anteriores</h2>
      </div>

      {desta.length === 0 ? (
        <p className={styles.vazio}>Nada registrado nesta seção ainda.</p>
      ) : (
        <ol className={styles.timeline}>
          {desta.map(e => (
            <li key={e.id} className={`${styles.marco} ${styles.marcoComAcoes}`}>
              {/* Texto e ações lado a lado: empilhados, os ícones ficavam
                  jogados embaixo de cada anotação e a lista perdia o alinhamento
                  de coluna. */}
              <div className={styles.marcoConteudo}>
                {/* SÓ A DATA DO FATO. O nome de quem anotou saiu da lista: numa
                    lista de antecedentes do próprio paciente, repetir o mesmo
                    profissional em toda linha é ruído sobre a informação.
                    A AUTORIA NÃO SE PERDE — `professional_id` continua gravado
                    na linha e no log de auditoria, que é o que o conselho
                    exige. */}
                {/* Parentesco no lugar da data quando a seção é familiar. */}
                {secao.campos?.parentesco ? (
                  e.relation && <span className={styles.marcoData}>{e.relation}</span>
                ) : (
                  <>
                    <span className={styles.marcoData}>{e.eventDate ?? e.date}</span>
                    {e.eventDate && e.eventDate !== e.date && (
                      <span className={styles.marcoAnotadoEm}>anotado em {e.date}</span>
                    )}
                  </>
                )}
                <span className={styles.marcoTexto}>{e.content}</span>
              </div>
              <div className={styles.entradaAcoes}>
                <Button
                  variant="ghost" size="sm" iconLeft={<IconEdit />}
                  aria-label="Editar anotação"
                  onClick={() => {
                  setEditando(e)
                  setTextoEditado(e.content)
                  setDataEditadaIso(e.eventDate ? e.eventDate.split('/').reverse().join('-') : '')
                  setParentescoEditado(e.relation ?? '')
                }}
                />
                <Button
                  variant="ghost" size="sm" iconLeft={<IconTrash />}
                  aria-label="Excluir anotação"
                  onClick={() => setAExcluir(e)}
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      </>
      )}

      <Modal
        open={editando !== null}
        onClose={() => setEditando(null)}
        title="Editar anotação"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditando(null)} disabled={alterando}>Cancelar</Button>
            <Button
              loading={alterando}
              disabled={!textoEditado.trim()}
              onClick={() => {
                if (!editando) return
                alterar({
                  id: editando.id, patientId, content: textoEditado,
                  eventDateIso: dataEditadaIso, relation: parentescoEditado,
                }, {
                  onSuccess: () => { toast.success('Anotação atualizada.'); setEditando(null) },
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
          <Textarea
            label={secao.label}
            rows={5}
            value={textoEditado}
            onChange={e => setTextoEditado(e.target.value)}
          />
          {secao.campos?.data && (
            <Input
              label="Quando aconteceu"
              type="date"
              value={dataEditadaIso}
              onChange={e => setDataEditadaIso(e.target.value)}
            />
          )}
          {secao.campos?.parentesco && (
            <Select
              label="Parentesco"
              options={[
                { value: '', label: 'Selecione…' },
                ...PARENTESCOS.map(p => ({ value: p, label: p })),
              ]}
              value={parentescoEditado}
              onChange={e => setParentescoEditado(e.target.value)}
            />
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={aExcluir !== null}
        onClose={() => setAExcluir(null)}
        onConfirm={() => {
          if (!aExcluir) return
          excluir({ id: aExcluir.id, patientId }, {
            onSuccess: () => toast.success('Anotação excluída.'),
            onError: e => toast.error(errorMessage(e, 'Não foi possível excluir.')),
          })
          setAExcluir(null)
        }}
        title="Excluir anotação?"
        message={`"${aExcluir?.content ?? ''}" sai do prontuário deste paciente. Se foi engano, apagar é o certo; se o quadro mudou, prefira editar — a versão anterior é o que explica a conduta anterior.`}
        variant="danger"
        confirmLabel="Excluir"
      />
    </>
  )
}
