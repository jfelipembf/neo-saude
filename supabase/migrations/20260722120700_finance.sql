-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — 08 · FINANCEIRO DA CLÍNICA
--
-- O caixa da CLÍNICA (não confundir com a assinatura que a clínica paga ao
-- Neo Saúde — essa é outra fatia). É onde erro custa dinheiro de verdade, então
-- aqui as regras são CONSTRAINT no banco e não convenção no front.
--
-- Interfaces do domain.ts cobertas:
--   BankAccount · Acquirer · InstallmentRate · Payable · Receivable ·
--   Payment · PaymentEntry · BilledTreatment · CashSession · CashMovement ·
--   CashFlowDay (VIEW — ver §9) · CollectionAttempt
--
-- ── DEPENDE DE ───────────────────────────────────────────────────────────────
--   01-fundacao.sql : public.clinic, public.profile, private.auth_clinic_ids(),
--                     private.can_access_feature/can_edit_feature,
--                     private.tg_touch_updated_at(), private.tg_set_code(),
--                     private.tg_audit(), public.money_brl, public.active_status
--   03-pacientes.sql    : public.patient(id, clinic_id)      [patient_id_clinic_uk]
--   04-profissionais.sql: public.professional(id, clinic_id) [professional_id_clinic_uk]
--   07-comercial.sql    : public.quote(id, clinic_id)        [quote_id_clinic_uk]
--
-- ORDENAÇÃO RESOLVIDA NA CONSOLIDAÇÃO: esta fatia referencia `quote`, que nascia
-- em 07-comercial.sql — numericamente DEPOIS. O comercial foi partido em
-- 02-cadastros.sql (insurance, material — consumidos por fatias anteriores) e
-- 07-comercial.sql (lead, quote, quote_item), que agora roda ANTES do
-- financeiro. Os prefixos numéricos atuais SÃO a ordem de execução; ver
-- 00-README.md.
--
-- ── DECISÕES QUE VALEM PARA O ARQUIVO INTEIRO ────────────────────────────────
--
-- A. NADA DE DINHEIRO SE APAGA. Não existe policy de DELETE em payable,
--    receivable, payment, cash_session nem cash_movement: conta errada vira
--    status='canceled' e baixa errada é ESTORNO (limpa os campos da baixa e
--    devolve o status), os dois registrados no audit_log. Um financeiro onde a
--    recepção apaga a linha não é um financeiro, é um rascunho.
--
-- B. VÍNCULO ENTRE TENANTS É IMPOSSÍVEL, não improvável. A RLS confere o
--    clinic_id DA LINHA — ela não impede alguém de gravar, na própria clínica,
--    um receivable apontando para o patient_id de outra. TODA FK desta fatia é
--    COMPOSTA (id, clinic_id), inclusive as que atravessam fatia: patient,
--    professional e quote declaram o unique (id, clinic_id) necessário, então
--    a garantia é DECLARATIVA e não depende de trigger. Trigger BEFORE não
--    protegeria o caso simétrico (mudar o clinic_id do PAI depois), e custa uma
--    consulta com SQL dinâmico por linha gravada na tabela mais quente do módulo.
--
-- B2. ON DELETE: onde o texto diz "não some por baixo de um lançamento" a FK é
--    NO ACTION, não RESTRICT. Os dois recusam o DELETE direto com o mesmo erro;
--    a diferença é que RESTRICT confere NA HORA e NO ACTION no fim da instrução.
--    `delete from clinic` cascateia para o pai (bank_account, patient, quote…) e
--    para o filho (payable, receivable…) na MESMA instrução, em ordem
--    indefinida: com RESTRICT, apagar uma clínica falha; com NO ACTION, no fim
--    da instrução os dois lados já sumiram e o cascade completa.
--
-- C. O `code` humano NUNCA vem do cliente: o GRANT de INSERT por coluna omite
--    `code`, então ele chega sempre NULL e a trigger private.tg_set_code() o
--    preenche pelo contador atômico. Sem isso, dois recibos CTR-000042.
--
-- D. Datas: `date` de verdade (o 'dd/mm/aaaa' do domain.ts é máscara de tela).
--    Momento com hora vira `timestamptz`. Dinheiro é public.money_brl.
--
-- E. Nomes de coluna: onde o domain.ts usa o campo `date` (Payment.date,
--    CollectionAttempt.date, PaymentEntry.date), a coluna ganha nome explícito
--    (payment_date, attempt_date, received_on). `date` é nome de tipo e vira
--    ruído em toda query; o mapeamento fica documentado no COMMENT da coluna.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · ENUMS DA FATIA
--
-- payment_status e payment_method nascem aqui porque o Financeiro é o dono
-- semântico deles. Outras fatias os REFERENCIAM (SubscriptionInvoice.status usa
-- payment_status, conforme o próprio domain.ts diz: "reaproveita pago |
-- pendente | vencido | cancelado") — não os redeclaram.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.payment_status as enum ('paid', 'pending', 'overdue', 'canceled');
comment on type public.payment_status is
  'domain.ts PaymentStatus. Situação de um título/recebimento. `overdue` é '
  'derivado do vencimento mas fica ARMAZENADO: a tela filtra e ordena por ele, e '
  'um filtro sobre expressão de data não usa índice. Quem vira pending→overdue é '
  'a rotina diária descrita na nota 1 do fim deste arquivo.';

create type public.payment_method as enum (
  'cash', 'credit', 'debit', 'boleto', 'check', 'pix', 'wire'
);
comment on type public.payment_method is
  'domain.ts PaymentMethod. cash=dinheiro, credit/debit=cartão, boleto, '
  'check=cheque, pix, wire=transferência/TED. Só credit e debit passam por '
  'adquirente — é essa distinção que habilita a conciliação de repasse.';

create type public.bank_account_type as enum ('checking', 'savings', 'cash');
comment on type public.bank_account_type is
  'domain.ts BankAccountType. `cash` é a conta interna da gaveta (caixa físico): '
  'não tem banco/agência/conta, e é por isso que esses campos são nuláveis.';

create type public.cash_movement_type as enum ('inflow', 'outflow');
comment on type public.cash_movement_type is
  'domain.ts CashMovement.type. O valor é SEMPRE positivo; é o tipo que dá o '
  'sinal — guardar sinal no número faz alguém somar sem filtrar e o caixa fechar errado.';

create type public.collection_channel as enum ('whatsapp', 'phone', 'email');
comment on type public.collection_channel is
  'domain.ts CollectionChannel. Por onde a cobrança do inadimplente saiu.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · HELPER: coerência de tenant em FK que atravessa fatia
--
-- ⚠️ ESTA FATIA NÃO USA MAIS ESTA FUNÇÃO. Ela ficou aqui porque é infraestrutura
-- compartilhada e `create or replace` a torna idempotente entre migrations, mas
-- toda FK do Financeiro passou a ser COMPOSTA (id, clinic_id) — inclusive as que
-- atravessam fatia, já que patient, professional e quote declaram o unique
-- composto. Uma trigger BEFORE INSERT/UPDATE é ESTRITAMENTE MAIS FRACA que a FK
-- composta: (a) só olha a linha que está sendo escrita, então um UPDATE futuro
-- em `patient.clinic_id` deixaria o vínculo cruzado para trás sem revalidar;
-- (b) cobra uma consulta com SQL dinâmico por linha gravada.
--
-- Use-a APENAS quando a tabela referenciada não puder declarar
-- `unique (id, clinic_id)` — e, nesse caso, prefira fazê-la declarar.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function private.tg_assert_same_clinic()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_col    text;
  v_ref    uuid;
  v_clinic uuid;
  v_found  uuid;
begin
  if tg_nargs <> 2 then
    raise exception 'tg_assert_same_clinic espera 2 argumentos: (tabela_referenciada, coluna_fk)';
  end if;

  v_col    := tg_argv[1];
  v_ref    := (to_jsonb(new) ->> v_col)::uuid;
  v_clinic := (to_jsonb(new) ->> 'clinic_id')::uuid;

  if v_ref is null then
    return new;   -- FK opcional não preenchida: nada a conferir
  end if;

  -- SECURITY DEFINER: a leitura precisa enxergar a linha referenciada mesmo
  -- quando ela seria invisível pela RLS de quem escreve — é exatamente o caso
  -- que estamos tentando pegar.
  execute format('select t.clinic_id from public.%I t where t.id = $1', tg_argv[0])
     into v_found using v_ref;

  if v_found is distinct from v_clinic then
    raise exception
      '%.% aponta para %(%) que não pertence a esta clínica.',
      tg_table_name, v_col, tg_argv[0], v_ref
      using errcode = '23503';
  end if;

  return new;
end;
$$;

comment on function private.tg_assert_same_clinic() is
  'BEFORE INSERT OR UPDATE: garante que a linha referenciada por uma FK é do '
  'MESMO tenant da linha que a referencia. Uso: '
  'execute function private.tg_assert_same_clinic(''patient'', ''patient_id''). '
  'Dentro de uma fatia prefira FK COMPOSTA (id, clinic_id) — custa zero em '
  'runtime; esta trigger é para FK que cruza fatia, onde não dá para exigir o '
  'unique composto da tabela do vizinho.';

revoke execute on function private.tg_assert_same_clinic() from public;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · BANK_ACCOUNT — onde o dinheiro entra e de onde sai
-- ─────────────────────────────────────────────────────────────────────────────

create table public.bank_account (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,
  name            text not null,
  type            public.bank_account_type not null,
  bank            text,
  branch          text,
  account_number  text,
  holder          text,
  opening_balance public.money_brl not null default 0,
  status          public.active_status not null default 'active',
  is_default      boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint bank_account_name_not_blank_ck check (btrim(name) <> ''),
  -- Conta de banco sem banco é cadastro pela metade; a gaveta (type='cash') é a
  -- exceção legítima e por isso os campos são nuláveis no tipo.
  constraint bank_account_bank_required_ck
    check (type = 'cash' or bank is not null),
  -- Alvo das FKs compostas de payable/receivable/acquirer.
  constraint bank_account_id_clinic_uk unique (id, clinic_id)
);

comment on table public.bank_account is
  'Contas da clínica (domain.ts BankAccount). ON DELETE CASCADE na clínica: '
  'conta bancária não existe fora do tenant.';
comment on column public.bank_account.opening_balance is
  'domain.ts BankAccount.balance — que o próprio comentário do domínio define '
  'como "saldo inicial". O nome aqui é explícito porque o saldo ATUAL não se '
  'digita: ele é derivado (view public.bank_account_balance, §10). Campo editável '
  'que finge ser saldo é a origem clássica da divergência de conciliação.';
comment on column public.bank_account.is_default is
  'Conta principal de recebimento (pré-selecionada nos modais de baixa). O índice '
  'parcial abaixo garante NO MÁXIMO UMA por clínica — duas contas "principais" '
  'fazem a UI escolher em silêncio, e silêncio em dinheiro custa caro.';
comment on column public.bank_account.status is
  'inactive = conta encerrada: some dos seletores e continua respondendo pelo '
  'histórico de baixas que aponta para ela. Por isso conta não se apaga.';

create unique index bank_account_name_uk
  on public.bank_account (clinic_id, lower(name));
create unique index bank_account_default_uk
  on public.bank_account (clinic_id) where is_default;
create index bank_account_clinic_status_idx
  on public.bank_account (clinic_id, status);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · ACQUIRER + ACQUIRER_INSTALLMENT_RATE — a maquininha e as taxas
-- ─────────────────────────────────────────────────────────────────────────────

create table public.acquirer (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references public.clinic(id) on delete cascade,
  name              text not null,
  -- Sem DEFAULT de propósito: '{}' seria um default que a própria CHECK abaixo
  -- rejeita, e default inválido é armadilha esperando o primeiro INSERT curto.
  card_brands       text[] not null,
  credit_fee        numeric(6,3) not null,
  debit_fee         numeric(6,3) not null,
  settlement_days   integer not null,
  payout_account_id uuid,
  status            public.active_status not null default 'active',
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint acquirer_name_not_blank_ck check (btrim(name) <> ''),
  constraint acquirer_card_brands_ck check (cardinality(card_brands) > 0),
  constraint acquirer_credit_fee_ck check (credit_fee >= 0 and credit_fee <= 100),
  constraint acquirer_debit_fee_ck  check (debit_fee  >= 0 and debit_fee  <= 100),
  constraint acquirer_settlement_days_ck check (settlement_days >= 0 and settlement_days <= 180),
  -- ON DELETE NO ACTION na conta de repasse: apagar a conta que recebe o repasse
  -- deixaria a conciliação sem destino e as linhas antigas sem para onde apontar.
  -- (NO ACTION e não RESTRICT — ver decisão B2 do cabeçalho: RESTRICT quebraria
  -- o `delete from clinic`, que apaga conta e adquirente na mesma instrução.)
  constraint acquirer_payout_account_fk
    foreign key (payout_account_id, clinic_id)
    references public.bank_account(id, clinic_id) on delete no action,
  constraint acquirer_id_clinic_uk unique (id, clinic_id)
);

comment on table public.acquirer is
  'Adquirente / maquininha (domain.ts Acquirer). Guarda as taxas e o D+N — é '
  'daqui que a aba Conciliação calcula "quanto a Stone deve depositar no dia X".';
comment on column public.acquirer.card_brands is
  'Bandeiras aceitas (domain.ts cardBrands: string[]). Array de ESCALAR, não de '
  'objeto: continua sendo text[] em vez de tabela filha porque é rótulo puro, '
  'sem atributo próprio, e ninguém faz join por bandeira.';
comment on column public.acquirer.credit_fee is
  'Percentual (%) por venda no crédito À VISTA. numeric(6,3) porque taxa de '
  'adquirente tem 2–3 casas (3.19, 4.495) e arredondar aqui vira centavo de '
  'diferença em toda conciliação. O crédito PARCELADO tem taxa própria por '
  'número de parcelas — ver acquirer_installment_rate.';
comment on column public.acquirer.settlement_days is
  'D+N: dias entre a venda e o repasse. Teto de 180 é sanidade de digitação '
  '(ninguém contrata D+400), não regra de negócio.';
comment on column public.acquirer.payout_account_id is
  'Conta que recebe o repasse. FK COMPOSTA com clinic_id: impede apontar para a '
  'conta bancária de OUTRA clínica.';
comment on column public.acquirer.status is
  'inactive = contrato encerrado. Não se apaga: os recebíveis conciliados '
  'continuam apontando para cá (FK NO ACTION).';

create unique index acquirer_name_uk on public.acquirer (clinic_id, lower(name));
create index acquirer_clinic_status_idx on public.acquirer (clinic_id, status);
create index acquirer_payout_account_idx
  on public.acquirer (payout_account_id, clinic_id) where payout_account_id is not null;


create table public.acquirer_installment_rate (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinic(id) on delete cascade,
  acquirer_id  uuid not null,
  installments integer not null,
  fee          numeric(6,3) not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint acquirer_installment_rate_uk unique (acquirer_id, installments),
  -- 1× não entra: à vista é acquirer.credit_fee. Duas fontes para o mesmo número
  -- é como a taxa do crédito à vista diverge entre a tela e a conciliação.
  constraint acquirer_installment_rate_installments_ck
    check (installments between 2 and 24),
  constraint acquirer_installment_rate_fee_ck check (fee >= 0 and fee <= 100),
  -- CASCADE: a tabela de taxas é PARTE da adquirente, não tem vida própria.
  constraint acquirer_installment_rate_acquirer_fk
    foreign key (acquirer_id, clinic_id)
    references public.acquirer(id, clinic_id) on delete cascade
);

comment on table public.acquirer_installment_rate is
  'domain.ts Acquirer.installmentFees — array de OBJETO, logo TABELA FILHA. '
  'Como jsonb não daria para (a) impedir 3× duplicado, (b) validar 0–100% e '
  '(c) fazer join na hora de calcular a taxa da venda parcelada.';
comment on column public.acquirer_installment_rate.fee is 'Percentual (%) sobre a venda naquele número de parcelas.';

create index acquirer_installment_rate_clinic_idx on public.acquirer_installment_rate (clinic_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · PAYABLE — contas a pagar (CTP)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.payable (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,
  code            text not null,
  description     text not null,
  category        text not null,
  supplier        text not null,
  due_date        date not null,
  amount          public.money_brl not null,
  status          public.payment_status not null default 'pending',
  -- Dados da baixa (modal "Confirmar Pagamento"). Todos nulos = conta em aberto.
  paid_at         date,
  payment_method  public.payment_method,
  bank_account_id uuid,
  paid_amount     public.money_brl,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint payable_code_uk unique (clinic_id, code),
  constraint payable_description_not_blank_ck check (btrim(description) <> ''),
  constraint payable_amount_ck check (amount > 0),
  constraint payable_paid_amount_ck check (paid_amount is null or paid_amount > 0),
  -- Conta quitada sem data de pagamento é conta que ninguém consegue conciliar.
  constraint payable_paid_requires_date_ck
    check (status <> 'paid' or paid_at is not null),
  constraint payable_bank_account_fk
    foreign key (bank_account_id, clinic_id)
    references public.bank_account(id, clinic_id) on delete no action
);

comment on table public.payable is
  'Contas a pagar (domain.ts Payable). Sem policy de DELETE: conta errada é '
  'cancelada (status=''canceled''), nunca removida — o histórico de despesa é a '
  'base do DRE e do fluxo de caixa.';
comment on column public.payable.code is
  'CTP-000001, sequencial por clínica. Preenchido pela trigger tr_code; o cliente '
  'não tem GRANT de INSERT nesta coluna.';
comment on column public.payable.category is
  'Ocupação, Utilidades, Insumos, Pessoal, Manutenção… TEXTO e não enum de '
  'propósito: plano de contas é decisão de cada clínica e mudaria a cada '
  'migration se virasse enum.';
comment on column public.payable.supplier is
  'Nome do fornecedor. Texto porque o domínio não tem entidade Fornecedor — no '
  'dia em que tiver, isto vira supplier_id e este campo morre.';
comment on column public.payable.bank_account_id is
  'De onde saiu o dinheiro. ON DELETE NO ACTION: a conta bancária não some por '
  'baixo de uma baixa já registrada (recusa o DELETE direto exatamente como '
  'RESTRICT, sem quebrar o cascade de clinic — decisão B2). FK composta = não '
  'pode ser conta de outra clínica.';
comment on column public.payable.paid_amount is
  'Valor efetivamente pago (pode diferir de amount: juros, multa, desconto de '
  'pontualidade). NULL enquanto em aberto — o ESTORNO devolve para NULL.';

create index payable_clinic_status_due_idx on public.payable (clinic_id, status, due_date);
create index payable_clinic_due_idx        on public.payable (clinic_id, due_date);
create index payable_clinic_category_idx   on public.payable (clinic_id, category);
create index payable_clinic_paid_at_idx    on public.payable (clinic_id, paid_at) where paid_at is not null;
create index payable_bank_account_idx
  on public.payable (bank_account_id, clinic_id) where bank_account_id is not null;
-- Caminho quente da aba "Contas a pagar": o que está vencendo/vencido.
create index payable_open_idx
  on public.payable (clinic_id, due_date) where status in ('pending', 'overdue');


-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · RECEIVABLE — contas a receber (CTR). O centro de gravidade da fatia.
--
-- Aceita recebimento PARCIAL: received_amount ACUMULA até cobrir o líquido
-- (gross_amount − fee). É por isso que a quitação não é "recebeu, quitou" e sim
-- a constraint receivable_paid_covers_net_ck abaixo.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.receivable (
  id                 uuid primary key default gen_random_uuid(),
  clinic_id          uuid not null references public.clinic(id) on delete cascade,
  code               text not null,
  description        text not null,
  source             text not null,
  due_date           date not null,
  method             public.payment_method,
  gross_amount       public.money_brl not null,
  fee                public.money_brl not null default 0,
  status             public.payment_status not null default 'pending',
  -- Origem comercial: parcelas nascidas de um orçamento aprovado.
  patient_id         uuid,
  quote_id           uuid,
  installment_number integer,
  installment_count  integer,
  -- Cartão: habilita a conciliação de repasse.
  acquirer_id        uuid,
  -- Dados da baixa.
  received_at        date,
  bank_account_id    uuid,
  received_amount    public.money_brl not null default 0,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Derivadas: o front calcula "líquido" e "em aberto" em TODA tela do módulo.
  -- Colunas geradas põem a fórmula em UM lugar e permitem indexar/filtrar.
  net_amount  numeric(12,2)
              generated always as (gross_amount - fee) stored,
  open_amount numeric(12,2)
              generated always as (
                case when gross_amount - fee - received_amount > 0
                     then gross_amount - fee - received_amount
                     else 0
                end
              ) stored,

  constraint receivable_code_uk unique (clinic_id, code),
  constraint receivable_description_not_blank_ck check (btrim(description) <> ''),
  constraint receivable_gross_amount_ck check (gross_amount > 0),
  -- Taxa maior que a venda seria líquido negativo — erro de digitação, não caso de uso.
  constraint receivable_fee_ck check (fee >= 0 and fee <= gross_amount),
  constraint receivable_received_amount_ck check (received_amount >= 0),
  -- Quitada exige data E cobertura do líquido. NÃO há teto em received_amount:
  -- juros/multa fazem o recebido passar do líquido, e uma constraint que rejeita
  -- isso trava a recepção às 18h de uma sexta.
  constraint receivable_paid_requires_date_ck
    check (status <> 'paid' or received_at is not null),
  constraint receivable_paid_covers_net_ck
    check (status <> 'paid' or received_amount >= gross_amount - fee),
  -- Parcela k de N: ou os dois campos, ou nenhum.
  constraint receivable_installment_pair_ck
    check ((installment_number is null) = (installment_count is null)),
  constraint receivable_installment_range_ck
    check (installment_number is null
           or (installment_number >= 1 and installment_number <= installment_count)),
  -- Adquirente só processa cartão. Com pix/boleto não há repasse a conciliar.
  constraint receivable_acquirer_is_card_ck
    check (acquirer_id is null or method is null or method in ('credit', 'debit')),
  -- Baixa parcial sem data é dinheiro que entrou em dia nenhum: some do
  -- extrato por data e reaparece no saldo da conta. Espelha o
  -- payable_paid_requires_date_ck. O estorno zera os dois campos juntos.
  constraint receivable_received_requires_date_ck
    check (received_amount = 0 or received_at is not null),

  constraint receivable_bank_account_fk
    foreign key (bank_account_id, clinic_id)
    references public.bank_account(id, clinic_id) on delete no action,
  constraint receivable_acquirer_fk
    foreign key (acquirer_id, clinic_id)
    references public.acquirer(id, clinic_id) on delete no action,
  -- FKs que atravessam fatia: TAMBÉM compostas. `patient` declara
  -- patient_id_clinic_uk (03-pacientes.sql) e `quote` declara quote_id_clinic_uk
  -- (07-comercial.sql), então a coerência de tenant é DECLARATIVA — não há
  -- janela para gravar, na clínica A, um título apontando para o paciente da B.
  constraint receivable_patient_fk
    foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id) on delete no action,
  constraint receivable_quote_fk
    foreign key (quote_id, clinic_id)
    references public.quote(id, clinic_id) on delete no action
);

comment on table public.receivable is
  'Contas a receber (domain.ts Receivable): o título. Nasce de um orçamento '
  'aprovado (uma linha por parcela), de um convênio ou de uma venda avulsa. '
  'Sem policy de DELETE — cancelamento e estorno cobrem todos os casos reais.';
comment on column public.receivable.code is 'CTR-000001, sequencial por clínica (trigger tr_code).';
comment on column public.receivable.source is
  'Consultas, Convênio, Vendas, Orçamentos, Planos… Origem COMERCIAL, texto '
  'livre — é rótulo de relatório, não chave de integridade.';
comment on column public.receivable.fee is
  'R$ retidos pela adquirente. Fica em REAIS e não em percentual: o percentual '
  'da tabela pode mudar amanhã, e o título tem de continuar mostrando a taxa que '
  'foi cobrada NELE.';
comment on column public.receivable.net_amount is
  'Coluna GERADA (gross_amount − fee): o que de fato entra na conta. É o valor '
  'que a baixa precisa cobrir para quitar o título.';
comment on column public.receivable.open_amount is
  'Coluna GERADA: saldo em aberto (líquido − recebido, com piso em zero). É a '
  'soma da aba Inadimplência e a linha do fluxo de caixa. O piso em zero evita '
  'que um pagamento a maior (juros) vire "saldo negativo" e ABATA a dívida das '
  'outras parcelas no total do devedor.';
comment on column public.receivable.patient_id is
  'ON DELETE NO ACTION: dívida de paciente não evapora porque alguém apagou o '
  'cadastro. Quem sai da clínica vira status=''inactive'' no cadastro. FK '
  'COMPOSTA (patient_id, clinic_id): o paciente é obrigatoriamente da MESMA '
  'clínica do título, garantido pelo banco e não por trigger.';
comment on column public.receivable.quote_id is
  'Orçamento que gerou a parcela. ON DELETE NO ACTION: orçamento que já virou '
  'cobrança não se apaga. O UNIQUE (quote_id, installment_number) abaixo é o que '
  'torna a geração de parcelas IDEMPOTENTE no banco — hoje isso é um `if` no '
  'service, e `if` em cliente concorrente gera parcela dobrada. FK COMPOSTA com '
  'clinic_id (alvo: quote_id_clinic_uk, em 07-comercial.sql).';
comment on column public.receivable.acquirer_id is
  'Adquirente que processa o cartão. ON DELETE NO ACTION: sem ela não dá para '
  'reconstruir de onde veio o repasse. FK composta com clinic_id.';
comment on column public.receivable.received_amount is
  'ACUMULADOR de recebimento parcial (não é "o último valor recebido"). O '
  'estorno devolve para 0.';
comment on column public.receivable.method is
  'Forma de recebimento. Nulável porque a parcela de orçamento nasce sem forma '
  'definida — ela só é conhecida na baixa (e é aí que a taxa aparece).';

create unique index receivable_quote_installment_uk
  on public.receivable (quote_id, installment_number)
  where quote_id is not null;

create index receivable_clinic_status_due_idx on public.receivable (clinic_id, status, due_date);
create index receivable_clinic_due_idx        on public.receivable (clinic_id, due_date);
create index receivable_clinic_source_idx     on public.receivable (clinic_id, source);
create index receivable_clinic_received_at_idx
  on public.receivable (clinic_id, received_at) where received_at is not null;
-- Lidera por patient_id (e não por clinic_id) de propósito: é o índice que serve
-- TANTO o extrato financeiro do paciente QUANTO a checagem da FK COMPOSTA
-- (patient_id, clinic_id) na hora de tentar apagar um paciente — daí clinic_id
-- ser a SEGUNDA coluna e não a primeira. Um índice, dois trabalhos.
create index receivable_patient_idx
  on public.receivable (patient_id, clinic_id, due_date) where patient_id is not null;
-- (quote_id, clinic_id) e não só (quote_id): é a coluna-a-coluna da FK COMPOSTA,
-- e é esse índice que o Postgres varre ao conferir o DELETE de um orçamento.
create index receivable_quote_idx
  on public.receivable (quote_id, clinic_id) where quote_id is not null;
create index receivable_bank_account_idx
  on public.receivable (bank_account_id, clinic_id) where bank_account_id is not null;
-- Aba Conciliação: agrupa por adquirente + data prevista (venda + D+N).
create index receivable_acquirer_idx
  on public.receivable (acquirer_id, clinic_id, due_date) where acquirer_id is not null;
-- Aba Inadimplência: só os vencidos, por paciente. Índice PARCIAL porque a
-- consulta é sempre a mesma fatia pequena de uma tabela que só cresce.
create index receivable_overdue_idx
  on public.receivable (clinic_id, patient_id, due_date) where status = 'overdue';


-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · PAYMENT + PAYMENT_ENTRY + BILLED_TREATMENT
--    O recebimento visto do lado do PACIENTE (aba Pagamentos do perfil).
--
--    payment 1—N payment_entry   (formas: pode ser metade PIX, metade crédito)
--    payment 1—N billed_treatment (o que foi cobrado, e de quem é a comissão)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.payment (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinic(id) on delete cascade,
  code         text not null,
  patient_id   uuid not null,
  payment_date date not null,
  description  text not null,
  amount       public.money_brl not null,
  status       public.payment_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint payment_code_uk unique (clinic_id, code),
  constraint payment_description_not_blank_ck check (btrim(description) <> ''),
  constraint payment_amount_ck check (amount > 0),
  constraint payment_id_clinic_uk unique (id, clinic_id),
  constraint payment_patient_fk
    foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id) on delete no action
);

