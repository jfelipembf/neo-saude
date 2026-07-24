-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — COMPETÊNCIA NO RECEBÍVEL (a métrica que faltava)
--
-- Diagnóstico (auditoria completa em docs/modelo-contabil.md): TODAS as
-- métricas de receita eram regime de CAIXA (por received_at) — uma venda no
-- cartão sumia do Dashboard e da aba Vendas até o repasse da adquirente cair,
-- parcela a parcela. `sale.sale_date`/`sale.total` eram gravados e NINGUÉM os
-- lia. Não existia nenhuma resposta para "quanto vendi hoje?".
--
-- A correção segue o projeto de referência (~/Documents/neo, PLANO_FINANCEIRO
-- _PDV.md): o recebível ganha `competence_date` — a data da VENDA, igual em
-- todas as parcelas. Faturamento = sum(gross_amount) por competence_date
-- (competência, bruto); caixa continua por received_at (líquido). Cada origem
-- define sua competência:
--   · PDV (checkout_sale)         → data da venda (p_sale_date)
--   · Orçamento (approve_quote)   → data da APROVAÇÃO (o aceite é a venda;
--                                    a emissão é só proposta)
--   · Procedimento (emit_session_billing) → performed_on (o serviço executado
--                                    é o fato gerador)
--
-- De carona, três dívidas da mesma auditoria:
--   · bandeira/código de autorização viram COLUNAS (card_brand,
--     authorization_code) — estavam espremidos em texto no notes;
--   · receivable.sale_id — o vínculo venda↔título não existia (reconciliar
--     PDV com Contas a Receber era heurística de texto);
--   · drop da dashboard_stats() órfã (sem consumidor no src, com definição de
--     revenue divergente da vigente — bomba de reuso futuro).
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 1 · Colunas novas ────────────────────────────────────────────────────────

alter table public.receivable add column competence_date date;
alter table public.receivable add column card_brand text;
alter table public.receivable add column authorization_code text;
alter table public.receivable add column sale_id uuid;

comment on column public.receivable.competence_date is
  'Data da VENDA (regime de competência) — igual em TODAS as parcelas de um '
  'mesmo plano: venda 12x de R$1.200 fatura R$1.200 no dia da venda. PDV = '
  'sale_date; orçamento = data da aprovação; procedimento = performed_on. '
  'Faturamento soma gross_amount por esta data (status <> canceled); caixa '
  'continua por received_at. Ver docs/modelo-contabil.md.';
comment on column public.receivable.card_brand is
  'Bandeira do cartão (crédito/débito) informada no pagamento — antes ia como '
  'texto no notes, agora é dado consultável.';
comment on column public.receivable.authorization_code is
  'Código de autorização da maquininha (opcional) — par do card_brand.';
comment on column public.receivable.sale_id is
  'Venda do PDV que originou este título (N parcelas → 1 sale). NULL em '
  'títulos de orçamento/procedimento. Só checkout_sale escreve (sem GRANT).';

alter table public.receivable add constraint receivable_sale_fk
  foreign key (sale_id, clinic_id)
  references public.sale(id, clinic_id) on delete no action;

-- ── 2 · Backfill (dados existentes são de teste, mas o backfill é correto em
--        geral: created_at É o momento da venda/aprovação/faturamento em
--        todas as três origens) ───────────────────────────────────────────────

update public.receivable
   set competence_date = (created_at at time zone 'America/Sao_Paulo')::date
 where competence_date is null;

-- Bandeira/autorização gravadas como texto pelo checkout_sale antigo
-- ("Bandeira: X · Autorização: Y") viram coluna; o notes esvazia (era só
-- duplicação de exibição, nunca observação humana).
update public.receivable
   set card_brand = nullif(btrim(split_part(split_part(notes, 'Bandeira: ', 2), '· Autorização:', 1)), ''),
       authorization_code = nullif(btrim(split_part(notes, '· Autorização: ', 2)), ''),
       notes = null
 where source = 'Vendas' and notes like 'Bandeira: %';

