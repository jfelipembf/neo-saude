import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useToast } from '@/components/Toast/useToast'
import { IconDocument, IconPlus } from '@/components/icons'
import { useImportPatients } from '@/hooks/usePatientImport'
import { parsePatientSheet, downloadPatientTemplate } from '@/services/patientImportService'
import type { ParsedImport, PatientImportRow } from '@/services/patientImportService'
import { userMessage } from '@/lib/errors'
import styles from './ImportTab.module.scss'

const PREVIEW_ROWS = 8

/**
 * Aba "Importar pacientes": sobe uma planilha (.xlsx/.csv) com os pacientes de
 * outra plataforma, mostra a prévia (válidos × com problema) e importa. O modelo
 * de exemplo mostra as colunas esperadas.
 */
export function ImportTab() {
  const toast = useToast()
  const { mutate: importPatients, isPending: importing } = useImportPatients()
  const inputRef = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState('')
  const [parsing, setParsing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [parsed, setParsed] = useState<ParsedImport | null>(null)

  async function baixarModelo() {
    setDownloading(true)
    try {
      await downloadPatientTemplate()
    } catch (e) {
      toast.error(userMessage(e, 'Não foi possível gerar o modelo.'))
    } finally {
      setDownloading(false)
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reescolher o mesmo arquivo depois
    if (!file) return
    setFileName(file.name)
    setParsed(null)
    setParsing(true)
    try {
      setParsed(await parsePatientSheet(file))
    } catch (err) {
      toast.error(userMessage(err, 'Não foi possível ler a planilha. Confira o formato (.xlsx ou .csv).'))
      setFileName('')
    } finally {
      setParsing(false)
    }
  }

  function importar() {
    if (!parsed?.valid.length) return
    importPatients(parsed.valid, {
      onSuccess: n => {
        toast.success(n === 1 ? '1 paciente importado!' : `${n} pacientes importados!`)
        setParsed(null)
        setFileName('')
      },
      onError: e => toast.error(userMessage(e, 'Não foi possível importar os pacientes.')),
    })
  }

  const validColumns: TableColumn<PatientImportRow>[] = [
    { key: 'name', label: 'Nome', render: r => r.name },
    { key: 'phone', label: 'Telefone', render: r => r.phone },
    { key: 'cpf', label: 'CPF', render: r => r.cpf ?? '—' },
    { key: 'email', label: 'E-mail', render: r => r.email ?? '—' },
    { key: 'city', label: 'Cidade', render: r => r.city ?? '—' },
  ]

  return (
    <div className={styles.painel}>
      <header className={styles.cabecalho}>
        <h2 className={styles.titulo}>Importar pacientes</h2>
        <p className={styles.hint}>
          Traga seus pacientes de outra plataforma numa planilha. Baixe o modelo para ver as colunas
          esperadas, preencha (ou cole sua lista) e envie o arquivo <strong>.xlsx</strong> ou <strong>.csv</strong>.
          Obrigatórios: <strong>nome</strong> e <strong>telefone</strong> (com DDD).
        </p>
      </header>

      <div className={styles.passos}>
        <Button variant="outline" iconLeft={<IconDocument />} loading={downloading} onClick={baixarModelo}>
          Baixar modelo (.xlsx)
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className={styles.inputFile}
          onChange={onFile}
        />
        <Button iconLeft={<IconPlus />} loading={parsing} onClick={() => inputRef.current?.click()}>
          Escolher planilha
        </Button>
        {fileName && <span className={styles.arquivo}>{fileName}</span>}
      </div>

      {parsed && (
        <div className={styles.resultado}>
          <div className={styles.resumo}>
            <span className={styles.badgeOk}>{parsed.valid.length} prontos para importar</span>
            {parsed.invalid.length > 0 && (
              <span className={styles.badgeErro}>{parsed.invalid.length} com problema</span>
            )}
          </div>

          {parsed.valid.length > 0 && (
            <Table
              columns={validColumns}
              data={parsed.valid.slice(0, PREVIEW_ROWS)}
              rowKey={r => `${r.phone}·${r.name}`}
              emptyMessage="—"
              footer={
                parsed.valid.length > PREVIEW_ROWS
                  ? <span className={styles.maisLinhas}>e mais {parsed.valid.length - PREVIEW_ROWS} paciente(s)…</span>
                  : undefined
              }
            />
          )}

          {parsed.invalid.length > 0 && (
            <div className={styles.problemas}>
              <span className={styles.problemasTitulo}>Linhas ignoradas</span>
              <ul className={styles.problemasLista}>
                {parsed.invalid.slice(0, 10).map((r, i) => (
                  <li key={i}>
                    <strong>Linha {r.line}</strong> — {r.name}: {r.reason}
                  </li>
                ))}
              </ul>
              {parsed.invalid.length > 10 && (
                <span className={styles.maisLinhas}>e mais {parsed.invalid.length - 10}…</span>
              )}
            </div>
          )}

          <div className={styles.acoes}>
            <Button loading={importing} disabled={parsed.valid.length === 0} onClick={importar}>
              Importar {parsed.valid.length} paciente(s)
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
