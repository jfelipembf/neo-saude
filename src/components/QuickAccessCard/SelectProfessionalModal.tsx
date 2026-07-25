import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { Select } from '@/components/Select/Select'
import { useProfessionals } from '@/hooks/useProfessionals'
import { buildRoute } from '@/constants'

interface SelectProfessionalModalProps {
  open: boolean
  onClose: () => void
  /** Query string acrescentada ao perfil do profissional (aba/sub-aba já
   *  abertas) — cada atalho do QuickAccessCard que passa por aqui define a sua. */
  targetQuery: string
}

/** Escolhe UM profissional e vai direto ao perfil dele, já na aba pedida por
 *  `targetQuery` — usado pelos atalhos do QuickAccessCard que dependem de
 *  "qual profissional" antes de navegar. */
export function SelectProfessionalModal({ open, onClose, targetQuery }: SelectProfessionalModalProps) {
  const navigate = useNavigate()
  const { data: professionals = [] } = useProfessionals()
  const [professionalId, setProfessionalId] = useState('')

  function handleClose() {
    onClose()
    setProfessionalId('')
  }

  function handleConfirm() {
    if (!professionalId) return
    navigate(`${buildRoute.professionalProfile(professionalId)}${targetQuery}`)
    handleClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Selecionar profissional"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!professionalId}>Abrir</Button>
        </>
      }
    >
      <Select
        label="Profissional"
        placeholder="Selecione…"
        value={professionalId}
        onChange={e => setProfessionalId(e.target.value)}
        options={professionals.map(p => ({ value: p.id, label: p.name }))}
        aria-label="Selecionar profissional"
      />
    </Modal>
  )
}
