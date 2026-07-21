import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { useToast } from '@/components/Toast/useToast'
import { IconX, IconMais } from '@/components/icons'
import { useAtualizarProfissional } from '@/hooks/useProfissionais'
import type { ExperienceItem, EducationItem, Professional } from '@/types/domain'
import shared from '../shared/profile.module.scss'
import styles from './Curriculum.module.scss'

/** Rascunho do currículo (padrão dos perfis de saúde: especializações,
 *  formação, experiência, cursos e idiomas). */
interface FormCurriculo {
  especializacoes: string[]
  formacao: EducationItem[]
  experiencias: ExperienceItem[]
  cursos: string[]
  idiomas: string[]
}

function curriculoDoProfissional(p: Professional): FormCurriculo {
  return {
    especializacoes: p.especializacoes ?? [],
    formacao: p.formacao ?? [],
    experiencias: p.experiencias ?? [],
    cursos: p.cursos ?? [],
    idiomas: p.idiomas ?? [],
  }
}

interface CurriculumFormProps {
  profissional: Professional
  onFechar: () => void
}

/** Aba "Currículo" em modo edição. O rascunho nasce do cadastro salvo a cada
 *  montagem — fechar/trocar de aba descarta o que não foi salvo. */
export function CurriculumForm({ profissional, onFechar }: CurriculumFormProps) {
  const toast = useToast()
  const { mutate: salvar, isPending: salvando } = useAtualizarProfissional()

  const [form, setForm] = useState<FormCurriculo>(() => curriculoDoProfissional(profissional))
  const [novaEspecializacao, setNovaEspecializacao] = useState('')
  const [novoIdioma, setNovoIdioma] = useState('')

  const set = <K extends keyof FormCurriculo>(campo: K) => (valor: FormCurriculo[K]) => {
    setForm(atual => ({ ...atual, [campo]: valor }))
  }

  /** Acrescenta um item de texto à lista de chips, sem duplicar. */
  function adicionarChip(
    campo: 'especializacoes' | 'idiomas',
    texto: string,
    limpar: () => void,
  ) {
    const novo = texto.trim()
    if (!novo || form[campo].includes(novo)) return
    set(campo)([...form[campo], novo])
    limpar()
  }

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    salvar(
      {
        id: profissional.id,
        dados: {
          especializacoes: form.especializacoes,
          formacao: form.formacao
            .map(f => ({ curso: f.curso.trim(), instituicao: f.instituicao.trim(), ano: f.ano.trim() }))
            .filter(f => f.curso),
          experiencias: form.experiencias
            .map(x => ({ cargo: x.cargo.trim(), local: x.local.trim(), periodo: x.periodo.trim() }))
            .filter(x => x.cargo),
          cursos: form.cursos.map(c => c.trim()).filter(Boolean),
          idiomas: form.idiomas,
        },
      },
      {
        onSuccess: () => {
          toast.success('Currículo atualizado!')
          onFechar()
        },
      },
    )
  }

  return (
    <section className={shared.formCard} aria-label="Editar currículo">
      <h2 className={shared.formTitulo}>Editar currículo</h2>

      <form className={shared.form} onSubmit={aoSalvar}>
        {/* Especializações / áreas de atuação (chips). */}
        <section className={shared.formSection}>
          <h3>Especializações</h3>
          <div className={shared.chips}>
            {form.especializacoes.map(e => (
              <button
                key={e}
                type="button"
                className={styles.chipRemovivel}
                onClick={() => set('especializacoes')(form.especializacoes.filter(x => x !== e))}
                title="Remover especialização"
              >
                {e} <IconX />
              </button>
            ))}
          </div>
          <div className={styles.novaChip}>
            <Input
              placeholder="Ex: Endodontia"
              value={novaEspecializacao}
              onChange={e => setNovaEspecializacao(e.target.value)}
              onKeyDown={e => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                adicionarChip('especializacoes', novaEspecializacao, () => setNovaEspecializacao(''))
              }}
              aria-label="Nova especialização"
            />
            <Button
              variant="outline"
              disabled={!novaEspecializacao.trim()}
              onClick={() => adicionarChip('especializacoes', novaEspecializacao, () => setNovaEspecializacao(''))}
            >
              + Adicionar
            </Button>
          </div>
        </section>

        {/* Formação acadêmica (curso · instituição · ano). */}
        <section className={shared.formSection}>
          <h3>Formação acadêmica</h3>
          {form.formacao.map((f, i) => (
            <div key={i} className={styles.cvLinha}>
              <Input
                placeholder="Curso — ex: Especialização em Endodontia"
                value={f.curso}
                onChange={e => set('formacao')(form.formacao.map((x, j) => (j === i ? { ...x, curso: e.target.value } : x)))}
                aria-label={`Curso da formação ${i + 1}`}
              />
              <Input
                placeholder="Instituição"
                value={f.instituicao}
                onChange={e => set('formacao')(form.formacao.map((x, j) => (j === i ? { ...x, instituicao: e.target.value } : x)))}
                aria-label={`Instituição da formação ${i + 1}`}
              />
              <Input
                placeholder="Ano"
                inputMode="numeric"
                maxLength={4}
                value={f.ano}
                onChange={e => set('formacao')(form.formacao.map((x, j) => (j === i ? { ...x, ano: e.target.value } : x)))}
                aria-label={`Ano da formação ${i + 1}`}
              />
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconX />}
                onClick={() => set('formacao')(form.formacao.filter((_, j) => j !== i))}
                title="Remover formação"
                aria-label={`Remover formação ${i + 1}`}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            iconLeft={<IconMais />}
            className={styles.cvAdicionar}
            onClick={() => set('formacao')([...form.formacao, { curso: '', instituicao: '', ano: '' }])}
          >
            Adicionar formação
          </Button>
        </section>

        {/* Experiência profissional (cargo · local · período). */}
        <section className={shared.formSection}>
          <h3>Experiência profissional</h3>
          {form.experiencias.map((x, i) => (
            <div key={i} className={styles.cvLinha}>
              <Input
                placeholder="Cargo — ex: Cirurgiã-dentista"
                value={x.cargo}
                onChange={e => set('experiencias')(form.experiencias.map((y, j) => (j === i ? { ...y, cargo: e.target.value } : y)))}
                aria-label={`Cargo da experiência ${i + 1}`}
              />
              <Input
                placeholder="Local — ex: Clínica Sorrir — Aracaju/SE"
                value={x.local}
                onChange={e => set('experiencias')(form.experiencias.map((y, j) => (j === i ? { ...y, local: e.target.value } : y)))}
                aria-label={`Local da experiência ${i + 1}`}
              />
              <Input
                placeholder="Período — ex: 2019 – atual"
                value={x.periodo}
                onChange={e => set('experiencias')(form.experiencias.map((y, j) => (j === i ? { ...y, periodo: e.target.value } : y)))}
                aria-label={`Período da experiência ${i + 1}`}
              />
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconX />}
                onClick={() => set('experiencias')(form.experiencias.filter((_, j) => j !== i))}
                title="Remover experiência"
                aria-label={`Remover experiência ${i + 1}`}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            iconLeft={<IconMais />}
            className={styles.cvAdicionar}
            onClick={() => set('experiencias')([...form.experiencias, { cargo: '', local: '', periodo: '' }])}
          >
            Adicionar experiência
          </Button>
        </section>

        {/* Cursos e certificações (texto livre, um por linha). */}
        <section className={shared.formSection}>
          <h3>Cursos e certificações</h3>
          {form.cursos.map((c, i) => (
            <div key={i} className={styles.cvLinhaSimples}>
              <Input
                placeholder="Ex: ACLS — Suporte Avançado de Vida (2023)"
                value={c}
                onChange={e => set('cursos')(form.cursos.map((x, j) => (j === i ? e.target.value : x)))}
                aria-label={`Curso ou certificação ${i + 1}`}
              />
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconX />}
                onClick={() => set('cursos')(form.cursos.filter((_, j) => j !== i))}
                title="Remover curso"
                aria-label={`Remover curso ${i + 1}`}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            iconLeft={<IconMais />}
            className={styles.cvAdicionar}
            onClick={() => set('cursos')([...form.cursos, ''])}
          >
            Adicionar curso
          </Button>
        </section>

        {/* Idiomas (chips). */}
        <section className={shared.formSection}>
          <h3>Idiomas</h3>
          <div className={shared.chips}>
            {form.idiomas.map(i => (
              <button
                key={i}
                type="button"
                className={styles.chipRemovivel}
                onClick={() => set('idiomas')(form.idiomas.filter(x => x !== i))}
                title="Remover idioma"
              >
                {i} <IconX />
              </button>
            ))}
          </div>
          <div className={styles.novaChip}>
            <Input
              placeholder="Ex: Inglês"
              value={novoIdioma}
              onChange={e => setNovoIdioma(e.target.value)}
              onKeyDown={e => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                adicionarChip('idiomas', novoIdioma, () => setNovoIdioma(''))
              }}
              aria-label="Novo idioma"
            />
            <Button
              variant="outline"
              disabled={!novoIdioma.trim()}
              onClick={() => adicionarChip('idiomas', novoIdioma, () => setNovoIdioma(''))}
            >
              + Adicionar
            </Button>
          </div>
        </section>

        <div className={shared.formAcoes}>
          <Button variant="ghost" onClick={onFechar} disabled={salvando}>Cancelar</Button>
          <Button type="submit" loading={salvando}>Salvar currículo</Button>
        </div>
      </form>
    </section>
  )
}
