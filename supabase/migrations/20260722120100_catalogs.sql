-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — 02 · CADASTROS DE APOIO (convênios e materiais)
--
-- ORIGEM: este arquivo é a METADE A de 07-comercial.sql, recortada na
-- consolidação. O recorte é MECÂNICO — nenhuma definição foi alterada, só
-- movida — e existe porque a dependência apontava para trás:
--
--     03-pacientes.sql  patient.insurance_id                → public.insurance
--     05-agenda.sql     appointment_history_material.material_id → public.material
--     06-clinico.sql    treatment_session_material.material_id   → public.material
--
-- Três fatias POSTERIORES precisavam de duas tabelas que nasciam na fatia
-- comercial (a última do conjunto). Ordenar arquivos não resolve um ciclo:
-- resolve-se separando o que é CADASTRO (depende só de `clinic`) do que é
-- MOVIMENTO (depende de paciente e profissional). É o que este arquivo faz.
--
-- Depende de: 01-fundacao.sql (clinic, private.auth_clinic_ids,
--             can_edit_feature, tg_touch_updated_at, tg_audit, domínios
--             phone_digits/email_address, enum active_status).
-- Não depende de mais nada. Roda logo depois da fundação.
--
-- LEITURA vs ESCRITA (a decisão que veio junto do recorte): `insurance` e
-- `material` são cadastros do Administrativo, mas NÃO são privados dele —
-- convênio alimenta o select do cadastro de paciente e do orçamento, material
-- alimenta a ficha clínica. Por isso LER é direito de qualquer membro do tenant
-- e ESCREVER exige a feature `admin`. Exigir `admin` para ler deixaria o combo
-- vazio para a recepção, que é a UI falhando em silêncio.
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · INSURANCE — convênios aceitos pela clínica (Administrativo → Convênios)
-- Roda ANTES de 03-pacientes.sql (patient.insurance_id aponta para cá).
--
-- domain.ts Insurance. É cadastro de apoio, mas com efeito financeiro:
-- `payout_days` é o que permite prever QUANDO o convênio repassa.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.insurance (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  name        text not null,
  ans         text,
  phone       public.phone_digits,
  email       public.email_address,
  payout_days integer,
  notes       text,
  status      public.active_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint insurance_name_not_blank_ck check (btrim(name) <> ''),
  -- ANS somente dígitos (regra 7 da fundação: máscara 00.000-0 é do front).
  -- Não virou domínio compartilhado porque é usado só nesta tabela.
  constraint insurance_ans_digits_ck check (ans is null or ans ~ '^[0-9]{6}$'),
  constraint insurance_payout_days_ck check (payout_days is null or payout_days between 0 and 365),
  -- Alvo da FK composta de quote_item: impede um item de orçamento de uma
  -- clínica apontar para o convênio de outra.
  constraint insurance_id_clinic_uk unique (id, clinic_id)
);

comment on table public.insurance is
  'Convênios aceitos pela clínica (domain.ts Insurance). ON DELETE CASCADE na '
  'clínica: convênio não existe fora do tenant. O select de convênio do app monta '
  'as opções a partir daqui + a opção "Particular", que NÃO é linha desta tabela '
  '(ver comentário de quote_item.insurance_id).';
comment on column public.insurance.ans is
  'Registro na ANS, 6 dígitos, sem máscara. Nulável: convênio local/odontológico '
  'pode não ter registro, e o cadastro não pode travar por causa disso.';
comment on column public.insurance.payout_days is
  'Prazo de repasse (D+N). Alimenta a previsão de recebimento do convênio no '
  'Financeiro — por isso é número e não texto livre.';
comment on column public.insurance.status is
  'inactive = descredenciado/em análise: some do select de novos orçamentos, mas '
  'os orçamentos antigos continuam apontando para ele. Convênio NUNCA se apaga '
  'quando já foi usado — a FK de quote_item barra o DELETE (NO ACTION); inativar '
  'é a saída correta.';

create unique index insurance_name_uk on public.insurance (clinic_id, lower(name));
create index insurance_clinic_status_idx on public.insurance (clinic_id, status);

comment on index public.insurance_name_uk is
  'Dois "Unimed" na mesma clínica é erro de digitação, não cadastro novo — e o '
  'select do orçamento ficaria ambíguo. lower() porque "unimed" e "Unimed" são o '
  'mesmo convênio.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · MATERIAL — insumos e estoque (Administrativo → Materiais)
-- Roda ANTES de 05-agenda.sql e 06-clinico.sql (os dois consomem material).
--
-- domain.ts Material. Estoque SIMPLES de propósito: saldo atual + mínimo +
-- validade. Não há tabela de movimentação nesta versão; a trilha de "quem mexeu
-- no saldo" é o audit_log (por isso a trigger de auditoria está ligada aqui).
-- ─────────────────────────────────────────────────────────────────────────────

create table public.material (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinic(id) on delete cascade,
  name         text not null,
  photo_url    text,
  in_stock     numeric(12,3) not null default 0,
  min_quantity numeric(12,3) not null default 0,
  expiry_date  date,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint material_name_not_blank_ck check (btrim(name) <> ''),
  -- Saldo negativo é sintoma de baixa duplicada, não de estoque. Barra na
  -- origem: é mais barato recusar a baixa que reconciliar depois.
  constraint material_in_stock_ck check (in_stock >= 0),
  constraint material_min_quantity_ck check (min_quantity >= 0),
  -- Alvo das FKs COMPOSTAS das outras fatias. Sem esta unique, quem referencia
  -- material só consegue FK simples `references material(id)` — e a checagem de
  -- FK roda por dentro do servidor, SEM passar por RLS: um INSERT com o uuid de
  -- um material de outra clínica seria aceito. É exatamente o débito que
  -- 05-agenda.sql e 06-clinico.sql anotavam como "trocar quando
  -- Materiais declarar unique (id, clinic_id)". Aqui está declarada.
  constraint material_id_clinic_uk unique (id, clinic_id)
);

