-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — MATRÍCULA EM TURMA EXIGE PACOTE/PLANO ATIVO
--
-- Matricular (perfil do paciente → botão "Matricular") só é permitido quando
-- o paciente tem um patient_service_entitlement ativo (pacote de sessões OU
-- plano/contrato comum — os dois viram entitlement no checkout_sale, a
-- diferença de modality não importa aqui). entitlement_id registra QUAL
-- compra originou a matrícula (auditoria/exibição); a VIGÊNCIA em si (usada
-- pra decidir se a matrícula ainda conta pra lotação/roster) é calculada na
-- leitura sobre TODAS as entitlements do paciente — ver comentário completo
-- em classGroupRosterService.ts: comprar um pacote/plano NOVO (renovação)
-- já mantém a matrícula valendo, sem precisar recriar a linha.
--
-- 0 linhas em class_group_enrollment até aqui (feature nova, sem uso real
-- ainda) — column entra direto NOT NULL, sem passo de backfill.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.class_group_enrollment
  add column entitlement_id uuid;

alter table public.class_group_enrollment
  alter column entitlement_id set not null;

alter table public.class_group_enrollment
  add constraint class_group_enrollment_entitlement_fk
    foreign key (entitlement_id, clinic_id) references public.patient_service_entitlement(id, clinic_id)
    on delete cascade;

comment on column public.class_group_enrollment.entitlement_id is
  'Pacote/plano que originou esta matrícula (auditoria/exibição: "matriculado '
  'via Pilates Mensal"). A vigência efetiva da matrícula NÃO se limita a esta '
  'entitlement específica — é calculada sobre TODAS as entitlements do '
  'paciente na leitura (ver classGroupRosterService.ts), pra uma renovação '
  '(comprar outro pacote/plano) manter a matrícula valendo sem recriar a linha.';
