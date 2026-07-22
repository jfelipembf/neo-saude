import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { IconEditar, IconImprimir, IconDocumento } from '@/components/icons'
import { useAnamneseDoPaciente } from '@/hooks/useAnamneses'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { esc } from '@/utils/printDocument'
import type { Anamnesis } from '@/types/domain'
import { AnamnesisForm } from './AnamnesisForm'
import { SECOES_ANAMNESE, rotuloDaResposta, ehAlerta } from './questions'
import styles from './Anamnesis.module.scss'

/** Miolo impresso da ficha — mesma ordem das perguntas da tela. */
function corpoAnamnese(ficha: Anamnesis, pacienteNome?: string) {
  const secoes = SECOES_ANAMNESE.map(secao => {
    const linhas = secao.perguntas.map(p => {
      const valor = ficha[p.campo]
      const resposta = p.tipo === 'opcoes' ? rotuloDaResposta(p, valor) : (valor || '—')
      const detalhe = p.detalhe ? ficha[p.detalhe.campo] : undefined
      return `<tr><td>${esc(p.pergunta)}</td><td><strong>${esc(resposta)}</strong>${
        detalhe ? `<br><small>${esc(p.detalhe!.label)}: ${esc(detalhe)}</small>` : ''
      }</td></tr>`
    }).join('')
    return `<h2 class="secao">${esc(secao.titulo)}</h2><table>${linhas}</table>`
  }).join('')

  return `
    ${pacienteNome ? `<p><strong>Paciente:</strong> ${esc(pacienteNome)}</p>` : ''}
    <p><strong>Atualizada em:</strong> ${esc(ficha.atualizadaEm)}</p>
    ${secoes}
    <p class="clausula">Declaro para os devidos fins que as informações acima prestadas são verdadeiras.</p>
    <div class="assinaturas"><span>Paciente ou responsável legal</span><span>Cirurgião-dentista</span></div>`
}

const ESTILOS_ANAMNESE = `
  .secao { font-size: 13px; margin: 18px 0 4px; text-transform: uppercase;
           letter-spacing: 0.05em; color: #334; }
  td:first-child { width: 58%; }
`

interface AnamnesisTabProps {
  pacienteId: string
  pacienteNome?: string
}

/** Aba "Anamnese": questionário de saúde do paciente (modelo do CRO). */
export function AnamnesisTab({ pacienteId, pacienteNome }: AnamnesisTabProps) {
  const { data: ficha, isLoading } = useAnamneseDoPaciente(pacienteId)
  const imprimir = usePrintDocument()
  const [editando, setEditando] = useState(false)

  if (isLoading) return <PageLoader />

  if (editando) {
    return (
      <AnamnesisForm
        pacienteId={pacienteId}
        ficha={ficha ?? null}
        onFechar={() => setEditando(false)}
      />
    )
  }

  if (!ficha) {
    return (
      <EmptyState
        icon={<IconDocumento />}
        title="Anamnese ainda não preenchida"
        description="Registre o questionário de saúde antes do primeiro atendimento — alergias, medicamentos e condições que mudam a conduta clínica."
        action={
          <Button iconLeft={<IconEditar />} onClick={() => setEditando(true)}>
            Preencher anamnese
          </Button>
        }
      />
    )
  }

  return (
    <section className={styles.card} aria-label="Anamnese do paciente">
      <div className={styles.head}>
        <div>
          <h2 className={styles.titulo}>Anamnese</h2>
          <span className={styles.atualizada}>Atualizada em {ficha.atualizadaEm}</span>
        </div>
        <div className={styles.acoes}>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconImprimir />}
            onClick={() => imprimir({
              titulo: 'Ficha de anamnese',
              subtitulo: pacienteNome,
              corpo: corpoAnamnese(ficha, pacienteNome),
              estilos: ESTILOS_ANAMNESE,
            })}
          >
            Imprimir
          </Button>
          <Button variant="outline" size="sm" iconLeft={<IconEditar />} onClick={() => setEditando(true)}>
            Editar
          </Button>
        </div>
      </div>

      {SECOES_ANAMNESE.map(secao => (
        <section key={secao.titulo} className={styles.secao}>
          <h3 className={styles.secaoTitulo}>{secao.titulo}</h3>

          <dl className={styles.respostas}>
            {secao.perguntas.map(p => {
              const valor = ficha[p.campo]
              const detalhe = p.detalhe ? ficha[p.detalhe.campo] : undefined
              const alerta = p.tipo === 'opcoes' && ehAlerta(p.campo, valor)
              const aberta = p.tipo !== 'opcoes'

              return (
                <div key={p.campo} className={`${styles.resposta} ${aberta ? styles['resposta--aberta'] : ''}`}>
                  <dt>{p.pergunta}</dt>
                  <dd className={alerta ? styles.alerta : undefined}>
                    {p.tipo === 'opcoes' ? rotuloDaResposta(p, valor) : (valor || '—')}
                    {detalhe && <span className={styles.detalhe}>{p.detalhe!.label}: {detalhe}</span>}
                  </dd>
                </div>
              )
            })}
          </dl>
        </section>
      ))}
    </section>
  )
}
