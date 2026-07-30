import { Fragment, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/Button/Button'
import { IconCheck } from '@/components/icons'
import { errorMessage } from '@/utils/errors'
import styles from './Wizard.module.scss'

export interface WizardStep {
  /** Identificador estável — vira a key da lista, não aparece na tela. */
  key: string
  /** Nome curto na trilha. */
  label: string
  conteudo: ReactNode
  /**
   * Barra o avanço devolvendo a mensagem de erro; devolver nada libera.
   * Fica no passo, e não no consumidor, para a regra de "o que falta preencher"
   * viver ao lado do campo que ela cobra.
   */
  validar?: () => string | null | undefined
  /**
   * Grava o passo. Presente, o botão principal nasce "Salvar" e só vira
   * "Avançar" DEPOIS de gravar — nunca as duas coisas no mesmo clique.
   *
   * Salvar e avançar juntos escondem a falha: quando a gravação dá erro, a
   * tela já trocou de etapa, e a pessoa segue achando que ficou registrado.
   * Separado, o botão só muda quando há o que confirmar.
   *
   * Ausente = o passo não tem o que gravar e o botão avança direto.
   */
  salvar?: () => Promise<void> | void
}

export interface WizardProps {
  passos: WizardStep[]
  onConcluir: () => void
  rotuloConcluir?: string
  /** Em andamento — trava os botões e mostra o carregando no de concluir. */
  concluindo?: boolean
  /** Erro vindo de fora (tipicamente a mensagem do servidor ao concluir). */
  erro?: string
}

/**
 * WIZARD — trilha de passos, validação por passo e navegação.
 *
 * Compartilhado: fica em Components/ porque mais de um caminho do atendimento
 * se faz em etapas, e cada um com trilha própria significaria vários desenhos
 * de "passo 2 de 4" para o mesmo gesto.
 *
 * O PASSO CORRENTE É ESTADO INTERNO. Controlado (`passo` + `onPasso`) seria mais
 * flexível e obrigaria todo consumidor a repetir o mesmo par de useState —
 * flexibilidade que ninguém pediu, em troca de repetição em todos.
 *
 * A validação NÃO é uma promessa: passo de wizard confere o que já está na
 * tela. Um `validar` assíncrono convidaria a chamar o servidor entre passos, que
 * é como se cria registro pela metade quando alguém fecha a aba no meio.
 */
export function Wizard({
  passos, onConcluir, rotuloConcluir = 'Concluir', concluindo, erro,
}: WizardProps) {
  const [passo, setPasso] = useState(0)
  const [erroPasso, setErroPasso] = useState('')
  // Quais passos já foram gravados. Por CHAVE e não por índice: inserir uma
  // etapa no meio da lista deslocaria os índices e marcaria como salvo o passo
  // errado.
  const [salvos, setSalvos] = useState<readonly string[]>([])
  const [salvando, setSalvando] = useState(false)

  // Passo fora da faixa (a lista encolheu entre renders) volta ao último
  // existente, em vez de renderizar `undefined` e derrubar a tela.
  const indice = Math.min(passo, passos.length - 1)
  const atual = passos[indice]
  const ultimo = indice === passos.length - 1
  const faltaSalvar = Boolean(atual.salvar) && !salvos.includes(atual.key)

  async function acaoPrincipal() {
    const problema = atual.validar?.()
    setErroPasso(problema ?? '')
    if (problema) return

    // PRIMEIRO CLIQUE grava e para por aqui; o segundo é que anda. O botão
    // muda de rótulo no meio, e é essa troca que confirma que gravou.
    if (faltaSalvar) {
      setSalvando(true)
      try {
        await atual.salvar?.()
        setSalvos(s => [...s, atual.key])
      } catch (e) {
        setErroPasso(errorMessage(e, 'Não foi possível salvar esta etapa.'))
      } finally {
        setSalvando(false)
      }
      return
    }

    if (ultimo) { onConcluir(); return }
    setPasso(indice + 1)
  }

  /** Volta para um passo já cumprido. Não valida: sair para trás é desistir do
   *  que se digitou aqui, não confirmá-lo. */
  function voltarPara(i: number) {
    setErroPasso('')
    setPasso(i)
  }

  const rotuloPrincipal = faltaSalvar
    ? 'Salvar'
    : ultimo ? rotuloConcluir : 'Avançar'

  return (
    <div className={styles.raiz}>
      {passos.length > 1 && (
        <div className={styles.trilha}>
          {passos.map((p, i) => {
            const feito = i < indice
            const classe = [
              styles.passo,
              i === indice ? styles.passoAtual : '',
              feito ? `${styles.passoFeito} ${styles.passoClicavel}` : '',
            ].filter(Boolean).join(' ')

            const bolinha = (
              <span className={styles.bolinha}>{feito ? <IconCheck /> : i + 1}</span>
            )

            return (
              <Fragment key={p.key}>
                {i > 0 && (
                  <span className={`${styles.fio} ${i <= indice ? styles.fioFeito : ''}`} />
                )}
                {feito ? (
                  <button type="button" className={classe} onClick={() => voltarPara(i)} disabled={concluindo}>
                    {bolinha}
                    {p.label}
                  </button>
                ) : (
                  <span className={classe} aria-current={i === indice ? 'step' : undefined}>
                    {bolinha}
                    {p.label}
                  </span>
                )}
              </Fragment>
            )
          })}
        </div>
      )}

      <div className={styles.conteudo}>{atual.conteudo}</div>

      {(erroPasso || erro) && <p className={styles.erro} role="alert">{erroPasso || erro}</p>}

      <div className={styles.rodape}>
        {indice > 0 && (
          <Button
            variant="ghost"
            onClick={() => voltarPara(indice - 1)}
            disabled={concluindo || salvando}
          >
            Voltar
          </Button>
        )}
        <div className={styles.rodapeFim}>
          {/* Passo já gravado ganha a marca — sem ela, "Avançar" sozinho não
              distingue "salvei agora" de "este passo não tinha o que salvar". */}
          {atual.salvar && !faltaSalvar && (
            <span className={styles.salvo}><IconCheck /> Salvo</span>
          )}
          <Button
            onClick={acaoPrincipal}
            loading={salvando || (ultimo && !faltaSalvar ? concluindo : undefined)}
          >
            {rotuloPrincipal}
          </Button>
        </div>
      </div>
    </div>
  )
}
