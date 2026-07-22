-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — 07 · COMERCIAL (leads e orçamentos)
--
-- Fatia: Lead, Quote, QuoteItem (src/types/domain.ts).
--
-- ── DEPENDE DE ───────────────────────────────────────────────────────────────
--   01-fundacao.sql      : clinic, profile, counter/next_code, tg_audit,
--                          tg_touch_updated_at, private.auth_clinic_ids,
--                          can_access_feature/can_edit_feature, domínios
--                          money_brl/phone_digits/email_address
--   02-cadastros.sql     : public.insurance(id, clinic_id) [insurance_id_clinic_uk]
--   03-pacientes.sql     : public.patient(id, clinic_id)   [patient_id_clinic_uk]
--   04-profissionais.sql : public.professional(id, clinic_id)
--                          [professional_id_clinic_uk]
--
-- ── É DEPENDÊNCIA DE ─────────────────────────────────────────────────────────
--   08-financeiro.sql : receivable.quote_id → public.quote(id, clinic_id)
--                       [quote_id_clinic_uk, criado na seção 3 deste arquivo]
--   Por isso este arquivo roda ANTES do financeiro, e não depois.
--
-- NOTA DE CONSOLIDAÇÃO: `insurance` e `material` nasciam aqui e foram movidas
-- para 02-cadastros.sql. Elas dependiam só de `clinic` e eram consumidas por
-- fatias ANTERIORES (paciente, agenda, prontuário) — mantê-las aqui tornava o
-- conjunto inexecutável em qualquer ordem. O recorte foi mecânico; nenhuma
-- definição mudou.
--
-- O ARCO DESTA FATIA — como o dinheiro entra no sistema:
--
--   lead  ──(converte)──▶  patient  ──▶  quote (ORC-000001)
--                                          │ 1—N
--                                          ▼
--                                      quote_item  (dentes FDI, faces, valor)
--                                          │
--                          (aprovação)     ▼
--                                      receivable (CTR-…, N parcelas)
--
-- O orçamento é o ATO COMERCIAL; as parcelas em `receivable` são o que se
-- cobra. Por decisão de escopo, a geração das parcelas continua no app
-- (services/quotesService.ts → approveQuote) — o banco só garante a AMARRAÇÃO
-- (receivable.quote_id, declarada em 08-financeiro.sql) e a coerência do total.
-- ═════════════════════════════════════════════════════════════════════════════



-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · ENUMS DA FATIA
--
-- Só nascem aqui os enums que não atravessam fatias. Valores IDÊNTICOS aos
-- literais do domain.ts — nada traduzido, nada acrescentado.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.quote_status as enum ('pending', 'approved');
comment on type public.quote_status is
  'domain.ts QuoteStatus. Dois estados de propósito: enquanto `pending` o '
  'orçamento é rascunho editável; em `approved` ele virou venda e gerou parcelas '
  'em receivable — daí a policy de DELETE recusar apagar orçamento aprovado.';

create type public.lead_status as enum (
  'new', 'negotiating', 'scheduling', 'converted', 'lost'
);
comment on type public.lead_status is
  'domain.ts LeadStatus — as colunas do kanban de leads do Dashboard, na ordem '
  'do funil. `converted` deve vir acompanhado de lead.patient_id.';



-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · LEAD — funil de contatos (kanban do Dashboard)
--
-- domain.ts Lead. Dado PRÉ-paciente: quem ainda não tem prontuário. Quando
-- converte, `patient_id` amarra o contato ao cadastro criado.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.lead (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinic(id) on delete cascade,
  name       text not null,
  phone      public.phone_digits not null,
  source     text not null,
  interest   text not null,
  status     public.lead_status not null default 'new',
  patient_id uuid,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_name_not_blank_ck check (btrim(name) <> ''),
  constraint lead_source_not_blank_ck check (btrim(source) <> ''),
  constraint lead_interest_not_blank_ck check (btrim(interest) <> ''),
  -- FK COMPOSTA com clinic_id: um lead não pode "converter" no paciente de
  -- outra clínica. MATCH SIMPLE (padrão) deixa passar enquanto patient_id é
  -- nulo — que é o estado normal de quem ainda não converteu.
  --
  -- SET NULL COM LISTA DE COLUNAS (PostgreSQL 15+): sem a lista, o SET NULL de
  -- uma FK composta zeraria TAMBÉM `clinic_id`, que é NOT NULL — e o DELETE do
  -- paciente estouraria. Apagar o paciente (LGPD) não pode apagar a trilha
  -- comercial, só desamarrá-la.
  constraint lead_patient_fk
    foreign key (patient_id, clinic_id) references public.patient(id, clinic_id)
    on delete set null (patient_id)
);

