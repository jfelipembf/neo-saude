-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — CATÁLOGO DE SERVIÇOS (Administrativo → Serviços)
--
-- Base do módulo de FISIOTERAPIA: o catálogo do que a clínica vende avulso
-- (Avaliação, Sessão de fisioterapia, RPG, Pilates clínico…). É CADASTRO, não
-- movimento — depende só de `clinic`. Alimentará os selects do Ponto de Venda e
-- dos Contratos (pacotes de sessões), por isso já nasce com a unique composta
-- (id, clinic_id): as futuras sale_item.service_id / contract_item.service_id
-- usam FK COMPOSTA para não deixar um item apontar para o serviço de outra
-- clínica (a checagem de FK roda por dentro do servidor, SEM passar por RLS).
--
-- Espelha o mesmo desenho de `insurance`/`material` (02-cadastros): LER é direito
-- de qualquer membro do tenant (o PDV precisa montar o catálogo); ESCREVER exige
-- a feature `admin`.
--
-- Depende de: 01-fundacao (clinic, private.auth_clinic_ids, can_edit_feature,
--             tg_touch_updated_at, tg_audit, enum active_status).
-- ═════════════════════════════════════════════════════════════════════════════

create table public.service (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  name        text not null,
  price       numeric(12,2) not null default 0,
  description text,
  status      public.active_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint service_name_not_blank_ck check (btrim(name) <> ''),
  -- Preço negativo é erro de digitação, não desconto. Desconto mora na venda.
  constraint service_price_ck check (price >= 0),
  -- Alvo das FKs COMPOSTAS de venda/contrato — mesmo motivo de material_id_clinic_uk.
  constraint service_id_clinic_uk unique (id, clinic_id)
);

comment on table public.service is
  'Catálogo de serviços avulsos da clínica (domain.ts Service). Base do Ponto de '
  'Venda e dos Contratos do módulo de fisioterapia. `price` é o valor de tabela; o '
  'desconto é aplicado na venda, nunca aqui.';
comment on column public.service.price is
  'Valor de tabela (numeric, não float — dinheiro é contagem de centavos). O que '
  'de fato entra pode diferir por desconto, negociado na venda.';
comment on column public.service.status is
  'inactive = fora do catálogo de novas vendas, mas vendas antigas continuam '
  'apontando para ele. Serviço já vendido NUNCA se apaga — inativar é a saída.';

-- Dois "Avaliação" na mesma clínica é typo, não cadastro novo (o select do PDV
-- ficaria ambíguo). lower() porque "avaliação" e "Avaliação" são o mesmo serviço.
create unique index service_name_uk on public.service (clinic_id, lower(name));
create index service_clinic_status_idx on public.service (clinic_id, status);

-- ── Triggers ─────────────────────────────────────────────────────────────────
create trigger tr_touch before update on public.service
  for each row execute function private.tg_touch_updated_at();
-- Auditoria: `price` entra no valor de toda venda/contrato — mudança de preço
-- tem de deixar rastro (quem mudou, de quanto para quanto).
create trigger tr_audit after insert or update or delete on public.service
  for each row execute function private.tg_audit();

-- ── Privilégios de coluna (RLS decide QUAIS LINHAS; GRANT, QUAIS COLUNAS) ─────
revoke all on public.service from anon;
revoke update, truncate on public.service from anon, authenticated;
grant update (name, price, description, status) on public.service to authenticated;
-- `clinic_id` fora da lista: mudar o tenant de uma linha É o vazamento.

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.service enable row level security;

create policy service_select on public.service
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()));

create policy service_insert on public.service
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy service_update on public.service
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy service_delete on public.service
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );
