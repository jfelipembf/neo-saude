-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — 09 · SaaS (assinatura da clínica, WhatsApp e tarefas)
--
-- Fatia: Subscription, SubscriptionInvoice, WhatsAppConnection,
--        WhatsAppAutomation, AutomationTrigger, Task, TaskStatus, TaskPriority
--        (src/types/domain.ts).
--
-- Depende de 01-fundacao.sql (clinic, plan, profile, counter/next_code,
-- private.tg_audit, private.tg_touch_updated_at, private.auth_clinic_ids,
-- private.can_access_feature / can_edit_feature, private.is_platform_admin) e
-- referencia `public.payment_status` (enum da fatia 08-financeiro · Financeiro, conforme o
-- próprio domain.ts manda: "reaproveita pago | pendente | vencido | cancelado")
-- e `public.professional` (fatia 04-profissionais, só LEITURA dentro da RPC my_subscription).
--
-- ── A LINHA QUE ESTA FATIA NÃO DEIXA NINGUÉM CRUZAR ─────────────────────────
--
-- Existem DOIS financeiros neste produto e eles não se tocam:
--
--   Financeiro da CLÍNICA (fatia 08-financeiro)      Assinatura do SAAS (este arquivo)
--   ───────────────────────────────       ─────────────────────────────────
--   payable / receivable / payment        subscription / subscription_invoice
--   dinheiro do PACIENTE                  dinheiro da CLÍNICA
--   quem escreve: a recepção              quem escreve: o gateway de cobrança
--   quem lê: feature `finance`            quem lê: feature `settings`
--
-- Misturar os dois é como uma clínica acaba emitindo recibo para o paciente com
-- o valor da própria mensalidade do sistema. Por isso NENHUMA tabela daqui
-- referencia payable/receivable/bank_account, e a fatura do SaaS (FAT-000001)
-- NÃO vira conta a pagar automaticamente — se a clínica quiser lançá-la na
-- despesa dela, cria um `payable` à mão, como faz com a conta de luz.
--
-- ── QUEM ESCREVE O QUÊ (resumo das policies) ────────────────────────────────
--
--   subscription, subscription_invoice → a clínica só LÊ. Preço, ciclo, status e
--     faturas nascem no gateway de cobrança (Stripe/Pagar.me) e entram por
--     webhook com service_role. Dar UPDATE ao cliente aqui é dar a ele o botão
--     de trocar o próprio preço — a policy diria sim, porque a linha é dele.
--   whatsapp_connection → a clínica só LÊ. Parear/desparear é ato do GATEWAY de
--     sessão; um UPDATE direto no banco marcaria "desconectado" com a sessão
--     viva do outro lado, e ninguém entenderia por que as mensagens continuam
--     saindo.
--   whatsapp_automation → a clínica ESCREVE (é a tela de Automação).
--   task → a clínica escreve (é o kanban do Dashboard).
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · ENUMS DA FATIA
--
-- Valores IDÊNTICOS aos literais do domain.ts — nada traduzido, nada inventado.
-- A ORDEM DE DECLARAÇÃO importa: enum do Postgres ordena pela ordem em que os
-- rótulos foram declarados, então declarar na ordem de exibição faz
-- `order by priority` e `order by status` já saírem certos, sem CASE na query.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.billing_cycle as enum ('monthly', 'yearly');
comment on type public.billing_cycle is
  'domain.ts BillingCycle. Periodicidade da cobrança da assinatura. É o ciclo que '
  'define de quanto em quanto tempo subscription.next_billing_date anda.';

create type public.subscription_status as enum ('active', 'past_due', 'canceled');
comment on type public.subscription_status is
  'domain.ts SubscriptionStatus. NÃO confundir com clinic.status (public.'
  'clinic_status): este é o CONTRATO, aquele é o ACESSO. Uma assinatura '
  '`past_due` normalmente ainda tem clinic.status = ''active'' — a régua de '
  'quantos dias de atraso derrubam o acesso é decisão comercial, aplicada pela '
  'rotina de cobrança, não por FK.';

create type public.whatsapp_status as enum ('connected', 'disconnected', 'connecting');
comment on type public.whatsapp_status is
  'domain.ts WhatsAppStatus. `connecting` é o intervalo entre o QR ser gerado e o '
  'aparelho ler — existe como estado de verdade porque a tela precisa parar de '
  'oferecer "Conectar" enquanto o pareamento está em curso.';

create type public.automation_trigger as enum (
  'after_booking', 'appointment_day', 'no_show', 'birthday', 'billing'
);
comment on type public.automation_trigger is
  'domain.ts AutomationTrigger — o MOMENTO que dispara a mensagem. Espelha '
  'src/pages/Settings/Automation/automations.ts (catálogo do front). '
  '`after_booking` dispara no evento (na hora que a consulta é marcada); os '
  'outros quatro disparam por DATA, em um horário escolhido — é essa diferença '
  'que a constraint whatsapp_automation_send_time_ck guarda.';

create type public.task_status as enum ('todo', 'in_progress', 'done');
comment on type public.task_status is
  'domain.ts TaskStatus. Declarado na ordem das COLUNAS do kanban (a fazer → '
  'fazendo → concluído): assim `order by status` já monta o quadro.';

create type public.task_priority as enum ('high', 'medium', 'low');
comment on type public.task_priority is
  'domain.ts TaskPriority. Declarado na ordem de URGÊNCIA decrescente, igual ao '
  'domain.ts: `order by priority` põe as altas em cima sem CASE na query e sem '
  'coluna de peso numérico para alguém manter em sincronia.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · SUBSCRIPTION — o contrato da clínica com o Neo Saúde
--
-- domain.ts Subscription. Uma linha por clínica.
--
-- O QUE NÃO ESTÁ AQUI, DE PROPÓSITO:
--
--   `plan` (o rótulo "Profissional") e `included_professionals` NÃO são colunas
--   desta tabela. A fundação já decidiu que o ENTITLEMENT mora em
--   clinic.plan_key → plan (ver comentário de clinic.plan_key). Duplicar o plano
--   aqui criaria duas verdades sobre o que a clínica pode usar, e no dia em que
--   divergissem (upgrade gravado num lado e não no outro) o cliente pagaria o
--   plano caro com as telas do barato. O rótulo e as vagas saem por JOIN — é o
--   que a RPC public.my_subscription() faz.
--
--   `professionals_in_use` também não é coluna: é `count(*)` de professional
--   ativo. Contador materializado é dívida — ou você põe trigger nas duas
--   pontas, ou ele mente na primeira exclusão.
--
-- O QUE ESTÁ AQUI: só o FATURAMENTO — quanto, de quanto em quanto tempo, desde
-- quando, quando vence a próxima e como se cobra.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.subscription (
  id                      uuid primary key default gen_random_uuid(),
  clinic_id               uuid not null references public.clinic(id) on delete cascade,

  amount                  public.money_brl not null,
  cycle                   public.billing_cycle not null default 'monthly',
  status                  public.subscription_status not null default 'active',

  started_at              date not null default current_date,
  next_billing_date       date not null,
  canceled_at             date,

  payment_method_label    text,

  -- Amarração com o gateway de cobrança (Stripe, Pagar.me…). Sem estes três
  -- campos o webhook não tem como achar a linha a atualizar — e casar por
  -- clinic_id vindo do payload é confiar no que o gateway diz sobre o TENANT.
  gateway                 text,
  gateway_customer_id     text,
  gateway_subscription_id text,

  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- Uma clínica, um contrato. Reassinatura depois de churn é UPDATE desta linha
  -- (status volta a 'active', started_at NÃO se mexe — "cliente desde" é a
  -- primeira vez, e é isso que a tela mostra).
  constraint subscription_clinic_uk unique (clinic_id),

  -- Assinatura de R$ 0,00 é cortesia/parceria e existe de verdade; negativa é
  -- erro de sinal de quem integrou o gateway.
  constraint subscription_amount_ck check (amount >= 0),
  constraint subscription_next_billing_ck check (next_billing_date >= started_at),
  constraint subscription_canceled_at_ck
    check (canceled_at is null or canceled_at >= started_at),
  -- Cancelamento sem data é o suporte tentando responder "desde quando?" com o
  -- audit_log na mão. Barra na origem.
  constraint subscription_canceled_requires_date_ck
    check (status <> 'canceled' or canceled_at is not null),
  -- PAN de cartão NUNCA entra neste banco. O rótulo é "Cartão Visa •••• 4242";
  -- 7 dígitos seguidos já é sinal de que alguém colou o número inteiro.
  constraint subscription_payment_method_label_ck
    check (payment_method_label is null or payment_method_label !~ '[0-9]{7,}'),
  constraint subscription_gateway_ref_ck
    check (gateway_subscription_id is null or gateway is not null)
);

comment on table public.subscription is
  'O que a CLÍNICA paga ao Neo Saúde (domain.ts Subscription) — NÃO é o caixa da '
  'clínica (isso é a fatia 08-financeiro · Financeiro). Escrita só por service_role: quem '
  'muda preço, ciclo e situação é o gateway de cobrança, via webhook. '
  'ON DELETE CASCADE na clínica porque contrato não sobrevive ao tenant; na '
  'prática nunca dispara, já que clínica não se apaga (vira status ''canceled''). '
  'ASSIMETRIA PROPOSITAL com subscription_invoice, que usa RESTRICT: o contrato é '
  'estado corrente e morre com o tenant; a fatura é documento contábil da '
  'plataforma e não pode ser apagada por tabela em cascata. Não "corrija" a '
  'divergência igualando os dois.';

comment on column public.subscription.amount is
  'Preço CONTRATADO por ciclo, não o preço de tabela. Fica armazenado (e não sai '
  'de plan.monthly_price) porque cliente antigo mantém o preço antigo: o mock '
  'mostra faturas de R$ 199,90 numa clínica que hoje paga R$ 249,90. Ler o preço '
  'do catálogo reescreveria a história a cada reajuste.';
comment on column public.subscription.started_at is
  'domain.ts `since` — "cliente desde". Data da PRIMEIRA assinatura, imutável: '
  'sobrevive a upgrade, downgrade e até a um cancelamento seguido de volta.';
comment on column public.subscription.next_billing_date is
  'Próxima cobrança. Armazenada, e não derivada de started_at + ciclo, porque a '
  'régua real tem cortesia, proporcional de upgrade e reprocessamento de falha — '
  'a data que vale é a que o gateway diz.';
comment on column public.subscription.payment_method_label is
  'RÓTULO de exibição ("Cartão Visa •••• 4242", "Pix", "Boleto"), nada mais. '
  'Dado de cartão (PAN, CVV, validade) NÃO existe neste banco em nenhuma forma: '
  'quem guarda é o gateway, que é quem tem PCI. O CHECK acima é o cinto de '
  'segurança contra alguém colar o número inteiro aqui algum dia.';
comment on column public.subscription.gateway is
  'Provedor da cobrança (stripe, pagarme…). Texto e não enum: trocar de gateway é '
  'decisão comercial e não pode exigir migration no meio de uma migração de '
  'meios de pagamento.';
comment on column public.subscription.gateway_subscription_id is
  'Id da assinatura NO GATEWAY. É a chave de idempotência do webhook — sem ela, '
  'reentrega de evento vira cobrança duplicada.';
comment on column public.subscription.notes is
  'Observação COMERCIAL da plataforma sobre este contrato (motivo da cortesia, '
  'acordo de desconto, número do chamado que renegociou o valor). Não vem do '
  'domain.ts nem aparece para a clínica: existe porque `amount` sozinho não '
  'explica por que uma clínica paga R$ 0,00 e a resposta hoje vive no WhatsApp '
  'do comercial. Leitura só de quem já lê a assinatura (feature `settings`) e da '
  'equipe da plataforma — por isso NÃO é lugar de dado de terceiro.';

create unique index subscription_gateway_ref_uk
  on public.subscription (gateway, gateway_subscription_id)
  where gateway_subscription_id is not null;
comment on index public.subscription_gateway_ref_uk is
  'Duas clínicas não podem apontar para a mesma assinatura do gateway — seria o '
  'webhook de uma atualizando o contrato da outra.';

create index subscription_status_idx on public.subscription (status)
  where status <> 'active';
comment on index public.subscription_status_idx is
  'Parcial: a régua de cobrança só procura quem está fora do normal (past_due, '
  'canceled). A esmagadora maioria é ''active'' e não precisa entrar no índice.';

