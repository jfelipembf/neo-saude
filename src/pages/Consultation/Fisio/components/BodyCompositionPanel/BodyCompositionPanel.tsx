import { useImperativeHandle, useState } from 'react'
import type { ChangeEvent, Ref } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { PhotoUploader } from '@/components/PhotoUploader/PhotoUploader'
import { VitalSignChart } from '@/components/VitalSignChart/VitalSignChart'
import type { VitalSeries } from '@/components/VitalSignChart/VitalSignChart'
import { useToast } from '@/components/Toast/Toast'
import { IconBolt, IconDroplet, IconMuscle, IconRuler, IconScale, IconTrash } from '@/components/icons'
import { useAddBodyComposition, useBodyCompositions, useRemoveBodyComposition } from '@/hooks/useBodyComposition'
import { usePatient } from '@/hooks/usePatients'
import type { BodyComposition } from '@/services/bodyCompositionService'
import styles from './BodyCompositionPanel.module.scss'

/**
 * AVALIAÇÃO FÍSICA — o que a balança de bioimpedância devolve, e a fita métrica.
 *
 * Ocupa o CENTRO pelo mesmo motivo dos Testes e dos Sinais vitais: é série no
 * tempo, e série no tempo é tabela mais gráfico. Numa coluna de 400px viraria
 * rolagem horizontal.
 *
 * NÃO há faixa de referência nos gráficos de composição, de propósito. O que é
 * "normal" em percentual de gordura, massa magra ou água corporal muda com
 * sexo, idade e nível de treino — uma banda única pintaria de anormal metade
 * dos pacientes saudáveis. A única exceção é o IMC, cuja faixa da OMS para
 * adultos não depende de sexo.
 *
 * Quem recusa número impossível é o CHECK do banco, com limites largos: valor
 * fora do esperado é achado a registrar, não erro a barrar.
 */
const FAIXA_IMC = { min: 18.5, max: 24.9 }

interface FormState {
  peso: string
  altura: string
  gordura: string
  massaGordura: string
  massaMagra: string
  massaMuscular: string
  massaOssea: string
  proteina: string
  minerais: string
  agua: string
  aguaPercent: string
  visceral: string
  metabolismo: string
  idadeMetabolica: string
  cintura: string
  quadril: string
}

const VAZIO: FormState = {
  peso: '', altura: '', gordura: '', massaGordura: '', massaMagra: '', massaMuscular: '',
  massaOssea: '', proteina: '', minerais: '', agua: '', aguaPercent: '', visceral: '',
  metabolismo: '', idadeMetabolica: '', cintura: '', quadril: '',
}

