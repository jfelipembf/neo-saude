import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { VitalSignChart } from '@/components/VitalSignChart/VitalSignChart'
import type { VitalSeries } from '@/components/VitalSignChart/VitalSignChart'
import { useToast } from '@/components/Toast/Toast'
import {
  IconBloodPressure, IconHeart, IconLungs, IconOxygen, IconThermometer, IconTrash,
} from '@/components/icons'
import { useAddVitalSign, useRemoveVitalSign, useVitalSigns } from '@/hooks/useVitalSigns'
import type { VitalSign } from '@/services/vitalSignsService'
import styles from './VitalSignsPanel.module.scss'

/**
 * SINAIS VITAIS — registro e evolução.
 *
 * Ocupa o CENTRO, e não o painel da direita, pelo mesmo motivo dos Testes:
 * série no tempo é tabela + gráfico, e cinco gráficos numa coluna de 400px
 * viram rolagem horizontal. Botão próprio, irmão de Testes — não é uma aba
 * dentro deles: teste é instrumento aplicado (Berg, TUG), sinal vital é
 * aferição de rotina; misturar os dois faria o histórico de um sumir dentro do
 * outro.
 *
 * As FAIXAS DE REFERÊNCIA são de adulto em repouso. Estão no gráfico, não numa
 * validação: valor fora da faixa é achado clínico a registrar, não erro a
 * recusar — é justamente na emergência que ele foge do normal. Quem recusa
 * número impossível é o CHECK do banco, com limites bem mais largos.
 */
const FAIXAS = {
  sistolica:   { min: 90,   max: 120 },
  diastolica:  { min: 60,   max: 80 },
  cardiaca:    { min: 60,   max: 100 },
  respiratoria:{ min: 12,   max: 20 },
  saturacao:   { min: 95,   max: 100 },
  temperatura: { min: 36.0, max: 37.5 },
}

interface FormState {
  sistolica: string
  diastolica: string
  cardiaca: string
  respiratoria: string
  saturacao: string
  temperatura: string
}

const VAZIO: FormState = {
  sistolica: '', diastolica: '', cardiaca: '', respiratoria: '', saturacao: '', temperatura: '',
}