-- Este índice NÃO começa por clinic_id, e é de propósito: quem o usa é a rotina
-- de FATURAMENTO DA PLATAFORMA (service_role), que varre todos os tenants
-- perguntando "quem vence hoje?". Índice liderado por clinic_id seria inútil
-- para essa varredura.
create index subscription_billing_due_idx
  on public.subscription (next_billing_date)
  where status in ('active', 'past_due');


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · SUBSCRIPTION_INVOICE — as faturas do SaaS (FAT-000001)
--
-- domain.ts SubscriptionInvoice. Histórico do que a clínica já pagou pelo
-- acesso — a tabela da aba "Assinatura" das Configurações.
--
-- NÃO tem `subscription_id`: a assinatura é 1:1 com a clínica (unique acima),
-- então clinic_id JÁ identifica o contrato. Uma FK que nunca discrimina nada é
-- só uma coluna a mais para manter em sincronia — e uma FK composta a mais para
-- alguém errar.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.subscription_invoice (
  id                   uuid primary key default gen_random_uuid(),
  -- ON DELETE RESTRICT, e NÃO cascade: esta tabela é o documento contábil da
  -- PLATAFORMA (é o mesmo argumento que põe restrict em plan_key logo abaixo).
  -- Cascade aqui significaria que apagar uma linha de `clinic` — por acidente,
  -- por script de limpeza, por LGPD mal aplicada — apaga o registro de quanto
  -- aquele cliente pagou ao Neo Saúde, que é receita nossa e some sem rastro.
  -- Na prática nunca dispara: clínica não se apaga, vira status 'canceled'
  -- (fundação). Quando existir expurgo de verdade, ele arquiva as faturas
  -- primeiro e a FK é justamente o que obriga a fazer isso na ordem certa.
  clinic_id            uuid not null references public.clinic(id) on delete restrict,
  code                 text not null,

  -- Competência: PRIMEIRO DIA do mês de referência. O domain.ts guarda
  -- "Julho de 2026" porque é mock e a tela imprime isso; aqui é data de verdade,
  -- senão ordenar o histórico vira ordenação alfabética ("Abril" antes de
  -- "Janeiro") e filtrar por período é impossível.
  reference_month      date not null,
  due_date             date not null,
  paid_at              date,

  amount               public.money_brl not null,
  status               public.payment_status not null default 'pending',

  -- Plano cobrado NAQUELE ciclo. Congelado na fatura: sem ele, uma fatura de
  -- R$ 199,90 numa clínica hoje no plano de R$ 249,90 é um mistério para o
  -- suporte. NULL = cobrança avulsa (taxa de implantação, add-on), que não
  -- pertence a plano nenhum.
  plan_key             text references public.plan(key)
                         on update cascade on delete restrict,

  payment_method_label text,
  -- Provedor + id da fatura NELE. O provedor vem junto de propósito, igual em
  -- `subscription`: id de gateway só é único DENTRO do gateway, e durante uma
  -- migração de meio de pagamento as duas numerações convivem no mesmo banco.
  gateway              text,
  gateway_invoice_id   text,
  -- Link do boleto/segunda via/recibo hospedado pelo gateway. É URL de fora,
  -- não Storage: quem emite o documento fiscal da cobrança é a plataforma.
  invoice_url          text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint subscription_invoice_code_uk unique (clinic_id, code),
  -- `>= 0` e não `> 0`: subscription.amount admite R$ 0,00 (cortesia, parceria,
  -- piloto) e a fatura DAQUELE contrato tem de poder existir com o mesmo valor.
  -- Exigir > 0 aqui é a régua de cobrança quebrando todo mês na única clínica
  -- que o comercial prometeu não cobrar — e a conta some do histórico dela.
  constraint subscription_invoice_amount_ck check (amount >= 0),
  -- Competência é o mês inteiro, não um dia dele. Guardar 15/07 e 01/07 como se
  -- fossem competências diferentes é como o histórico ganha duas linhas de julho.
  constraint subscription_invoice_reference_month_ck
    check (extract(day from reference_month) = 1),
  -- Fatura paga sem data de pagamento é fatura que ninguém concilia com o
  -- extrato do gateway (mesma regra de payable/receivable na fatia 08-financeiro).
  constraint subscription_invoice_paid_requires_date_ck
    check (status <> 'paid' or paid_at is not null),
  -- As duas datas podem ANTECEDER a competência: cobrança antecipada é o normal
  -- no ciclo `yearly` (boleto de dezembro cobrindo o ano que começa em janeiro)
  -- e o pagante de boleto costuma quitar dias antes. Exigir `>= reference_month`
  -- fazia o INSERT do webhook estourar exatamente na venda anual — a fatura mais
  -- cara do produto. A janela de 45 dias ainda pega o erro que importa: ano
  -- errado digitado na competência.
  constraint subscription_invoice_paid_at_ck
    check (paid_at is null or paid_at >= reference_month - 45),
  constraint subscription_invoice_due_date_ck
    check (due_date >= reference_month - 45),
  constraint subscription_invoice_payment_method_label_ck
    check (payment_method_label is null or payment_method_label !~ '[0-9]{7,}'),
  constraint subscription_invoice_gateway_ref_ck
    check (gateway_invoice_id is null or gateway is not null)
);

comment on table public.subscription_invoice is
  'Faturas da assinatura do SaaS (domain.ts SubscriptionInvoice). Emitidas pela '
  'PLATAFORMA: a clínica só lê. Não existe policy de INSERT/UPDATE/DELETE para '
  '`authenticated` — uma fatura que o devedor pode marcar como paga não é fatura. '
  'E não some por cascata: clinic_id é ON DELETE RESTRICT (ver o comentário na '
  'coluna) porque é a receita do Neo Saúde que está escrita aqui.';
comment on column public.subscription_invoice.code is
  'FAT-000001, sequencial por clínica (prefixo reservado na fundação, seção 8 do '
  'cabeçalho dela). Preenchido pela trigger tr_code; o cliente não tem GRANT '
  'nenhum de escrita nesta tabela, muito menos nesta coluna.';
comment on column public.subscription_invoice.reference_month is
  'Competência (sempre dia 1). No ciclo anual é o primeiro mês do período coberto '
  '— o app formata "Julho de 2026" a partir daqui.';
comment on column public.subscription_invoice.status is
  'Reaproveita public.payment_status da fatia 08-financeiro (paid | pending | overdue | '
  'canceled), exatamente como o domain.ts manda. Enum próprio aqui significaria '
  'dois vocabulários para a mesma ideia e dois Badge diferentes na UI.';
