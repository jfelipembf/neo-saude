import { useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { Button } from '@/components/Button/Button'
import { IconCamera, IconCheck, IconClock, IconPrint, IconUser } from '@/components/icons'
import { useToast } from '@/components/Toast/Toast'
import { uploadImage } from '@/lib/storage'
import type { CarePlan } from '@/services/carePlansService'
import styles from './CarePlanCard.module.scss'

interface CarePlanCardProps {
  plano: CarePlan
  /** Ausente = cartão só de leitura (plano já encerrado). */
  onFinalizar?: () => void
  /** Ausente = foto não é editável (ex.: cartão de plano encerrado). */
  onTrocarFoto?: (url: string) => void
  /**
   * Gera o relatório de evolução deste tratamento.
   *
   * Diferente das outras ações, existe TAMBÉM no plano encerrado — é
   * justamente do tratamento que terminou que se pede o relatório, para a alta,
   * o convênio ou a próxima etapa do caso.
   */
  onGerarRelatorio?: () => void
  /** Este cartão está gerando agora — o estado é por tratamento, e não da
   *  lista, senão a espera de um travaria todos. */
  gerandoRelatorio?: boolean
}

/**
 * CARTÃO DO TRATAMENTO — foto, diagnóstico, início e quantas sessões saíram.
 *
 * Mesmo desenho do cartão de resultado de teste (foto no topo, selo sobreposto,
 * dados embaixo): são a mesma leitura, e dois desenhos para a mesma leitura
 * fazem reaprender a tela a cada painel.
 *
 * A barra de progresso é o que responde à pergunta que o paciente faz toda
 * sessão ("faltam quantas?"). Ela só aparece quando há previsão fechada: sem
 * total, uma barra teria de inventar um denominador, e barra cheia em tratamento
 * sem fim marcado mentiria.
 *
 * A contagem vem da AGENDA (consultas concluídas), não de um contador no plano
 * — contador diverge na primeira sessão cancelada e ninguém percebe.
 */
export function CarePlanCard({
  plano, onFinalizar, onTrocarFoto, onGerarRelatorio, gerandoRelatorio,
}: CarePlanCardProps) {
  const toast = useToast()
  const [enviando, setEnviando] = useState(false)
  const encerrado = plano.status !== 'active'
  const previstas = plano.sessoesPrevistas
  // Teto em 100: passar do previsto é comum, e barra estourando o trilho lê
  // como erro de render, não como "fez mais sessões".
  const pct = previstas && previstas > 0
    ? Math.min(100, Math.round((plano.sessoesRealizadas / previstas) * 100))
    : null

  async function escolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Limpa antes de qualquer await: permite reescolher o MESMO arquivo depois,
    // que é o caso de quem tirou a foto errada e corrigiu o enquadramento.
    e.target.value = ''
    if (!file || !onTrocarFoto) return

    setEnviando(true)
    try {
      onTrocarFoto(await uploadImage(file, 'care-plans'))
    } catch {
      toast.error('Não foi possível enviar a foto.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <article className={`${styles.cartao} ${encerrado ? styles.cartaoEncerrado : ''}`}>
      <div className={styles.foto}>
        {plano.foto
          ? <img src={plano.foto} alt="" className={styles.fotoImg} />
          : <span className={styles.fotoVazia}><IconUser /></span>}

        {/* Botão redondo flutuante no canto, igual ao de editar/excluir do
            cartão de resultado. Só aparece enquanto o tratamento está aberto —
            depois da alta a foto é registro, não campo. */}
        {onTrocarFoto && !encerrado && (
          <label
            className={`${styles.fotoBtn} ${enviando ? styles.fotoBtnEnviando : ''}`}
            title={plano.foto ? 'Trocar foto do tratamento' : 'Adicionar foto do tratamento'}
          >
            <IconCamera />
            <input
              type="file"
              accept="image/*"
              className={styles.fotoInput}
              onChange={escolherFoto}
              disabled={enviando}
            />
          </label>
        )}

        <span className={`${styles.selo} ${encerrado ? styles.seloEncerrado : ''}`}>
          {encerrado ? <><IconCheck /> Encerrado</> : <><IconClock /> Em andamento</>}
        </span>
      </div>

      <div className={styles.corpo}>
        {/* Título primeiro: é o que identifica o caso. Sem ele (planos
            anteriores ao campo), o diagnóstico assume o papel. */}
        <h3 className={styles.titulo}>
          {plano.titulo ?? plano.diagnosticos[0] ?? 'Tratamento'}
        </h3>

        {/* O diagnóstico vem do prontuário do paciente, não de uma cópia no
            plano — é o mesmo registro que a tela de atendimento mostra. */}
        {plano.diagnosticos.length > 0 ? (
          <ul className={styles.diagnosticos}>
            {plano.diagnosticos.map((d, i) => <li key={`${d}-${i}`}>{d}</li>)}
          </ul>
        ) : (
          <p className={styles.semDiagnostico}>Sem diagnóstico registrado.</p>
        )}

        <span className={styles.sessoes}>
          <strong>{plano.sessoesRealizadas}</strong>
          {previstas != null && <> de <strong>{previstas}</strong></>}
          {' '}sessõe{plano.sessoesRealizadas === 1 && previstas == null ? 'm' : 's'} realizada
          {plano.sessoesRealizadas === 1 ? '' : 's'}
        </span>

        {/* SEMPRE no DOM, mesmo sem nada agendado: é uma linha a menos ou a
            mais que desalinharia a barra e os botões deste cartão em relação
            aos vizinhos. Vazio, o `:empty` do CSS reserva a altura da linha
            (e some no celular, onde há um cartão por linha e nada a alinhar). */}
        <span className={styles.agendadas}>
          {plano.sessoesAgendadas > 0
            && `${plano.sessoesAgendadas} agendada${plano.sessoesAgendadas === 1 ? '' : 's'}`}
        </span>

        {pct != null ? (
          <div
            className={styles.trilho}
            role="progressbar"
            aria-valuenow={plano.sessoesRealizadas}
            aria-valuemin={0}
            aria-valuemax={previstas}
            aria-label="Sessões realizadas"
          >
            <span className={styles.progresso} style={{ '--pct': `${pct}%` } as CSSProperties} />
          </div>
        ) : (
          // Tratamento CONTÍNUO (sem previsão) não tem barra — mas guarda a
          // altura dela. Um trilho vazio de verdade leria como "0% feito", que
          // é uma afirmação errada sobre um tratamento sem fim marcado.
          <span className={styles.trilhoAusente} aria-hidden="true" />
        )}

        <span className={styles.datas}>
          Início {plano.inicio}
          {plano.fim && ` · Alta ${plano.fim}`}
        </span>

        <span className={styles.profissional}>{plano.profissional}</span>

        {(onGerarRelatorio || (!encerrado && onFinalizar)) && (
          <div className={styles.acao}>
            {/* NÃO HÁ "Continuar": o roteiro de abertura é feito UMA vez, logo
                depois de criar o tratamento. Reabri-lo a partir do cartão
                convidava a refazer diagnóstico e anamnese de um caso em
                andamento — o trabalho de sessão é nas seções do menu, não no
                roteiro. Finalizar (alta) fica em outline: sempre visível,
                nunca em destaque. */}
            {!encerrado && onFinalizar && (
              <Button variant="outline" size="sm" onClick={onFinalizar}>Finalizar</Button>
            )}
            {/* Em ghost e por último: o relatório é consulta, não conduta. E é
                a única ação que sobrevive ao encerramento do tratamento. */}
            {onGerarRelatorio && (
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconPrint />}
                loading={gerandoRelatorio}
                onClick={onGerarRelatorio}
              >
                Relatório
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
