-- ═══════════════════════════════════════════════════════════════════════════
-- CONTATO DO FORNECEDOR + BAIXA DE ESTOQUE
-- ═══════════════════════════════════════════════════════════════════════════

-- 1 · E-mail e WhatsApp do fornecedor.
-- O cadastro só tinha `phone`. Para pedir orçamento a Cibelly precisa do
-- e-mail, e o fixo do balcão raramente é o WhatsApp de quem vende — mesma
-- separação que `patient` já faz, com os mesmos domains de validação.
alter table public.supplier
  add column if not exists email    public.email_address,
  add column if not exists whatsapp public.phone_digits;

comment on column public.supplier.email is
  'E-mail comercial — destino do pedido de orçamento quando um material está acabando.';
comment on column public.supplier.whatsapp is
  'WhatsApp do fornecedor. Separado de phone porque o fixo do balcão raramente é o WhatsApp de quem vende.';

grant insert (email, whatsapp) on public.supplier to authenticated;
grant update (email, whatsapp) on public.supplier to authenticated;


-- 2 · Baixa de estoque ao consumir material.
--
-- Até aqui NADA mexia em material.in_stock: o número só mudava se alguém
-- editasse à mão em Administrativo → Materiais. Registrar consumo no
-- procedimento e não dar baixa faz o estoque mentir a cada atendimento.
--
-- Em TRIGGER, e não no cliente, porque o consumo entra por dois caminhos (o
-- editor de procedimento do prontuário e a voz da Cibelly) — e um deles
-- esqueceria. Aqui é um lugar só e vale para os dois.
--
-- ATENÇÃO ao tipo: `treatment_session_material.quantity` é TEXTO, não número —
-- o campo existe para o profissional escrever como quiser ("2", "2 tubetes",
-- "1 caixa"). A primeira versão desta trigger assumiu numeric e derrubava o
-- registro do procedimento inteiro com "operator does not exist: numeric - text".
-- Agora lê o número do início do texto (aceita vírgula decimal) e, sem número
-- legível, NÃO dá baixa: estoque errado é pior que estoque desatualizado, e
-- "meia caixa" não vira 0,5 de nada sem saber o tamanho da caixa. O consumo
-- continua registrado no procedimento; só a baixa automática fica de fora.
--
-- Estoque NÃO é travado em zero de propósito: material usado foi usado. Ficar
-- negativo é sinal legítimo de cadastro atrasado, e esconder isso só faria o
-- número mentir de outro jeito.
create or replace function private.tg_apply_material_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_qtd numeric;
begin
  if tg_op = 'INSERT' then
    if new.material_id is null then return new; end if;
    v_qtd := nullif(regexp_replace(substring(coalesce(new.quantity,'') from '^\s*[0-9]+([.,][0-9]+)?'), ',', '.', 'g'), '')::numeric;
    if v_qtd is null or v_qtd <= 0 then return new; end if;
    update public.material set in_stock = in_stock - v_qtd where id = new.material_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.material_id is null then return old; end if;
    v_qtd := nullif(regexp_replace(substring(coalesce(old.quantity,'') from '^\s*[0-9]+([.,][0-9]+)?'), ',', '.', 'g'), '')::numeric;
    if v_qtd is null or v_qtd <= 0 then return old; end if;
    -- Devolve ao estoque: sem isto, corrigir um lançamento errado deixaria a
    -- falta registrada para sempre.
    update public.material set in_stock = in_stock + v_qtd where id = old.material_id;
    return old;
  end if;

  return null;
end;
$$;

comment on function private.tg_apply_material_stock() is
  'Dá baixa em material.in_stock quando um consumo é registrado no procedimento, '
  'e devolve quando o consumo é apagado. `quantity` é TEXTO livre ("2 tubetes"): '
  'lê o número do início e ignora o resto; sem número legível não mexe no estoque.';

revoke execute on function private.tg_apply_material_stock() from public;

drop trigger if exists tr_material_stock on public.treatment_session_material;
create trigger tr_material_stock
  after insert or delete on public.treatment_session_material
  for each row execute function private.tg_apply_material_stock();


-- 3 · Leitura que a assistente de voz consome.
--
-- Uma RPC em vez de três consultas do cliente (material → vínculo → fornecedor)
-- porque a resposta é FALADA: três idas ao banco colocam latência no meio da
-- frase. Aqui é um round-trip só, já no formato da fala — inclusive com
-- `acabando` pré-calculado, para ela não ter que comparar número enquanto fala.
create or replace function public.materials_with_suppliers()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_agg(x order by x->>'nome'), '[]'::jsonb)
    from (
      select jsonb_build_object(
               'id',          m.id,
               'nome',        m.name,
               'estoque',     m.in_stock,
               'minimo',      m.min_quantity,
               'acabando',    m.in_stock <= m.min_quantity,
               'validade',    m.expiry_date,
               'observacoes', m.notes,
               'fornecedores', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'id', s.id, 'nome', s.name, 'email', s.email,
                          'whatsapp', s.whatsapp, 'telefone', s.phone
                        ) order by s.name)
                   from public.material_supplier ms
                   join public.supplier s on s.id = ms.supplier_id
                  where ms.material_id = m.id
               ), '[]'::jsonb)
             ) as x
        from public.material m
    ) t;
$$;

comment on function public.materials_with_suppliers() is
  'Materiais da clínica com estoque, mínimo, flag "acabando" e os fornecedores '
  '(com e-mail e WhatsApp). Uma leitura só, no formato que a assistente de voz fala.';

revoke execute on function public.materials_with_suppliers() from public, anon;
grant execute on function public.materials_with_suppliers() to authenticated;
