// ─────────────────────────────────────────────────────────────────────────────
// Tradução de erro do banco para mensagem de usuário.
//
// Boa parte das REGRAS DE NEGÓCIO deste produto vive em trigger/função do
// Postgres (limite de vagas do plano, responsável técnico ativo…), e o texto
// dessas regras já é escrito em português, pronto para ser lido. Engolir tudo
// num "não foi possível salvar" esconde do usuário justamente a única coisa que
// ele precisa saber — por exemplo, que o plano contratado esgotou as vagas.
//
// O que NÃO pode vazar é a mensagem PADRÃO do Postgres ('new row for relation
// "x" violates check constraint "y"'): é técnica, em inglês e expõe o schema.
// ─────────────────────────────────────────────────────────────────────────────

/** Constraints cujo estouro tem explicação própria — o Postgres só sabe dizer
 *  o nome delas, então a tradução mora aqui. */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  professional_technical_manager_active_ck:
    'Este profissional é o responsável técnico da clínica. Defina outro responsável antes de inativá-lo.',
  professional_technical_manager_uk:
    'A clínica já tem um responsável técnico. Troque o responsável em Configurações → Conta.',
  // Trava real de banco (exclude using gist) — sala é unidade de ocupação e
  // não se divide (ver appointment_room_overlap_ex na migration de Agenda).
  appointment_room_overlap_ex:
    'Já existe uma consulta agendada para essa sala nesse mesmo horário.',
}

/** Códigos usados pelos `raise exception` do schema: a mensagem que vem junto
 *  foi escrita para o usuário final. As RPCs reaproveitam de propósito o código
 *  da constraint que estão antecipando (`link_professional_user` levanta 23503 e
 *  23505 com texto legível antes de a FK/unique estourar em inglês). */
const BUSINESS_RULE_CODES = new Set(['P0001', '23514', '23503', '23505', '42501'])

/** Começos das mensagens que o próprio Postgres monta — técnicas, em inglês e
 *  expondo nome de tabela/constraint. São exatamente as que os `raise` acima
 *  substituem no caminho normal, e o que sobra quando a corrida é perdida. */
const POSTGRES_CANNED = /^(new row|duplicate key|insert or update on table|update or delete on table|null value in column|value too long|permission denied)/i

type DatabaseError = { code?: string; message?: string }

/**
 * Mensagem para o usuário a partir de um erro do Supabase/Postgres.
 * Devolve `fallback` sempre que o erro não trouxer texto próprio confiável.
 *
 *   catch (error) { toast.error(userMessage(error, 'Não foi possível salvar.')) }
 */
export function userMessage(error: unknown, fallback: string): string {
  const { code, message } = (error ?? {}) as DatabaseError
  const text = message?.trim()
  if (!text) return fallback

  // 1) Constraint conhecida: o nome dela aparece na mensagem padrão do Postgres.
  for (const [constraint, explanation] of Object.entries(CONSTRAINT_MESSAGES)) {
    if (text.includes(constraint)) return explanation
  }

  // 2) Regra de negócio escrita à mão no banco — o texto já está em português.
  if (code && BUSINESS_RULE_CODES.has(code) && !POSTGRES_CANNED.test(text)) return text

  return fallback
}
