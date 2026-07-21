import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { IconEditar } from '@/components/icons'
import type { Professional } from '@/types/domain'
import shared from '../shared/profile.module.scss'
import styles from './Curriculum.module.scss'

/** Nenhuma seção do currículo preenchida ainda. */
function curriculoVazio(p: Professional) {
  return !p.especializacoes?.length && !p.formacao?.length &&
    !p.experiencias?.length && !p.cursos?.length && !p.idiomas?.length
}

interface CurriculumCardProps {
  profissional: Professional
  onEditar: () => void
}

/** Aba "Currículo" em modo leitura: especializações, formação, experiência,
 *  cursos e idiomas. */
export function CurriculumCard({ profissional, onEditar }: CurriculumCardProps) {
  return (
    <section className={shared.formCard} aria-label="Currículo do profissional">
      <div className={shared.detalheHead}>
        <h2 className={shared.formTitulo}>Currículo</h2>
        <Button variant="outline" size="sm" iconLeft={<IconEditar />} onClick={onEditar}>
          Editar
        </Button>
      </div>

      {curriculoVazio(profissional) ? (
        <EmptyState
          title="Currículo ainda não preenchido"
          description="Adicione as especializações, a formação acadêmica e a experiência do profissional."
          action={
            <Button iconLeft={<IconEditar />} onClick={onEditar}>
              Preencher currículo
            </Button>
          }
        />
      ) : (
        <>
          {(profissional.especializacoes?.length ?? 0) > 0 && (
            <section className={shared.formSection}>
              <h3>Especializações</h3>
              <div className={shared.chips}>
                {profissional.especializacoes!.map(e => (
                  <span key={e} className={shared.chip}>{e}</span>
                ))}
              </div>
            </section>
          )}

          {(profissional.formacao?.length ?? 0) > 0 && (
            <section className={shared.formSection}>
              <h3>Formação acadêmica</h3>
              <ul className={styles.cvLista}>
                {profissional.formacao!.map((f, i) => (
                  <li key={`${f.curso}-${i}`} className={styles.cvItem}>
                    <span className={styles.cvItemTitulo}>{f.curso}</span>
                    <span className={styles.cvItemMeta}>
                      {[f.instituicao, f.ano].filter(Boolean).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(profissional.experiencias?.length ?? 0) > 0 && (
            <section className={shared.formSection}>
              <h3>Experiência profissional</h3>
              <ul className={styles.cvLista}>
                {profissional.experiencias!.map((x, i) => (
                  <li key={`${x.cargo}-${i}`} className={styles.cvItem}>
                    <span className={styles.cvItemTitulo}>{x.cargo}</span>
                    <span className={styles.cvItemMeta}>
                      {[x.local, x.periodo].filter(Boolean).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(profissional.cursos?.length ?? 0) > 0 && (
            <section className={shared.formSection}>
              <h3>Cursos e certificações</h3>
              <ul className={styles.cvLista}>
                {profissional.cursos!.map((c, i) => (
                  <li key={`${c}-${i}`} className={styles.cvItem}>
                    <span className={styles.cvItemTitulo}>{c}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(profissional.idiomas?.length ?? 0) > 0 && (
            <section className={shared.formSection}>
              <h3>Idiomas</h3>
              <div className={shared.chips}>
                {profissional.idiomas!.map(i => (
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
