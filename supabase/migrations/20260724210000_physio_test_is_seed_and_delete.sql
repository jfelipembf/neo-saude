-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — EXCLUIR TESTE DO CATÁLOGO (só os PERSONALIZADOS)
--
-- physio_test nunca teve DELETE ("um teste já usado no histórico não pode
-- sumir do catálogo por baixo" — patient_test_test_fk/patient_test_result_test_fk
-- são on delete restrict/no action, então isso continua garantido pelo banco).
-- Agora a clínica pode excluir um teste PERSONALIZADO (criado por ela) — os
-- testes de referência que vieram prontos no sistema (seed) continuam
-- protegidos. A distinção é is_seed, aplicada na própria RLS policy (a
-- parede real), não só escondida na tela.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.physio_test
  add column is_seed boolean not null default false;

comment on column public.physio_test.is_seed is
  'true = teste de referência que veio pronto no sistema (seed) — não pode '
  'ser excluído pela clínica, só editado. false = teste personalizado '
  'cadastrado pela própria clínica, que pode ser excluído (se ainda não '
  'tiver sido aplicado a nenhum paciente — a FK bloqueia isso).';

-- Todo teste já cadastrado até aqui veio do seed desta sessão, não de uma
-- clínica cadastrando pela tela — marca os existentes.
update public.physio_test set is_seed = true;

grant delete on public.physio_test to authenticated;

create policy physio_test_delete on public.physio_test
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
    and is_seed = false
  );
