-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — PLANO DE CONTAS (categorias e subcategorias do Financeiro)
--
-- Hoje a classificação financeira está quebrada dos DOIS lados, e de formas
-- diferentes:
--   · payable.category  — texto, escolhido numa lista FIXA NO CÓDIGO com 9 itens
--     (AccountFormModal.tsx). A clínica não consegue criar "Vale Transporte"
--     sem alguém abrir um editor e publicar deploy.
--   · receivable.source — texto livre, sem lista nenhuma. Duas pessoas digitam
--     "Consulta" e "Consultas" e o relatório vira duas linhas.
--
-- Esta migration troca as duas coisas por UMA árvore por clínica, de dois
-- níveis (categoria → subcategoria), com tipo Receita/Despesa. É o mesmo plano
-- de contas que o mercado usa e que o cliente já conhece de outros sistemas.
--
-- ── Por que o tipo (kind) mora em TODA linha, e não só na raiz ────────────────
-- Repetido no filho, o tipo pode entrar na FK composta que liga filho a pai:
-- a subcategoria só encaixa num pai do MESMO tipo. Se o tipo morasse só na
-- raiz, "Aluguel" (despesa) poderia acabar pendurado em "Receitas" e ninguém
-- descobriria até o DRE sair errado.
--
-- ── Como a profundidade fica limitada a 2 sem trigger nenhum ─────────────────
-- `parent_is_root` é uma coluna GERADA que vale NULL na raiz e TRUE no filho.
-- Ela entra na FK composta apontando para `is_root` do pai. O resultado sai de
-- graça, do próprio Postgres:
--   · raiz     → parent_is_root é NULL → FK não é checada (MATCH SIMPLE) → ok
--   · filho    → parent_is_root é TRUE → o pai TEM de ter is_root = true
--   · neto     → o pai seria um filho (is_root = false) → RECUSADO
-- Trigger faria o mesmo, mas trigger se desabilita e FK não.
--
-- As 12 regras (tipo trocado, neto, nome duplicado, pai de outra clínica,
-- pagar apontando para receita…) foram testadas contra este banco antes desta
-- migration existir; todas barram o que devem barrar.
--
-- ── O texto antigo NÃO morre ─────────────────────────────────────────────────
-- payable.category e receivable.source continuam, agora como RÓTULO CONGELADO
-- no momento do lançamento — mesmo padrão de physio_test_result.level_name e
-- patient_test_result_item.item_label. Renomear "Marketing e publicidade" no
-- plano de contas não pode reescrever o que já foi lançado ano passado.
--
-- Depende de: 20260722120000_foundation.sql (clinic, active_status,
--             auth_clinic_ids, can_access_feature, can_edit_feature,
--             tg_touch_updated_at, tg_audit)
--             20260722120700_finance.sql (payable, receivable)
-- ═════════════════════════════════════════════════════════════════════════════

create type public.finance_category_kind as enum ('revenue', 'expense');

comment on type public.finance_category_kind is
  'Lado do plano de contas: revenue = entra dinheiro (Contas a Receber), '
  'expense = sai (Contas a Pagar). Enum e não texto porque, ao contrário do '
  'NOME da categoria, este conjunto não muda por decisão de clínica nenhuma.';

create table public.finance_category (
  id        uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinic(id) on delete cascade,
  -- NULL = categoria de primeiro nível. Preenchido = subcategoria.
  parent_id uuid,
  name      text not null,
  kind      public.finance_category_kind not null,
  is_seed   boolean not null default false,
  status    public.active_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Colunas geradas que sustentam a FK de hierarquia (ver cabeçalho).
  is_root        boolean generated always as (parent_id is null) stored,
  parent_is_root boolean generated always as (case when parent_id is null then null else true end) stored,

  constraint finance_category_name_not_blank_ck check (btrim(name) <> ''),

  -- Alvos de FK composta. Os dois existem porque uma FK precisa casar
  -- EXATAMENTE com a lista de colunas de uma unique:
  --   · (id, clinic_id, kind)          → usada por payable/receivable
  --   · (id, clinic_id, kind, is_root) → usada pela hierarquia aqui embaixo
  constraint finance_category_id_clinic_kind_uk unique (id, clinic_id, kind),
  constraint finance_category_parent_target_uk  unique (id, clinic_id, kind, is_root),

  -- Uma FK, quatro garantias: pai existe, é da MESMA clínica, é do MESMO tipo
  -- e é uma RAIZ (logo, não há terceiro nível).
  -- CASCADE: apagar a categoria leva junto as subcategorias — elas não têm
  -- significado soltas, e o delete só é permitido em categoria sem lançamento
  -- (as FKs de payable/receivable são NO ACTION).
  constraint finance_category_parent_fk
    foreign key (parent_id, clinic_id, kind, parent_is_root)
    references public.finance_category (id, clinic_id, kind, is_root)
    on delete cascade
);

