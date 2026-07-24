-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — CONSULTA DE FISIOTERAPIA EXIGE PACOTE COM SALDO
--
-- Até aqui dava para agendar uma consulta para um paciente que nunca comprou
-- nada: tg_debit_entitlement começa com `if new.entitlement_id is null then
-- return new` — ou seja, só conferia saldo QUANDO um pacote era anexado. Sem
-- pacote (a antiga "sessão avulsa"), passava direto. A coluna é nulável e não
-- havia nenhum outro trigger ou CHECK cobrindo o caso.
--
-- Isso também deixava a casa com duas regras para a mesma coisa: matrícula em
-- turma JÁ exigia pacote ativo (ver class_group_enrollment + isEntitlementActive
-- no front), mas consulta individual não exigia nada.
--
-- ⚠️ ESCOPO: SÓ FISIOTERAPIA. Pacote/plano de sessões é o modelo de venda da
-- fisioterapia; odontologia fatura por procedimento (treatment/quote) e as
-- consultas dela nascem legitimamente com entitlement_id nulo. Uma trava global
-- pararia a agenda da clínica de odontologia inteira.
--
-- ⚠️ SÓ NO INSERT. Consulta que já existe com entitlement_id nulo (criada antes
-- desta regra) continua editável — inclusive para marcar presença/falta. Barrar
-- o UPDATE deixaria histórico preso, sem forma de resolver pela tela.
--
-- ── Vazamento no DELETE (achado no mesmo teste) ──────────────────────────────
-- O trigger cobria INSERT e UPDATE OF status, mas não DELETE: apagar uma
-- consulta que reservou sessão deixava scheduled_sessions incrementado para
-- sempre, comendo saldo do paciente sem nenhuma consulta correspondente — e
-- sem forma de corrigir pela tela. O app nunca deleta consulta (cancela por
-- status, que o trigger trata), mas o GRANT DELETE e a policy appointment_delete
-- existem, então o caminho é alcançável direto pelo PostgREST. Passa a devolver
-- a sessão ao balde certo conforme o status em que a consulta estava.
--
-- Depende de: 20260724150000_sales_and_entitlements.sql (tg_debit_entitlement).
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function private.tg_debit_entitlement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining  integer;
  v_specialty  public.clinic_specialty;
