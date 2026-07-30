-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — CAMPO "HOJE" NA EVOLUÇÃO (quinta chave do clinical_note)
--
-- O prontuário da sessão é um jsonb com as quatro seções do SOAP
-- (20260725190000_clinical_note_soap.sql). No atendimento de FISIOTERAPIA, o
-- profissional pediu um campo antes delas: "Hoje" — o que foi realizado nesta
-- sessão, escrito de corrida, entre um paciente e outro. É o registro que
-- SEMPRE existe (mesmo quando não sobra tempo para as quatro seções), e por
-- isso abre a evolução em vez de virar mais uma seção no meio do SOAP.
--
-- Podia ter virado coluna própria; virou CHAVE na mesma nota de propósito:
--   · é conteúdo clínico DA SESSÃO — viaja junto com o resto para a aba
--     Prontuários do perfil, para a impressão e para o relatório, sem nenhum
--     segundo caminho de leitura/escrita;
--   · o `useUpdateClinicalNote` já grava a nota inteira num update só — uma
--     coluna à parte criaria duas gravações para um botão só de "Salvar";
--   · vale a mesma garantia de forma (string HTML não vazia, chave ausente =
--     não preenchido) que o CHECK já aplica às outras quatro.
--
-- 'today' NÃO é uma seção do SOAP: o S-O-A-P segue com quatro letras no editor,
-- no relatório agregado por seção e no "repetir última sessão" (que copia
-- Objetivo e Plano — o que se fez HOJE é justamente o que não se repete).
--
-- Depende de: 20260725190000_clinical_note_soap.sql (a função que se redefine).
-- ═════════════════════════════════════════════════════════════════════════════

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
           where e.key not in ('today', 'subjective', 'objective', 'assessment', 'plan')
              or jsonb_typeof(e.value) <> 'string'
              -- Seção presente e em branco mentiria pro relatório ("tem plano"
              -- num plano vazio); ausente é a única forma de "não preenchi".
              or btrim(e.value #>> '{}') = ''
        )
      );
$fn$;

comment on function private.is_soap_note(jsonb) is
  'Valida a forma de uma nota clínica: objeto jsonb com no máximo as chaves '
  'today (o campo livre "Hoje", que abre a evolução) e as quatro do SOAP '
  'subjective/objective/assessment/plan, cada valor uma string HTML não vazia. '
  'NULL (nota inexistente) é válido; ''{}'' não é — nota vazia se escreve como '
  'NULL. IMMUTABLE porque é usada em CHECK constraint.';

comment on column public.appointment.clinical_note is
  'Prontuário da SESSÃO. Objeto jsonb com a chave today (campo livre "Hoje": o '
  'que foi realizado nesta sessão) e as chaves SOAP subjective/objective/'
  'assessment/plan (inglês), valor = HTML rico sanitizado no cliente antes de '
  'gravar E antes de exibir. Seção não preenchida NÃO aparece no objeto; nota '
  'inexistente = NULL. Não confundir com appointment.notes (observação simples '
  'de agenda) nem com prescription (Prontuário genérico por paciente, em '
  'Prescrições).';