comment on table public.finance_category is
  'Plano de contas da clínica: árvore de dois níveis (categoria → subcategoria) '
  'com tipo Receita/Despesa. Alimenta Contas a Pagar (lado despesa) e Contas a '
  'Receber (lado receita). Toda clínica nasce com um plano de referência '
  '(is_seed) semeado por trigger.';

comment on column public.finance_category.parent_id is
  'NULL = categoria de primeiro nível. Preenchido = subcategoria. Um terceiro '
  'nível é impossível por construção — ver finance_category_parent_fk.';

comment on column public.finance_category.kind is
  'Repetido na subcategoria de propósito: é o que permite à FK de hierarquia '
  'recusar "Aluguel" (despesa) pendurado em "Receitas". Filho SEMPRE tem o '
  'mesmo tipo do pai — o banco não aceita outra coisa.';

comment on column public.finance_category.is_root is
  'Coluna GERADA (parent_id is null). Existe só para ser alvo da FK de '
  'hierarquia; não é para ser lida pelo front, que já sabe disso pelo parent_id.';

comment on column public.finance_category.parent_is_root is
  'Coluna GERADA: NULL na raiz, TRUE no filho. É o truque que limita a árvore a '
  'dois níveis sem trigger — NULL faz a FK composta não ser checada (MATCH '
  'SIMPLE), TRUE obriga o pai a ser raiz.';

comment on column public.finance_category.is_seed is
  'true = veio pronto no plano de referência — pode ser renomeado e inativado, '
  'nunca excluído (a policy de delete exige is_seed = false, e a coluna está '
  'FORA do grant de update para o cliente não desmarcar a proteção antes de '
  'apagar). false = criado pela própria clínica.';

comment on column public.finance_category.status is
  'inactive = some dos seletores de lançamento sem sumir do histórico nem dos '
  'relatórios. É como se "remove" uma categoria de referência, já que excluir é '
  'proibido — e também a saída correta para categoria que já tem lançamento.';

-- Nome único entre irmãos, case-insensitive. `nulls not distinct` (PG15+) é o
-- que faz a regra valer também entre as RAÍZES: sem isso, parent_id NULL nunca
-- colide com parent_id NULL e daria para criar "Impostos" dez vezes.
-- Duas subcategorias "Empréstimos" sob PAIS diferentes continuam válidas — e é
-- proposital, o plano de contas colado pelo cliente tem exatamente esse caso
-- ("Despesas → Empréstimos" e "Despesas Financeiras → Empréstimos").
create unique index finance_category_sibling_name_uk
  on public.finance_category (clinic_id, parent_id, lower(name))
  nulls not distinct;

-- Os seletores de lançamento listam só o que está ativo, já na ordem da tela.
create index finance_category_pick_idx
  on public.finance_category (clinic_id, kind, parent_id, name)
  where status = 'active';

create trigger tr_touch before update on public.finance_category
  for each row execute function private.tg_touch_updated_at();
create trigger tr_audit after insert or update or delete on public.finance_category
  for each row execute function private.tg_audit();

alter table public.finance_category enable row level security;

-- ── GRANTs por coluna ────────────────────────────────────────────────────────
-- O revoke all vem primeiro porque o Supabase concede privilégio TABLE-WIDE por
-- default privileges em toda tabela nova do schema public; sem ele os grants
-- por coluna abaixo seriam decorativos e is_seed ficaria gravável.
revoke all on public.finance_category from anon, authenticated;

