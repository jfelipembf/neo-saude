-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — CENTROS DE CUSTO (a segunda dimensão do lançamento)
--
-- O plano de contas (20260726120000) responde O QUE foi o lançamento: aluguel,
-- salário, consulta. O centro de custo responde DE QUEM foi: da Recepção, da
-- sala de Pilates, da Dra. Ana. São perguntas independentes sobre a MESMA linha
-- — "aluguel da unidade Centro" cruza uma categoria com um centro de custo —, e
-- é por isso que são duas tabelas e não uma árvore de três níveis.
--
-- ── Três diferenças propositais em relação a finance_category ────────────────
--
-- 1. NASCE VAZIA. Não há trigger de semeadura. Divisão de centro de custo é
--    decisão de organização de cada clínica (por setor? por profissional? por
--    sala?) e não existe conjunto de referência que sirva para todas — semear
--    "Administrativo/Comercial" só encheria a tela de linhas que ninguém pediu.
--    Sem semeadura, não existe `is_seed` nem policy protegendo linha de
--    referência: tudo aqui é da clínica, e a clínica manda.
--
-- 2. É PLANA. Sem parent_id. Centro de custo que precisa de sub-recorte quase
--    sempre é sinal de que o recorte devia ser outro; e a hierarquia real que
--    o lançamento tem já é a do plano de contas.
--
-- 3. NÃO TEM RÓTULO CONGELADO, ao contrário de payable.category. A diferença é
--    de natureza, não descuido: categoria é uma linha de plano de contas, e
--    renomear uma delas não pode reescrever o balanço do ano passado. Centro de
--    custo é uma UNIDADE ORGANIZACIONAL — a sala que virou "Sala de Pilates"
--    continua sendo a mesma sala, e o relatório deve passar a chamá-la assim.
--    Por isso aqui basta a FK: o nome é lido por join, sempre atual.
--
-- Depende de: 20260722120000_foundation.sql (clinic, active_status,
--             auth_clinic_ids, can_access_feature, can_edit_feature,
--             tg_touch_updated_at, tg_audit)
--             20260722120700_finance.sql (payable, receivable)
-- ═════════════════════════════════════════════════════════════════════════════

create table public.cost_center (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  name        text not null,
  status      public.active_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint cost_center_name_not_blank_ck check (btrim(name) <> ''),
  -- Alvo da FK composta de payable/receivable: garante que o centro de custo
  -- de um lançamento é da MESMA clínica dele.
  constraint cost_center_id_clinic_uk unique (id, clinic_id)
);

comment on table public.cost_center is
  'Recortes da clínica (setor, sala, unidade, profissional) usados para saber '
  'de ONDE vem cada despesa e receita. Dimensão independente do plano de contas '
  '— um lançamento pode ter os dois, um só, ou nenhum. Nasce vazia: não existe '
  'divisão de referência que sirva para toda clínica.';

comment on column public.cost_center.status is
  'inactive = some dos formulários de lançamento sem sumir do histórico nem dos '
  'relatórios. É a saída para o setor que deixou de existir, já que centro de '
  'custo com lançamento não pode ser excluído (FK ON DELETE NO ACTION).';

-- Dois "Recepção" na mesma clínica é engano de digitação, não centro novo.
create unique index cost_center_name_uk
  on public.cost_center (clinic_id, lower(name));

-- Os seletores de lançamento listam só os ativos, já na ordem da tela.
create index cost_center_active_idx
  on public.cost_center (clinic_id, name)
  where status = 'active';

create trigger tr_touch before update on public.cost_center
  for each row execute function private.tg_touch_updated_at();
create trigger tr_audit after insert or update or delete on public.cost_center
  for each row execute function private.tg_audit();

alter table public.cost_center enable row level security;

-- ── GRANTs por coluna ────────────────────────────────────────────────────────
-- O revoke all vem primeiro: o Supabase concede privilégio TABLE-WIDE por
-- default privileges em toda tabela nova do schema public, e sem ele os grants
-- abaixo seriam decorativos.
revoke all on public.cost_center from anon, authenticated;

grant select on public.cost_center to authenticated;
grant insert (clinic_id, name, status) on public.cost_center to authenticated;
grant update (name, status)           on public.cost_center to authenticated;
grant delete on public.cost_center to authenticated;

-- ── RLS ──────────────────────────────────────────────────────────────────────
create policy cost_center_select on public.cost_center
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'finance')
  );

create policy cost_center_insert on public.cost_center
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'finance')
  );

create policy cost_center_update on public.cost_center
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'finance')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

-- Sem cláusula de is_seed, ao contrário de finance_category: aqui não há linha
-- de referência a proteger. O que impede exclusão é a FK, quando já há
-- lançamento carimbado.
create policy cost_center_delete on public.cost_center
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'finance')
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- LIGAÇÃO COM OS LANÇAMENTOS
-- ═════════════════════════════════════════════════════════════════════════════
-- Sempre OPCIONAL, nos dois lados. Categoria é obrigatória porque todo
-- lançamento é de alguma natureza; centro de custo só existe se a clínica
-- escolheu se dividir. Tornar obrigatório forçaria um "Geral" artificial em
-- toda clínica que não usa a dimensão.

alter table public.payable
  add column cost_center_id uuid,
  add constraint payable_cost_center_fk
    foreign key (cost_center_id, clinic_id)
    references public.cost_center (id, clinic_id)
    on delete no action;

alter table public.receivable
  add column cost_center_id uuid,
  add constraint receivable_cost_center_fk
    foreign key (cost_center_id, clinic_id)
    references public.cost_center (id, clinic_id)
    on delete no action;

comment on column public.payable.cost_center_id is
  'Recorte da clínica a que esta despesa pertence (cost_center). NULL = a '
  'clínica não usa centros de custo, ou este lançamento não pertence a nenhum. '
  'ON DELETE NO ACTION: centro com lançamento é inativado, não excluído.';
comment on column public.receivable.cost_center_id is
  'Recorte da clínica a que esta receita pertence — ver payable.cost_center_id.';

create index payable_cost_center_idx
  on public.payable (cost_center_id) where cost_center_id is not null;
create index receivable_cost_center_idx
  on public.receivable (cost_center_id) where cost_center_id is not null;

grant insert (cost_center_id), update (cost_center_id) on public.payable    to authenticated;
grant insert (cost_center_id), update (cost_center_id) on public.receivable to authenticated;