comment on table public.payment is
  'Recebimento do paciente (domain.ts Payment) — o "documento" que a recepção '
  'emite. Note que NÃO é a mesma coisa que receivable: receivable é o TÍTULO (o '
  'que se espera receber, com vencimento e parcela); payment é o ATO na '
  'recepção, com as formas usadas. As duas visões existem no app de propósito.';
comment on column public.payment.code is 'PAG-000001, sequencial por clínica (trigger tr_code).';
comment on column public.payment.payment_date is
  'domain.ts Payment.date. Data do lançamento — não é necessariamente a data em '
  'que o dinheiro entrou (isso é payment_entry.received_on).';
comment on column public.payment.patient_id is
  'ON DELETE NO ACTION: o histórico financeiro do paciente é documento fiscal. '
  'FK COMPOSTA (patient_id, clinic_id) — recebimento não aponta para paciente de '
  'outra clínica, e isso é o banco que garante.';
comment on column public.payment.amount is
  'Total cobrado. A soma das formas (payment_entry) não pode passar disto — '
  'garantido pela constraint trigger tr_payment_total (§11 e §12).';

create index payment_clinic_patient_idx on public.payment (clinic_id, patient_id, payment_date desc);
create index payment_clinic_status_idx  on public.payment (clinic_id, status, payment_date desc);
-- Coluna-a-coluna da FK composta: é por aqui que o Postgres confere se o
-- paciente pode ser apagado. Sem ele, o DELETE de paciente vira seq scan.
create index payment_patient_idx        on public.payment (patient_id, clinic_id);