-- sale_id: só nos casos SEM ambiguidade (paciente com uma única venda) — o
-- vínculo nunca foi persistido e adivinhar errado é pior que deixar nulo.
update public.receivable r
   set sale_id = s.only_sale
  from (select clinic_id, patient_id, min(id::text)::uuid as only_sale
          from public.sale group by clinic_id, patient_id having count(*) = 1) s
 where r.source = 'Vendas' and r.sale_id is null
   and r.clinic_id = s.clinic_id and r.patient_id = s.patient_id;

alter table public.receivable
  alter column competence_date set not null,
  alter column competence_date set default (now() at time zone 'America/Sao_Paulo')::date;

-- Faturamento consulta por (clinic, competência) — e a FK nova precisa de
-- índice de cobertura (padrão do projeto).
create index receivable_competence_idx on public.receivable (clinic_id, competence_date);
create index receivable_sale_idx on public.receivable (sale_id, clinic_id) where sale_id is not null;

-- GRANTs por coluna (padrão da tabela): bandeira/autorização editáveis;
-- competence_date entra só no INSERT (fato da venda — não se reescreve);
-- sale_id nem no INSERT (só checkout_sale, SECURITY DEFINER, escreve).
grant insert (competence_date, card_brand, authorization_code) on public.receivable to authenticated;
grant update (card_brand, authorization_code) on public.receivable to authenticated;

-- ── 3 · dashboard_stats() órfã: fora ─────────────────────────────────────────
-- Sem consumidor no src (o Dashboard usa dashboard_stats_period) e com
-- revenue = líquido por received_at — divergente da definição vigente. Um
-- reuso futuro mostraria um número diferente do card sem ninguém perceber.
drop function if exists public.dashboard_stats();

-- ── 4 · checkout_sale: competência + sale_id + bandeira/autorização em coluna ─

