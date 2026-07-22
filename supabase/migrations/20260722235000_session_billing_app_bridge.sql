-- ═════════════════════════════════════════════════════════════════════════════
-- A PONTE: A TELA PRECISA VER A MESMA DECISÃO QUE O BANCO TOMA
--
-- A migration anterior fez o procedimento executado gerar o recebível no mesmo
-- commit. Ficou faltando o outro lado: quem salva o procedimento tem de VER, no
-- diálogo que já vê, o que vai acontecer com o dinheiro — "gera cobrança de
-- R$ 250,00" ou "abate do contrato ORC-000123".
--
-- Essa frase NÃO pode ser calculada no cliente, e o motivo é permissão, não
-- preguiça: a policy `receivable_select` exige a feature 'finance' e quem salva
-- procedimento é o DENTISTA, que normalmente só tem 'patients'. No navegador
-- dele, "existe contrato aprovado com saldo em aberto?" volta VAZIO — e a tela
-- prometeria "gera cobrança" num procedimento que o banco vai marcar como
-- coberto, ou o contrário. Uma frase errada aqui é uma cobrança indevida
-- combinada com o paciente na boca do dentista.
--
-- Então a decisão sai de dentro de emit_session_billing e vira função própria,
-- chamada pelos DOIS caminhos (o que grava e o que só pergunta). Uma escada, um
-- lugar. Se alguém mudar a regra amanhã, a tela muda junto por construção.
--
-- Esta migration também abre as duas leituras que o app precisa e não pode
-- fazer direto pelo mesmo motivo de permissão (cruzam 'patients' × 'finance'):
-- a rede de segurança "A faturar" e os ganhos do profissional.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · A ESCADA, EXTRAÍDA
--
-- SECURITY INVOKER de propósito: chamada de dentro de uma função DEFINER, ela
-- roda com os privilégios DAQUELA função. A escalada de privilégio continua
-- morando em exatamente dois lugares nomeados (emit_session_billing e
-- preview_session_billing), cada um com a checagem de tenant escrita no corpo.
-- Esta aqui não escolhe em nome de ninguém: recebe clínica e paciente prontos.
--
-- p_ignore_insurance existe para UM caso e só um: o humano do Financeiro
-- olhando a aba "A faturar" e decidindo, com um clique consciente, cobrar do
-- paciente um procedimento de convênio. A trava de convênio existe para impedir
-- cobrança automática EM ESCALA, não para impedir a clínica de faturar o que
-- combinou. O 'covered' (contrato aprovado em aberto) NÃO tem essa saída: ali a
-- dívida já nasceu, e ignorá-la seria cobrar duas vezes pelo mesmo tratamento.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function private.session_billing_decision(
  p_clinic           uuid,
  p_patient          uuid,
  p_amount           numeric,
  p_reason           text    default null,
  p_ignore_insurance boolean default false
)
returns table (
  billing_status    public.session_billing_status,
  covering_quote_id uuid
)
language plpgsql
stable
set search_path to ''
as $$
declare
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  covering_quote_id := null;

  if p_amount is null or p_amount <= 0 then
    -- 1. Sem valor não há o que cobrar: retorno, acompanhamento, sessão lançada
    --    só para o prontuário.
    billing_status := 'unbilled';

  elsif v_reason is not null then
    -- 2. Cortesia / garantia / retorno incluso: a clínica decidiu não cobrar e
    --    escreveu por quê.
    billing_status := 'not_billable';

  else
    -- 3. Contrato aprovado com saldo em aberto ⇒ a dívida JÁ nasceu na
    --    aprovação do orçamento. Casa por PACIENTE, jamais por texto do
    --    procedimento: não existe catálogo, e comparar `treatment.procedure`
    --    com `quote_item.treatment` é apontamento por adivinhação.
    select q.id into covering_quote_id
      from public.quote q
     where q.clinic_id  = p_clinic
       and q.patient_id = p_patient
       and q.status     = 'approved'
       and exists (
             select 1 from public.receivable r
              where r.quote_id  = q.id
                and r.clinic_id = q.clinic_id
                and r.status in ('pending', 'overdue')
                and r.open_amount > 0)
     order by q.issue_date, q.created_at
     limit 1;

    if covering_quote_id is not null then
      billing_status := 'covered';

    elsif not p_ignore_insurance
      and exists (select 1 from public.patient pt
                   where pt.id = p_patient and pt.clinic_id = p_clinic
                     and pt.insurance_id is not null) then
      -- 4. Convênio: quem paga é o convênio, e o valor cheio do particular não
      --    é a conta do paciente. Vai para "A faturar".
      billing_status := 'unbilled';

    else
      -- 5. Fato consumado, sem contrato e sem convênio: nasce o título.
      billing_status := 'billed';
    end if;
  end if;

  return next;
end;
$$;