create table public.payment_entry (
  id                 uuid primary key default gen_random_uuid(),
  clinic_id          uuid not null references public.clinic(id) on delete cascade,
  payment_id         uuid not null,
  method             public.payment_method not null,
  amount             public.money_brl not null,
  received_on        date,
  card_brand         text,
  authorization_code text,
  nsu                text,
  installments       integer,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint payment_entry_amount_ck check (amount > 0),
  constraint payment_entry_installments_ck
    check (installments is null or (installments >= 1 and installments <= 24)),
  -- Dado de maquininha em pagamento PIX é lixo esperando virar bug de relatório.
  constraint payment_entry_card_fields_ck
    check (method in ('credit', 'debit')
           or (card_brand is null and authorization_code is null
               and nsu is null and installments is null)),
  -- Débito não parcela.
  constraint payment_entry_debit_single_ck
    check (method <> 'debit' or installments is null or installments = 1),
  -- CASCADE: a forma de pagamento é PARTE do recebimento, não sobrevive a ele.
  constraint payment_entry_payment_fk
    foreign key (payment_id, clinic_id)
    references public.payment(id, clinic_id) on delete cascade
);

comment on table public.payment_entry is
  'Formas usadas em um recebimento (domain.ts PaymentEntry) — array de OBJETO no '
  'TS, logo TABELA FILHA. Um pagamento de R$ 480 pode ser R$ 240 no PIX + R$ 240 '
  'no crédito, e cada metade tem NSU e autorização próprios. Em jsonb não daria '
  'para somar por forma no fechamento do caixa nem indexar por NSU na hora de '
  'achar a transação contestada.';
