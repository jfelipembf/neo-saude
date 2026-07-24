import type { ClinicSpecialty } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// Filtro por RAMO DE ATUAÇÃO (clinic.specialty). Ortogonal ao gate de cargo/plano
// (canView): uma aba/página aparece só se passar nos DOIS — o cargo pode ver E o
// ramo usa a tela. Aqui mora só o filtro por ramo.
//
// É filtro de UX/PRODUTO, não de segurança: esconder uma aba não protege dado —
// a parede real continua sendo a RLS/features do backend.
// ─────────────────────────────────────────────────────────────────────────────

/** Item que pode ser restrito a ramos. Sem regra = NÚCLEO (todo ramo). */
export interface SpecialtyScoped {
  /** Allowlist: o item aparece SÓ nesses ramos. Ausente = todos. */
  specialties?: ClinicSpecialty[]
  /** Denylist: o item aparece em todos MENOS esses ramos (ex.: esconder no odonto). */
  excludeSpecialties?: ClinicSpecialty[]
}

/**
 * O item aplica-se ao ramo da clínica?
 * - ramo indefinido (sessão carregando / mock) → não esconde nada;
 * - na denylist (`excludeSpecialties`) → não aplica;
 * - com `specialties` → só se o ramo estiver na lista;
 * - sem nenhuma regra → núcleo (sempre aplica).
 */
export function appliesToSpecialty(specialty: ClinicSpecialty | undefined, item: SpecialtyScoped): boolean {
  if (!specialty) return true
  if (item.excludeSpecialties?.includes(specialty)) return false
  if (item.specialties) return item.specialties.includes(specialty)
  return true
}
