import { useEffect, useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { ETIQUETAS_AGENDA } from '@/constants'
import { useCriarGradeSessao, useAtualizarGradeSessao } from '@/hooks/useGrade'
import { usePacientes } from '@/hooks/usePacientes'
import { useProfissionais } from '@/hooks/useProfissionais'
import { useSalas } from '@/hooks/useSalas'
import { toIsoDate } from '@/utils/date'
import { somenteDigitos } from '@/utils/text'
import { IconTelefone } from '@/components/icons'
import type { ScheduleSlot } from '@/types/domain'
import styles from './AppointmentModal.module.scss'

const OPCOES_CONFIRMACAO = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
]

/** 'aaaa-mm-dd' → Date LOCAL (new Date(iso) escorregaria um dia no fuso BR). */
function dataLocal(iso: string) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

/** Data (nesta semana) do dia da semana da sessão — preenche o input date na edição. */
function dataDoDiaSemana(diaSemana: number) {
  const hoje = new Date()
  return toIsoDate(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay() + diaSemana))
}

/** '07:30' + 30 → '08:00'. */
function somarMinutos(hhmm: string, minutos: number) {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutos
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Duração (min) entre '07:30' e '08:00' — para editar uma sessão existente. */
function duracaoEntre(inicio: string, fim: string) {
  const [hi, mi] = inicio.split(':').map(Number)
  const [hf, mf] = fim.split(':').map(Number)
  return Math.max(15, hf * 60 + mf - (hi * 60 + mi))
}

/** Nome como aparece na grade (sem o prefixo "Dr./Dra."). */
function nomeNaGrade(nome: string) {
  return nome.replace(/^Dra?\.\s*/i, '')
}

/** Cor do card: casa a atividade/especialidade com a paleta da agenda. */
function corDaAtividade(atividade: string) {
  const alvo = atividade.toLowerCase()
  return ETIQUETAS_AGENDA.find(e =>
    e.label.toLowerCase().includes(alvo) || alvo.includes(e.label.toLowerCase()),
  )?.cor ?? ETIQUETAS_AGENDA[0].cor
}

interface AppointmentModalProps {
  open: boolean
  onClose: () => void
  /** Sessão em edição — sem ela, o modal cria um agendamento novo. */
  sessao?: ScheduleSlot | null
}

/**
 * Modal de agendamento da grade: cria uma consulta ou edita a existente
 * (dentista, paciente com busca, data/horário/duração, etiqueta, confirmação
 * e retorno programado).
 */
export function AppointmentModal({ open, onClose, sessao }: AppointmentModalProps) {
  const toast = useToast()
  const { data: profissionais } = useProfissionais()
  const { data: pacientes } = usePacientes()
  const { data: salas } = useSalas()
  const { mutate: criar, isPending: criando } = useCriarGradeSessao()
  const { mutate: atualizar, isPending: salvando } = useAtualizarGradeSessao()

  const [profissional, setProfissional] = useState('')
  const [pacienteBusca, setPacienteBusca] = useState('')
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false)
  const [dataIso, setDataIso] = useState(() => toIsoDate(new Date()))
  const [hora, setHora] = useState('07:30')
  const [duracao, setDuracao] = useState('30')
  const [sala, setSala] = useState('')
  const [observacao, setObservacao] = useState('')
  const [confirmar, setConfirmar] = useState<'sim' | 'nao'>('sim')
  const [erro, setErro] = useState('')

  // Abriu o modal: hidrata da sessão (edição) ou reseta (criação).
  useEffect(() => {
    if (!open) return
    setErro('')
    setSugestoesAbertas(false)
    if (sessao) {
      setProfissional(sessao.profissional)
      setPacienteBusca(sessao.paciente)
      setDataIso(dataDoDiaSemana(sessao.diaSemana))
      setHora(sessao.horaInicio)
      setDuracao(String(duracaoEntre(sessao.horaInicio, sessao.horaFim)))
      setSala(sessao.sala ?? '')
      setObservacao(sessao.observacao ?? '')
      setConfirmar(sessao.enviarConfirmacao === false ? 'nao' : 'sim')
    } else {
      setProfissional('')
      setPacienteBusca('')
      setDataIso(toIsoDate(new Date()))
      setHora('07:30')
      setDuracao('30')
      setSala('')
      setObservacao('')
      setConfirmar('sim')
    }
  }, [open, sessao])

  const opcoesProfissional = (profissionais ?? [])
    .filter(p => p.status === 'ativo')
    .map(p => ({ value: nomeNaGrade(p.nome), label: p.nome }))

  // Busca do paciente por nome, telefone ou CPF (até 6 sugestões).
  const termo = pacienteBusca.trim().toLowerCase()
  const sugestoes = termo.length >= 2 && sugestoesAbertas
    ? (pacientes ?? [])
        .filter(p =>
          p.nome.toLowerCase().includes(termo) ||
          p.telefone.includes(termo) ||
          (p.cpf ?? '').includes(termo),
        )
        .slice(0, 6)
    : []

  const pacienteAtual = (pacientes ?? []).find(p => p.nome === pacienteBusca.trim())

  function aoSalvar() {
    if (!profissional) {
      setErro('Selecione o dentista/profissional.')
      return
    }
    if (!pacienteBusca.trim()) {
      setErro('Informe o paciente.')
      return
    }
    if (!hora) {
      setErro('Informe o horário.')
      return
    }

    // A atividade (e a cor do card) vem da especialidade do profissional —
    // na edição, mantém a atividade que a sessão já tinha.
    const especialidade = (profissionais ?? []).find(p => nomeNaGrade(p.nome) === profissional)?.especialidade
    const atividade = sessao?.atividade ?? especialidade ?? 'Consulta'

    const dados = {
      paciente: pacienteBusca.trim(),
      atividade,
      diaSemana: dataLocal(dataIso).getDay(),
      horaInicio: hora,
      horaFim: somarMinutos(hora, Number(duracao) || 30),
      profissional,
      sala: sala || undefined,
      cor: sessao?.cor ?? corDaAtividade(atividade),
      status: sessao?.status ?? ('ativa' as const),
      observacao: observacao.trim() || undefined,
      enviarConfirmacao: confirmar === 'sim',
    }

    const opcoes = {
      onSuccess: () => {
        toast.success(sessao ? 'Agendamento atualizado!' : 'Consulta agendada!')
        onClose()
      },
    }
    if (sessao) atualizar({ id: sessao.id, dados }, opcoes)
    else criar(dados, opcoes)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sessao ? 'Editar agendamento' : 'Nova consulta'}
      size="lg"
      footer={
        <>
          {sessao && pacienteAtual?.telefone && (
            <Button
              variant="ghost"
              iconLeft={<IconTelefone />}
              className={styles.ligar}
              title={`Ligar para ${pacienteAtual.nome}`}
              onClick={() => { window.location.href = `tel:+55${somenteDigitos(pacienteAtual.telefone)}` }}
            >
              Ligar
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={criando || salvando}>Cancelar</Button>
          <Button loading={criando || salvando} onClick={aoSalvar}>
            {sessao ? 'Salvar alterações' : 'Agendar'}
          </Button>
        </>
      }
    >
      <div className={styles.corpo}>
        <Select
          label="Dentista"
          options={opcoesProfissional}
          placeholder="Selecione..."
          value={profissional}
          onChange={e => { setProfissional(e.target.value); setErro('') }}
        />

        {/* Paciente com busca (nome, telefone ou CPF). */}
        <div className={styles.pacienteCampo}>
          <Input
            label="Paciente"
            placeholder="Busque por nome, telefone ou CPF"
            hint="Não encontrou? Cadastre o paciente na página Pacientes."
            value={pacienteBusca}
            onChange={e => { setPacienteBusca(e.target.value); setSugestoesAbertas(true); setErro('') }}
            onFocus={() => setSugestoesAbertas(true)}
            autoComplete="off"
          />
          {sugestoes.length > 0 && (
            <ul className={styles.sugestoes}>
              {sugestoes.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={styles.sugestao}
                    onClick={() => { setPacienteBusca(p.nome); setSugestoesAbertas(false) }}
                  >
                    <span className={styles.sugestaoNome}>{p.nome}</span>
                    <span className={styles.sugestaoMeta}>
                      {[p.telefone, p.cpf].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.grid3}>
          <Input
            label="Data da consulta"
            type="date"
            value={dataIso}
            onChange={e => setDataIso(e.target.value)}
          />
          <Input
            label="Horário"
            type="time"
            value={hora}
            onChange={e => { setHora(e.target.value); setErro('') }}
          />
          <Input
            label="Duração (min)"
            type="number"
            min={5}
            step={5}
            inputMode="numeric"
            placeholder="30"
            value={duracao}
            onChange={e => setDuracao(e.target.value)}
          />
        </div>

        <Select
          label="Sala"
          options={[
            { value: '', label: 'Sem sala definida' },
            ...(salas ?? []).map(s => ({ value: s.nome, label: s.nome })),
          ]}
          value={sala}
          onChange={e => setSala(e.target.value)}
        />

        <Textarea
          label="Observações"
          placeholder="Adicione observações sobre esta consulta"
          rows={3}
          value={observacao}
          onChange={e => setObservacao(e.target.value)}
        />

        <div className={styles.confirmacao}>
          <span className={styles.confirmacaoRotulo}>Enviar mensagem de confirmação?</span>
          <SegmentedControl options={OPCOES_CONFIRMACAO} value={confirmar} onChange={setConfirmar} />
        </div>

        {erro && <p className={styles.erro}>{erro}</p>}
      </div>
    </Modal>
  )
}