comment on column public.payment_entry.received_on is
  'domain.ts PaymentEntry.date — quando o dinheiro efetivamente entrou.';
comment on column public.payment_entry.nsu is
  'NSU da transação. Texto e não número: NSU tem zero à esquerda (004512).';
comment on column public.payment_entry.installments is
  'Parcelas do crédito. É este número que escolhe a linha de '
  'acquirer_installment_rate na hora de calcular a taxa.';

create index payment_entry_payment_idx on public.payment_entry (payment_id, clinic_id);
create index payment_entry_clinic_method_idx on public.payment_entry (clinic_id, method);
create index payment_entry_clinic_received_idx
  on public.payment_entry (clinic_id, received_on) where received_on is not null;
create index payment_entry_nsu_idx
  on public.payment_entry (clinic_id, nsu) where nsu is not null;


create table public.billed_treatment (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,
  payment_id      uuid not null,
  name            text not null,
  professional_id uuid not null,
  amount          public.money_brl not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint billed_treatment_name_not_blank_ck check (btrim(name) <> ''),
  constraint billed_treatment_professional_fk
    foreign key (professional_id, clinic_id)
    references public.professional(id, clinic_id) on delete no action,
  -- >= 0 e não > 0: cortesia lançada como linha de valor zero é prática comum
  -- (o procedimento aparece no recibo sem cobrar).
  constraint billed_treatment_amount_ck check (amount >= 0),
  constraint billed_treatment_payment_fk
    foreign key (payment_id, clinic_id)
    references public.payment(id, clinic_id) on delete cascade
);

comment on table public.billed_treatment is
  'Detalhamento do que foi cobrado no recebimento (domain.ts BilledTreatment). '
  'Array de OBJETO no TS → tabela filha. É a BASE DA COMISSÃO: a aba "Ganhos" do '
  'profissional soma daqui, filtrando pelos pagamentos com status=''paid''. Em '
  'jsonb, calcular comissão exigiria varrer todos os pagamentos da clínica.';
