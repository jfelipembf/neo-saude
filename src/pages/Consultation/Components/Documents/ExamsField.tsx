import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { IconPlus, IconTrash } from '@/components/icons'
import styles from './Documents.module.scss'

interface ExamsFieldProps {
  value: string[]
  onChange: (exames: string[]) => void
}

/**
 * Os mais pedidos no ambulatório, para um clique em vez de digitar.
 *
 * É atalho, não catálogo: quem precisa de algo fora daqui digita. Uma lista
 * longa viraria rolagem e perderia a função — o valor está justamente em serem
 * poucos e os certos.
 */
const FREQUENTES = [
  'Hemograma completo',
  'Glicemia de jejum',
  'Colesterol total e frações',
  'Triglicerídeos',
  'TSH',
  'Creatinina',
  'Ureia',
  'TGO / TGP',
  'Urina tipo I (EAS)',
  'Raio-X de tórax',
  'Eletrocardiograma',
  'Ultrassonografia de abdome total',
]

/**
 * OS EXAMES DA SOLICITAÇÃO — vários, um a um.
 *
 * Mesmo desenho da lista de medicamentos: o pedido de exame quase nunca é de um
 * item só, e um textarea "um por linha" transfere para o médico a tarefa de
 * formatar o que o papel vai imprimir.
 */
export function ExamsField({ value, onChange }: ExamsFieldProps) {
  const [novo, setNovo] = useState('')

  function adicionar(nome: string) {
    const limpo = nome.trim()
    // Repetido não entra: o mesmo exame duas vezes na guia é devolução certa
    // no laboratório, e o clique duplo no atalho é fácil de acontecer.
    if (!limpo || value.some(e => e.toLowerCase() === limpo.toLowerCase())) return
    onChange([...value, limpo])
    setNovo('')
  }

  const disponiveis = FREQUENTES.filter(
    f => !value.some(e => e.toLowerCase() === f.toLowerCase()),
  )

  return (
    <div className={styles.medicamentos}>
      {value.length > 0 && (
        <ol className={styles.medLista}>
          {value.map((e, i) => (
            <li key={`${e}-${i}`} className={styles.medItem}>
              <span className={styles.medTexto}>{e}</span>
              <Button
                variant="ghost" size="sm" iconLeft={<IconTrash />}
                aria-label={`Remover ${e}`}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              />
            </li>
          ))}
        </ol>
      )}

      <div className={styles.medForm}>
        <Input
          label="Exame"
          placeholder="Ex.: Hemograma completo"
          value={novo}
          onChange={e => setNovo(e.target.value)}
          // Enter adiciona: pedido de exame é uma sequência, e tirar a mão do
          // teclado a cada item é o que faz o médico voltar para o papel.
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionar(novo) } }}
        />
        {/* Verde escuro do tema, igual aos botões da barra de seções: é a ação
            principal do formulário, e `outline` a deixava com o mesmo peso
            visual dos atalhos logo abaixo. */}
        <Button
          size="sm" iconLeft={<IconPlus />}
          className={styles.botaoVerde}
          disabled={!novo.trim()}
          onClick={() => adicionar(novo)}
        >
          Adicionar exame
        </Button>

        {disponiveis.length > 0 && (
          <>
            <span className={styles.atalhoRotulo}>Mais pedidos</span>
            <div className={styles.atalhos}>
              {disponiveis.map(f => (
                <button key={f} type="button" className={styles.atalho} onClick={() => adicionar(f)}>
                  {f}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
