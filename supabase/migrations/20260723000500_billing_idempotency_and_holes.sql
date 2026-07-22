-- ═════════════════════════════════════════════════════════════════════════════
-- REVISÃO ADVERSARIAL "DINHEIRO DOBRADO": as travas que faltavam
--
-- Cinco buracos confirmados no código e no banco reais, cada um com o cenário
-- concreto escrito ao lado da trava que o fecha:
--
--  1. NÃO havia índice único ligando recebível a procedimento. O orçamento
--     tinha (receivable_quote_installment_uk); o procedimento, não. Qualquer
--     corrida gerava dois títulos pelo mesmo ato.
--  2. bill_treatment_session lia billing_status SEM LOCK e só depois escrevia:
--     dois cliques simultâneos passavam os dois pela porta.
--  3. record_treatment_session não tinha NENHUMA idempotência: com a resposta
--     perdida na rede (o commit acontece, o navegador vê erro), o usuário
--     salvava de novo e nascia um segundo procedimento com um segundo título.
--  4. Cancelar um recebível deixava a sessão marcada 'billed' apontando para um
--     título cancelado: o procedimento sumia de "A faturar" para sempre e
--     ninguém mais cobrava aquilo. Dinheiro perdido em silêncio.
--  5. Estornar a baixa automática de um repasse de cartão não durava até a
--     manhã seguinte: a rotina diária baixava tudo de novo, porque só olhava
--     status='pending'. O estorno dizia "não caiu" e o sistema respondia
--     "caiu sim", todo dia.
--
-- E o mais provável de todos, que não é corrida nem rede — é o caminho feliz:
--  6. A trava do contrato só valia enquanto houvesse SALDO EM ABERTO. Paciente
--     que pagou o plano à vista (ou terminou de pagar antes de terminar o
--     tratamento) passava a ser COBRADO OUTRA VEZ, procedimento a procedimento,
--     pelo tratamento que já pagou.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · UM PROCEDIMENTO, UMA COBRANÇA — ESCRITO NO ÍNDICE
--
-- Espelha receivable_quote_installment_uk, que já protegia o orçamento. Sem
-- ele, a idempotência do lado do procedimento dependia de disciplina de código:
-- qualquer caminho novo (ou qualquer corrida) inseria o segundo título sem que
-- nada reclamasse.
--
-- coalesce(installment_number, 1) porque título de procedimento à vista tem
-- installment_number NULL, e em índice único NULL não colide com NULL — sem o
-- coalesce a trava protegeria só as vendas parceladas no cartão, justamente as
-- que já são as mais raras.
-- ─────────────────────────────────────────────────────────────────────────────
create unique index if not exists receivable_session_installment_uk
  on public.receivable (treatment_session_id, coalesce(installment_number, 1))
  where treatment_session_id is not null;

comment on index public.receivable_session_installment_uk is
  'Um procedimento não pode ter duas vezes a mesma parcela. É a trava estrutural '
  'contra cobrança dobrada por duplo clique, retry de rede ou caminho novo.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · ESTORNO DE REPASSE DE CARTÃO PRECISA SOBREVIVER À NOITE
--
-- A baixa do cartão é automática porque a venda foi garantida pela adquirente.
-- Mas quando o repasse NÃO cai (chargeback, cancelamento de venda, adquirente
-- em atraso), o humano estorna a baixa — e estorno devolve o título para
-- 'pending' com received_amount = 0, que é exatamente o que a rotina diária
-- procura. Resultado: toda madrugada o sistema reinventava a receita.
--
-- Uma coluna, e não "detectar pelo histórico": o fato "este repasse não caiu" é
-- uma decisão humana, e decisão humana se grava onde o próximo leitor enxerga.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.receivable
  add column if not exists auto_settle_blocked boolean not null default false;

comment on column public.receivable.auto_settle_blocked is
  'Repasse de cartão que o humano estornou: a baixa automática não volta a '
  'tocar neste título. Só o estorno liga; a baixa manual desliga.';

create or replace function private.settle_card_receivables(p_today date default null)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_today date := coalesce(p_today, (now() at time zone 'America/Sao_Paulo')::date);
  v_count integer;