/** '' → undefined; vírgula decimal aceita (é como se digita em pt-BR). */
function num(v: string): number | undefined {
  const t = v.trim().replace(',', '.')
  if (!t) return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

/** dd/mm para o eixo do gráfico. */
function diaMes(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function dataHora(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/** Série de UMA medida, pulando as aferições em que ela não foi registrada. */
function serie(medicoes: VitalSign[], campo: keyof VitalSign, nome: string, secundaria = false): VitalSeries {
  return {
    nome,
    secundaria,
    pontos: medicoes
      .filter(m => typeof m[campo] === 'number')
      .map(m => ({ rotulo: diaMes(m.medidoEm), valor: m[campo] as number })),
  }
}

interface VitalSignsPanelProps {
  patientId: string
  professionalId?: string | null
  treatmentSessionId?: string | null
  /** Recorta o histórico exibido ao TRATAMENTO — mesmo princípio do
   *  Diagnóstico e dos Testes: sem isto, aferições de um episódio encerrado
   *  aparecem misturadas com as do tratamento em curso. Ausente = mostra a
   *  vida inteira do paciente (ex.: sem tratamento ativo, não há o que
   *  recortar). */
  carePlanId?: string
}

export function VitalSignsPanel({
  patientId, professionalId, treatmentSessionId, carePlanId,
}: VitalSignsPanelProps) {
  const toast = useToast()
  const { data: medicoes, isLoading } = useVitalSigns(patientId)
  const registrar = useAddVitalSign(patientId)
  const excluir = useRemoveVitalSign(patientId)
  const [form, setForm] = useState<FormState>(VAZIO)

  if (isLoading) return <PageLoader />

  const todasAsMedicoes = medicoes ?? []
  const lista = carePlanId
    ? todasAsMedicoes.filter(m => m.carePlanId === carePlanId)
    : todasAsMedicoes
  const campo = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const algumPreenchido = Object.values(form).some(v => v.trim() !== '')

  function salvar() {
    const payload = {
      patientId,
      professionalId,
      treatmentSessionId,
      sistolica: num(form.sistolica),
      diastolica: num(form.diastolica),
      frequenciaCardiaca: num(form.cardiaca),
      frequenciaRespiratoria: num(form.respiratoria),
      saturacao: num(form.saturacao),
      temperatura: num(form.temperatura),
    }
    registrar.mutate(payload, {
      onSuccess: () => { toast.success('Aferição registrada.'); setForm(VAZIO) },
      onError: (e: Error) => toast.error(e.message),
    })
  }

  return (
    <div className={styles.raiz}>
      {/* Uma linha só de campos: aferir é rotina, e a rotina não comporta um
          formulário que rola. Cada campo aceita vazio — quase nunca se medem
          os cinco. */}
      <section className={styles.formulario}>
        <div className={styles.campos}>
          <Input label="Sistólica" hint="mmHg" inputMode="numeric" value={form.sistolica} onChange={campo('sistolica')} />
          <Input label="Diastólica" hint="mmHg" inputMode="numeric" value={form.diastolica} onChange={campo('diastolica')} />
          <Input label="Freq. cardíaca" hint="bpm" inputMode="numeric" value={form.cardiaca} onChange={campo('cardiaca')} />
          <Input label="Freq. respiratória" hint="irpm" inputMode="numeric" value={form.respiratoria} onChange={campo('respiratoria')} />
          <Input label="Saturação" hint="%" inputMode="numeric" value={form.saturacao} onChange={campo('saturacao')} />
          <Input label="Temperatura" hint="°C" inputMode="decimal" value={form.temperatura} onChange={campo('temperatura')} />
        </div>
        <Button onClick={salvar} loading={registrar.isPending} disabled={!algumPreenchido}>
          Registrar aferição
        </Button>
      </section>

      <div className={styles.graficos}>
        <VitalSignChart
          titulo="Pressão arterial" unidade="mmHg" icone={<IconBloodPressure />}
          faixaNormal={FAIXAS.sistolica}
          series={[
            serie(lista, 'sistolica', 'Sistólica'),
            serie(lista, 'diastolica', 'Diastólica', true),
          ]}
        />
        <VitalSignChart
          titulo="Freq. cardíaca" unidade="bpm" icone={<IconHeart />}
          faixaNormal={FAIXAS.cardiaca}
          series={[serie(lista, 'frequenciaCardiaca', 'Freq. cardíaca')]}
        />
        <VitalSignChart
          titulo="Freq. respiratória" unidade="irpm" icone={<IconLungs />}
          faixaNormal={FAIXAS.respiratoria}
          series={[serie(lista, 'frequenciaRespiratoria', 'Freq. respiratória')]}
        />
        <VitalSignChart
          titulo="Saturação" unidade="%" icone={<IconOxygen />}
          faixaNormal={FAIXAS.saturacao}
          series={[serie(lista, 'saturacao', 'Saturação')]}
        />
        <VitalSignChart
          titulo="Temperatura" unidade="°C" icone={<IconThermometer />}
          faixaNormal={FAIXAS.temperatura} casas={1}
          series={[serie(lista, 'temperatura', 'Temperatura')]}
        />
      </div>

      {lista.length > 0 && (
        <section className={styles.historico}>
          <h3 className={styles.historicoTitulo}>Aferições</h3>
          {/* Do mais NOVO para o mais antigo: o gráfico se lê da esquerda para
              a direita, mas a lista se lê de cima para baixo. */}
          <ul className={styles.lista}>
            {[...lista].reverse().map(m => (
              <li key={m.id} className={styles.item}>
                <span className={styles.quando}>{dataHora(m.medidoEm)}</span>
                <span className={styles.medidas}>
                  {m.sistolica != null && m.diastolica != null && (
                    <span><strong>{m.sistolica}/{m.diastolica}</strong> mmHg</span>
                  )}
                  {m.frequenciaCardiaca != null && <span><strong>{m.frequenciaCardiaca}</strong> bpm</span>}
                  {m.frequenciaRespiratoria != null && <span><strong>{m.frequenciaRespiratoria}</strong> irpm</span>}
                  {m.saturacao != null && <span><strong>{m.saturacao}</strong>%</span>}
                  {m.temperatura != null && <span><strong>{m.temperatura.toFixed(1)}</strong> °C</span>}
                </span>
                <button
                  type="button"
                  className={styles.remover}
                  aria-label={`Remover aferição de ${dataHora(m.medidoEm)}`}
                  onClick={() => excluir.mutate(m.id, {
                    onError: (e: Error) => toast.error(e.message),
                  })}
                >
                  <IconTrash />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