grant select on public.finance_category to authenticated;
grant insert (clinic_id, parent_id, name, kind, status)
  on public.finance_category to authenticated;
-- parent_id e kind FORA do update: mover uma subcategoria de pai (ou trocar o
-- lado dela) reclassifica retroativamente todo lançamento já feito. Quem errou
-- o lugar inativa e cria no lugar certo — o histórico fica de pé.
grant update (name, status) on public.finance_category to authenticated;
grant delete on public.finance_category to authenticated;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Leitura por 'finance': é quem lança conta a pagar/receber que precisa da
-- lista. A tela de manutenção do plano exige edição (policies abaixo).
create policy finance_category_select on public.finance_category
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'finance')
  );

create policy finance_category_insert on public.finance_category
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'finance')
  );

create policy finance_category_update on public.finance_category
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'finance')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

-- Categoria de referência não se apaga, só se inativa.
create policy finance_category_delete on public.finance_category
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'finance')
    and is_seed = false
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- LIGAÇÃO COM OS LANÇAMENTOS
-- ═════════════════════════════════════════════════════════════════════════════

-- `category_kind` é constante por tabela e fica FORA do grant do cliente. Não é
-- redundância: é a terceira coluna da FK composta, e é ela que faz o banco
-- recusar uma conta a PAGAR classificada numa categoria de RECEITA. Sem essa
-- coluna a FK só conseguiria checar "existe e é da mesma clínica".
alter table public.payable
  add column category_id   uuid,
  add column category_kind public.finance_category_kind not null default 'expense',
  add constraint payable_category_kind_ck check (category_kind = 'expense'),
  add constraint payable_category_fk
    foreign key (category_id, clinic_id, category_kind)
    references public.finance_category (id, clinic_id, kind)
    on delete no action;

alter table public.receivable
  add column category_id   uuid,
  add column category_kind public.finance_category_kind not null default 'revenue',
  add constraint receivable_category_kind_ck check (category_kind = 'revenue'),
  add constraint receivable_category_fk
    foreign key (category_id, clinic_id, category_kind)
    references public.finance_category (id, clinic_id, kind)
    on delete no action;

comment on column public.payable.category_id is
  'Categoria do plano de contas (finance_category). NULL = lançamento antigo, '
  'anterior ao plano. ON DELETE NO ACTION: categoria com lançamento não é '
  'apagada, é inativada.';
comment on column public.payable.category_kind is
  'Fixo em ''expense'' e fora do GRANT do cliente. Terceira coluna da FK '
  'composta — é o que impede classificar uma despesa numa categoria de receita.';

comment on column public.receivable.category_id is
  'Categoria do plano de contas (finance_category), lado receita. NULL = '
  'lançamento anterior ao plano.';
comment on column public.receivable.category_kind is
  'Fixo em ''revenue'' e fora do GRANT do cliente — ver payable.category_kind.';

-- O texto solto vira rótulo congelado; a coluna nova é que classifica.
comment on column public.payable.category is
  'RÓTULO CONGELADO da categoria no momento do lançamento (mesmo padrão de '
  'physio_test_result.level_name). A classificação de verdade é category_id — '
  'este texto existe para que renomear a categoria não reescreva o passado.';
comment on column public.receivable.source is
  'RÓTULO CONGELADO da categoria no momento do lançamento — ver '
  'payable.category. Era texto livre antes do plano de contas '
  '(20260726120000), por isso os lançamentos antigos têm texto sem '
  'category_id correspondente.';

create index payable_category_idx
  on public.payable (category_id) where category_id is not null;
create index receivable_category_idx
  on public.receivable (category_id) where category_id is not null;