begin
  update public.receivable r
     set status          = 'paid',
         received_at     = r.due_date,
         received_amount = r.gross_amount - r.fee,   -- o líquido é o que entra
         bank_account_id = coalesce(r.bank_account_id, a.payout_account_id)
    from public.acquirer a
   where a.id        = r.acquirer_id
     and a.clinic_id = r.clinic_id
     and r.method    = 'credit'
     and r.status    = 'pending'
     -- Título com recebimento parcial já teve mão humana: não se mexe.
     and r.received_amount = 0
     -- Estornado por quem conferiu o extrato: o repasse NÃO caiu. Rebaixar
     -- automaticamente seria o sistema discordando do humano toda madrugada.
     and not r.auto_settle_blocked
     and r.due_date <= v_today;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · CANCELAR O TÍTULO DEVOLVE O PROCEDIMENTO PARA "A FATURAR"
--
-- CENÁRIO REAL (ReceivableTab.tsx:250, botão "Cancelar"): título de um
-- procedimento é cancelado por engano ou por renegociação. A sessão continuava
-- 'billed' apontando para um título cancelado — e billing_status='billed' é
-- exatamente o filtro que tira a sessão de unbilled_sessions(). O procedimento
-- executado sumia da rede de segurança e nunca mais era cobrado. Pior: não
-- havia caminho de volta, porque bill_treatment_session só aceita 'unbilled'.
--
-- Trigger, e não "arrumar no service": o cancelamento é um UPDATE direto na
-- tabela (a policy permite), então qualquer tela nova refaria o buraco. Aqui
-- não nasce dinheiro — o efeito é DEVOLVER o procedimento para a lista de quem
-- decide. É o oposto de cobrança mágica.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function private.tg_receivable_cancel_frees_session()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_next uuid;
begin
  -- Sobrou algum título vivo deste procedimento? (venda no cartão em 3x tem
  -- três: cancelar a 2ª não descobre o procedimento, só muda para onde a
  -- sessão aponta.)
  select r.id into v_next
    from public.receivable r
   where r.treatment_session_id = new.treatment_session_id
     and r.clinic_id            = new.clinic_id
     and r.status <> 'canceled'
   order by coalesce(r.installment_number, 1)
   limit 1;

  if v_next is null then
    -- Nenhum título vivo: o procedimento volta a ser um fato consumado sem
    -- reflexo financeiro — que é a definição de "A faturar".
    update public.treatment_session s
       set billing_status = 'unbilled',
           receivable_id  = null
     where s.id        = new.treatment_session_id
       and s.clinic_id = new.clinic_id
       and s.billing_status = 'billed';
  else
    -- Ainda há cobrança viva: só reaponta, para a sessão não referenciar um
    -- título cancelado.
    update public.treatment_session s
       set receivable_id = v_next
     where s.id        = new.treatment_session_id
       and s.clinic_id = new.clinic_id
       and s.billing_status = 'billed'
       and s.receivable_id is distinct from v_next;
  end if;

  return null;
end;
$$;

comment on function private.tg_receivable_cancel_frees_session() is
  'Título de procedimento cancelado devolve o procedimento para "A faturar" '
  '(ou reaponta a sessão para a parcela viva). Sem isto, cancelar um título '
  'apagava a cobrança E escondia o procedimento da rede de segurança.';

drop trigger if exists tr_cancel_frees_session on public.receivable;
create trigger tr_cancel_frees_session
  after update of status on public.receivable
  for each row
  when (new.status = 'canceled'
        and old.status is distinct from 'canceled'
        and new.treatment_session_id is not null)
  execute function private.tg_receivable_cancel_frees_session();


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · A ESCADA: CONTRATO QUITADO NÃO PODE VIRAR COBRANÇA NOVA
--
-- O DEGRAU QUE FALTAVA (e é o caminho feliz, não a corrida):
--   Paciente aprova um plano de R$ 3.000 e paga À VISTA. A partir do dia
--   seguinte o contrato não tem mais "saldo em aberto" — e cada sessão daquele
--   MESMO tratamento passava a nascer 'billed', gerando título novo. O paciente
--   pagava o plano inteiro e depois recebia uma cobrança por procedimento.
--   Idem para quem termina de pagar em 4x antes de terminar o tratamento, que é
--   o normal em odontologia.
--
-- Por que NÃO basta trocar "saldo em aberto" por "existe contrato": aí o
-- contrato passaria a cobrir para sempre qualquer procedimento futuro, e a
-- clínica deixaria de cobrar o que é novo — trocar cobrança dobrada por receita
-- perdida não é conserto.
--
-- A regra que fecha os dois lados sem inventar apontamento (não existe catálogo
-- para casar procedimento com item de orçamento — comparar TEXTO é proibido):
--   · contrato com saldo em aberto  → 'covered'  (regra do dono, intacta);
--   · contrato quitado com VALOR AINDA NÃO CONSUMIDO em procedimentos →
--     'unbilled', ou seja, vai para "A faturar" e UM HUMANO decide se está
--     incluso no plano ou se é procedimento novo. Ninguém é cobrado sozinho e
--     nada some;
--   · contrato quitado e já consumido (soma das sessões cobertas ≥ total) →
--     segue a vida: procedimento novo gera título normalmente.
--
-- O teste de consumo NÃO entra no degrau 'covered'. Se entrasse, uma clínica
-- que lança sessões pelo preço de tabela enquanto o contrato tem desconto
-- estouraria o consumo cedo e voltaria a cobrar um contrato ainda EM ABERTO —
-- cobrança dobrada de novo, agora por arredondamento de política comercial.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists private.session_billing_decision(uuid, uuid, numeric, text, boolean);

