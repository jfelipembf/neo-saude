-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — MOTOR DE ITENS DAS ESCALAS PONTUADAS
--
-- 20260725180000 deu ESCORE ao teste: o resultado passou a guardar o valor cru
-- (score) e a faixa passou a ter limites numéricos. Mas o escore ainda chega
-- PRONTO da tela — quem aplica o Berg soma 14 números no papel e digita "43".
-- O que se perde nisso:
--   • conferência — ninguém sabe se 43 é a soma certa dos itens marcados;
--   • reabilitação item a item — "melhorou no item 13 (tandem)" é invisível,
--     só o total aparece, e é o item que orienta a conduta;
--   • auditoria clínica — não dá para reconferir uma aplicação antiga.
--
-- Esta migration monta o MOTOR: catálogo de itens/opções por teste, respostas
-- item a item no resultado, e uma RPC transacional que soma e classifica NO
-- BANCO. Os itens em si (conteúdo clínico) vêm na migration IRMÃ
-- 20260725191000_seed_physio_test_items.sql.
--
-- ── RESTRIÇÃO JURÍDICA, declarada aqui porque é decisão de projeto ──────────
-- Só instrumento de DOMÍNIO PÚBLICO ganha item a item. KOOS, Oswestry,
-- DASH/QuickDASH e ICIQ-SF são LICENCIADOS: reproduzir o enunciado dos itens
-- deles no banco seria distribuir obra de terceiro. Eles continuam existindo no
-- catálogo com scoring_kind = 'manual' — o profissional aplica no material
-- oficial e digita só o total, que é exatamente o que o app já fazia. Por isso
-- 'manual' é o DEFAULT da coluna: o motor de itens é opt-in, e nada quebra em
-- teste que não pode (ou não precisa) ter itens.
--
-- ── POR QUE O TEXTO É CONGELADO NO REGISTRO ────────────────────────────────
-- patient_test_result_item guarda item_label/option_label/points COPIADOS do
-- catálogo no instante da aplicação, e não só as FKs. Motivo: o catálogo é
-- EDITÁVEL pela clínica e vive mais que o prontuário. Se o histórico lesse o
-- catálogo por join, corrigir a redação de um item em 2027 reescreveria o que
-- foi respondido em 2026 — o prontuário passaria a dizer que o paciente
-- respondeu a uma pergunta que ninguém lhe fez. Pior com `points`: mudar a
-- pontuação de uma opção mudaria retroativamente o escore de aplicações
-- antigas, e a curva de evolução do paciente se reescreveria sozinha.
-- Prontuário é registro do que ACONTECEU; catálogo é a ferramenta de HOJE.
-- Mesmo raciocínio (e mesmo desenho) de anamnesis_answer.question_text/
-- answer_label e de patient_test_result.level_name/level_description.
--
-- Depende de: 20260724130000 (physio_test/level/patient_test_result),
--             20260725180000 (score + private.physio_test_level_for_score).
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 1. COMO o teste chega ao escore ─────────────────────────────────────────
create type public.physio_scoring_kind as enum ('manual', 'sum_items');

comment on type public.physio_scoring_kind is
  'Como o escore de uma aplicação é obtido. manual = o profissional mede ou '
  'soma fora do app e digita o número (TUG em segundos, TC6 em metros, '
  'goniometria em graus, e todo instrumento LICENCIADO, que não pode ter os '
  'itens reproduzidos aqui). sum_items = o banco soma os pontos das opções '
  'marcadas nos itens (Berg, Roland-Morris, SPPB, Ashworth, Oxford).';

alter table public.physio_test
  add column scoring_kind public.physio_scoring_kind not null default 'manual';

comment on column public.physio_test.scoring_kind is
  'Motor de escore do teste. Default manual de propósito: teste sem item '
  'continua funcionando exatamente como antes (a tela digita o escore). '
  'sum_items exige que TODOS os itens do teste sejam respondidos na aplicação '
  '— meio Berg somado dá um total menor e classifica o paciente na faixa '
  'errada, então save_patient_test_result recusa aplicação incompleta.';