create or replace function public.checkout_sale(
  p_patient  uuid,
  p_sale_date date,
  p_discount numeric,
  p_items    jsonb,
  p_plan     jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clinic      uuid;
  v_sale        uuid;
  v_sale_day    date := coalesce(p_sale_date, current_date);
  v_total       numeric;
  v_total_cents bigint;
  v_sum_cents   bigint;
  v_description text;
begin
  select clinic_id into v_clinic from public.patient where id = p_patient;
  if v_clinic is null then
    raise exception 'Paciente não encontrado.' using errcode = '23503';
  end if;
  -- 'patients' (não 'finance'): quem vende pelo carrinho do perfil do
  -- paciente é recepção/fisioterapeuta — o mesmo raciocínio de
  -- record_treatment_session (20260722233500) para não deixar a venda refém
  -- de uma permissão financeira que quem atende normalmente não tem.
  if not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'patients', 'schedule') then
    raise exception 'Sem permissão para vender nesta clínica.' using errcode = '42501';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'A venda precisa de pelo menos um item.' using errcode = '23514';
  end if;

  insert into public.sale (clinic_id, patient_id, sale_date, discount, created_by)
  values (v_clinic, p_patient, v_sale_day, coalesce(p_discount, 0), (select auth.uid()))
  returning id into v_sale;

  insert into public.sale_item (clinic_id, sale_id, service_id, name, price, quantity)
  select v_clinic, v_sale, s.id, s.name, s.price, greatest(1, coalesce((it->>'quantity')::int, 1))
    from jsonb_array_elements(p_items) it
    join public.service s on s.id = (it->>'service_id')::uuid and s.clinic_id = v_clinic;

  -- Todo item do carrinho tem de ter casado com um serviço real da clínica —
  -- um id inválido não pode simplesmente sumir da venda em silêncio.
  if (select count(*) from public.sale_item where sale_id = v_sale) <> jsonb_array_length(p_items) then
    raise exception 'Um ou mais itens da venda não foram encontrados no catálogo.' using errcode = '23503';
  end if;

  -- Direito a sessões: só nasce pra linha de PACOTE (modality='package').
  insert into public.patient_service_entitlement (
    clinic_id, patient_id, service_id, sale_item_id, total_sessions, purchased_at, expires_at
  )
  select v_clinic, p_patient, si.service_id, si.id, s.sessions * si.quantity,
         v_sale_day,
         case when s.duration_qty > 0 then
           (v_sale_day + make_interval(
              days   => case when s.duration_unit = 'days'   then s.duration_qty else 0 end,
              weeks  => case when s.duration_unit = 'weeks'  then s.duration_qty else 0 end,
              months => case when s.duration_unit = 'months' then s.duration_qty else 0 end
            ))::date
         else null end
    from public.sale_item si
    join public.service s on s.id = si.service_id and s.clinic_id = v_clinic
   where si.sale_id = v_sale and s.modality = 'package' and coalesce(s.sessions, 0) > 0;

  select total, string_agg(si.name || case when si.quantity > 1 then ' (' || si.quantity || 'x)' else '' end, ', ')
    into v_total, v_description
    from public.sale s
    join public.sale_item si on si.sale_id = s.id
   where s.id = v_sale
   group by s.total;

  if v_total > 0 then
    if p_plan is null or jsonb_array_length(p_plan) = 0 then
      raise exception 'Informe o plano de pagamento.' using errcode = '23514';
    end if;

    v_total_cents := round(v_total * 100)::bigint;
    select coalesce(sum(round((e->>'amount')::numeric * 100)), 0)::bigint into v_sum_cents
      from jsonb_array_elements(p_plan) e;
    if v_sum_cents <> v_total_cents then
      raise exception 'O plano de pagamento não fecha com o total da venda.' using errcode = '23514';
    end if;

    with plan as (
      select (e->>'method')::public.payment_method as method,
             (e->>'amount')::numeric               as amount,
             greatest(1, coalesce((e->>'installments')::int, 1)) as inst,
             nullif(e->>'acquirer_id', '')::uuid   as acq,
             nullif(e->>'card_brand', '')          as brand,
             nullif(e->>'authorization_code', '')  as auth_code,
             ord
        from jsonb_array_elements(p_plan) with ordinality as t(e, ord)
    ),
    gen as (
      -- CARTÃO com adquirente: repasse D+N com taxa, numerado pela própria
      -- card_installment_plan. Fica 'pending' — debtor='acquirer' (coluna
      -- gerada) já garante que isto NÃO é dívida do paciente nem pode virar
      -- 'overdue'; private.settle_card_receivables (cron diário) baixa
      -- sozinho quando due_date chegar.
      select p.ord, cp.installment_number as sub_n, cp.installment_count as cnt,
             cp.due_date, p.method, cp.gross_amount as gross, cp.fee, p.acq as acquirer,
             p.brand, p.auth_code, false as paid_now
        from plan p
        cross join lateral private.card_installment_plan(
          v_clinic, p.acq, p.amount, p.inst, v_sale_day, p.method) cp
       where p.acq is not null and p.method in ('credit', 'debit')
      union all
      -- Demais formas (dinheiro/pix): à vista, sem taxa — o dinheiro já
      -- entrou NA HORA, no balcão. Nasce QUITADO (debtor='payer', sem saldo).
      select p.ord, 1, 1, v_sale_day, p.method, p.amount, 0::numeric, null::uuid,
             p.brand, p.auth_code, true
        from plan p
       where not (p.acq is not null and p.method in ('credit', 'debit'))
    )
    insert into public.receivable (
      clinic_id, description, source, competence_date, due_date, method,
      gross_amount, fee, status, patient_id, installment_number,
      installment_count, acquirer_id, sale_id, card_brand, authorization_code,
      received_at, received_amount
    )
    select v_clinic,
           'Venda: ' || v_description
             || case when g.cnt > 1 then ' — parcela ' || g.sub_n || '/' || g.cnt else '' end,
           'Vendas', v_sale_day, g.due_date, g.method, g.gross, g.fee,
           case when g.paid_now then 'paid' else 'pending' end::public.payment_status,
           p_patient, g.sub_n, g.cnt, g.acquirer, v_sale, g.brand, g.auth_code,
           case when g.paid_now then g.due_date else null end,
           case when g.paid_now then g.gross - g.fee else 0 end
      from gen g
     order by g.ord, g.sub_n;
  end if;

  return v_sale;
end;
$$;

