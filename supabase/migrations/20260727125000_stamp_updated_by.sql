-- Carimba `updated_by` com auth.uid() por TRIGGER.
--
-- Existe para resolver um conflito real entre duas coisas boas:
--  · a coluna de rastro fica FORA dos grants do cliente (senão quem apagou
--    marcação de quem seria forjável);
--  · a RPC que grava é SECURITY INVOKER (a RLS é a parede, não a função).
-- Invoker roda com os privilégios de quem chama, então a própria RPC batia em
-- "permission denied for column updated_by". Trigger não passa pelo controle de
-- privilégio de coluna do chamador — resolve os dois sem virar SECURITY
-- DEFINER, que furaria a RLS.
create or replace function private.tg_stamp_updated_by()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_by := auth.uid();
  return new;
end;
$$;

comment on function private.tg_stamp_updated_by() is
  'BEFORE INSERT OR UPDATE: carimba updated_by com auth.uid(). Permite manter a '
  'coluna fora dos grants do cliente (rastro não forjável) sem impedir que uma '
  'RPC SECURITY INVOKER grave a linha.';

revoke execute on function private.tg_stamp_updated_by() from public;
