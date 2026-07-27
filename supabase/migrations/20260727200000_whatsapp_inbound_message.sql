-- MENSAGEM RECEBIDA NO WHATSAPP DA CLINICA — notificacao persistente.
--
-- Ate agora enviar_mensagem_paciente (Cibelly) e via de MAO UNICA: se o
-- paciente responder, ninguem no app fica sabendo. O webhook da Evolution API
-- so tratava eventos de CONEXAO (CONNECTION_UPDATE, QRCODE_UPDATED) — esta
-- tabela e o destino do novo evento MESSAGES_UPSERT (ver evolution-webhook).
--
-- Molde copiado de public.patient_reminder: FK composta, revoke antes dos
-- grants, tr_touch. Diferencas deliberadas:
--  · patient_id e NULLABLE: o remetente pode nao bater com nenhum paciente
--    cadastrado (numero desconhecido) e a mensagem ainda precisa aparecer.
--  · sender_name vem DENORMALIZADO na propria linha: o payload que chega via
--    Realtime (postgres_changes) e um snapshot da linha, sem JOIN nenhum —
--    sem isso o frontend teria que buscar o nome do paciente à parte.
--  · Sem tr_audit: nao existe DELETE nesta tabela (descartar e UPDATE
--    dismissed=true, o historico fica), e o volume de mensagem recebida
--    tende a ser maior que o de lembrete escrito por humano — auditar o
--    "ack" de descarte custa mais do que protege.
--  · Descarte e GLOBAL (uma coluna dismissed, nao por usuario): cobre o caso
--    comum (uma pessoa trata, os outros nao precisam tratar de novo). Por
--    usuario seria tabela de juncao — migration futura, se um dia precisar.
create table public.whatsapp_inbound_message (
  id                   uuid primary key default gen_random_uuid(),
  clinic_id            uuid not null references public.clinic(id) on delete cascade,
  patient_id           uuid,
  sender_phone         public.phone_digits not null,
  sender_name          text,
  body                 text not null,
  -- key.id da Evolution/Baileys — dedupe de retry de webhook (ver indice
  -- unico abaixo e o tratamento de conflito 23505 no evolution-webhook).
  provider_message_id  text,
  dismissed            boolean not null default false,
  dismissed_at         timestamptz,
  updated_by           uuid references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint whatsapp_inbound_message_body_ck check (btrim(body) <> ''),
  constraint whatsapp_inbound_message_patient_fk
    foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id) on delete cascade
);

comment on table public.whatsapp_inbound_message is
  'Mensagem recebida no WhatsApp da clinica (resposta do paciente a um envio da Cibelly, ou contato espontaneo). Aparece como notificacao persistente no app ate ser descartada.';

comment on column public.whatsapp_inbound_message.patient_id is
  'NULL quando o numero remetente nao bate com nenhum paciente cadastrado — a mensagem ainda aparece, rotulada pelo telefone.';

comment on column public.whatsapp_inbound_message.sender_name is
  'Denormalizado de proposito: o snapshot de Realtime (postgres_changes) nao faz JOIN.';

-- Retry de webhook nao pode duplicar a mesma mensagem como duas notificacoes.
create unique index whatsapp_inbound_message_dedupe_uk
  on public.whatsapp_inbound_message (clinic_id, provider_message_id)
  where provider_message_id is not null;

-- Leitura quente: "as nao descartadas desta clinica, mais recentes primeiro".
create index whatsapp_inbound_message_open_idx
  on public.whatsapp_inbound_message (clinic_id, created_at desc)
  where dismissed = false;

create trigger tr_touch before update on public.whatsapp_inbound_message
  for each row execute function private.tg_touch_updated_at();

create trigger tr_stamp_updated_by before insert or update on public.whatsapp_inbound_message
  for each row execute function private.tg_stamp_updated_by();

alter table public.whatsapp_inbound_message enable row level security;

create policy whatsapp_inbound_message_select on public.whatsapp_inbound_message
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'whatsapp')
  );

create policy whatsapp_inbound_message_update on public.whatsapp_inbound_message
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'whatsapp')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

-- Sem policy de insert/delete para authenticated: so o webhook (service role,
-- ignora RLS) insere; descartar e UPDATE (dismissed=true), nunca DELETE — o
-- historico fica.

revoke all on public.whatsapp_inbound_message from anon, authenticated;

grant select on public.whatsapp_inbound_message to authenticated;
grant update (dismissed, dismissed_at) on public.whatsapp_inbound_message to authenticated;

-- Realtime: nenhuma tabela do projeto usa postgres_changes hoje — sem entrar
-- na publicacao, a notificacao so apareceria num F5.
alter publication supabase_realtime add table public.whatsapp_inbound_message;