-- physio_test tem UPDATE por COLUNA (relacl authenticated=ardxtm, sem 'w'):
-- coluna nova passa na RLS e falha no UPDATE se não for nomeada aqui. É o erro
-- clássico deste schema — grant dado agora, antes de a tela de Testes ganhar o
-- campo, para não virar bug de produção depois.
grant update (scoring_kind) on public.physio_test to authenticated;

-- ── 2. Como o item recebe a resposta ────────────────────────────────────────
create type public.physio_item_input_kind as enum ('options', 'number');

comment on type public.physio_item_input_kind is
  'options = o profissional escolhe UMA opção do item e os pontos vêm do '
  'catálogo (o cliente não escolhe quanto vale). number = o profissional digita '
  'um número que JÁ É a pontuação do item (contagem de repetições, por '
  'exemplo). Todo item semeado hoje é options; number existe porque a distinção '
  'muda quem decide o valor — e essa decisão é de segurança, não de tela.';

-- ── 3. O item do teste ──────────────────────────────────────────────────────
create table public.physio_test_item (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  test_id     uuid not null,
  code        text not null,
  label       text not null,
  help        text,
  input_kind  public.physio_item_input_kind not null default 'options',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- FK COMPOSTA (id, clinic_id) como o resto do schema: com a FK simples, um
  -- item da clínica A poderia apontar para um teste da clínica B e o vazamento
  -- entre tenants não dependeria mais da RLS. Aqui é o próprio banco que recusa.
  constraint physio_test_item_test_fk foreign key (test_id, clinic_id)
    references public.physio_test(id, clinic_id) on delete cascade,

  constraint physio_test_item_code_not_blank_ck  check (btrim(code) <> ''),
  constraint physio_test_item_label_not_blank_ck check (btrim(label) <> ''),

  -- `code` é a chave ESTÁVEL do item dentro do teste: é por ela que o payload
  -- da RPC casa com o catálogo, então ela sobrevive a mudança de redação.
  constraint physio_test_item_uk          unique (test_id, code),
  constraint physio_test_item_id_clinic_uk unique (id, clinic_id),
  constraint physio_test_item_id_test_uk   unique (id, test_id)
);

comment on table public.physio_test_item is
  'Item (pergunta/tarefa) de um teste pontuado item a item. Só instrumento de '
  'DOMÍNIO PÚBLICO entra aqui — ver o cabeçalho da migration.';
comment on column public.physio_test_item.code is
  'Identificador estável do item dentro do teste (ex.: berg_01). É a chave que '
  'o payload de save_patient_test_result usa, justamente para a redação do '
  'label poder ser corrigida sem quebrar a tela nem o histórico.';
comment on column public.physio_test_item.help is
  'Instrução de aplicação do item (como cronometrar, que distância usar). NULL '
  'quando o enunciado já basta.';

create index physio_test_item_clinic_idx on public.physio_test_item (clinic_id);
create index physio_test_item_test_idx   on public.physio_test_item (test_id, sort_order);

create trigger tr_touch before update on public.physio_test_item
  for each row execute function private.tg_touch_updated_at();
create trigger tr_audit after insert or update or delete on public.physio_test_item
  for each row execute function private.tg_audit();

-- ── 4. A opção do item (é ela que carrega os pontos) ────────────────────────
create table public.physio_test_item_option (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinic(id) on delete cascade,
  item_id    uuid not null,
  label      text not null,
  points     numeric not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint physio_test_item_option_item_fk foreign key (item_id, clinic_id)
    references public.physio_test_item(id, clinic_id) on delete cascade,

  constraint physio_test_item_option_label_not_blank_ck check (btrim(label) <> ''),
  constraint physio_test_item_option_uk      unique (item_id, label),
  constraint physio_test_item_option_id_item_uk unique (id, item_id)
);

comment on table public.physio_test_item_option is
  'Resposta possível de um item, com quantos pontos ela vale. É a ÚNICA fonte '
  'dos pontos numa resposta de item options: o cliente manda qual opção '
  'escolheu, nunca quanto ela vale (ver private.tg_patient_test_result_item_freeze).';