comment on column public.subscription_invoice.plan_key is
  'ON DELETE RESTRICT: nenhum plano some do catálogo deixando faturas apontando '
  'para o vazio — o histórico de cobrança é documento contábil da plataforma.';
comment on column public.subscription_invoice.gateway_invoice_id is
  'Id da fatura no gateway — chave de idempotência do webhook de pagamento. Só '
  'identifica junto com `gateway` (ver o unique composto abaixo).';

create unique index subscription_invoice_period_uk
  on public.subscription_invoice (clinic_id, reference_month)
  where status <> 'canceled' and plan_key is not null;
comment on index public.subscription_invoice_period_uk is
  'Uma fatura DE PLANO viva por competência: cobrar julho duas vezes é o pior bug '
  'possível num SaaS. Duas condições no predicado, cada uma por um motivo: '
  'status <> ''canceled'' porque cancelar a errada e reemitir a correta no mesmo '
  'mês tem de continuar sendo possível; plan_key is not null porque a própria '
  'coluna define NULL como cobrança avulsa (taxa de implantação, add-on), e sem '
  'essa segunda condição a taxa de implantação cobrada em julho seria recusada '
  'pela mensalidade de julho — a regra que protege o cliente impediria a primeira '
  'cobrança de todo cliente novo.';

create unique index subscription_invoice_gateway_uk
  on public.subscription_invoice (gateway, gateway_invoice_id)
  where gateway_invoice_id is not null;
comment on index public.subscription_invoice_gateway_uk is
  'Idempotência do webhook, ESCOPADA no provedor (mesma forma de '
  'subscription_gateway_ref_uk). Id de fatura só é único dentro do gateway que o '
  'emitiu: com o índice na coluna sozinha, o primeiro id repetido vindo do '
  'provedor novo durante uma migração recusaria uma fatura legítima.';

-- Caminho quente da aba Assinatura: histórico da clínica, mais recente primeiro.
create index subscription_invoice_clinic_due_idx
  on public.subscription_invoice (clinic_id, due_date desc);
create index subscription_invoice_clinic_status_idx
  on public.subscription_invoice (clinic_id, status, due_date);
create index subscription_invoice_plan_idx
  on public.subscription_invoice (plan_key) where plan_key is not null;

-- Idem subscription_billing_due_idx: sem clinic_id na frente porque quem varre é
-- a régua de INADIMPLÊNCIA DA PLATAFORMA, que pergunta "quem está vencido hoje?"
-- olhando todos os tenants de uma vez.
create index subscription_invoice_open_idx
  on public.subscription_invoice (due_date)
  where status in ('pending', 'overdue');


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · WHATSAPP_CONNECTION — a sessão do número da clínica
--
-- domain.ts WhatsAppConnection. Uma linha por clínica.
--
-- `qr_code` é CREDENCIAL: quem lê o QR válido pareia o próprio aparelho na
-- sessão do WhatsApp da clínica e passa a ler as conversas dos pacientes. Por
-- isso esta tabela é read-only para o cliente, a leitura exige a feature
-- `whatsapp` (que o plano precisa liberar E o cargo precisa permitir), o QR tem
-- validade e sai REDIGIDO do audit_log.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.whatsapp_connection (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinic(id) on delete cascade,

  status        public.whatsapp_status not null default 'disconnected',
  phone_number  public.phone_digits,
  connected_at  timestamptz,

  qr_code       text,
  qr_expires_at timestamptz,

  -- Amarração com o provedor de sessão (Cloud API oficial, ou um serviço de
  -- sessão não-oficial). O app não fala com o WhatsApp direto.
  provider      text,
  session_ref   text,
  last_error    text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint whatsapp_connection_clinic_uk unique (clinic_id),
  -- Conectado sem número e sem data é o estado que faz a tela mostrar "Conectado"
  -- com os dois campos vazios — e o suporte perder meia hora até descobrir que a
  -- sessão nunca subiu.
  constraint whatsapp_connection_connected_ck
    check (status <> 'connected' or (phone_number is not null and connected_at is not null)),
  -- NÃO existe a regra inversa ("desconectado ⇒ phone_number is null"), e a
  -- ausência é deliberada. Duas razões:
  --   1. Queda de sessão é um UPDATE PARCIAL do webhook do provedor
  --      (`set status='disconnected', last_error=...`). Com a regra inversa esse
  --      UPDATE viola o CHECK, o webhook erra, e a linha fica eternamente
  --      'connected' com a sessão morta do outro lado — exatamente o estado
  --      mentiroso que o cabeçalho desta seção diz querer evitar.
  --   2. A tela precisa do último número para dizer "o (79) 3211-0000 caiu";
  --      apagá-lo transforma o aviso em "desconectado" sem sujeito.
  -- Quem não pode confiar no número é o MOTOR DE ENVIO — e ele já não confia:
  -- a condição dele é status = 'connected', nunca "tem telefone preenchido".
  constraint whatsapp_connection_qr_expiry_ck
    check (qr_expires_at is null or qr_code is not null)
);

comment on table public.whatsapp_connection is
  'Estado do pareamento do WhatsApp da clínica (domain.ts WhatsAppConnection). '
  'Uma linha por clínica, escrita SÓ por service_role (webhook/edge function do '
  'provedor de sessão). O cliente lê. Conectar e desconectar são atos do '
  'provedor: um UPDATE direto aqui gravaria "desconectado" com a sessão viva do '
  'outro lado, e as mensagens continuariam saindo sem ninguém entender por quê.';
comment on column public.whatsapp_connection.qr_code is
  'Conteúdo do QR de pareamento. É CREDENCIAL DE SESSÃO, não enfeite: quem o lê '
  'entra na conversa dos pacientes. Curto prazo de vida (qr_expires_at), leitura '
  'atrás da feature `whatsapp` e REDIGIDO no audit_log (ver a trigger tr_audit '
  'desta tabela, que recebe ''qr_code'' como argumento).';
comment on column public.whatsapp_connection.qr_expires_at is
  'Validade do QR. Sem isto o front desenha para sempre um código que o WhatsApp '
  'já recusa, e o usuário conclui que o sistema está quebrado.';
