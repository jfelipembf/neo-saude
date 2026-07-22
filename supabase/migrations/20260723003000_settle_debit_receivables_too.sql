-- Item 5: o DÉBITO também é baixado sozinho.
-- Débito é uma transferência AUTORIZADA na hora — o dinheiro é garantido igual
-- ao do crédito e cai na data prevista de repasse (D+settlement). Antes, a rotina
-- só tratava crédito, então todo recebível de débito ficava 'pending' para sempre
-- (não vence — debtor='acquirer' o exclui do overdue — mas também nunca baixava).
-- Preserva todas as travas atuais: sem recebimento parcial, não estornado
-- (auto_settle_blocked), e só a partir da data de repasse.
create or replace function private.settle_card_receivables(p_today date default null)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
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
     -- Crédito E débito: os dois são garantidos pela adquirente na autorização.
     -- PIX, boleto e dinheiro continuam de fora (ali o dinheiro pode não entrar).
     and r.method    in ('credit', 'debit')
     and r.status    = 'pending'
     -- Título com recebimento parcial já teve mão humana: não se mexe.
     and r.received_amount = 0
     -- Estornado por quem conferiu o extrato: o repasse NÃO caiu.
     and not r.auto_settle_blocked
     and r.due_date <= v_today;

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

comment on function private.settle_card_receivables(date) is
  'Baixa os recebíveis de CARTÃO (crédito e débito) cuja data prevista de repasse '
  'chegou. Idempotente: só toca linhas ainda pending, sem recebimento parcial e '
  'não estornadas (auto_settle_blocked).';
