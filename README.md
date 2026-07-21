# Neo Saúde

Sistema de gestão para consultórios e clínicas de saúde de diversos ramos
(médico, odontológico, fisioterapia, psicologia…).

**Stack:** React 19 · TypeScript · Vite · SCSS Modules · Supabase · TanStack Query · React Router 7 · PWA

Requisitos permanentes: **toda página/componente se ajusta a mobile**
(mixins de `src/styles/_breakpoints.scss`) e o app é **instalável como PWA**
(`vite-plugin-pwa`, manifest pt-BR, atualização automática do service worker).

## Rodando o projeto

```bash
npm install
npm run dev
```

Sem `.env` o app sobe em **modo demonstração** (dados mock, já logado).
Para ligar no Supabase real: `cp .env.example .env` e preencher
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

Outros comandos: `npm run build` (produção), `npm run lint`, `npm run preview`.

## Estrutura

A referência completa de pastas e convenções vive em
[.claude/skills/estrutura-pastas/SKILL.md](.claude/skills/estrutura-pastas/SKILL.md)
— consulte antes de criar arquivos novos. Resumo:

```
src/
├── components/    # Componentes reutilizáveis (pasta + .tsx + .module.scss)
├── constants/     # Rotas e opções fixas (fonte única)
├── context/       # Providers globais (sessão, tema)
├── hooks/         # Hooks reutilizáveis (useQuery sobre services)
├── lib/           # Cliente Supabase (+ isMockMode), queryKeys
├── mocks/         # Dados de demonstração (modo mock)
├── pages/         # 1 pasta por domínio → 1 pasta por página
├── routes/        # AppRouter (lazy), AppLayout, guards
├── styles/        # Sistema de estilos CENTRALIZADO (tokens, temas, mixins)
├── services/      # Acesso a dados (Supabase) por entidade
├── types/         # Tipos do banco (gerados) e do domínio
└── utils/         # Funções puras
```

## Estilos

Sistema centralizado em `src/styles/` — nenhum componente define cor ou medida
própria; tudo vem de tokens/mixins:

- `_tokens.scss` — paleta da marca (**verde** `#10B981` + **roxo** `#8B5CF6`),
  status, tamanhos de controles, raios, fontes e espaçamentos;
- `_themes.scss` — temas **claro (padrão)** e **escuro** via CSS vars,
  alternáveis no botão "Tema" da sidebar;
- `_mixins.scss` — ponto de entrada único dos `.module.scss` (padrões de campo,
  controle, cartão, foco) + breakpoints.

## Componentes disponíveis

`Button` · `Input` · `Select` · `Textarea` · `Badge` · `Modal` · `Toast (useToast)` ·
`Spinner` · `PageLoader` · `PageHeader` · `EmptyState` · `StatsCard` · `Table` · `Header`

O layout é horizontal: navegação na barra do topo (`Header`), conteúdo
centralizado abaixo (max-width 1280px).