comment on column public.whatsapp_connection.phone_number is
  'Número REMETENTE das mensagens automáticas, somente dígitos (regra 7 da '
  'fundação). O domain.ts mostra "(79) 99999-0000" porque máscara é do front. '
  'Depois de uma queda, guarda o ÚLTIMO número conhecido (não é apagado — ver o '
  'comentário longo dentro do CREATE TABLE): é ele que deixa a tela dizer qual '
  'número caiu. Preenchido não significa conectado; quem diz isso é `status`.';
comment on column public.whatsapp_connection.provider is
  'Provedor da sessão (cloud_api, um serviço de sessão…). Texto e não enum: a '
  'troca de provedor é comum neste mercado e não pode exigir migration.';
comment on column public.whatsapp_connection.last_error is
  'Último erro do provedor (sessão derrubada, número banido…). Existe para a tela '
  'poder dizer O QUE aconteceu em vez de só mostrar "desconectado".';

create index whatsapp_connection_status_idx on public.whatsapp_connection (status);
comment on index public.whatsapp_connection_status_idx is
  'Sem clinic_id na frente: quem consulta é o monitor da PLATAFORMA procurando '
  'sessões caídas em todos os tenants.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · WHATSAPP_AUTOMATION — mensagem automática por gatilho
--
-- domain.ts WhatsAppAutomation. O GATILHO é a chave (o service do front já diz:
-- "o gatilho é a chave, não muda"), então unique (clinic_id, trigger).
--
-- `trigger` como nome de coluna: TRIGGER é palavra-chave NÃO RESERVADA no
-- PostgreSQL, então a coluna pode se chamar assim sem aspas — e assim ela tem o
-- mesmo nome do campo no domain.ts.
-- ─────────────────────────────────────────────────────────────────────────────