-- Colunas novas entram nos GRANTs de escrita; category_kind NÃO entra.
grant insert (category_id), update (category_id) on public.payable    to authenticated;
grant insert (category_id), update (category_id) on public.receivable to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- SEMEADURA — plano de contas de referência
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function private.seed_finance_categories(p_clinic uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_parent uuid;
  v_group  record;
begin
  -- Idempotente por presença: clínica que já tem qualquer categoria não é
  -- tocada (mesma guarda de private.seed_evolution_templates).
  if exists (select 1 from public.finance_category where clinic_id = p_clinic) then
    return;
  end if;

  -- Plano de contas de mercado para clínica pequena. Duas grafias do material
  -- de origem foram corrigidas aqui — "Recisões"→"Rescisões" e
  -- "Assististência"→"Assistência": plano de contas com erro de digitação é
  -- erro que a clínica carrega para dentro de todo relatório.
  for v_group in
    select * from (values
      ('Atendimento',          'revenue'::public.finance_category_kind, array[
        'Consulta']),
      ('Receitas',             'revenue'::public.finance_category_kind, array[
        'Adiantamento','Ajuste de caixa','Cobrança','Comissão','Depósito',
        'Empréstimo','Mensalidade','Procedimento','Rendimentos','Transferência',
        'Vendas']),
      ('Despesas',             'expense'::public.finance_category_kind, array[
        'Ajuste de caixa','Aluguel','Assessorias e Associações','Cartório',
        'Combustível e translado','Comissão de vendedores','Confraternizações',
        'Contabilidade','Correios','Cursos e treinamentos',
        'Distribuição de lucros','Empréstimos','Energia elétrica e água',
        'Fornecedor','Licença ou aluguel de softwares','Limpeza',
        'Manutenção de equipamentos','Marketing e publicidade',
        'Material de escritório','Material de reforma','Rescisões trabalhistas',
        'Segurança','Supermercado','Taxas bancárias','Telefone celular',
        'Telefone fixo','Telefonia e Internet','Translado','Transportadora',
        'Treinamentos','Vale Alimentação','Vale Transporte','Viagens']),
      ('Despesas Financeiras', 'expense'::public.finance_category_kind, array[
        'Empréstimos','Juros','Tarifas bancárias']),
      ('Funcionários',         'expense'::public.finance_category_kind, array[
        '13º salário','Adiantamento','Alimentação',
        'Assistência médica e odontológica','Exames pré e demissionais','FGTS',
        'Horas Extras','INSS','Remuneração','Rescisões trabalhistas',
        'Vale transporte']),
      ('Impostos',             'expense'::public.finance_category_kind, array[
        'Alvará','Cofins','CSLL','GPS','ICMS','Imposto de Renda','IOF','IPI',
        'IPTU','IPVA','IR','IRPJ','IRRF','ISS','Juros','PIS','Simples Nacional'])
    ) as g(name, kind, children)
  loop
    insert into public.finance_category (clinic_id, name, kind, is_seed)
      values (p_clinic, v_group.name, v_group.kind, true)
      returning id into v_parent;

    insert into public.finance_category (clinic_id, parent_id, name, kind, is_seed)
    select p_clinic, v_parent, child, v_group.kind, true
      from unnest(v_group.children) as child;
  end loop;
end;
$fn$;

comment on function private.seed_finance_categories(uuid) is
  'Semeia o plano de contas de referência de uma clínica (6 categorias, 76 '
  'subcategorias). Idempotente por presença: não faz nada se a clínica já tem '
  'qualquer categoria.';

create or replace function private.tg_seed_finance_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  perform private.seed_finance_categories(new.id);
  return new;
end;
$fn$;

-- Função nova nasce EXECUTÁVEL POR PUBLIC (o Postgres não pergunta), e estas
-- são security definer — sem o revoke, qualquer sessão autenticada poderia
-- chamar seed_finance_categories(uuid) com o id de outra clínica. O trigger
-- continua funcionando: quem o dispara é o dono da tabela, não o cliente.
-- Mesmo tratamento que 20260725170000_higiene_seguranca.sql deu às 11 funções
-- que estavam abertas.
revoke execute on function private.seed_finance_categories(uuid) from public;
revoke execute on function private.tg_seed_finance_categories() from public;

-- Sem cláusula WHEN, ao contrário do trigger de modelos de evolução: plano de
-- contas não é assunto de especialidade — toda clínica paga aluguel.
create trigger tr_seed_finance_categories
  after insert on public.clinic
  for each row
  execute function private.tg_seed_finance_categories();

-- Clínicas que já existem nasceram antes do trigger.
select private.seed_finance_categories(c.id) from public.clinic c;