comment on function public.checkout_sale(uuid, date, numeric, jsonb, jsonb) is
  'Fecha uma venda do PDV: grava sale/sale_item, cria patient_service_entitlement '
  'pras linhas de pacote e gera os recebíveis do plano (card_installment_plan '
  'pro cartão, à vista pro resto). competence_date = data da venda em TODAS as '
  'parcelas (faturamento por competência — docs/modelo-contabil.md); sale_id '
  'amarra título↔venda. Dinheiro/pix nascem paid (balcão); cartão nasce '
  'pending/debtor=acquirer e o cron baixa no repasse. p_plan = [{method, '
  'amount, installments?, acquirer_id?, card_brand?, authorization_code?}]. '
  'SECURITY DEFINER: exige patients/schedule, não finance.';

-- ── 5 · approve_quote: competência = data da APROVAÇÃO ───────────────────────

create or replace function public.approve_quote(p_quote uuid, p_plan jsonb default null)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_clinic   uuid;
  v_patient  uuid;
  v_name     text;
  v_issue    date;
  v_today    date := (now() at time zone 'America/Sao_Paulo')::date;
  v_total    numeric;
  v_inst_def integer;
  v_existing integer;
  v_total_cents bigint;
  v_sum_cents   bigint;
  v_count    integer := 0;
begin
  select q.clinic_id, q.patient_id, q.name, q.issue_date,
         coalesce(q.total, q.items_total - q.discount), greatest(1, coalesce(q.installments, 1))
    into v_clinic, v_patient, v_name, v_issue, v_total, v_inst_def
    from public.quote q where q.id = p_quote;

  if v_clinic is null then
    raise exception 'Orçamento não encontrado.' using errcode = '42501';
  end if;
  if not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'finance') then
    raise exception 'Sem permissão financeira nesta clínica.' using errcode = '42501';
  end if;

  select count(*) into v_existing from public.receivable where quote_id = p_quote;

  if v_existing = 0 and v_total > 0 then
    -- Sem plano (chamadas antigas): pix mensal desde a emissão.
    if p_plan is null or jsonb_array_length(p_plan) = 0 then
      p_plan := jsonb_build_array(jsonb_build_object(
        'method', 'pix', 'amount', v_total, 'installments', v_inst_def,
        'first_due_date', coalesce(v_issue, v_today)));
    end if;

    v_total_cents := round(v_total * 100)::bigint;
    select coalesce(sum(round((e->>'amount')::numeric * 100)), 0)::bigint into v_sum_cents
      from jsonb_array_elements(p_plan) e;
    if v_sum_cents <> v_total_cents then
      raise exception 'O plano de pagamento não fecha com o total do orçamento.' using errcode = '23514';
    end if;

    with plan as (
      select (e->>'method')::public.payment_method as method,
             (e->>'amount')::numeric               as amount,
             greatest(1, coalesce((e->>'installments')::int, 1)) as inst,
             (e->>'first_due_date')::date          as first_due,
             nullif(e->>'acquirer_id', '')::uuid   as acq,
             ord
        from jsonb_array_elements(p_plan) with ordinality as t(e, ord)
    ),
    gen as (
      -- CARTÃO: repasse D+N com taxa (debtor='acquirer' vem de acquirer_id).
      -- card_installment_plan já numera 1..n DENTRO da própria chamada — ela
      -- também devolve installment_count, então cnt vem pronto, por linha.
      select p.ord, cp.installment_number as sub_n, cp.installment_count as cnt,
             cp.due_date, p.method, cp.gross_amount as gross, cp.fee, p.acq as acquirer
        from plan p
        cross join lateral private.card_installment_plan(
          v_clinic, p.acq, p.amount, p.inst, p.first_due, p.method) cp
       where p.acq is not null and p.method in ('credit', 'debit')
      union all
      -- PACIENTE: parcelas MENSAIS a partir do 1º vencimento, numeradas 1..n_eff
      -- DENTRO da própria linha (k é relativo a esta linha, não ao plano todo).
      -- Trava R$ 0,00: nº de parcelas limitado aos centavos (mesma defesa do
      -- card_installment_plan).
      select p.ord, k + 1 as sub_n, calc.n_eff as cnt,
             (p.first_due + (k * interval '1 month'))::date as due_date, p.method,
             (calc.v_base + case when k = 0 then calc.v_rem else 0 end)::numeric / 100 as gross,
             0::numeric as fee, null::uuid as acquirer
        from plan p
        cross join lateral (
          select least(p.inst, greatest(1, round(p.amount * 100)::bigint)) as n_eff,
                 round(p.amount * 100)::bigint / least(p.inst, greatest(1, round(p.amount * 100)::bigint)) as v_base,
                 round(p.amount * 100)::bigint
                   - (round(p.amount * 100)::bigint / least(p.inst, greatest(1, round(p.amount * 100)::bigint)))
                     * least(p.inst, greatest(1, round(p.amount * 100)::bigint)) as v_rem
        ) calc
        cross join generate_series(0, calc.n_eff - 1) as k
       where not (p.acq is not null and p.method in ('credit', 'debit'))
    )
    insert into public.receivable (
      clinic_id, description, source, competence_date, due_date, method,
      gross_amount, fee, status, patient_id, quote_id, installment_number,
      installment_count, plan_line, acquirer_id)
    select v_clinic,
           -- "parcela k/n" só aparece quando a PRÓPRIA linha tem mais de 1
           -- parcela — uma linha à vista não carrega fração nenhuma, e duas
           -- linhas à vista não competem mais por um número global que não
           -- significava nada.
           v_name || case when g.cnt > 1 then ' — parcela ' || g.sub_n || '/' || g.cnt else '' end
             || ' (' ||
             case g.method
               when 'cash' then 'Dinheiro' when 'credit' then 'Crédito'
               when 'debit' then 'Débito'  when 'boleto' then 'Boleto'
               when 'check' then 'Cheque'  when 'pix' then 'Pix'
               when 'wire' then 'TED' end || ')',
           -- Competência = HOJE, a data do ACEITE: o aceite é a venda (a
           -- emissão do orçamento é só proposta) — todas as parcelas do
           -- contrato faturam no dia em que ele foi fechado.
           'Orçamentos', v_today, g.due_date, g.method, g.gross, g.fee, 'pending',
           v_patient, p_quote, g.sub_n, g.cnt, g.ord, g.acquirer
      from gen g
     order by g.ord, g.sub_n;

    get diagnostics v_count = row_count;
  end if;

  update public.quote set status = 'approved' where id = p_quote;
  return v_count;