-- 5.1 · Validação dos placeholders ---------------------------------------------
--
-- A mensagem usa {paciente}, {hora}, {valor}… O motor de envio substitui o que
-- conhece e deixa passar o resto LITERAL — ou seja, um {telefone} digitado por
-- engano chega assim mesmo no celular do paciente, e ninguém descobre até um
-- paciente reclamar. Este CHECK é o único momento em que dá para pegar o erro:
-- na hora em que a recepção salva o texto.
create or replace function private.whatsapp_placeholders_ok(
  p_message text,
  p_trigger public.automation_trigger
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select not exists (
    select 1
      from regexp_matches(coalesce(p_message, ''), '\{([A-Za-z_]+)\}', 'g') as m(token)
     where lower(token[1]) <> all (
       -- Comuns a qualquer mensagem (COMMON_VARIABLES no catálogo do front).
       array['paciente', 'clinica']
       || case p_trigger
            when 'after_booking'   then array['data', 'hora', 'profissional']
            when 'appointment_day' then array['hora', 'profissional']
            when 'no_show'         then array['data', 'profissional']
            when 'birthday'        then array[]::text[]
            when 'billing'         then array['valor', 'data']
            -- Gatilho novo ainda não mapeado: CASE devolve NULL, a comparação
            -- vira NULL, nenhuma linha é selecionada e o CHECK PASSA. Falha
            -- para o lado permissivo de propósito — travar todo INSERT de uma
            -- clínica porque alguém esqueceu de atualizar esta lista seria
            -- transformar um erro de texto em indisponibilidade.
          end
     )
  );
$$;

comment on function private.whatsapp_placeholders_ok(text, public.automation_trigger) is
  'true quando toda variável {assim} do texto é conhecida PARA AQUELE GATILHO. '
  'Espelha src/pages/Settings/Automation/automations.ts — quando um gatilho '
  'ganhar variável nova, os dois lados mudam juntos. IMMUTABLE porque é usada em '
  'CHECK constraint (depende só das colunas da linha, de nada externo).';

revoke execute on function private.whatsapp_placeholders_ok(text, public.automation_trigger) from public;
grant execute on function private.whatsapp_placeholders_ok(text, public.automation_trigger)
  to authenticated, service_role;
-- Os DOIS papéis precisam de EXECUTE: a expressão do CHECK é avaliada com o
-- papel de quem escreve, e quem escreve aqui é tanto a recepção (authenticated)
-- quanto o seed de onboarding (service_role). Revogar de `public` sem devolver a
-- service_role transformaria o INSERT do onboarding em erro de permissão.


-- 5.2 · A tabela ---------------------------------------------------------------
create table public.whatsapp_automation (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinic(id) on delete cascade,

  trigger    public.automation_trigger not null,
  status     public.active_status not null default 'inactive',
  message    text not null,
  send_time  time,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint whatsapp_automation_uk unique (clinic_id, trigger),
  constraint whatsapp_automation_message_not_blank_ck check (btrim(message) <> ''),
  -- Teto do WhatsApp para mensagem de texto. Deixar passar aqui é deixar o erro
  -- aparecer só na hora do envio, quando não há mais ninguém olhando a tela.
  constraint whatsapp_automation_message_len_ck check (char_length(message) <= 4096),
  -- Gatilho por DATA precisa de horário; gatilho por EVENTO não pode ter.
  -- Bicondicional de propósito: horário nulo num gatilho por data significa
  -- "nunca dispara" — um agendamento que silenciosamente não roda é o pior tipo
  -- de bug. Quando entrar um gatilho novo IMEDIATO, ele soma-se a esta lista.
  constraint whatsapp_automation_send_time_ck
    check ((trigger in ('after_booking')) = (send_time is null)),
  constraint whatsapp_automation_placeholders_ck
    check (private.whatsapp_placeholders_ok(message, trigger))
);

comment on table public.whatsapp_automation is
  'Mensagem automática por gatilho (domain.ts WhatsAppAutomation) — a aba '
  'Automação das Configurações. Diferente das outras tabelas desta fatia, ESTA a '
  'clínica escreve: o texto que sai para o paciente é decisão dela. '
  'ON DELETE CASCADE na clínica: automação não existe fora do tenant.';
comment on column public.whatsapp_automation.trigger is
  'A CHAVE de negócio (com clinic_id): existe no máximo uma automação por gatilho '
  'por clínica. Não é atualizável (fora do GRANT de coluna) — mudar o gatilho de '
  'uma automação é escrever outra automação, e a UI faz exatamente isso.';
comment on column public.whatsapp_automation.status is
  'Reaproveita public.active_status. `inactive` é o PADRÃO de propósito: mensagem '
  'automática nasce desligada, porque disparar texto de exemplo para paciente de '
  'verdade não tem desfazer.';
comment on column public.whatsapp_automation.message is
  'Texto com variáveis {paciente}, {clinica}, {data}, {hora}, {profissional}, '
  '{valor} — validadas pelo CHECK de placeholders conforme o gatilho.';
comment on column public.whatsapp_automation.send_time is
  'Horário do disparo dos gatilhos por data. `time` e não texto ''HH:mm'': o '
  'motor compara com a hora corrente, e comparação de string com hora quebra em '
  'volta da meia-noite. Fuso: ver a nota 3 no fim deste arquivo.';

-- Não há índice por (clinic_id) isolado: a unique whatsapp_automation_uk já
-- criou o índice (clinic_id, trigger), e ele atende tanto "as automações desta
-- clínica" quanto "esta automação desta clínica". Índice repetido é escrita mais
-- cara em troca de nada.

-- Índice do MOTOR DE ENVIO (service_role, cruza tenants): "quais automações
-- ativas disparam às 08:00?". Liderar por clinic_id aqui seria inútil — a
-- varredura é global por definição.
--
-- send_time PRIMEIRO, trigger depois. A pergunta do motor é feita pelo RELÓGIO
-- (`where send_time = '08:00'`), e o gatilho é no máximo um desempate: liderar
-- por `trigger` — cinco valores no enum inteiro — obriga a varrer o índice todo
-- a cada minuto, porque o Postgres não pula a primeira coluna quando ela não
-- está no filtro. A ordem certa é a da seletividade real, não a da declaração.
create index whatsapp_automation_due_idx
  on public.whatsapp_automation (send_time, trigger)
  where status = 'active';


-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · TASK — o kanban do Dashboard
--
-- domain.ts Task. Tarefa interna da equipe (ligar para confirmar, repor
-- material, emitir nota). NÃO é agendamento e NÃO tem paciente: é o quadro de
-- recados da recepção, que é justamente o que hoje vive em papel colado no
-- monitor.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.task (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinic(id) on delete cascade,

  title        text not null,
  priority     public.task_priority not null default 'medium',
  status       public.task_status not null default 'todo',
  due_date     date,

  -- Quem criou. ON DELETE SET NULL: a tarefa sobrevive à saída de quem a
  -- escreveu (mesmo padrão de collection_attempt.created_by, na fatia 08-financeiro).
  created_by   uuid references public.profile(id) on delete set null,
  -- Carimbo do servidor quando a tarefa entra em 'done' (ver
  -- private.tg_task_stamp_completion). Sem ele, "Concluído" cresce para sempre e
  -- não há como limpar o quadro nem medir quanto tempo uma tarefa leva.
  completed_at timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint task_title_not_blank_ck check (btrim(title) <> ''),
  constraint task_title_len_ck check (char_length(title) <= 200),
  constraint task_completed_at_ck
    check ((status = 'done') = (completed_at is not null))
);

comment on table public.task is
  'Tarefa da equipe (domain.ts Task) — o card do Dashboard e o kanban. SEM '
  'trigger de auditoria de propósito: arrastar cartão de coluna é volume alto e '
  'valor probatório zero (mesma decisão tomada para `lead`, na fatia 60).';
comment on column public.task.due_date is
  'Prazo. O domain.ts mostra ''dd/mm'' porque o card é estreito; aqui é `date` COM '
  'ano — sem ano, "10/01" visto em 28 de dezembro é indistinguível entre '
  '"atrasado há 11 meses" e "vence semana que vem", e é exatamente essa distinção '
  'que colore o card. Nulável: tarefa sem prazo é normal ("atualizar cadastros").';
comment on column public.task.priority is
  'Alta/média/baixa. Ordena sozinho pela ordem de declaração do enum.';
comment on column public.task.completed_at is
  'Escrito só pela trigger — o CHECK acima amarra ao status para que os dois '
  'nunca contem histórias diferentes.';

-- Caminho quente do KANBAN: uma coluna por vez, ordenada por urgência e prazo.
create index task_clinic_status_idx
  on public.task (clinic_id, status, priority, due_date);
-- Caminho quente do CARD DO DASHBOARD: "o que está aberto e vence quando?"
-- (atrasado · hoje · em breve). Parcial porque o card nunca olha concluídas.
create index task_clinic_open_due_idx
  on public.task (clinic_id, due_date)
  where status <> 'done';
create index task_created_by_idx
  on public.task (created_by) where created_by is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- 7.1 · Carimbo de conclusão da tarefa ----------------------------------------
create or replace function private.tg_task_stamp_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- O ramo do INSERT vem SEPARADO de propósito: em trigger de INSERT o registro
  -- OLD não existe, e PL/pgSQL avalia a condição inteira como uma consulta só —
  -- um `tg_op = 'INSERT' or old.status ...` NÃO teria curto-circuito e estouraria
  -- com "record old is not assigned yet".
  if tg_op = 'INSERT' then
    new.completed_at := case when new.status = 'done' then now() end;
    return new;
  end if;

  if new.status <> 'done' then
    new.completed_at := null;               -- reabriu: some o carimbo
  elsif old.status is distinct from 'done' then
    new.completed_at := now();              -- acabou de concluir
  else
    new.completed_at := old.completed_at;   -- já estava concluída: preserva
  end if;

  return new;
end;
$$;

comment on function private.tg_task_stamp_completion() is
  'BEFORE INSERT/UPDATE em task: a data de conclusão vem do SERVIDOR. Deixá-la no '
  'payload seria deixar o cliente escrever qualquer coisa em completed_at e '
  'quebrar o CHECK (ou pior: passar no CHECK com uma data mentirosa).';

revoke execute on function private.tg_task_stamp_completion() from public;


-- 7.2 · Registro das triggers --------------------------------------------------
create trigger tr_touch before update on public.subscription
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.subscription_invoice
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.whatsapp_connection
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.whatsapp_automation
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.task
  for each row execute function private.tg_touch_updated_at();

-- Código humano FAT-000001 (contrato da fundação, seção 8 do cabeçalho dela;
-- chave do contador = 'invoice', prefixo reservado = 'FAT').
create trigger tr_code before insert on public.subscription_invoice
  for each row when (new.code is null)
  execute function private.tg_set_code('invoice', 'FAT');

create trigger tr_stamp_completion before insert or update of status on public.task
  for each row execute function private.tg_task_stamp_completion();

-- Auditoria: onde a pergunta "quem mudou isso?" custa dinheiro ou expõe alguém.
--   subscription          → preço, ciclo e situação do contrato;
--   subscription_invoice  → o documento de cobrança;
--   whatsapp_connection   → quem pareou/desconectou o número da clínica
--                           (o QR sai REDIGIDO: o log não pode virar a via
--                           mais fácil de roubar a sessão);
--   whatsapp_automation   → o texto que sai em nome da clínica para o paciente.
-- `task` fica de fora (ver comentário da tabela).
create trigger tr_audit after insert or update or delete on public.subscription
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.subscription_invoice
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.whatsapp_connection
  for each row execute function private.tg_audit('qr_code', 'session_ref');
create trigger tr_audit after insert or update or delete on public.whatsapp_automation
  for each row execute function private.tg_audit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · PRIVILÉGIOS DE COLUNA
--
-- RLS decide QUAIS LINHAS; GRANT decide QUAIS COLUNAS. Aqui a maior parte do
-- trabalho é tirar a escrita INTEIRA de três tabelas — é mais forte do que
-- confiar só na ausência de policy, porque um `create policy` distraído numa
-- migration futura não basta para abrir o que o GRANT já fechou.
--
-- Ordem obrigatória: REVOKE de tabela primeiro; privilégio de coluna só existe
-- onde o de tabela não existe.
-- ─────────────────────────────────────────────────────────────────────────────

-- Contrato e faturas: leitura e nada mais. Escrita é do gateway (service_role).
revoke insert, update, delete on public.subscription          from anon, authenticated;
revoke insert, update, delete on public.subscription_invoice  from anon, authenticated;

-- Sessão do WhatsApp: idem — parear/desparear passa pelo provedor.
revoke insert, update, delete on public.whatsapp_connection   from anon, authenticated;

revoke update on public.whatsapp_automation from anon, authenticated;
grant update (status, message, send_time) on public.whatsapp_automation to authenticated;
-- Fora da lista, de propósito:
--   trigger   → é a chave da linha (com clinic_id). Trocar o gatilho de uma
--               automação existente é reaproveitar o texto de "aniversário" como
--               "cobrança" sem ninguém revisar — a UI cria outra linha;
--   clinic_id → mudar o tenant de uma linha É o vazamento.

revoke update on public.task from anon, authenticated;
grant update (title, priority, status, due_date) on public.task to authenticated;
-- Fora da lista:
--   created_by   → autoria não se transfere;
--   completed_at → carimbo do servidor (trigger);
--   clinic_id    → idem acima.


-- ─────────────────────────────────────────────────────────────────────────────
-- 9 · RLS
--
-- Forma canônica da fundação: `clinic_id = any(private.auth_clinic_ids())` no
-- tenant, mais o portão de feature (o plano libera E o cargo permite).
--
-- Escolha de FEATURE por tabela:
--   subscription, subscription_invoice → `settings` (a aba Assinatura vive nas
--     Configurações). Mais `private.is_platform_admin()` na LEITURA: é o
--     faturamento DA PLATAFORMA, e o suporte que atende "minha fatura não
--     chegou" precisa enxergá-lo. Isto NÃO fere a regra da fundação de manter o
--     platform_admin longe de prontuário e do financeiro do paciente — este
--     dinheiro é o nosso, não o dos pacientes da clínica.
--   whatsapp_connection, whatsapp_automation → `whatsapp` (add-on: só o plano
--     que vende a integração libera). Sem platform_admin: o QR é credencial de
--     sessão e nenhum suporte precisa dele para trabalhar.
--   task → `dashboard` (é onde o kanban e o card vivem) — mesma escolha feita
--     para `lead` na fatia 60.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.subscription         enable row level security;
alter table public.subscription_invoice enable row level security;
alter table public.whatsapp_connection  enable row level security;
alter table public.whatsapp_automation  enable row level security;
alter table public.task                 enable row level security;

-- ── subscription ─────────────────────────────────────────────────────────────
create policy subscription_select on public.subscription
  for select to authenticated
  using (
    (clinic_id = any(private.auth_clinic_ids())
     and private.can_access_feature(clinic_id, 'settings'))
    or private.is_platform_admin()
  );
-- Sem INSERT/UPDATE/DELETE: contrato é escrito pelo gateway com service_role.

-- ── subscription_invoice ─────────────────────────────────────────────────────
create policy subscription_invoice_select on public.subscription_invoice
  for select to authenticated
  using (
    (clinic_id = any(private.auth_clinic_ids())
     and private.can_access_feature(clinic_id, 'settings'))
    or private.is_platform_admin()
  );
-- Sem escrita, pelo mesmo motivo. Fatura errada é CANCELADA e reemitida pela
-- plataforma — nunca apagada: o histórico de cobrança é documento contábil.

-- ── whatsapp_connection ──────────────────────────────────────────────────────
create policy whatsapp_connection_select on public.whatsapp_connection
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'whatsapp')
  );
