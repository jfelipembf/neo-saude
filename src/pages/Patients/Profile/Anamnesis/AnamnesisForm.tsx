import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { useSalvarAnamnese } from '@/hooks/useAnamneses'
import type { EditAnamnesis } from '@/services/anamnesesService'
import type { Anamnesis } from '@/types/domain'
import { SECOES_ANAMNESE } from './questions'
import styles from './Anamnesis.module.scss'

/** Ficha em branco: as respostas fechadas começam na opção mais comum. */
const FICHA_VAZIA: EditAnamnesis = {
  medicamentos: 'nao',
  alergia: 'nao',
  pressao: 'normal',
  problemaCoracao: 'nao',
  faltaDeAr: 'nao',
  diabetes: 'nao',
  sangramento: 'normal',
  cicatrizacao: 'normal',
  cirurgia: 'nao',
  gestante: 'nao',
  reacaoAnestesia: 'nao',
  dorDentesGengiva: 'nao',
  gengivaSangra: 'nao',
  gostoRuimBocaSeca: 'nao',
  fioDental: 'diariamente',
  dorEstalosMaxilar: 'nao',
  rangeDentes: 'nao',
  feridaBolhaFace: 'nao',
  fuma: 'nao',
}

/** Tira a chave e a data (carimbada no service) — o resto é o rascunho editável. */
function rascunhoDaFicha(ficha: Anamnesis | null): EditAnamnesis {
  if (!ficha) return { ...FICHA_VAZIA }
  const rascunho: Record<string, unknown> = { ...ficha }
  delete rascunho.pacienteId
  delete rascunho.atualizadaEm
  return rascunho as EditAnamnesis
}

interface AnamnesisFormProps {
  pacienteId: string
  ficha: Anamnesis | null
  onFechar: () => void
}

/** Formulário da anamnese — as perguntas vêm de `questions.ts`, então incluir
 *  uma pergunta nova não exige mexer aqui. */
export function AnamnesisForm({ pacienteId, ficha, onFechar }: AnamnesisFormProps) {
  const toast = useToast()
  const { mutate: salvar, isPending: salvando } = useSalvarAnamnese(pacienteId)

  const [form, setForm] = useState<EditAnamnesis>(() => rascunhoDaFicha(ficha))

  function set(campo: keyof EditAnamnesis, valor: string) {
    setForm(atual => ({ ...atual, [campo]: valor }))
  }

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    salvar(form, {
      onSuccess: () => {
        toast.success('Anamnese salva!')
        onFechar()
      },
    })
  }

  return (
    <section className={styles.card} aria-label="Editar anamnese">
      <div className={styles.head}>
        <h2 className={styles.titulo}>{ficha ? 'Editar anamnese' : 'Preencher anamnese'}</h2>
      </div>

      <form className={styles.form} onSubmit={aoSalvar}>
        {SECOES_ANAMNESE.map(secao => (
          <section key={secao.titulo} className={styles.secao}>
            <h3 className={styles.secaoTitulo}>{secao.titulo}</h3>
            {secao.descricao && <p className={styles.secaoDica}>{secao.descricao}</p>}

            {secao.perguntas.map(p => {
              const valor = form[p.campo] ?? ''
              const mostraDetalhe = p.detalhe && p.detalhe.quando.includes(String(valor))

              return (
                <div key={p.campo} className={styles.campo}>
                  {p.tipo === 'opcoes' ? (
                    <>
                      <span className={styles.pergunta}>{p.pergunta}</span>
                      <SegmentedControl
                        options={p.opcoes!}
                        value={String(valor)}
                        onChange={v => set(p.campo, v)}
                      />
                    </>
                  ) : p.tipo === 'textoLongo' ? (
                    <Textarea
                      label={p.pergunta}
                      rows={2}
                      value={String(valor)}
                      onChange={e => set(p.campo, e.target.value)}
                    />
                  ) : (
                    <Input
                      label={p.pergunta}
                      value={String(valor)}
                      onChange={e => set(p.campo, e.target.value)}
                    />
                  )}

                  {/* Detalhe só aparece quando a resposta pede (ex.: "Qual?"). */}
                  {mostraDetalhe && (
                    <div className={styles.detalheCampo}>
                      <Input
                        label={p.detalhe!.label}
                        value={String(form[p.detalhe!.campo] ?? '')}
                        onChange={e => set(p.detalhe!.campo, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        ))}

        <div className={styles.formAcoes}>
          <Button variant="ghost" onClick={onFechar} disabled={salvando}>Cancelar</Button>
          <Button type="submit" loading={salvando}>Salvar anamnese</Button>
        </div>
      </form>
    </section>
  )
}
