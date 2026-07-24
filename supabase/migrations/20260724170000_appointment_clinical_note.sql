-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — PRONTUÁRIO POR SESSÃO (fisioterapia)
--
-- Anotação clínica rica (fonte/cor/alinhamento) de UMA sessão específica —
-- diferente do Prontuário genérico de Prescrições (prescription, por
-- paciente, texto puro, sem ligação com consulta nenhuma; continua existindo
-- do jeito que está). Mora na PRÓPRIA appointment, 1:1, mesmo raciocínio da
-- coluna appointment.notes que já existe (só que essa é rica e clínica, não
-- observação de agenda).
--
-- Anexo de imagem reaproveita patient_document (bucket patient-documents,
-- documentsService.ts) — ganha só um FK opcional pra sessão. NULL continua
-- sendo "documento geral do paciente" (Documentos do perfil, sem mudança de
-- comportamento); preenchido = anexo desta sessão (aba Prontuários calendário).
--
-- Depende de: 20260722120200_patients (patient_document),
--             20260722120400_schedule (appointment).
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.appointment add column clinical_note_html text;

comment on column public.appointment.clinical_note_html is
  'Prontuário da SESSÃO — HTML rico (fonte, cor, alinhamento), sanitizado no '
  'cliente antes de gravar E antes de exibir (DOMPurify — primeiro campo do '
  'app a guardar HTML de usuário). NULL = sessão sem anotação ainda. Não '
  'confundir com appointment.notes (observação simples de agenda) nem com '
  'prescription (Prontuário genérico por paciente, em Prescrições).';

grant update (clinical_note_html) on public.appointment to authenticated;

alter table public.patient_document add column appointment_id uuid;

comment on column public.patient_document.appointment_id is
  'NULL = documento geral do paciente (aba Documentos, comportamento de '
  'sempre). Preenchido = anexo do prontuário desta SESSÃO específica (aba '
  'Prontuários do perfil). Imutável depois de enviado — sem GRANT de update '
  'nesta coluna, mesmo padrão de appointment.entitlement_id.';

alter table public.patient_document add constraint patient_document_appointment_fk
  foreign key (appointment_id, clinic_id)
  references public.appointment(id, clinic_id) on delete cascade;

-- Só entra no INSERT — imutável depois (mover um anexo de sessão não é
-- operação suportada).
grant insert (appointment_id) on public.patient_document to authenticated;