begin
  -- DELETE: devolve a sessão. Consulta cancelada já tinha sido devolvida no
  -- UPDATE que a cancelou, então aqui ela não mexe em nada.
  if tg_op = 'DELETE' then
    if old.entitlement_id is not null then
      if old.status in ('completed', 'no_show') then
        update public.patient_service_entitlement
           set used_sessions = used_sessions - 1
         where id = old.entitlement_id;
      elsif old.status <> 'canceled' then
        update public.patient_service_entitlement
           set scheduled_sessions = scheduled_sessions - 1
         where id = old.entitlement_id;
      end if;
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if new.entitlement_id is null then
      -- Fisioterapia: consulta sem pacote não entra. O paciente precisa ter uma
      -- venda de pacote/plano com saldo (Ponto de Venda) antes de ocupar a agenda.
      select specialty into v_specialty
        from public.clinic where id = new.clinic_id;

      if v_specialty = 'physiotherapy' then
        raise exception
          'Este paciente não tem pacote com sessões disponíveis. Registre a venda no Ponto de Venda antes de agendar.'
          using errcode = 'P0001';
      end if;

      -- Demais ramos (odontologia etc.): não usam pacote, segue em frente.
      return new;
    end if;

    select total_sessions - used_sessions - scheduled_sessions
      into v_remaining
      from public.patient_service_entitlement
     where id = new.entitlement_id and clinic_id = new.clinic_id
       for update;
    if v_remaining is null then
      raise exception 'Pacote não encontrado.' using errcode = '23503';
    end if;
    if v_remaining <= 0 then
      raise exception 'O paciente não tem sessões disponíveis neste pacote.' using errcode = 'P0001';
    end if;

    update public.patient_service_entitlement
       set scheduled_sessions = scheduled_sessions + 1
     where id = new.entitlement_id;

    -- Consulta que já nasce resolvida (importação/ajuste manual): passa
    -- direto de "reservada" pro estado final, sem ficar pendurada.
    if new.status in ('completed', 'no_show') then
      update public.patient_service_entitlement
         set scheduled_sessions = scheduled_sessions - 1, used_sessions = used_sessions + 1
       where id = new.entitlement_id;
    elsif new.status = 'canceled' then
      update public.patient_service_entitlement
         set scheduled_sessions = scheduled_sessions - 1
       where id = new.entitlement_id;
    end if;

    return new;
  end if;

  -- UPDATE OF status: entitlement_id é imutável pro client (sem GRANT de
  -- update nessa coluna), então old.entitlement_id = new.entitlement_id aqui.
  if new.entitlement_id is not null and new.status is distinct from old.status then
    -- Reabrindo uma sessão já resolvida (completed/no_show → outra coisa):
    -- devolve pro balde "reservada".
    if old.status in ('completed', 'no_show') and new.status not in ('completed', 'no_show') then
      update public.patient_service_entitlement
         set used_sessions = used_sessions - 1, scheduled_sessions = scheduled_sessions + 1
       where id = new.entitlement_id;
    -- Reabrindo uma cancelada: reserva de novo — com checagem de saldo, o
    -- pacote pode ter se esgotado ou vencido nesse meio-tempo.
    elsif old.status = 'canceled' and new.status <> 'canceled' then
      select total_sessions - used_sessions - scheduled_sessions
        into v_remaining
        from public.patient_service_entitlement
       where id = new.entitlement_id
         for update;
      if v_remaining <= 0 then
        raise exception 'O paciente não tem sessões disponíveis neste pacote.' using errcode = 'P0001';
      end if;
      update public.patient_service_entitlement
         set scheduled_sessions = scheduled_sessions + 1
       where id = new.entitlement_id;
    end if;

    -- A partir do estado "reservada" (garantido pelos dois ramos acima, ou já
    -- era o caso), resolve pro novo status final.
    if new.status in ('completed', 'no_show') and old.status not in ('completed', 'no_show') then
      update public.patient_service_entitlement
         set scheduled_sessions = scheduled_sessions - 1, used_sessions = used_sessions + 1
       where id = new.entitlement_id;
    elsif new.status = 'canceled' and old.status <> 'canceled' then
      update public.patient_service_entitlement
         set scheduled_sessions = scheduled_sessions - 1
       where id = new.entitlement_id;
    end if;
  end if;

  return new;
end;
$$;

-- O trigger passa a cobrir DELETE — antes era só INSERT/UPDATE OF status.
drop trigger if exists tr_debit_entitlement on public.appointment;
create trigger tr_debit_entitlement
  before insert or delete or update of status on public.appointment
  for each row execute function private.tg_debit_entitlement();

comment on function private.tg_debit_entitlement() is
  'Débito/devolução de sessão do pacote conforme o status da consulta (INSERT, '
  'UPDATE OF status e DELETE), E a regra de entrada: em clínica de FISIOTERAPIA, '
  'consulta sem entitlement_id é recusada no INSERT (pacote com saldo é '
  'pré-requisito para ocupar a agenda). Outros ramos faturam por procedimento e '
  'seguem aceitando consulta sem pacote.';

-- ── Reconciliação: zera divergências acumuladas antes do ramo de DELETE ──────
-- Recalcula a partir das consultas que realmente existem, em vez de somar/subtrair
-- às cegas: se um saldo já estava torto por outro motivo, isto conserta junto.
update public.patient_service_entitlement e
   set used_sessions = (
         select count(*) from public.appointment a
          where a.entitlement_id = e.id and a.status in ('completed', 'no_show')),
       scheduled_sessions = (
         select count(*) from public.appointment a
          where a.entitlement_id = e.id and a.status not in ('completed', 'no_show', 'canceled'))
 where e.used_sessions <> (
         select count(*) from public.appointment a
          where a.entitlement_id = e.id and a.status in ('completed', 'no_show'))
    or e.scheduled_sessions <> (
         select count(*) from public.appointment a
          where a.entitlement_id = e.id and a.status not in ('completed', 'no_show', 'canceled'));