comment on function private.session_billing_decision(uuid, uuid, numeric, text, boolean) is
  'A escada que decide o destino financeiro de um procedimento: sem valor → '
  'cortesia → coberto por contrato aprovado → convênio → título. Não grava e '
  'não escolhe tenant — quem chama já resolveu isso. Existe separada para que a '
  'tela possa PERGUNTAR a mesma coisa que o banco vai DECIDIR.';

revoke all on function private.session_billing_decision(uuid, uuid, numeric, text, boolean) from public;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · emit_session_billing PASSA A USAR A ESCADA EXTRAÍDA
--
-- DROP + CREATE porque ganhou um parâmetro (p_ignore_insurance): acrescentar
-- argumento, mesmo com DEFAULT, cria SOBRECARGA, e duas versões conviventes é
-- exatamente a divergência que esta migration existe para eliminar.
-- record_treatment_session continua chamando com 6 argumentos e resolve para
-- esta função (o 7º tem default) — plpgsql resolve o nome na execução, então o
-- drop não a invalida.
--
-- MUDANÇA DE PERMISSÃO, e ela é de produto: a checagem era só
-- can_edit_feature('patients'), porque o único caminho era o dentista salvando
-- procedimento. Agora existe um segundo caminho legítimo — o Financeiro
-- faturando pela aba "A faturar" —, e um usuário só de 'finance' não passaria
-- na porta de 'patients'. Vale QUALQUER uma das duas: as duas são formas
-- legítimas de chegar aqui, e nenhuma delas é "sem permissão nenhuma".
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists private.emit_session_billing(
  uuid, date, text, public.payment_method, uuid, integer);