comment on column public.physio_test_item_option.points is
  'Quanto esta opção soma no escore. numeric (não integer) porque grau '
  'intermediário existe — o "1+" da Ashworth vale 1,5 para manter a ordem.';

create index physio_test_item_option_clinic_idx on public.physio_test_item_option (clinic_id);
create index physio_test_item_option_item_idx   on public.physio_test_item_option (item_id, sort_order);

create trigger tr_touch before update on public.physio_test_item_option
  for each row execute function private.tg_touch_updated_at();
create trigger tr_audit after insert or update or delete on public.physio_test_item_option
  for each row execute function private.tg_audit();

-- ── 5. A resposta item a item, dentro de uma aplicação ──────────────────────
-- Chaves compostas que a linha de resposta precisa referenciar.
alter table public.patient_test_result
  add constraint patient_test_result_id_clinic_uk unique (id, clinic_id),
  add constraint patient_test_result_id_test_uk   unique (id, test_id);

create table public.patient_test_result_item (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinic(id) on delete cascade,
  result_id    uuid not null,
  test_id      uuid not null,
  item_id      uuid,
  option_id    uuid,
  points       numeric not null,
  -- ── texto CONGELADO (ver cabeçalho) ──────────────────────────────────────
  item_code    text not null,
  item_label   text not null,
  option_label text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),

  constraint patient_test_result_item_result_clinic_fk foreign key (result_id, clinic_id)
    references public.patient_test_result(id, clinic_id) on delete cascade,
  -- Carregar test_id e amarrá-lo dos DOIS lados é o que impede responder o
  -- item de um teste dentro do resultado de outro (mesmo desenho de
  -- anamnesis_answer, que carrega template_id pelo mesmo motivo).
  constraint patient_test_result_item_result_test_fk foreign key (result_id, test_id)
    references public.patient_test_result(id, test_id) on delete cascade,

  -- SET NULL, não CASCADE nem RESTRICT: apagar um item do catálogo não pode
  -- apagar o que o paciente respondeu (CASCADE) nem travar a manutenção do
  -- catálogo para sempre (RESTRICT). O vínculo cai, o TEXTO CONGELADO fica —
  -- mesma solução já usada em patient_test_result_level_fk.
  constraint patient_test_result_item_item_fk foreign key (item_id, test_id)
    references public.physio_test_item(id, test_id) on delete set null (item_id),
  constraint patient_test_result_item_option_fk foreign key (option_id, item_id)
    references public.physio_test_item_option(id, item_id) on delete set null (option_id),

  constraint patient_test_result_item_label_not_blank_ck check (btrim(item_label) <> ''),
  constraint patient_test_result_item_uk unique (result_id, item_id)
);

comment on table public.patient_test_result_item is
  'O que o paciente respondeu em CADA item de uma aplicação. As colunas de '
  'texto e `points` são CONGELADAS no instante da aplicação — editar o '
  'catálogo depois NÃO reescreve o histórico (ver cabeçalho da migration).';
comment on column public.patient_test_result_item.points is
  'Pontos que ESTA resposta valeu nesta aplicação. Congelado: é a parcela que '
  'compõe patient_test_result.score e precisa continuar somando o mesmo total '
  'mesmo depois de a clínica repontuar a opção no catálogo.';
comment on column public.patient_test_result_item.item_id is
  'NULL quando o item foi apagado do catálogo depois desta aplicação — a '
  'resposta continua legível por item_code/item_label.';

create index patient_test_result_item_clinic_idx on public.patient_test_result_item (clinic_id);
create index patient_test_result_item_result_idx on public.patient_test_result_item (result_id, sort_order);
create index patient_test_result_item_item_idx   on public.patient_test_result_item (item_id);
create index patient_test_result_item_option_idx on public.patient_test_result_item (option_id);

create trigger tr_audit after insert or update or delete on public.patient_test_result_item
  for each row execute function private.tg_audit();

