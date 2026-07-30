import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Calendar } from '@/components/Calendar/Calendar'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { EvolutionTemplatePicker } from '@/components/EvolutionTemplatePicker/EvolutionTemplatePicker'
import { LastSessionNote } from '@/components/LastSessionNote/LastSessionNote'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { SoapEditor } from '@/components/SoapEditor/SoapEditor'
import { SoapNoteView } from '@/components/SoapNoteView/SoapNoteView'
import { useToast } from '@/components/Toast/Toast'
import { IconChevronDown, IconSchedule } from '@/components/icons'
import { useUpdateClinicalNote } from '@/hooks/useSchedule'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { usePatientNoteDates, usePatientNotesByDate } from '@/hooks/usePatientClinicalNotes'
import { isBlankSoap, isSameSoapNote } from '@/utils/soap'
import { errorMessage } from '@/utils/errors'
import { isoToBrDate } from '@/utils/date'
import type { SoapNote, SoapSection } from '@/types/domain'
import styles from './ClinicalRecord.module.scss'

interface ClinicalRecordProps {
  patientId: string
  appointmentId: string
  /** Data e hora da sessão ABERTA (hoje) — é a partir daqui que "última
   *  sessão" procura para trás, e é o dia contra o qual o seletor de data
   *  decide se está em modo edição ou em modo consulta. */
  dateIso: string
  startTime: string
  /** O que já está salvo no banco para a sessão de HOJE — vem da própria
   *  consulta (`sessao.clinicalNote`), não é buscado de novo aqui dentro. */
  clinicalNote: SoapNote | undefined
  /** Recorta o calendário e o histórico ao TRATAMENTO em curso — mesmo
   *  princípio do Diagnóstico, dos Sinais vitais, dos Testes e das
   *  Avaliações. Ausente = sem tratamento ativo, mostra a vida inteira do
   *  paciente (não há episódio a recortar). */
  carePlanId?: string
}

/**
 * PRONTUÁRIO — a evolução SOAP, com um seletor de data no topo.
 *
 * HOJE é o único dia que se EDITA: o resto é consulta. Escolher outro dia no
 * calendário troca a tela inteira para leitura (`SoapNoteView`, o mesmo da
 * aba Prontuários do perfil) — não dá pra reabrir e reescrever a evolução de
 * uma sessão passada por aqui.
 *
 * SALVA VIA `useUpdateClinicalNote`, e NÃO via `useUpdateScheduleAppointment`:
 * o `toRow` daquela mutation não inclui `clinical_note` no update, então ela
 * grava os outros campos do agendamento e IGNORA a nota em silêncio. Quem
 * mexer aqui depois: a mutation "salvar consulta" parece a escolha óbvia e é
 * a errada — ela devolve sucesso sem gravar a evolução.
 */
