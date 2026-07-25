-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — RESPOSTA DE ITEM: option_id NÃO PODE FICAR APONTANDO PARA O VAZIO
--
-- Achado testando 20260725190000: apagar um ITEM do catálogo deixa a resposta
-- com option_id apontando para uma opção que não existe mais.
--
-- Por quê: as duas FKs da resposta são compostas e MATCH SIMPLE.
--   • (item_id, test_id) → physio_test_item, ON DELETE SET NULL (item_id);
--   • (option_id, item_id) → physio_test_item_option, ON DELETE SET NULL (option_id).
-- Apagar o item dispara as duas coisas ao mesmo tempo: a primeira zera item_id,
-- e a cascata do item apaga as opções dele. Só que a ação da SEGUNDA procura a
-- linha por `option_id = <apagada> AND item_id = <dono>` — e item_id já é NULL.
-- Não casa, nada é zerado, e a linha fica com um option_id órfão. A FK não
-- reclama (em MATCH SIMPLE, coluna NULL no par satisfaz a restrição), então o
-- banco fica calado com um ponteiro para lugar nenhum dentro do prontuário.
--
-- O texto congelado sobreviveu — que era o objetivo do SET NULL —, mas um id
-- órfão é pior que um id nulo: nulo diz "o catálogo mudou"; órfão convida a
-- próxima consulta a dar join e concluir que a opção sumiu do sistema.
--
-- Correção: uma FK SIMPLES em option_id, que casa só pelo id e por isso zera
-- mesmo quando item_id já caiu. A composta CONTINUA — é ela que garante, na
-- gravação, que a opção pertence ao item (e, por tabela, à clínica certa); a
-- simples só cuida da limpeza quando o catálogo é apagado.
--
-- Depende de: 20260725190000_physio_test_item_engine.sql.
-- ═════════════════════════════════════════════════════════════════════════════

-- Zera o que já ficou órfão antes de a restrição existir (senão o ADD falha na
-- validação — e é exatamente esse o estado que esta migration vem consertar).
update public.patient_test_result_item ri
   set option_id = null
 where ri.option_id is not null
   and not exists (
     select 1 from public.physio_test_item_option o where o.id = ri.option_id
   );

alter table public.patient_test_result_item
  add constraint patient_test_result_item_option_orphan_fk
    foreign key (option_id) references public.physio_test_item_option(id)
    on delete set null;

comment on constraint patient_test_result_item_option_orphan_fk
  on public.patient_test_result_item is
  'Companheira da FK composta (option_id, item_id): casa só pelo id, então zera '
  'option_id mesmo quando item_id já foi anulado pela remoção do item — sem ela '
  'a resposta fica com ponteiro para uma opção apagada.';