end;
$function$;

comment on function public.approve_quote(uuid, jsonb) is
  'Aprova um orçamento e gera as parcelas em Contas a Receber. Linha de cartão '
  'vira repasse da adquirente (D+N, taxa por nº de parcelas); demais formas são '
  'mensais do paciente, numeradas por linha (plan_line). competence_date = data '
  'do aceite em todas as parcelas (faturamento por competência). Idempotente.';

-- ── 6 · emit_session_billing: competência = performed_on ─────────────────────

create or replace function private.emit_session_billing(
  p_session             uuid,
  p_due_date            date default null,
  p_not_billable_reason text default null,
  p_method              public.payment_method default null,
  p_acquirer            uuid default null,
  p_installments        integer default 1,
  p_human_override      boolean default false
)
returns public.session_billing_status
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_clinic    uuid;
  v_patient   uuid;
  v_amount    numeric;
  v_performed date;
  v_desc      text;
  v_sale_date date;
  v_quote     uuid;
  v_pending   uuid;
  v_status    public.session_billing_status;
  v_reason    text := nullif(btrim(coalesce(p_not_billable_reason, '')), '');
  v_first     uuid;
  v_rid       uuid;
  v_plan      record;
begin
  -- FOR UPDATE: esta é a linha que decide se o procedimento já tem dono
  -- financeiro. Sem o lock, duas chamadas simultâneas liam 'unbilled' ao mesmo
  -- tempo e cada uma criava o seu título.
  select s.clinic_id, t.patient_id, s.amount, s.performed_on,
         coalesce(nullif(btrim(coalesce(s.description, '')), ''), t.procedure)
    into v_clinic, v_patient, v_amount, v_performed, v_desc
    from public.treatment_session s
    join public.treatment t
      on t.id = s.treatment_id and t.clinic_id = s.clinic_id
   where s.id = p_session
     for no key update of s;

  if v_clinic is null then
    raise exception 'Procedimento não encontrado.' using errcode = '42501';
  end if;

  -- A RLS não está valendo aqui (definer). Esta é a trava de tenant, e ela
  -- também confere a permissão de quem chega: o dentista lançando o
  -- procedimento OU o Financeiro faturando o que ficou para trás.
  if not (v_clinic = any(private.auth_clinic_ids()))
     or not (private.can_edit_feature(v_clinic, 'patients')
             or private.can_edit_feature(v_clinic, 'finance')) then
    raise exception 'Sem acesso a esta clínica.' using errcode = '42501';
  end if;

  select d.billing_status, d.covering_quote_id, d.pending_quote_id
    into v_status, v_quote, v_pending
    from private.session_billing_decision(
           v_clinic, v_patient, v_amount, p_not_billable_reason, p_human_override) d;

  -- ── O TÍTULO ───────────────────────────────────────────────────────────────
  if v_status = 'billed' then
    -- due_date é parametrizável e o padrão é a DATA DO PROCEDIMENTO, não hoje:
    -- o combinado com o paciente é o dia em que ele foi atendido.
    v_sale_date := coalesce(p_due_date, v_performed);

    if p_acquirer is not null and p_method in ('credit', 'debit') then
      -- CARTÃO: N parcelas ⇒ N recebíveis, cada um vencendo na data prevista de
      -- repasse. acquirer_id preenchido faz `debtor` nascer 'acquirer' — e o
      -- CHECK receivable_acquirer_never_overdue_ck impede que virem atraso do
      -- paciente. O paciente não tem o que ser cobrado: a venda foi garantida.
      for v_plan in
        select * from private.card_installment_plan(
          v_clinic, p_acquirer, v_amount, p_installments, v_sale_date, p_method)
      loop
        insert into public.receivable (
          clinic_id, description, source, competence_date, due_date, method,
          gross_amount, fee, status, patient_id, acquirer_id,
          installment_number, installment_count, treatment_session_id
        ) values (
          v_clinic,
          v_desc || case when v_plan.installment_count > 1
                         then ' — parcela ' || v_plan.installment_number || '/' || v_plan.installment_count
                         else '' end,
          -- Competência = performed_on: o serviço EXECUTADO é o fato gerador
          -- da receita, não a data em que alguém lembrou de faturar.
          'Procedimentos', v_performed, v_plan.due_date, p_method,
          v_plan.gross_amount, v_plan.fee,
          'pending', v_patient, p_acquirer,
          case when v_plan.installment_count > 1 then v_plan.installment_number end,
          case when v_plan.installment_count > 1 then v_plan.installment_count end,
          p_session
        )
        returning id into v_rid;

        if v_plan.installment_number = 1 then
          v_first := v_rid;   -- a sessão aponta para a parcela 1
        end if;
      end loop;

    else
      -- PIX / dinheiro / boleto / sem forma definida: um título contra o
      -- paciente, vencendo no dia do procedimento (editável na tela).
      insert into public.receivable (
        clinic_id, description, source, competence_date, due_date, method,
        gross_amount, fee, status, patient_id, treatment_session_id
      ) values (
        v_clinic, v_desc, 'Procedimentos', v_performed, v_sale_date, p_method,
        v_amount, 0, 'pending', v_patient, p_session
      )
      returning id into v_first;
    end if;
  end if;

  update public.treatment_session s
     set billing_status      = v_status,
         receivable_id       = v_first,
         quote_id            = case when v_status = 'covered' then v_quote end,
         not_billable_reason = case when v_status = 'not_billable' then v_reason end
   where s.id = p_session;

  return v_status;
end;
$$;

comment on function private.emit_session_billing(uuid, date, text, public.payment_method, uuid, integer, boolean) is
  'Decide e grava o reflexo financeiro de um procedimento JÁ inserido, na mesma '
  'transação. A decisão vem de private.session_billing_decision — a MESMA que a '
  'tela consulta em preview_session_billing. Trava a linha da sessão (FOR NO KEY '
  'UPDATE) antes de decidir. competence_date do título = performed_on '
  '(faturamento por competência — ver docs/modelo-contabil.md).';

revoke all on function private.emit_session_billing(uuid, date, text, public.payment_method, uuid, integer, boolean) from public;
grant execute on function private.emit_session_billing(uuid, date, text, public.payment_method, uuid, integer, boolean)
  to authenticated, service_role;
