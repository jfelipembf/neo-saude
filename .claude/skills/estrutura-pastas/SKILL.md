---
name: estrutura-pastas
description: Orientação de estrutura de pastas, convenções e sistema de estilos do Neo Saúde. Use SEMPRE antes de criar qualquer arquivo novo (componente, página, service, hook, util, rota, estilo) para decidir onde ele mora e como nomeá-lo.
---

# Estrutura de pastas — Neo Saúde

Projeto React 19 + TypeScript + Vite + SCSS Modules + Supabase + TanStack Query.
Alias de import: `@` → `src/` (sempre prefira `@/…` a caminhos relativos longos).

## Mapa das pastas

```
src/
├── assets/        # Imagens do app (fundos de login/erro, logo) importadas pelo código
├── components/    # TODO componente de UI — sempre aqui, nunca na pasta da página
├── constants/     # Rotas, opções fixas, enums de UI — fonte única (barrel em index.ts)
├── context/       # Providers globais (SessionProvider, ThemeProvider)
├── hooks/         # TODO hook — inclusive os de uma página só
├── lib/           # Infra (ver detalhe abaixo): supabase, queryKeys, tenant, storage, db, errors
├── pages/         # 1 pasta por domínio; dentro, sub-páginas e abas (ver detalhe abaixo)
├── routes/        # AppRouter, layouts (AppLayout) e guards (AuthGuard, FeatureGuard)
├── services/      # Acesso a dados — 1 arquivo por entidade
├── styles/        # SISTEMA DE ESTILOS CENTRALIZADO (ver seção abaixo)
├── test/          # setup.ts do Vitest (os testes ficam ao lado do que testam)
├── types/         # database.types.ts (GERADO) + domain.ts (tipos do domínio)
└── utils/         # Funções puras (datas, máscaras, formatação)
```

### `src/lib/` em detalhe

Não é só o cliente do Supabase — quem não souber que estes existem vai recriá-los:

| Arquivo             | O que é                                                        |
|---------------------|----------------------------------------------------------------|
| `supabase.ts`       | ÚNICA instância do cliente. `.env` é obrigatório (faz `throw` sem ele) |
| `queryKeys.ts`      | Fonte única das query keys do TanStack Query                    |
| `tenant.ts`         | Resolve a clínica corrente — os services usam em toda query/insert |
| `storage.ts`        | Upload/compressão de imagem e URL assinada do Storage           |
| `errors.ts`         | Traduz erro do Postgres em mensagem de usuário (`userMessage`)  |
| `db.ts`             | Atalhos de tipo sobre o schema gerado                           |
| `odontogramShell/`  | Bundle de TERCEIRO (odontograma). Não editar à mão — vem do `scripts/atualizar-odontograma.sh`, que aplica os patches de `vendor/odontogram-modul/PATCHES-NEOSAUDE.md`. É a única exceção legítima a `export default` fora do `App.tsx`, e o único nome kebab-case do `src/`. |

### `src/pages/` em detalhe — os TRÊS níveis

```
pages/Dominio/DominioPage.tsx            # página-índice do domínio (roteada)
pages/Dominio/NomeDaPagina/…Page.tsx     # sub-página roteada (ex.: Patients/Profile/)
pages/Dominio/Feature/FeatureTab.tsx     # ABA de uma página-índice (NÃO é roteada)
pages/Dominio/AlgoModal.tsx              # componente exclusivo do domínio, ao lado da página-índice
pages/Dominio/shared/dominio.module.scss # folha compartilhada pelas abas do domínio
```

- **Aba** (`*Tab.tsx`) é o padrão dominante: `Admin/` tem 11, `Finance/` 9,
  `Settings/` 5. Elas NÃO entram no `AppRouter` — quem entra é a página-índice
  (`AdminPage`, `FinancePage`…), que as troca por `<Tabs>`.
- Pasta de aba não precisa de `*Page.tsx`. Não crie um só para "fechar o padrão".

## Responsividade (OBRIGATÓRIO) e PWA

- **Toda página e todo componente DEVE se ajustar a mobile.** Nenhuma entrega
  é aceita só para desktop: ao criar/editar qualquer `.module.scss`, inclua os
  ajustes com os mixins `@include mobile` (≤768px) e, quando fizer diferença,
  `@include phone` (≤480px). Confira os dois breakpoints antes de concluir.
- Padrões já usados: grids colapsam para 1 coluna (`form-grid-collapse`),
  linhas viram coluna (`stack-below-tablet`), navegação some rótulos no phone,
  tabelas largas rolam dentro do próprio cartão (`overflow-x: auto`).
