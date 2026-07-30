import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { RichTextEditor } from '@/components/RichTextEditor/RichTextEditor'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/Toast'
import { IconTrash } from '@/components/icons'
import { useCreateNoteTemplate, useDeleteNoteTemplate, useNoteTemplates } from '@/hooks/useMedicalNote'
import { MEDICAL_NOTE_SECTIONS } from '@/services/medicalNoteService'
import type { MedicalNote, MedicalNoteSection, NoteTemplate } from '@/services/medicalNoteService'
import { errorMessage } from '@/utils/errors'
import { calcularImc, faixaDoImc, imcPorExtenso } from '@/utils/bmi'
import styles from '../Med.module.scss'
import { SafeHtml } from '@/components/SafeHtml/SafeHtml'

interface MedicalNoteFormProps {
  note: MedicalNote
  onChangeNote: (note: MedicalNote) => void
  peso: string
  altura: string
  onChangePeso: (v: string) => void
  onChangeAltura: (v: string) => void
}

/**
 * A FICHA DA CONSULTA, por seções.
 *
 * Substitui o editor de texto livre único que ficava aqui. Seção nomeada não é
 * burocracia: é o que permite ao médico comparar o exame físico de hoje com o
 * de março sem reler duas paredes de texto — e é o que a timeline da esquerda
 * usa para mostrar o que mudou.
 *
 * Queixa e diagnóstico são campos SIMPLES de propósito. São uma linha cada, e
 * uma barra de formatação em cima de "cefaleia há 3 dias" é ruído.
 */