create function private.session_billing_decision(
  p_clinic         uuid,
  p_patient        uuid,
  p_amount         numeric,
  p_reason         text    default null,
  -- Decisão humana explícita de cobrar assim mesmo (convênio ou contrato
  -- quitado). NUNCA vence o degrau 'covered': ali a dívida está viva.
  p_human_override boolean default false
)
returns table (
  billing_status    public.session_billing_status,
  covering_quote_id uuid,
  pending_quote_id  uuid
)
language plpgsql
stable
set search_path to ''
as $$
declare
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  covering_quote_id := null;
  pending_quote_id  := null;

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

    else
      -- 3b. Contrato aprovado e QUITADO, com valor de plano ainda não
      --     consumido por procedimentos. Cobrar seria cobrar duas vezes o que
      --     ele já pagou; não cobrar seria dar de graça o que talvez seja novo.
      --     Vai para "A faturar" — a decisão é de gente, não de escada.
      select q.id into pending_quote_id
        from public.quote q
       where q.clinic_id  = p_clinic
         and q.patient_id = p_patient
         and q.status     = 'approved'
         and exists (
               select 1 from public.receivable r
                where r.quote_id  = q.id
                  and r.clinic_id = q.clinic_id
                  and r.status <> 'canceled')
         and coalesce((select sum(s.amount)
                         from public.treatment_session s
                        where s.quote_id  = q.id
                          and s.clinic_id = q.clinic_id), 0) + p_amount <= q.total
       order by q.issue_date, q.created_at
       limit 1;

      if pending_quote_id is not null and not p_human_override then
        billing_status := 'unbilled';

      elsif not p_human_override
        and exists (select 1 from public.patient pt
                     where pt.id = p_patient and pt.clinic_id = p_clinic
                       and pt.insurance_id is not null) then
        -- 4. Convênio: quem paga é o convênio, e o valor cheio do particular
        --    não é a conta do paciente. Vai para "A faturar".
        billing_status := 'unbilled';

      else
        -- 5. Fato consumado, sem contrato e sem convênio: nasce o título.
        billing_status := 'billed';
      end if;
    end if;
  end if;

  return next;
end;
$$;

comment on function private.session_billing_decision(uuid, uuid, numeric, text, boolean) is
  'A escada que decide o destino financeiro de um procedimento: sem valor → '
  'cortesia → contrato com saldo em aberto (covered) → contrato quitado com '
  'plano não consumido (A faturar) → convênio (A faturar) → título. Não grava '
  'e não escolhe tenant. Existe separada para que a tela possa PERGUNTAR a '
  'mesma coisa que o banco vai DECIDIR.';

revoke all on function private.session_billing_decision(uuid, uuid, numeric, text, boolean) from public;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · emit_session_billing — mesmo corpo, com o override renomeado
--
-- `p_ignore_insurance` virou `p_human_override`: ele agora derruba dois degraus
-- (convênio e contrato quitado), e um nome que mente sobre o que a flag faz é
-- como a próxima pessoa cobra o paciente errado.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists private.emit_session_billing(
  uuid, date, text, public.payment_method, uuid, integer, boolean);

