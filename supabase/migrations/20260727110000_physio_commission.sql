-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — COMISSÃO DE FISIOTERAPIA NO CARD "COMISSÕES" DO DASHBOARD
--
-- O card hoje (professional_quote_conversion, 20260723142646) só faz sentido
-- para quem trabalha com ORÇAMENTO (plano de tratamento odontológico proposto
-- → aprovado). Fisioterapia não tem esse passo: o paciente compra um pacote ou
-- contrato direto no Ponto de Venda (checkout_sale) e começa a agendar sessão.
-- Rodar a mesma conta pra fisioterapia sempre dava zero — não porque não havia
-- comissão, mas porque a pergunta era a errada.
--
-- A pergunta certa, decidida com o dono do produto: comissão por SESSÃO
-- REALIZADA, creditada a quem atendeu — não à venda inteira de uma vez.
--
--   · PACOTE (N sessões): tem preço fechado (sale_item.amount) e um teto
--     (entitlement.total_sessions) — então o valor de UMA sessão é
--     `sale_item.amount / total_sessions`, sem ambiguidade. Cada sessão
--     CONCLUÍDA (appointment.status = 'completed') no mês vale isso, creditado
--     ao profissional daquele atendimento.
--
--   · CONTRATO RECORRENTE (mensalidade, sem teto de sessões): não tem "preço
--     por sessão" — o que existe é uma parcela RECEBIDA no mês
--     (receivable.sale_id → mesma venda do entitlement). Decisão: a
--     mensalidade CHEIA recebida no mês é o que conta, RATEADA pelas sessões
--     que cada profissional deu àquele contrato no mesmo mês (se só um
--     atendeu, ele fica com o valor inteiro; se dois dividiram o mês, cada um
--     leva a fração das sessões que deu).
--
-- Nos dois casos, o "vendido" (produção atribuída) é multiplicado pelo
-- PERCENTUAL cadastrado em professional_commission — só quando o tipo da
-- regra é 'percentage' e ela está ativa. Regra do tipo 'fixed' (valor fixo,
-- não proporcional a volume) fica de fora desta conta por natureza: não faz
-- sentido "fixo × percentual vendido" — comissão fixa é tratada em Ganhos
-- (aba do perfil do profissional), não aqui.
--
-- SECURITY DEFINER, e não INVOKER como o quote_conversion original: as quatro
-- tabelas cruzadas aqui (sale_item, receivable, patient_service_entitlement,
-- professional_commission) são gated por features DIFERENTES da que abre o
-- Dashboard —
--   sale_item/receivable/professional_commission → 'finance' (ou 'admin')
--   patient_service_entitlement                  → 'patients'/'schedule'
--   appointment                                   → 'schedule'/'dashboard'
-- — um gestor com só 'dashboard' (o mínimo pra ver este card) ficaria
-- bloqueado em silêncio nas outras três sob RLS normal (SECURITY INVOKER) e o
-- card voltaria zero pra todo mundo, sem erro nenhum — a MESMA classe de bug
-- que professional_directory existe pra evitar em 'professionals'. Por isso
-- aqui a checagem de acesso é EXPLÍCITA (require 'dashboard') dentro da
-- função, mesmo padrão de public.professional_earnings.
--
-- Depende de: 20260724150000_sales_and_entitlements.sql (sale_item,
--             patient_service_entitlement), 20260725160000_recurring_entitlement
--             (kind), 20260722120700_finance.sql (receivable),
--             20260722120300_professionals.sql (professional_commission),
--             20260722150000_dashboard_aggregates.sql (parse_month_iso)
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function public.professional_physio_commission(p_month_iso text)
returns table (
  professional_id uuid,
  name            text,
  photo_url       text,
  sold            numeric,
  commission      numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_clinic uuid := private.auth_clinic_id();
  v_first  date := private.parse_month_iso(p_month_iso);
  v_next   date := (v_first + interval '1 month')::date;
begin
  if v_clinic is null or not private.can_access_feature(v_clinic, 'dashboard') then
    raise exception 'Sem acesso ao Dashboard desta clínica.' using errcode = '42501';
  end if;

  return query
  with package_value as (
    -- Uma linha por sessão de PACOTE concluída no mês; o valor já é o da
    -- sessão isolada (venda ÷ teto do pacote).
    select a.professional_id as pid, (si.amount / e.total_sessions) as value
      from public.appointment a
      join public.patient_service_entitlement e
        on e.id = a.entitlement_id and e.clinic_id = v_clinic
      join public.sale_item si
        on si.id = e.sale_item_id and si.clinic_id = v_clinic
     where a.clinic_id = v_clinic
       and a.status = 'completed'
       and a."date" >= v_first and a."date" < v_next
       and e.kind = 'package'
  ),
  recurring_sessions as (
    -- Quantas sessões cada profissional deu, POR CONTRATO recorrente, no mês
    -- — é o peso do rateio da mensalidade abaixo.
    select a.entitlement_id as eid, a.professional_id as pid, count(*)::numeric as sessions
      from public.appointment a
      join public.patient_service_entitlement e
        on e.id = a.entitlement_id and e.clinic_id = v_clinic
     where a.clinic_id = v_clinic
       and a.status = 'completed'
       and a."date" >= v_first and a."date" < v_next
       and e.kind = 'recurring'
     group by a.entitlement_id, a.professional_id
  ),
  recurring_received as (
    -- Mensalidade efetivamente RECEBIDA no mês, por contrato (pode ser mais
    -- de uma baixa parcial — soma tudo).
    select e.id as eid, sum(r.received_amount) as received
      from public.patient_service_entitlement e
      join public.sale_item si on si.id = e.sale_item_id and si.clinic_id = v_clinic
      join public.receivable r
        on r.sale_id = si.sale_id and r.clinic_id = v_clinic
       and r.status = 'paid'
       and r.received_at >= v_first and r.received_at < v_next
     where e.clinic_id = v_clinic and e.kind = 'recurring'
     group by e.id
  ),
  recurring_value as (
    -- Rateio: fração das sessões do contrato que ESTE profissional deu no
    -- mês × o que o contrato recebeu no mesmo mês.
    select rs.pid,
           rr.received * rs.sessions / sum(rs.sessions) over (partition by rs.eid) as value
      from recurring_sessions rs
      join recurring_received rr on rr.eid = rs.eid
  ),
  sold as (
    select pid, sum(value) as total
      from (select * from package_value union all select * from recurring_value) x
     group by pid
  )
  select p.id, p.name, p.photo_url,
         round(coalesce(s.total, 0), 2)::numeric as sold,
         -- Só entra comissão de regra 'percentage' ATIVA — 'fixed' não é
         -- proporcional a venda nenhuma, e regra inativa/ausente não gera nada
         -- (mesma leitura de "ausência de regra = sem comissão calculada" do
         -- resto do sistema).
         round(coalesce(s.total, 0) * coalesce(c.amount, 0) / 100, 2)::numeric as commission
    from public.professional p
    left join sold s on s.pid = p.id
    left join public.professional_commission c
      on c.professional_id = p.id
     and c.clinic_id = v_clinic
     and c.status = 'active'
     and c.type = 'percentage'
   where p.clinic_id = v_clinic and p.status = 'active'
   order by sold desc, p.name;
end;
$$;

comment on function public.professional_physio_commission(text) is
  'Por profissional, numa clínica de fisioterapia: quanto foi PRODUZIDO no mês '
  '(sessão de pacote valorizada em venda÷teto; contrato recorrente pela '
  'mensalidade recebida, rateada pelas sessões que cada um deu) e a comissão '
  'resultante (produzido × percentual cadastrado em professional_commission, '
  'só regra type=percentage ativa). Alimenta o card "Comissões" do Dashboard '
  'quando clinic.specialty = physiotherapy — a versão de outras especialidades '
  'é professional_quote_conversion (orçamento aprovado), que segue como estava.';

revoke all on function public.professional_physio_commission(text) from public, anon;
grant execute on function public.professional_physio_commission(text) to authenticated;