-- ── 6. O congelamento, feito pelo BANCO ─────────────────────────────────────
-- Congelar na trigger (e não na RPC) é o que torna o congelamento propriedade
-- da TABELA: qualquer caminho de escrita — RPC, correção manual, script —
-- grava o texto e os pontos que o catálogo tinha AGORA. E fecha o buraco de
-- segurança óbvio: `points` de item options vem do catálogo, nunca do payload,
-- então ninguém inflaciona o próprio escore mandando 999 no JSON.
create or replace function private.tg_patient_test_result_item_freeze()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item   record;
  v_option record;
begin
  if new.item_id is null then
    raise exception 'A resposta precisa apontar para um item do teste.' using errcode = '23502';
  end if;

  select i.code, i.label, i.sort_order, i.input_kind
    into v_item
    from public.physio_test_item i
   where i.id = new.item_id;

  if not found then
    raise exception 'Item % não existe no catálogo.', new.item_id using errcode = '23503';
  end if;

  new.item_code  := v_item.code;
  new.item_label := v_item.label;
  new.sort_order := v_item.sort_order;

  if v_item.input_kind = 'options' then
    if new.option_id is null then
      raise exception 'O item "%" é de resposta fechada: informe a opção escolhida.', v_item.label
        using errcode = '23514';
    end if;

    select o.label, o.points
      into v_option
      from public.physio_test_item_option o
     where o.id = new.option_id and o.item_id = new.item_id;

    if not found then
      raise exception 'A opção informada não pertence ao item "%".', v_item.label
        using errcode = '23514';
    end if;

    new.option_label := v_option.label;
    new.points       := v_option.points;  -- do CATÁLOGO, nunca do cliente
  else
    if new.option_id is not null then
      raise exception 'O item "%" é de resposta numérica: não envie opção.', v_item.label
        using errcode = '23514';
    end if;
    if new.points is null then
      raise exception 'Informe o valor do item "%".', v_item.label using errcode = '23502';
    end if;
    new.option_label := null;
  end if;

  return new;
end;
$$;

comment on function private.tg_patient_test_result_item_freeze() is
  'Copia do catálogo, no INSERT, o texto e os pontos da resposta (congelamento) '
  'e recusa resposta incoerente com o input_kind do item. Só INSERT de '
  'propósito: as FKs desta tabela usam ON DELETE SET NULL, e ação referencial '
  'executa um UPDATE de verdade — recongelar ali ou ressuscitaria o texto de um '
  'item recém-apagado, ou faria a limpeza do catálogo estourar exceção.';

-- Função security definer nasce executável por PUBLIC; o trigger é disparado
-- pelo dono da tabela, então o revoke não tira nada de quem precisa.
revoke execute on function private.tg_patient_test_result_item_freeze() from public;

create trigger tr_freeze before insert on public.patient_test_result_item
  for each row execute function private.tg_patient_test_result_item_freeze();

-- ── 7. RLS: a parede real ───────────────────────────────────────────────────
alter table public.physio_test_item        enable row level security;
alter table public.physio_test_item_option enable row level security;
alter table public.patient_test_result_item enable row level security;

-- Catálogo de itens: leitura acompanha physio_test_level (quem vê o teste vê a
-- faixa e agora vê o item). ESCRITA fica de fora nesta fatia — não há tela que
-- edite item, e policy de escrita sem tela é parede sem porta que só serve para
-- ser esquecida aberta. Quando a tela de Testes ganhar edição de itens, a
-- policy de insert/delete entra junto, com a mesma proteção de is_seed que
-- physio_test_delete usa (senão a clínica apaga o próprio Berg e o escore
-- somado passa a mentir).
create policy physio_test_item_select on public.physio_test_item
  for select to authenticated
  using (
    clinic_id = any (private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'admin', 'patients')
  );

create policy physio_test_item_option_select on public.physio_test_item_option
  for select to authenticated
  using (
    clinic_id = any (private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'admin', 'patients')
  );

