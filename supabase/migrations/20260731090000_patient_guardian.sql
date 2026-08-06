-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — RESPONSÁVEL (auto-referência em patient)
--
-- Hoje não existe nenhuma noção de responsável/tutor: o contorno usado era
-- digitar o MESMO telefone/WhatsApp do pai/mãe no cadastro de cada filho —
-- o que quebra a atribuição de mensagem de WhatsApp recebida (o webhook busca
-- o paciente por `.eq('whatsapp', telefone).maybeSingle()`, e com dois
-- pacientes no mesmo número essa consulta devolve ERRO, não uma linha; o erro
-- era descartado em silêncio e a mensagem entrava como remetente
-- desconhecido — ver fix em supabase/functions/evolution-webhook).
--
-- MODELO: auto-referência simples (um responsável, N pacientes-filho), não
-- uma tabela de relação — um paciente tem NO MÁXIMO um responsável ao mesmo
-- tempo (não é grafo, é árvore de um nível), e o responsável PODE ser, ele
-- mesmo, um cadastro de paciente da mesma clínica (decisão do dono: às vezes
-- o pai também é atendido ali).
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.patient add column guardian_patient_id uuid;

-- Não pode ser responsável por si mesmo. `is distinct from` (não `<>`) para
-- deixar NULL passar — é o caso comum (paciente responde por si).
alter table public.patient
  add constraint patient_guardian_not_self_ck check (guardian_patient_id is distinct from id);

-- FK COMPOSTA contra (id, clinic_id): impede escolher responsável de OUTRA
-- clínica — checagem que roda no servidor, sem depender da RLS. `SET NULL`
-- na exclusão: apagar o cadastro do responsável não pode apagar (nem travar)
-- o cadastro dos filhos, só solta o vínculo.
alter table public.patient
  add constraint patient_guardian_fk
  foreign key (guardian_patient_id, clinic_id)
  references public.patient (id, clinic_id)
  on delete set null;

comment on column public.patient.guardian_patient_id is
  'Responsável (pai/mãe/tutor) — outro paciente da MESMA clínica, quando ele '
  'também tem cadastro. Um responsável pode ter vários pacientes apontando '
  'para ele (1 responsável : N filhos). NULL = paciente responde por si.';

-- Índice parcial: só quem TEM responsável entra — a maioria dos pacientes não
-- tem, e indexar NULL não ajuda consulta nenhuma.
create index patient_guardian_idx on public.patient (guardian_patient_id) where guardian_patient_id is not null;

-- Coluna nova — GRANT próprio, não herda o das outras (ver histórico desta
-- sessão: toda tabela pré-existente precisa da coluna nova listada aqui, o
-- ALTER TABLE sozinho não basta).
grant update (guardian_patient_id) on public.patient to authenticated;