- **O app é um PWA instalável** (`vite-plugin-pwa` no `vite.config.ts`):
  manifest em pt-BR, `registerType: 'autoUpdate'`, ícones em `public/`
  (`pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`, gerados do
  `favicon.svg`). NÃO remover essa config; mudanças de marca (cor/ícone)
  atualizam também o manifest e os ícones.

## Layout do app

O layout é **HORIZONTAL**: navegação no `Header` (barra do topo —
`components/Header/`), NUNCA menu lateral. O `AppLayout` empilha
Header + conteúdo em coluna, com conteúdo centralizado (max-width 1280px).
Opção de menu nova → adicionar em `NAV_ITEMS` no `Header.tsx`. **Atenção:**
`NAV_ITEMS` tem 6 dos 7 valores de `AppPage` — `settings` fica DE FORA de
propósito (Configurações é alcançada pelo `ProfileMenu`, no avatar). Não
"conserte" isso adicionando Configurações à barra.

## Supabase é obrigatório

Não existe modo mock. `lib/supabase.ts` faz `throw` no import quando faltam
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` — sem `.env` o app não sobe, e o
erro aparece na hora, não na primeira query. Copie o `.env.example`.

## Onde cada coisa mora (decisão rápida)

| Vou criar…                              | Vai para…                                          |
|-----------------------------------------|----------------------------------------------------|
| Componente de UI (QUALQUER um)          | `components/NomeDoComponente/` — ver regra abaixo  |
| Página nova                             | `pages/Dominio/NomeDaPagina/NomeDaPaginaPage.tsx`  |
| Aba de uma página com `<Tabs>`          | `pages/Dominio/Feature/FeatureTab.tsx`             |
| Acesso a dados                          | `services/entidadeService.ts` (NUNCA na página)    |
| Hook com useQuery/useMutation           | `hooks/useAlgo.ts` (SEMPRE, mesmo de uma página só)|
| Teste                                   | `X.test.ts` AO LADO de `X.ts` (setup em `src/test/`)|
| Path de rota                            | `constants/routes.ts` (NUNCA string literal)       |
| Query key                               | `lib/queryKeys.ts` (NUNCA inline no useQuery)      |
| Opção fixa de UI / mapa de rótulo       | `constants/` (NUNCA na pasta do componente)        |
| Cor, tamanho, raio, fonte, espaçamento  | `styles/_tokens.scss` / `styles/_themes.scss`      |
| Padrão visual repetido (campo, cartão…) | Mixin em `styles/_mixins.scss`                     |
| Media query                             | Mixins `mobile`/`phone`/`desktop` (NUNCA ad-hoc)   |
| Função pura (formatar CPF, data…)       | `utils/`                                           |

### Componente vai SEMPRE em `components/` — inclusive o de uma página só

Decisão explícita do dono do projeto: **não existe componente dentro de pasta
de página.** Mesmo um painel usado por uma única tela (`BudgetsPanel`,
`TreatmentsPanel`, `PrescriptionsPanel`, `DocumentsUpload`, `LeadsKanban`…)
mora em `components/`. Vale o mesmo para hooks: todos em `hooks/`.

A exceção é o componente EXCLUSIVO de um domínio que só faz sentido ao lado da
página-índice dele (ex.: `pages/Professionals/ProfessionalFormModal.tsx`) —
formulário/modal que só aquele domínio abre e que não é reaproveitável.

**Segunda exceção — as TELAS DE ATENDIMENTO em tela cheia.**
`pages/Consultation/{Med,Fisio,Odonto}/` têm `components/` próprios, e isso é
deliberado. São três telas irmãs da mesma família, cada uma com o menu de
seções da sua especialidade; o que separa uma da outra não é "componente de
página única", é DOMÍNIO CLÍNICO. A estrutura é:

```
pages/Consultation/
├── <PainelCompartilhado>.tsx        ← usado por 2+ especialidades
├── Components/
│   ├── Shell/                       ← SideNav · MobileNav · MobileHome · navItems
│   │                                  (a CASCA, genérica na chave, parametrizada
│   │                                   por props — nunca copiada por pasta)
│   ├── Header/ · Anamnesis/ · ClinicalRecord/ · Documents/ · Wizard/
├── Med/     index.tsx · sideNavItems.tsx · Med.module.scss · components/
├── Fisio/   index.tsx · sideNavItems.tsx · Fisio.module.scss · components/
└── Odonto/  index.tsx · sideNavItems.tsx · Odonto.module.scss
```

Regras dentro dessa exceção:
- **A casca NUNCA é copiada.** `SideNav`/`MobileNav`/`MobileHome` são genéricos
  em `K extends string` e recebem `itens` + `atalhos` por prop. Três cópias
  divergiriam no primeiro ajuste de CSS, e o gate não pega isso: classe faltando
  num CSS Module vira `undefined` em silêncio, sem quebrar o build.
- **Painel usado por 2+ especialidades sobe** para a raiz de `Consultation/` ou
  para `Components/`, e ganha `.module.scss` PRÓPRIO. Importar a folha da página
  de outra especialidade é o que travou esta separação por meses.
- **Cada pasta tem seu `sideNavItems.tsx`** com a lista de seções e a tupla dos
  dois atalhos da barra inferior — os únicos dados que variam por especialidade.

### Sub-componente e arquivo auxiliar

- **Sub-componente com consumidor único** fica na pasta do componente pai, e
  não ganha pasta própria: `BudgetsPanel/ApproveQuoteDialog.tsx`,
  `LeadsKanban/{LeadDetailDrawer,NewLeadDrawer}.tsx`,
  `TreatmentsPanel/SessionBillingLine.tsx`, `ScheduleGrid/{ClassCard,ClassGroupCard}.tsx`.
- **Auxiliar de escopo único** (`.ts` sem componente) fica junto do consumidor:
  `Badge/statusMap.ts`, `Anamnesis/questions.ts`, `Earnings/buckets.ts`,
  `Automation/automations.ts`. Se passar a ter 2+ consumidores, vira `constants/`.
- **Folha compartilhada** por vários irmãos: nomeie em camelCase pelo escopo, não
  pelo componente — `Finance/shared/finance.module.scss`,
  `ScheduleGrid/scheduleCards.module.scss`. Importe sempre pelo caminho
  RELATIVO (`../shared/finance.module.scss`), nunca pelo alias `@/pages/…`.

## Sistema de estilos (CENTRALIZADO — regra de ouro)

Os valores de design vivem TODOS em `src/styles/`; os `.module.scss` dos
componentes só COMPÕEM tokens e mixins — nunca inventam valores:

```
styles/
├── _tokens.scss       # TODOS os valores estáticos: paleta VERDE (#10B981) +
│                      #   ROXO (#8B5CF6), status, alturas de controles ($ctrl-*),
│                      #   raios ($radius-*), fontes ($fs-*), espaçamentos ($sp-*)
├── _themes.scss       # CSS vars dos temas: CLARO (:root, padrão) e
│                      #   ESCURO ([data-theme='dark']) — alternados pelo ThemeProvider
├── _breakpoints.scss  # mixins mobile/phone/desktop
├── _mixins.scss       # PONTO DE ENTRADA ÚNICO (@forward tokens+breakpoints) +
│                      #   padrões: field-*, control-surface, card, focus-ring
└── global.scss        # reset + base (importa themes) — só o main.tsx importa
```

Regras:
- Todo `.module.scss` abre com **um único import**:
  `@use '../../styles/mixins' as *;` (ajuste a profundidade do caminho).
- **PROIBIDO estilo inline** (`style={{…}}`) em qualquer componente/página —
  variação visual vira classe/variante no `.module.scss`
  (ex.: Spinner usa `spinner--sm/md/lg`, não `style={{width}}`).
- **Ícones** vivem SÓ em `components/icons/index.tsx` (named exports `Icon*`,
  stroke 2, tamanho definido pelo CSS de quem usa). Nunca declare um `<svg>`
  DECORATIVO fora de lá.
  A exceção é o SVG **data-driven** — aquele cujas coordenadas vêm de props ou
  estado e que portanto não é um ícone: gráfico (`FinanceChart`,
  `AppointmentsChart`), sobreposição de goniometria (`GoniometryPhoto`),
  desenho de teste (`PatientTestsPanel`). Não tem o que extrair para `icons/`.
- **NUNCA** hex/px mágico em componente. Cor nova → `_tokens.scss` +
  `_themes.scss`; medida nova → `_tokens.scss`.
- Cores que mudam entre claro/escuro → CSS var em `_themes.scss`
  (ex.: `var(--text-primary)`, `var(--field-bg)`, `var(--success-fg)`).
  Cores fixas da marca → SCSS var de `_tokens.scss` (ex.: `$danger` em rgba()).
- Padrão visual que aparece em 2+ componentes (campo de formulário, cartão,
  foco) → vira mixin em `_mixins.scss`, não copia-e-cola.
  Ex.: Input/Select/Textarea usam `field-root`/`field-label`/`control-surface`.
- Tema claro é o PADRÃO; escuro via `[data-theme='dark']` no `<html>`
  (ThemeProvider). Teste os dois ao criar qualquer estilo novo.

## Convenções de componente

Cada componente reutilizável = 1 pasta com 2 arquivos:

```
components/Button/
├── Button.tsx           # named export: export function Button(...)
└── Button.module.scss   # composição de tokens/mixins SÓ deste componente
```

- **Named exports sempre** (`export function Button`), nunca default —
  exceto `App.tsx`.
- Props tipadas com `interface XxxProps` no próprio arquivo; estender o tipo
  HTML nativo quando fizer sentido (`ButtonHTMLAttributes<HTMLButtonElement>`).
- Classes compostas via array + `filter(Boolean).join(' ')` (ver `Button.tsx`).
- Variantes de estilo: classe `component--variante` (ex.: `.btn--primary`).

## Convenções de página

```
pages/Patients/
├── PatientsPage.tsx             # página de listagem
└── Profile/
    ├── PatientProfilePage.tsx   # sub-página (detalhe)
    └── Tests/PatientTestsPanel.tsx   # painel de uma aba do perfil
