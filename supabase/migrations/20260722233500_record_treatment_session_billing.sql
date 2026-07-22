-- ═════════════════════════════════════════════════════════════════════════════
-- O PROCEDIMENTO EXECUTADO GERA O RECEBÍVEL NA MESMA TRANSAÇÃO
--
-- INSERT EXPLÍCITO dentro da RPC — NÃO trigger. Título financeiro nascendo por
-- mágica dentro de uma tabela clínica torna estorno indepurável: seis meses
-- depois ninguém sabe se a linha veio do procedimento, do orçamento ou da mão
-- de alguém. Aqui a decisão é uma escada de cinco degraus, legível, com o
-- motivo de cada desvio escrito ao lado.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · PLANO DE PARCELAS DO CARTÃO
--
-- Quem deve no cartão é a ADQUIRENTE: a venda já foi garantida por ela na
-- autorização. Por isso o "vencimento" de uma parcela de cartão não é uma data
-- de cobrança do paciente — é a DATA PREVISTA DE REPASSE.
--
-- Função separada porque o cálculo tem três decisões próprias (dias, taxa,
-- centavos) e precisa ser conferível sozinho, sem gravar nada.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function private.card_installment_plan(
  p_clinic       uuid,
  p_acquirer     uuid,
  p_amount       numeric,
  p_installments integer,
  p_sale_date    date,
  p_method       public.payment_method
)
returns table (
  installment_number integer,
  installment_count  integer,
  due_date           date,
  gross_amount       numeric,
  fee                numeric
)
language plpgsql
stable
set search_path to ''
as $$
declare
  v_settlement integer;
  v_credit_fee numeric;
  v_debit_fee  numeric;
  v_rate       numeric;
  v_n          integer;
  v_cents      bigint;
  v_base       bigint;
  v_rem        bigint;
  k            integer;
  v_gross      numeric;
begin
  select a.settlement_days, a.credit_fee, a.debit_fee
    into v_settlement, v_credit_fee, v_debit_fee
    from public.acquirer a
   where a.id = p_acquirer and a.clinic_id = p_clinic;

  if v_settlement is null then
    raise exception 'Adquirente não encontrada nesta clínica.' using errcode = '23503';
  end if;

  v_cents := round(p_amount * 100)::bigint;

  if p_method = 'debit' then
    -- Débito não parcela: é uma transferência autorizada na hora.
    v_n    := 1;
    v_rate := v_debit_fee;
  else
    -- Menos centavos do que parcelas geraria parcela de R$ 0,00, recusada pelo
    -- CHECK receivable_gross_amount_ck. Reduzir o número de parcelas é melhor
    -- do que derrubar o salvamento de um procedimento já executado.
    v_n    := greatest(1, least(coalesce(p_installments, 1), v_cents));
    v_rate := v_credit_fee;

    if v_n >= 2 then
      -- A taxa sai da tabela POR NÚMERO DE PARCELAS.
      select air.fee into v_rate
        from public.acquirer_installment_rate air
       where air.acquirer_id = p_acquirer
         and air.clinic_id   = p_clinic
         and air.installments = v_n;

      -- Sem linha cadastrada para N parcelas, cai na taxa de crédito à vista.
      -- Falta de cadastro não pode impedir a venda; a diferença aparece na
      -- Conciliação, comparada com o extrato real da maquininha.
      v_rate := coalesce(v_rate, v_credit_fee);
    end if;
  end if;

  v_base := v_cents / v_n;
  v_rem  := v_cents - v_base * v_n;   -- sobra de centavos na 1ª parcela

  for k in 1..v_n loop
    v_gross := (v_base + case when k = 1 then v_rem else 0 end)::numeric / 100;

    installment_number := k;
    installment_count  := v_n;
    -- REPASSE CONTADO EM DIAS, não em meses de calendário. A adquirente conta
    -- dias: D+settlement_days na 1ª parcela e +30 a cada seguinte. Usar
    -- `interval '1 month'` faria 31/01 virar 28/02 e a Conciliação nunca
    -- bateria com o extrato. (O parcelamento do PACIENTE, em approveQuote, é
    -- mês a mês de propósito — lá a data foi negociada em meses, não em dias.)
    due_date     := p_sale_date + v_settlement + (k - 1) * 30;
    gross_amount := v_gross;
    -- Taxa sobre o BRUTO DA PRÓPRIA PARCELA: cada linha fecha sozinha contra a
    -- linha correspondente do extrato, que é como a conferência acontece.
    fee          := round(v_gross * v_rate / 100, 2);
    return next;
  end loop;
