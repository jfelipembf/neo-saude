import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { useAutomacoes, useSalvarAutomacao } from '@/hooks/useWhatsApp'
import { useConexaoWhatsApp } from '@/hooks/useWhatsApp'
import type { WhatsAppAutomation } from '@/types/domain'
import { CATALOGO_AUTOMACOES, VARIAVEIS_COMUNS } from './automations'
import type { CatalogoAutomacao } from './automations'
import styles from './AutomationTab.module.scss'

/** Aba "Automação": mensagens disparadas por evento no WhatsApp conectado. */
export function AutomationTab() {
  const { data: automacoes, isLoading } = useAutomacoes()
  const { data: conexao } = useConexaoWhatsApp()

  if (isLoading || !automacoes) return <PageLoader />

  const desconectado = conexao?.status !== 'conectado'

  return (
    <div className={styles.coluna}>
      {/* Automação sem número pareado não sai do lugar — avisa antes. */}
      {desconectado && (
        <p className={styles.aviso}>
          O WhatsApp não está conectado. As automações ficam salvas, mas só passam a
          enviar depois do pareamento na aba <strong>WhatsApp</strong>.
        </p>
      )}

      {CATALOGO_AUTOMACOES.map(item => {
        const atual = automacoes.find(a => a.gatilho === item.gatilho)
        if (!atual) return null
        return <CartaoAutomacao key={item.gatilho} catalogo={item} automacao={atual} />
      })}
    </div>
  )
}

interface CartaoAutomacaoProps {
  catalogo: CatalogoAutomacao
  automacao: WhatsAppAutomation
}

/** Um gatilho: liga/desliga, horário (quando agendado) e texto da mensagem. */
function CartaoAutomacao({ catalogo, automacao }: CartaoAutomacaoProps) {
  const toast = useToast()
  const { mutate: salvar, isPending: salvando } = useSalvarAutomacao()

  const [mensagem, setMensagem] = useState(automacao.mensagem)
  const [horario, setHorario] = useState(automacao.horario ?? '')

  const ativa = automacao.status === 'ativo'
  // Só habilita "Salvar" quando algo mudou de fato.
  const alterado = mensagem !== automacao.mensagem || horario !== (automacao.horario ?? '')

  function persistir(dados: Partial<WhatsAppAutomation>, aviso: string) {
    salvar(
      {
        gatilho: catalogo.gatilho,
        dados: {
          status: automacao.status,
          mensagem,
          horario: catalogo.agendado ? horario || undefined : undefined,
          ...dados,
        },
      },
      { onSuccess: () => toast.success(aviso) },
    )
  }

  return (
    <FormSection
      title={catalogo.titulo}
      description={catalogo.descricao}
      actions={
        <Toggle
          label={ativa ? 'Ativa' : 'Inativa'}
          checked={ativa}
          onChange={v => persistir(
            { status: v ? 'ativo' : 'inativo' },
            v ? 'Automação ativada!' : 'Automação desativada.',
          )}
        />
      }
    >
      <div className={styles.corpo}>
        {catalogo.agendado && (
          <div className={styles.horario}>
            <Input
              label="Horário de envio"
              type="time"
              value={horario}
              onChange={e => setHorario(e.target.value)}
              hint="Disparo diário nesse horário."
            />
          </div>
        )}

        <Textarea
          label="Mensagem"
          rows={3}
          value={mensagem}
          onChange={e => setMensagem(e.target.value)}
        />

        <div className={styles.rodape}>
          <div className={styles.variaveis}>
            <span className={styles.variaveisLabel}>Variáveis:</span>
            {[...VARIAVEIS_COMUNS, ...catalogo.variaveis].map(v => (
              <code key={v} className={styles.variavel}>{v}</code>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={!alterado}
            loading={salvando}
            onClick={() => persistir({}, 'Mensagem salva!')}
          >
            Salvar
          </Button>
        </div>
      </div>
    </FormSection>
  )
}