-- Resposta: SELECT acompanha patient_test_result. Sem insert/update/delete de
-- propósito — a única porta de escrita é save_patient_test_result, e é isso que
-- garante que escore, faixa e itens nunca fiquem em desacordo. (Apagar o
-- resultado continua apagando as respostas: CASCADE de FK não passa por RLS.)
create policy patient_test_result_item_select on public.patient_test_result_item
  for select to authenticated
  using (
    clinic_id = any (private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

grant select on public.physio_test_item         to authenticated;
grant select on public.physio_test_item_option  to authenticated;
grant select on public.patient_test_result_item to authenticated;

-- ── 8. A RPC transacional ───────────────────────────────────────────────────
-- POR QUE UMA RPC, e não dois inserts do PostgREST: resultado e itens são UM
-- fato clínico. Em duas chamadas, a segunda falhando (rede, RLS, validação)
-- deixa no prontuário uma aplicação com escore e SEM as respostas que o
-- produziram — órfã e impossível de reconferir, exatamente o que esta fatia
-- existe para acabar. Numa função, ou entra tudo ou não entra nada.
--
-- Segue save_anamnesis no que importa: payload é um OBJETO {código: resposta},
-- código desconhecido é ERRO ALTO (resposta que some é resposta que ninguém
-- descobre), e a gravação substitui a aplicação inteira.
-- Difere em uma coisa: save_anamnesis é SECURITY INVOKER e deixa a RLS decidir;
-- esta é DEFINER porque precisa ESCREVER numa tabela sem policy de escrita
-- (patient_test_result_item). Por isso o tenant é conferido À MÃO logo no
-- começo — DEFINER sem essa conferência seria um furo entre clínicas.
create or replace function public.save_patient_test_result(
  p_result          uuid,
  p_patient         uuid,
  p_test            uuid,
  p_performed_at    date,
  p_level           uuid    default null,
  p_score           numeric default null,
  p_items           jsonb   default null,
  p_image_url       text    default null,
  p_measured_points jsonb   default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clinic     uuid;
  v_test       record;
  v_item       record;
  v_level      record;
  v_level_id   uuid;
  v_result     uuid;
  v_prof       uuid;
  v_score      numeric;
  v_day        date := coalesce(p_performed_at, current_date);
  v_code       text;
  v_entry      jsonb;
  v_option     uuid;
  v_points     numeric;
  v_missing    text;
  v_item_ids   uuid[]    := '{}';
  v_option_ids uuid[]    := '{}';
  v_point_list numeric[] := '{}';
begin
  -- ── Tenant e permissão (a função é DEFINER: a RLS não conferiria nada) ────
  select p.clinic_id into v_clinic from public.patient p where p.id = p_patient;
  if v_clinic is null then
    raise exception 'Paciente não encontrado.' using errcode = '23503';
  end if;
  if not (v_clinic = any (private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'patients') then
    raise exception 'Sem permissão para registrar testes nesta clínica.' using errcode = '42501';
  end if;

  select t.id, t.name, t.scoring_kind
    into v_test
    from public.physio_test t
   where t.id = p_test and t.clinic_id = v_clinic;
  if not found then
    raise exception 'Teste não encontrado nesta clínica.' using errcode = '23503';
  end if;

  if p_result is not null then
    -- O teste da aplicação NÃO muda numa correção: trocar o teste tornaria as
    -- respostas já gravadas respostas de outro instrumento.
    perform 1 from public.patient_test_result r
      where r.id = p_result and r.clinic_id = v_clinic and r.test_id = p_test;
    if not found then
      raise exception 'Aplicação não encontrada para este teste.' using errcode = '23503';
    end if;
  end if;

  -- ── Itens: resolve, valida e acumula ANTES de tocar no resultado ─────────
  -- (o escore precisa estar pronto para a faixa sair junto no mesmo insert)
  for v_code, v_entry in
    select e.key, e.value from jsonb_each(coalesce(p_items, '{}'::jsonb)) as e
  loop
    select i.id, i.label, i.input_kind
      into v_item
      from public.physio_test_item i
     where i.test_id = p_test and i.code = v_code;

    if not found then
      raise exception 'O item "%" não existe no teste "%".', v_code, v_test.name
        using errcode = '23503';
    end if;

    -- Duas formas aceitas, como em save_anamnesis:
    --   {"berg_01": "<option_id>"}  e  {"berg_01": {"option_id": "..."}}
    --   {"reps":  7}                e  {"reps":  {"points": 7}}
    if jsonb_typeof(v_entry) = 'object' then
      v_option := nullif(v_entry ->> 'option_id', '')::uuid;
      v_points := nullif(v_entry ->> 'points', '')::numeric;
    elsif jsonb_typeof(v_entry) = 'number' then
      v_option := null;
      v_points := (v_entry #>> '{}')::numeric;
    else
      v_option := nullif(v_entry #>> '{}', '')::uuid;
      v_points := null;
    end if;

    if v_item.input_kind = 'options' then
      if v_option is null then
        raise exception 'O item "%" é de resposta fechada: informe a opção escolhida.', v_item.label
          using errcode = '23514';
      end if;
      -- Os pontos vêm do catálogo (a trigger de congelamento reconfere na
      -- gravação); aqui é a mesma leitura, para a soma sair correta.
      select o.points into v_points
        from public.physio_test_item_option o
       where o.id = v_option and o.item_id = v_item.id;
      if not found then
        raise exception 'A opção informada não pertence ao item "%".', v_item.label
          using errcode = '23514';
      end if;
    else
      if v_option is not null then
        raise exception 'O item "%" é de resposta numérica: não envie opção.', v_item.label
          using errcode = '23514';
      end if;
      if v_points is null then
        raise exception 'Informe o valor do item "%".', v_item.label using errcode = '23514';
      end if;
    end if;

    v_item_ids   := v_item_ids   || v_item.id;
    v_option_ids := v_option_ids || v_option;
    v_point_list := v_point_list || v_points;
  end loop;

  -- ── Escore ──────────────────────────────────────────────────────────────
  if v_test.scoring_kind = 'sum_items' then
    -- Aplicação INCOMPLETA é recusada: 13 dos 14 itens do Berg somam um total
    -- menor e classificam o paciente numa faixa de risco pior do que a real.
    -- Erro na cara é melhor que escore silenciosamente errado no prontuário.
    select string_agg(i.label, ', ' order by i.sort_order)
      into v_missing
      from public.physio_test_item i
     where i.test_id = p_test and not (i.id = any (v_item_ids));
    if v_missing is not null then
      raise exception 'Faltam itens do teste "%": %.', v_test.name, v_missing
        using errcode = '23514';
    end if;

    select sum(x) into v_score from unnest(v_point_list) as x;
  else
    v_score := p_score;
  end if;

  -- ── Faixa ───────────────────────────────────────────────────────────────
  -- Em sum_items o banco soma E classifica: o corte é publicado, o escore é
  -- objetivo, e aceitar uma faixa divergente da tela só serviria para um bug de
  -- front classificar errado sem ninguém notar. p_level ali só entra se o teste
  -- não tiver faixa numérica.
  -- Em manual a faixa escolhida na tela VENCE quando informada: existe ponto de
  -- corte por idade/sexo que o catálogo não modela, e o escore fica gravado ao
  -- lado — a divergência continua visível e auditável.
  if v_score is not null then
    v_level_id := private.physio_test_level_for_score(p_test, v_score);
  end if;
  if v_test.scoring_kind = 'manual' and p_level is not null then
    v_level_id := p_level;
  end if;
  v_level_id := coalesce(v_level_id, p_level);

  if v_level_id is null then
    raise exception 'Não foi possível determinar a faixa do teste "%": informe a faixa ou um escore dentro das faixas cadastradas.', v_test.name
      using errcode = '23514';
  end if;

  select l.name, l.description
    into v_level
    from public.physio_test_level l
   where l.id = v_level_id and l.test_id = p_test and l.clinic_id = v_clinic;
  if not found then
    raise exception 'A faixa informada não pertence ao teste "%".', v_test.name
      using errcode = '23503';
  end if;

  -- ── Resultado ───────────────────────────────────────────────────────────
  if p_result is null then
    -- Quem aplicou sai de auth.uid(), não do payload: numa função DEFINER,
    -- aceitar o profissional de fora seria deixar assinar em nome de outro.
    select pr.id into v_prof
      from public.professional pr
     where pr.clinic_id = v_clinic
       and pr.user_id = (select auth.uid())
       and pr.status = 'active';

    insert into public.patient_test_result (
      clinic_id, patient_id, test_id, professional_id, level_id, level_name,
      level_description, performed_at, score, image_url, measured_points
    ) values (
      v_clinic, p_patient, p_test, v_prof, v_level_id, v_level.name,
      v_level.description, v_day, v_score,
      nullif(btrim(coalesce(p_image_url, '')), ''), p_measured_points
    )
    returning id into v_result;
  else
    update public.patient_test_result r
       set level_id          = v_level_id,
           level_name        = v_level.name,
           level_description = v_level.description,
           performed_at      = v_day,
           score             = v_score,
           -- measured_angle é espelho DEPRECIADO de score. Zerar de propósito
           -- (em vez de omitir) faz tr_sync_score reespelhar na goniometria;
           -- omitindo, o ângulo ANTIGO ficaria parado na coluna. Some junto com
           -- a coluna, na fatia que a remove.
           measured_angle    = null,
           image_url         = nullif(btrim(coalesce(p_image_url, '')), ''),
           measured_points   = p_measured_points
     where r.id = p_result;
    v_result := p_result;
  end if;

  -- ── Respostas ───────────────────────────────────────────────────────────
  -- Upsert (e não delete-then-insert) porque a tabela é auditada: regravar um
  -- Berg sem mudar nada geraria 28 linhas de trilha por clique em Salvar, e
  -- trilha ilegível não é trilha. tg_audit ignora UPDATE que não mudou nada.
  -- As colunas congeladas entram por `excluded` porque a trigger BEFORE INSERT
  -- roda ANTES da resolução do conflito — `excluded` já traz o texto de agora.
  insert into public.patient_test_result_item (
    clinic_id, result_id, test_id, item_id, option_id, points
  )
  select v_clinic, v_result, p_test, x.item_id, x.option_id, x.points
    from unnest(v_item_ids, v_option_ids, v_point_list) as x(item_id, option_id, points)
  on conflict (result_id, item_id) do update
     set option_id    = excluded.option_id,
         points       = excluded.points,
         item_code    = excluded.item_code,
         item_label   = excluded.item_label,
         option_label = excluded.option_label,
         sort_order   = excluded.sort_order;

  -- A tela manda a aplicação INTEIRA: item que não veio no payload saiu do
  -- teste ou foi desmarcado, e nos dois casos não deve continuar respondido.
  delete from public.patient_test_result_item ri
   where ri.result_id = v_result
     and (ri.item_id is null or not (ri.item_id = any (v_item_ids)));

  return v_result;
end;
$$;

comment on function public.save_patient_test_result(uuid, uuid, uuid, date, uuid, numeric, jsonb, text, jsonb) is
  'Grava UMA aplicação de teste inteira (resultado + respostas item a item) numa '
  'transação. p_result null = nova aplicação; preenchido = correção da mesma. '
  'p_items é {codigo_do_item: option_id}. Em scoring_kind = sum_items o banco '
  'SOMA os pontos e DERIVA a faixa, e exige todos os itens; em manual usa '
  'p_score e a faixa de p_level (derivando só quando p_level vem null). Devolve '
  'o id da aplicação.';

-- create function dá EXECUTE a PUBLIC por padrão — inclusive a anon.
revoke execute on function public.save_patient_test_result(uuid, uuid, uuid, date, uuid, numeric, jsonb, text, jsonb) from public;
grant  execute on function public.save_patient_test_result(uuid, uuid, uuid, date, uuid, numeric, jsonb, text, jsonb) to authenticated;