create function private.emit_session_billing(
  p_session             uuid,
  p_due_date            date default null,
  p_not_billable_reason text default null,
  p_method              public.payment_method default null,
  p_acquirer            uuid default null,
  p_installments        integer default 1,
  p_ignore_insurance    boolean default false
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
  -- também confere a permissão de quem chega: o dentista lançando o
  -- procedimento OU o Financeiro faturando o que ficou para trás.
  if not (v_clinic = any(private.auth_clinic_ids()))
     or not (private.can_edit_feature(v_clinic, 'patients')
             or private.can_edit_feature(v_clinic, 'finance')) then
    raise exception 'Sem acesso a esta clínica.' using errcode = '42501';
  end if;

  select d.billing_status, d.covering_quote_id
    into v_status, v_quote
    from private.session_billing_decision(
           v_clinic, v_patient, v_amount, p_not_billable_reason, p_ignore_insurance) d;

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

comment on function private.emit_session_billing(uuid, date, text, public.payment_method, uuid, integer, boolean) is
  'Decide e grava o reflexo financeiro de um procedimento JÁ inserido, na mesma '
  'transação. A decisão vem de private.session_billing_decision — a MESMA que a '
  'tela consulta em preview_session_billing. SECURITY DEFINER porque a policy '
  'de receivable exige a feature ''finance'' e quem lança o procedimento é o '
  'dentista; o tenant e a permissão são conferidos no corpo.';

revoke all on function private.emit_session_billing(uuid, date, text, public.payment_method, uuid, integer, boolean) from public;
grant execute on function private.emit_session_billing(uuid, date, text, public.payment_method, uuid, integer, boolean)
  to authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · O QUE VAI ACONTECER COM O DINHEIRO (só pergunta, não grava)
--
-- Devolve a MESMA decisão que o salvamento vai tomar, mais o código do contrato
-- que cobre (para a frase "abate do contrato ORC-000123") e, quando é cartão, o
-- plano de repasse vindo de private.card_installment_plan — a mesma função que
-- vai gerar as parcelas. Nenhum número desta tela é recalculado no navegador.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.preview_session_billing(
  p_patient             uuid,
  p_amount              numeric default null,
  p_performed_on        date default null,
  p_due_date            date default null,
  p_not_billable_reason text default null,
  p_method              public.payment_method default null,
  p_acquirer            uuid default null,
  p_installments        integer default 1
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_clinic uuid;
  v_status public.session_billing_status;
  v_quote  uuid;
  v_code   text;
  v_sale   date;
  v_plan   jsonb := '[]'::jsonb;
begin
  select pt.clinic_id into v_clinic from public.patient pt where pt.id = p_patient;

  if v_clinic is null then
    raise exception 'Paciente não encontrado.' using errcode = '42501';
  end if;

  -- Ver a prévia é ver o prontuário: quem pode lançar o procedimento pode
  -- perguntar o que ele vai gerar. Não exige 'finance' de propósito — é
  -- justamente o dentista sem financeiro quem precisa da frase.
  if not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_access_feature(v_clinic, 'patients') then
    raise exception 'Sem acesso a esta clínica.' using errcode = '42501';
  end if;

  select d.billing_status, d.covering_quote_id
    into v_status, v_quote
    from private.session_billing_decision(v_clinic, p_patient, p_amount, p_not_billable_reason) d;

  if v_quote is not null then
    select q.code into v_code from public.quote q where q.id = v_quote;
  end if;

  v_sale := coalesce(p_due_date, p_performed_on, (now() at time zone 'America/Sao_Paulo')::date);

  if v_status = 'billed' and p_acquirer is not null and p_method in ('credit', 'debit')
     and exists (select 1 from public.acquirer a
                  where a.id = p_acquirer and a.clinic_id = v_clinic) then
    select coalesce(jsonb_agg(jsonb_build_object(
             'installment_number', c.installment_number,
             'installment_count',  c.installment_count,
             'due_date',           c.due_date,
             'gross_amount',       c.gross_amount,
             'fee',                c.fee,
             'net_amount',         c.gross_amount - c.fee
           ) order by c.installment_number), '[]'::jsonb)
      into v_plan
      from private.card_installment_plan(
             v_clinic, p_acquirer, p_amount, p_installments, v_sale, p_method) c;
  end if;

  return jsonb_build_object(
    'status',       v_status,
    'quote_id',     v_quote,
    'quote_code',   v_code,
    -- Só faz sentido falar em vencimento quando vai nascer título.
    'due_date',     case when v_status = 'billed' then v_sale end,
    'installments', v_plan
  );
end;
$$;

comment on function public.preview_session_billing(uuid, numeric, date, date, text, public.payment_method, uuid, integer) is
  'O que vai acontecer com o dinheiro se este procedimento for salvo agora. '
  'Mesma escada e mesmo cálculo de parcelas do salvamento — a tela não '
  'recalcula nada. Não grava.';

revoke all on function public.preview_session_billing(uuid, numeric, date, date, text, public.payment_method, uuid, integer) from public;
revoke execute on function public.preview_session_billing(uuid, numeric, date, date, text, public.payment_method, uuid, integer) from anon;
grant execute on function public.preview_session_billing(uuid, numeric, date, date, text, public.payment_method, uuid, integer)
  to authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · A REDE DE SEGURANÇA: PROCEDIMENTO EXECUTADO QUE NINGUÉM COBROU
--
-- Lista para o FINANCEIRO, mas lê tabela de PRONTUÁRIO — por isso definer com
-- as duas checagens no WHERE. O contrário (o front juntando treatment_session
-- com patient) exigiria do usuário do financeiro a feature 'patients', ou seja,
-- acesso ao prontuário inteiro para ver uma lista de valores.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.unbilled_sessions()
returns table (
  id              uuid,
  clinic_id       uuid,
  patient_id      uuid,
  patient_name    text,
  has_insurance   boolean,
  treatment_id    uuid,
  treatment_name  text,
  description     text,
  performed_on    date,
  professional_id uuid,
  amount          numeric
)
language sql
stable
security definer
set search_path to ''
as $$
  select s.id,
         s.clinic_id,
         t.patient_id,
         pt.name,
         pt.insurance_id is not null,
         t.id,
         t.procedure,
         coalesce(nullif(btrim(coalesce(s.description, '')), ''), t.procedure),
         s.performed_on,
         s.professional_id,
         s.amount
    from public.treatment_session s
    join public.treatment t on t.id = s.treatment_id and t.clinic_id = s.clinic_id
    join public.patient   pt on pt.id = t.patient_id and pt.clinic_id = t.clinic_id
   where s.clinic_id = any(private.auth_clinic_ids())
     and private.can_access_feature(s.clinic_id, 'finance')
     and s.billing_status = 'unbilled'
     -- amount > 0: sessão sem valor é retorno/acompanhamento, não é dinheiro
     -- esquecido. Listá-la transformaria a rede de segurança em ruído.
     and s.amount > 0
   order by s.performed_on, pt.name;
$$;

comment on function public.unbilled_sessions() is
  'Procedimentos EXECUTADOS com valor que não viraram título nem contrato — a '
  'aba "A faturar". São dois casos: paciente de convênio (a trava que impede '
  'cobrar 100%% do paciente) e sessão anterior à regra.';

revoke all on function public.unbilled_sessions() from public;
revoke execute on function public.unbilled_sessions() from anon;
grant execute on function public.unbilled_sessions() to authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · FATURAR O QUE FICOU PARA TRÁS
--
-- Uma lista que nunca esvazia vira ruído e é ignorada em duas semanas. Este é o
-- botão que fecha o ciclo, e ele delega para a MESMA emit_session_billing —
-- inclusive na trava do contrato aprovado, que não tem override.
--
-- A porta é 'finance' (não 'patients'): faturar é ato do Financeiro. E só
-- aceita sessão ainda 'unbilled': chamar duas vezes num procedimento já
-- faturado geraria um segundo título pelo mesmo ato.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.bill_treatment_session(
  p_session             uuid,
  p_due_date            date default null,
  p_not_billable_reason text default null,
  p_method              public.payment_method default null,
  p_acquirer            uuid default null,
  p_installments        integer default 1,
  p_charge_insured      boolean default false
)
returns public.session_billing_status
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_clinic uuid;
  v_status public.session_billing_status;
begin
  select s.clinic_id, s.billing_status
    into v_clinic, v_status
    from public.treatment_session s
   where s.id = p_session;

  if v_clinic is null then
    raise exception 'Procedimento não encontrado.' using errcode = '42501';
  end if;

  if not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'finance') then
    raise exception 'Sem permissão no Financeiro desta clínica.' using errcode = '42501';
  end if;

  if v_status <> 'unbilled' then
    raise exception 'Este procedimento já tem destino financeiro (%).', v_status
      using errcode = '22023';
  end if;

  return private.emit_session_billing(
    p_session, p_due_date, p_not_billable_reason,
    p_method, p_acquirer, p_installments, p_charge_insured);
end;
$$;

comment on function public.bill_treatment_session(uuid, date, text, public.payment_method, uuid, integer, boolean) is
  'Fatura (ou marca como cortesia) um procedimento parado em "A faturar". '
  'Delega para private.emit_session_billing, então a trava de contrato aprovado '
  'continua valendo. p_charge_insured = decisão consciente de cobrar do '
  'paciente de convênio; é o único desvio da escada, e é humano.';

revoke all on function public.bill_treatment_session(uuid, date, text, public.payment_method, uuid, integer, boolean) from public;
revoke execute on function public.bill_treatment_session(uuid, date, text, public.payment_method, uuid, integer, boolean) from anon;
grant execute on function public.bill_treatment_session(uuid, date, text, public.payment_method, uuid, integer, boolean)
  to authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · GANHOS DO PROFISSIONAL, NA FONTE VIVA
--
-- A aba Ganhos somava public.billed_treatment, que está CONGELADA e tem zero
-- linhas — o gráfico mostrava zero para todo mundo. A produção real de um
-- profissional está em treatment_session (professional_id + amount +
-- performed_on), e o que efetivamente entrou está em receivable.received_amount
-- pelos títulos que apontam para a sessão.
--
-- Devolvemos os DOIS números por procedimento porque professional_commission
-- tem a coluna `base` ('performed' × 'received') e a tela precisa poder honrar
-- a regra que a clínica cadastrou. O percentual em si NÃO é aplicado aqui: ele
-- vive em professional_commission, que a tela já lê, e misturar cálculo de
-- comissão com apuração de produção esconderia qual dos dois errou.
--
-- LIMITE HONESTO, e ele é do modelo: sessão 'covered' (coberta por contrato)
-- não tem título próprio — a dívida nasceu no orçamento, cujas parcelas não têm
-- profissional. Para essas, received volta 0 e a tela precisa dizer isso em vez
-- de fingir que o profissional não produziu.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.professional_earnings(p_professional uuid)
returns table (
  session_id      uuid,
  performed_on    date,
  patient_id      uuid,
  patient_name    text,
  description     text,
  amount          numeric,
  billing_status  public.session_billing_status,
  received_amount numeric
)
language sql
stable
security definer
set search_path to ''
as $$
  select s.id,
         s.performed_on,
         t.patient_id,
         pt.name,
         coalesce(nullif(btrim(coalesce(s.description, '')), ''), t.procedure),
         s.amount,
         s.billing_status,
         coalesce((select sum(r.received_amount)
                     from public.receivable r
                    where r.treatment_session_id = s.id
                      and r.clinic_id = s.clinic_id), 0)
    from public.treatment_session s
    join public.treatment t on t.id = s.treatment_id and t.clinic_id = s.clinic_id
    join public.patient   pt on pt.id = t.patient_id and pt.clinic_id = t.clinic_id
   where s.professional_id = p_professional
     and s.clinic_id = any(private.auth_clinic_ids())
     and private.can_access_feature(s.clinic_id, 'professionals')
     and s.amount > 0
   order by s.performed_on desc;
$$;

comment on function public.professional_earnings(uuid) is
  'Produção de um profissional, procedimento a procedimento: o valor executado '
  '(base ''performed'') e o quanto dele já entrou pelos títulos ligados à sessão '
  '(base ''received''). Sessão coberta por contrato devolve received = 0 porque '
  'as parcelas do orçamento não têm profissional — a tela deve avisar, não '
  'somar zero em silêncio.';

revoke all on function public.professional_earnings(uuid) from public;
revoke execute on function public.professional_earnings(uuid) from anon;
grant execute on function public.professional_earnings(uuid) to authenticated, service_role;
