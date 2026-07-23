-- ─────────────────────────────────────────────────────────────────────────────
-- E-mail do contato: o botão "Novo contato" do Kanban de leads captura nome,
-- sobrenome, e-mail, telefone e interesse — mas public.lead só tinha nome e
-- telefone. Mesmo domínio de public.patient.email (validação mínima de
-- formato, não normaliza caixa). Nulável: nem todo lead chega com e-mail no
-- primeiro contato.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.lead
  add column if not exists email public.email_address;

comment on column public.lead.email is
  'E-mail do contato, informado no cadastro manual (botão "Novo contato" do '
  'Kanban). Nulável — nem todo lead chega com e-mail.';

-- Listas de coluna existentes (padrão do schema) precisam da coluna nova.
revoke insert on public.lead from anon, authenticated;
grant insert (id, clinic_id, name, phone, source, interest, status, patient_id, notes, email)
  on public.lead to authenticated;

revoke update on public.lead from anon, authenticated;
grant update (name, phone, source, interest, status, patient_id, notes, email)
  on public.lead to authenticated;