export function ClinicalRecord({
  patientId, appointmentId, dateIso, startTime, clinicalNote, carePlanId,
}: ClinicalRecordProps) {
  const toast = useToast()
  const salvar = useUpdateClinicalNote()

  const [aberto, setAberto] = useState(false)
  const [dataEscolhida, setDataEscolhida] = useState(dateIso)
  const ref = useOutsideClick<HTMLDivElement>(() => setAberto(false), aberto)
  const ehHoje = dataEscolhida === dateIso

  const { data: datasComNota } = usePatientNoteDates(patientId, carePlanId)
  // Só busca quando NÃO é hoje: o dia de hoje já chega pronto via props (é a
  // sessão que a tela de Hoje abriu), buscar de novo aqui duplicaria a
  // pergunta que o resto da tela já fez.
  const { data: notasDoDia, isLoading: carregandoNotas } = usePatientNotesByDate(
    patientId, ehHoje ? undefined : dataEscolhida, carePlanId,
  )

  /** Seções que vieram COPIADAS (modelo ou sessão anterior) e ainda não foram
   *  tocadas — ganham marca visual no editor. */
  const [copiadas, setCopiadas] = useState<readonly SoapSection[]>([])
  const [nota, setNota] = useState<SoapNote>(clinicalNote ?? {})

  // Troca de SESSÃO recarrega a nota. Ajustado durante o render (não em
  // efeito): mesmo padrão já usado no resto da tela — sem isto, abrir a
  // consulta de outro paciente herdaria o rascunho da anterior por uma
  // renderização.
  const [carregadaDe, setCarregadaDe] = useState(appointmentId)
  if (carregadaDe !== appointmentId) {
    setCarregadaDe(appointmentId)
    setNota(clinicalNote ?? {})
    setCopiadas([])
    setDataEscolhida(dateIso)
  }

  const sujo = !isSameSoapNote(nota, clinicalNote ?? {})

  /** Aplica um modelo ou repete a sessão anterior, marcando o que foi copiado. */
  function aplicarCopia(vinda: SoapNote) {
    setNota(atual => ({ ...atual, ...vinda }))
    setCopiadas(Object.keys(vinda) as SoapSection[])
  }

  function salvarNota() {
    salvar.mutate(
      { appointmentId, note: nota, patientId },
      {
        onSuccess: () => toast.success('Prontuário salvo.'),
        onError: e => toast.error(errorMessage(e, 'Não foi possível salvar o prontuário.')),
      },
    )
  }

  function selecionarData(iso: string) {
    // Sessão de hoje ainda não aconteceu depois de hoje — não hà o que
    // consultar num dia futuro.
    if (iso > dateIso) return
    setDataEscolhida(iso)
    setAberto(false)
  }

  // Só as notas de sessão INDIVIDUAL têm `appointmentId` — a de turma vive em
  // `class_group_attendance`, sem linha de agendamento para abrir aqui.
  const notasIndividuais = (notasDoDia ?? []).filter(n => n.appointmentId)

  return (
    <div className={styles.raiz}>
      <div className={styles.seletor} ref={ref}>
        <button
          type="button"
          className={styles.gatilho}
          onClick={() => setAberto(a => !a)}
          aria-haspopup="menu"
          aria-expanded={aberto}
        >
          <IconSchedule />
          <span>{ehHoje ? 'Hoje' : isoToBrDate(dataEscolhida)}</span>
          <span className={`${styles.chevron} ${aberto ? styles.chevronAberto : ''}`}>
            <IconChevronDown />
          </span>
        </button>

        {aberto && (
          <div className={styles.dropdown}>
            <Calendar
              markedDates={datasComNota ?? []}
              markColor="var(--success-fg)"
              selected={dataEscolhida}
              onSelect={selecionarData}
            />
          </div>
        )}
      </div>

      {ehHoje ? (
        <>
          {/* A evolução ANTERIOR, recolhida: conferir o que foi feito da
              última vez sem sair da tela. "Repetir" traz só Objetivo e Plano
              — Subjetivo e Avaliação são o que muda de uma sessão para a
              outra. */}
          <LastSessionNote
            patientId={patientId}
            beforeDateIso={dateIso}
            beforeStartTime={startTime}
            onRepeat={aplicarCopia}
          />

          <div className={styles.editor}>
            {/* `withToday`: aqui a evolução ABRE com o campo livre "Hoje" — o
                que foi realizado na sessão, escrito de corrida entre um
                paciente e outro. As quatro seções do SOAP vêm depois dele. */}
            <SoapEditor
              value={nota}
              onChange={n => { setNota(n); setCopiadas([]) }}
              copiedSections={copiadas}
              withToday
            />
          </div>

          <div className={styles.rodape}>
            {sujo && <span className={styles.naoSalvo}>Alterações não salvas</span>}
            <EvolutionTemplatePicker current={nota} onApply={aplicarCopia} />
            <Button loading={salvar.isPending} disabled={!sujo || isBlankSoap(nota)} onClick={salvarNota}>
              Salvar prontuário
            </Button>
          </div>
        </>
      ) : carregandoNotas ? (
        <PageLoader />
      ) : notasIndividuais.length === 0 ? (
        <EmptyState
          title="Sem prontuário neste dia"
          description="Escolha outro dia marcado no calendário, ou volte para hoje."
        />
      ) : (
        // LEITURA — dia passado não se reescreve por aqui. Mais de uma sessão
        // no mesmo dia (raro, mas possível) aparece uma abaixo da outra.
        <div className={styles.leitura}>
          {notasIndividuais.map(n => (
            <article key={n.id} className={styles.notaPassada}>
              <header className={styles.notaCabecalho}>
                <span className={styles.notaHorario}>{n.startTime}</span>
                <span className={styles.notaAtividade}>{n.activity}</span>
              </header>
              {n.note && <SoapNoteView note={n.note} />}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