end;
$$;

comment on function private.card_installment_plan(uuid, uuid, numeric, integer, date, public.payment_method) is
  'Plano de repasse de uma venda no cartão: uma linha por parcela, com data '
  'prevista (venda + settlement_days + 30 dias por parcela), bruto (sobra de '
  'centavos na 1ª, mesma convenção do approveQuote) e taxa por número de '
  'parcelas. Não grava nada.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · A DECISÃO DE COBRAR
--
-- SECURITY DEFINER, e o motivo é de produto, não de conveniência: a policy de
-- receivable exige a feature 'finance', mas quem salva um procedimento é o
-- DENTISTA, que normalmente só tem 'patients'. Como invoker, gravar um
-- procedimento derrubaria com "violates row-level security policy for table
-- receivable" — o ato clínico ficaria refém de uma permissão financeira.
--
-- Em troca, a checagem de tenant é EXPLÍCITA aqui dentro, e a função vive em
-- `private` (não é exposta no PostgREST): ninguém a chama de fora da RPC.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function private.emit_session_billing(
  p_session             uuid,
  p_due_date            date default null,
  p_not_billable_reason text default null,
  p_method              public.payment_method default null,
  p_acquirer            uuid default null,
  p_installments        integer default 1
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
  v_status    public.session_billing_status;
  v_reason    text := nullif(btrim(coalesce(p_not_billable_reason, '')), '');
  v_first     uuid;
  v_rid       uuid;
  v_plan      record;
begin
  select s.clinic_id, t.patient_id, s.amount, s.performed_on,
         coalesce(nullif(btrim(coalesce(s.description, '')), ''), t.procedure)
    into v_clinic, v_patient, v_amount, v_performed, v_desc
    from public.treatment_session s
    join public.treatment t
      on t.id = s.treatment_id and t.clinic_id = s.clinic_id
   where s.id = p_session;

  if v_clinic is null then
    raise exception 'Procedimento não encontrado.' using errcode = '42501';
  end if;

  -- A RLS não está valendo aqui (definer). Esta é a trava de tenant, e ela
  -- também confere a permissão de quem lança o procedimento — não a financeira.
  if not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'patients') then
    raise exception 'Sem acesso a esta clínica.' using errcode = '42501';
  end if;

  -- ── A ESCADA ───────────────────────────────────────────────────────────────
  if v_amount is null or v_amount <= 0 then
    -- 1. Sem valor não há o que cobrar. Procedimento de acompanhamento, retorno
    --    ainda sem preço definido, sessão lançada só para o prontuário.
    v_status := 'unbilled';

  elsif v_reason is not null then
    -- 2. Cortesia / garantia / retorno incluso: a clínica decidiu não cobrar e
    --    escreveu por quê. Nunca vira título.
    v_status := 'not_billable';

  else
    -- 3. Contrato aprovado com saldo em aberto ⇒ a dívida JÁ nasceu lá, na
    --    aprovação do orçamento. Gerar título aqui cobraria o paciente duas
    --    vezes pelo mesmo tratamento.
    --    Casa por PACIENTE, jamais por texto do procedimento: não existe
    --    catálogo, e comparar `treatment.procedure` com `quote_item.treatment`
    --    é apontamento por adivinhação — erra e vira cobrança indevida.
    select q.id into v_quote
      from public.quote q
     where q.clinic_id = v_clinic
       and q.patient_id = v_patient
       and q.status = 'approved'
       and exists (
             select 1 from public.receivable r
              where r.quote_id = q.id
                and r.clinic_id = q.clinic_id
                and r.status in ('pending', 'overdue')
                and r.open_amount > 0)
     order by q.issue_date, q.created_at
     limit 1;

    if v_quote is not null then
      v_status := 'covered';

    elsif exists (select 1 from public.patient p
                   where p.id = v_patient and p.clinic_id = v_clinic
                     and p.insurance_id is not null) then
      -- 4. Convênio: quem paga é o convênio, e o valor cheio do particular NÃO
      --    é a conta do paciente. Vai para "A faturar". A trava custa uma linha
      --    e evita cobrança indevida em escala no primeiro cliente de convênio.
      v_status := 'unbilled';

    else
      -- 5. Fato consumado, sem contrato e sem convênio: nasce o título.
      v_status := 'billed';
    end if;
  end if;

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
          clinic_id, description, source, due_date, method, gross_amount, fee,
          status, patient_id, acquirer_id, installment_number, installment_count,
          treatment_session_id
        ) values (
          v_clinic,
          v_desc || case when v_plan.installment_count > 1
                         then ' — parcela ' || v_plan.installment_number || '/' || v_plan.installment_count
                         else '' end,
          'Procedimentos', v_plan.due_date, p_method, v_plan.gross_amount, v_plan.fee,
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
        clinic_id, description, source, due_date, method, gross_amount, fee,
        status, patient_id, treatment_session_id
      ) values (
        v_clinic, v_desc, 'Procedimentos', v_sale_date, p_method, v_amount, 0,
        'pending', v_patient, p_session
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

comment on function private.emit_session_billing(uuid, date, text, public.payment_method, uuid, integer) is
  'Decide e grava o reflexo financeiro de um procedimento JÁ inserido, na mesma '
  'transação. Ordem: sem valor → cortesia → coberto por contrato aprovado → '
  'convênio → título. SECURITY DEFINER porque a policy de receivable exige a '
  'feature ''finance'' e quem lança o procedimento é o dentista; o tenant é '
  'conferido explicitamente no corpo.';

revoke all on function private.emit_session_billing(uuid, date, text, public.payment_method, uuid, integer) from public;
grant execute on function private.emit_session_billing(uuid, date, text, public.payment_method, uuid, integer)
  to authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · A RPC
--
-- DROP + CREATE, e não CREATE OR REPLACE: acrescentar parâmetros (mesmo com
-- DEFAULT) cria uma SOBRECARGA, e duas versões conviventes deixariam a chamada
-- ambígua. O cliente chama por nome de argumento, então trocar a assinatura é
-- seguro desde que os nomes antigos continuem existindo — e continuam.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.record_treatment_session(
  uuid, date, public.tooth_status, text, uuid, public.money_brl, text, text[], text[], jsonb, jsonb);

create function public.record_treatment_session(
  p_treatment           uuid,
  p_performed_on        date,
  p_status_after        public.tooth_status,
  p_description         text default null,
  p_professional        uuid default null,
  p_amount              public.money_brl default null,
  p_notes               text default null,
  p_teeth               text[] default '{}'::text[],
  p_actions             text[] default '{}'::text[],
  p_materials           jsonb default '[]'::jsonb,
  p_odontogram          jsonb default null,
  -- ── novos: o reflexo financeiro ──
  p_due_date            date default null,               -- padrão: performed_on
  p_not_billable_reason text default null,               -- cortesia/garantia
  p_method              public.payment_method default null,
  p_acquirer            uuid default null,               -- obrigatório p/ cartão
  p_installments        integer default 1
)
returns uuid
language plpgsql
set search_path to ''
as $function$
declare
  v_clinic  uuid;
  v_session uuid;
begin
  -- RLS aplicada: tratamento de outra clínica simplesmente não aparece, e a
  -- mensagem é a mesma de "não existe" — não se confirma a existência de um
  -- prontuário alheio nem pelo texto do erro.
  select t.clinic_id into v_clinic
    from public.treatment t
   where t.id = p_treatment;

  if v_clinic is null then
    raise exception 'Tratamento não encontrado.' using errcode = '42501';
  end if;

  insert into public.treatment_session (
    clinic_id, treatment_id, description, performed_on, professional_id, amount, notes
  ) values (
    v_clinic, p_treatment,
    nullif(btrim(coalesce(p_description, '')), ''),
    p_performed_on, p_professional, p_amount,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_session;

  -- Dentes (a trigger tr_merge_treatment_tooth sobe cada um para o tratamento).
  insert into public.treatment_session_tooth (clinic_id, session_id, tooth_fdi)
  select distinct v_clinic, v_session, btrim(d.tooth)
    from unnest(coalesce(p_teeth, '{}'::text[])) as d(tooth)
   where btrim(d.tooth) <> ''
  on conflict (session_id, tooth_fdi) do nothing;

  -- Etapas: WITH ORDINALITY preserva a ordem em que o profissional descreveu.
  insert into public.treatment_session_action (clinic_id, session_id, sort_order, description)
  select v_clinic, v_session, a.ord, btrim(a.txt)
    from unnest(coalesce(p_actions, '{}'::text[])) with ordinality as a(txt, ord)
   where btrim(coalesce(a.txt, '')) <> '';

  -- Materiais: [{ "material_id": uuid|null, "name": text, "quantity": text }]
  insert into public.treatment_session_material
    (clinic_id, session_id, sort_order, material_id, name, quantity)
  select v_clinic, v_session, m.ord,
         nullif(btrim(coalesce(m.item ->> 'material_id', '')), '')::uuid,
         btrim(m.item ->> 'name'),
         btrim(coalesce(m.item ->> 'quantity', ''))
    from jsonb_array_elements(coalesce(p_materials, '[]'::jsonb)) with ordinality as m(item, ord)
   where btrim(coalesce(m.item ->> 'name', '')) <> '';

  if p_odontogram is not null then
    insert into public.treatment_session_odontogram (session_id, clinic_id, payload)
    values (v_session, v_clinic, p_odontogram);
  end if;

  -- Situação do tratamento APÓS o procedimento (NewTreatmentSession.statusAfter).
  -- A data de fim é a DO PROCEDIMENTO, não a de hoje.
  update public.treatment
     set status       = p_status_after,
         completed_at = case when p_status_after = 'open' then null else p_performed_on end
   where id = p_treatment;

  -- ── O DINHEIRO, NO MESMO COMMIT ────────────────────────────────────────────
  -- Se esta chamada levantar exceção, o procedimento inteiro volta atrás. É o
  -- que queremos: procedimento salvo com valor e sem reflexo financeiro é
  -- exatamente o buraco que existe hoje (uma sessão de R$ 250 órfã no banco).
  -- O resultado fica legível em treatment_session.billing_status.
  perform private.emit_session_billing(
    v_session, p_due_date, p_not_billable_reason, p_method, p_acquirer, p_installments);

  return v_session;
end;
$function$;

comment on function public.record_treatment_session(
  uuid, date, public.tooth_status, text, uuid, public.money_brl, text, text[], text[], jsonb, jsonb,
  date, text, public.payment_method, uuid, integer) is
  'Grava um procedimento executado (sessão + dentes + etapas + materiais + '
  'odontograma + status do tratamento) E o seu reflexo financeiro, tudo numa '
  'transação. Retorna o id da sessão; o que aconteceu com o dinheiro está em '
  'treatment_session.billing_status.';

revoke all on function public.record_treatment_session(
  uuid, date, public.tooth_status, text, uuid, public.money_brl, text, text[], text[], jsonb, jsonb,
  date, text, public.payment_method, uuid, integer) from public;
grant execute on function public.record_treatment_session(
  uuid, date, public.tooth_status, text, uuid, public.money_brl, text, text[], text[], jsonb, jsonb,
  date, text, public.payment_method, uuid, integer) to authenticated, service_role;