-- Sem escrita: o ciclo de vida da sessão é do provedor. A tela chama uma edge
-- function (connect/disconnect/refresh_qr) que fala com o provedor e, só depois
-- da resposta dele, grava aqui com service_role.

-- ── whatsapp_automation ──────────────────────────────────────────────────────
create policy whatsapp_automation_select on public.whatsapp_automation
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'whatsapp')
  );

create policy whatsapp_automation_insert on public.whatsapp_automation
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'whatsapp')
  );

create policy whatsapp_automation_update on public.whatsapp_automation
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'whatsapp')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy whatsapp_automation_delete on public.whatsapp_automation
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'whatsapp')
  );

-- ── task ─────────────────────────────────────────────────────────────────────
create policy task_select on public.task
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'dashboard')
  );

create policy task_insert on public.task
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'dashboard')
    -- Ninguém cria tarefa assinada por outra pessoa (mesma regra de
    -- collection_attempt.created_by, na fatia 08-financeiro).
    and (created_by is null or created_by = (select auth.uid()))
  );

create policy task_update on public.task
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'dashboard')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));
-- Qualquer membro move o cartão de qualquer colega, de propósito: é um quadro de
-- equipe. Tarefa "minha" que só eu movo é a receita para o quadro travar quando
-- a pessoa entra de férias.