comment on column public.billed_treatment.name is
  'Nome do tratamento CONGELADO no momento da cobrança. O domínio não referencia '
  'o tratamento por id aqui (domain.ts BilledTreatment tem só name); e mesmo '
  'quando referenciar, este texto continua valendo — recibo não muda quando '
  'alguém renomeia a tabela de procedimentos.';
comment on column public.billed_treatment.professional_id is
  'Quem executou — define de quem é a comissão. ON DELETE NO ACTION: profissional '
  'com produção lançada não se apaga (vira status=''inactive''). FK COMPOSTA '
  '(professional_id, clinic_id): comissão não cruza tenant.';

create index billed_treatment_clinic_idx  on public.billed_treatment (clinic_id);
create index billed_treatment_payment_idx on public.billed_treatment (payment_id, clinic_id);
-- Caminho da aba "Ganhos" do perfil do profissional — e, de quebra, o índice da
-- FK composta que impede apagar profissional com produção lançada.
create index billed_treatment_professional_idx
  on public.billed_treatment (professional_id, clinic_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · CASH_SESSION + CASH_MOVEMENT — o caixa (gaveta) do dia
-- ─────────────────────────────────────────────────────────────────────────────

create table public.cash_session (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,
  opened_by       uuid references public.profile(id) on delete set null,
  operator_name   text not null,
  opened_at       timestamptz not null default now(),
  opening_amount  public.money_brl not null default 0,
  closed_by       uuid references public.profile(id) on delete set null,
  closed_at       timestamptz,
  counted_amount  public.money_brl,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint cash_session_operator_not_blank_ck check (btrim(operator_name) <> ''),
  constraint cash_session_opening_amount_ck check (opening_amount >= 0),
  constraint cash_session_counted_amount_ck check (counted_amount is null or counted_amount >= 0),
  constraint cash_session_closed_after_open_ck
    check (closed_at is null or closed_at >= opened_at),
  -- Contagem da gaveta só existe no fechamento.
  constraint cash_session_counted_requires_close_ck
    check (counted_amount is null or closed_at is not null),
  constraint cash_session_id_clinic_uk unique (id, clinic_id)
);

comment on table public.cash_session is
  'Turno do caixa (domain.ts CashSession). O domínio expõe `isOpen: boolean` '
  'porque é mock de UMA sessão; no banco a sessão é HISTÓRICO — `isOpen` é '
  'simplesmente `closed_at is null`. Um booleano armazenado além do closed_at '
  'seria uma segunda verdade sobre o mesmo fato, e as duas divergem no primeiro '
  'crash no meio do fechamento.';
comment on column public.cash_session.opened_by is
  'Usuário que abriu. ON DELETE SET NULL: o fechamento de caixa é documento '
  'contábil e sobrevive à saída da pessoa — por isso existe operator_name.';
comment on column public.cash_session.operator_name is
  'domain.ts CashSession.operator. Nome CONGELADO na abertura (mesmo padrão de '
  'audit_log.actor_name): o relatório do turno precisa continuar legível depois '
  'que a recepcionista sai da clínica.';
comment on column public.cash_session.counted_amount is
  'Contagem física da gaveta no fechamento. A divergência (contado − esperado) '
  'NÃO é coluna: o esperado depende dos movimentos e se calcula na view/relatório. '
  'Guardar divergência congelada só cria um número que nunca bate com a soma.';

-- A regra mais importante da tabela: UM caixa aberto por clínica. Sem isto,
-- dois navegadores abrem dois turnos e os movimentos do dia se dividem em dois
-- fechamentos que nenhum dos dois bate.
create unique index cash_session_open_uk
  on public.cash_session (clinic_id) where closed_at is null;
create index cash_session_clinic_opened_idx on public.cash_session (clinic_id, opened_at desc);
create index cash_session_opened_by_idx on public.cash_session (opened_by) where opened_by is not null;
create index cash_session_closed_by_idx on public.cash_session (closed_by) where closed_by is not null;


create table public.cash_movement (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,
  cash_session_id uuid not null,
  name            text not null,
  description     text not null,
  payment_method  public.payment_method,
  posted_at       timestamptz not null default now(),
  type            public.cash_movement_type not null,
  amount          public.money_brl not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint cash_movement_name_not_blank_ck check (btrim(name) <> ''),
  constraint cash_movement_amount_ck check (amount > 0),
  -- NO ACTION: um turno já fechado não pode ser apagado levando os lançamentos
  -- junto. Turno se corrige com lançamento de ajuste, não com DELETE. (NO ACTION
  -- e não RESTRICT pelo motivo da decisão B2 do cabeçalho.)
  constraint cash_movement_session_fk
    foreign key (cash_session_id, clinic_id)
    references public.cash_session(id, clinic_id) on delete no action
);

comment on table public.cash_movement is
  'Lançamento do caixa do dia (domain.ts CashMovement). cash_session_id é NOT '
  'NULL de propósito: movimento fora de um turno aberto não tem onde ser '
  'conferido no fechamento — seria dinheiro sem dono.';
comment on column public.cash_movement.name is 'Pagador ou recebedor (também usado para "Sangria", "Suprimento").';
comment on column public.cash_movement.payment_method is
  'domain.ts CashMovement.paymentMethod é `string` porque o mock guarda o RÓTULO '
  '("Pix", "Crédito"). No banco guardamos o valor CANÔNICO do enum e quem traduz '
  'é o front (PAYMENT_METHOD_LABEL) — rótulo em coluna impede somar por forma.';
comment on column public.cash_movement.amount is
  'Sempre POSITIVO. O sinal vem de `type` (ver comentário do enum).';

create index cash_movement_session_idx on public.cash_movement (cash_session_id, clinic_id);
create index cash_movement_clinic_posted_idx on public.cash_movement (clinic_id, posted_at desc);
create index cash_movement_clinic_type_idx on public.cash_movement (clinic_id, type, posted_at desc);


-- ─────────────────────────────────────────────────────────────────────────────
-- 9 · COLLECTION_ATTEMPT — a trilha do "já cobramos?"
-- ─────────────────────────────────────────────────────────────────────────────

create table public.collection_attempt (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null references public.clinic(id) on delete cascade,
  patient_id     uuid not null,
  attempt_date   date not null,
  channel        public.collection_channel not null,
  amount_charged public.money_brl not null,
  notes          text,
  created_by     uuid references public.profile(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint collection_attempt_amount_ck check (amount_charged > 0),
  -- FK COMPOSTA: a trilha de cobrança é do paciente DESTA clínica. CASCADE aqui
  -- é seguro (a trilha não tem valor contábil próprio) e continua sendo o
  -- receivable, com NO ACTION, quem segura a exclusão do paciente.
  constraint collection_attempt_patient_fk
    foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id) on delete cascade
);

comment on table public.collection_attempt is
  'Tentativa de cobrança registrada (domain.ts CollectionAttempt). ON DELETE '
  'CASCADE no paciente: a trilha só existe em função dele e não tem valor '
  'contábil próprio — quem segura a exclusão do paciente é o receivable (NO ACTION).';
comment on column public.collection_attempt.attempt_date is 'domain.ts CollectionAttempt.date.';
comment on column public.collection_attempt.amount_charged is
  'Total em aberto NO MOMENTO da cobrança. Valor congelado de propósito: sem '
  'ele, reabrir a trilha meses depois mostraria o saldo de hoje e a conversa '
  'registrada deixaria de fazer sentido.';
comment on column public.collection_attempt.created_by is
  'Quem cobrou. Não está no domain.ts (o mock não tem sessão), mas cobrança é '
  'contato com paciente: "quem falou com ele?" é a primeira pergunta na '
  'reclamação seguinte. ON DELETE SET NULL para não perder o registro.';

create index collection_attempt_clinic_idx
  on public.collection_attempt (clinic_id, attempt_date desc);
-- Lidera por (patient_id, clinic_id) — coluna-a-coluna da FK composta: serve a
-- trilha exibida no grupo do devedor E a varredura do ON DELETE CASCADE quando o
-- paciente é removido.
create index collection_attempt_patient_idx
  on public.collection_attempt (patient_id, clinic_id, attempt_date desc);
create index collection_attempt_created_by_idx
  on public.collection_attempt (created_by) where created_by is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 10 · DERIVADOS — CashFlowDay e saldo de conta
--
-- ► CashFlowDay é VIEW, não tabela. Decisão consciente:
--   os campos (date, entryCount, inflows, outflows) são 100% função de
--   cash_movement + payable + receivable. Materializar significaria manter três
--   triggers sincronizando um totalizador; e um totalizador que diverge do
--   detalhe é pior que não ter totalizador — a clínica passa a acreditar num
--   número errado. Se um dia o volume justificar, isto vira MATERIALIZED VIEW
--   com refresh agendado: a definição continua a mesma.
--
-- `security_invoker = true` (PG 15+): a view roda com o papel de QUEM CONSULTA,
-- então as policies de cash_movement/payable/receivable valem dentro dela. Sem
-- isso a view seria um túnel por baixo da RLS — o buraco clássico de view em
-- multi-tenant.
-- ─────────────────────────────────────────────────────────────────────────────

create view public.cash_flow_day
with (security_invoker = true) as
select
  s.clinic_id,
  s.day,
  count(*)::integer                     as entry_count,
  sum(s.inflow)::numeric(12,2)          as inflows,
  sum(s.outflow)::numeric(12,2)         as outflows,
  (sum(s.inflow) - sum(s.outflow))::numeric(12,2) as net_amount
from (
  -- REALIZADO: o que já passou pelo caixa.
  -- A data do lançamento é o DIA no fuso da clínica; em UTC, tudo que entra
  -- depois das 21h cairia no dia seguinte e o fechamento nunca bateria.
  select cm.clinic_id,
         (cm.posted_at at time zone 'America/Sao_Paulo')::date,
         case when cm.type = 'inflow'  then cm.amount else 0 end,
         case when cm.type = 'outflow' then cm.amount else 0 end
    from public.cash_movement cm
  union all
  -- PREVISTO (entradas): títulos em aberto, pelo saldo que falta receber.
  select r.clinic_id, r.due_date, r.open_amount, 0
    from public.receivable r
   where r.status in ('pending', 'overdue')
  union all
  -- PREVISTO (saídas): contas a pagar em aberto.
  select p.clinic_id, p.due_date, 0, p.amount
    from public.payable p
   where p.status in ('pending', 'overdue')
) as s(clinic_id, day, inflow, outflow)
group by s.clinic_id, s.day;

comment on view public.cash_flow_day is
  'domain.ts CashFlowDay — um dia da projeção. Une o REALIZADO (movimentos do '
  'caixa) com o PREVISTO (títulos em aberto, pela data de vencimento). Não há '
  'dupla contagem: título quitado sai do previsto (status <> pending/overdue) e '
  'entra no realizado como movimento. O SALDO PROJETADO cumulativo continua '
  'sendo do front — depende de onde a tela decide começar a contar.';

create view public.bank_account_balance
with (security_invoker = true) as
select
  a.id        as bank_account_id,
  a.clinic_id,
  a.name,
  a.status,
  a.opening_balance,
  (a.opening_balance
     -- `status <> 'canceled'` dos DOIS lados. Sem isto o cálculo era assimétrico:
     -- o lado do payable filtrava por status e o do receivable não, então um
     -- título CANCELADO cujo estorno não zerou received_amount continuava
     -- somando dinheiro que não existe no saldo da conta.
     + coalesce((select sum(r.received_amount)
                   from public.receivable r
                  where r.bank_account_id = a.id
                    and r.clinic_id = a.clinic_id
                    and r.status <> 'canceled'), 0)
     - coalesce((select sum(coalesce(p.paid_amount, p.amount))
                   from public.payable p
                  where p.bank_account_id = a.id
                    and p.clinic_id = a.clinic_id
                    and p.status = 'paid'), 0)
  )::numeric(12,2) as current_balance
from public.bank_account a;

comment on view public.bank_account_balance is
  'Saldo ATUAL de cada conta = saldo inicial + baixas de recebíveis que caíram '
  'nela − baixas de contas a pagar que saíram dela. É a resposta ao "Saldo '
  'atual" do rodapé do Fluxo de Caixa. Derivado e não armazenado pelo mesmo '
  'motivo do CashFlowDay: saldo digitado é saldo que mente. '
  'NÃO inclui cash_movement: o caixa físico (gaveta) não tem bank_account_id no '
  'domain.ts — ver nota 5 do fim do arquivo.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 11 · REGRA DE NEGÓCIO NO BANCO — soma das formas ≤ total do pagamento
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function private.tg_payment_total_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment uuid;
  v_total   numeric(12,2);
  v_entries numeric(12,2);
begin
  if tg_table_name = 'payment' then
    v_payment := new.id;
  elsif tg_op = 'DELETE' then
    v_payment := old.payment_id;
  else
    v_payment := new.payment_id;
  end if;

  select p.amount into v_total from public.payment p where p.id = v_payment;
  -- Pagamento já removido (cascade nas filhas): nada a validar.
  if v_total is null then
    return null;
  end if;

  select coalesce(sum(e.amount), 0) into v_entries
    from public.payment_entry e
   where e.payment_id = v_payment;

  if v_entries > v_total then
    raise exception
      'As formas de pagamento somam R$ % e o recebimento é de R$ % — não se recebe mais do que se cobrou.',
      v_entries, v_total
      using errcode = '23514';
  end if;

  return null;
end;
$$;

comment on function private.tg_payment_total_guard() is
  'CONSTRAINT TRIGGER DEFERRABLE INITIALLY DEFERRED: a checagem só roda no '
  'COMMIT. Tem de ser adiada porque um pagamento dividido insere N formas em uma '
  'transação — validar linha a linha reprovaria a metade do PIX antes da metade '
  'do crédito existir. SECURITY DEFINER para que a soma enxergue TODAS as formas '
  'do pagamento, inclusive se a policy do usuário mudar no meio da transação.';

revoke execute on function private.tg_payment_total_guard() from public;


-- ── Caixa fechado NÃO reabre ─────────────────────────────────────────────────
-- Sem este guarda a policy de INSERT de cash_movement (que exige
-- `closed_at is null`) é contornável em dois passos: reabre o turno de ontem
-- (closed_at está no GRANT de UPDATE porque é assim que o caixa fecha), injeta o
-- lançamento e fecha de novo. O fechamento conferido e assinado passa a mostrar
-- outro número, e o audit_log registra três UPDATEs que ninguém vai correlacionar.
create or replace function private.tg_cash_session_no_reopen()
returns trigger
language plpgsql
as $$
begin
  if old.closed_at is not null and new.closed_at is null then
    raise exception 'Caixa fechado não reabre. Lance o ajuste no turno atual.'
      using errcode = '23514';
  end if;
  if old.closed_at is not null and new.closed_at is distinct from old.closed_at then
    raise exception 'A data de fechamento de um caixa já fechado não muda.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

comment on function private.tg_cash_session_no_reopen() is
  'BEFORE UPDATE em cash_session: fechamento é irreversível. NÃO é security '
  'definer — só compara OLD com NEW, não lê nada.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 12 · TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- updated_at ------------------------------------------------------------------
create trigger tr_touch before update on public.bank_account
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.acquirer
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.acquirer_installment_rate
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.payable
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.receivable
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.payment
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.payment_entry
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.billed_treatment
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.cash_session
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.cash_movement
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.collection_attempt
  for each row execute function private.tg_touch_updated_at();

-- Código humano (prefixos reservados no cabeçalho de 01-fundacao.sql) ---------
create trigger tr_code before insert on public.payable
  for each row when (new.code is null)
  execute function private.tg_set_code('payable', 'CTP');

create trigger tr_code before insert on public.receivable
  for each row when (new.code is null)
  execute function private.tg_set_code('receivable', 'CTR');

create trigger tr_code before insert on public.payment
  for each row when (new.code is null)
  execute function private.tg_set_code('payment', 'PAG');

-- Coerência de tenant: NÃO HÁ TRIGGER. --------------------------------------
-- Havia cinco (`tr_same_clinic_*` em receivable, payment, billed_treatment e
-- collection_attempt) chamando private.tg_assert_same_clinic. Foram removidas
-- porque as FKs viraram COMPOSTAS (id, clinic_id) — inclusive as que atravessam
-- fatia — e a FK composta é mais forte que a trigger nos dois eixos: cobre o
-- UPDATE do lado do PAI (que a trigger BEFORE nunca via) e não custa uma
-- consulta com SQL dinâmico por linha. Ver decisão B do cabeçalho.
--
-- Detalhe que passa despercebido: duas daquelas triggers se chamavam
-- `tr_same_clinic_patient` em tabelas diferentes. Isso é LEGAL em Postgres
-- (nome de trigger é por tabela), mas torna impossível achá-las por nome no
-- pg_trigger sem filtrar por tabela — mais um motivo para não existirem.

-- Fechamento de caixa é irreversível -------------------------------------------
create trigger tr_no_reopen before update on public.cash_session
  for each row execute function private.tg_cash_session_no_reopen();

-- Soma das formas ≤ total do recebimento --------------------------------------
create constraint trigger tr_payment_entry_total
  after insert or update or delete on public.payment_entry
  deferrable initially deferred
  for each row execute function private.tg_payment_total_guard();

create constraint trigger tr_payment_total
  after update on public.payment
  deferrable initially deferred
  for each row execute function private.tg_payment_total_guard();

-- Auditoria -------------------------------------------------------------------
-- TUDO que move dinheiro entra na trilha. É aqui que "quem deu essa baixa?" e
-- "quem cancelou essa conta?" precisam ter resposta seis meses depois.
create trigger tr_audit after insert or update or delete on public.payable
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.receivable
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.payment
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.payment_entry
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.billed_treatment
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.bank_account
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.acquirer
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.acquirer_installment_rate
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.cash_session
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.cash_movement
  for each row execute function private.tg_audit();
-- collection_attempt TAMBÉM entra. O argumento antigo ("a tabela já é um log,
-- auditar log é ruído") só valeria se ela fosse append-only — e não é: a fatia
-- concede UPDATE (channel, notes) e DELETE a quem tem `finance`. Um log que se
-- edita e se apaga sem trilha é pior que log nenhum, porque parece prova.
-- "O paciente diz que ninguém ligou" é exatamente a pergunta que esta tabela
-- existe para responder.
create trigger tr_audit after insert or update or delete on public.collection_attempt
  for each row execute function private.tg_audit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 13 · PRIVILÉGIOS DE COLUNA
--
-- RLS decide QUAIS LINHAS; GRANT decide QUAIS COLUNAS. As duas coisas fazem
-- falta aqui: sem o GRANT de coluna, quem tem UPDATE legítimo numa conta a
-- receber da própria clínica reescreveria o `code` — e o recibo já impresso na
-- mão do paciente passaria a apontar para outro título.
--
-- Ordem obrigatória: REVOKE de tabela ANTES do GRANT de coluna — privilégio de
-- coluna só existe onde o de tabela não existe.
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on public.bank_account              from anon;
revoke all on public.acquirer                  from anon;
revoke all on public.acquirer_installment_rate from anon;
revoke all on public.payable                   from anon;
revoke all on public.receivable                from anon;
revoke all on public.payment                   from anon;
revoke all on public.payment_entry             from anon;
revoke all on public.billed_treatment          from anon;
revoke all on public.cash_session              from anon;
revoke all on public.cash_movement             from anon;
revoke all on public.collection_attempt        from anon;
revoke all on public.cash_flow_day             from anon;
revoke all on public.bank_account_balance      from anon;

-- ── bank_account / acquirer: só clinic_id é imutável.
revoke update on public.bank_account from authenticated;
grant update (name, type, bank, branch, account_number, holder,
              opening_balance, status, is_default, notes)
  on public.bank_account to authenticated;

revoke update on public.acquirer from authenticated;
grant update (name, card_brands, credit_fee, debit_fee, settlement_days,
              payout_account_id, status, notes)
  on public.acquirer to authenticated;

revoke update on public.acquirer_installment_rate from authenticated;
grant update (installments, fee) on public.acquirer_installment_rate to authenticated;

-- ── payable: `code` nunca vem do cliente (nem no INSERT nem no UPDATE).
revoke insert, update on public.payable from authenticated;
grant insert (clinic_id, description, category, supplier, due_date, amount, status,
              paid_at, payment_method, bank_account_id, paid_amount, notes)
  on public.payable to authenticated;
grant update (description, category, supplier, due_date, amount, status,
              paid_at, payment_method, bank_account_id, paid_amount, notes)
  on public.payable to authenticated;

-- ── receivable: fora da lista ficam `code` (imutável) e as colunas GERADAS
--    net_amount/open_amount (o Postgres já as recusa, o GRANT documenta a intenção).
revoke insert, update on public.receivable from authenticated;
grant insert (clinic_id, description, source, due_date, method, gross_amount, fee,
              status, patient_id, quote_id, installment_number, installment_count,
              acquirer_id, received_at, bank_account_id, received_amount, notes)
  on public.receivable to authenticated;
grant update (description, source, due_date, method, gross_amount, fee, status,
              patient_id, quote_id, installment_number, installment_count,
              acquirer_id, received_at, bank_account_id, received_amount, notes)
  on public.receivable to authenticated;

-- ── payment: idem `code`. patient_id não é atualizável — recebimento lançado no
--    paciente errado se CANCELA e se refaz, para o estorno aparecer na trilha.
revoke insert, update on public.payment from authenticated;
grant insert (clinic_id, patient_id, payment_date, description, amount, status)
  on public.payment to authenticated;
grant update (payment_date, description, amount, status)
  on public.payment to authenticated;

revoke update on public.payment_entry from authenticated;
grant update (method, amount, received_on, card_brand, authorization_code, nsu, installments)
  on public.payment_entry to authenticated;

revoke update on public.billed_treatment from authenticated;
grant update (name, professional_id, amount) on public.billed_treatment to authenticated;

-- ── cash_session: abertura é fato consumado. Só o fechamento é editável.
--    O INSERT também é por coluna: sem isso dá para nascer um turno JÁ FECHADO
--    (closed_at/counted_amount no mesmo INSERT), que passa por baixo do índice
--    parcial cash_session_open_uk e produz um fechamento que ninguém abriu.
revoke insert, update on public.cash_session from authenticated;
grant insert (clinic_id, opened_by, operator_name, opened_at, opening_amount, notes)
  on public.cash_session to authenticated;
grant update (closed_by, closed_at, counted_amount, notes)
  on public.cash_session to authenticated;

-- ── cash_movement: lançamento de caixa NÃO se edita (nem valor, nem tipo, nem
--    turno). Errou? lança o ajuste. É o que separa um livro-caixa de um bloco de
--    rascunho — e o único UPDATE que sobra é corrigir a descrição.
revoke update on public.cash_movement from authenticated;
grant update (name, description) on public.cash_movement to authenticated;

revoke update on public.collection_attempt from authenticated;
grant update (channel, notes) on public.collection_attempt to authenticated;

-- ── Cinturão E suspensório para a decisão A (nada de dinheiro se apaga):
--    ausência de policy de DELETE já bloquearia, mas o REVOKE torna a intenção
--    explícita e sobrevive a alguém acrescentar uma policy "por engano" depois.
revoke delete on public.payable       from authenticated;
revoke delete on public.receivable    from authenticated;
revoke delete on public.payment       from authenticated;
revoke delete on public.cash_session  from authenticated;
revoke delete on public.cash_movement from authenticated;

-- Views derivadas: leitura e NADA MAIS — e o revoke não é decorativo.
-- `bank_account_balance` é uma view AUTO-ATUALIZÁVEL (uma única relação no FROM,
-- sem agregado nem GROUP BY; subconsulta escalar no SELECT não desqualifica), e
-- os privilégios default do Supabase dão insert/update/delete a `authenticated`
-- em tudo que nasce em `public`. Sem este revoke, `delete from
-- public.bank_account_balance` seria um DELETE em bank_account por outro nome.
revoke insert, update, delete on public.cash_flow_day        from authenticated;
revoke insert, update, delete on public.bank_account_balance from authenticated;
grant select on public.cash_flow_day        to authenticated;
grant select on public.bank_account_balance to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 14 · RLS
--
-- Forma padrão da fatia:
--     using (clinic_id = any(private.auth_clinic_ids())
--            and private.can_access_feature(clinic_id, 'finance'))
--
-- A versão ESCOPADA de can_access/can_edit_feature (com clinic_id) é obrigatória:
-- a sem escopo responde "em alguma das minhas clínicas" e viraria escalada no
-- dia em que alguém for gerente na clínica A e recepcionista na B.
--
-- EXCEÇÃO documentada: payment, payment_entry e billed_treatment aceitam
-- 'finance' OU 'patients'. Esses três aparecem na aba Pagamentos do PERFIL DO
-- PACIENTE, e o plano `starter` sequer inclui a feature `finance` — exigir só
-- 'finance' deixaria a aba quebrada para a clínica inteira no plano de entrada.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.bank_account              enable row level security;
alter table public.acquirer                  enable row level security;
alter table public.acquirer_installment_rate enable row level security;
alter table public.payable                   enable row level security;
alter table public.receivable                enable row level security;
alter table public.payment                   enable row level security;
alter table public.payment_entry             enable row level security;
alter table public.billed_treatment          enable row level security;
alter table public.cash_session              enable row level security;
alter table public.cash_movement             enable row level security;
alter table public.collection_attempt        enable row level security;

-- ── bank_account ─────────────────────────────────────────────────────────────
create policy bank_account_select on public.bank_account
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'finance'));

