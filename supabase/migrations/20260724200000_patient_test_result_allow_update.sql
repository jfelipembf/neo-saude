-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — PERMITE EDITAR UM RESULTADO JÁ REGISTRADO (patient_test_result)
--
-- Reverte a imutabilidade original da tabela ("só entra no INSERT, sem
-- UPDATE") — o fisioterapeuta pode corrigir um resultado lançado errado
-- (nível, data, ângulo, foto/pontos da medição) em vez de precisar apagar e
-- recriar. clinic_id/patient_id/test_id/professional_id/created_at
-- continuam imutáveis (identidade do registro e autoria original) — só o
-- CONTEÚDO da aplicação é editável.
-- ═════════════════════════════════════════════════════════════════════════════

grant update (level_id, level_name, level_description, performed_at, measured_angle, image_url, measured_points)
  on public.patient_test_result to authenticated;

create policy patient_test_result_update on public.patient_test_result
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );
