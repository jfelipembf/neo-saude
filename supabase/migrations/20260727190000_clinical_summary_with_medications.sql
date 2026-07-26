-- O resumo dizia QUE um receituario foi emitido, mas nao O QUE foi prescrito —
-- entao "qual medicacao a gente passou da ultima vez?" ficava sem resposta, que
-- e justamente a pergunta que se faz. Agora os documentos trazem os
-- medicamentos (nome, posologia, quantidade) e o corpo do texto, que e onde
-- moram as orientacoes do receituario, o texto do atestado e o pedido de exame.
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
               'nome', p.name, 'nomeComum', p.common_name,
               'codigo', p.code, 'ultimaVisita', p.last_visit
             )
        from public.patient p where p.id = p_patient
    ),
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
    'documentos', coalesce((
      select jsonb_agg(jsonb_build_object(
               'data', pr.issued_on, 'tipo', pr.type, 'titulo', pr.title, 'numero', pr.code,
               -- O CONTEUDO, que faltava: sem ele o resumo dizia que existia um
               -- receituario mas nao qual remedio.
               'medicamentos', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'nome', pm.name, 'posologia', pm.dosage, 'quantidade', pm.quantity
                        ) order by pm.sort_order)
                   from public.prescription_medication pm
                  where pm.prescription_id = pr.id
               ), '[]'::jsonb),
               'texto', pr.body
             ) order by pr.issued_on desc)
        from public.prescription pr
       where pr.patient_id = p_patient
         and pr.issued_on >= current_date - interval '180 days'
    ), '[]'::jsonb)
  );
$$;

comment on function public.patient_clinical_summary(uuid, integer) is
  'Resumo clinico enxuto do paciente para a assistente de voz: ultimos atendimentos (data, descricao, dentes, achados, materiais) e documentos emitidos COM o conteudo (medicamentos e texto). Calculado na hora — nao e campo salvo, para nao envelhecer. NAO inclui o snapshot do odontograma nem a transcricao do ditado (peso e dado sensivel).';
