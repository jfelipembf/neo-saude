import { useState } from 'react'
import { useCibelly } from '@/hooks/useCibelly'
import { carregarPedal } from '@/lib/cibelly/pedalConfig'
import { useCibellyPedal } from '@/hooks/useCibellyPedal'
import { useCibellyGeneralTools } from '@/hooks/useCibellyGeneralTools'
import { useSession } from '@/context/SessionProvider'
import { IconMic } from '@/components/icons'
import styles from './CibellyGlobal.module.scss'

/**
 * A CIBELLY FORA DO ODONTOGRAMA — o pedal F em qualquer tela.
 *
 * Monta no AppLayout, e é aí que está o truque: a tela cheia do odontograma é
 * IRMÃ do AppLayout, não filha (ver AppRouter.tsx). Então este componente
 * simplesmente não existe lá, e as duas sessões nunca disputam o microfone —
 * a exclusão é estrutural, não uma flag que alguém pode esquecer de ligar.
 * Naquela tela quem manda continua sendo a página, que tem J e F completos.
 *
 * Só o pedal F: o J é "o paciente da cadeira", e fora do odontograma não há
 * cadeira. As ferramentas de dente também ficam de fora, porque o motor do
 * odontograma só existe montado naquela tela (ver lib/cibelly/toolSurface.ts) —
 * chamá-las aqui não marcaria nada, e não marcaria em silêncio.
 *
 * ODONTOLOGIA apenas: a Cibelly é a assistente do consultório odontológico.
 * Numa clínica de fisioterapia o componente não conecta nada, e o F volta a ser
 * uma tecla comum.
 */
export function CibellyGlobal() {
  const { specialty } = useSession()
  const ehOdonto = specialty === 'dentistry'

  // Sem paciente aberto: fora do odontograma não existe "o da cadeira", e é
  // exatamente essa a semântica do modo geral. Quem precisar de alguém vai
  // pedir o nome.
  const ferramentas = useCibellyGeneralTools({ patientId: null })

  const cibelly = useCibelly(ehOdonto, null, {
    aoConsultarPacientes: ferramentas.consultarPacientes,
    aoEmitirDocumento: ferramentas.emitirDocumento,
    aoConsultarMateriais: ferramentas.consultarMateriais,
    aoRegistrarMaterial: ferramentas.registrarMaterialUsado,
    aoSolicitarOrcamento: ferramentas.solicitarOrcamento,
    aoEnviarMensagemPaciente: ferramentas.enviarMensagemPaciente,
    aoConsultarAgenda: ferramentas.consultarAgenda,
    aoAgendar: ferramentas.agendarConsulta,
    aoConsultarHistorico: ferramentas.consultarHistorico,
    aoConsultarFinanceiro: ferramentas.consultarFinanceiroPaciente,
    aoCancelarConsulta: ferramentas.cancelarConsulta,
    aoCriarLembrete: ferramentas.criarLembrete,
    aoConcluirLembrete: ferramentas.concluirLembrete,
    // `aoLerOdontograma` e as de marcação ficam de fora: sem o motor montado
    // elas não teriam o que ler nem onde escrever. A superfície `global`
    // abaixo recusa essas chamadas com uma frase que diz o que fazer.
  }, 'global')

  // Lido uma vez por montagem: quem configura é o modal do odontograma, e
  // trocar de tela remonta este provider.
  const [pedal] = useState(carregarPedal)

  useCibellyPedal({
    enabled: ehOdonto && cibelly.status === 'listening',
    // Nunca há paciente aberto aqui, então o pedal J fica desligado por
    // construção — sem precisar de uma regra separada dizendo isso.
    patientAvailable: false,
    startListening: cibelly.iniciarEscuta,
    stopListening: cibelly.encerrarEscuta,
    // O MESMO pedal do odontograma. Sem isto, o código aprendido (PageDown,
    // seta…) só era reconhecido lá dentro — fora, o pedal rolava a página e
    // parecia quebrado.
    config: pedal,
  })

  if (!ehOdonto) return null

  // Só aparece enquanto ela está atendendo: um indicador permanente em todas as
  // telas viraria paisagem, e o que precisa ser inequívoco é o microfone ABERTO
  // na frente de outra pessoa.
  if (!cibelly.processando && cibelly.status !== 'connecting') return null

  return (
    <div className={styles.aviso} role="status" aria-live="polite">
      <IconMic />
      {cibelly.status === 'connecting' ? 'Conectando a Cibelly…' : 'Cibelly ouvindo'}
    </div>
  )
}
