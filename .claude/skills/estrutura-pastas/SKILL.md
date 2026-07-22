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
├── components/    # Componentes REUTILIZÁVEIS (usados por 2+ páginas)
├── constants/     # Rotas, opções fixas, enums de UI — fonte única
├── context/       # Providers globais (SessionProvider, ThemeProvider)
├── hooks/         # Hooks reutilizáveis (wrappers de useQuery sobre services)
├── lib/           # Infra: supabase.ts (cliente único + isMockMode), queryKeys.ts
├── mocks/         # Dados de demonstração — consumidos pelos services no modo mock
├── pages/         # 1 pasta por domínio; dentro, 1 pasta por página
├── routes/        # AppRouter, layouts (AppLayout) e guards (AuthGuard)
├── services/      # Acesso a dados — 1 arquivo por entidade
├── styles/        # SISTEMA DE ESTILOS CENTRALIZADO (ver seção abaixo)
├── types/         # database.types.ts (GERADO) + domain.ts (tipos do domínio)
└── utils/         # Funções puras (datas, máscaras, formatação)
```

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
Opção de menu nova → adicionar em `NAV_ITEMS` no `Header.tsx`.

## Modo mock (enquanto não há Supabase)

- `lib/supabase.ts` exporta `isMockMode` (true sem `.env`) — o app NUNCA pode
  quebrar sem `.env`: sessão fake entra logada direto e services retornam
  dados de `mocks/`.
- Dados de demonstração vivem em `mocks/` (1 arquivo por entidade), tipados
  com `types/domain.ts`.
- Ao ligar o Supabase real: trocar SÓ o corpo dos services (mesma assinatura)
  — páginas e hooks não mudam.

## Onde cada coisa mora (decisão rápida)

| Vou criar…                              | Vai para…                                          |
|-----------------------------------------|----------------------------------------------------|
| Componente usado por 2+ páginas         | `components/NomeDoComponente/`                     |
| Componente usado por 1 página só        | Dentro da pasta da própria página                  |
| Página nova                             | `pages/Dominio/NomeDaPagina/NomeDaPaginaPage.tsx`  |
| Acesso a dados (mock ou Supabase)       | `services/entidadeService.ts` (NUNCA na página)    |
| Dados de demonstração                   | `mocks/entidade.ts` tipado com `types/domain.ts`   |
| Hook com useQuery/useMutation           | `hooks/` (se reutilizável) ou na pasta da página   |
| Path de rota                            | `constants/routes.ts` (NUNCA string literal)       |
| Query key                               | `lib/queryKeys.ts` (NUNCA inline no useQuery)      |
| Cor, tamanho, raio, fonte, espaçamento  | `styles/_tokens.scss` / `styles/_themes.scss`      |
| Padrão visual repetido (campo, cartão…) | Mixin em `styles/_mixins.scss`                     |
| Media query                             | Mixins `mobile`/`phone`/`desktop` (NUNCA ad-hoc)   |
| Função pura (formatar CPF, data…)       | `utils/`                                           |

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
  stroke 2, tamanho definido pelo CSS de quem usa). Nunca declare `<svg>`
  dentro de outro componente ou página.
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
    └── PatientProfilePage.tsx   # sub-página (detalhe)
```

- Sufixo `Page` no nome do arquivo e da função (`PatientsPage`).
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
  ARMAZENADOS (`'active'`, `'paid'`, `'todo'`), query keys, ids de tab e
  tabelas/colunas do Supabase (`patients`, `schedule_slots`).
- **Português** — o que o usuário vê ou lê: texto de UI, rótulos
  (via `STATUS_MAP`/options: chave en → `label` pt), mensagens, rotas
  (`/pacientes`) e comentários.
- Exceções de nome próprio: `cpf`, `cnpj`, `cep`, `nsu`, `ans`, `boleto`,
  `pix` — termos brasileiros sem tradução útil, ficam como estão.
- Um valor novo de status entra em inglês no domínio e ganha rótulo pt no
  `STATUS_MAP` — nunca aparece cru na tela.