```

- Sufixo `Page` no nome do arquivo e da função (`PatientsPage`). O sufixo
  `Page` é uma PROMESSA de rota: nada que não esteja no `AppRouter` pode
  usá-lo — inclusive `.module.scss` (um `AlgoPage.module.scss` sem
  `AlgoPage.tsx` é sinal de arquivo órfão).
- Toda página nova entra no `routes/AppRouter.tsx` com `lazy()` (code-splitting)
  e path vindo de `constants/routes.ts`.
- Página protegida fica DENTRO de `<AuthGuard>` → `<AppLayout>`; pública
  (login, páginas de link externo) fica fora.
- Estrutura padrão do corpo: `<PageHeader title actions>` + conteúdo
  (`EmptyState` enquanto não há dados).

## Fluxo de dados (camadas)

```
página → hook (useQuery) → service → supabase (lib/supabase.ts)
```

- A página NUNCA importa `supabase` direto; sempre passa por um service.
- `lib/supabase.ts` é a ÚNICA instância do cliente — nunca crie outro
  `createClient`.
- Após qualquer migration, regenerar `types/database.types.ts`
  (comando no cabeçalho do próprio arquivo).

## Idioma

Regra única: **código em inglês, produto em português.**

- **Inglês** — TODO identificador: arquivos, componentes, funções, variáveis,
  campos de tipo (`name`, `amount`, `patientId`), literais de union
  ARMAZENADOS (`'active'`, `'paid'`, `'todo'`), query keys, ids de tab,
  **chaves de coluna de tabela** (`key: 'amount'`, nunca `key: 'valor'`) e
  tabelas/colunas do Supabase.
- **Português** — o que o usuário vê ou lê: texto de UI, rótulos
  (via `STATUS_MAP`/options: chave en → `label` pt), mensagens, rotas
  (`/pacientes`) e comentários.
- Exceções de nome próprio: `cpf`, `cnpj`, `cep`, `nsu`, `ans`, `boleto`,
  `pix` — termos brasileiros sem tradução útil, ficam como estão.
- Um valor novo de status entra em inglês no domínio e ganha rótulo pt no
  `STATUS_MAP` — nunca aparece cru na tela.
- **Atenção ao singular/plural do Supabase:** o arquivo e o service são plural
  (`patientsService.ts`, `listPatients`), mas a TABELA é singular
  (`from('patient')`). Confira em `types/database.types.ts` antes de escrever
  uma query.

### Nomes de classe CSS

Devem ser em inglês (são identificador de código), mas **~40% da base ainda
está em português** (`.corpo`, `.rotulo`, `.cabecalho`, `.situacaoChip`…) —
herança dos painéis de domínio. Os primitivos do design system (`Button`,
`Input`, `Table`, `Modal`…) já são 100% inglês.

Regra prática: **inglês em classe NOVA e em arquivo que você já está mexendo.**
NÃO faça migração em massa — nome de classe é referenciado via `styles.X` sem
checagem de tipo, então renomear em lote é churn de alto risco e ganho zero.
