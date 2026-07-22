-- ═════════════════════════════════════════════════════════════════════════════
-- VÍNCULO FINANCEIRO DO PROCEDIMENTO EXECUTADO (estrutura)
--
-- Decisão de produto já tomada: procedimento EXECUTADO e salvo com valor, que
-- não esteja coberto por contrato aprovado, gera o recebível NO MESMO COMMIT.
-- Este arquivo só cria a ESTRUTURA que amarra os dois mundos; quem decide e
-- escreve é a RPC, na migration seguinte.
--
-- Por que estado + coluna, e não um booleano "faturado": um booleano não sabe
-- dizer POR QUE não foi faturado. 'covered' (a dívida já nasceu no orçamento),
-- 'unbilled' (convênio, ou sem valor) e 'not_billable' (cortesia/garantia) são
-- três ausências de cobrança com significados opostos, e confundi-las é o que
-- produz cobrança indevida.
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · UNIQUES QUE FALTAVAM PARA A FK COMPOSTA
--
-- A regra multi-tenant do projeto é FK COMPOSTA (id, clinic_id) em toda
-- referência entre tabelas do domínio — só assim o Postgres impede apontar para
-- a linha certa da clínica ERRADA. receivable e quote_item ainda não tinham o
-- alvo (id, clinic_id); sem ele a FK composta nem compila.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.receivable
  add constraint receivable_id_clinic_uk unique (id, clinic_id);

