import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { toIsoDate } from '@/utils/date'
import styles from './NewTreatmentModal.module.scss'

export interface NovoTratamento {
  titulo: string
  inicioIso: string
  sessoes?: number
}

interface NewTreatmentModalProps {
  open: boolean
  onClose: () => void
  onCriar: (dados: NovoTratamento) => void
}

/**
 * NOVO TRATAMENTO — só a abertura.
 *
 * O modal pergunta o mínimo para o tratamento existir e sai de cena. O roteiro
 * de etapas (diagnóstico, anamnese, testes) acontece DEPOIS, na tela, e não
 * aqui dentro: etapa de tratamento é trabalho de sessão, com painéis e
 * histórico ao lado — dentro de um modal ela ficaria espremida e sem contexto,
 * e fechar sem querer custaria o caminho andado.
 */
export function NewTreatmentModal({ open, onClose, onCriar }: NewTreatmentModalProps) {
  const [titulo, setTitulo] = useState('')
  const [inicio, setInicio] = useState(toIsoDate(new Date()))
  const [sessoes, setSessoes] = useState('')
  const [erro, setErro] = useState('')

  function criar() {
    if (!titulo.trim()) { setErro('Dê um título ao tratamento.'); return }
    if (!inicio) { setErro('Informe a data de início.'); return }
    const n = sessoes.trim() ? Number(sessoes.trim()) : undefined
    if (n != null && (!Number.isInteger(n) || n < 1)) {
      setErro('Número de sessões precisa ser um inteiro maior que zero.')
      return
    }
    setErro('')
    onCriar({ titulo: titulo.trim(), inicioIso: inicio, sessoes: n })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo tratamento"
      size="sm"
      footer={
        <div className={styles.rodape}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={criar}>Iniciar tratamento</Button>
        </div>
      }
    >
      <div className={styles.campos}>
        <div className={styles.campoLargo}>
          <Input
            label="Título do tratamento"
            placeholder="Ex.: Reabilitação de joelho pós-cirúrgica"
            value={titulo}
            onChange={e => { setTitulo(e.target.value); setErro('') }}
            autoFocus
          />
        </div>

        {/* A data vem preenchida com hoje e é editável: tratamento lançado
            depois do fato é a regra, não a exceção — o fisioterapeuta cadastra
            na segunda o que começou na sexta. */}
        <Input
          label="Data de início"
          type="date"
          value={inicio}
          onChange={e => { setInicio(e.target.value); setErro('') }}
        />
        <Input
          label="Número de sessões"
          hint="opcional"
          inputMode="numeric"
          placeholder="Ex.: 10"
          value={sessoes}
          onChange={e => { setSessoes(e.target.value); setErro('') }}
        />
      </div>

      {erro && <p className={styles.erro} role="alert">{erro}</p>}
    </Modal>
  )
}
