import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { useToast } from '@/components/Toast/useToast'
import { IconX, IconPlus } from '@/components/icons'
import { useUpdateProfessional } from '@/hooks/useProfessionals'
import type { ExperienceItem, EducationItem, Professional } from '@/types/domain'
import shared from '../shared/profile.module.scss'
import styles from './Curriculum.module.scss'

/** Rascunho do currículo (padrão dos perfis de saúde: especializações,
 *  formação, experiência, cursos e idiomas). */
interface CurriculumFormState {
  specializations: string[]
  education: EducationItem[]
  experiences: ExperienceItem[]
  courses: string[]
  languages: string[]
}

function curriculumFromProfessional(p: Professional): CurriculumFormState {
  return {
    specializations: p.specializations ?? [],
    education: p.education ?? [],
    experiences: p.experiences ?? [],
    courses: p.courses ?? [],
    languages: p.languages ?? [],
  }
}

interface CurriculumFormProps {
  professional: Professional
  onClose: () => void
}

/** Aba "Currículo" em modo edição. O rascunho nasce do cadastro salvo a cada
 *  montagem — fechar/trocar de aba descarta o que não foi salvo. */
export function CurriculumForm({ professional, onClose }: CurriculumFormProps) {
  const toast = useToast()
  const { mutate: save, isPending: saving } = useUpdateProfessional()

  const [form, setForm] = useState<CurriculumFormState>(() => curriculumFromProfessional(professional))
  const [newSpecialization, setNewSpecialization] = useState('')
  const [newLanguage, setNewLanguage] = useState('')

  const set = <K extends keyof CurriculumFormState>(field: K) => (value: CurriculumFormState[K]) => {
    setForm(current => ({ ...current, [field]: value }))
  }

  /** Acrescenta um item de texto à lista de chips, sem duplicar. */
  function addChip(
    field: 'specializations' | 'languages',
    text: string,
    clear: () => void,
  ) {
    const trimmed = text.trim()
    if (!trimmed || form[field].includes(trimmed)) return
    set(field)([...form[field], trimmed])
    clear()
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    save(
      {
        id: professional.id,
        payload: {
          specializations: form.specializations,
          education: form.education
            .map(f => ({ course: f.course.trim(), institution: f.institution.trim(), year: f.year.trim() }))
            .filter(f => f.course),
          experiences: form.experiences
            .map(x => ({ position: x.position.trim(), workplace: x.workplace.trim(), period: x.period.trim() }))
            .filter(x => x.position),
          courses: form.courses.map(c => c.trim()).filter(Boolean),
          languages: form.languages,
        },
      },
      {
        onSuccess: () => {
          toast.success('Currículo atualizado!')
          onClose()
        },
      },
    )
  }

  return (
    <section className={shared.formCard} aria-label="Editar currículo">
      <h2 className={shared.formTitulo}>Editar currículo</h2>

      <form className={shared.form} onSubmit={handleSave}>
        {/* Especializações / áreas de atuação (chips). */}
        <section className={shared.formSection}>
          <h3>Especializações</h3>
          <div className={shared.chips}>
            {form.specializations.map(e => (
              <button
                key={e}
                type="button"
                className={styles.chipRemovivel}
                onClick={() => set('specializations')(form.specializations.filter(x => x !== e))}
                title="Remover especialização"
              >
                {e} <IconX />
              </button>
            ))}
          </div>
          <div className={styles.novaChip}>
            <Input
              placeholder="Ex: Endodontia"
              value={newSpecialization}
              onChange={e => setNewSpecialization(e.target.value)}
              onKeyDown={e => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                addChip('specializations', newSpecialization, () => setNewSpecialization(''))
              }}
              aria-label="Nova especialização"
            />
            <Button
              variant="outline"
              disabled={!newSpecialization.trim()}
              onClick={() => addChip('specializations', newSpecialization, () => setNewSpecialization(''))}
            >
              + Adicionar
            </Button>
          </div>
        </section>

        {/* Formação acadêmica (curso · instituição · ano). */}
        <section className={shared.formSection}>
          <h3>Formação acadêmica</h3>
          {form.education.map((f, i) => (
            <div key={i} className={styles.cvLinha}>
              <Input
                placeholder="Curso — ex: Especialização em Endodontia"
                value={f.course}
                onChange={e => set('education')(form.education.map((x, j) => (j === i ? { ...x, course: e.target.value } : x)))}
                aria-label={`Curso da formação ${i + 1}`}
              />
              <Input
                placeholder="Instituição"
                value={f.institution}
                onChange={e => set('education')(form.education.map((x, j) => (j === i ? { ...x, institution: e.target.value } : x)))}
                aria-label={`Instituição da formação ${i + 1}`}
              />
              <Input
                placeholder="Ano"
                inputMode="numeric"
                maxLength={4}
                value={f.year}
                onChange={e => set('education')(form.education.map((x, j) => (j === i ? { ...x, year: e.target.value } : x)))}
                aria-label={`Ano da formação ${i + 1}`}
              />
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconX />}
                onClick={() => set('education')(form.education.filter((_, j) => j !== i))}
                title="Remover formação"
                aria-label={`Remover formação ${i + 1}`}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            iconLeft={<IconPlus />}
            className={styles.cvAdicionar}
            onClick={() => set('education')([...form.education, { course: '', institution: '', year: '' }])}
          >
            Adicionar formação
          </Button>
        </section>

        {/* Experiência profissional (cargo · local · período). */}
        <section className={shared.formSection}>
          <h3>Experiência profissional</h3>
          {form.experiences.map((x, i) => (
            <div key={i} className={styles.cvLinha}>
              <Input
                placeholder="Cargo — ex: Cirurgiã-dentista"
                value={x.position}
                onChange={e => set('experiences')(form.experiences.map((y, j) => (j === i ? { ...y, position: e.target.value } : y)))}
                aria-label={`Cargo da experiência ${i + 1}`}
              />
              <Input
                placeholder="Local — ex: Clínica Sorrir — Aracaju/SE"
                value={x.workplace}
                onChange={e => set('experiences')(form.experiences.map((y, j) => (j === i ? { ...y, workplace: e.target.value } : y)))}
                aria-label={`Local da experiência ${i + 1}`}
              />
              <Input
                placeholder="Período — ex: 2019 – atual"
                value={x.period}
                onChange={e => set('experiences')(form.experiences.map((y, j) => (j === i ? { ...y, period: e.target.value } : y)))}
                aria-label={`Período da experiência ${i + 1}`}
              />
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconX />}
                onClick={() => set('experiences')(form.experiences.filter((_, j) => j !== i))}
                title="Remover experiência"
                aria-label={`Remover experiência ${i + 1}`}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            iconLeft={<IconPlus />}
            className={styles.cvAdicionar}
            onClick={() => set('experiences')([...form.experiences, { position: '', workplace: '', period: '' }])}
          >
            Adicionar experiência
          </Button>
        </section>

        {/* Cursos e certificações (texto livre, um por linha). */}
        <section className={shared.formSection}>
          <h3>Cursos e certificações</h3>
          {form.courses.map((c, i) => (
            <div key={i} className={styles.cvLinhaSimples}>
              <Input
                placeholder="Ex: ACLS — Suporte Avançado de Vida (2023)"
                value={c}
                onChange={e => set('courses')(form.courses.map((x, j) => (j === i ? e.target.value : x)))}
                aria-label={`Curso ou certificação ${i + 1}`}
              />
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconX />}
                onClick={() => set('courses')(form.courses.filter((_, j) => j !== i))}
                title="Remover curso"
                aria-label={`Remover curso ${i + 1}`}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            iconLeft={<IconPlus />}
            className={styles.cvAdicionar}
            onClick={() => set('courses')([...form.courses, ''])}
          >
            Adicionar curso
          </Button>
        </section>

        {/* Idiomas (chips). */}
        <section className={shared.formSection}>
          <h3>Idiomas</h3>
          <div className={shared.chips}>
            {form.languages.map(i => (
              <button
                key={i}
                type="button"
                className={styles.chipRemovivel}
                onClick={() => set('languages')(form.languages.filter(x => x !== i))}
                title="Remover idioma"
              >
                {i} <IconX />
              </button>
            ))}
          </div>
          <div className={styles.novaChip}>
            <Input
              placeholder="Ex: Inglês"
              value={newLanguage}
              onChange={e => setNewLanguage(e.target.value)}
              onKeyDown={e => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                addChip('languages', newLanguage, () => setNewLanguage(''))
              }}
              aria-label="Novo idioma"
            />
            <Button
              variant="outline"
              disabled={!newLanguage.trim()}
              onClick={() => addChip('languages', newLanguage, () => setNewLanguage(''))}
            >
              + Adicionar
            </Button>
          </div>
        </section>

        <div className={shared.formAcoes}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" loading={saving}>Salvar currículo</Button>
        </div>
      </form>
    </section>
  )
}