create policy task_delete on public.task
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'dashboard')
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 10 · RPC public.my_subscription() — a aba Assinatura em UMA ida ao servidor
--
-- Monta exatamente a interface Subscription do domain.ts, incluindo os dois
-- campos que NÃO são colunas: `plan`/`included_professionals` (vêm do plano da
-- clínica) e `professionals_in_use` (é count de profissional ativo).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.my_subscription(p_clinic uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_clinic uuid;
  v_out    jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Não autenticado.' using errcode = '42501';
  end if;

  if p_clinic is not null and not (p_clinic = any(private.auth_clinic_ids())) then
    raise exception 'Sem acesso a esta clínica.' using errcode = '42501';
  end if;

  v_clinic := coalesce(p_clinic, private.auth_clinic_id());
  if v_clinic is null then
    raise exception 'Usuário sem clínica ativa.' using errcode = '42501';
  end if;

  -- SECURITY DEFINER passa por cima da RLS — então o portão de feature tem de
  -- ser conferido AQUI, à mão. Uma RPC definer sem esta linha é uma porta dos
  -- fundos para exatamente o que a policy da tabela recusa.
  if not private.can_access_feature(v_clinic, 'settings') then
    raise exception 'Sem permissão para ver a assinatura.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    -- Chaves em snake_case: o contrato do banco é snake_case e quem converte
    -- para camelCase é o service no front (mesma regra de public.my_session).
    'plan',                   pl.label,
    'plan_key',               pl.key,
    'amount',                 s.amount,
    'cycle',                  s.cycle,
    'status',                 s.status,
    'since',                  s.started_at,
    'next_billing',           s.next_billing_date,
    'canceled_at',            s.canceled_at,
    'payment_method',         s.payment_method_label,
    'included_professionals', pl.included_professionals,
    'professionals_in_use',   (
      select count(*)
        from public.professional pr
       where pr.clinic_id = v_clinic
         and pr.status = 'active'
    )
  )
    into v_out
    from public.subscription s
    join public.clinic c on c.id = s.clinic_id
    join public.plan   pl on pl.key = c.plan_key
   where s.clinic_id = v_clinic;

  -- NULL quando a clínica ainda não tem contrato (cortesia, piloto, migração em
  -- andamento). O front trata como "sem assinatura" — melhor do que inventar uma
  -- linha vazia que a tela renderiza como R$ 0,00 vencendo hoje.
  return v_out;
end;
$$;

comment on function public.my_subscription(uuid) is
  'Tudo que a aba Assinatura precisa, em uma chamada: plano (rótulo e vagas, '
  'vindos de clinic.plan_key → plan), preço contratado, ciclo, situação, datas, '
  'forma de cobrança e profissionais em uso. Devolve NULL se a clínica não tiver '
  'contrato. As FATURAS não vêm aqui — são lista paginada, e paginação em jsonb é '
  'como se paginam 300 linhas de uma vez sem querer.';

revoke execute on function public.my_subscription(uuid) from public;
grant execute on function public.my_subscription(uuid) to authenticated;


-- ═════════════════════════════════════════════════════════════════════════════
-- FIM DA FATIA SaaS
--
-- ── O QUE FICA DE FORA, E POR QUÊ ────────────────────────────────────────────
--
-- 1. SEED das automações padrão. As cinco mensagens de MOCK_WHATSAPP_AUTOMATIONS
--    são conteúdo de ONBOARDING, não de schema: quem cria a clínica cria também
--    as automações iniciais (todas com status='inactive', ver o comentário da
--    coluna). Fazer isso aqui exigiria uma clínica que ainda não existe quando
--    esta migration roda.
--
-- 2. VIRADA pending → overdue das faturas. Mesma nota 1 da fatia 08-financeiro: ninguém
--    fica vencido sozinho. A rotina diária da plataforma faz
--        update public.subscription_invoice set status = 'overdue'
--         where status = 'pending' and due_date < current_date;
--    e é ela quem também empurra subscription.status para 'past_due'. Roda com
--    service_role e é infraestrutura (pg_cron), não objeto de schema — por isso
--    o índice subscription_invoice_open_idx existe e não começa por clinic_id.
--
-- 3. FUSO HORÁRIO do disparo. `send_time` é um `time` sem fuso e a clínica não
--    tem coluna de timezone (nem no domain.ts, nem em public.clinic). Enquanto
--    não tiver, o motor de envio deve assumir America/Sao_Paulo. No dia em que
--    houver clínica fora do fuso de Brasília, o caminho é `clinic.timezone text`
--    na fatia da fundação — nada aqui muda.
--
-- 4. LOG DE MENSAGENS ENVIADAS (whatsapp_message_log). Não está no domain.ts e
--    por isso não foi modelado, mas é a primeira coisa que vai faltar em
--    produção: sem ele não há idempotência (o motor reinicia e manda o lembrete
--    duas vezes), não há prova de envio e não há como responder "por que o
--    paciente não recebeu?". Quando entrar, a forma é
--        (clinic_id, automation_id, trigger, patient_id, appointment_id,
--         phone_number, rendered_message, status, provider_message_id,
--         scheduled_for, sent_at, error)
--    com unique (automation_id, patient_id, scheduled_for) — é a unique que
--    garante o "uma vez só".
--
-- 5. LIMITE DE VAGAS (plan.included_professionals × professional ativo). A regra
--    é real e a RPC acima já mostra os dois números lado a lado, mas o BLOQUEIO
--    pertence à fatia 04-profissionais: seria uma trigger BEFORE INSERT em public.professional,
--    e uma fatia não pendura trigger na tabela da outra. Além disso a decisão de
--    produto ainda não existe — barrar o cadastro ou cobrar excedente são
--    caminhos diferentes (ver `duvidas`).
--
-- 6. HISTÓRICO DE TROCA DE PLANO. Não há tabela subscription_plan_change: a
--    troca é UPDATE em clinic.plan_key (auditado pela fundação) + UPDATE em
--    subscription.amount (auditado aqui). O audit_log responde "quem mudou o
--    quê e quando" sem uma sétima tabela para manter em sincronia. Vira tabela
--    própria no dia em que existir downgrade AGENDADO ("vale a partir da
--    próxima cobrança") — aí o banco precisa guardar um plano futuro, e isso o
--    audit_log não faz.
-- ═════════════════════════════════════════════════════════════════════════════