comment on table public.material is
  'Material/insumo de estoque (domain.ts Material). A UNIDADE DE MEDIDA vive no '
  'próprio nome ("Luva de Procedimento M (cx 100)"), como no cadastro real da '
  'clínica — não há coluna `unit` porque o app nunca converte unidade.';
comment on column public.material.in_stock is
  'Saldo atual. numeric(12,3) e não integer: meia caixa, 5 ml de um frasco de 100 '
  'são consumo normal. Nunca float — saldo é contagem, não estimativa.';
comment on column public.material.min_quantity is
  'Ponto de reposição. O alerta "repor" é in_stock <= min_quantity (índice parcial '
  'material_low_stock_idx).';
comment on column public.material.expiry_date is
  'Validade do lote em estoque. `date` de verdade (o dd/mm/aaaa do domain.ts é '
  'formatação de tela) — sem isso não dá para ordenar "vence primeiro".';
comment on column public.material.photo_url is 'domain.ts Material.photo — URL pública do Storage.';

create index material_clinic_name_idx on public.material (clinic_id, lower(name));
create index material_low_stock_idx on public.material (clinic_id) where in_stock <= min_quantity;
create index material_expiry_idx on public.material (clinic_id, expiry_date) where expiry_date is not null;

comment on index public.material_low_stock_idx is
  'Índice PARCIAL sobre a comparação entre duas colunas: o card "materiais a '
  'repor" lê só as linhas em falta, que são poucas. Índice cheio custaria o '
  'tamanho da tabela para responder a mesma pergunta.';

-- Sem UNIQUE em (clinic_id, name) de propósito: a mesma resina de dois
-- fornecedores, com lotes e validades diferentes, é legitimamente duas linhas.

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

create trigger tr_touch before update on public.insurance
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.material
  for each row execute function private.tg_touch_updated_at();

-- Auditoria:
--   insurance → payout_days muda a previsão de caixa do Financeiro;
--   material  → não existe tabela de movimentação de estoque nesta versão,
--               então o audit_log É o livro do estoque.
create trigger tr_audit after insert or update or delete on public.insurance
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.material
  for each row execute function private.tg_audit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · PRIVILÉGIOS DE COLUNA
--
-- RLS decide QUAIS LINHAS; GRANT decide QUAIS COLUNAS.
-- Ordem obrigatória: REVOKE de tabela primeiro; privilégio de coluna só existe
-- onde o de tabela não existe.
-- ─────────────────────────────────────────────────────────────────────────────

-- Cadastro de apoio não é público: `anon` não tem nada aqui.
revoke all on public.insurance from anon;
revoke all on public.material  from anon;

revoke update, truncate on public.insurance from anon, authenticated;
grant update (name, ans, phone, email, payout_days, notes, status)
  on public.insurance to authenticated;

revoke update, truncate on public.material from anon, authenticated;
grant update (name, photo_url, in_stock, min_quantity, expiry_date, notes)
  on public.material to authenticated;
-- `clinic_id` fora das duas listas: mudar o tenant de uma linha É o vazamento.


-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · RLS
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.insurance enable row level security;
alter table public.material  enable row level security;

-- ── insurance ────────────────────────────────────────────────────────────────
create policy insurance_select on public.insurance
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()));

create policy insurance_insert on public.insurance
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy insurance_update on public.insurance
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy insurance_delete on public.insurance
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

-- ── material ─────────────────────────────────────────────────────────────────
create policy material_select on public.material
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()));

create policy material_insert on public.material
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

-- ESCRITA só com `admin`, inclusive para o saldo. Quando a baixa automática de
-- estoque pela ficha clínica existir, ela deve ser uma RPC SECURITY DEFINER que
-- desconta `in_stock` — e NÃO um alargamento desta policy para `patients`:
-- quem pode dar baixa em 1 luva não pode poder renomear o catálogo inteiro.
create policy material_update on public.material
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy material_delete on public.material
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- FIM DOS CADASTROS DE APOIO
--
-- FICOU DE FORA, DE PROPÓSITO:
--
-- · MOVIMENTAÇÃO DE ESTOQUE (`material_movement`). Não está no domain.ts. Até
--   existir, o audit_log de `material` é a única trilha de quem mexeu no saldo,
--   e a baixa automática pelo prontuário não existe — 06-clinico.sql grava o
--   consumo em treatment_session_material sem descontar `in_stock`.
--   Quando entrar, deve ser uma RPC SECURITY DEFINER que desconta o saldo, e
--   NÃO um alargamento da policy de UPDATE de `material` para a feature
--   `patients`: quem pode dar baixa em 1 luva não pode poder renomear o
--   catálogo inteiro.
--
-- · "PARTICULAR" NÃO É LINHA DE `insurance`. A ausência de convênio
--   (patient.insurance_id / quote_item.insurance_id = NULL) É o particular.
--   Convênio tem ANS, prazo de repasse e glosa; particular é a ausência disso.
-- ═════════════════════════════════════════════════════════════════════════════