comment on table public.lead is
  'Contato do funil comercial (domain.ts Lead) — o kanban do Dashboard. Fica '
  'FORA de `patient` de propósito: lead não tem prontuário, não tem consentimento '
  'clínico e some do funil quando esfria; misturar os dois sujaria a base de '
  'pacientes com gente que nunca pisou na clínica.';
comment on column public.lead.source is
  'Canal de origem (Instagram, Google, Indicação, WhatsApp…). Texto e NÃO enum: é '
  'rótulo de marketing, muda a cada campanha, e não quero uma migration para '
  'lançar um canal novo.';
comment on column public.lead.interest is 'Serviço de interesse declarado — texto livre, é o que o contato falou.';
comment on column public.lead.patient_id is
  'Paciente gerado na conversão. Sem isto, um lead `converted` é um beco sem '
  'saída: não dá para medir quanto cada canal realmente faturou.';
comment on column public.lead.created_at is
  'Entrada no funil. O domain.ts mostra ''dd/mm'' porque é mock — aqui é momento '
  'de verdade, e é dele que sai o tempo de resposta do funil.';

create index lead_clinic_status_idx on public.lead (clinic_id, status, created_at desc);
create index lead_patient_idx on public.lead (patient_id) where patient_id is not null;
create index lead_clinic_phone_idx on public.lead (clinic_id, phone);

comment on index public.lead_clinic_status_idx is
  'Índice do kanban: filtra por clínica + coluna e ordena por entrada. Composto '
  'porque o filtro é SEMPRE conjunto — nunca se pede "todos os leads novos da '
  'plataforma".';
comment on index public.lead_clinic_phone_idx is
  'O mesmo número ligando duas vezes é o caso comum. Sem este índice, a checagem '
  'de duplicidade na recepção varre a tabela.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · QUOTE — orçamento / plano de tratamento (aba do perfil do paciente)
