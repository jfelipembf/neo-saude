-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — PÁGINA "HOJE" (feature própria, módulo básico)
--
-- Alguns colaboradores (ex.: recepção) não têm acesso ao Dashboard mas
-- precisam de uma visão rápida do movimento do dia — 4 quadrados contando as
-- consultas de hoje por status (Agendados/Confirmados/Presentes/Ausentes).
--
-- Feature própria (não é negação de 'dashboard'): o pedido foi "ALGUNS
-- colaboradores sem dashboard", não "todo mundo sem dashboard" — cargo por
-- cargo, como o resto do sistema já funciona (allow-list, nunca negação).
-- ═════════════════════════════════════════════════════════════════════════════

insert into public.feature (key, label, category, is_addon, sort_order) values
  ('today', 'Hoje', 'module', false, 15);  -- entre dashboard(10) e schedule(20)

-- Módulo básico, mesmo nível de 'dashboard' — os 3 planos concedem. O
-- INSERT...SELECT do enterprise ("tudo que existir no catálogo") já rodou no
-- passado, na fundação; não pega retroativamente uma feature nova.
insert into public.plan_feature (plan_key, feature_key) values
  ('starter', 'today'),
  ('professional', 'today'),
  ('enterprise', 'today');

-- Backfill: cargo "Administrador" (is_system=true) de toda clínica JÁ
-- EXISTENTE ganha a feature nova automaticamente — é o mesmo invariante que
-- o onboarding garante pra clínica nova ("dono sempre traz as features
-- todas", ver comentário em SessionProvider.tsx). Sem isto, nem o dono
-- enxergaria "Hoje" até ligar manualmente em Cargos.
insert into public.access_profile_permission (clinic_id, access_profile_id, feature_key, can_view, can_edit)
select ap.clinic_id, ap.id, 'today', true, true
  from public.access_profile ap
 where ap.is_system;
