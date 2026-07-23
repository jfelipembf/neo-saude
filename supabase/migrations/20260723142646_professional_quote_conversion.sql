-- ─────────────────────────────────────────────────────────────────────────────
-- Card "Comissões" do Dashboard: por profissional, quanto foi ORÇADO num mês
-- (soma das linhas de orçamento atribuídas a ele) e quanto disso CONVERTEU
-- (está em orçamentos já aprovados). O mês é por `quote.issue_date` — a
-- pergunta é "do que foi proposto em julho, quanto virou contrato", não
-- "o que foi aprovado em julho" (que misturaria propostas de meses diferentes).
--
-- SECURITY INVOKER, sem p_clinic: mesmo padrão de cash_flow()/dashboard_stats()
-- — a RLS de professional/quote/quote_item já resolve o tenant.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.professional_quote_conversion(p_month_iso text)
returns table (
  professional_id uuid,
  name            text,
  photo_url       text,
  quoted          numeric,
  converted       numeric
)
language plpgsql
stable
security invoker
set search_path to ''
as $$
declare
  v_first date := private.parse_month_iso(p_month_iso);
  v_next  date := (v_first + interval '1 month')::date;
begin
  return query
    select p.id, p.name, p.photo_url,
           coalesce(sum(m.amount), 0)::numeric as quoted,
           -- FILTER e não CASE: soma só as linhas cujo orçamento já foi aprovado.
           coalesce(sum(m.amount) filter (where m.approved), 0)::numeric as converted
      from public.professional p
      left join (
        -- Pré-filtra por mês ANTES do left join com professional: um item de
        -- fora do mês não pode "vazar" como zero-mas-presente e confundir o
        -- coalesce. Só entra quem tem professional_id (linha sem profissional
        -- não é comissão de ninguém).
        select qi.professional_id, qi.amount, (q.status = 'approved') as approved
          from public.quote_item qi
          join public.quote q on q.id = qi.quote_id
         where q.issue_date >= v_first and q.issue_date < v_next
           and qi.professional_id is not null
      ) m on m.professional_id = p.id
     where p.status = 'active'
     group by p.id, p.name, p.photo_url
     order by quoted desc, p.name;
end;
$$;

comment on function public.professional_quote_conversion(text) is
  'Por profissional: quanto foi orçado no mês (quote.issue_date) e quanto disso '
  'já converteu (orçamento aprovado). Base do card "Comissões" do Dashboard. '
  'Discount de quote NÃO é rateado por linha/profissional — a soma é do valor '
  'bruto de cada quote_item, mesmo critério de professional_earnings.';

revoke all on function public.professional_quote_conversion(text) from public, anon;
grant execute on function public.professional_quote_conversion(text) to authenticated;