alter table public.quote_item
  add constraint quote_item_id_clinic_uk unique (id, clinic_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · ESTADOS
-- ─────────────────────────────────────────────────────────────────────────────
create type public.session_billing_status as enum (
  'unbilled',      -- ainda não virou dinheiro: sem valor, ou paciente de convênio ("A faturar")
  'billed',        -- gerou título próprio (receivable_id obrigatório)
  'covered',       -- coberto por orçamento aprovado (quote_id obrigatório) — NÃO gera título
  'not_billable'   -- cortesia/garantia/retorno (exige justificativa escrita)
);

comment on type public.session_billing_status is
  'Situação financeira de um procedimento executado. As três formas de NÃO '
  'cobrar são estados distintos de propósito: covered = a dívida já nasceu no '
  'orçamento; unbilled = ainda vai virar cobrança (convênio/sem valor); '
  'not_billable = decisão da clínica de não cobrar, com motivo registrado.';

-- Quem deve o título. No crédito a venda JÁ FOI GARANTIDA pela adquirente:
-- quem deve as parcelas é ELA, não o paciente. Coluna GERADA (e não digitada)
-- porque a resposta é dedutível de acquirer_id e não pode divergir dele.
create type public.receivable_debtor as enum ('payer', 'acquirer');

comment on type public.receivable_debtor is
  'payer = o título é contra quem contratou (paciente, locatário…) e pode virar '
  'inadimplência. acquirer = a venda passou por maquininha e quem deve o '
  'repasse é a adquirente — cobrar o paciente por isso é erro grave.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · treatment_session ↔ financeiro
--
-- N:1 de propósito nos três vínculos: várias sessões podem apontar para o mesmo
-- título (pacote pago de uma vez) e várias podem consumir o mesmo contrato.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.treatment_session
  add column billing_status      public.session_billing_status not null default 'unbilled',
  add column receivable_id       uuid,
  add column quote_id            uuid,
  add column quote_item_id       uuid,
  add column not_billable_reason text;

alter table public.treatment_session
  add constraint treatment_session_receivable_fk
    foreign key (receivable_id, clinic_id) references public.receivable(id, clinic_id),
  add constraint treatment_session_quote_fk
    foreign key (quote_id, clinic_id) references public.quote(id, clinic_id),
  -- OPCIONAL e só refina o 'covered': dizer QUAL item do orçamento a sessão
  -- consumiu. Continua proibido casar sessão com item por comparação de texto —
  -- não existe catálogo de procedimentos, e apontamento errado vira cobrança
  -- indevida. Este id só entra quando um humano escolher o item na tela.
  add constraint treatment_session_quote_item_fk
    foreign key (quote_item_id, clinic_id) references public.quote_item(id, clinic_id);

-- Os CHECKs são BICONDICIONAIS: o estado exige a coluna E a coluna exige o
-- estado. Sem a segunda metade, alguém apagaria billing_status para 'unbilled'
-- deixando receivable_id apontando para um título vivo — e a sessão sumiria do
-- relatório de faturado continuando a cobrar o paciente.
alter table public.treatment_session
  add constraint treatment_session_billed_needs_receivable_ck
    check ((billing_status = 'billed') = (receivable_id is not null)),
  add constraint treatment_session_covered_needs_quote_ck
    check ((billing_status = 'covered') = (quote_id is not null)),
  add constraint treatment_session_item_needs_quote_ck
    check (quote_item_id is null or quote_id is not null),
  add constraint treatment_session_not_billable_needs_reason_ck
    check ((billing_status = 'not_billable')
           = (not_billable_reason is not null and btrim(not_billable_reason) <> ''));

comment on column public.treatment_session.billing_status is
  'Como este procedimento virou (ou não virou) dinheiro. Escrito só pela RPC '
  'record_treatment_session — o cliente não tem GRANT de UPDATE nesta coluna.';
comment on column public.treatment_session.receivable_id is
  'Título gerado por este procedimento. Quando a venda é parcelada no cartão, '
  'aponta para a PARCELA 1; as demais se acham por receivable.treatment_session_id.';
comment on column public.treatment_session.not_billable_reason is
  'Motivo de não cobrar (cortesia, garantia, retorno incluso). Obrigatório em '
  '''not_billable'': "não cobrei" sem motivo escrito é rombo sem autor.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · receivable ↔ clínico, e o DEVEDOR explícito
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.receivable
  add column treatment_session_id uuid,
  -- Coluna GERADA: a UI e a rotina de vencimento perguntam "quem deve?" sem
  -- redescobrir a regra em cada tela. Nasce de acquirer_id, então não mente.
  add column debtor public.receivable_debtor
    generated always as (
      case when acquirer_id is null then 'payer'::public.receivable_debtor
           else 'acquirer'::public.receivable_debtor end
    ) stored;

alter table public.receivable
  add constraint receivable_session_fk
    foreign key (treatment_session_id, clinic_id)
    references public.treatment_session(id, clinic_id);

-- 🚨 A TRAVA, e ela é CHECK e não disciplina de tela: recebível de cartão NUNCA
-- fica 'overdue'. Quem deve é a adquirente e a aba Inadimplência (que filtra
-- status='overdue') passa a ser incapaz de listar um paciente por uma venda que
-- a maquininha já garantiu. Vale para crédito E débito: os dois são garantidos.
alter table public.receivable
  add constraint receivable_acquirer_never_overdue_ck
    check (acquirer_id is null or status <> 'overdue');

comment on column public.receivable.debtor is
  'Derivado de acquirer_id. ''acquirer'' = quem deve é a maquininha (venda '
  'garantida): não vira inadimplência e a baixa acontece sozinha na data do '
  'repasse. ''payer'' = título contra o contratante, sujeito a vencimento.';
comment on column public.receivable.treatment_session_id is
  'Procedimento que ORIGINOU o título (1 sessão → N parcelas de cartão). O '
  'caminho inverso, treatment_session.receivable_id, é N:1. Os dois existem '
  'porque respondem a perguntas diferentes.';

create index receivable_session_idx
  on public.receivable (clinic_id, treatment_session_id)
  where treatment_session_id is not null;

-- Índice da rotina diária: ela varre "pendentes vencendo" em TODAS as clínicas,
-- e sem isto é seq scan na tabela que mais cresce.
create index receivable_open_due_idx
  on public.receivable (due_date, debtor)
  where status = 'pending';


-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · PARÂMETROS FINANCEIROS DA CLÍNICA
--
-- Carência antes de chamar alguém de inadimplente. O padrão é 3 dias porque
-- cobrança automática de quem combinou pagar depois é o pior primeiro contato
-- do produto com o paciente do cliente. É por clínica porque quem escolhe o
-- tom da cobrança é o dono da clínica, não nós.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.clinic_finance_setting (
  clinic_id          uuid primary key references public.clinic(id) on delete cascade,
  overdue_grace_days integer     not null default 3,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint clinic_finance_setting_grace_ck
    check (overdue_grace_days between 0 and 90)
);

comment on table public.clinic_finance_setting is
  'Parâmetros financeiros por clínica. Ausência de linha = padrão do produto '
  '(3 dias de carência) — a rotina usa coalesce, então nenhuma clínica precisa '
  'ser semeada para funcionar.';

create trigger tr_touch before update on public.clinic_finance_setting
  for each row execute function private.tg_touch_updated_at();

alter table public.clinic_finance_setting enable row level security;

create policy clinic_finance_setting_select on public.clinic_finance_setting
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'finance'));

create policy clinic_finance_setting_insert on public.clinic_finance_setting
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'finance'));

create policy clinic_finance_setting_update on public.clinic_finance_setting
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'))
  with check (clinic_id = any(private.auth_clinic_ids()));

revoke all on public.clinic_finance_setting from anon;
grant select, insert on public.clinic_finance_setting to authenticated;
-- clinic_id é imutável: trocar o dono da configuração seria trocar de clínica.
grant update (overdue_grace_days) on public.clinic_finance_setting to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · O VÍNCULO FINANCEIRO NÃO SE EDITA PELO CLIENTE
--
-- treatment_session tinha GRANT de UPDATE de TABELA (veio do laço genérico da
-- migration 20260722185521). Com as colunas novas isso significaria: qualquer
-- usuário com permissão de prontuário podendo apagar `receivable_id` e sumir
-- com a cobrança, ou carimbar 'covered' num procedimento sem contrato. O INSERT
-- já era por coluna e nunca alcançou as novas.
--
-- Nenhum código do app faz UPDATE em treatment_session hoje (só INSERT via RPC),
-- então este revoke não quebra caminho existente — ele fecha um que nasceria
-- aberto.
-- ─────────────────────────────────────────────────────────────────────────────
revoke update on public.treatment_session from authenticated;
grant update (description, performed_on, professional_id, amount, notes)
  on public.treatment_session to authenticated;