create policy bank_account_insert on public.bank_account
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'finance'));

create policy bank_account_update on public.bank_account
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'))
  with check (clinic_id = any(private.auth_clinic_ids()));

-- DELETE permitido só enquanto a conta não foi usada: as FKs NO ACTION de
-- payable/receivable/acquirer barram o resto. Conta em uso vira status='inactive'.
create policy bank_account_delete on public.bank_account
  for delete to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'));

-- ── acquirer ─────────────────────────────────────────────────────────────────
create policy acquirer_select on public.acquirer
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'finance'));

create policy acquirer_insert on public.acquirer
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'finance'));

create policy acquirer_update on public.acquirer
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'))
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy acquirer_delete on public.acquirer
  for delete to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'));

-- ── acquirer_installment_rate ────────────────────────────────────────────────
create policy acquirer_installment_rate_select on public.acquirer_installment_rate
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'finance'));

create policy acquirer_installment_rate_insert on public.acquirer_installment_rate
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'finance'));

create policy acquirer_installment_rate_update on public.acquirer_installment_rate
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'))
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy acquirer_installment_rate_delete on public.acquirer_installment_rate
  for delete to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'));

-- ── payable ──────────────────────────────────────────────────────────────────
create policy payable_select on public.payable
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'finance'));

create policy payable_insert on public.payable
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'finance'));

