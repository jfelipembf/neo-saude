import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/global.scss'
import { registrarErro } from './lib/observability'
import { SessionProvider } from './context/SessionProvider'
import { ThemeProvider } from './context/ThemeProvider'
import { ToastProvider } from './components/Toast/Toast'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'
import App from './App.tsx'

// Em dev o PWA NÃO registra service worker (devOptions.enabled: false), mas um
// SW de build antigo pode ter ficado registrado nesta origem — e aí ele serve o
// index.html precacheado (bundles velhos), fazendo a tela ora atualizar, ora
// voltar ao estado antigo. Aqui limpamos o resquício; em produção nada muda.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(reg => reg.unregister()))
    .catch(() => {})
  globalThis.caches?.keys()
    .then(names => names.forEach(name => caches.delete(name)))
    .catch(() => {})
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
  // O ErrorBoundary só pega erro de RENDER. Falha de service (a maioria delas)
  // chega por aqui, e sem este gancho o Monitoramento veria só a fatia menor
  // dos problemas — justamente a que menos acontece.
  queryCache: new QueryCache({
    onError: (error, query) => registrarErro(error, {
      source: 'query',
      // A chave da query diz QUAL leitura falhou; a rota diz só onde o usuário
      // estava. Sem isso, "Failed to fetch" não aponta para nada.
      route: `query:${String(query.queryKey[0] ?? 'desconhecida')}`,
    }),
  }),
  mutationCache: new MutationCache({
    onError: error => registrarErro(error, { source: 'query', route: 'mutation' }),
  }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider>
          <ToastProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