--
-- domain.ts Quote. Documento comercial: tem código humano (ORC-000042), é
-- impresso, é citado em voz alta e, aprovado, vira parcela a receber.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.quote (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinic(id) on delete cascade,
  patient_id   uuid not null,
  code         text not null,
  name         text not null,
  issue_date   date not null default current_date,
  status       public.quote_status not null default 'pending',
  discount     public.money_brl not null default 0,
  installments integer not null default 1,
  notes        text,
  -- Soma de quote_item.amount, mantida pela trigger tr_recalc_quote_total.
  items_total  public.money_brl not null default 0,
  -- Coluna GERADA: o total nunca diverge do que está nas linhas. Escrito com
  -- CASE e não com GREATEST de propósito — expressão de coluna gerada precisa
  -- ser comprovadamente IMMUTABLE, e comparação de numeric é o terreno mais
  -- firme que existe para isso.
  total        numeric(12,2) generated always as (
                 case when items_total - discount > 0
                      then items_total - discount
                      else 0
                 end
               ) stored,
  approved_at  timestamptz,
  approved_by  uuid references public.profile(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint quote_name_not_blank_ck check (btrim(name) <> ''),
  constraint quote_discount_ck check (discount >= 0),
  constraint quote_items_total_ck check (items_total >= 0),
  -- 1 = à vista. Teto largo (60) porque plano de tratamento longo parcela muito;
  -- o que não pode é 0 ou negativo — viraria divisão por zero na geração das
  -- parcelas.
  constraint quote_installments_ck check (installments between 1 and 60),
  -- Aprovado ⇔ carimbado. Garantido pela trigger; o CHECK é a rede de baixo,
  -- para o dia em que alguém escrever direto com service_role.
  constraint quote_approval_stamp_ck
    check ((status = 'approved') = (approved_at is not null)),
  constraint quote_code_clinic_uk unique (clinic_id, code),
  -- Alvo da FK composta de quote_item.
  constraint quote_id_clinic_uk unique (id, clinic_id),

  -- FK COMPOSTA com clinic_id: sem ela, a RLS protegeria a LEITURA e o
  -- vazamento entraria pela escrita — um orçamento da clínica A apontando para
  -- o paciente da clínica B, com o nome dele impresso no documento.
  --
  -- NO ACTION e não RESTRICT, pelo mesmo motivo que a fundação documenta em
  -- clinic_user: os dois barram apagar um paciente com orçamento, mas RESTRICT
  -- confere NA HORA e NO ACTION confere no fim do statement. Ao apagar uma
  -- clínica (service_role), o CASCADE remove `patient` e `quote` na mesma
  -- instrução, em ordem indefinida — com RESTRICT isso estouraria conforme a
  -- sorte do plano de execução.
  constraint quote_patient_fk
    foreign key (patient_id, clinic_id) references public.patient(id, clinic_id)
    on delete no action
);

comment on table public.quote is
  'Orçamento / plano de tratamento (domain.ts Quote). Documento COMERCIAL, não '
  'clínico: o que foi proposto e por quanto. O que foi efetivamente executado '
  'mora em treatment/treatment_session (fatia clínica), e o que se cobra mora em '
  'receivable (fatia financeiro).';
comment on column public.quote.patient_id is
  'Dono do orçamento. NOT NULL: orçamento sem paciente não existe — é rascunho de '
  'tabela de preços, e isso não é este documento.';
comment on column public.quote.code is
  'Código humano ORC-000042, sequencial por clínica. Preenchido pela trigger '
  'tr_code (private.tg_set_code) — nunca calcule max()+1 na aplicação. O papel '
  '`authenticated` não tem GRANT de INSERT nesta coluna, então a condição '
  '`when (new.code is null)` da trigger é sempre verdadeira vinda do app: quem '
  'importa base antiga com código próprio é o service_role.';
comment on column public.quote.name is 'Título do documento ("Plano de tratamento de Maria Oliveira").';
comment on column public.quote.issue_date is
  'domain.ts Quote.date — data de emissão. Chamada `issue_date` e não `date` '
  'porque DATE é palavra-chave de tipo: coluna com esse nome envenena toda '
  'consulta escrita à mão depois.';
comment on column public.quote.discount is
  'Abatimento em R$ sobre o subtotal das linhas. Não há CHECK de discount <= '
  'items_total porque o cabeçalho é salvo ANTES das linhas — a proteção está no '
  'greatest(...,0) da coluna `total`.';
comment on column public.quote.installments is
  'Nº de parcelas combinado. É deste número que a aprovação gera as N linhas em '
  'receivable (installment_number k de installment_count N).';
comment on column public.quote.items_total is
  'Subtotal das linhas, DESNORMALIZADO de propósito e mantido por trigger. A '
  'lista de orçamentos do perfil mostra o total de cada um; sem esta coluna, '
  'seria um agregado por linha da lista (N+1 dentro do banco) toda vez que a aba '
  'abre.';
comment on column public.quote.total is
  'Valor fechado do orçamento (items_total - discount, nunca negativo). GENERATED '
  'STORED: é o número que vira parcela — não pode existir caminho em que o front '
  'grave um total diferente da conta.';
comment on column public.quote.approved_at is
  'Momento da aprovação — o gatilho comercial que autoriza gerar as parcelas. '
  'Carimbado pela trigger, não pelo cliente.';
comment on column public.quote.approved_by is
  'Quem aprovou. ON DELETE SET NULL: a saída do funcionário não pode apagar o '
  'orçamento (o audit_log guarda o nome congelado).';

create index quote_clinic_patient_idx on public.quote (clinic_id, patient_id, issue_date desc, created_at desc);
create index quote_clinic_status_idx on public.quote (clinic_id, status, issue_date desc);
create index quote_patient_idx on public.quote (patient_id);
create index quote_approved_by_idx on public.quote (approved_by) where approved_by is not null;

comment on index public.quote_clinic_patient_idx is
  'Caminho quente: a aba "Orçamentos" do perfil pede sempre os orçamentos DE UM '
  'paciente, do mais novo para o mais velho. Índice composto porque o filtro e a '
  'ordenação vêm sempre juntos.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · QUOTE_ITEM — as linhas do orçamento
--
-- domain.ts QuoteItem. Array de OBJETO no TS ⇒ TABELA FILHA aqui (regra da
-- fatia): cada linha tem profissional, convênio, dentes e preço próprios, e
-- precisa ser consultável ("quanto de clareamento a clínica orçou este mês?").
-- ─────────────────────────────────────────────────────────────────────────────

create table public.quote_item (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references public.clinic(id) on delete cascade,
  quote_id          uuid not null,
  sort_order        integer not null default 0,
  treatment         text not null,
  professional_id   uuid,
  insurance_id      uuid,
  teeth             text[],
  faces             text[],
  unit_price        public.money_brl not null,
  multiply_per_tooth boolean not null default false,
  -- Coluna GERADA: exatamente a fórmula do editor
  -- (BudgetsPanel.tsx:199 — `multiply && teethCount > 0 ? unitPrice * teethCount : unitPrice`).
  -- O ramo `and cardinality > 0` é redundante com quote_item_multiply_needs_teeth_ck
  -- HOJE, e é de propósito: se algum dia a CHECK for afrouxada, a linha volta a
  -- valer o preço unitário em vez de virar R$ 0,00 em silêncio — errar caro e
  -- visível é melhor que errar barato e invisível num documento de venda.
  amount            numeric(12,2) generated always as (
                      case
                        when multiply_per_tooth and coalesce(cardinality(teeth), 0) > 0
                          then unit_price * cardinality(teeth)
                        else unit_price
                      end
                    ) stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint quote_item_treatment_not_blank_ck check (btrim(treatment) <> ''),
  constraint quote_item_unit_price_ck check (unit_price >= 0),
  -- sort_order negativo não é ordem, é lixo de payload (mesma constraint que
  -- treatment_session_material usa na fatia clínica).
  constraint quote_item_sort_order_ck check (sort_order >= 0),

  -- Multiplicar por dente sem dente selecionado é uma multiplicação por zero
  -- disfarçada: no front o valor "some" e ninguém entende por quê.
  constraint quote_item_multiply_needs_teeth_ck
    check (not multiply_per_tooth or coalesce(cardinality(teeth), 0) > 0),

  -- Notação FDI, permanentes (11–48) e decíduos (51–85), exatamente os dentes
  -- desenhados no seletor do editor. Lista literal e não função: CHECK que chama
  -- função aceita a função ser reescrita depois SEM revalidar as linhas antigas.
  constraint quote_item_teeth_fdi_ck check (
    teeth is null or (
      cardinality(teeth) > 0 and teeth <@ array[
        '11','12','13','14','15','16','17','18',
        '21','22','23','24','25','26','27','28',
        '31','32','33','34','35','36','37','38',
        '41','42','43','44','45','46','47','48',
        '51','52','53','54','55',
        '61','62','63','64','65',
        '71','72','73','74','75',
        '81','82','83','84','85'
      ]::text[]
    )
  ),
  -- Faces dentárias: M (mesial) · O/I (oclusal/incisal) · D (distal) ·
  -- V/L (vestibular/lingual) · P (palatina).
  constraint quote_item_faces_ck check (
    faces is null or (
      cardinality(faces) > 0 and faces <@ array['M','O/I','D','V/L','P']::text[]
    )
  ),

  -- FKs COMPOSTAS com clinic_id: é o que impede uma linha apontar para o
  -- orçamento, o profissional ou o convênio de OUTRA clínica. Com FK simples, a
  -- RLS protegeria a leitura e o vazamento entraria pela escrita.
  constraint quote_item_quote_fk
    foreign key (quote_id, clinic_id) references public.quote(id, clinic_id)
    on delete cascade,

  -- MATCH SIMPLE (padrão): com professional_id/insurance_id nulos a FK composta
  -- não é conferida — que é o comportamento desejado (linha sem profissional
  -- definido, linha particular).
  --
  -- SET NULL COM LISTA (PostgreSQL 15+): sem `(professional_id)`, o SET NULL de
  -- uma FK composta zeraria também `clinic_id` (NOT NULL) e o DELETE do
  -- profissional estouraria.
  constraint quote_item_professional_fk
    foreign key (professional_id, clinic_id) references public.professional(id, clinic_id)
    on delete set null (professional_id),

  -- NO ACTION (e não RESTRICT): mesma armadilha do CASCADE de clínica descrita
  -- em quote_patient_fk. O efeito prático é o desejado — convênio citado em
  -- orçamento não se apaga, se inativa (insurance.status).
  constraint quote_item_insurance_fk
    foreign key (insurance_id, clinic_id) references public.insurance(id, clinic_id)
    on delete no action
);

comment on table public.quote_item is
  'Linha do orçamento (domain.ts QuoteItem). ON DELETE CASCADE no orçamento: a '
  'linha não tem vida própria fora do documento.';
comment on column public.quote_item.sort_order is
  'Ordem das linhas no documento impresso. O orçamento é lido de cima para baixo '
  'pelo paciente; ordenar por created_at inverteria a leitura a cada edição.';
comment on column public.quote_item.treatment is
  'Nome do tratamento proposto, texto livre. NÃO é FK para uma tabela de '
  'procedimentos porque essa tabela não existe no domínio — e congelar o texto é '
  'o certo num documento: renomear o procedimento amanhã não pode reescrever o '
  'orçamento que o paciente já assinou.';
comment on column public.quote_item.professional_id is
  'Quem executará. ON DELETE SET NULL: o profissional sai da clínica, o orçamento '
  'permanece (só perde o responsável sugerido).';
comment on column public.quote_item.insurance_id is
  'Convênio da linha. NULL = "Particular" — a opção "Particular" do select NÃO é '
  'linha de `insurance`: ela é a ausência de convênio, e criá-la como cadastro '
  'obrigaria toda clínica nova a ter um convênio fantasma (e a lidar com alguém '
  'renomeando-o). Convênio citado em orçamento não se apaga, se inativa.';
comment on column public.quote_item.teeth is
  'Dentes em notação FDI. text[] e não tabela filha porque é array de ESCALAR '
  '(a regra de tabela filha vale para array de objeto) e porque a pergunta real '
  '— "o dente 36 está em algum orçamento?" — o GIN responde direto.';
comment on column public.quote_item.faces is
  'Faces do dente atingidas pelo procedimento (M, O/I, D, V/L, P). Sem CHECK '
  'exigindo `teeth` preenchido: o editor permite marcar a face antes do dente, e '
  'travar isso no banco quebraria o rascunho no meio da digitação.';
comment on column public.quote_item.multiply_per_tooth is
  'true = o preço unitário é POR DENTE (restauração em 2 dentes = 2×). É a '
  'diferença entre orçar R$ 350 e R$ 700 — por isso o cálculo virou coluna '
  'gerada, e não conta refeita no front.';
comment on column public.quote_item.amount is
  'Valor final da linha. GENERATED STORED a partir de unit_price × dentes: fecha '
  'a porta para um cliente gravar amount divergente do preço unitário. Uma linha '
  'com desconto próprio exigiria migration — é o preço (barato) da garantia.';

create index quote_item_quote_idx on public.quote_item (quote_id, sort_order);
create index quote_item_clinic_idx on public.quote_item (clinic_id);
create index quote_item_professional_idx on public.quote_item (professional_id) where professional_id is not null;
create index quote_item_insurance_idx on public.quote_item (insurance_id) where insurance_id is not null;
create index quote_item_teeth_gin on public.quote_item using gin (teeth) where teeth is not null;

comment on index public.quote_item_teeth_gin is
  'Responde "que orçamentos tocam este dente?" — a pergunta que o odontograma faz '
  'ao abrir a ficha. Sem GIN, `teeth && array[''36'']` varre a tabela.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- 5.1 · Total do orçamento sempre igual à soma das linhas -----------------------
create or replace function private.tg_quote_recalc_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[] := '{}';
  v_id  uuid;
begin
  -- SECURITY DEFINER porque o UPDATE abaixo toca `items_total`, coluna que o
  -- papel `authenticated` NÃO tem GRANT para escrever (seção 6) — é exatamente
  -- essa a garantia: só esta trigger mexe no subtotal.
  --
  -- `new` e `old` são coletados em ramos IF explícitos, e não numa expressão
  -- com CASE: em trigger de DELETE o registro `new` não existe, e citá-lo numa
  -- expressão avaliada pelo executor é erro em tempo de execução.
  if tg_op <> 'DELETE' then
    v_ids := v_ids || new.quote_id;
  end if;
  -- Cobre o item que MUDA de orçamento (os dois documentos precisam recalcular).
  -- Hoje quote_id é imutável para `authenticated` (sem GRANT de UPDATE), mas
  -- service_role e importação de base antiga passam por aqui.
  if tg_op <> 'INSERT' and old.quote_id <> all(v_ids) then
    v_ids := v_ids || old.quote_id;
  end if;

  foreach v_id in array v_ids loop
    -- Quando o próprio orçamento está sendo apagado, o CASCADE já removeu a
    -- linha-pai antes de chegar aqui: o UPDATE simplesmente não casa com nada.
    --
    -- O `is distinct from` na cláusula WHERE não é micro-otimização: `quote` tem
    -- tr_audit ligada, e SEM esse filtro toda edição que não mexe em dinheiro
    -- (reordenar linhas, trocar o profissional sugerido) gravaria um UPDATE
    -- no-op em `quote` e, com ele, uma linha de audit_log dizendo que o
    -- orçamento mudou quando nada mudou. Trilha que mente por excesso é tão
    -- ruim quanto trilha que falta.
    update public.quote q
       set items_total = coalesce(
             (select sum(i.amount) from public.quote_item i where i.quote_id = q.id),
             0
           )
     where q.id = v_id
       and q.items_total is distinct from coalesce(
             (select sum(i.amount) from public.quote_item i where i.quote_id = q.id),
             0
           );
  end loop;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

comment on function private.tg_quote_recalc_total() is
  'AFTER INSERT/UPDATE/DELETE em quote_item: reescreve quote.items_total (e, por '
  'consequência, a coluna gerada quote.total). Recalcula por SOMA e não por '
  'delta: delta acumula erro para sempre depois de um único caminho esquecido, '
  'e um orçamento tem dezenas de linhas, não milhões.';

revoke execute on function private.tg_quote_recalc_total() from public;


-- 5.2 · Carimbo da aprovação ---------------------------------------------------
-- Sem SECURITY DEFINER, ao contrário da de cima: esta função só ATRIBUI a NEW,
-- não consulta nada — e atribuição em trigger BEFORE não passa por GRANT de
-- coluna (o privilégio é conferido contra o comando, não contra a trigger).
-- Privilégio que não é necessário não se concede.
create or replace function private.tg_quote_stamp_approval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'approved'
     and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    new.approved_at := coalesce(new.approved_at, now());
    new.approved_by := coalesce(new.approved_by, (select auth.uid()));
  elsif new.status <> 'approved' then
    -- Voltou para rascunho: o carimbo antigo mentiria. O CHECK
    -- quote_approval_stamp_ck depende desta limpeza.
    new.approved_at := null;
    new.approved_by := null;
  end if;
  return new;
end;
$$;

comment on function private.tg_quote_stamp_approval() is
  'BEFORE INSERT/UPDATE em quote: quem e quando aprovou vem do servidor, não do '
  'cliente. É a data que autoriza a geração das parcelas — deixá-la no payload '
  'seria deixar o cliente escolher o vencimento da primeira parcela.';

revoke execute on function private.tg_quote_stamp_approval() from public;


-- 5.3 · Registro das triggers --------------------------------------------------
-- 5.3 · Registro das triggers --------------------------------------------------
-- (as de `insurance` e `material` foram com elas para 02-cadastros.sql)
create trigger tr_touch before update on public.lead
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.quote
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.quote_item
  for each row execute function private.tg_touch_updated_at();

-- Código humano ORC-000042 (contrato da fundação, seção 8 do cabeçalho dela).
create trigger tr_code before insert on public.quote
  for each row when (new.code is null)
  execute function private.tg_set_code('quote', 'ORC');

create trigger tr_stamp_approval before insert or update of status on public.quote
  for each row execute function private.tg_quote_stamp_approval();

create trigger tr_recalc_quote_total after insert or update or delete on public.quote_item
  for each row execute function private.tg_quote_recalc_total();

-- Auditoria: onde a pergunta "quem mudou isso?" custa dinheiro.
--   quote/quote_item → o documento que vira cobrança.
-- `lead` fica de fora: volume alto, valor probatório baixo — mover cartão de
-- coluna no kanban não é fato auditável.
-- (a auditoria de `insurance` e `material` está em 02-cadastros.sql)
create trigger tr_audit after insert or update or delete on public.quote
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.quote_item
  for each row execute function private.tg_audit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · PRIVILÉGIOS DE COLUNA
--
-- RLS decide QUAIS LINHAS; GRANT decide QUAIS COLUNAS. Sem esta seção, um
-- usuário com UPDATE legítimo no próprio orçamento reescreveria `code` (o número
-- impresso no documento do paciente) ou `items_total` (o valor que vira parcela)
-- — e a policy diria sim, porque a linha é da clínica dele.
--
-- Ordem obrigatória: REVOKE de tabela primeiro; privilégio de coluna só existe
-- onde o de tabela não existe.
-- ─────────────────────────────────────────────────────────────────────────────

revoke update on public.lead from anon, authenticated;
grant update (name, phone, source, interest, status, patient_id, notes)
  on public.lead to authenticated;

-- `lead` também precisa de lista no INSERT, e por um motivo específico: o
-- comentário de lead.created_at diz que é dele que sai o TEMPO DE RESPOSTA do
-- funil. Métrica de desempenho da equipe cujo instante de partida o próprio
-- cliente escolhe não é métrica. Fora da lista: created_at e updated_at.
revoke insert on public.lead from anon, authenticated;
grant insert (id, clinic_id, name, phone, source, interest, status,
              patient_id, notes)
  on public.lead to authenticated;

revoke update on public.quote from anon, authenticated;
grant update (name, issue_date, status, discount, installments, notes)
  on public.quote to authenticated;
-- Fora da lista, de propósito:
--   code                    → número do documento, imutável depois de emitido;
--   patient_id              → mudar o dono é emitir OUTRO orçamento (e o novo
--                             ganha código próprio, que é o que a auditoria lê);
--   items_total             → só a trigger escreve;
--   total, amount           → colunas geradas, não são atualizáveis;
--   approved_at/approved_by → carimbo do servidor;
--   clinic_id               → mudar o tenant de uma linha é o vazamento.

-- O INSERT TAMBÉM precisa de lista de colunas, e só aqui (quote/quote_item).
-- Sem isto o buraco continua aberto pelo outro lado: nada impediria um cliente
-- de INSERIR um orçamento já com `items_total` inventado — a trigger de
-- recálculo só dispara quando existe LINHA, e um orçamento sem linhas nunca
-- passaria por ela. Mesma história com `code` (documento com número forjado) e
-- com `approved_at` (aprovação retroativa escolhendo o vencimento da 1ª parcela).
-- Em `lead` não há coluna derivada nem carimbo de servidor além de created_at,
-- então a lista acima já basta.
revoke insert on public.quote from anon, authenticated;
grant insert (id, clinic_id, patient_id, name, issue_date, status,
              discount, installments, notes)
  on public.quote to authenticated;
-- `created_at`/`updated_at` também ficam de fora: documento comercial com data
-- de criação escolhida pelo cliente é documento antedatado.

revoke update on public.quote_item from anon, authenticated;
grant update (treatment, professional_id, insurance_id, teeth, faces,
              unit_price, multiply_per_tooth, sort_order)
  on public.quote_item to authenticated;
-- `quote_id` e `clinic_id` ficam de fora: mover uma linha entre orçamentos é
-- apagar de um e inserir no outro — e assim os dois totais são recalculados.

revoke insert on public.quote_item from anon, authenticated;
grant insert (id, clinic_id, quote_id, sort_order, treatment, professional_id,
              insurance_id, teeth, faces, unit_price, multiply_per_tooth)
  on public.quote_item to authenticated;



-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · RLS
--
-- Forma canônica da fundação: `clinic_id = any(private.auth_clinic_ids())` no
-- tenant, mais o portão de feature (plano libera E cargo permite) na escrita.
--
-- Escolha de LEITURA por tabela:
--   lead → feature `dashboard` (é onde o kanban vive).
--   quote, quote_item → feature `patients` (aba do perfil do paciente).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.lead       enable row level security;
alter table public.quote      enable row level security;
alter table public.quote_item enable row level security;

-- ── lead ─────────────────────────────────────────────────────────────────────
create policy lead_select on public.lead
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'dashboard')
  );