create policy payable_update on public.payable
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'))
  with check (clinic_id = any(private.auth_clinic_ids()));
-- Sem DELETE (decisão A do cabeçalho): conta a pagar se CANCELA.

-- ── receivable ───────────────────────────────────────────────────────────────
create policy receivable_select on public.receivable
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'finance'));

create policy receivable_insert on public.receivable
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'finance'));

create policy receivable_update on public.receivable
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'))
  with check (clinic_id = any(private.auth_clinic_ids()));
-- Sem DELETE: título se CANCELA. A geração de parcelas do orçamento também não
-- pode "limpar e refazer" — é o UNIQUE (quote_id, installment_number) que a
-- torna idempotente.

-- ── payment (ver EXCEÇÃO no cabeçalho da seção) ──────────────────────────────
create policy payment_select on public.payment
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'finance', 'patients'));

create policy payment_insert on public.payment
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'finance', 'patients'));

create policy payment_update on public.payment
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance', 'patients'))
  with check (clinic_id = any(private.auth_clinic_ids()));

-- ── payment_entry ────────────────────────────────────────────────────────────
create policy payment_entry_select on public.payment_entry
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'finance', 'patients'));

create policy payment_entry_insert on public.payment_entry
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'finance', 'patients'));

create policy payment_entry_update on public.payment_entry
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance', 'patients'))
  with check (clinic_id = any(private.auth_clinic_ids()));

