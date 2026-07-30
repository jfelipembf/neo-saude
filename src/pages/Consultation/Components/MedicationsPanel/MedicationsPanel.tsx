import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { Modal } from '@/components/Modal/Modal'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/Toast'
import { Textarea } from '@/components/Textarea/Textarea'
import { IconPlus, IconPrint } from '@/components/icons'
import {
  useAddMedication, useReplaceMedication, useSuspendMedication,
} from '@/hooks/useMedications'
import { useCreatePrescription } from '@/hooks/usePrescriptions'
import { useClinic } from '@/hooks/useClinic'
import { useCurrentUser } from '@/hooks/useUser'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { CLINICAL_DOCUMENT_STYLES, prescriptionBody } from '@/utils/clinicalDocument'
import { errorMessage } from '@/utils/errors'
import { formatCpf } from '@/utils/format'
import { formatLongDate, isoToBrDate, toIsoDate } from '@/utils/date'
import { DOSE_UNITS, type PatientMedication } from '@/services/medicationsService'
import { posologiaPorExtenso } from '@/utils/prescriptionDosage'
import type { ClinicSpecialty } from '@/types/domain'
import styles from './MedicationsPanel.module.scss'

/** A ação em curso sobre uma medicação — decide o título e o que o modal pede. */
type Acao = 'nova' | 'trocar' | 'dose'

const TITULO: Record<Acao, string> = {
  nova: 'Adicionar medicação',
  trocar: 'Trocar medicação',
  dose: 'Alterar dosagem',
}

interface MedicationsPanelProps {
  patientId: string
  appointmentId: string
  professionalId?: string
  medicacoes: PatientMedication[]
  /** Identificação do paciente no receituário impresso. */
  patientName?: string
  patientCpf?: string
  /** Da CLÍNICA — define o cargo no bloco de assinatura ("Médico"). */
  specialty?: ClinicSpecialty
}

/**
 * MEDICAÇÃO EM USO — e o que fazer com ela.
 *
 * Trocar e alterar dose são a MESMA operação com nome diferente: encerram o
 * período atual e abrem um novo, ligados. Editar a linha existente pareceria
 * mais simples e destruiria a resposta para "ele tomava 50mg até quando?" —
 * que é a pergunta que aparece quando algo dá errado.
 *
 * Suspender só fecha o período, sem substituta.
 */