create function private.emit_session_billing(
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
  'tela consulta em preview_session_billing. Trava a linha da sessão (FOR NO KEY '
  'UPDATE) antes de decidir, para que duas chamadas simultâneas não gerem dois '
  'títulos pelo mesmo procedimento.';

revoke all on function private.emit_session_billing(uuid, date, text, public.payment_method, uuid, integer, boolean) from public;
grant execute on function private.emit_session_billing(uuid, date, text, public.payment_method, uuid, integer, boolean)
  to authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · IDEMPOTÊNCIA DE VERDADE NO SALVAMENTO DO PROCEDIMENTO
--
-- CENÁRIO REAL, sem concorrência nenhuma: o dentista clica em Salvar, o commit
-- acontece no banco e a resposta se perde (4G do consultório, proxy, timeout).
-- O navegador mostra erro — na verdade nem isso: TreatmentsPanel.saveProcedure
-- não tinha onError, então não mostrava NADA. Ele clica de novo e nasce um
-- segundo procedimento com um segundo título. O paciente paga duas vezes.
--
-- A chave vem do CLIENTE porque é ele quem sabe que a segunda tentativa é a
-- MESMA intenção: o token nasce quando o editor abre e só troca quando um
-- procedimento novo começa. Igual ao token dos gateways de pagamento, e pela
-- mesma razão.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.treatment_session
  add column if not exists client_token uuid;

comment on column public.treatment_session.client_token is
  'Chave de idempotência do editor: retentativa com o mesmo token devolve o '
  'procedimento já gravado em vez de criar outro (e outro título).';

create unique index if not exists treatment_session_client_token_uk
  on public.treatment_session (clinic_id, client_token)
  where client_token is not null;

drop function if exists public.record_treatment_session(
  uuid, date, public.tooth_status, text, uuid, public.money_brl, text, text[], text[], jsonb, jsonb,
  date, text, public.payment_method, uuid, integer);

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
  -- ── o reflexo financeiro ──
  p_due_date            date default null,               -- padrão: performed_on
  p_not_billable_reason text default null,               -- cortesia/garantia
  p_method              public.payment_method default null,
  p_acquirer            uuid default null,               -- obrigatório p/ cartão
  p_installments        integer default 1,
  -- ── idempotência ──
  p_client_token        uuid default null
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

  -- Retentativa da MESMA intenção: devolve o que já foi gravado. Nada é
  -- inserido, nada é cobrado de novo, e o cliente recebe um sucesso honesto.
  if p_client_token is not null then
    select s.id into v_session
      from public.treatment_session s
     where s.clinic_id = v_clinic and s.client_token = p_client_token;
    if v_session is not null then
      return v_session;
    end if;
  end if;

  begin
    insert into public.treatment_session (
      clinic_id, treatment_id, description, performed_on, professional_id, amount, notes, client_token
    ) values (
      v_clinic, p_treatment,
      nullif(btrim(coalesce(p_description, '')), ''),
      p_performed_on, p_professional, p_amount,
      nullif(btrim(coalesce(p_notes, '')), ''),
      p_client_token
    )
    returning id into v_session;
  exception when unique_violation then
    -- Duas tentativas ao mesmo tempo (duplo clique com a rede lenta): a que
    -- perdeu a corrida devolve o procedimento da que ganhou.
    select s.id into v_session
      from public.treatment_session s
     where s.clinic_id = v_clinic and s.client_token = p_client_token;
    if v_session is null then
      raise;
    end if;
    return v_session;
  end;

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
  -- exatamente o buraco que existia antes.
  perform private.emit_session_billing(
    v_session, p_due_date, p_not_billable_reason, p_method, p_acquirer, p_installments);

  return v_session;
end;
$function$;

comment on function public.record_treatment_session(
  uuid, date, public.tooth_status, text, uuid, public.money_brl, text, text[], text[], jsonb, jsonb,
  date, text, public.payment_method, uuid, integer, uuid) is
  'Grava um procedimento executado (sessão + dentes + etapas + materiais + '
  'odontograma + status do tratamento) E o seu reflexo financeiro, tudo numa '
  'transação. p_client_token torna a retentativa idempotente: mesmo token, '
  'mesmo procedimento, nenhuma cobrança nova.';

revoke all on function public.record_treatment_session(
  uuid, date, public.tooth_status, text, uuid, public.money_brl, text, text[], text[], jsonb, jsonb,
  date, text, public.payment_method, uuid, integer, uuid) from public;
grant execute on function public.record_treatment_session(
  uuid, date, public.tooth_status, text, uuid, public.money_brl, text, text[], text[], jsonb, jsonb,
  date, text, public.payment_method, uuid, integer, uuid) to authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · A PORTA DE "A FATURAR" TRAVA A LINHA ANTES DE DECIDIR
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.bill_treatment_session(
  uuid, date, text, public.payment_method, uuid, integer, boolean);

create function public.bill_treatment_session(
  p_session             uuid,
  p_due_date            date default null,
  p_not_billable_reason text default null,
  p_method              public.payment_method default null,
  p_acquirer            uuid default null,
  p_installments        integer default 1,
  -- Decisão humana de cobrar mesmo assim: paciente de convênio OU procedimento
  -- que ficou parado por causa de um contrato quitado. Nunca vence 'covered'.
  p_charge_anyway       boolean default false
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
  -- FOR NO KEY UPDATE: sem o lock, dois cliques simultâneos no botão "Gerar
  -- cobrança" liam 'unbilled' os dois e criavam dois títulos para o mesmo
  -- procedimento. Com ele, o segundo espera, relê 'billed' e é recusado.
  select s.clinic_id, s.billing_status
    into v_clinic, v_status
    from public.treatment_session s
   where s.id = p_session
     for no key update;

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
    p_method, p_acquirer, p_installments, p_charge_anyway);
end;
$$;

comment on function public.bill_treatment_session(uuid, date, text, public.payment_method, uuid, integer, boolean) is
  'Fatura (ou marca como cortesia) um procedimento parado em "A faturar". '
  'Trava a linha antes de conferir o estado, delega para '
  'private.emit_session_billing e por isso continua respeitando a trava do '
  'contrato com saldo em aberto, que não tem override.';

revoke all on function public.bill_treatment_session(uuid, date, text, public.payment_method, uuid, integer, boolean) from public;
revoke execute on function public.bill_treatment_session(uuid, date, text, public.payment_method, uuid, integer, boolean) from anon;
grant execute on function public.bill_treatment_session(uuid, date, text, public.payment_method, uuid, integer, boolean)
  to authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · A PRÉVIA CONTINUA SENDO A MESMA PERGUNTA
--
-- Ganhou `pending_quote_code`: quando o procedimento vai parar em "A faturar"
-- por causa de um contrato quitado, o diálogo precisa DIZER ISSO. "Não gera
-- cobrança" sem o motivo é a mesma omissão que fez a sessão órfã de R$ 250.
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
  v_clinic   uuid;
  v_status   public.session_billing_status;
  v_quote    uuid;
  v_pending  uuid;
  v_code     text;
  v_pcode    text;
  v_sale     date;
  v_plan     jsonb := '[]'::jsonb;
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

  select d.billing_status, d.covering_quote_id, d.pending_quote_id
    into v_status, v_quote, v_pending
    from private.session_billing_decision(v_clinic, p_patient, p_amount, p_not_billable_reason) d;

  if v_quote is not null then
    select q.code into v_code from public.quote q where q.id = v_quote;
  end if;
  if v_pending is not null then
    select q.code into v_pcode from public.quote q where q.id = v_pending;
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
    'status',             v_status,
    'quote_id',           v_quote,
    'quote_code',         v_code,
    -- Contrato quitado que segurou o procedimento em "A faturar".
    'pending_quote_code', v_pcode,
    -- Só faz sentido falar em vencimento quando vai nascer título.
    'due_date',           case when v_status = 'billed' then v_sale end,
    'installments',       v_plan
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9 · "A FATURAR" PRECISA DIZER POR QUE A LINHA ESTÁ LÁ
--
-- Havia dois motivos (convênio, sem contrato) e a tela deduzia pelo
-- has_insurance. Agora há três, e o terceiro — contrato quitado — é justamente
-- o que o humano precisa conferir antes de cobrar, sob pena de cobrar duas
-- vezes o que o paciente já pagou. Motivo deduzido vira motivo errado.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.unbilled_sessions();

create function public.unbilled_sessions()
returns table (
  id                 uuid,
  clinic_id          uuid,
  patient_id         uuid,
  patient_name       text,
  has_insurance      boolean,
  treatment_id       uuid,
  treatment_name     text,
  description        text,
  performed_on       date,
  professional_id    uuid,
  amount             numeric,
  pending_quote_code text
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
         s.amount,
         (select q.code
            from public.quote q
           where q.id = (select d.pending_quote_id
                           from private.session_billing_decision(
                                  s.clinic_id, t.patient_id, s.amount) d))
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
  'aba "A faturar". Três casos: paciente de convênio, contrato aprovado JÁ '
  'QUITADO com plano não consumido (pending_quote_code) e sessão anterior à '
  'regra.';

revoke all on function public.unbilled_sessions() from public;
revoke execute on function public.unbilled_sessions() from anon;
grant execute on function public.unbilled_sessions() to authenticated, service_role;
