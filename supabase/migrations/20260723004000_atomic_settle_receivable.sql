-- Minor B: baixa de recebível ATÔMICA. Antes o cliente fazia read-modify-write
-- (lê received_amount, soma, grava), então duas baixas parciais simultâneas se
-- sobrescreviam — a segunda partia do valor ANTES da primeira. Aqui o incremento
-- é uma única UPDATE: a linha é travada e o segundo caller re-lê o valor já
-- commitado. SECURITY INVOKER — a RLS de receivable (feature 'finance') continua
-- valendo, sem mudar o modelo de permissão.
create or replace function public.settle_receivable(
  p_id     uuid,
  p_amount numeric,
  p_date   date,
  p_method public.payment_method default null,
  p_bank   uuid default null,
  p_notes  text default null
) returns void
language sql
set search_path to ''
as $function$
  update public.receivable r
     set received_amount = r.received_amount + p_amount,
         received_at     = p_date,
         status          = case
                             when r.received_amount + p_amount >= (r.gross_amount - r.fee) - 0.001
                             then 'paid'::public.payment_status
                             else 'pending'::public.payment_status end,
         -- A forma da venda NÃO se reescreve: título com adquirente mantém a sua
         -- (o CHECK recusaria trocar por pix/dinheiro); sem adquirente, só grava
         -- quando o usuário de fato escolheu uma (mesma regra do methodPatch).
         method          = case when r.acquirer_id is null and p_method is not null
                                then p_method else r.method end,
         bank_account_id = p_bank,
         notes           = case when nullif(btrim(coalesce(p_notes, '')), '') is not null
                                then p_notes else r.notes end
   where r.id = p_id;
$function$;

comment on function public.settle_receivable(uuid, numeric, date, public.payment_method, uuid, text) is
  'Baixa (parcial ou total) de um recebível, de forma atômica: o incremento de '
  'received_amount é uma única UPDATE, sem read-modify-write.';

revoke all on function public.settle_receivable(uuid, numeric, date, public.payment_method, uuid, text) from public;
grant execute on function public.settle_receivable(uuid, numeric, date, public.payment_method, uuid, text)
  to authenticated, service_role;
