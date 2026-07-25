-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — PRONTUÁRIO SOAP ESTRUTURADO (substitui o HTML solto)
--
-- Até aqui a evolução da sessão era UMA coluna de HTML livre
-- (appointment.clinical_note_html e class_group_attendance.clinical_note_html):
-- o profissional escrevia tudo num editor rico e o banco guardava um blob.
-- Funciona pra ler UMA sessão; não funciona pro que o produto precisa a
-- seguir — RELATÓRIO AGREGADO POR SEÇÃO ("todos os Planos de julho", "buscar
-- só no Objetivo", "evolução do Assessment deste paciente ao longo do
-- tratamento"). Com HTML num campo só, isso exigiria parsear HTML dentro do
-- Postgres pra descobrir onde começa o "Plano" — inviável e frágil.
--
-- DECISÃO: SOAP em JSONB ESTRUTURADO, uma chave por seção. O editor continua
-- rico (o VALOR de cada seção é HTML), mas a SEÇÃO passa a ser um endereço
-- que o banco entende: clinical_note->>'plan' resolve o relatório com um
-- índice, sem parser.
--
-- ── FORMA DO JSONB (contrato) ────────────────────────────────────────────────
--   {
--     "subjective": "<p>...</p>",   -- S: relato do paciente (queixa, dor, sono)
--     "objective":  "<p>...</p>",   -- O: achados medidos/observados
--     "assessment": "<p>...</p>",   -- A: interpretação clínica do profissional
--     "plan":       "<p>...</p>"    -- P: conduta e próximos passos
--   }
--   · Chaves em INGLÊS (identificador é inglês, UI é português) e SOMENTE
--     estas quatro — garantido por CHECK, não por convenção. jsonb sem
--     contrato vira lixo em três meses: um dia alguém grava "subjetivo",
--     no outro "S", e o relatório agregado nunca mais fecha.
--   · Valor = HTML da seção (mesmo sanitizador DOMPurify de antes, no cliente,
--     na gravação E na exibição).
--   · Seção não preenchida = CHAVE AUSENTE, nunca "" nem "<p></p>". Isso faz
--     `clinical_note ? 'plan'` significar de verdade "tem plano" e mantém a
--     contagem do relatório honesta.
--   · Nota inteira apagada = coluna NULL (o CHECK recusa '{}' justamente pra
--     não existirem dois jeitos de dizer "vazio").
--
-- ── A COLUNA ANTIGA FOI DROPADA ──────────────────────────────────────────────
-- clinical_note_html sai nesta mesma migration, sem backfill: o banco é de
-- teste (uma única nota gravada em todo ele) e manter as duas colunas convida
-- divergência — metade das telas escrevendo numa, metade na outra, e nenhum
-- relatório confiável. O front que ainda cita a coluna velha está listado no
-- relatório desta fatia e é corrigido em paralelo.
--
-- Depende de: 20260724170000_appointment_clinical_note.sql (a coluna que sai),
--             20260725100000_class_group_roster_and_attendance.sql.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── Guarda do contrato ───────────────────────────────────────────────────────

-- CHECK não aceita subquery, então a validação mora numa função IMMUTABLE.
-- Reaproveitada pelas duas tabelas de evolução e pelo catálogo de modelos
-- (evolution_template) — uma definição só do que é "uma nota SOAP válida".
create or replace function private.is_soap_note(p_note jsonb)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $fn$
  select p_note is null
      or (
        jsonb_typeof(p_note) = 'object'
        -- '{}' é "vazio" escrito de um segundo jeito — o jeito certo é NULL.
        and p_note <> '{}'::jsonb
        and not exists (
          select 1
            from jsonb_each(p_note) as e(key, value)
           where e.key not in ('subjective', 'objective', 'assessment', 'plan')
              or jsonb_typeof(e.value) <> 'string'
              -- Seção presente e em branco mentiria pro relatório ("tem plano"
              -- num plano vazio); ausente é a única forma de "não preenchi".
              or btrim(e.value #>> '{}') = ''
        )
      );
$fn$;

comment on function private.is_soap_note(jsonb) is
  'Valida a forma de uma nota clínica SOAP: objeto jsonb com no máximo as '
  'quatro chaves subjective/objective/assessment/plan, cada valor uma string '
  'HTML não vazia. NULL (nota inexistente) é válido; ''{}'' não é — nota vazia '
  'se escreve como NULL. IMMUTABLE porque é usada em CHECK constraint.';

-- ── Sessão individual (AppointmentModal) ─────────────────────────────────────

alter table public.appointment add column clinical_note jsonb;

comment on column public.appointment.clinical_note is
  'Prontuário SOAP da SESSÃO. Objeto jsonb com as chaves subjective/objective/'
  'assessment/plan (inglês), valor = HTML rico sanitizado no cliente antes de '
  'gravar E antes de exibir. Seção não preenchida NÃO aparece no objeto; nota '
  'inexistente = NULL. Substitui a antiga clinical_note_html — a seção virou '
  'endereço consultável pra permitir relatório agregado por seção. Não '
  'confundir com appointment.notes (observação simples de agenda) nem com '
  'prescription (Prontuário genérico por paciente, em Prescrições).';

alter table public.appointment
  add constraint appointment_clinical_note_shape_ck
  check (private.is_soap_note(clinical_note));

-- "Todos os Planos de julho" varre por clínica+data e só interessa a sessão
-- QUE TEM nota — índice parcial, porque a maioria das linhas de agenda nunca
-- vai ter evolução escrita.
create index appointment_clinical_note_idx
  on public.appointment (clinic_id, date desc)
  where clinical_note is not null;

-- appointment NÃO tem grant table-wide de update (o ACL de authenticated é
-- rdxtm) — coluna nova sem grant explícito passa na RLS e falha no UPDATE.
-- Só update: a nota é escrita depois que a consulta já existe, nunca no insert
-- (mesma regra da coluna que ela substitui).
grant update (clinical_note) on public.appointment to authenticated;

alter table public.appointment drop column clinical_note_html;

-- ── Sessão em turma (ClassAttendanceModal) ───────────────────────────────────

alter table public.class_group_attendance add column clinical_note jsonb;

comment on column public.class_group_attendance.clinical_note is
  'Prontuário SOAP da evolução do aluno NAQUELA aula da turma — mesma forma e '
  'mesmas regras de appointment.clinical_note (as duas fontes viram uma lista '
  'só na aba Prontuários do perfil, ver patientClinicalNotesService).';

alter table public.class_group_attendance
  add constraint class_group_attendance_clinical_note_shape_ck
  check (private.is_soap_note(clinical_note));

create index class_group_attendance_clinical_note_idx
  on public.class_group_attendance (clinic_id, occurred_on desc)
  where clinical_note is not null;

-- Aqui a linha de frequência NASCE junto com a nota (o modal grava presença e
-- evolução de uma vez), então insert também. class_group_attendance herdou
-- grant table-wide de insert/update de authenticated (só delete/truncate foram
-- revogados na criação), então isto é redundante hoje — fica explícito de
-- propósito: se um dia alguém apertar a tabela pra grant por coluna, a coluna
-- não some junto.
grant insert (clinical_note), update (clinical_note)
  on public.class_group_attendance to authenticated;

alter table public.class_group_attendance drop column clinical_note_html;
