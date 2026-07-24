-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — TURMAS: UM DIA DA SEMANA = UMA SESSÃO INDEPENDENTE
--
-- class_group.weekdays (array) virava uma turma "guarda-chuva" cobrindo vários
-- dias com a MESMA matrícula/lotação pros dois — um paciente que queria só a
-- terça acabava contando pra vaga (e pro limite semanal do contrato) da
-- quinta também, e não dava pra matricular só num dos dias. Cada dia agora é
-- a própria linha em class_group (mesmo nome/profissional/sala/horário se
-- nascerem juntos na Tab Turmas, mas capacidade e matrícula 100% independentes
-- — class_group_enrollment/attendance já eram por class_group_id+data, então
-- não mudam de forma nenhuma).
--
-- Dado existente: turma(s) com mais de um dia viram N linhas (uma por dia). A
-- linha original MANTÉM o id (preserva matrícula/frequência já gravadas) e
-- fica com o PRIMEIRO dia do array; os demais dias nascem como sessões novas,
-- sem matrícula (o vínculo antigo não sabia "para qual dia" o paciente
-- queria — plataforma em fase de desenvolvimento, sem uso em produção ainda).
--
-- Depende de: 20260724220000_class_group_catalog.sql.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.class_group add column weekday smallint;

update public.class_group set weekday = weekdays[1];

-- As linhas novas (uma por dia extra) não preenchem `weekdays` — ele já está
-- de saída, cai já na linha seguinte.
alter table public.class_group alter column weekdays drop not null;

insert into public.class_group
  (clinic_id, name, professional_id, room_id, weekday, start_time, duration_minutes, max_capacity, start_date, end_date)
select clinic_id, name, professional_id, room_id, unnest(weekdays[2:cardinality(weekdays)]),
       start_time, duration_minutes, max_capacity, start_date, end_date
from public.class_group
where cardinality(weekdays) > 1;

alter table public.class_group alter column weekday set not null;
alter table public.class_group add constraint class_group_weekday_range_ck check (weekday between 0 and 6);

alter table public.class_group drop constraint class_group_weekdays_not_empty_ck;
alter table public.class_group drop constraint class_group_weekdays_range_ck;
alter table public.class_group drop column weekdays;

comment on column public.class_group.weekday is
  'Dia da semana em que ESTA sessão acontece, 0=Dom…6=Sáb — uma turma com '
  'aulas em dois dias vira DUAS linhas (uma por dia), cada uma com sua '
  'própria capacidade/matrícula (ver class_group_enrollment).';

comment on table public.class_group is
  'Uma sessão semanal recorrente de turma coletiva (domain.ts ClassGroup) — '
  'Administrativo → Turmas. Um dia da semana = uma linha independente '
  '(capacidade e matrícula não são compartilhadas entre dias).';

-- ── Privilégios de coluna: troca weekdays → weekday na lista editável ─────────
grant update (name, professional_id, room_id, weekday, start_time, duration_minutes, max_capacity, start_date, end_date)
  on public.class_group to authenticated;
