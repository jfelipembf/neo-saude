-- RESUMO CLINICO DO PACIENTE — leitura enxuta para a assistente de voz.
--
-- Por que nao usar patient_treatments: ela devolve o prontuario INTEIRO, com o
-- payload do odontograma de CADA sessao (~31 KB por sessao, mesmo de boca
-- vazia) e o campo `notes`, que hoje carrega a transcricao completa do ditado —
-- incluindo fala do PACIENTE. Dez atendimentos ≈ 320 KB numa resposta so, dos
-- quais quase tudo e inutil para falar, e parte e dado sensivel que nao deveria
-- entrar no contexto do modelo sem necessidade.
--
-- Por que NAO e um campo salvo: resumo clinico denormalizado envelhece. Todo
-- caminho de escrita (procedimento, consulta, lembrete) teria de atualiza-lo, e
-- o primeiro que esquecesse faria a assistente afirmar com seguranca algo que
-- deixou de ser verdade. Aqui e calculado na hora — uma consulta indexada e
-- barata, e sempre correta.
create or replace function public.patient_clinical_summary(
  p_patient uuid,
  p_limit   integer default 5
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'paciente', (
      select jsonb_build_object(
               'nome', p.name,
               'nomeComum', p.common_name,
               'codigo', p.code,
               'ultimaVisita', p.last_visit
             )
        from public.patient p where p.id = p_patient
    ),
    -- Ultimos atendimentos: so o que se fala em voz alta (data, o que foi feito
    -- e os dentes tocados). Sem odontograma, sem transcricao.
    'ultimosAtendimentos', coalesce((
      select jsonb_agg(x order by x->>'data' desc)
        from (
          select jsonb_build_object(
                   'data', ts.performed_on,
                   'descricao', ts.description,
                   'tratamento', t.procedure,
                   'dentes', coalesce((
                     select jsonb_agg(d.tooth_fdi order by d.tooth_fdi)
                       from public.treatment_session_tooth d where d.session_id = ts.id
                   ), '[]'::jsonb),
                   'achados', coalesce((
                     select jsonb_agg(a.description order by a.sort_order)
                       from public.treatment_session_action a where a.session_id = ts.id
                   ), '[]'::jsonb),
                   'materiais', coalesce((
                     select jsonb_agg(m.name || ' (' || m.quantity || ')' order by m.sort_order)
                       from public.treatment_session_material m where m.session_id = ts.id
                   ), '[]'::jsonb)
                 ) as x
            from public.treatment_session ts
            join public.treatment t on t.id = ts.treatment_id
           where t.patient_id = p_patient
           order by ts.performed_on desc, ts.created_at desc
           limit greatest(1, least(p_limit, 20))
        ) s
    ), '[]'::jsonb),
    -- Documentos emitidos (receita, atestado, pedido de exame) — o dentista
    -- pergunta "ja passei antibiotico pra ela?".
    'documentos', coalesce((
      select jsonb_agg(jsonb_build_object(
               'data', pr.issued_on, 'tipo', pr.type, 'titulo', pr.title, 'numero', pr.code
             ) order by pr.issued_on desc)
        from public.prescription pr
       where pr.patient_id = p_patient
         and pr.issued_on >= current_date - interval '180 days'
    ), '[]'::jsonb)
  );
$$;

comment on function public.patient_clinical_summary(uuid, integer) is
  'Resumo clinico enxuto do paciente para a assistente de voz: ultimos atendimentos (data, descricao, dentes, achados, materiais) e documentos emitidos. Calculado na hora — nao e campo salvo, para nao envelhecer. NAO inclui o snapshot do odontograma nem a transcricao do ditado (peso e dado sensivel).';

revoke execute on function public.patient_clinical_summary(uuid, integer) from public, anon;
grant execute on function public.patient_clinical_summary(uuid, integer) to authenticated;
