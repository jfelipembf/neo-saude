import { useRef, useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Tabs } from '@/components/Tabs/Tabs'
import { useToast } from '@/components/Toast/Toast'
import { IconDocument, IconEye, IconPlus, IconTrash } from '@/components/icons'
import { usePatientDocuments, useDeleteDocument, useUploadDocument } from '@/hooks/useDocuments'
import { errorMessage } from '@/utils/errors'
import { DOCUMENT_CATEGORIES } from '@/constants/documentCategories'
import type { PatientDocument, PatientDocumentCategory } from '@/types/domain'
import styles from './ConsultationPage.module.scss'


interface PhysioDocumentsPanelProps {
  patientId: string
  appointmentId: string
}

/**
 * DOCUMENTOS DO PACIENTE, na fisioterapia — um arquivo, não uma emissora.
 *
 * O fisioterapeuta NÃO emite atestado nem solicita exame: quem faz isso é o
 * médico. O que ele tem é o que o paciente TRAZ — o atestado que justificou o
 * afastamento, a ressonância que explica a dor, o encaminhamento que pediu a
 * fisioterapia. Por isso aqui não há "Emitir": há arquivar, ver e apagar.
 *
 * As divisões são ABAS porque a pergunta no meio do atendimento é sempre por
 * TIPO ("cadê a ressonância dele?"), nunca por nome de arquivo — e o contador
 * em cada aba responde "tem alguma coisa aí?" sem precisar entrar.
 */
export function PhysioDocumentsPanel({ patientId, appointmentId }: PhysioDocumentsPanelProps) {
  const toast = useToast()
  const { data: documentos } = usePatientDocuments(patientId)
  const { mutate: enviar, isPending: enviando } = useUploadDocument()
  const { mutate: apagar } = useDeleteDocument()

  const arquivoRef = useRef<HTMLInputElement>(null)
  /** Divisão aberta. O arquivo anexado nasce classificado NELA — anexar dentro
   *  de "Exames" e o documento cair em "Outros" seria trabalho refeito. */
  const [divisao, setDivisao] = useState<PatientDocumentCategory>('certificate')
  const [aExcluir, setAExcluir] = useState<PatientDocument | null>(null)

  const lista = documentos ?? []
  const atual = DOCUMENT_CATEGORIES.find(d => d.key === divisao)!
  const daDivisao = lista.filter(doc => doc.category === divisao)

  function anexar(file: File) {
    enviar({
      patientId,
      appointmentId,
      category: divisao,
      // Nome sem a extensão: ela já aparece ao lado, e repetir ".pdf" no
      // título polui a lista.
      name: file.name.replace(/\.[^.]+$/, ''),
      file,
    }, {
      onSuccess: () => toast.success('Documento arquivado.'),
      onError: e => toast.error(errorMessage(e, 'Não foi possível enviar o documento.')),
    })
  }

  return (
    <>
      {/* ABAS e não quatro pilhas empilhadas: com o acervo cheio, as
          divisões de baixo nasciam fora da tela — e o contador em cada aba diz
          o que tem em cada uma sem precisar entrar. */}
      <Tabs
        tabs={DOCUMENT_CATEGORIES.map(d => ({
          key: d.key,
          label: d.label,
          // Zero não renderiza badge (regra do componente), o que aqui é o
          // certo: divisão vazia não deve chamar atenção.
          badge: lista.filter(doc => doc.category === d.key).length,
        }))}
        active={divisao}
        onChange={k => setDivisao(k as PatientDocumentCategory)}
        size="sm"
      />

      <div className={styles.centroCabecalho}>
        <h3 className={styles.blocoTitulo}>{atual.label}</h3>
        <Button
          size="sm" variant="outline" iconLeft={<IconPlus />}
          loading={enviando}
          onClick={() => arquivoRef.current?.click()}
        >
          Anexar
        </Button>
      </div>

      {daDivisao.length === 0 ? (
        <p className={styles.vazio}>{atual.vazio}</p>
      ) : (
        <ul className={styles.documentos}>
          {daDivisao.map(doc => (
            <li key={doc.id} className={styles.documento}>
              <div className={styles.documentoLinha}>
                <IconDocument />
                <span className={styles.documentoNome}>{doc.name}</span>
                <span className={styles.documentoData}>{doc.type} · {doc.uploadedAt}</span>
              </div>
              <div className={styles.documentoAcoes}>
                {doc.url && (
                  <Button
                    size="sm" variant="outline" iconLeft={<IconEye />}
                    onClick={() => window.open(doc.url, '_blank', 'noopener,noreferrer')}
                  >
                    Ver
                  </Button>
                )}
                <Button
                  variant="ghost" size="sm" iconLeft={<IconTrash />}
                  aria-label={`Excluir ${doc.name}`}
                  onClick={() => setAExcluir(doc)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Fora do bloco condicional da lista: escondê-lo junto com um estado
          vazio tiraria o alvo do `click()` do ar. */}
      <input
        ref={arquivoRef}
        type="file"
        accept="image/*,application/pdf"
        className={styles.arquivoInput}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) anexar(file)
          // Zera para o mesmo arquivo poder ser escolhido de novo depois de um
          // erro — sem isto o `change` não dispara na segunda tentativa.
          e.target.value = ''
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      <ConfirmDialog
        open={aExcluir !== null}
        onClose={() => setAExcluir(null)}
        onConfirm={() => {
          if (!aExcluir) return
          apagar(aExcluir.id, {
            onSuccess: () => toast.success('Documento excluído.'),
            onError: e => toast.error(errorMessage(e, 'Não foi possível excluir.')),
          })
          setAExcluir(null)
        }}
        title="Excluir documento?"
        message={`"${aExcluir?.name ?? ''}" sai do prontuário deste paciente. O arquivo não volta — se for o único exemplar, peça outro antes.`}
        variant="danger"
        confirmLabel="Excluir"
      />
    </>
  )
}
