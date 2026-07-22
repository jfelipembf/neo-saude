import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { IconEdit } from '@/components/icons'
import type { Professional } from '@/types/domain'
import shared from '../shared/profile.module.scss'
import styles from './Curriculum.module.scss'

/** Nenhuma seção do currículo preenchida ainda. */
function isCurriculumEmpty(p: Professional) {
  return !p.specializations?.length && !p.education?.length &&
    !p.experiences?.length && !p.courses?.length && !p.languages?.length
}

interface CurriculumCardProps {
  professional: Professional
  onEdit: () => void
}

/** Aba "Currículo" em modo leitura: especializações, formação, experiência,
 *  cursos e idiomas. */
export function CurriculumCard({ professional, onEdit }: CurriculumCardProps) {
  return (
    <section className={shared.formCard} aria-label="Currículo do profissional">
      <div className={shared.detalheHead}>
        <h2 className={shared.formTitulo}>Currículo</h2>
        <Button variant="outline" size="sm" iconLeft={<IconEdit />} onClick={onEdit}>
          Editar
        </Button>
      </div>

      {isCurriculumEmpty(professional) ? (
        <EmptyState
          title="Currículo ainda não preenchido"
          description="Adicione as especializações, a formação acadêmica e a experiência do profissional."
          action={
            <Button iconLeft={<IconEdit />} onClick={onEdit}>
              Preencher currículo
            </Button>
          }
        />
      ) : (
        <>
          {(professional.specializations?.length ?? 0) > 0 && (
            <section className={shared.formSection}>
              <h3>Especializações</h3>
              <div className={shared.chips}>
                {professional.specializations!.map(e => (
                  <span key={e} className={shared.chip}>{e}</span>
                ))}
              </div>
            </section>
          )}

          {(professional.education?.length ?? 0) > 0 && (
            <section className={shared.formSection}>
              <h3>Formação acadêmica</h3>
              <ul className={styles.cvLista}>
                {professional.education!.map((f, i) => (
                  <li key={`${f.course}-${i}`} className={styles.cvItem}>
                    <span className={styles.cvItemTitulo}>{f.course}</span>
                    <span className={styles.cvItemMeta}>
                      {[f.institution, f.year].filter(Boolean).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(professional.experiences?.length ?? 0) > 0 && (
            <section className={shared.formSection}>
              <h3>Experiência profissional</h3>
              <ul className={styles.cvLista}>
                {professional.experiences!.map((x, i) => (
                  <li key={`${x.position}-${i}`} className={styles.cvItem}>
                    <span className={styles.cvItemTitulo}>{x.position}</span>
                    <span className={styles.cvItemMeta}>
                      {[x.workplace, x.period].filter(Boolean).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(professional.courses?.length ?? 0) > 0 && (
            <section className={shared.formSection}>
              <h3>Cursos e certificações</h3>
              <ul className={styles.cvLista}>
                {professional.courses!.map((c, i) => (
                  <li key={`${c}-${i}`} className={styles.cvItem}>
                    <span className={styles.cvItemTitulo}>{c}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(professional.languages?.length ?? 0) > 0 && (
            <section className={shared.formSection}>
              <h3>Idiomas</h3>
              <div className={shared.chips}>
                {professional.languages!.map(i => (
                  <span key={i} className={shared.chip}>{i}</span>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  )
}