export function MedicationsPanel({
  patientId, appointmentId, professionalId, medicacoes,
  patientName, patientCpf, specialty,
}: MedicationsPanelProps) {
  const toast = useToast()
  const { mutate: adicionar, isPending: adicionando } = useAddMedication()
  const { mutate: substituir, isPending: substituindo } = useReplaceMedication()
  const { mutate: suspender } = useSuspendMedication()
  const { data: clinica } = useClinic()
  const { data: usuario } = useCurrentUser()
  const { mutate: criarDocumento, isPending: emitindo } = useCreatePrescription()
  const imprimir = usePrintDocument()

  const [acao, setAcao] = useState<Acao | null>(null)
  const [alvo, setAlvo] = useState<PatientMedication | null>(null)
  const [nome, setNome] = useState('')
  const [dose, setDose] = useState('')
  const [unidade, setUnidade] = useState('mg')
  const [vezes, setVezes] = useState('')
  const [dias, setDias] = useState('')
  const [continuo, setContinuo] = useState(false)
  const [aSuspender, setASuspender] = useState<PatientMedication | null>(null)
  const [motivo, setMotivo] = useState('')

  const emUso = medicacoes.filter(m => !m.endedOn)
  const encerradas = medicacoes.filter(m => m.endedOn)

  /**
   * A RECEITA SAI DAQUI, do que já está registrado como em uso.
   *
   * Antes ela era redigitada num formulário do painel de Documentos, e o
   * resultado era previsível: o papel entregue ao paciente e a lista de
   * medicação do prontuário divergiam — trocava-se a dose aqui e a receita
   * seguia com a antiga, porque eram dois cadastros sem ligação. Emitindo a
   * partir desta lista, o que o paciente leva é, por construção, o que está
   * registrado.
   *
   * A escolha é por EXCLUSÃO (tudo marcado, desmarca-se o que não vai): quem
   * abre o receituário quase sempre quer tudo, e um paciente polimedicado com
   * a lista vazia por padrão convida a esquecer um item.
   */
  const [receituarioAberto, setReceituarioAberto] = useState(false)
  const [foraDaReceita, setForaDaReceita] = useState<string[]>([])
  const [orientacoes, setOrientacoes] = useState('')

  const daReceita = emUso.filter(m => !foraDaReceita.includes(m.id))

  // Sem registro no conselho a receita não vale na farmácia — melhor recusar
  // aqui do que imprimir um papel que o paciente descobre inválido no balcão.
  const semRegistro = !usuario?.license || !/\d/.test(usuario.license)

  function abrirReceituario() {
    setForaDaReceita([])
    setOrientacoes('')
    setReceituarioAberto(true)
  }

  function alternarNaReceita(id: string) {
    setForaDaReceita(atual =>
      atual.includes(id) ? atual.filter(x => x !== id) : [...atual, id])
  }

  function emitirReceita() {
    if (!daReceita.length) return

    const hojeBr = isoToBrDate(toIsoDate(new Date())) ?? ''
    // `dosage` já é a posologia por extenso (posologiaPorExtenso, gravada com a
    // linha) — é a MESMA frase que a lista mostra na tela.
    const medicamentos = daReceita.map(m => ({ name: m.name, dosage: m.dosage ?? '' }))
    const html = prescriptionBody({
      patientName: patientName ?? '',
      patientCpf: patientCpf ? formatCpf(patientCpf) : undefined,
      longDate: formatLongDate(hojeBr),
      city: clinica?.city,
      signer: { name: usuario?.name ?? '', license: usuario?.license ?? '', specialty },
      medications: medicamentos,
      text: orientacoes,
    })

    criarDocumento({
      patientId,
      type: 'prescription',
      title: 'Receituário',
      date: hojeBr,
      medications: medicamentos,
      text: orientacoes || undefined,
    }, {
      onSuccess: () => {
        imprimir({ title: 'Receituário', body: html, styles: CLINICAL_DOCUMENT_STYLES })
        toast.success('Receituário emitido.')
        setReceituarioAberto(false)
      },
      onError: e => toast.error(errorMessage(e, 'Não foi possível emitir o receituário.')),
    })
  }

  function abrir(novaAcao: Acao, med?: PatientMedication) {
    setAcao(novaAcao)
    setAlvo(med ?? null)
    // Trocar começa em branco (é outro remédio); alterar dose mantém o nome,
    // que é justamente o que NÃO muda.
    setNome(novaAcao === 'dose' ? (med?.name ?? '') : '')
    // Ajuste de dose abre com a posologia atual carregada — é a partir dela
    // que o médico decide o novo valor, não do zero.
    const herda = novaAcao === 'dose' ? med : undefined
    setDose(herda?.doseAmount != null ? String(herda.doseAmount) : '')
    setUnidade(herda?.doseUnit ?? 'mg')
    setVezes(herda?.timesPerDay != null ? String(herda.timesPerDay) : '')
    setDias(herda?.durationDays != null ? String(herda.durationDays) : '')
    // Ajuste de dose herda o caráter da atual — mudar a dose de um contínuo não
    // o transforma em tratamento de prazo.
    setContinuo(novaAcao === 'dose' ? (med?.continuous ?? false) : false)
  }

  function fechar() {
    setAcao(null); setAlvo(null); setNome(''); setDose('')
    setUnidade('mg'); setVezes(''); setDias(''); setContinuo(false)
  }

  function confirmar() {
    if (!nome.trim()) return
    const pronto = {
      onSuccess: () => { toast.success('Medicação registrada.'); fechar() },
      onError: (e: unknown) => toast.error(errorMessage(e, 'Não foi possível registrar.')),
    }

    const posologia = {
      doseAmount: dose ? Number(dose) : undefined,
      doseUnit: dose ? unidade : undefined,
      timesPerDay: vezes ? Number(vezes) : undefined,
      // Contínuo não tem prazo por definição — mandar dias junto seria gravar
      // uma contradição que a tela depois teria que decidir qual respeitar.
      durationDays: continuo || !dias ? undefined : Number(dias),
      continuous: continuo,
    }

    if (acao === 'nova' || !alvo) {
      adicionar({ patientId, appointmentId, name: nome, ...posologia, professionalId }, pronto)
      return
    }
    substituir({
      atualId: alvo.id,
      patientId,
      appointmentId,
      name: nome,
      ...posologia,
      professionalId,
      motivo: acao === 'dose' ? 'dose_changed' : 'replaced',
    }, pronto)
  }

  return (
    <>
      <div className={styles.centroCabecalho}>
        <span className={styles.blocoTitulo}>Em uso</span>
        <div className={styles.acoesCabecalho}>
          {/* Só aparece quando há o que receitar: um botão de emitir sobre uma
              lista vazia produziria uma receita em branco. */}
          {emUso.length > 0 && (
            <Button
              size="sm" variant="outline" iconLeft={<IconPrint />}
              disabled={semRegistro}
              title={semRegistro ? 'Complete o registro no conselho (CRM/CRO) no seu cadastro' : undefined}
              onClick={abrirReceituario}
            >
              Emitir receita
            </Button>
          )}
          <Button size="sm" variant="outline" iconLeft={<IconPlus />} onClick={() => abrir('nova')}>
            Adicionar
          </Button>
        </div>
      </div>

      {semRegistro && emUso.length > 0 && (
        <p className={styles.vazio}>
          Seu cadastro está sem o número do registro no conselho. Complete em
          Administrativo → Profissionais para poder emitir o receituário.
        </p>
      )}

      {emUso.length === 0 ? (
        <p className={styles.vazio}>Nenhuma medicação em uso registrada.</p>
      ) : (
        <ul className={styles.medEmUso}>
          {emUso.map(m => (
            <li key={m.id} className={styles.medEmUsoItem}>
              <div className={styles.medTexto}>
                <strong>
                  {m.name}
                  {m.continuous && <span className={styles.selo}>contínuo</span>}
                </strong>
                {m.dosage && <span className={styles.medPosologia}>{m.dosage}</span>}
                <span className={styles.medDesde}>desde {m.startedOn}</span>
              </div>
              <div className={styles.medAcoes}>
                <Button size="sm" variant="ghost" onClick={() => abrir('dose', m)}>Dosagem</Button>
                <Button size="sm" variant="ghost" onClick={() => abrir('trocar', m)}>Trocar</Button>
                <Button size="sm" variant="ghost" onClick={() => { setASuspender(m); setMotivo('') }}>
                  Suspender
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {encerradas.length > 0 && (
        <>
          <div className={styles.centroCabecalho}>
            <span className={styles.blocoTitulo}>Encerradas</span>
          </div>
          <ol className={styles.timeline}>
            {encerradas.map(m => (
              <li key={m.id} className={styles.marco}>
                <span className={styles.marcoData}>{m.startedOn} — {m.endedOn}</span>
                <span className={styles.marcoTexto}>
                  {m.name}{m.dosage ? ` · ${m.dosage}` : ''}
                </span>
                {m.endReason && (
                  <span className={`${styles.seloMotivo} ${classeDoMotivo(m.endReason)}`}>
                    {rotuloDoMotivo(m.endReason)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      {/* RECEITUÁRIO: a lista em uso, com o que não vai desmarcado. */}
      <Modal
        open={receituarioAberto}
        onClose={() => setReceituarioAberto(false)}
        title="Emitir receituário"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReceituarioAberto(false)} disabled={emitindo}>
              Cancelar
            </Button>
            <Button
              loading={emitindo}
              disabled={!daReceita.length}
              iconLeft={<IconPrint />}
              onClick={emitirReceita}
            >
              Emitir e imprimir
            </Button>
          </>
        }
      >
        <div className={styles.formDocumento}>
          <ul className={styles.escolhaLista}>
            {emUso.map(m => (
              <li key={m.id}>
                <label className={styles.escolha}>
                  <input
                    type="checkbox"
                    checked={!foraDaReceita.includes(m.id)}
                    onChange={() => alternarNaReceita(m.id)}
                  />
                  <span className={styles.escolhaTexto}>
                    <strong>{m.name}</strong>
                    {m.dosage && <span className={styles.medPosologia}>{m.dosage}</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {!daReceita.length && (
            <p className={styles.vazio}>Marque ao menos uma medicação para emitir a receita.</p>
          )}

          <Textarea
            label="Orientações (opcional)"
            rows={3}
            placeholder="Repouso, retorno em 7 dias, sinais de alerta…"
            value={orientacoes}
            onChange={e => setOrientacoes(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={acao !== null}
        onClose={fechar}
        title={acao ? TITULO[acao] : ''}
        footer={
          <>
            <Button variant="ghost" onClick={fechar} disabled={adicionando || substituindo}>Cancelar</Button>
            <Button
              loading={adicionando || substituindo}
              disabled={!nome.trim()}
              onClick={confirmar}
            >
              Salvar
            </Button>
          </>
        }
      >
        <div className={styles.formDocumento}>
          {alvo && acao === 'trocar' && (
            <p className={styles.vazio}>
              <strong>{alvo.name}</strong> será encerrada hoje e a nova entra no lugar,
              ligada a ela no histórico.
            </p>
          )}
          <Input
            label="Medicamento"
            placeholder="Ex.: Losartana 50 mg"
            value={nome}
            // No ajuste de dose o nome é o que NÃO muda — bloqueado para não
            // virar troca disfarçada, que quebraria a corrente do histórico.
            disabled={acao === 'dose'}
            onChange={e => setNome(e.target.value)}
          />
          {/* Dose e unidade lado a lado: "500" e "0,5" são a mesma coisa em
              mg e g, e a unidade separada do número é o que permite comparar
              depois (dose máxima diária, carga de princípio ativo). */}
          <div className={styles.doseGrid}>
            <Input
              label="Dosagem"
              type="number" min={0} step="0.001"
              placeholder="500"
              value={dose}
              onChange={e => setDose(e.target.value)}
            />
            <Select
              label="Unidade"
              options={DOSE_UNITS.map(u => ({ value: u, label: u }))}
              value={unidade}
              onChange={e => setUnidade(e.target.value)}
            />
          </div>

          <div className={styles.doseGrid}>
            <Input
              label="Vezes ao dia"
              type="number" min={1} max={24}
              placeholder="3"
              value={vezes}
              onChange={e => setVezes(e.target.value)}
            />
            <Input
              label="Por quantos dias"
              type="number" min={1}
              placeholder="7"
              value={dias}
              // Contínuo não tem prazo — o campo sai do caminho em vez de
              // ficar aceitando um número que será ignorado.
              disabled={continuo}
              onChange={e => setDias(e.target.value)}
            />
          </div>

          {/* A frase que vai para a lista e para a receita, montada ao vivo:
              o médico confere "a cada 8 horas" nascendo de "3 vezes ao dia". */}
          {(dose || vezes || dias) && (
            <p className={styles.medPreviaLinha}>
              {posologiaPorExtenso({
                dose: dose ? `${dose}${unidade}` : undefined,
                vezesAoDia: vezes ? Number(vezes) : undefined,
                dias: continuo || !dias ? undefined : Number(dias),
                semSufixoContinuo: continuo,
              }) || '—'}
            </p>
          )}
          {/* Contínuo × com prazo: é o que separa o anti-hipertensivo de seis
              anos do antibiótico de sete dias na mesma lista. */}
          <Toggle
            label="Uso contínuo"
            checked={continuo}
            onChange={setContinuo}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={aSuspender !== null}
        onClose={() => setASuspender(null)}
        onConfirm={() => {
          if (!aSuspender) return
          suspender({ id: aSuspender.id, patientId, motivo: motivo || undefined }, {
            onSuccess: () => toast.success(`${aSuspender.name} suspensa.`),
            onError: e => toast.error(errorMessage(e, 'Não foi possível suspender.')),
          })
          setASuspender(null)
        }}
        title="Suspender medicação?"
        message={`${aSuspender?.name ?? ''} sai da lista de uso a partir de hoje. O registro fica no histórico com a data — é ele que explica a conduta enquanto o paciente tomava.`}
        confirmLabel="Suspender"
      />
    </>
  )
}

/** Motivo gravado → o que o médico lê. Motivo livre passa como está. */
function rotuloDoMotivo(motivo: string): string {
  if (motivo === 'suspended') return 'Suspensa'
  if (motivo === 'dose_changed') return 'Dosagem alterada'
  if (motivo === 'replaced') return 'Substituída'
  return motivo
}

/**
 * Cor por MOTIVO, porque os três desfechos são clinicamente diferentes:
 *
 *  · Suspensa       — parou e não entrou nada no lugar (vermelho: é o que pode
 *                     ter deixado o paciente descoberto)
 *  · Substituída    — trocou por outra (roxo: continuidade, houve substituta)
 *  · Dosagem alterada — mesma droga, dose nova (âmbar: ajuste, não interrupção)
 *
 * Motivo livre digitado pelo médico fica neutro — não há como adivinhar a cor.
 */
function classeDoMotivo(motivo: string): string {
  if (motivo === 'suspended') return styles.seloSuspensa
  if (motivo === 'replaced') return styles.seloSubstituida
  if (motivo === 'dose_changed') return styles.seloDose
  return ''
}
