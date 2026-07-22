-- ═════════════════════════════════════════════════════════════════════════════
-- RESPONSÁVEL TÉCNICO — marcação em `professional`, não cadastro paralelo
--
-- CONTEXTO: até aqui o RT não existia no schema (o clinicService tinha um TODO e
-- servia mock). As três opções avaliadas foram: (a) marcar um `professional`,
-- (b) colunas soltas em `clinic`, (c) tabela própria com histórico.
--
-- ESCOLHIDA: (a). Pela norma do CRO o RT é um profissional INSCRITO no conselho —
-- então ele já é, necessariamente, uma linha de `professional`. Duplicar nome,
-- CPF, conselho e contato em `clinic` (opção b) criaria duas fontes para o mesmo
-- dado, e a primeira divergência aparece no dia em que alguém troca o telefone
-- num lugar só — justamente num campo que vai impresso em receituário.
--
-- (c) foi descartada POR ORA, não por estar errada: histórico de quem foi RT em
-- cada período é o mais auditável, mas exige tabela com vigência e nenhuma tela
-- pede isso hoje. O caminho de evolução está no fim deste arquivo.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.professional
  add column if not exists is_technical_manager boolean not null default false;

comment on column public.professional.is_technical_manager is
  'Marca o profissional que responde pela clínica perante o conselho (CRO/CREFITO…). '
  'É o nome que sai no rodapé dos documentos impressos. Um por clínica, e '
  'obrigatoriamente ativo — ver professional_technical_manager_uk e o CHECK abaixo.';

-- RT só faz sentido em profissional ATIVO: um RT inativo deixaria a clínica
-- formalmente "com responsável" sem ninguém de fato respondendo por ela.
alter table public.professional
  drop constraint if exists professional_technical_manager_active_ck;
alter table public.professional
  add constraint professional_technical_manager_active_ck
  check (not is_technical_manager or status = 'active');

-- UM RT por clínica. Índice PARCIAL (e não unique comum) porque a restrição vale
-- só entre os marcados — dezenas de profissionais com `false` convivem.
drop index if exists public.professional_technical_manager_uk;
create unique index professional_technical_manager_uk
  on public.professional (clinic_id)
  where is_technical_manager;

comment on index public.professional_technical_manager_uk is
  'Uma clínica tem no máximo UM responsável técnico. Trocar de RT exige limpar a '
  'marca do anterior na mesma transação — é o que public.set_technical_manager() faz.';


-- ─────────────────────────────────────────────────────────────────────────────
-- Troca de RT numa transação só
--
-- Sem isto, o app teria de fazer dois UPDATEs e, entre eles, o índice parcial
-- recusaria o segundo (dois RTs no instante intermediário). A função limpa e
-- marca de uma vez.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_technical_manager(p_professional uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_clinic uuid;
  v_status public.active_status;
begin
  -- A RLS de `professional` já barra clínica alheia; o select serve para
  -- descobrir a clínica e recusar profissional inativo com mensagem clara,
  -- em vez de deixar o CHECK estourar com erro de constraint.
  select p.clinic_id, p.status into v_clinic, v_status
    from public.professional p
   where p.id = p_professional;

  if v_clinic is null then
    raise exception 'Profissional não encontrado ou sem acesso.' using errcode = '42501';
  end if;

  if v_status <> 'active' then
    raise exception 'Só um profissional ativo pode ser responsável técnico.'
      using errcode = '23514';
  end if;

  update public.professional
     set is_technical_manager = false
   where clinic_id = v_clinic and is_technical_manager and id <> p_professional;

  update public.professional
     set is_technical_manager = true
   where id = p_professional;
end;
$$;

comment on function public.set_technical_manager(uuid) is
  'Define QUEM é o responsável técnico da clínica, limpando o anterior na mesma '
  'transação (o índice parcial recusaria dois RTs no instante intermediário). '
  'SECURITY INVOKER: quem não pode editar `professional` pela RLS também não '
  'troca o RT por aqui.';

revoke execute on function public.set_technical_manager(uuid) from public;
grant execute on function public.set_technical_manager(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- EVOLUÇÃO — quando o histórico de RT for exigido
--
-- Auditoria de conselho pode pedir "quem era o RT em março de 2027". Hoje isso
-- é respondível pelo `audit_log` (a coluna entra em new_data/changed_fields),
-- mas de forma trabalhosa. O caminho, quando houver demanda real:
--
--   create table public.clinic_technical_manager (
--     clinic_id uuid, professional_id uuid,
--     valid_from date not null, valid_to date,   -- null = vigente
--     ...
--   );
--
-- e `is_technical_manager` vira uma VIEW sobre a vigência atual, preservando
-- todo o código que já lê a coluna.
-- ─────────────────────────────────────────────────────────────────────────────
