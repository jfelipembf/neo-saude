import { useState } from 'react'
import OdontogramShell from '@/lib/odontogramShell/odontogram-shell'
import '@/lib/odontogramShell/odontogram-shell.css'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Spinner } from '@/components/Spinner/Spinner'
import { useTratamentosDoPaciente } from '@/hooks/useTratamentos'
import { useTheme } from '@/context/ThemeProvider'
import { IconMais } from '@/components/icons'
import type { OdontogramThemeConfig } from '@/lib/odontogramShell/odontogram-shell'
import type { Tratamento } from '@/types/domain'
import { TreatmentFormModal } from './TreatmentFormModal'
import styles from './TreatmentsPanel.module.scss'

interface TreatmentsPanelProps {
  pacienteId: string
}

const columns: TableColumn<Tratamento>[] = [
  { key: 'data',         label: 'Data' },
  { key: 'dente',        label: 'Dente', render: t => <span className={styles.dentePill}>Dente {t.dente}</span> },
  { key: 'procedimento', label: 'Procedimento' },
  { key: 'status',       label: 'Situação', render: t => <Badge status={t.status} /> },
  { key: 'observacao',   label: 'Observação', render: t => <>{t.observacao ?? '—'}</> },
]

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

/** Aba "Tratamento": odontograma da biblioteca embutido no nosso cartão + histórico. */
export function TreatmentsPanel({ pacienteId }: TreatmentsPanelProps) {
  const { data: tratamentos, isLoading } = useTratamentosDoPaciente(pacienteId)
  const { theme } = useTheme()
  const escuro = theme === 'dark'

  // Modal de tratamento (nosso formulário — alimenta o histórico do paciente).
  const [modalAberto, setModalAberto] = useState(false)

  const lista = tratamentos ?? []

  if (isLoading) {
    return <div className={styles.carregando}><Spinner size="lg" /></div>
  }

  return (
    <div className={styles.painel}>
      <section className={styles.chartCard}>
        <header className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Odontograma</h2>
          <p className={styles.chartHint}>Ficha odontológica do paciente.</p>
        </header>

        {/* OdontogramShell (React-Odontogram-Modul, MIT) importado como componente:
            idioma travado em pt-br, tema controlado pelo nosso ThemeProvider e a
            topbar interna escondida via CSS — só a ficha aparece, dentro do nosso
            cartão. A classe global 'dark' ativa as regras escuras do CSS dele. */}
        <div className={`${styles.shell} ${escuro ? 'dark' : ''}`}>
          <OdontogramShell
            language="pt-br"
            darkMode={escuro}
            enableNotes
            themeConfig={escuro ? TEMA_ESCURO : TEMA_CLARO}
          />
        </div>
      </section>

      <section className={styles.historico}>
        <header className={styles.historicoHeader}>
          <h2 className={styles.chartTitle}>Histórico de tratamentos</h2>
          <Button size="sm" iconLeft={<IconMais />} onClick={() => setModalAberto(true)}>
            Registrar tratamento
          </Button>
        </header>
        <Table
          columns={columns}
          data={lista}
          rowKey={t => t.id}
          emptyMessage="Nenhum tratamento registrado."
        />
      </section>

      {/* Monta só quando aberto — formulário nasce limpo com a data de hoje. */}
      {modalAberto && (
        <TreatmentFormModal
          pacienteId={pacienteId}
          onClose={() => setModalAberto(false)}
        />
      )}
    </div>
  )
}