export function MedicalNoteForm({
  note, onChangeNote, peso, altura, onChangePeso, onChangeAltura,
}: MedicalNoteFormProps) {
  const toast = useToast()
  const { data: modelos } = useNoteTemplates()
  const { mutate: criarModelo, isPending: salvandoModelo } = useCreateNoteTemplate()
  const { mutate: excluirModelo } = useDeleteNoteTemplate()

  /** Seção cujo "Salvar modelo" está aberto. */
  const [salvando, setSalvando] = useState<MedicalNoteSection | null>(null)
  const [nomeModelo, setNomeModelo] = useState('')
  /** Seção cujo "Usar modelo" está aberto. */
  const [escolhendo, setEscolhendo] = useState<MedicalNoteSection | null>(null)
  const [aExcluir, setAExcluir] = useState<NoteTemplate | null>(null)

  const set = (secao: MedicalNoteSection) => (valor: string) =>
    onChangeNote({ ...note, [secao]: valor })

  const modelosDe = (secao: MedicalNoteSection) => (modelos ?? []).filter(m => m.section === secao)

  const imc = calcularImc(Number(peso.replace(',', '.')), Number(altura.replace(',', '.')))
  const faixa = faixaDoImc(imc)

  return (
    <div className={styles.ficha}>
      {MEDICAL_NOTE_SECTIONS.map(secao => (
        <section key={secao.key} className={styles.fichaSecao}>
          <div className={styles.fichaCabecalho}>
            <h3 className={styles.fichaTitulo}>{secao.label}</h3>

            {/* Modelos só nas seções RICAS: queixa e diagnóstico são de uma
                linha, e um catálogo de modelos para "cefaleia" não se paga. */}
            {secao.rico && (
              <div className={styles.fichaAcoes}>
                <Button
                  size="sm" variant="ghost"
                  disabled={!temTexto(note[secao.key])}
                  title={!temTexto(note[secao.key]) ? 'Escreva algo antes de salvar como modelo' : undefined}
                  onClick={() => { setSalvando(secao.key); setNomeModelo('') }}
                >
                  Salvar modelo
                </Button>
                <Button
                  size="sm" variant="ghost"
                  disabled={modelosDe(secao.key).length === 0}
                  title={modelosDe(secao.key).length === 0 ? 'Nenhum modelo salvo nesta seção' : undefined}
                  onClick={() => setEscolhendo(secao.key)}
                >
                  Usar modelo
                </Button>
              </div>
            )}
          </div>

          {secao.rico ? (
            <RichTextEditor
              value={note[secao.key] ?? ''}
              onChange={set(secao.key)}
              placeholder={PLACEHOLDER[secao.key]}
            />
          ) : (
            <Textarea
              rows={2}
              value={note[secao.key] ?? ''}
              onChange={e => set(secao.key)(e.target.value)}
              placeholder={PLACEHOLDER[secao.key]}
              aria-label={secao.label}
            />
          )}

          {/* O IMC entra DEPOIS do exame físico: peso e altura são medida de
              exame, e é ali que o médico está quando pega a balança. */}
          {secao.key === 'exame_fisico' && (
            <div className={styles.imc}>
              <div className={styles.imcCampos}>
                <Input
                  label="Peso" type="number" min={0} max={500} step="0.1"
                  iconRight={<span className={styles.imcUnidade}>kg</span>}
                  value={peso}
                  onChange={e => onChangePeso(e.target.value)}
                />
                <Input
                  label="Altura" type="number" min={30} max={250} step="1"
                  iconRight={<span className={styles.imcUnidade}>cm</span>}
                  value={altura}
                  onChange={e => onChangeAltura(e.target.value)}
                />
              </div>
              <div className={styles.imcResultado}>
                <span className={styles.imcRotulo}>IMC</span>
                <strong className={styles.imcValor}>{imcPorExtenso(imc)}</strong>
                {faixa && <span className={styles[`imcFaixa--${faixa.tom}`]}>{faixa.rotulo}</span>}
                {/* A referência fica dita: OMS é para adulto, e idoso tem outro
                    ponto de corte. Quem lê precisa saber contra o que está
                    comparando. */}
                {faixa && <span className={styles.imcFonte}>faixas da OMS (adulto)</span>}
              </div>
            </div>
          )}
        </section>
      ))}

      {/* ── Salvar modelo ── */}
      <Modal
        open={salvando !== null}
        onClose={() => setSalvando(null)}
        title="Salvar como modelo"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSalvando(null)} disabled={salvandoModelo}>Cancelar</Button>
            <Button
              loading={salvandoModelo}
              disabled={!nomeModelo.trim()}
              onClick={() => {
                if (!salvando) return
                criarModelo(
                  { section: salvando, name: nomeModelo, body: note[salvando] ?? '' },
                  {
                    onSuccess: () => { toast.success('Modelo salvo.'); setSalvando(null) },
                    onError: e => toast.error(errorMessage(e, 'Não foi possível salvar o modelo.')),
                  },
                )
              }}
            >
              Salvar
            </Button>
          </>
        }
      >
        <div className={styles.formDocumento}>
          <Input
            label="Nome do modelo"
            placeholder="Ex.: Exame físico normal, HMA de cefaleia…"
            value={nomeModelo}
            onChange={e => setNomeModelo(e.target.value)}
          />
          <p className={styles.vazio}>
            Guarda o texto desta seção como está agora. Usar o modelo depois
            copia o texto — editar o modelo em 2027 não reescreve o que foi
            registrado hoje.
          </p>
        </div>
      </Modal>

      {/* ── Usar modelo ── */}
      <Modal
        open={escolhendo !== null}
        onClose={() => setEscolhendo(null)}
        title="Usar modelo"
      >
        <ul className={styles.modelos}>
          {escolhendo && modelosDe(escolhendo).map(m => (
            <li key={m.id} className={styles.modelo}>
              <button
                type="button"
                className={styles.modeloBotao}
                onClick={() => {
                  // ACRESCENTA quando já há texto, em vez de sobrescrever: o
                  // médico costuma aplicar o modelo depois de já ter digitado
                  // algo, e perder isso num clique é imperdoável.
                  const atual = note[escolhendo] ?? ''
                  set(escolhendo)(temTexto(atual) ? `${atual}${m.body}` : m.body)
                  setEscolhendo(null)
                }}
              >
                <strong>{m.name}</strong>
                <SafeHtml html={m.body} className={styles.modeloPreview} />
              </button>
              <Button
                variant="ghost" size="sm" iconLeft={<IconTrash />}
                aria-label={`Excluir modelo ${m.name}`}
                onClick={() => setAExcluir(m)}
              />
            </li>
          ))}
        </ul>
      </Modal>

      <ConfirmDialog
        open={aExcluir !== null}
        onClose={() => setAExcluir(null)}
        onConfirm={() => {
          if (!aExcluir) return
          excluirModelo(aExcluir.id, {
            onSuccess: () => toast.success('Modelo excluído.'),
            onError: e => toast.error(errorMessage(e, 'Não foi possível excluir.')),
          })
          setAExcluir(null)
        }}
        title="Excluir modelo?"
        message={`"${aExcluir?.name ?? ''}" sai da lista para toda a clínica. As consultas já registradas com ele não mudam — o modelo é copiado no momento do uso.`}
        variant="danger"
        confirmLabel="Excluir"
      />
    </div>
  )
}

/** `<p></p>` é o vazio do editor rico — sem isto, "Salvar modelo" ficaria
 *  habilitado numa seção em branco. */
function temTexto(html: string | undefined): boolean {
  const t = (html ?? '').replace(/<[^>]*>/g, '').trim()
  return t.length > 0
}

const PLACEHOLDER: Record<MedicalNoteSection, string> = {
  queixa:       'O motivo da consulta, nas palavras do paciente',
  hma:          'Início, evolução, fatores de melhora e piora, sintomas associados…',
  antecedentes: 'Doenças prévias, cirurgias, medicações em uso, alergias, história familiar…',
  exame_fisico: 'Estado geral, sinais vitais, exame dos sistemas…',
  diagnostico:  'Hipótese diagnóstica ou diagnóstico definido',
  condutas:     'Prescrição, exames solicitados, orientações, retorno…',
}