/** '' → undefined; vírgula decimal aceita (é como se digita em pt-BR). */
function num(v: string): number | undefined {
  const t = v.trim().replace(',', '.')
  if (!t) return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

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

/** Série de UMA medida, pulando as leituras em que ela não foi registrada. */
function serie(leituras: BodyComposition[], campo: keyof BodyComposition, nome: string): VitalSeries {
  return {
    nome,
    pontos: leituras
      .filter(l => typeof l[campo] === 'number')
      .map(l => ({ rotulo: diaMes(l.medidoEm), valor: l[campo] as number })),
  }
}

/** O que a tela de fora pode pedir ao painel. */
export interface BodyCompositionHandle {
  /** Grava a avaliação em edição. Nada preenchido, resolve sem gravar — medir
   *  é opcional na sessão, e exigir número só para avançar faria inventar. */
  salvar: () => Promise<void>
}

interface BodyCompositionPanelProps {
  patientId: string
  professionalId?: string | null
  /** Esconde o "Registrar avaliação". Quem grava passa a ser a tela de fora,
   *  pelo `ref` — é o caso da etapa de um roteiro, que já tem o próprio Salvar. */
  semAcoes?: boolean
  /** Recorta o histórico exibido ao TRATAMENTO — mesmo princípio do
   *  Diagnóstico, dos Sinais vitais e dos Testes. Ausente = mostra a vida
   *  inteira do paciente (ex.: sem tratamento ativo, não há o que recortar). */
  carePlanId?: string
  ref?: Ref<BodyCompositionHandle>
}

export function BodyCompositionPanel({
  patientId, professionalId, semAcoes = false, carePlanId, ref,
}: BodyCompositionPanelProps) {
  const toast = useToast()
  const { data: leituras, isLoading } = useBodyCompositions(patientId)
  const { data: paciente } = usePatient(patientId)
  const registrar = useAddBodyComposition(patientId)
  const excluir = useRemoveBodyComposition(patientId)
  const [form, setForm] = useState<FormState>(VAZIO)
  const [fotos, setFotos] = useState<string[]>([])

  // A ALTURA VEM PREENCHIDA com a última conhecida, e continua editável.
  //
  // Sem isto quase nenhuma leitura teria IMC: altura se mede uma vez, peso toda
  // semana, e o IMC da linha só existe quando os dois estão NA MESMA leitura.
  // O adulto para de crescer; digitar de novo a cada sessão seria trabalho
  // repetido para um número que não muda.
  const [alturaCarregadaDe, setAlturaCarregadaDe] = useState<string | null>(null)
  if (paciente && alturaCarregadaDe !== patientId) {
    setAlturaCarregadaDe(patientId)
    if (paciente.heightCm != null) setForm(f => ({ ...f, altura: String(paciente.heightCm) }))
  }

  /** O que vai para o banco. Uma função só: os dois caminhos de gravação (o
   *  botão do painel e o "Salvar" do roteiro) não podem montar payloads
   *  diferentes. */
  function montarPayload() {
    return {
      patientId,
      professionalId,
      pesoKg: num(form.peso),
      alturaCm: num(form.altura),
      gorduraPercent: num(form.gordura),
      massaGorduraKg: num(form.massaGordura),
      massaMagraKg: num(form.massaMagra),
      massaMuscularKg: num(form.massaMuscular),
      massaOsseaKg: num(form.massaOssea),
      proteinaKg: num(form.proteina),
      mineraisKg: num(form.minerais),
      aguaCorporalL: num(form.agua),
      aguaPercent: num(form.aguaPercent),
      gorduraVisceral: num(form.visceral),
      taxaMetabolicaKcal: num(form.metabolismo),
      idadeMetabolica: num(form.idadeMetabolica),
      cinturaCm: num(form.cintura),
      quadrilCm: num(form.quadril),
      fotos,
    }
  }

  /** A altura sozinha não conta: ela vem de brinde do cadastro, e sem esta
   *  ressalva o botão nasceria habilitado gravando uma leitura que só repete o
   *  que já se sabia. Foto conta — uma avaliação só de imagem é registro
   *  legítimo de evolução postural. */
  const temConteudo = fotos.length > 0
    || (Object.keys(form) as (keyof FormState)[]).some(k => k !== 'altura' && form[k].trim() !== '')

  // ANTES do return de carregamento: hook depois de `return` condicional quebra
  // a ordem dos hooks entre renders.
  useImperativeHandle(ref, () => ({
    salvar: async () => {
      if (!temConteudo) return
      await registrar.mutateAsync(montarPayload())
      toast.success('Avaliação registrada.')
      setForm({ ...VAZIO, altura: form.altura })
      setFotos([])
    },
  }))

  if (isLoading) return <PageLoader />

  const todasAsLeituras = leituras ?? []
  const lista = carePlanId
    ? todasAsLeituras.filter(l => l.carePlanId === carePlanId)
    : todasAsLeituras
  const campo = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  // IMC da prévia: mesma conta da coluna gerada do banco, para a tela não
  // mostrar um número e o prontuário guardar outro.
  const pesoAgora = num(form.peso)
  const alturaAgora = num(form.altura)
  const imcPrevia = pesoAgora && alturaAgora && alturaAgora > 0
    ? pesoAgora / ((alturaAgora / 100) * (alturaAgora / 100))
    : null

  function salvar() {
    registrar.mutate(montarPayload(), {
      onSuccess: () => {
        toast.success('Avaliação registrada.')
        // A altura fica: é a mesma na próxima leitura.
        setForm({ ...VAZIO, altura: form.altura })
        setFotos([])
      },
      onError: (e: Error) => toast.error(e.message),
    })
  }

  return (
    <div className={styles.raiz}>
      <section className={styles.formulario}>
        {/* FOTOS PRIMEIRO: a avaliação começa pelo olhar. O fisioterapeuta
            fotografa a postura antes de subir na balança, e um bloco de fotos
            no fim do formulário obrigaria a rolar de volta para registrar o que
            se fez primeiro.

            Em cartão próprio porque é o único bloco que não é campo de número —
            sem a moldura, o baralho ficava solto entre grades de inputs. */}
        <section className={styles.cartaoFotos}>
          <header className={styles.fotosCabecalho}>
            <h3 className={styles.grupoTitulo}>Fotos da avaliação</h3>
            {/* A dica só aparece quando há o que girar: com uma foto, ela
                explicaria um gesto que não existe. */}
            {fotos.length > 1 && (
              <span className={styles.fotosDica}>Clique na pilha para ver as outras</span>
            )}
          </header>

          <PhotoUploader fotos={fotos} onChange={setFotos} pasta="body-composition" />
        </section>

        <div className={styles.grupo}>
          <h3 className={styles.grupoTitulo}>Antropometria</h3>
          <div className={styles.campos}>
            <Input label="Peso" hint="kg" inputMode="decimal" value={form.peso} onChange={campo('peso')} />
            <Input label="Altura" hint="cm" inputMode="decimal" value={form.altura} onChange={campo('altura')} />
            <Input label="Cintura" hint="cm" inputMode="decimal" value={form.cintura} onChange={campo('cintura')} />
            <Input label="Quadril" hint="cm" inputMode="decimal" value={form.quadril} onChange={campo('quadril')} />
          </div>
        </div>

        <div className={styles.grupo}>
          <h3 className={styles.grupoTitulo}>Composição corporal</h3>
          <div className={styles.campos}>
            <Input label="Gordura" hint="%" inputMode="decimal" value={form.gordura} onChange={campo('gordura')} />
            <Input label="Massa de gordura" hint="kg" inputMode="decimal" value={form.massaGordura} onChange={campo('massaGordura')} />
            <Input label="Massa magra" hint="kg" inputMode="decimal" value={form.massaMagra} onChange={campo('massaMagra')} />
            <Input label="Massa muscular" hint="kg" inputMode="decimal" value={form.massaMuscular} onChange={campo('massaMuscular')} />
            <Input label="Massa óssea" hint="kg" inputMode="decimal" value={form.massaOssea} onChange={campo('massaOssea')} />
            <Input label="Proteína" hint="kg" inputMode="decimal" value={form.proteina} onChange={campo('proteina')} />
            <Input label="Minerais" hint="kg" inputMode="decimal" value={form.minerais} onChange={campo('minerais')} />
          </div>
        </div>

        <div className={styles.grupo}>
          <h3 className={styles.grupoTitulo}>Hidratação e metabolismo</h3>
          <div className={styles.campos}>
            <Input label="Água corporal" hint="litros" inputMode="decimal" value={form.agua} onChange={campo('agua')} />
            <Input label="Água" hint="%" inputMode="decimal" value={form.aguaPercent} onChange={campo('aguaPercent')} />
            <Input label="Gordura visceral" hint="nível" inputMode="numeric" value={form.visceral} onChange={campo('visceral')} />
            <Input label="Metabolismo basal" hint="kcal" inputMode="numeric" value={form.metabolismo} onChange={campo('metabolismo')} />
            <Input label="Idade metabólica" hint="anos" inputMode="numeric" value={form.idadeMetabolica} onChange={campo('idadeMetabolica')} />
          </div>
        </div>

        <div className={styles.rodapeForm}>
          <span className={styles.previa}>
            {imcPrevia != null
              ? <>IMC desta leitura: <strong>{imcPrevia.toFixed(2)}</strong></>
              : 'Informe peso e altura para o IMC ser calculado.'}
          </span>
          {/* Some quando o roteiro assume: lá o "Salvar" do wizard é quem grava,
              e dois botões de salvar na mesma tela é a receita para gravar
              metade e achar que gravou tudo. */}
          {!semAcoes && (
            <Button onClick={salvar} loading={registrar.isPending} disabled={!temConteudo}>
              Registrar avaliação
            </Button>
          )}
        </div>
      </section>

      {lista.length === 0 ? (
        <p className={styles.vazio}>
          Nenhuma avaliação física registrada. A primeira vira o marco zero da
          comparação na alta.
        </p>
      ) : (
        <div className={styles.graficos}>
          <VitalSignChart
            titulo="Peso" unidade="kg" icone={<IconScale />} casas={1}
            series={[serie(lista, 'pesoKg', 'Peso')]}
          />
          <VitalSignChart
            titulo="IMC" unidade="kg/m²" icone={<IconRuler />} casas={1}
            faixaNormal={FAIXA_IMC}
            series={[serie(lista, 'imc', 'IMC')]}
          />
          <VitalSignChart
            titulo="Gordura corporal" unidade="%" icone={<IconDroplet />} casas={1}
            series={[serie(lista, 'gorduraPercent', 'Gordura')]}
          />
          <VitalSignChart
            titulo="Massa magra" unidade="kg" icone={<IconMuscle />} casas={1}
            series={[serie(lista, 'massaMagraKg', 'Massa magra')]}
          />
          <VitalSignChart
            titulo="Massa muscular" unidade="kg" icone={<IconMuscle />} casas={1}
            series={[serie(lista, 'massaMuscularKg', 'Massa muscular')]}
          />
          <VitalSignChart
            titulo="Metabolismo basal" unidade="kcal" icone={<IconBolt />}
            series={[serie(lista, 'taxaMetabolicaKcal', 'Metabolismo basal')]}
          />
        </div>
      )}

      {lista.length > 0 && (
        <section className={styles.historico}>
          <h3 className={styles.historicoTitulo}>Avaliações</h3>
          {/* Do mais NOVO para o mais antigo: o gráfico se lê da esquerda para
              a direita, a lista se lê de cima para baixo. */}
          <ul className={styles.lista}>
            {[...lista].reverse().map(l => (
              <li key={l.id} className={styles.item}>
                <span className={styles.quando}>{dataHora(l.medidoEm)}</span>
                <span className={styles.medidas}>
                  {l.pesoKg != null && <span><strong>{l.pesoKg.toFixed(1)}</strong> kg</span>}
                  {l.imc != null && <span>IMC <strong>{l.imc.toFixed(1)}</strong></span>}
                  {l.gorduraPercent != null && <span><strong>{l.gorduraPercent.toFixed(1)}</strong>% gordura</span>}
                  {l.massaMagraKg != null && <span><strong>{l.massaMagraKg.toFixed(1)}</strong> kg magra</span>}
                  {l.massaMuscularKg != null && <span><strong>{l.massaMuscularKg.toFixed(1)}</strong> kg músculo</span>}
                  {l.relacaoCinturaQuadril != null && <span>C/Q <strong>{l.relacaoCinturaQuadril.toFixed(2)}</strong></span>}
                  {l.taxaMetabolicaKcal != null && <span><strong>{l.taxaMetabolicaKcal}</strong> kcal</span>}
                </span>
                <button
                  type="button"
                  className={styles.remover}
                  aria-label={`Remover avaliação de ${dataHora(l.medidoEm)}`}
                  onClick={() => excluir.mutate(l.id, {
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
