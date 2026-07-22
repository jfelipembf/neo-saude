import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { useToast } from '@/components/Toast/useToast'
import { useSetTechnicalManager } from '@/hooks/useClinic'
import { userMessage } from '@/lib/errors'
import type { Professional } from '@/types/domain'
import styles from './AccountTab.module.scss'

interface TechnicalManagerModalProps {
  /** Profissionais ATIVOS da clínica — o banco recusa um RT inativo. */
  professionals: Professional[]
  /** RT atual, para já vir selecionado na troca. */
  current: Professional | null
  onClose: () => void
}

/**
 * Escolhe QUEM responde tecnicamente pela clínica.
 *
 * Não edita dados pessoais de propósito: o RT é um profissional marcado, e a
 * fonte única do cadastro dele é o perfil em Profissionais. Aqui só se troca a
 * marcação (RPC `set_technical_manager`, que desmarca o anterior na mesma
 * transação).
 */
export function TechnicalManagerModal({ professionals, current, onClose }: TechnicalManagerModalProps) {
  const toast = useToast()
  const { mutate: setManager, isPending: saving } = useSetTechnicalManager()

  const [professionalId, setProfessionalId] = useState(current?.id ?? '')
  const [error, setError] = useState('')

  const options = professionals.map(p => ({
    value: p.id,
    label: [p.name, p.license].filter(Boolean).join(' · '),
  }))

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!professionalId) {
      setError('Selecione o profissional responsável.')
      return
    }
    setManager(professionalId, {
      onSuccess: () => {
        toast.success('Responsável técnico definido!')
        onClose()
      },
      onError: error => toast.error(
        userMessage(error, 'Não foi possível definir o responsável técnico.'),
      ),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={current ? 'Trocar responsável técnico' : 'Definir responsável técnico'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="form-technical-manager" loading={saving}>Salvar</Button>
        </>
      }
    >
      <form id="form-technical-manager" className={styles.form} onSubmit={handleSave}>
        <Select
          label="Profissional responsável"
          options={options}
          placeholder="Selecione..."
          value={professionalId}
          onChange={e => { setProfessionalId(e.target.value); setError('') }}
          error={error}
        />
        <p className={styles.hint}>
          Só profissionais ativos podem responder pela clínica. Para corrigir
          nome, especialidade ou registro, edite o perfil em Profissionais.
        </p>
      </form>
    </Modal>
  )
}