create policy lead_insert on public.lead
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'dashboard')
  );

create policy lead_update on public.lead
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'dashboard')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy lead_delete on public.lead
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'dashboard')
  );

-- ── quote ────────────────────────────────────────────────────────────────────
create policy quote_select on public.quote
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy quote_insert on public.quote
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy quote_update on public.quote
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

-- Orçamento APROVADO não se apaga pela API: ele já gerou parcelas (a FK
-- receivable.quote_id é NO ACTION e barraria de qualquer jeito, mas com um erro
-- de integridade ilegível) e é o documento que o paciente tem em mãos. Cancelar
-- uma venda é ato do Financeiro sobre as parcelas, não um DELETE aqui.
create policy quote_delete on public.quote
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
    and status <> 'approved'
  );

-- ── quote_item ───────────────────────────────────────────────────────────────
-- O item herda o portão do documento. Não repetimos a checagem do orçamento pai
-- (subselect por linha na policy): a FK composta (quote_id, clinic_id) já
-- garante que o item e o orçamento são do MESMO tenant.
create policy quote_item_select on public.quote_item
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy quote_item_insert on public.quote_item
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy quote_item_update on public.quote_item
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy quote_item_delete on public.quote_item
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );


-- ═════════════════════════════════════════════════════════════════════════════
-- FIM DA FATIA COMERCIAL
--
-- COSTURA COM O FINANCEIRO (nada a fazer aqui): `receivable.quote_id` é
-- declarada DENTRO do CREATE TABLE de 08-financeiro.sql, como FK COMPOSTA
-- (quote_id, clinic_id) → quote(id, clinic_id) ON DELETE NO ACTION, contra o
-- `quote_id_clinic_uk` criado neste arquivo. Índice, unique de idempotência
-- (quote_id, installment_number) e coerência de tenant estão todos lá.
-- A dependência anda em UM sentido só: comercial não conhece o financeiro.
--
-- FICOU DE FORA, DE PROPÓSITO:
--
-- · RPC de aprovação (`approve_quote`): a geração das N parcelas continua no app
--   (services/quotesService.ts). Quando migrar para o banco, deve ser UMA função
--   SECURITY DEFINER que, na mesma transação, marca status='approved' e insere
--   as parcelas — hoje o app faz os dois passos separados e um erro no meio
--   deixa orçamento aprovado sem cobrança. A idempotência do app JÁ tem respaldo
--   no banco: `unique (quote_id, installment_number)` em 08-financeiro.sql.
--
-- · IMUTABILIDADE DAS LINHAS DE UM ORÇAMENTO APROVADO. `quote` recusa DELETE com
--   status='approved', mas `quote_item` NÃO tem trava equivalente: quem tem
--   edição em `patients` insere/edita/apaga linhas de um orçamento já aprovado, a
--   trigger recalcula items_total/total, e o valor do documento que gerou as
--   parcelas muda DEPOIS da assinatura. NÃO foi travado de propósito: o editor
--   cria o orçamento JÁ como `approved` (BudgetsPanel.tsx:381/571 chamam
--   `save('approved')`) e só então grava as linhas — uma trava de INSERT
--   quebraria o fluxo principal. A correção certa é a RPC acima: aprovar vira o
--   ÚLTIMO passo, com as linhas já gravadas.
--
-- · REABERTURA DE ORÇAMENTO APROVADO. `status` está no GRANT de UPDATE, então
--   'approved' → 'pending' passa pela API (a trigger limpa o carimbo). O DELETE
--   seguinte é barrado pela FK do financeiro, mas o orçamento fica "pendente"
--   com parcelas emitidas. Trancar isso exigiria consultar `receivable` daqui —
--   dependência no sentido errado. Vai junto com a RPC de aprovação.
--
-- · Duplicidade dentro de `teeth`/`faces`: um CHECK de "sem repetidos" exigiria
--   subconsulta (proibida em CHECK) ou função (que pode ser reescrita sem
--   revalidar). O editor já grava conjunto; o custo de um repetido é cosmético.
--
--
-- DIVERGÊNCIAS CONHECIDAS ENTRE ESTE SCHEMA E O CÓDIGO ATUAL DO FRONT
-- (não são bugs do schema — são o front que precisa acompanhar):
--
-- · quote_item_multiply_needs_teeth_ck REJEITA `multiply_per_tooth = true` sem
--   dente selecionado, e o editor PRODUZ esse estado: o checkbox "Multiplicar
--   valor por dente" (BudgetsPanel.tsx:472-474) não é desabilitado quando nenhum
--   dente está marcado, e a linha sai com `multiplyPerTooth: true` e
--   `teeth: undefined` (linhas 199-210) — salvar dá erro 23514. A CHECK está
--   CERTA e fica: sem ela a linha valeria `unit_price × 0`. O conserto é de UI.
--
-- · `quote_item.insurance_id uuid` vs `QuoteItem.insurance?: string` do domain.ts
--   (o mock grava o NOME, 'Particular'). É a mesma normalização que
--   03-pacientes.sql fez com `patient.insurance_id`; a conversão nome ⇄ id é do
--   service. NULL continua significando "Particular".
--
-- · `lead.patient_id` e `lead.notes` não existem em `Lead` no domain.ts. Foram
--   acrescentados: sem `patient_id` um lead `converted` é beco sem saída (não se
--   mede quanto cada canal faturou). NÃO há CHECK amarrando
--   `status = 'converted'` a `patient_id not null` — arrastar o cartão no kanban
--   tem de continuar funcionando antes de o cadastro existir.
--
-- · `quote.approved_at` / `quote.approved_by` e `quote_item.sort_order` também
--   não estão no domain.ts: são carimbo de servidor e ordem de impressão.
-- ═════════════════════════════════════════════════════════════════════════════