-- DELETE existe aqui (e não no pai): corrigir a forma de pagamento antes de
-- fechar o recebimento é rotina de recepção, e a linha é detalhe do documento.
create policy payment_entry_delete on public.payment_entry
  for delete to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance', 'patients'));

-- ── billed_treatment ─────────────────────────────────────────────────────────
create policy billed_treatment_select on public.billed_treatment
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'finance', 'patients', 'professionals'));

create policy billed_treatment_insert on public.billed_treatment
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'finance', 'patients'));

create policy billed_treatment_update on public.billed_treatment
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance', 'patients'))
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy billed_treatment_delete on public.billed_treatment
  for delete to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance', 'patients'));

-- ── cash_session ─────────────────────────────────────────────────────────────
create policy cash_session_select on public.cash_session
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'finance'));

create policy cash_session_insert on public.cash_session
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'finance')
              -- Quem abre o caixa é quem está logado: assinar a abertura com o
              -- nome de outra pessoa é a fraude mais simples que existe aqui.
              and (opened_by is null or opened_by = (select auth.uid())));

create policy cash_session_update on public.cash_session
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'))
  with check (clinic_id = any(private.auth_clinic_ids()));
-- Sem DELETE: turno de caixa é documento de fechamento.

-- ── cash_movement ────────────────────────────────────────────────────────────
create policy cash_movement_select on public.cash_movement
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'finance'));

create policy cash_movement_insert on public.cash_movement
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'finance')
              -- Lançamento só entra em turno ABERTO. Sem isto, dá para injetar
              -- movimento num caixa já fechado e conferido — e o fechamento
              -- assinado passa a mostrar outro número.
              and exists (
                select 1 from public.cash_session s
                 where s.id = cash_movement.cash_session_id
                   and s.clinic_id = cash_movement.clinic_id
                   and s.closed_at is null
              ));

create policy cash_movement_update on public.cash_movement
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'))
  with check (clinic_id = any(private.auth_clinic_ids()));
-- Sem DELETE: livro-caixa se corrige com lançamento de ajuste.

-- ── collection_attempt ───────────────────────────────────────────────────────
create policy collection_attempt_select on public.collection_attempt
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'finance'));

create policy collection_attempt_insert on public.collection_attempt
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'finance')
              and (created_by is null or created_by = (select auth.uid())));

create policy collection_attempt_update on public.collection_attempt
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'))
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy collection_attempt_delete on public.collection_attempt
  for delete to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'finance'));


-- ═════════════════════════════════════════════════════════════════════════════
-- FIM DA FATIA FINANCEIRO
--
-- ── O QUE FICA DE FORA, E POR QUÊ ────────────────────────────────────────────
--
-- 1. VIRADA pending → overdue. Ninguém "fica vencido" sozinho: é preciso uma
--    rotina diária (pg_cron, 00:05 no fuso da clínica) fazendo
--        update public.payable   set status = 'overdue'
--         where status = 'pending' and due_date < current_date;
--        update public.receivable set status = 'overdue'
--         where status = 'pending' and due_date < current_date;
--    Não está aqui porque agendamento é decisão de infraestrutura (pg_cron
--    precisa ser habilitado no projeto) e porque a rotina tem de rodar com
--    service_role — não é objeto de schema. Enquanto ela não existir, o front
--    continua derivando na tela (utils openStatus) e o status armazenado fica
--    atrasado.
--
-- 2. LIGAÇÃO payment ↔ receivable. Hoje o app tem as duas visões separadas
--    (o recibo do paciente e o título a receber) e o domain.ts não as liga.
--    Quando ligar, o caminho é uma tabela de aplicação
--    `payment_allocation (payment_id, receivable_id, amount)` — N:N, porque um
--    pagamento pode quitar três parcelas e uma parcela pode ser paga em dois
--    atos. Uma FK simples em qualquer direção seria errada.
--
-- 3. JUROS E MULTA no recebimento em atraso. Não modelados no domain.ts. Por
--    isso `received_amount` NÃO tem teto: quando entrarem como colunas
--    (interest_amount, fine_amount), nada aqui precisa mudar.
--
-- 4. COMISSÃO do profissional (domain.ts ProfessionalCommission) fica na fatia
--    Administrativo; ela LÊ billed_treatment (base 'performed') e
--    payment/payment_entry (base 'received') — por isso os dois índices por
--    professional_id e por status já estão criados aqui.
--
-- 5. SALDO DA GAVETA em bank_account_balance. Contas type='cash' aparecem na
--    view com o saldo formado só por payable/receivable — cash_movement NÃO
--    entra, porque no domain.ts o movimento de caixa pende de cash_session e
--    não de uma conta. A ligação certa é `cash_session.bank_account_id`
--    (o turno acontece EM uma gaveta), e ela precisa nascer no domain.ts antes
--    de virar coluna aqui. Enquanto não nascer, o "Saldo atual" de uma conta
--    type='cash' é meia verdade — está na lista de dúvidas do relatório.
--
-- 6. FUSO HORÁRIO FIXO em cash_flow_day ('America/Sao_Paulo'). É o único fuso
--    disponível hoje: `clinic` não tem coluna de timezone. Para uma clínica em
--    Manaus ou Rio Branco o corte do dia sai 1–2 h errado, e é sempre o
--    movimento do fim da tarde que troca de dia. A correção é
--    `clinic.timezone text not null default 'America/Sao_Paulo'` na fundação e
--    um join aqui — mudança de OUTRA fatia, por isso não foi feita.
-- ═════════════════════════════════════════════════════════════════════════════
