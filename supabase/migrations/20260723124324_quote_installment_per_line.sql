-- ─────────────────────────────────────────────────────────────────────────────
-- CORREÇÃO: parcela numerada por LINHA DO PLANO, não globalmente.
--
-- O plano de pagamento do aceite (ApproveQuoteDialog) permite combinar mais de
-- uma forma — ex.: R$1.000 à vista + R$1.000 em 2x + R$1.500 à vista. Cada
-- linha já nascia com o número CERTO dentro de si (a função card_installment_plan
-- e o parcelamento mensal do paciente numeram 1..n por linha), mas
-- approve_quote() descartava isso e renumerava tudo com row_number() GLOBAL —
-- a linha de 2x virava "parcela 2/4" e "parcela 3/4" em vez de "1/2" e "2/2", e
-- duas linhas à vista ganhavam números que não significam nada
-- (dono relatou: "parcela 4/4" vencendo no mesmo dia que a "1/1").
--
-- O índice único (quote_id, installment_number) é o motivo de não ter sido
-- feito assim desde o início: sem um discriminador de linha, duas linhas não
-- podem, cada uma, começar em 1. plan_line resolve isso.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.receivable
  add column if not exists plan_line smallint;

comment on column public.receivable.plan_line is
  'Ordinal da linha do plano de pagamento que originou este título (1ª forma '
  'combinada no aceite, 2ª forma, …). Existe só para desambiguar '
  'installment_number entre linhas — não é exibido na UI. Nulo fora de '
  'orçamento (procedimento avulso, aluguel de sala…).';

-- Dado existente: as linhas já gravadas por approve_quote() antes desta
-- correção têm installment_number GLOBAL (1..N somado entre linhas), e não há
-- como reconstruir com certeza a qual linha cada uma pertencia (o dado da
-- linha nunca foi persistido). Em vez de adivinhar por padrão de valor/data —
-- que arriscaria atribuir uma parcela à linha errada em silêncio —, mantemos o
-- número atual como a própria linha: plan_line = installment_number. O título
-- CONTINUA correto como cobrança (valor, vencimento, status intocados); só a
-- fração "N/M" impressa nele por acaso não fica retroativamente bonita. Só
-- orçamentos aprovados A PARTIR desta migration ganham a numeração por linha.
update public.receivable
   set plan_line = installment_number
 where quote_id is not null and plan_line is null;

-- Todo título de orçamento passa a exigir plan_line (a partir de agora, sempre
-- preenchido por approve_quote); fora de orçamento continua nulo.
alter table public.receivable
  add constraint receivable_plan_line_needs_quote_ck
  check ((quote_id is null) = (plan_line is null));

drop index if exists public.receivable_quote_installment_uk;

-- (quote_id, plan_line, installment_number): cada linha tem sua própria
-- sequência 1..n: linha 1 pode ter installment_number=1 ao mesmo tempo que a
-- linha 2 também tem installment_number=1, porque plan_line as distingue.
create unique index receivable_quote_installment_uk
  on public.receivable (quote_id, plan_line, installment_number)
  where quote_id is not null;

-- ── approve_quote(): numerar por linha, não globalmente ──────────────────────
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
        'first_due_date', coalesce(v_issue, (now() at time zone 'America/Sao_Paulo')::date)));
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
      clinic_id, description, source, due_date, method, gross_amount, fee, status,
      patient_id, quote_id, installment_number, installment_count, plan_line, acquirer_id)
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
           'Orçamentos', g.due_date, g.method, g.gross, g.fee, 'pending',
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
  'mensais do paciente. Cada linha do plano numera 1..n DENTRO DE SI (plan_line '
  'desambigua o índice único) — uma entrada à vista + resto em 3x não faz a '
  'entrada nascer como "parcela 4/4". Idempotente (não duplica se já há '
  'recebíveis).';

revoke all on function public.approve_quote(uuid, jsonb) from public;
grant execute on function public.approve_quote(uuid, jsonb) to authenticated, service_role;
